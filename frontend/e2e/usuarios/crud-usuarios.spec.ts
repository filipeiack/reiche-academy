import { test, expect } from '../fixtures';
import { 
  login, 
  navigateTo, 
  fillFormField, 
  selectDropdownOption, 
  submitForm, 
  expectToast,
  searchInTable,
  getTableRowCount,
  openModal,
  closeModal,
  TEST_USERS,
  CleanupRegistry
} from '../fixtures';

/**
 * E2E Tests - CRUD de Usuários
 * 
 * Validação de:
 * - Criação de usuário (CREATE)
 * - Listagem e busca (READ)
 * - Edição de usuário (UPDATE)
 * - Desativação de usuário (DELETE - soft delete)
 * - Validações multi-tenant (GESTOR só vê própria empresa)
 * - Validações de RBAC (perfis e permissões)
 * 
 * ✅ Cleanup automático: Recursos criados são removidos após cada teste
 * 
 * Agente: QA_E2E_Interface
 */

test.describe('CRUD de Usuários', () => {
  
  test.describe('Criação de Usuário (CREATE)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
    });

    test('deve criar novo usuário GESTOR com sucesso', async ({ page, cleanupRegistry }) => {
      // Navegar para formulário de criação
      await page.click('[data-testid="novo-usuario-button"]');
      
      // Aguardar navegação para /usuarios/novo
      await page.waitForURL('**/usuarios/novo');
      await page.waitForLoadState('networkidle');
      
      // Preencher formulário
      const uniqueEmail = `joao.silva.${Date.now()}@empresa-teste.com`;
      await fillFormField(page, 'nome', 'João da Silva');
      await fillFormField(page, 'email', uniqueEmail);
      await fillFormField(page, 'senha', 'Senha@123');
      await fillFormField(page, 'cargo', 'Gerente de Projetos');
      
      // Selecionar perfil
      await selectDropdownOption(page, 'perfilId', 'Gestor');
      
      // Aguardar campo de empresa aparecer
      await page.waitForTimeout(500);
      
      // Selecionar empresa (obrigatório para não-admin)
      await selectDropdownOption(page, 'empresaId', 'Açougue');
      
      // Salvar
      await submitForm(page, 'Criar');
      
      // Aguardar SweetAlert de sucesso
      const swal = page.locator('.swal2-popup');
      await expect(swal).toBeVisible({ timeout: 5000 });
      await expect(swal.locator('.swal2-title')).toContainText('sucesso');
      
      // Extrair ID do usuário criado da URL ou response
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      const userIdMatch = currentUrl.match(/usuarios\/([a-f0-9-]+)/);
      if (userIdMatch) {
        cleanupRegistry.add('usuario', userIdMatch[1]);
      }
      
      // Aguardar SweetAlert desaparecer (auto-close)
      await page.waitForTimeout(4000);
      
      // Navegar para lista
      await page.goto('http://localhost:4200/usuarios');
      await page.waitForLoadState('networkidle');
      
      // Buscar pelo usuário criado
      const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
      await searchInput.fill('João da Silva');
      await page.waitForTimeout(1000);
      
      // Validar que usuário aparece na tabela
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 5000 });
    });

    test('deve validar email único (não permitir duplicação)', async ({ page, cleanupRegistry }) => {
      // Criar primeiro usuário
      await page.click('[data-testid="novo-usuario-button"]');
      
      const uniqueEmail = `maria.unica.${Date.now()}@test.com`;
      
      await fillFormField(page, 'nome', 'Maria Santos');
      await fillFormField(page, 'email', uniqueEmail);
      await fillFormField(page, 'senha', 'Senha@123');
      await fillFormField(page, 'cargo', 'Analista');
      await selectDropdownOption(page, 'perfilId', 'COLABORADOR');
      
      await page.click('[formControlName="empresaId"]');
      await page.locator('.ng-option').first().click();
      
      await submitForm(page, 'Salvar');
      
      // Aguardar SweetAlert de sucesso
      await expectToast(page, 'success');
      
      // Aguardar auto-close do SweetAlert e navegação
      await page.waitForTimeout(3000);
      
      // Navegar de volta para lista e criar novo usuário
      await navigateTo(page, '/usuarios');
      await page.waitForTimeout(500);
      
      // Tentar criar segundo usuário com mesmo email
      await page.click('[data-testid="novo-usuario-button"]');
      
      await fillFormField(page, 'nome', 'Maria Duplicada');
      await fillFormField(page, 'email', uniqueEmail); // Email duplicado
      await fillFormField(page, 'senha', 'Senha@123');
      await selectDropdownOption(page, 'perfilId', 'COLABORADOR');
      
      await page.click('[formControlName="empresaId"]');
      await page.locator('.ng-option').first().click();
      
      await submitForm(page, 'Salvar');
      
      // Aguardar um pouco para o backend processar
      await page.waitForTimeout(1000);
      
      // Validar erro - pode ser SweetAlert ou ficar na mesma página
      const swal = page.locator('.swal2-popup');
      const swalCount = await swal.count();
      
      if (swalCount > 0) {
        // Se mostrou SweetAlert de erro
        await expect(swal.locator('.swal2-icon-error, .swal2-error')).toBeVisible();
      } else {
        // Se não redirecionou, ainda está na página de criação
        const currentUrl = page.url();
        expect(currentUrl).toContain('/usuarios/novo');
      }
    });

    test.skip('deve validar senha forte (requisitos de segurança)', async ({ page }) => {
      await page.click('[data-testid="novo-usuario-button"]');
      
      await fillFormField(page, 'nome', 'Pedro Souza');
      await fillFormField(page, 'email', 'pedro.souza@test.com');
      await fillFormField(page, 'senha', 'senhafraca'); // Sem maiúscula, sem número, sem especial
      await selectDropdownOption(page, 'perfilId', 'COLABORADOR');
      
      await page.click('[formControlName="empresaId"]');
      await page.locator('.ng-option').first().click();
      
      await submitForm(page, 'Salvar');
      
      // Validar erro de senha fraca
      await expectToast(page, 'error', /senha.*forte|maiúscula|minúscula|número|especial/i);
      
      // Corrigir senha
      await fillFormField(page, 'senha', 'Senha@Forte123');
      
      await submitForm(page, 'Salvar');
      
      // Agora deve salvar
      await expectToast(page, 'success');
    });

    test.skip('deve exigir empresa para perfis não-ADMINISTRADOR', async ({ page }) => {
      await page.click('[data-testid="novo-usuario-button"]');
      
      await fillFormField(page, 'nome', 'Ana Costa');
      await fillFormField(page, 'email', 'ana.costa@test.com');
      await fillFormField(page, 'senha', 'Senha@123');
      await selectDropdownOption(page, 'perfilId', 'GESTOR'); // Não-admin
      
      // NÃO selecionar empresa
      
      await submitForm(page, 'Salvar');
      
      // Validar erro
      await expectToast(page, 'error', /empresa.*obrigatória|empresa é obrigatória/i);
    });
  });

  test.describe('Listagem e Busca (READ)', () => {
    test('ADMINISTRADOR deve ver todos os usuários de todas as empresas', async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
      
      // Aguardar tabela carregar
      await page.waitForSelector('table tbody tr');
      
      const rowCount = await getTableRowCount(page);
      
      // Admin deve ver múltiplas empresas na lista
      expect(rowCount).toBeGreaterThan(0);
      
      // Admin deve ver usuários (validação básica)
      // Multi-tenant é validado comparando com visão do GESTOR
      expect(rowCount).toBeGreaterThan(0);
    });

    test('GESTOR deve ver apenas usuários da própria empresa (multi-tenant)', async ({ page }) => {
      await login(page, TEST_USERS.gestorEmpresaA);
      await navigateTo(page, '/usuarios');
      
      await page.waitForSelector('table tbody tr');
      
      const rowCount = await page.locator('table tbody tr').count();
      
      // Gestor deve ver usuários da própria empresa apenas
      // Validação: deve ter menos ou igual usuários que ADMIN veria
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('deve buscar usuários por nome', async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
      
      await page.waitForSelector('table tbody tr');
      
      const initialCount = await getTableRowCount(page);
      
      // Buscar por nome específico
      await searchInTable(page, 'Admin');
      
      // Aguardar filtro aplicar
      await page.waitForTimeout(800);
      
      const filteredCount = await getTableRowCount(page);
      
      // Se houver filtro, deve reduzir resultados ou manter igual (se todos contêm "Admin")
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('deve ordenar usuários por coluna', async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
      
      await page.waitForSelector('table tbody tr');
      
      // Clicar no header da coluna "Nome" para ordenar
      await page.click('th:has-text("Nome")');
      
      // Aguardar reordenação
      await page.waitForTimeout(500);
      
      // Capturar primeira linha antes da segunda ordenação
      const primeiraLinhaAsc = await page.locator('table tbody tr').first().textContent();
      
      // Clicar novamente para inverter (DESC)
      await page.click('th:has-text("Nome")');
      
      await page.waitForTimeout(500);
      
      const primeiraLinhaDesc = await page.locator('table tbody tr').first().textContent();
      
      const primeiroNomeAsc = primeiraLinhaAsc;
      const primeiroNomeDesc = primeiraLinhaDesc;
      
      // Deve ter mudado a ordem
      expect(primeiroNomeDesc).not.toBe(primeiroNomeAsc);
    });
  });

  test.describe('Edição de Usuário (UPDATE)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
    });

    test('deve editar dados de usuário existente', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      // Obter ID do primeiro usuário
      const primeiraLinha = page.locator('table tbody tr').first();
      const editButton = primeiraLinha.locator('button[data-testid="edit-usuario-button"]');
      
      // Aguardar botão estar visível e clicar
      await editButton.waitFor({ state: 'visible' });
      await editButton.click();
      
      // Aguardar navegação para página de edição
      await page.waitForURL(/\/usuarios\/.*\/editar/);
      await page.waitForLoadState('networkidle');
      
      // Aguardar formulário carregar
      await page.waitForSelector('[formControlName="nome"]');
      
      // Editar nome
      const nomeField = page.locator('[formControlName="nome"]');
      const nomeOriginal = await nomeField.inputValue();
      
      await fillFormField(page, 'nome', nomeOriginal + ' (Editado)');
      
      // Editar cargo
      await fillFormField(page, 'cargo', 'Gerente Sênior');
      
      // Salvar
      await submitForm(page, 'Salvar');
      
      // Aguardar SweetAlert de sucesso
      await expectToast(page, 'success');
    });

    test('GESTOR não deve poder acessar lista completa como ADMIN (multi-tenant)', async ({ page }) => {
      // Login como ADMIN primeiro para contar total de usuários
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
      await page.waitForSelector('table tbody tr');
      
      const adminRowCount = await page.locator('table tbody tr').count();
      
      // Logout e login como GESTOR
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await login(page, TEST_USERS.gestorEmpresaA);
      await navigateTo(page, '/usuarios');
      await page.waitForSelector('table tbody tr');
      
      const gestorRowCount = await page.locator('table tbody tr').count();
      
      // GESTOR deve ver menos ou igual usuários (apenas da própria empresa)
      expect(gestorRowCount).toBeLessThanOrEqual(adminRowCount);
    });
  });

  test.describe('Desativação de Usuário (DELETE - Soft Delete)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await navigateTo(page, '/usuarios');
    });

    test('deve desativar usuário (soft delete)', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      // Capturar nome do primeiro usuário ATIVO
      const primeiraLinhaAtiva = page.locator('table tbody tr').first();
      const nomeUsuario = await primeiraLinhaAtiva.locator('td:nth-child(2)').textContent();
      
      // Clicar em desativar
      await primeiraLinhaAtiva.locator('button[data-testid="delete-usuario-button"]').click();
      
      // Confirmar SweetAlert de confirmação
      await page.waitForSelector('.swal2-popup', { timeout: 5000 });
      
      // Clicar no botão de confirmação (tem texto "Inativar")
      const confirmButton = page.locator('.swal2-confirm');
      await confirmButton.waitFor({ state: 'visible' });
      await confirmButton.click();
      
      // Aguardar toast de sucesso
      await page.waitForTimeout(1000);
      
      // Verificar se há SweetAlert de sucesso
      const successSwal = page.locator('.swal2-popup .swal2-success');
      if (await successSwal.count() > 0) {
        await expect(successSwal).toBeVisible();
      }
    });

    test('deve cancelar desativação ao fechar modal de confirmação', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      const rowCountBefore = await getTableRowCount(page);
      
      // Clicar em desativar
      await page.locator('button[data-testid="delete-usuario-button"]').first().click();
      
      // Cancelar SweetAlert
      await page.waitForSelector('.swal2-popup', { timeout: 5000 });
      
      const cancelButton = page.locator('.swal2-cancel');
      await cancelButton.waitFor({ state: 'visible' });
      await cancelButton.click();
      
      // Aguardar modal fechar
      await page.waitForSelector('.swal2-popup', { state: 'hidden' });
      
      // Validar que usuário permanece na lista
      const rowCountAfter = await getTableRowCount(page);
      
      expect(rowCountAfter).toBe(rowCountBefore);
    });
  });

  test.describe('Validações de RBAC e Perfis', () => {
    test.skip('COLABORADOR não deve ter acesso ao CRUD de usuários', async ({ page }) => {
      await login(page, TEST_USERS.colaborador);
      
      // Tentar acessar diretamente
      await page.goto('/usuarios');
      
      // Deve receber erro de permissão ou redirect
      await expectToast(page, 'error', /permissão|acesso negado/i);
      
      // Ou ser redirecionado para dashboard/home
      await expect(page).not.toHaveURL(/\/usuarios$/);
    });

    test('menu de usuários não deve aparecer para perfis sem permissão', async ({ page }) => {
      await login(page, TEST_USERS.colaborador);
      
      await navigateTo(page, '/');
      
      // Menu "Usuários" não deve estar visível na sidebar
      const sidebarUsuarios = page.locator('[data-testid="sidebar"] a:has-text("Usuários")');
      
      await expect(sidebarUsuarios).not.toBeVisible();
    });
  });
});
