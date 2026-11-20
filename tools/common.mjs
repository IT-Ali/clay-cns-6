// tools/common.mjs: a static file server for the project folder and a browser launcher.
// GPU mode (your PC): Chrome with the GPU (D3D11 on Windows). Software mode (a cloud machine with no GPU): SwiftShader.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };

export function serve(port = 0) {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(port, '127.0.0.1', () => ok({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}

// gpu: true = Chrome with the GPU (D3D11 on Windows); false = software WebGL (SwiftShader)
export async function launch({ gpu = false } = {}) {
  const { chromium } = await import('playwright');
  const args = gpu
    ? ['--use-angle=' + (process.platform === 'win32' ? 'd3d11' : 'default'), '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--autoplay-policy=no-user-gesture-required']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-gl=angle', '--autoplay-policy=no-user-gesture-required'];
  const opts = { headless: true, args };
  // on your PC use the installed Google Chrome (no browser download needed); on the build machine the bundled Chromium
  if (gpu && !process.env.PW_BUNDLED) opts.channel = 'chrome';
  const browser = await chromium.launch(opts);
  return browser;
}

export async function openPage(browser, url, { width = 1920, height = 1080, timeout = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width: Math.min(width, 1920), height: Math.min(height, 1080) } });
  page.setDefaultTimeout(timeout);
  page.on('console', (m) => { if (m.type() === 'error' || process.env.VERBOSE) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.READY || window.LOAD_ERROR, null, { timeout: 0, polling: 500 });
  const err = await page.evaluate(() => window.LOAD_ERROR || null);
  if (err) throw new Error(err);
  return page;
}

// copy the canvas into a PNG buffer
export async function grab(page) {
  const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
  return Buffer.from(b64, 'base64');
}
