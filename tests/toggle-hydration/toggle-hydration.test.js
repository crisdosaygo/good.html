/**
 * Toggle Hydration Bug Reproduction Test
 * 
 * Tests that bang.js web components survive disconnect→reconnect cycles
 * without losing event handler hydration. Reproduces the BrowserBox
 * "toggle Chrome UI" bug where progressive toggling destroys handlers.
 *
 * Usage:
 *   node --test tests/toggle-hydration/toggle-hydration.test.js
 */
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from '/Users/crisd/Creative/BrowserBox-source/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const GOOD_HTML_ROOT = join(__dirname, '..', '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function createStaticServer(root, port = 0) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost`);
      let filePath = join(root, decodeURIComponent(url.pathname));
      if (filePath.endsWith('/')) filePath = join(filePath, 'index.html');

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port, url: `http://127.0.0.1:${addr.port}` });
    });
    server.on('error', reject);
  });
}

describe('Toggle Hydration', () => {
  let browser, page, serverInfo;

  before(async () => {
    serverInfo = await createStaticServer(GOOD_HTML_ROOT);
    console.log(`Static server on ${serverInfo.url}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverInfo?.server) serverInfo.server.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();

    // Collect console warnings about dereference failures
    page._dereferenceErrors = [];
    page._tdLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[TD]')) {
        page._tdLogs.push(text);
      }
      if (text.includes('dereference') || text.includes('getAncestor FAILED')) {
        page._dereferenceErrors.push(text);
      }
    });
    page.on('pageerror', err => {
      page._dereferenceErrors.push(`PAGE ERROR: ${err.message}`);
    });
  });

  async function loadTestPage() {
    const url = `${serverInfo.url}/tests/toggle-hydration/index.html`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    // Wait for bang framework to boot and components to render
    await page.waitForFunction(() => {
      const parent = document.querySelector('toggle-parent');
      return parent?.shadowRoot?.querySelector('toggle-child');
    }, { timeout: 10000 });
  }

  async function getHealthCheck() {
    return page.evaluate(() => {
      const results = { pass: true, checks: [], errors: [] };
      const parent = document.querySelector('toggle-parent');
      const parentShadow = parent?.shadowRoot;
      const child = parentShadow?.querySelector('toggle-child');
      const status = parentShadow?.querySelector('toggle-status');

      // Check child exists
      if (!child) {
        results.pass = false;
        results.checks.push({ name: 'child exists', pass: false });
        return results;
      }
      results.checks.push({ name: 'child exists', pass: true });

      // Check child shadow
      const childShadow = child.shadowRoot;
      if (!childShadow) {
        results.pass = false;
        results.checks.push({ name: 'child has shadow', pass: false });
        return results;
      }
      results.checks.push({ name: 'child has shadow', pass: true });

      // Check child buttons have working onclick
      const buttons = childShadow.querySelectorAll('button');
      for (const btn of buttons) {
        const onclick = btn.getAttribute('onclick');
        if (!onclick) {
          results.pass = false;
          results.checks.push({ name: `button "${btn.textContent}" has onclick`, pass: false });
          continue;
        }
        results.checks.push({ name: `button "${btn.textContent}" has onclick="${onclick.substring(0,50)}"`, pass: true });

        // Verify function can be resolved on the host
        if (onclick.includes('this.getRootNode().host.')) {
          const match = onclick.match(/this\.getRootNode\(\)\.host\.(\w+)/);
          if (match) {
            const funcName = match[1];
            const funcExists = typeof child[funcName] === 'function';
            results.checks.push({ name: `  host.${funcName} is function`, pass: funcExists });
            if (!funcExists) results.pass = false;
          }
        }
      }

      // Check status component
      const statusShadow = status?.shadowRoot;
      const statusBtn = statusShadow?.querySelector('button');
      const statusOnclick = statusBtn?.getAttribute('onclick');
      results.checks.push({ name: `status button onclick="${(statusOnclick||'NONE').substring(0,50)}"`, pass: !!statusOnclick });
      if (!statusOnclick) results.pass = false;

      if (statusOnclick?.includes('this.getRootNode().host.')) {
        const match = statusOnclick.match(/this\.getRootNode\(\)\.host\.(\w+)/);
        if (match) {
          const funcExists = typeof status[match[1]] === 'function';
          results.checks.push({ name: `  status host.${match[1]} is function`, pass: funcExists });
          if (!funcExists) results.pass = false;
        }
      }

      return results;
    });
  }

  async function toggleChild(show) {
    await page.evaluate((shouldShow) => {
      const state = cloneState('TestState');
      state.showChild = shouldShow;
      state.toggleCount = (state.toggleCount || 0) + 1;
      setState('TestState', state);
    }, show);
    // Wait for rendering to settle
    await new Promise(r => setTimeout(r, 600));
  }

  async function waitForChildRendered() {
    await page.waitForFunction(() => {
      const parent = document.querySelector('toggle-parent');
      const child = parent?.shadowRoot?.querySelector('toggle-child');
      return child?.shadowRoot?.querySelector('button');
    }, { timeout: 8000 });
    // Extra settle time for async cook
    await new Promise(r => setTimeout(r, 300));
  }

  it('initial render: child has working onclick handlers', async () => {
    await loadTestPage();
    const health = await getHealthCheck();
    console.log('Initial health:', JSON.stringify(health.checks, null, 2));
    assert.ok(health.pass, `Initial render failed: ${health.checks.filter(c => !c.pass).map(c => c.name).join(', ')}`);
  });

  it('toggle cycle 1: hide then show preserves handlers', async () => {
    await loadTestPage();
    page._dereferenceErrors = [];

    // Hide
    await toggleChild(false);
    // Verify child is gone
    const childGone = await page.evaluate(() => {
      const parent = document.querySelector('toggle-parent');
      return !parent?.shadowRoot?.querySelector('toggle-child');
    });
    assert.ok(childGone, 'Child should be removed when showChild=false');

    // Show
    await toggleChild(true);
    await waitForChildRendered();

    const health = await getHealthCheck();
    console.log('Cycle 1 health:', JSON.stringify(health.checks, null, 2));
    console.log('Dereference errors:', page._dereferenceErrors);

    assert.equal(page._dereferenceErrors.length, 0,
      `Cycle 1 dereference errors:\n${page._dereferenceErrors.join('\n')}`);
    assert.ok(health.pass,
      `Cycle 1 health failed: ${health.checks.filter(c => !c.pass).map(c => c.name).join(', ')}`);
  });

  it('toggle cycle 2: second hide/show still preserves handlers', async () => {
    await loadTestPage();
    page._dereferenceErrors = [];

    // Cycle 1
    await toggleChild(false);
    await toggleChild(true);
    await waitForChildRendered();

    // Cycle 2
    page._dereferenceErrors = [];
    await toggleChild(false);
    await toggleChild(true);
    await waitForChildRendered();

    const health = await getHealthCheck();
    console.log('Cycle 2 health:', JSON.stringify(health.checks, null, 2));
    console.log('Dereference errors:', page._dereferenceErrors);

    assert.equal(page._dereferenceErrors.length, 0,
      `Cycle 2 dereference errors:\n${page._dereferenceErrors.join('\n')}`);
    assert.ok(health.pass,
      `Cycle 2 health failed: ${health.checks.filter(c => !c.pass).map(c => c.name).join(', ')}`);
  });

  it('toggle cycle 4: four cycles without progressive degradation', async () => {
    await loadTestPage();

    for (let i = 1; i <= 4; i++) {
      page._dereferenceErrors = [];
      await toggleChild(false);
      await toggleChild(true);
      await waitForChildRendered();

      const health = await getHealthCheck();
      console.log(`Cycle ${i} pass=${health.pass} errors=${page._dereferenceErrors.length}`);

      assert.equal(page._dereferenceErrors.length, 0,
        `Cycle ${i} dereference errors:\n${page._dereferenceErrors.join('\n')}`);
      assert.ok(health.pass,
        `Cycle ${i} health failed: ${health.checks.filter(c => !c.pass).map(c => c.name).join(', ')}`);
    }
  });

  it('child button click actually fires handler after toggle', async () => {
    await loadTestPage();

    // Toggle off and on
    await toggleChild(false);
    await toggleChild(true);
    await waitForChildRendered();

    // Click the "Child Action" button inside shadow DOM
    const clicked = await page.evaluate(() => {
      const parent = document.querySelector('toggle-parent');
      const child = parent?.shadowRoot?.querySelector('toggle-child');
      const btn = child?.shadowRoot?.querySelector('button');
      if (!btn) return { clicked: false, reason: 'button not found' };
      try {
        btn.click();
        return { clicked: true };
      } catch (e) {
        return { clicked: false, reason: e.message };
      }
    });

    assert.ok(clicked.clicked, `Click failed: ${clicked.reason}`);

    // Verify state was updated by the handler
    await new Promise(r => setTimeout(r, 500));
    const clickCount = await page.evaluate(() => getState('TestState').childClicks);
    assert.ok(clickCount >= 1, `Expected childClicks >= 1, got ${clickCount}`);
  });

  it('TD logs show full lifecycle on toggle', async () => {
    await loadTestPage();
    page._tdLogs = [];

    await toggleChild(false);
    await toggleChild(true);
    await waitForChildRendered();

    const disconnects = page._tdLogs.filter(l => l.includes('disconnectedCallback'));
    const connects = page._tdLogs.filter(l => l.includes('connectedCallback'));
    const refreshes = page._tdLogs.filter(l => l.includes('REFRESH-SHADOW') || l.includes('FIRST-SHADOW'));

    console.log(`TD lifecycle: ${disconnects.length} disconnects, ${connects.length} connects, ${refreshes.length} shadow refreshes`);
    console.log('All TD logs:');
    page._tdLogs.forEach(l => console.log('  ', l));

    assert.ok(disconnects.length > 0, 'Expected disconnectedCallback logs for removed child');
    assert.ok(connects.length > 0, 'Expected connectedCallback logs for re-added child');
  });
});
