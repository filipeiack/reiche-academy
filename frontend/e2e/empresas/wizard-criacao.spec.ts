import { 
  test, 
  expect,
  login, 
  navigateTo, 
  fillFormField, 
  selectDropdownOption, 
  submitForm, 
  expectToast, 
  expectErrorMessage,
  TEST_USERS
} from '../fixtures';

/**
 * E2E Tests - Wizard de Criação de Empresas (2 Etapas)
 * 
 * Validação de: UI-EMP-001, UI-EMP-002, UI-EMP-003, UI-EMP-004
 * 
 * Fluxo testado:
 * 1. Login como ADMINISTRADOR
 * 2. Navegar para criação de empresa
 * 3. Preencher etapa 1 (dados básicos)
 * 4. Validar salvamento da empresa
 * 5. Preencher etapa 2 (usuários e pilares) - OPCIONAL
 * 6. Concluir wizard
 * 
 * ✅ Cleanup automático: Empresas criadas são removidas após cada teste
 * 
 * Agente: QA_E2E_Interface
 */

test.describe('LEGACY: Wizard de Criação de Empresas @empresas @critical @medium @legacy', () => {
  let createdEmpresaId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await navigateTo(page, '/empresas/nova');
    
    // Aguardar página carregar
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: Remover empresa criada
    if (createdEmpresaId) {
      try {
        await request.delete(`http://localhost:3000/api/empresas/${createdEmpresaId}`);
        console.log('✓ Cleanup: Empresa removida:', createdEmpresaId);
      } catch (e) {
        console.log('⚠️ Falha ao remover empresa:', createdEmpresaId);
      }
      createdEmpresaId = null;
    }
  });

  test('UI-EMP-001: deve criar empresa com sucesso através do wizard de 2 etapas', async ({ page }) => {
    // Capturar ID da empresa via response
    page.on('response', async response => {
      if (response.url().includes('/api/empresas') && response.status() === 201) {
        try {
          const body = await response.json();
          createdEmpresaId = body.id;
          console.log('✓ Empresa criada com ID:', createdEmpresaId);
        } catch (e) {
          // Response não é JSON
        }
      }
    });
    
    // Capturar erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ ERRO no console:', msg.text());
      }
    });
    
    // Validar que está na etapa 1
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
    
    // === ETAPA 1: Dados Básicos ===
    
    // Gerar CNPJ único com timestamp + número aleatório
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueCnpj = `${Date.now().toString().slice(-5)}${randomSuffix}000190`;
    console.log('✓ CNPJ gerado:', uniqueCnpj);
    
    // Preencher nome da empresa
    await fillFormField(page, 'nome', 'Empresa Teste E2E Ltda');
    
    // Preencher CNPJ (com máscara automática - UI-EMP-002)
    await fillFormField(page, 'cnpj', uniqueCnpj);
    
    // Aguardar máscara aplicar
    await page.waitForTimeout(300);
    
    // Validar máscara aplicada (formato: XX.XXX.XXX/XXXX-XX)
    const cnpjField = page.locator('[formControlName="cnpj"]');
    const maskedCnpj = await cnpjField.inputValue();
    expect(maskedCnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    
    // Preencher tipo de negócio (opcional)
    await fillFormField(page, 'tipoNegocio', 'Consultoria');
    
    // Preencher cidade
    await fillFormField(page, 'cidade', 'São Paulo');
    
    // Selecionar estado
    await selectDropdownOption(page, 'estado', 'SP');
    
    // Preencher loginUrl (opcional) - deve ser único
    const uniqueLoginUrl = `empresa-teste-${Date.now()}`;
    await fillFormField(page, 'loginUrl', uniqueLoginUrl);
    
    // Debug: verificar se formulário está válido
    const isFormValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form?.checkValidity();
    });
    console.log('✓ Formulário válido:', isFormValid);
    
    // Capturar erros de rede
    page.on('response', async response => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('/empresas')) {
          console.log(`❌ Erro HTTP ${response.status()}: ${url}`);
          try {
            const body = await response.json();
            console.log('   Body:', JSON.stringify(body));
          } catch {}
        }
      }
    });
    
    // Salvar etapa 1
    await submitForm(page, 'Próximo');
    
    // Aguardar processamento e transição para etapa 2
    // (SweetAlert pode ou não aparecer dependendo do timing)
    await page.waitForTimeout(3000);
    
    // Validar que avançou para etapa 2
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible({ timeout: 10000 });
    
    // === ETAPA 2: Usuários e Pilares (OPCIONAL) ===
    
    // Concluir wizard sem associar usuários/pilares (comportamento válido)
    await page.click('button:has-text("Concluir Cadastro")');
    
    // Aguardar SweetAlert de conclusão
    const swalFinal = page.locator('.swal2-popup');
    await swalFinal.waitFor({ state: 'visible', timeout: 5000 });
    
    // Validar mensagem específica de sucesso
    const swalTitle = await swalFinal.locator('.swal2-title').first().textContent();
    expect(swalTitle).toMatch(/sucesso|concluído|criada/i);
    
    // Aguardar auto-close e redirecionamento
    await swalFinal.waitFor({ state: 'hidden', timeout: 5000 });
    
    // Validar redirecionamento para listagem
    await expect(page).toHaveURL(/\/empresas$/);
    
    // Aguardar tabela carregar
    await page.waitForLoadState('networkidle');
    
    // Validar que está na página de listagem (breadcrumb específico)
    await expect(page.locator('.breadcrumb-item.active:has-text("Empresas")')).toBeVisible();
  });

  test('UI-EMP-002: deve aplicar máscara de CNPJ automaticamente durante digitação', async ({ page }) => {
    const cnpjField = page.locator('[formControlName="cnpj"]');
    
    // Digitar CNPJ sem formatação
    await cnpjField.clear();
    await cnpjField.fill('11222333000144');
    
    // Trigger input event para aplicar máscara
    await cnpjField.dispatchEvent('input');
    
    // Aguardar máscara aplicar
    await page.waitForTimeout(300);
    
    // Validar máscara aplicada: 11.222.333/0001-44
    await expect(cnpjField).toHaveValue('11.222.333/0001-44');
  });

  test('UI-EMP-003: deve exigir CNPJ obrigatório', async ({ page }) => {
    // Preencher apenas nome (deixar CNPJ vazio)
    await fillFormField(page, 'nome', 'Empresa Sem CNPJ');
    
    // Validar que botão está desabilitado
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    // Validar que ainda está na etapa 1
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
  });

  test('UI-EMP-004: deve validar loginUrl com mínimo 3 caracteres', async ({ page }) => {
    await fillFormField(page, 'nome', 'Empresa Teste');
    await fillFormField(page, 'cnpj', '12345678000190');
    await fillFormField(page, 'cidade', 'São Paulo');
    
    // Selecionar estado
    await selectDropdownOption(page, 'estado', 'SP');
    
    await fillFormField(page, 'loginUrl', 'ab'); // Apenas 2 caracteres
    
    // Verificar se formulário está inválido
    const loginUrlField = page.locator('[formControlName="loginUrl"]');
    await loginUrlField.blur(); // Trigger validation
    
    // Botão deve estar desabilitado
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.getAttribute('disabled');
    expect(isDisabled).not.toBeNull();
  });

  test('deve validar CNPJ duplicado (backend validation)', async ({ page }) => {
    const randomSuffix1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueCnpj = `${Date.now().toString().slice(-5)}${randomSuffix1}000144`;
    
    // Criar primeira empresa
    await fillFormField(page, 'nome', 'Primeira Empresa');
    await fillFormField(page, 'cnpj', uniqueCnpj);
    await fillFormField(page, 'cidade', 'São Paulo');
    await selectDropdownOption(page, 'estado', 'SP');
    
    await submitForm(page, 'Próximo');
    
    // Aguardar e concluir wizard
    await page.waitForTimeout(2500);
    
    // Verificar se chegou na etapa 2 (empresa criada com sucesso)
    const step2Visible = await page.locator('[data-testid="wizard-step-2"]').isVisible().catch(() => false);
    
    if (step2Visible) {
      await page.click('button:has-text("Concluir Cadastro")');
      await page.waitForTimeout(2000);
    }
    
    // Tentar criar segunda empresa com mesmo CNPJ
    await navigateTo(page, '/empresas/nova');
    await page.waitForTimeout(500);
    
    await fillFormField(page, 'nome', 'Segunda Empresa');
    await fillFormField(page, 'cnpj', uniqueCnpj); // CNPJ duplicado
    await fillFormField(page, 'cidade', 'Rio de Janeiro');
    await selectDropdownOption(page, 'estado', 'RJ');
    
    await submitForm(page, 'Próximo');
    
    // Aguardar resposta do backend
    await page.waitForTimeout(1000);
    
    // Validar erro do backend (SweetAlert)
    const swal = page.locator('.swal2-popup');
    const swalCount = await swal.count();
    
    if (swalCount > 0) {
      const errorIcon = swal.locator('.swal2-icon-error, .swal2-error');
      await expect(errorIcon).toBeVisible({ timeout: 3000 });
    } else {
      // Se não mostrou erro, ainda está na etapa 1
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
    }
  });

  test('deve validar loginUrl duplicado (backend validation)', async ({ page }) => {
    const uniqueLoginUrl = `empresa-${Date.now()}`;
    
    // Criar primeira empresa com loginUrl
    await fillFormField(page, 'nome', 'Empresa Original');
    const randomSuffix2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    await fillFormField(page, 'cnpj', `${Date.now().toString().slice(-5)}${randomSuffix2}000166`);
    await fillFormField(page, 'cidade', 'Curitiba');
    await selectDropdownOption(page, 'estado', 'PR');
    await fillFormField(page, 'loginUrl', uniqueLoginUrl);
    
    await submitForm(page, 'Próximo');
    
    // Aguardar criação e capturar ID para cleanup
    await page.waitForTimeout(2000);
    const empresaResponse = await page.waitForResponse(resp => 
      resp.url().includes('/empresas') && resp.request().method() === 'POST'
    );
    const empresaData = await empresaResponse.json();
    const empresaId = empresaData.id;
    
    await page.click('button:has-text("Concluir Cadastro")');
    await page.waitForTimeout(2000);
    
    // Tentar criar segunda empresa com mesmo loginUrl
    await navigateTo(page, '/empresas/nova');
    await page.waitForTimeout(500);
    
    await fillFormField(page, 'nome', 'Empresa Duplicada');
    const randomSuffix3 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    await fillFormField(page, 'cnpj', `${Date.now().toString().slice(-5)}${randomSuffix3}000155`);
    await fillFormField(page, 'cidade', 'Porto Alegre');
    await selectDropdownOption(page, 'estado', 'RS');
    await fillFormField(page, 'loginUrl', uniqueLoginUrl);
    
    await submitForm(page, 'Próximo');
    
    // Aguardar resposta do backend (deve retornar erro 409 Conflict)
    const errorResponse = await page.waitForResponse(
      resp => resp.url().includes('/empresas') && resp.request().method() === 'POST',
      { timeout: 5000 }
    ).catch(() => null);
    
    // Validar que recebeu erro HTTP 409 (Conflict)
    if (errorResponse) {
      expect(errorResponse.status()).toBe(409);
    }
    
    // Aguardar um pouco para processar erro
    await page.waitForTimeout(1500);
    
    // Validar que permaneceu na etapa 1 (não avançou para etapa 2)
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
    
    // E a etapa 2 NÃO deve estar visível (não está no modo edição)
    await expect(page.locator('[data-testid="wizard-step-2"]')).not.toBeVisible();
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/nova');
    
    // Cleanup da primeira empresa criada
    await page.request.delete(`http://localhost:3000/api/empresas/${empresaId}`);
  });

  test('deve permitir criar empresa sem loginUrl (campo opcional)', async ({ page }) => {
    const randomSuffix4 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueCnpj = `${Date.now().toString().slice(-5)}${randomSuffix4}000144`;
    
    await fillFormField(page, 'nome', 'Empresa Sem Login Customizado');
    await fillFormField(page, 'cnpj', uniqueCnpj);
    await fillFormField(page, 'cidade', 'Brasília');
    await selectDropdownOption(page, 'estado', 'DF');
    
    // NÃO preencher loginUrl (deixar vazio)
    
    await submitForm(page, 'Próximo');
    
    // Aguardar resposta de criação bem-sucedida
    const createResponse = await page.waitForResponse(
      resp => resp.url().includes('/empresas') && resp.request().method() === 'POST' && resp.status() === 201,
      { timeout: 5000 }
    );
    
    const empresaData = await createResponse.json();
    createdEmpresaId = empresaData.id;
    
    // Aguardar toast de sucesso
    const successToast = page.locator('.swal2-toast:has-text("sucesso")');
    await expect(successToast).toBeVisible({ timeout: 3000 });
    
    // Aguardar transição para etapa 2 (wizardStep = 2)
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible({ timeout: 5000 });
    
    // OBS: No modo edição (isEditMode=true), ambas as etapas ficam visíveis
    // O importante é que a etapa 2 esteja visível
  });

  test('deve permitir cancelar criação no wizard', async ({ page }) => {
    // Preencher parcialmente
    await fillFormField(page, 'nome', 'Empresa Cancelada');
    
    // Clicar em cancelar (button com texto traduzido)
    const cancelButton = page.locator('button:has-text("Cancelar")');
    await cancelButton.click();
    
    // Aguardar redirecionamento
    await page.waitForTimeout(1000);
    
    // Deve redirecionar para listagem
    await expect(page).toHaveURL(/\/empresas$/);
  });
});
