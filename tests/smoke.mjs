// Loads every app in a headless browser and fails if a page throws, logs a
// console error, or requests a local file that doesn't exist. Failures of
// external resources (web fonts, CDNs, public APIs) are reported but ignored,
// so the check also works offline.
//
//   npm test                 # all apps
//   npm test -- dice-game    # selected apps
import { readdir, access, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import { ROOT, startServer } from './serve.mjs';

// The root index.html links to every app; it is checked like an app.
const GALLERY = 'gallery';
const appDir = (app) => (app === GALLERY ? ROOT : join(ROOT, app));
const appPath = (app) => (app === GALLERY ? '' : `${app}/`);

async function listApps() {
  const apps = [];
  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(ROOT, entry.name, 'index.html'));
      apps.push(entry.name);
    } catch {}
  }
  return apps.sort();
}

// Static check of every local src/href in index.html. Browsers fetch some
// resources (such as favicons) unreliably in headless mode, so a missing file
// isn't always visible as a failed request.
async function missingReferences(app) {
  const dir = appDir(app);
  const html = await readFile(join(dir, 'index.html'), 'utf8');
  const missing = [];
  for (const [, ref] of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue; // external, data: or anchor
    const target = resolve(dir, ref.split(/[?#]/)[0]);
    if (!target.startsWith(dir + sep)) {
      missing.push(`reference outside the app folder: ${ref}`);
      continue;
    }
    try {
      await access(target);
    } catch {
      missing.push(`missing file: ${ref}`);
    }
  }
  return missing;
}

// Every app folder should be linked from the gallery, and nothing else.
async function galleryMismatches(apps) {
  const html = await readFile(join(ROOT, 'index.html'), 'utf8');
  const linked = [...html.matchAll(/href="([^"/]+)\/"/g)].map((m) => m[1]);
  return [
    ...apps.filter((a) => !linked.includes(a)).map((a) => `gallery does not link to ${a}`),
    ...linked.filter((l) => !apps.includes(l)).map((l) => `gallery links to unknown app ${l}`),
  ];
}

// Common phone widths: a mid-size phone and the narrowest still in use.
const PHONE_WIDTHS = [390, 320];

async function check(browser, base, app) {
  // A fresh context per app, so a cached 404 (e.g. a shared favicon) can't hide
  // a missing file in a later app.
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = await missingReferences(app);
  const external = [];
  const isLocal = (url) => url.startsWith(base);

  page.on('pageerror', (err) => errors.push(`uncaught: ${err.message}`));
  page.on('console', (msg) => {
    // Resource failures are classified below by URL instead.
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      errors.push(`console: ${msg.text()}`);
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      (isLocal(res.url()) ? errors : external).push(`HTTP ${res.status()} ${res.url()}`);
    }
  });
  page.on('requestfailed', (req) => {
    (isLocal(req.url()) ? errors : external).push(`failed ${req.url()} (${req.failure()?.errorText})`);
  });

  await page.goto(`${base}${appPath(app)}`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Phone widths: the page must fit without sideways scrolling.
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(200);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > width) errors.push(`${scrollWidth}px wide on a ${width}px screen (sideways scrolling)`);
  }
  await context.close();
  return { app, errors, external };
}

const appFolders = await listApps();
const allApps = [GALLERY, ...appFolders];
const wanted = process.argv.slice(2);
const unknown = wanted.filter((a) => !allApps.includes(a));
if (unknown.length) {
  console.error(`Unknown app(s): ${unknown.join(', ')}. Available: ${allApps.join(', ')}`);
  process.exit(1);
}
const apps = wanted.length ? wanted : allApps;

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

let failed = 0;
try {
  for (const app of apps) {
    const { errors, external } = await check(browser, base, app);
    if (app === GALLERY) errors.push(...(await galleryMismatches(appFolders)));
    console.log(`${errors.length ? 'FAIL' : 'ok  '}  ${app}`);
    for (const e of errors) console.log(`        ${e}`);
    for (const e of external) console.log(`        (external, ignored) ${e}`);
    if (errors.length) failed++;
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${apps.length - failed}/${apps.length} apps passed`);
process.exit(failed ? 1 : 0);
