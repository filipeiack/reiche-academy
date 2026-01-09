import { test, expect } from '../fixtures';
import { 
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
 * Agente: E2E_Agent
 */

test.describe('Wizard de Criação de Empresas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/empresas/novo');
  });

  test('UI-EMP-001: deve criar empresa com sucesso através do wizard de 2 etapas', async ({ page }) => {
    // Validar que está na etapa 1
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
    
    // === ETAPA 1: Dados Básicos ===
    
    // Preencher nome da empresa
    await fillFormField(page, 'nome', 'Empresa Teste E2E Ltda');
    
    // Preencher CNPJ (com máscara automática - UI-EMP-002)
    const cnpjField = page.locator('[formControlName="cnpj"]');
    await cnpjField.clear();
    await cnpjField.type('12345678000190', { delay: 50 }); // Digita com delay para máscara aplicar
    
    // Validar máscara aplicada
    await expect(cnpjField).toHaveValue('12.345.678/0001-90');
    
    // Preencher tipo de negócio (opcional)
    await fillFormField(page, 'tipoNegocio', 'Consultoria');
    
    // Preencher cidade
    await fillFormField(page, 'cidade', 'São Paulo');
    
    // Selecionar estado
    await selectDropdownOption(page, 'estado', 'SP');
    
    // Preencher loginUrl (opcional)
    await fillFormField(page, 'loginUrl', 'empresa-teste-e2e');
    
    // Salvar etapa 1
    await submitForm(page, 'Salvar e Continuar');
    
    // Validar toast de sucesso
    await expectToast(page, 'success', 'Empresa criada com sucesso');
    
    // Validar que avançou para etapa 2
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible({ timeout: 10000 });
    
    // === ETAPA 2: Usuários e Pilares (OPCIONAL) ===
    
    // Concluir wizard sem associar usuários/pilares (comportamento válido)
    await page.click('button:has-text("Concluir")');
    
    // Validar redirecionamento para listagem
    await expect(page).toHaveURL(/\/empresas$/);
    
    // Validar que empresa aparece na lista
    await expect(page.locator('text=Empresa Teste E2E Ltda')).toBeVisible();
  });

  test('UI-EMP-002: deve aplicar máscara de CNPJ automaticamente durante digitação', async ({ page }) => {
    const cnpjField = page.locator('[formControlName="cnpj"]');
    
    // Digitar CNPJ sem formatação
    await cnpjField.clear();
    await cnpjField.type('11222333000144', { delay: 50 });
    
    // Validar máscara aplicada: 11.222.333/0001-44
    await expect(cnpjField).toHaveValue('11.222.333/0001-44');
    
    // Testar formatação incremental (primeiros 2 dígitos)
    await cnpjField.clear();
    await cnpjField.type('12', { delay: 50 });
    await expect(cnpjField).toHaveValue('12');
    
    // Adicionar mais dígitos
    await cnpjField.type('345', { delay: 50 });
    await expect(cnpjField).toHaveValue('12.345');
    
    // Continuar até formato completo
    await cnpjField.type('678000190', { delay: 50 });
    await expect(cnpjField).toHaveValue('12.345.678/0001-90');
  });

  test('UI-EMP-003: deve exigir CNPJ obrigatório', async ({ page }) => {
    // Preencher apenas nome (deixar CNPJ vazio)
    await fillFormField(page, 'nome', 'Empresa Sem CNPJ');
    
    // Tentar salvar
    await submitForm(page, 'Salvar e Continuar');
    
    // Validar mensagem de erro do formulário
    await expectErrorMessage(page, 'cnpj', 'cnpj é obrigatório');
    
    // Validar que NÃO salvou (ainda está na etapa 1)
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
  });

  test('UI-EMP-004: deve validar loginUrl com mínimo 3 caracteres e sem espaços', async ({ page }) => {
    // Caso 1: loginUrl com menos de 3 caracteres
    await fillFormField(page, 'nome', 'Empresa Teste');
    await fillFormField(page, 'cnpj', '12345678000190');
    await fillFormField(page, 'cidade', 'São Paulo');
    await selectDropdownOption(page, 'estado', 'SP');
    await fillFormField(page, 'loginUrl', 'ab'); // Apenas 2 caracteres
    
    await submitForm(page, 'Salvar e Continuar');
    
    await expectErrorMessage(page, 'loginUrl', 'loginUrl deve ter no mínimo 3 caracteres');
    
    // Caso 2: loginUrl com espaços
    await fillFormField(page, 'loginUrl', 'empresa teste'); // Com espaço
    
    await submitForm(page, 'Salvar e Continuar');
    
    await expectErrorMessage(page, 'loginUrl', 'loginUrl não pode conter espaços');
    
    // Caso 3: loginUrl válido
    await fillFormField(page, 'loginUrl', 'empresa-teste-valido');
    
    await submitForm(page, 'Salvar e Continuar');
    
    // Deve salvar com sucesso
    await expectToast(page, 'success');
  });

  test('deve validar CNPJ duplicado (backend validation)', async ({ page }) => {
    // Criar primeira empresa
    await fillFormField(page, 'nome', 'Primeira Empresa');
    await fillFormField(page, 'cnpj', '11222333000144');
    await fillFormField(page, 'cidade', 'São Paulo');
    await selectDropdownOption(page, 'estado', 'SP');
    
    await submitForm(page, 'Salvar e Continuar');
    
    await expectToast(page, 'success');
    
    // Concluir wizard
    await page.click('button:has-text("Concluir")');
    
    // Tentar criar segunda empresa com mesmo CNPJ
    await navigateTo(page, '/empresas/novo');
    
    await fillFormField(page, 'nome', 'Segunda Empresa');
    await fillFormField(page, 'cnpj', '11222333000144'); // CNPJ duplicado
    await fillFormField(page, 'cidade', 'Rio de Janeiro');
    await selectDropdownOption(page, 'estado', 'RJ');
    
    await submitForm(page, 'Salvar e Continuar');
    
    // Validar erro do backend
    await expectToast(page, 'error', 'CNPJ já cadastrado');
    
    // Ainda deve estar na etapa 1
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
  });

  test('deve validar loginUrl duplicado (backend validation)', async ({ page }) => {
    // Criar primeira empresa com loginUrl
    await fillFormField(page, 'nome', 'Empresa Original');
    await fillFormField(page, 'cnpj', '99888777000166');
    await fillFormField(page, 'cidade', 'Curitiba');
    await selectDropdownOption(page, 'estado', 'PR');
    await fillFormField(page, 'loginUrl', 'empresa-unica');
    
    await submitForm(page, 'Salvar e Continuar');
    
    await expectToast(page, 'success');
    
    await page.click('button:has-text("Concluir")');
    
    // Tentar criar segunda empresa com mesmo loginUrl
    await navigateTo(page, '/empresas/novo');
    
    await fillFormField(page, 'nome', 'Empresa Duplicada');
    await fillFormField(page, 'cnpj', '88777666000155');
    await fillFormField(page, 'cidade', 'Porto Alegre');
    await selectDropdownOption(page, 'estado', 'RS');
    await fillFormField(page, 'loginUrl', 'empresa-unica'); // loginUrl duplicado
    
    await submitForm(page, 'Salvar e Continuar');
    
    // Validar erro do backend
    await expectToast(page, 'error', 'loginUrl já está em uso');
    
    await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
  });

  test('deve permitir criar empresa sem loginUrl (campo opcional)', async ({ page }) => {
    await fillFormField(page, 'nome', 'Empresa Sem Login Customizado');
    await fillFormField(page, 'cnpj', '77666555000144');
    await fillFormField(page, 'cidade', 'Brasília');
    await selectDropdownOption(page, 'estado', 'DF');
    
    // NÃO preencher loginUrl (deixar vazio)
    
    await submitForm(page, 'Salvar e Continuar');
    
    // Deve salvar com sucesso mesmo sem loginUrl
    await expectToast(page, 'success');
    
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();
  });

  test('deve permitir cancelar criação no wizard', async ({ page }) => {
    // Preencher parcialmente
    await fillFormField(page, 'nome', 'Empresa Cancelada');
    
    // Clicar em cancelar
    await page.click('button:has-text("Cancelar")');
    
    // Deve redirecionar para listagem
    await expect(page).toHaveURL(/\/empresas$/);
    
    // Empresa não deve aparecer na lista
    await expect(page.locator('text=Empresa Cancelada')).not.toBeVisible();
  });

  test('deve manter dados preenchidos ao voltar da etapa 2 para etapa 1 (navegação wizard)', async ({ page }) => {
    // Preencher etapa 1
    await fillFormField(page, 'nome', 'Empresa Navegação');
    await fillFormField(page, 'cnpj', '66555444000133');
    await fillFormField(page, 'cidade', 'Recife');
    await selectDropdownOption(page, 'estado', 'PE');
    
    await submitForm(page, 'Salvar e Continuar');
    
    await expectToast(page, 'success');
    
    // Agora na etapa 2
    await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();
    
    // Voltar para etapa 1
    await page.click('button:has-text("Voltar")');
    
    // Validar que dados foram mantidos
    await expect(page.locator('[formControlName="nome"]')).toHaveValue('Empresa Navegação');
    await expect(page.locator('[formControlName="cnpj"]')).toHaveValue('66.555.444/0001-33');
    await expect(page.locator('[formControlName="cidade"]')).toHaveValue('Recife');
    await expect(page.locator('[formControlName="estado"]')).toHaveValue('PE');
  });
});
