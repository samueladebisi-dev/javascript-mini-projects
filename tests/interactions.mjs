// Behaviour checks for individual apps: each one drives the page like a user
// and asserts on what is shown.
//
//   node tests/interactions.mjs                 # all checks
//   node tests/interactions.mjs bill-split      # selected apps
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const checks = {
  'guess-the-number': async (page) => {
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));
    await expectText(page, 'p', /between 1 and 100/);

    // An empty guess asks for a number and is not recorded as an attempt.
    await page.click('.submit');
    assert.equal(await page.textContent('.range'), 'Please enter a number between 1 and 100');
    assert.equal(await page.textContent('.result'), '');

    // Binary search using the hints, then check the attempt count and reset.
    let low = 1, high = 100, attempts = 0, message = '';
    while (low <= high) {
      const guess = Math.floor((low + high) / 2);
      await page.fill('input', String(guess));
      await page.click('.submit');
      attempts++;
      message = await page.textContent('.range');
      if (message.startsWith('Too High')) high = guess - 1;
      else if (message.startsWith('Too Low')) low = guess + 1;
      else break;
    }
    assert.match(message, new RegExp(`after ${attempts} attempts`));
    assert.ok(!(await page.textContent('.result')).includes('NaN'));
    assert.ok(!logs.some((l) => /^\d+$/.test(l)), 'the answer is printed to the console');

    await page.click('.startGame');
    assert.equal(await page.textContent('.range'), '');
    assert.equal(await page.textContent('.result'), '');
    assert.ok(await page.isDisabled('.startGame'));
  },

  'bill-split': async (page) => {
    await page.fill('#amount', '100');
    await page.click('.btn:text("10%")');
    await page.fill('#person', '3');
    await page.click('#generate-bill');
    assert.equal(await page.textContent('.tipValue'), '₹10.00');
    assert.equal(await page.textContent('.totalValue'), '₹110.00');
    assert.equal(await page.textContent('.bill'), '₹36.67');

    await page.click('#reset');
    assert.equal(await page.textContent('.bill'), '');
    assert.ok(await page.isDisabled('#generate-bill'));

    // A second bill after reset, with a custom tip.
    await page.fill('#amount', '50');
    await page.fill('#customTip', '20');
    await page.fill('#person', '2');
    await page.click('#generate-bill');
    assert.equal(await page.textContent('.bill'), '₹30.00');
  },

  'currency-converter': async (page) => {
    await expectText(page, 'body', /sample rates/i);
    const to = await page.$$eval('#toCurrency option', (os) => os.map((o) => o.value));
    const from = await page.$$eval('#fromCurrency option', (os) => os.map((o) => o.value));
    assert.deepEqual(to, from, 'both lists offer the same currencies');

    const convert = async (amount, a, b) => {
      await page.fill('#amount', amount);
      await page.selectOption('#fromCurrency', a);
      await page.selectOption('#toCurrency', b);
      await page.click('#convertButton');
      return page.inputValue('#result');
    };
    assert.equal(await convert('10', 'USD', 'EUR'), '8.50');
    assert.equal(await convert('8.5', 'EUR', 'USD'), '10.00');

    page.once('dialog', (d) => d.accept('1.37'));
    await page.fill('#customCurrency', 'cad');
    await page.click('#addCurrencyButton');
    assert.equal(await convert('10', 'USD', 'CAD'), '13.70');
  },

  'string-transformers': async (page) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const expected = {
      lowercase: 'hello  world foo',
      uppercase: 'HELLO  WORLD FOO',
      camelcase: 'helloWorldFoo',
      pascalcase: 'HelloWorldFoo',
      snakecase: 'hello_world_foo',
      kebabcase: 'hello-world-foo',
      trim: 'HelloWorldFoo',
    };
    await page.fill('#userInput', '  Hello  World Foo ');
    for (const [id, value] of Object.entries(expected)) {
      assert.equal(await page.textContent(`#${id}`), value, id);
    }
    await page.fill('#userInput', '');
    for (const id of Object.keys(expected)) {
      assert.equal(await page.textContent(`#${id}`), '', `${id} when empty`);
    }
    assert.deepEqual(errors, []);
  },

  'infinite-scroll': async (page) => {
    // Serve fake posts instead of jsonplaceholder: 20 posts in total, and fail
    // every request after the first batch when `failAfterFirst` is set.
    let failAfterFirst = false;
    let requests = 0;
    await page.route('https://jsonplaceholder.typicode.com/posts**', (route) => {
      requests++;
      const url = new URL(route.request().url());
      const start = Number(url.searchParams.get('_start'));
      const end = Math.min(Number(url.searchParams.get('_end')), 20);
      if (failAfterFirst && start > 0) return route.abort();
      const posts = [];
      for (let id = start + 1; id <= end; id++) posts.push({ id, body: `post ${id}` });
      return route.fulfill({ json: posts });
    });
    const scrollToEnd = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await page.setViewportSize({ width: 800, height: 600 });
    await page.reload();
    await page.waitForSelector('.post');
    for (let i = 0; i < 10 && !(await page.isVisible('.end-of-content')); i++) {
      await scrollToEnd();
      await page.waitForTimeout(700);
    }
    assert.ok(await page.isVisible('.end-of-content'), 'end of content shown');
    assert.equal(await page.locator('.post').count(), 20);
    const numbers = await page.$$eval('.post-number', (els) => els.map((e) => Number(e.textContent)));
    assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => i + 1), 'posts numbered 1-20 once each');

    // A failing request after posts are on screen retries, then shows the error.
    failAfterFirst = true;
    requests = 0;
    await page.reload();
    await page.waitForSelector('.post');
    await scrollToEnd();
    await page.waitForSelector('.fetch-error', { state: 'visible', timeout: 5000 });
    assert.ok(requests > 2, 'failed request was retried');
    assert.ok(!(await page.isVisible('.loader')), 'loader hidden after the error');
  },

  'password-validation': async (page) => {
    // fill() sets the value like a paste or autofill: no key events are fired.
    await page.fill('.pass-field input', 'Abcdef1!');
    assert.equal(await page.locator('.requirement-list li.valid').count(), 5);
    await page.fill('.pass-field input', 'abc');
    assert.equal(await page.locator('.requirement-list li.valid').count(), 1);

    // The eye icon comes from the Font Awesome CDN and has no size offline, so
    // dispatch the click instead of clicking at its position.
    await page.dispatchEvent('.pass-field i', 'click');
    assert.equal(await page.getAttribute('.pass-field input', 'type'), 'text');
  },

  'copy-to-clipboard': async (page, base) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    await page.click('button');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'This is the text to be copied.');
    assert.ok(await page.isVisible('#feedback'), 'feedback shown');
  },

  blobmaker: async (page, base) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    // The CSS is shown as soon as the page loads, before any slider is moved.
    const initial = await page.inputValue('#css-code');
    assert.match(initial, /^border-radius: [\d% /]+;$/);
    assert.equal(await page.$eval('#blob', (el) => el.style.borderRadius !== ''), true);

    await page.fill('#blob-height', '150');
    await page.dispatchEvent('#blob-height', 'change');
    assert.equal(await page.$eval('#blob', (el) => el.style.height), '150px');

    await page.click('#copy');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.inputValue('#css-code'));
    assert.equal(await page.textContent('#copy'), 'Copied!');
  },

  'product-slider': async (page) => {
    // Load wide, then shrink the window: each click should still move by the
    // slider's current width.
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.reload();
    await page.setViewportSize({ width: 700, height: 900 });
    await page.click('.nxt-btn');
    await page.waitForTimeout(1000);
    const { scrollLeft, width } = await page.$eval('.product-container', (el) => ({
      scrollLeft: el.scrollLeft,
      width: el.getBoundingClientRect().width,
    }));
    assert.ok(Math.abs(scrollLeft - width) < 2, `scrolled ${scrollLeft}px, expected ${width}px`);
  },
  'todo-list': async (page) => {
    const items = () => page.$$eval('#list li .text', (els) => els.map((e) => e.textContent));
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Add with the button and with Enter; blank input is ignored.
    await page.fill('#in1', 'Buy milk');
    await page.click('#button');
    await page.fill('#in1', '   ');
    await page.click('#button');
    await page.fill('#in1', '  Write README ');
    await page.press('#in1', 'Enter');
    assert.deepEqual(await items(), ['Buy milk', 'Write README']);
    assert.equal(await page.inputValue('#in1'), '');

    // Complete the first task and delete the second.
    await page.check('#list li:nth-child(1) input[type=checkbox]');
    await page.click('#list li:nth-child(2) .delete');
    assert.deepEqual(await items(), ['Buy milk']);

    // Tasks and their state survive a reload.
    await page.reload();
    assert.deepEqual(await items(), ['Buy milk']);
    assert.ok(await page.isChecked('#list li:nth-child(1) input[type=checkbox]'));
    assert.ok(await page.$eval('#list li:nth-child(1)', (el) => el.classList.contains('done')));

    // Text is shown as text, never parsed as HTML.
    await page.fill('#in1', '<b>bold</b>');
    await page.click('#button');
    assert.equal((await items())[1], '<b>bold</b>');
    await page.evaluate(() => localStorage.clear());
  },
};

async function expectText(page, selector, pattern) {
  const text = await page.textContent(selector);
  assert.match(text, pattern);
}

const wanted = process.argv.slice(2);
const unknown = wanted.filter((a) => !(a in checks));
if (unknown.length) {
  console.error(`No checks for: ${unknown.join(', ')}. Available: ${Object.keys(checks).join(', ')}`);
  process.exit(1);
}

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

let failed = 0;
const names = wanted.length ? wanted : Object.keys(checks);
try {
  for (const app of names) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${base}${app}/`, { waitUntil: 'load' });
      await checks[app](page, base);
      console.log(`ok    ${app}`);
    } catch (err) {
      failed++;
      console.log(`FAIL  ${app}\n        ${err.message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${names.length - failed}/${names.length} checks passed`);
process.exit(failed ? 1 : 0);
