import { test, expect, login, navigateTo, expectToast, TEST_USERS } from '../fixtures';

test.describe.serial('Periodo de Avaliacao - Janela Temporal @diagnostico @periodo', () => {
  test('RN-PEVOL-JANELA-001: abre modal e cria primeira data quando nao ha periodos', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaB);
    await navigateTo(page, '/diagnostico-evolucao');
    await expect(page.getByTestId('medias-table')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('btn-congelar-medias')).toBeVisible();

    await page.getByTestId('btn-congelar-medias').click();
    await expect(page.getByTestId('primeira-data-modal')).toBeVisible();

    await page.getByTestId('primeira-data-input').fill('2025-12-15');
    await page.getByTestId('primeira-data-confirm').click();

    await expectToast(page, 'success', /Per[ií]odo/i);
  });

  test('RN-PEVOL-JANELA-002: atualiza periodo dentro da janela ativa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-evolucao');
    await expect(page.getByTestId('medias-table')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('btn-congelar-medias')).toBeVisible();

    await page.getByTestId('btn-congelar-medias').click();
    await page.getByRole('button', { name: /sim, adicionar/i }).click();

    await expectToast(page, 'success', /Per[ií]odo/i);
  });
});
