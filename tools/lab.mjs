// tools/lab.mjs: open the page (software WebGL here), optionally run a script in it, optionally save stills.
//   node tools/lab.mjs --q "samples=4&w=960&h=540" --eval file.js [--gpu]
import fs from 'node:fs';
import { serve, launch, openPage } from './common.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const { srv, url } = await serve();
const browser = await launch({ gpu: process.argv.includes('--gpu') });
const t0 = Date.now();
try {
  const page = await openPage(browser, url + '?render=1&' + (arg('q', '')), {});
  console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  const f = arg('eval');
  if (f) {
    const res = await page.evaluate(fs.readFileSync(f, 'utf8'));
    if (res && res.__files) { for (const [name, b64] of Object.entries(res.__files)) fs.writeFileSync(name, Buffer.from(b64, 'base64')); delete res.__files; }
    console.log(typeof res === 'string' ? res : JSON.stringify(res, null, 1));
  }
} finally { await browser.close(); srv.close(); }
