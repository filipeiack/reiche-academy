import { test, expect, login, TEST_USERS } from '../fixtures';

test.describe('Edição de Valores Mensais - Referência @cockpit @indicadores', () => {
  const cockpitId = '123';

  const routeCockpit = async (page: any, payload: any) => {
    await page.route('**/cockpits/**', (route: any) => {
      const request = route.request();

      if (request.method() === 'GET' && request.url().includes(`/cockpits/${cockpitId}`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        });
      }

      return route.fallback();
    });
  };

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test('exibe input de referência e oculta tabela quando não há meses', async ({ page }) => {
    await routeCockpit(page, {
      id: cockpitId,
      dataReferencia: null,
      pilarEmpresa: { empresa: { id: 'empresa-a' } },
      indicadores: [],
    });

    await page.goto(`/cockpit-pilares/${cockpitId}/valores-mensais`);
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();

    await expect(page.getByTestId('input-data-referencia')).toBeVisible();
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeVisible();
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeDisabled();
    await expect(page.getByTestId('valores-table')).toHaveCount(0);
  });

  test('habilita o botão ao selecionar referência e envia dataReferencia', async ({ page }) => {
    const postBodies: any[] = [];

    await routeCockpit(page, {
      id: cockpitId,
      dataReferencia: null,
      pilarEmpresa: { empresa: { id: 'empresa-a' } },
      indicadores: [],
    });

    await page.route('**/cockpits/**/meses/ciclo', (route: any) => {
      postBodies.push(route.request().postDataJSON());
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ sucesso: true, indicadores: 0, mesesCriados: 0 }),
      });
    });

    await page.goto(`/cockpit-pilares/${cockpitId}/valores-mensais`);
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();

    await page.getByTestId('input-data-referencia').fill('2026-02');
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeEnabled();

    await page.getByTestId('btn-novo-ciclo-mensal').click();
    await page.locator('.swal2-confirm').click();

    await expect.poll(() => postBodies.length).toBeGreaterThan(0);
    expect(postBodies[0]?.dataReferencia).toContain('2026-02-01');
  });

  test('bloqueia edição quando dataReferencia já está definida', async ({ page }) => {
    await routeCockpit(page, {
      id: cockpitId,
      dataReferencia: '2026-02-01T00:00:00-03:00',
      pilarEmpresa: { empresa: { id: 'empresa-a' } },
      indicadores: [
        {
          id: 'ind-1',
          nome: 'Indicador 1',
          melhor: 'MAIOR',
          tipoMedida: 'REAL',
          statusMedicao: 'NAO_MEDIDO',
          mesesIndicador: [
            { id: 'mes-1', mes: 2, ano: 2026, meta: null, realizado: null, historico: null },
          ],
        },
      ],
    });

    await page.goto(`/cockpit-pilares/${cockpitId}/valores-mensais`);
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();

    await expect(page.getByTestId('input-data-referencia')).toBeDisabled();
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeDisabled();
    await expect(page.getByTestId('valores-table')).toBeVisible();
  });
});
