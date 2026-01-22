import { test, expect, TEST_USERS, type TestUser } from '../fixtures';
import type { Page } from '@playwright/test';

/**
 * Testes E2E - Cockpit de Pilares
 * 
 * Baseado nas regras de negócio documentadas em:
 * - /docs/business-rules/cockpit-multi-tenant-seguranca.md
 * - /docs/business-rules/cockpit-gestao-indicadores.md
 * - /docs/business-rules/cockpit-valores-mensais.md
 * - /docs/business-rules/cockpit-processos-prioritarios.md
 * - /docs/business-rules/cockpit-ux-excel-like.md
 * 
 * QA Agent: QA E2E Interface
 * Handoff: /docs/handoffs/cockpit-pilares/pattern-v3.md (CONFORME)
 */

// =================================================================
// HELPERS
// =================================================================

async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.fill('input[formControlName="email"]', user.email);
  await page.fill('input[formControlName="senha"]', user.senha);
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento após login (aceita qualquer página autenticada)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  
  // Aguardar carregamento completo
  await page.waitForLoadState('networkidle', { timeout: 5000 });
}

async function navegarParaPilares(page: Page) {
  // Navegar diretamente pela URL (mais confiável que clicar em menu)
  await page.goto('/pilares-empresa');
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

async function criarPilarSeNecessario(page: Page): Promise<string> {
  await navegarParaPilares(page);
  
  // Verificar se já existe pilar
  const existingPilar = await page.locator('table tbody tr').first();
  
  if (await existingPilar.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Pegar nome do primeiro pilar
    const pilarNome = await existingPilar.locator('td').nth(1).textContent();
    return pilarNome || 'Marketing';
  }
  
  // Criar novo pilar
  await page.click('button:has-text("Novo Pilar")');
  await page.fill('input[formControlName="nome"]', 'Marketing E2E');
  await page.selectOption('select[formControlName="pilarTemplateId"]', { index: 1 });
  await page.click('button:has-text("Salvar")');
  
  // Aguardar toast de sucesso
  await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  
  return 'Marketing E2E';
}

async function navegarParaCockpitDoPilar(page: Page, pilarNome: string) {
  await navegarParaPilares(page);
  
  // Localizar linha do pilar e clicar em "Cockpit"
  const pilarRow = page.locator(`table tbody tr:has-text("${pilarNome}")`);
  await pilarRow.locator('button:has-text("Cockpit")').click();
  
  // Aguardar navegação para cockpit
  await page.waitForURL('**/cockpit-pilares/**', { timeout: 5000 });
}

// =================================================================
// TESTES: Criação de Cockpit + Auto-vinculação de Rotinas
// Fonte: /docs/business-rules/cockpit-processos-prioritarios.md
// =================================================================

test.describe('[COCKPIT] Criação com Auto-vinculação de Rotinas', () => {
  test('deve criar cockpit e auto-vincular rotinas ativas do pilar', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    const pilarNome = await criarPilarSeNecessario(page);
    
    // Navegar para cockpit
    await navegarParaCockpitDoPilar(page, pilarNome);
    
    // Se cockpit não existe, deve mostrar botão de criar
    const criarButton = page.locator('button:has-text("Criar Cockpit")');
    
    if (await criarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await criarButton.click();
      
      // Aguardar toast de sucesso
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    }
    
    // Verificar que Matriz de Processos existe e tem rotinas
    await page.click('text=Matriz de Processos');
    
    // Deve ter pelo menos uma linha na tabela de processos (rotinas auto-vinculadas)
    const processosTable = page.locator('[data-testid="processos-table"], table');
    await expect(processosTable.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
    
    // Verificar que processos têm ordem sequencial
    const firstOrdem = await processosTable.locator('tbody tr').first().locator('td').first().textContent();
    expect(firstOrdem).toMatch(/1|Ordem/);
  });
});

// =================================================================
// TESTES: Gestão de Indicadores (CRUD + Multi-tenant)
// Fonte: /docs/business-rules/cockpit-gestao-indicadores.md
// =================================================================

test.describe('[INDICADORES] CRUD com Validações Multi-tenant', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    const pilarNome = await criarPilarSeNecessario(page);
    await navegarParaCockpitDoPilar(page, pilarNome);
    
    // Navegar para Gestão de Indicadores
    await page.click('text=Gestão de Indicadores');
    await page.waitForSelector('[data-testid="indicadores-table"], table', { timeout: 5000 });
  });
  
  test('deve criar indicador com 13 meses auto-gerados', async ({ page }) => {
    // Clicar em "Adicionar Indicador"
    await page.click('button:has-text("Adicionar Indicador")');
    
    // Aguardar nova linha aparecer
    const novaLinha = page.locator('table tbody tr').last();
    await expect(novaLinha).toBeVisible();
    
    // Preencher nome do indicador
    const nomeInput = novaLinha.locator('input[id^="nome-"]');
    await nomeInput.fill('Faturamento Total E2E');
    
    // Selecionar tipo de medida
    const tipoSelect = novaLinha.locator('select[id^="tipoMedida-"]');
    await tipoSelect.selectOption('REAL');
    
    // Aguardar auto-save (debounce de 1 segundo)
    await page.waitForTimeout(1500);
    
    // Verificar toast de sucesso
    await expect(page.locator('.toast-success, .save-indicator')).toBeVisible({ timeout: 5000 });
    
    // Navegar para Edição de Valores Mensais para verificar 13 meses
    await page.click('text=Edição de Valores Mensais');
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Localizar linha do indicador criado
    const indicadorRow = page.locator('table tbody tr:has-text("Faturamento Total E2E")');
    await expect(indicadorRow).toBeVisible();
    
    // Verificar que tem colunas para 12 meses + 1 anual (pelo menos)
    const cells = indicadorRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(14); // Nome + 12 meses + anual
  });
  
  test('deve validar nome único por cockpit', async ({ page }) => {
    // Adicionar primeiro indicador
    await page.click('button:has-text("Adicionar Indicador")');
    
    const primeiraLinha = page.locator('table tbody tr').last();
    await primeiraLinha.locator('input[id^="nome-"]').fill('Receita Mensal');
    await page.waitForTimeout(1500); // Auto-save
    
    // Adicionar segundo indicador com MESMO nome
    await page.click('button:has-text("Adicionar Indicador")');
    
    const segundaLinha = page.locator('table tbody tr').last();
    await segundaLinha.locator('input[id^="nome-"]').fill('Receita Mensal');
    await page.waitForTimeout(1500);
    
    // Deve exibir erro de nome duplicado
    await expect(page.locator('.toast-error, .error-message:has-text("já existe")')).toBeVisible({ timeout: 5000 });
  });
  
  test('deve permitir soft delete de indicador', async ({ page }) => {
    // Criar indicador
    await page.click('button:has-text("Adicionar Indicador")');
    
    const linha = page.locator('table tbody tr').last();
    await linha.locator('input[id^="nome-"]').fill('Indicador Temporário');
    await page.waitForTimeout(1500);
    
    // Localizar botão de excluir
    const deleteButton = linha.locator('button[aria-label="Excluir"], button:has-text("Excluir")');
    await deleteButton.click();
    
    // Confirmar exclusão (se houver modal)
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sim")');
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }
    
    // Aguardar toast de sucesso
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    
    // Indicador não deve mais aparecer na lista
    await expect(page.locator('table tbody tr:has-text("Indicador Temporário")')).not.toBeVisible({ timeout: 2000 });
  });
});

// =================================================================
// TESTES: Edição de Valores Mensais (Excel-like UX)
// Fonte: /docs/business-rules/cockpit-valores-mensais.md
// Fonte: /docs/business-rules/cockpit-ux-excel-like.md
// =================================================================

test.describe('[VALORES MENSAIS] Edição Excel-like com Auto-save', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    const pilarNome = await criarPilarSeNecessario(page);
    await navegarParaCockpitDoPilar(page, pilarNome);
    
    // Criar indicador se necessário
    await page.click('text=Gestão de Indicadores');
    
    const hasIndicador = await page.locator('table tbody tr').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!hasIndicador) {
      await page.click('button:has-text("Adicionar Indicador")');
      const linha = page.locator('table tbody tr').last();
      await linha.locator('input[id^="nome-"]').fill('KPI Vendas');
      await linha.locator('select[id^="tipoMedida-"]').selectOption('REAL');
      await page.waitForTimeout(1500);
    }
    
    // Navegar para Edição de Valores Mensais
    await page.click('text=Edição de Valores Mensais');
    await page.waitForSelector('table', { timeout: 5000 });
  });
  
  test('deve permitir edição inline com auto-save (debounce)', async ({ page }) => {
    // Localizar primeira linha de indicador
    const primeiraLinha = page.locator('table tbody tr').first();
    
    // Localizar input de meta do primeiro mês (geralmente coluna 2)
    const metaInput = primeiraLinha.locator('input[type="number"]').first();
    
    await metaInput.fill('10000');
    
    // Aguardar debounce (1 segundo)
    await page.waitForTimeout(1500);
    
    // Verificar feedback de salvamento
    await expect(page.locator('.save-indicator, .saving-icon, .toast-success')).toBeVisible({ timeout: 5000 });
    
    // Recarregar página e verificar que valor foi salvo
    await page.reload();
    await page.waitForSelector('table', { timeout: 5000 });
    
    const metaInputReload = page.locator('table tbody tr').first().locator('input[type="number"]').first();
    await expect(metaInputReload).toHaveValue('10000');
  });
  
  test('deve replicar meta para meses seguintes', async ({ page }) => {
    const primeiraLinha = page.locator('table tbody tr').first();
    
    // Preencher meta no primeiro mês
    const primeiroMesMetaInput = primeiraLinha.locator('input[type="number"]').first();
    await primeiroMesMetaInput.fill('5000');
    
    // Aguardar processamento de replicação
    await page.waitForTimeout(500);
    
    // Verificar que meses seguintes também têm meta 5000
    const inputsMeta = primeiraLinha.locator('input[type="number"]');
    const count = await inputsMeta.count();
    
    // Pelo menos 2 meses devem ter o mesmo valor (replicação)
    let metasReplicadas = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const valor = await inputsMeta.nth(i).inputValue();
      if (valor === '5000') {
        metasReplicadas++;
      }
    }
    
    expect(metasReplicadas).toBeGreaterThanOrEqual(2);
  });
  
  test('deve navegar com Tab entre células (Excel-like)', async ({ page }) => {
    const primeiraLinha = page.locator('table tbody tr').first();
    
    // Focar primeiro input
    const primeiroInput = primeiraLinha.locator('input[type="number"]').first();
    await primeiroInput.focus();
    
    // Pressionar Tab
    await page.keyboard.press('Tab');
    
    // Aguardar foco mudar
    await page.waitForTimeout(200);
    
    // Verificar que outro input está focado
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('type', 'number');
  });
});

// =================================================================
// TESTES: Processos Prioritários (Status Updates)
// Fonte: /docs/business-rules/cockpit-processos-prioritarios.md
// =================================================================

test.describe('[PROCESSOS] Atualização de Status Mapeamento/Treinamento', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    const pilarNome = await criarPilarSeNecessario(page);
    await navegarParaCockpitDoPilar(page, pilarNome);
    
    // Navegar para Matriz de Processos
    await page.click('text=Matriz de Processos');
    await page.waitForSelector('[data-testid="processos-table"], table', { timeout: 5000 });
  });
  
  test('deve atualizar status de mapeamento via select', async ({ page }) => {
    // Localizar primeiro processo
    const primeiraLinha = page.locator('table tbody tr').first();
    
    // Localizar select de status mapeamento
    const statusMapeamentoSelect = primeiraLinha.locator('ng-select[formcontrolname="statusMapeamento"], select');
    
    if (await statusMapeamentoSelect.count() > 0) {
      await statusMapeamentoSelect.first().click();
      
      // Selecionar opção "Concluído"
      await page.click('text=CONCLUÍDO, text=Concluído');
      
      // Aguardar auto-save
      await page.waitForTimeout(1500);
      
      // Verificar feedback
      await expect(page.locator('.toast-success, .save-indicator')).toBeVisible({ timeout: 5000 });
    }
  });
  
  test('deve permitir valores null (clearable)', async ({ page }) => {
    const primeiraLinha = page.locator('table tbody tr').first();
    
    // Primeiro, definir um status
    const statusSelect = primeiraLinha.locator('ng-select[formcontrolname="statusMapeamento"], select').first();
    
    if (await statusSelect.count() > 0) {
      await statusSelect.click();
      await page.click('text=CONCLUÍDO, text=Concluído');
      await page.waitForTimeout(1500);
      
      // Agora limpar o valor
      const clearButton = statusSelect.locator('[aria-label="Clear"], .ng-clear-wrapper');
      
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(1500);
        
        // Verificar que foi salvo como null (sem erro)
        await expect(page.locator('.toast-error')).not.toBeVisible({ timeout: 1000 });
      }
    }
  });
});

// =================================================================
// TESTES: Validações Multi-tenant por Perfil
// Fonte: /docs/business-rules/cockpit-multi-tenant-seguranca.md
// =================================================================

test.describe('[MULTI-TENANT] Validações de Acesso por Perfil', () => {
  test('GESTOR não deve acessar cockpit de outra empresa', async ({ page }) => {
    // Login como GESTOR Empresa A
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar acessar diretamente cockpit de empresa B (se existir)
    // URL fictícia para teste - backend deve bloquear
    await page.goto('/cockpit-pilares/cockpit-empresa-b-id');
    
    // Deve mostrar erro de acesso negado ou redirecionar
    const errorVisible = await page.locator('.toast-error, .error-message').or(page.getByText(/não autorizado|acesso negado/i)).isVisible({ timeout: 5000 }).catch(() => false);
    
    // Se não houver erro visível, pelo menos não deve carregar a página de cockpit
    if (!errorVisible) {
      // Verificar que NÃO está na página de cockpit
      await expect(page).not.toHaveURL(/cockpit-pilares/);
    }
  });
  
  test('ADMINISTRADOR deve ter acesso global', async ({ page }) => {
    // Login como ADMINISTRADOR
    await login(page, TEST_USERS.admin);
    
    // Admin deve conseguir acessar gestão de pilares de qualquer empresa
    await navegarParaPilares(page);
    
    // Deve visualizar lista de pilares sem erro
    await expect(page.locator('table, .data-table')).toBeVisible({ timeout: 5000 });
  });
});

// =================================================================
// TESTES: Performance e Usabilidade (Opcional)
// =================================================================

test.describe('[PERFORMANCE] Carregamento e Responsividade', () => {
  test('deve carregar Matriz de Indicadores em menos de 3 segundos', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    const pilarNome = await criarPilarSeNecessario(page);
    await navegarParaCockpitDoPilar(page, pilarNome);
    
    const startTime = Date.now();
    
    await page.click('text=Matriz de Indicadores');
    await page.waitForSelector('table, .loading-complete', { timeout: 5000 });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
