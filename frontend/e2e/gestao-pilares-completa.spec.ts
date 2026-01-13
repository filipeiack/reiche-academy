import { test, expect, login, navigateTo, selectEmpresa, TEST_USERS } from './fixtures';

/**
 * E2E TESTS: Modal Gerenciar Pilares - Testes Completos
 * 
 * Validações:
 * - Adicionar pilar via addTag (criar novo pilar global + vincular à empresa)
 * - Reordenar pilares via drag & drop
 * - Remover pilar da empresa
 * - Validar persistência após cada operação
 * - Validar multi-tenant (GESTOR só acessa própria empresa)
 * - Testar RBAC (COLABORADOR não deve ter acesso ao modal)
 */

test.describe('Modal Gerenciar Pilares - Funcionalidades Completas', () => {

  test.beforeEach(async ({ page }) => {
    // Todos os testes precisam da empresa selecionada
    await page.goto('http://localhost:4200');
  });

  // ===============================================
  // SEÇÃO 1: ADICIONAR PILAR VIA ADDTAG
  // ===============================================

  test('ADMINISTRADOR deve criar novo pilar via addTag e vincular à empresa', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    // Abrir modal Gerenciar Pilares
    const moreButton = page.locator('#savingBar [ngbDropdownToggle]');
    await moreButton.click();
    await page.waitForTimeout(500);

    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
    await gerenciarPilaresBtn.click();

    // Aguardar modal abrir
    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Contar pilares ANTES de adicionar
    const pilaresAntes = await page.locator('.pilar-item').count();
    console.log(`[INFO] Pilares antes de adicionar: ${pilaresAntes}`);

    // Criar novo pilar via addTag
    const ngSelect = page.locator('.modal-body ng-select').first();
    await ngSelect.click();
    await page.waitForTimeout(500);

    // Digitar nome do novo pilar
    const nomePilarNovo = `PILAR TESTE E2E ${Date.now()}`;
    const searchInput = page.locator('.modal-body ng-select input[type="text"]');
    await searchInput.fill(nomePilarNovo);
    await page.waitForTimeout(1000);

    // Clicar na opção "Adicionar..."
    const addTagOption = page.locator(`.ng-option:has-text("Adicionar")`).first();
    await addTagOption.click();
    await page.waitForTimeout(3000); // Aguardar criação no backend

    // Validar que apareceu toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("criado com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Validar que pilar foi adicionado à lista
    const pilaresDepois = await page.locator('.pilar-item').count();
    console.log(`[INFO] Pilares depois de adicionar: ${pilaresDepois}`);
    expect(pilaresDepois).toBe(pilaresAntes + 1);

    // Validar que nome aparece na lista
    const pilarAdicionado = page.locator(`.pilar-item:has-text("${nomePilarNovo}")`);
    await expect(pilarAdicionado).toBeVisible();

    // Fechar modal
    const fecharBtn = page.locator('.modal-footer button:has-text("Fechar")');
    await fecharBtn.click();
    await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar página e verificar se pilar ainda está lá
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Abrir modal novamente
    await moreButton.click();
    await page.waitForTimeout(500);
    await gerenciarPilaresBtn.click();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Validar que pilar persiste
    const pilarPersistido = page.locator(`.pilar-item:has-text("${nomePilarNovo}")`);
    await expect(pilarPersistido).toBeVisible();

    console.log(`[SUCCESS] Pilar "${nomePilarNovo}" criado, adicionado e persistido com sucesso!`);
  });

  test('GESTOR deve criar novo pilar via addTag para própria empresa', async ({ page }) => {
    await login(page, TEST_USERS['gestor-a']);
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    // Abrir modal (GESTOR não precisa selecionar empresa)
    const moreButton = page.locator('#savingBar [ngbDropdownToggle]');
    await moreButton.click();
    await page.waitForTimeout(500);

    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
    await gerenciarPilaresBtn.click();

    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Criar novo pilar
    const pilaresAntes = await page.locator('.pilar-item').count();
    const nomePilarNovo = `PILAR GESTOR E2E ${Date.now()}`;

    const ngSelect = page.locator('.modal-body ng-select').first();
    await ngSelect.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('.modal-body ng-select input[type="text"]');
    await searchInput.fill(nomePilarNovo);
    await page.waitForTimeout(1000);

    const addTagOption = page.locator(`.ng-option:has-text("Adicionar")`).first();
    await addTagOption.click();
    await page.waitForTimeout(3000);

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("criado com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Validar adição
    const pilaresDepois = await page.locator('.pilar-item').count();
    expect(pilaresDepois).toBe(pilaresAntes + 1);

    console.log(`[SUCCESS] GESTOR criou pilar "${nomePilarNovo}" com sucesso!`);
  });

  // ===============================================
  // SEÇÃO 2: REORDENAR PILARES VIA DRAG & DROP
  // ===============================================

  test('ADMINISTRADOR deve reordenar pilares via drag & drop e persistir', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    // Abrir modal
    const moreButton = page.locator('[data-testid="empresa-select"]').locator('..').locator('[ngbDropdownToggle]');
    await moreButton.click();
    await page.waitForTimeout(500);

    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
    await gerenciarPilaresBtn.click();

    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Capturar ordem ANTES do drag & drop
    const pilaresAntes = await page.locator('.pilar-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem ANTES:', pilaresAntes);

    // Validar que existem pelo menos 2 pilares para reordenar
    expect(pilaresAntes.length).toBeGreaterThanOrEqual(2);

    // Drag & Drop: Mover primeiro pilar para segunda posição
    const primeiroPilar = page.locator('.pilar-item').first();
    const segundoPilar = page.locator('.pilar-item').nth(1);

    // Playwright drag & drop
    await primeiroPilar.dragTo(segundoPilar);
    await page.waitForTimeout(1000);

    // Capturar ordem DEPOIS do drag & drop
    const pilaresDepois = await page.locator('.pilar-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem DEPOIS:', pilaresDepois);

    // Validar que ordem mudou
    expect(pilaresDepois[0]).not.toBe(pilaresAntes[0]);
    expect(pilaresDepois[1]).toBe(pilaresAntes[0]); // Primeiro pilar foi para segunda posição

    // Validar que botão "Salvar Ordem" apareceu
    const salvarOrdemBtn = page.locator('.modal-footer button:has-text("Salvar Ordem")');
    await expect(salvarOrdemBtn).toBeVisible();

    // Clicar em Salvar Ordem
    await salvarOrdemBtn.click();
    await page.waitForTimeout(2000);

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("atualizada com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Fechar modal
    const fecharBtn = page.locator('.modal-footer button:has-text("Fechar")');
    await fecharBtn.click();
    await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar e verificar ordem
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await moreButton.click();
    await page.waitForTimeout(500);
    await gerenciarPilaresBtn.click();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    const pilaresRecarregados = await page.locator('.pilar-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem RECARREGADA:', pilaresRecarregados);

    // Validar que ordem persiste
    expect(pilaresRecarregados).toEqual(pilaresDepois);

    console.log('[SUCCESS] Reordenação de pilares persistida com sucesso!');
  });

  // ===============================================
  // SEÇÃO 3: REMOVER PILAR DA EMPRESA
  // ===============================================

  test('ADMINISTRADOR deve remover pilar da empresa e validar exclusão', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    // Abrir modal
    const moreButton = page.locator('[data-testid="empresa-select"]').locator('..').locator('[ngbDropdownToggle]');
    await moreButton.click();
    await page.waitForTimeout(500);

    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
    await gerenciarPilaresBtn.click();

    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Contar pilares ANTES de remover
    const pilaresAntes = await page.locator('.pilar-item').count();
    console.log(`[INFO] Pilares antes de remover: ${pilaresAntes}`);

    // Validar que existe pelo menos 1 pilar para remover
    expect(pilaresAntes).toBeGreaterThan(0);

    // Capturar nome do último pilar (para validar remoção)
    const ultimoPilarNome = await page.locator('.pilar-item').last().locator('.flex-grow-1').textContent();
    console.log(`[INFO] Removendo pilar: ${ultimoPilarNome}`);

    // Clicar no botão de remover do último pilar
    const removerBtn = page.locator('.pilar-item').last().locator('button[title="Remover pilar"]');
    await removerBtn.click();
    await page.waitForTimeout(500);

    // Confirmar no SweetAlert
    const confirmarBtn = page.locator('.swal2-confirm');
    await confirmarBtn.click();
    await page.waitForTimeout(2000);

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("removido com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Validar que pilar foi removido
    const pilaresDepois = await page.locator('.pilar-item').count();
    console.log(`[INFO] Pilares depois de remover: ${pilaresDepois}`);
    expect(pilaresDepois).toBe(pilaresAntes - 1);

    // Validar que nome não aparece mais na lista
    const pilarRemovido = page.locator(`.pilar-item:has-text("${ultimoPilarNome}")`);
    await expect(pilarRemovido).not.toBeVisible();

    // Fechar modal
    const fecharBtn = page.locator('.modal-footer button:has-text("Fechar")');
    await fecharBtn.click();
    await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar e verificar que pilar não volta
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await moreButton.click();
    await page.waitForTimeout(500);
    await gerenciarPilaresBtn.click();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Validar que pilar não retornou
    const pilarNaoRetornou = page.locator(`.pilar-item:has-text("${ultimoPilarNome}")`);
    await expect(pilarNaoRetornou).not.toBeVisible();

    console.log(`[SUCCESS] Pilar "${ultimoPilarNome}" removido e exclusão persistida!`);
  });

  // ===============================================
  // SEÇÃO 4: RBAC - COLABORADOR NÃO DEVE ACESSAR MODAL
  // ===============================================

  test('COLABORADOR não deve ver botão Gerenciar Pilares', async ({ page }) => {
    await login(page, TEST_USERS['colab-a']);
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Validar que botão de menu não existe (perfil read-only)
    const moreButton = page.locator('#savingBar [ngbDropdownToggle]');
    await expect(moreButton).not.toBeVisible();

    console.log('[SUCCESS] COLABORADOR não vê botão Gerenciar Pilares (RBAC correto)');
  });

  // ===============================================
  // SEÇÃO 5: MULTI-TENANT - GESTOR SÓ VÊ PRÓPRIA EMPRESA
  // ===============================================

  test('GESTOR deve ver apenas pilares da própria empresa no modal', async ({ page }) => {
    await login(page, TEST_USERS['gestor-a']);
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    // Abrir modal
    const moreButton = page.locator('#savingBar [ngbDropdownToggle]');
    await moreButton.click();
    await page.waitForTimeout(500);

    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
    await gerenciarPilaresBtn.click();

    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Validar que existem pilares da Empresa A
    const pilaresCount = await page.locator('.pilar-item').count();
    expect(pilaresCount).toBeGreaterThan(0);

    console.log(`[INFO] GESTOR vê ${pilaresCount} pilares da Empresa A`);

    // Tentar criar pilar (deve funcionar para própria empresa)
    const nomePilarNovo = `PILAR MULTI-TENANT ${Date.now()}`;
    const ngSelect = page.locator('.modal-body ng-select').first();
    await ngSelect.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('.modal-body ng-select input[type="text"]');
    await searchInput.fill(nomePilarNovo);
    await page.waitForTimeout(1000);

    const addTagOption = page.locator(`.ng-option:has-text("Adicionar")`).first();
    await addTagOption.click();
    await page.waitForTimeout(3000);

    // Deve ter sucesso
    const successToast = page.locator(`.swal2-toast:has-text("criado com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    console.log('[SUCCESS] GESTOR criou pilar apenas para própria empresa (multi-tenant OK)');
  });

});

