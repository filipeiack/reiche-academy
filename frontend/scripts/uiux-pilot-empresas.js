const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.UIUX_BASE_URL || 'http://localhost:4200';
const email = process.env.UIUX_EMAIL || 'admin@reiche.com.br';
const password = process.env.UIUX_PASSWORD || 'Admin@123';

const outputRoot = path.join(__dirname, '..', 'test-results', 'uiux-pilot', 'empresas');
const screenshotDir = path.join(outputRoot, 'screenshots');
const axeDir = path.join(outputRoot, 'axe');

const viewports = {
  desktop: { width: 1366, height: 768 },
  mobile: { width: 390, height: 844 },
};

const themes = ['light', 'dark'];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildPath(dir, fileName) {
  return path.join(dir, fileName);
}

async function loginAndOpenEmpresas(page, theme) {
  await page.goto(`${baseUrl}/auth/login?theme=${theme}`, { waitUntil: 'networkidle' });
  await page.fill('#exampleInputEmail1', email);
  await page.fill('#InputPassword', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto(`${baseUrl}/empresas?theme=${theme}`, { waitUntil: 'networkidle' });

  if (page.url().includes('/auth/login')) {
    throw new Error('Login failed or session not established.');
  }
}

async function captureScenario({ theme, viewportKey }) {
  const viewport = viewports[viewportKey];
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await loginAndOpenEmpresas(page, theme);
  await page.waitForTimeout(2000);

  const screenshotPath = buildPath(
    screenshotDir,
    `empresas-${viewportKey}-${theme}.png`
  );

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const axeResults = await new AxeBuilder({ page }).analyze();
  const axePath = buildPath(axeDir, `axe-empresas-${viewportKey}-${theme}.json`);
  fs.writeFileSync(axePath, JSON.stringify(axeResults, null, 2));

  await browser.close();
}


async function run() {
  ensureDir(outputRoot);
  ensureDir(screenshotDir);
  ensureDir(axeDir);

  for (const theme of themes) {
    await captureScenario({ theme, viewportKey: 'desktop' });
    await captureScenario({ theme, viewportKey: 'mobile' });
  }

  console.log('UI/UX pilot artifacts generated:', outputRoot);
}

run().catch((error) => {
  console.error('UI/UX pilot failed:', error);
  process.exit(1);
});
