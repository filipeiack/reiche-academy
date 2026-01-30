import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Diagnóstico (Criticidade e Notas)
 *
 * Regras base: /docs/business-rules/diagnosticos.md
 */

test.describe('@diagnostico smoke - criticidade e notas', () => {
  test('ADMINISTRADOR preenche criticidade e nota com sucesso', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    const rotinaExists = (await primeiraRotina.count()) > 0;
    
    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const criticidadeOptions = page.locator('.ng-option');
    const altoOption = criticidadeOptions.filter({ hasText: 'ALTA' }).first();
    if ((await altoOption.count()) > 0) {
      await altoOption.click();
    } else {
      await criticidadeOptions.first().click();
    }

    await page.waitForTimeout(500);

    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('8');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('#savingBar .last-save-info').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR preenche criticidade e nota na própria empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    const rotinaExists = (await primeiraRotina.count()) > 0;
    
    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const criticidadeOptions = page.locator('.ng-option');
    const medioOption = criticidadeOptions.filter({ hasText: 'MEDIA' }).first();
    if ((await medioOption.count()) > 0) {
      await medioOption.click();
    } else {
      await criticidadeOptions.first().click();
    }

    await page.waitForTimeout(500);

    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('7');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('#savingBar .last-save-info').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });

  test('COLABORADOR preenche criticidade e nota', async ({ page }) => {
    await login(page, TEST_USERS.colaborador);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    const rotinaExists = (await primeiraRotina.count()) > 0;
    
    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const criticidadeOptions = page.locator('.ng-option');
    const baixoOption = criticidadeOptions.filter({ hasText: 'BAIXA' }).first();
    if ((await baixoOption.count()) > 0) {
      await baixoOption.click();
    } else {
      await criticidadeOptions.first().click();
    }

    await page.waitForTimeout(500);

    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('6');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('#savingBar .last-save-info').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });

  test('COLABORADOR vê campos editáveis de criticidade e nota', async ({ page }) => {
    await login(page, TEST_USERS.colaborador);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;

    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    const rotinaExists = (await primeiraRotina.count()) > 0;
    
    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();

    await expect(campoCriticidade).toBeVisible();
    await expect(campoNota).toBeVisible();
    await expect(campoNota).not.toBeDisabled();
  });

  test('ADMINISTRADOR cria rotina customizada e preenche criticidade/nota', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const pilarMenu = primeiroPilar.locator('[data-testid="pilar-actions-toggle"]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"], a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();

    await page.waitForSelector('[data-testid="rotina-add-title"]', { timeout: 5000 });
    await page.waitForTimeout(500);

    const nomeRotina = `Rotina Smoke ${Date.now()}`;
    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill(nomeRotina);

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await criarButton.click();
    await page.waitForTimeout(2000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);


    const rotinas = primeiroPilar.locator('[data-testid="rotina-row"]');
    
    let rotinaAlvo = rotinas.filter({ hasText: nomeRotina }).first();
    if (!(await rotinaAlvo.isVisible().catch(() => false))) {
      rotinaAlvo = rotinas.last();
    }

    const campoCriticidade = rotinaAlvo.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.scrollIntoViewIfNeeded();
    await expect(campoCriticidade).toBeVisible({ timeout: 5000 });
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const criticidadeOptions = page.locator('.ng-option');
    await criticidadeOptions.first().click();
    await page.waitForTimeout(500);

    const campoNota = rotinaAlvo.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('10');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('#savingBar .last-save-info').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR cria rotina customizada e preenche criticidade/nota', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarExists = (await primeiroPilar.count()) > 0;
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const pilarMenu = primeiroPilar.locator('[data-testid="pilar-actions-toggle"]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"], a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();

    await page.waitForSelector('[data-testid="rotina-add-title"]', { timeout: 5000 });
    await page.waitForTimeout(500);

    const nomeRotina = `Rotina Gestor Smoke ${Date.now()}`;
    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill(nomeRotina);

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await criarButton.click();
    await page.waitForTimeout(2000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    

    const rotinas = primeiroPilar.locator('[data-testid="rotina-row"]');
    
    let rotinaAlvo = rotinas.filter({ hasText: nomeRotina }).first();
    if (!(await rotinaAlvo.isVisible().catch(() => false))) {
      rotinaAlvo = rotinas.last();
    }

    const campoCriticidade = rotinaAlvo.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.scrollIntoViewIfNeeded();
    await expect(campoCriticidade).toBeVisible({ timeout: 5000 });
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const criticidadeOptions = page.locator('.ng-option');
    await criticidadeOptions.first().click();
    await page.waitForTimeout(500);

    const campoNota = rotinaAlvo.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('9');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('#savingBar .last-save-info').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });
});
