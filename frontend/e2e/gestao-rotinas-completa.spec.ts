import { test, expect, login, navigateTo, selectEmpresa, TEST_USERS } from './fixtures';

/**
 * E2E TESTS: Modal Gerenciar Rotinas - Testes Completos
 * 
 * Validações:
 * - Adicionar rotina via botão "Adicionar Rotina" (abre modal NovaRotinaModal)
 * - Reordenar rotinas via drag & drop
 * - Remover rotina do pilar
 * - Validar persistência após cada operação
 * - Validar RBAC (COLABORADOR não deve acessar)
 */

test.describe.skip('LEGACY: Modal Gerenciar Rotinas - Funcionalidades Completas @rotinas @regression @high @legacy', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  // ===============================================
  // SEÇÃO 1: ADICIONAR ROTINA VIA MODAL
  // ===============================================

  test('ADMINISTRADOR deve adicionar rotina customizada via modal', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir primeiro pilar
    const firstPilarButton = page.locator('[data-testid="pilar-accordion"]').first().locator('button.btn-link');
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Abrir menu de ações do pilar
    const pilarMenu = page.locator('[data-testid="pilar-accordion"]').first().locator('[ngbDropdownToggle]');
    await pilarMenu.click();
    await page.waitForTimeout(500);

    // Clicar em "Gerenciar Rotinas"
    const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas"), button:has-text("Gerenciar Rotinas"), [data-testid="btn-gerenciar-rotinas"]');
    await gerenciarRotinasBtn.click();

    // Aguardar drawer abrir
    const drawerTitle = page.locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
    await drawerTitle.first().waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(2000);

    // Contar rotinas ANTES de adicionar
    const rotinasAntes = await page.locator('.rotina-item').count();
    console.log(`[INFO] Rotinas antes de adicionar: ${rotinasAntes}`);

    // Clicar no botão "Adicionar Rotina"
    const adicionarBtn = page.locator('.offcanvas-body button:has-text("Adicionar Rotina"), [data-testid="drawer-body"] button:has-text("Adicionar Rotina"), [data-testid="offcanvas-body"] button:has-text("Adicionar Rotina")');
    await adicionarBtn.click();
      await page.waitForTimeout(1000);

    // Aguardar modal de nova rotina abrir
    const novaRotinaDrawerTitle = page.locator('.offcanvas-title:has-text("Nova Rotina Customizada"), .offcanvas-header:has-text("Nova Rotina Customizada"), [data-testid="drawer-title"]:has-text("Nova Rotina Customizada"), [data-testid="offcanvas-title"]:has-text("Nova Rotina Customizada")');
    await expect(novaRotinaDrawerTitle).toBeVisible({ timeout: 5000 });

    // Preencher nome da rotina
    const nomeRotinaInput = page.locator('input[formControlName="nome"]');
    const nomeRotinaNova = `Rotina Teste E2E ${Date.now()}`;
    await nomeRotinaInput.fill(nomeRotinaNova);
    await page.waitForTimeout(500);

    // Preencher descrição (opcional)
    const descricaoInput = page.locator('textarea[formControlName="descricao"]');
    await descricaoInput.fill('Descrição da rotina customizada de teste E2E');
    await page.waitForTimeout(500);

    // Salvar rotina
    const salvarBtn = page.locator('.offcanvas-footer button:has-text("Salvar"), [data-testid="drawer-footer"] button:has-text("Salvar"), [data-testid="offcanvas-footer"] button:has-text("Salvar"), .offcanvas button:has-text("Salvar")');
    await salvarBtn.click();
      await page.waitForTimeout(3000); // Aguardar criação

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("criada com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Validar que rotina foi adicionada à lista no modal de gerenciar rotinas
    const rotinasDepois = await page.locator('.rotina-item').count();
    console.log(`[INFO] Rotinas depois de adicionar: ${rotinasDepois}`);
    expect(rotinasDepois).toBe(rotinasAntes + 1);

    // Validar que nome aparece na lista
    const rotinaAdicionada = page.locator(`.rotina-item:has-text("${nomeRotinaNova}")`);
    await expect(rotinaAdicionada).toBeVisible();

    // Fechar modal Gerenciar Rotinas
    const fecharBtn = page.locator('.offcanvas-footer button:has-text("Fechar"), [data-testid="drawer-footer"] button:has-text("Fechar"), [data-testid="offcanvas-footer"] button:has-text("Fechar"), .offcanvas button:has-text("Fechar")').last();
    await fecharBtn.click();
      await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar e verificar se rotina ainda está lá
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir pilar novamente
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Validar que rotina aparece na lista principal (fora do modal)
    const rotinaNaTelaPrincipal = page.locator(`[data-testid="rotina-row"]:has-text("${nomeRotinaNova}")`);
    await expect(rotinaNaTelaPrincipal).toBeVisible();

    console.log(`[SUCCESS] Rotina "${nomeRotinaNova}" criada, adicionada e persistida!`);
  });

  // ===============================================
  // SEÇÃO 2: REORDENAR ROTINAS VIA DRAG & DROP
  // ===============================================

  test('ADMINISTRADOR deve reordenar rotinas via drag & drop e persistir', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir primeiro pilar
    const firstPilarButton = page.locator('[data-testid="pilar-accordion"]').first().locator('button.btn-link');
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Abrir modal Gerenciar Rotinas
    const pilarMenu = page.locator('[data-testid="pilar-accordion"]').first().locator('[ngbDropdownToggle]');
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas"), button:has-text("Gerenciar Rotinas"), [data-testid="btn-gerenciar-rotinas"]');
    await gerenciarRotinasBtn.click();

    const drawerTitle = page.locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
    await drawerTitle.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(2000);

    // Capturar ordem ANTES do drag & drop
    const rotinasAntes = await page.locator('.rotina-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem ANTES:', rotinasAntes.slice(0, 3)); // Mostrar primeiras 3

    // Validar que existem pelo menos 2 rotinas
    expect(rotinasAntes.length).toBeGreaterThanOrEqual(2);

    // Drag & Drop: Mover primeira rotina para segunda posição
    const primeiraRotina = page.locator('.rotina-item').first();
    const segundaRotina = page.locator('.rotina-item').nth(1);

    await primeiraRotina.dragTo(segundaRotina);
    await page.waitForTimeout(1000);

    // Capturar ordem DEPOIS do drag & drop
    const rotinasDepois = await page.locator('.rotina-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem DEPOIS:', rotinasDepois.slice(0, 3));

    // Validar que ordem mudou
    expect(rotinasDepois[0]).not.toBe(rotinasAntes[0]);
    expect(rotinasDepois[1]).toBe(rotinasAntes[0]);

    // Validar que botão "Salvar Ordem" apareceu
    const salvarOrdemBtn = page.locator('.offcanvas-footer button:has-text("Salvar Ordem"), [data-testid="drawer-footer"] button:has-text("Salvar Ordem"), [data-testid="offcanvas-footer"] button:has-text("Salvar Ordem"), .offcanvas button:has-text("Salvar Ordem")');
    await expect(salvarOrdemBtn).toBeVisible();

    // Salvar ordem
    await salvarOrdemBtn.click();
    await page.waitForTimeout(2000);

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("atualizada com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Fechar modal
    const fecharBtn = page.locator('.offcanvas-footer button:has-text("Fechar"), [data-testid="drawer-footer"] button:has-text("Fechar"), [data-testid="offcanvas-footer"] button:has-text("Fechar"), .offcanvas button:has-text("Fechar")');
    await fecharBtn.click();
      await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar e verificar ordem
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    await pilarMenu.click();
    await page.waitForTimeout(500);
    await gerenciarRotinasBtn.click();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(2000);

    const rotinasRecarregadas = await page.locator('.rotina-item .flex-grow-1').allTextContents();
    console.log('[INFO] Ordem RECARREGADA:', rotinasRecarregadas.slice(0, 3));

    // Validar que ordem persiste
    expect(rotinasRecarregadas).toEqual(rotinasDepois);

    console.log('[SUCCESS] Reordenação de rotinas persistida com sucesso!');
  });

  // ===============================================
  // SEÇÃO 3: REMOVER ROTINA DO PILAR
  // ===============================================

  test('ADMINISTRADOR deve remover rotina do pilar e validar exclusão', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir primeiro pilar
    const firstPilarButton = page.locator('[data-testid="pilar-accordion"]').first().locator('button.btn-link');
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Abrir modal Gerenciar Rotinas
    const pilarMenu = page.locator('[data-testid="pilar-accordion"]').first().locator('[ngbDropdownToggle]');
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas"), button:has-text("Gerenciar Rotinas"), [data-testid="btn-gerenciar-rotinas"]');
    await gerenciarRotinasBtn.click();

    const drawerTitle = page.locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
    await drawerTitle.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(2000);

    // Contar rotinas ANTES de remover
    const rotinasAntes = await page.locator('.rotina-item').count();
    console.log(`[INFO] Rotinas antes de remover: ${rotinasAntes}`);

    // Validar que existe pelo menos 1 rotina
    expect(rotinasAntes).toBeGreaterThan(0);

    // Capturar nome da última rotina
    const ultimaRotinaNome = await page.locator('.rotina-item').last().locator('.flex-grow-1').textContent();
    console.log(`[INFO] Removendo rotina: ${ultimaRotinaNome}`);

    // Clicar no botão de remover
    const removerBtn = page.locator('.rotina-item').last().locator('button[title="Remover rotina"]');
    await removerBtn.click();
    await page.waitForTimeout(500);

    // Confirmar no SweetAlert
    const confirmarBtn = page.locator('.swal2-confirm');
    await confirmarBtn.click();
    await page.waitForTimeout(2000);

    // Validar toast de sucesso
    const successToast = page.locator(`.swal2-toast:has-text("removida com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Validar que rotina foi removida
    const rotinasDepois = await page.locator('.rotina-item').count();
    console.log(`[INFO] Rotinas depois de remover: ${rotinasDepois}`);
    expect(rotinasDepois).toBe(rotinasAntes - 1);

    // Fechar modal
    const fecharBtn = page.locator('.offcanvas-footer button:has-text("Fechar"), [data-testid="drawer-footer"] button:has-text("Fechar"), [data-testid="offcanvas-footer"] button:has-text("Fechar"), .offcanvas button:has-text("Fechar")');
    await fecharBtn.click();
    await page.waitForTimeout(1000);

    // VALIDAR PERSISTÊNCIA: Recarregar e verificar
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    await pilarMenu.click();
    await page.waitForTimeout(500);
    await gerenciarRotinasBtn.click();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(2000);

    // Validar que rotina não retornou
    const rotinaRemovida = page.locator(`.rotina-item:has-text("${ultimaRotinaNome}")`);
    await expect(rotinaRemovida).not.toBeVisible();

    console.log(`[SUCCESS] Rotina "${ultimaRotinaNome}" removida e exclusão persistida!`);
  });

  // ===============================================
  // SEÇÃO 4: RBAC - COLABORADOR NÃO DEVE ACESSAR
  // ===============================================

  test('COLABORADOR não deve ver menu de ações do pilar', async ({ page }) => {
    await login(page, TEST_USERS['colab-a']);
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir primeiro pilar
    const firstPilarButton = page.locator('[data-testid="pilar-accordion"]').first().locator('button.btn-link');
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Validar que menu de ações não existe
    const pilarMenu = page.locator('[data-testid="pilar-accordion"]').first().locator('[ngbDropdownToggle]');
    await expect(pilarMenu).not.toBeVisible();

    console.log('[SUCCESS] COLABORADOR não vê menu de ações (RBAC correto)');
  });

  // ===============================================
  // SEÇÃO 5: GESTOR DEVE PODER GERENCIAR ROTINAS DA PRÓPRIA EMPRESA
  // ===============================================

  test('GESTOR deve adicionar rotina para própria empresa', async ({ page }) => {
    await login(page, TEST_USERS['gestor-a']);
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expandir primeiro pilar
    const firstPilarButton = page.locator('[data-testid="pilar-accordion"]').first().locator('button.btn-link');
    await firstPilarButton.click();
    await page.waitForTimeout(1000);

    // Abrir menu e modal
    const pilarMenu = page.locator('[data-testid="pilar-accordion"]').first().locator('[ngbDropdownToggle]');
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas"), button:has-text("Gerenciar Rotinas"), [data-testid="btn-gerenciar-rotinas"]');
    await gerenciarRotinasBtn.click();

    const drawerTitle = page.locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
    await drawerTitle.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(2000);

    // Adicionar rotina
    const rotinasAntes = await page.locator('.rotina-item').count();

    const adicionarBtn = page.locator('.offcanvas-body button:has-text("Adicionar Rotina"), [data-testid="drawer-body"] button:has-text("Adicionar Rotina"), [data-testid="offcanvas-body"] button:has-text("Adicionar Rotina")');
    await adicionarBtn.click();
    await page.waitForTimeout(1000);

    const novaRotinaDrawerTitle = page.locator('.offcanvas-title:has-text("Nova Rotina Customizada"), .offcanvas-header:has-text("Nova Rotina Customizada"), [data-testid="drawer-title"]:has-text("Nova Rotina Customizada"), [data-testid="offcanvas-title"]:has-text("Nova Rotina Customizada")');
    await expect(novaRotinaDrawerTitle).toBeVisible({ timeout: 5000 });

    const nomeRotinaInput = page.locator('input[formControlName="nome"]');
    const nomeRotinaNova = `Rotina GESTOR E2E ${Date.now()}`;
    await nomeRotinaInput.fill(nomeRotinaNova);

    const salvarBtn = page.locator('.offcanvas-footer button:has-text("Salvar"), [data-testid="drawer-footer"] button:has-text("Salvar"), [data-testid="offcanvas-footer"] button:has-text("Salvar"), .offcanvas button:has-text("Salvar")');
    await salvarBtn.click();
    await page.waitForTimeout(3000);

    // Validar sucesso
    const successToast = page.locator(`.swal2-toast:has-text("criada com sucesso")`);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    const rotinasDepois = await page.locator('.rotina-item').count();
    expect(rotinasDepois).toBe(rotinasAntes + 1);

    console.log(`[SUCCESS] GESTOR criou rotina "${nomeRotinaNova}" com sucesso!`);
  });

});
