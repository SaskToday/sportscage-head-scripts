#!/usr/bin/env node
/**
 * Capture versioned widget snapshots (form + success + config JSON).
 *
 * Usage (from signup-worker/):
 *   npm run snapshot:widgets
 *   npm run snapshot:widgets -- --only sasktoday
 *   npm run snapshot:widgets -- --port 8765
 *
 * Output (repo root):
 *   widget-snapshots/<key>/<nlVersion>+shell-<shellVersion>/
 *     form.png
 *     success.png
 *     config.json
 *   widget-snapshots/manifest.json
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(ROOT, 'widget-snapshots');
const CHROME =
  process.env.CHROME_PATH ||
  [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].find((p) => existsSync(p));

const PREVIEW_KEYS = [
  'regina-today',
  'saskatoon-today',
  'estevan-today',
  'sasktoday',
  'saskag-today',
  'sportscage',
  'crime-cops-court'
];

function parseArgs(argv) {
  const opts = { only: null, port: 8765, keepServer: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') opts.only = argv[++i];
    else if (a === '--port') opts.port = Number(argv[++i]) || 8765;
    else if (a === '--keep-server') opts.keepServer = true;
  }
  return opts;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.json': 'application/json'
    }[ext] || 'application/octet-stream'
  );
}

function startStaticServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
        let rel = decodeURIComponent(url.pathname);
        if (rel.endsWith('/')) rel += 'index.html';
        const filePath = path.normalize(path.join(rootDir, rel));
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (!existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'content-type': contentType(filePath) });
        createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function waitForPort(port, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/previews/sasktoday.html`);
      if (res.ok || res.status === 404) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function ensureServer(port) {
  if (await waitForPort(port, 800)) {
    return { server: null, started: false };
  }
  const server = await startStaticServer(ROOT, port);
  if (!(await waitForPort(port, 5000))) {
    server.close();
    throw new Error(`Static server on ${port} did not become ready`);
  }
  return { server, started: true };
}

async function snapshotKey(page, port, key) {
  const previewPath = `/previews/${key}.html`;
  const previewFile = path.join(ROOT, 'previews', `${key}.html`);
  if (!existsSync(previewFile)) {
    console.warn(`skip ${key}: no preview at previews/${key}.html`);
    return null;
  }

  await page.goto(`http://127.0.0.1:${port}${previewPath}`, {
    waitUntil: 'networkidle0',
    timeout: 45000
  });
  await page.waitForSelector('.st-tl-wrap', { timeout: 15000 });
  // Give webfonts a beat
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await new Promise((r) => setTimeout(r, 250));

  const meta = await page.evaluate((newsletterKey) => {
    const api = window.SaskTodayNewsletter;
    const config = api.NEWSLETTERS[newsletterKey];
    const shellVersion = api.WIDGET_VERSION;
    const widgetVersion = api.buildWidgetVersion(newsletterKey, config);
    return {
      key: newsletterKey,
      shellVersion,
      newsletterVersion: config.version || '0.0.0',
      widgetVersion,
      config
    };
  }, key);

  const folderName = `${meta.newsletterVersion}+shell-${meta.shellVersion}`;
  const outDir = path.join(OUT_ROOT, key, folderName);
  await fs.mkdir(outDir, { recursive: true });

  const wrap = await page.$('.st-tl-wrap');
  if (!wrap) throw new Error(`No .st-tl-wrap for ${key}`);
  await wrap.screenshot({ path: path.join(outDir, 'form.png'), type: 'png' });

  // Success state (same shell UX for every newsletter)
  await page.evaluate(() => {
    const root = document.querySelector('.st-tl-card');
    const whisker = root.querySelector('.st-tl-card__whisker');
    const headline = root.querySelector('.st-tl-card__headline');
    const signup = root.querySelector('.st-nl-signup');
    const success = root.querySelector('.st-nl-success');
    const title = root.querySelector('.st-nl-success__title');
    const msg = root.querySelector('.st-nl-success__message');
    const check = root.querySelector('.st-nl-success__check');
    if (whisker) whisker.hidden = true;
    if (headline) headline.hidden = true;
    if (signup) signup.hidden = true;
    if (success) success.hidden = false;
    if (msg) {
      msg.textContent =
        "Thanks! Please check your inbox — if you're a new subscriber, we may need you to confirm your subscription.";
    }
    if (check) {
      check.classList.remove('is-animating');
      void check.offsetWidth;
      check.classList.add('is-animating');
    }
    if (title && typeof title.focus === 'function') {
      title.focus({ preventScroll: true });
    }
  });
  await new Promise((r) => setTimeout(r, 900));
  await wrap.screenshot({ path: path.join(outDir, 'success.png'), type: 'png' });

  const configPayload = {
    capturedAt: new Date().toISOString(),
    key: meta.key,
    newsletterVersion: meta.newsletterVersion,
    shellVersion: meta.shellVersion,
    widgetVersion: meta.widgetVersion,
    preview: `previews/${key}.html`,
    config: meta.config
  };
  await fs.writeFile(
    path.join(outDir, 'config.json'),
    JSON.stringify(configPayload, null, 2) + '\n'
  );

  console.log(`✓ ${meta.widgetVersion} → ${path.relative(ROOT, outDir)}`);
  return {
    key: meta.key,
    newsletterVersion: meta.newsletterVersion,
    shellVersion: meta.shellVersion,
    widgetVersion: meta.widgetVersion,
    path: path.relative(ROOT, outDir).split(path.sep).join('/'),
    files: ['form.png', 'success.png', 'config.json']
  };
}

async function writeManifest(entries) {
  const existingPath = path.join(OUT_ROOT, 'manifest.json');
  let prev = { snapshots: [] };
  if (existsSync(existingPath)) {
    try {
      prev = JSON.parse(await fs.readFile(existingPath, 'utf8'));
    } catch {
      prev = { snapshots: [] };
    }
  }
  const byId = new Map();
  for (const s of prev.snapshots || []) {
    byId.set(s.widgetVersion || `${s.key}@${s.newsletterVersion}+${s.shellVersion}`, s);
  }
  for (const s of entries) {
    if (s) byId.set(s.widgetVersion, { ...s, updatedAt: new Date().toISOString() });
  }
  const snapshots = [...byId.values()].sort((a, b) =>
    String(a.widgetVersion).localeCompare(String(b.widgetVersion))
  );
  const manifest = {
    updatedAt: new Date().toISOString(),
    snapshots
  };
  await fs.writeFile(existingPath, JSON.stringify(manifest, null, 2) + '\n');
}

async function main() {
  if (process.env.SKIP_WIDGET_SNAPSHOTS === '1') {
    console.log('SKIP_WIDGET_SNAPSHOTS=1 — not capturing snapshots');
    return;
  }

  const opts = parseArgs(process.argv.slice(2));
  if (!CHROME) {
    console.error('No Chrome/Chromium found. Set CHROME_PATH.');
    process.exit(1);
  }

  const keys = opts.only ? [opts.only] : PREVIEW_KEYS;
  const { server, started } = await ensureServer(opts.port);
  console.log(
    started
      ? `Started static server on :${opts.port}`
      : `Using existing server on :${opts.port}`
  );

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 2 });
    const entries = [];
    for (const key of keys) {
      entries.push(await snapshotKey(page, opts.port, key));
    }
    await writeManifest(entries.filter(Boolean));
    console.log(`\nManifest → ${path.relative(ROOT, path.join(OUT_ROOT, 'manifest.json'))}`);
  } finally {
    await browser.close();
    if (server && !opts.keepServer) server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
