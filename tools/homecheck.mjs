// tools/homecheck.mjs: the first and the last frame must be the same CNS home frame, pixel for pixel (software WebGL,
// low sample count). Also checks the frames 1 s in and 1 s from the end (the edges of the home holds). Writes
// home-check.json in the project folder.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const W = 480, H = 270, N = 2;
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + `?render=1&samples=${N}&w=${W}&h=${H}&captions=1`);
  const res = await page.evaluate(() => {
    const D = window.DURATION, F = Math.round(D * 30), cv = document.getElementById('c');
    const grab = (t) => { window.seek(t); const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.drawImage(cv, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const cmp = (a, b) => { let n = 0, m = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d) n++; m = Math.max(m, d); } return { differingPixels: n, maxChannelDiff: m, identical: n === 0 }; };
    const f0 = grab(0), fl = grab((F - 1) / 30), f1 = grab(1.0), fe = grab(D - 1.0), f0b = grab(0);
    return { duration: D, frames: F, lastFrameTime: +((F - 1) / 30).toFixed(4), firstVsLast: cmp(f0, fl), firstVsHoldEnd1s: cmp(f0, f1), firstVsHoldStartLast1s: cmp(f0, fe), firstVsFirstAgain: cmp(f0, f0b) };
  });
  const out = Object.assign({ checked: new Date().toISOString(), renderer: 'software WebGL (SwiftShader)', width: W, height: H, samples: N }, res);
  fs.writeFileSync(path.join(ROOT, 'home-check.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
} finally { await browser.close(); srv.close(); }
