// tools/transitions.mjs: the TRANSITIONS SCAN. At every camera change of the schedule (each hard cut and each camera
// move in the style's RUNS), a strip of frames every 1/8 s in software at a low sample count, captions on, into
// checks/transitions/<nn>_<kind>_<time>.jpg (each tile carries its time). Cuts: 1 s before to 1 s after. Moves: from
// 0.25 s before to 0.25 s after the move.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const OUT = path.join(ROOT, 'checks', 'transitions');
fs.mkdirSync(OUT, { recursive: true });
const TW = 384, TH = 216;
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + `?render=1&samples=1&w=${TW}&h=${TH}&captions=1`);
  const list = await page.evaluate(() => {
    const R = window.WORLD.RUNS, out = [];
    R.forEach((run, i) => {
      const t0 = run[0][0];
      if (i > 0) out.push({ kind: 'cut', name: run[0][1], at: t0, from: t0 - 1, to: t0 + 1 });
      // a move: consecutive keys of different shots inside a run
      for (let k = 0; k < run.length - 1; k++) if (run[k][1] !== run[k + 1][1]) {
        let e = k + 1; while (e < run.length - 1 && run[e + 1][1] !== run[e][1]) e++;
        out.push({ kind: 'move', name: run[k][1] + '-' + run[e][1], at: run[k][0], from: run[k][0] - 0.25, to: run[e][0] + 0.25 }); k = e - 1;
      }
    });
    return out;
  });
  const D = await page.evaluate(() => window.DURATION);
  let n = 0;
  for (const tr of list) {
    const times = []; for (let t = Math.max(0, tr.from); t <= Math.min(D - 1 / 30, tr.to) + 1e-6; t += 0.125) times.push(+t.toFixed(4));
    const jpg = await page.evaluate(({ times, tr, TW, TH }) => {
      const cols = 6, rows = Math.ceil(times.length / cols), c = document.createElement('canvas'); c.width = cols * TW; c.height = rows * (TH + 20) + 30;
      const x = c.getContext('2d'); x.fillStyle = '#0d3a3d'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#f8eedb'; x.font = '600 18px Fredoka, sans-serif'; x.fillText(`${tr.kind === 'cut' ? 'HARD CUT to ' + tr.name : 'MOVE ' + tr.name} at ${tr.at.toFixed(2)} s (frames every 1/8 s)`, 8, 21);
      const cv = document.getElementById('c');
      times.forEach((t, k) => {
        window.CAPTIONS = true; window.seek(t, 1);
        const X = (k % cols) * TW, Y = 30 + Math.floor(k / cols) * (TH + 20);
        x.drawImage(cv, X, Y, TW, TH);
        x.fillStyle = Math.abs(t - tr.at) < 1e-6 ? '#ffd36b' : '#f8eedb'; x.font = '600 14px Fredoka, sans-serif'; x.fillText(t.toFixed(3) + ' s' + (Math.abs(t - tr.at) < 1e-6 ? '  <- ' + tr.kind : ''), X + 4, Y + TH + 15);
      });
      return c.toDataURL('image/jpeg', 0.85).split(',')[1];
    }, { times, tr, TW, TH });
    n++;
    const f = path.join(OUT, `${String(n).padStart(2, '0')}_${tr.kind}_${tr.at.toFixed(2)}_${tr.name}.jpg`);
    fs.writeFileSync(f, Buffer.from(jpg, 'base64'));
    console.log(path.basename(f), times.length, 'frames');
  }
  fs.writeFileSync(path.join(OUT, 'list.json'), JSON.stringify(list, null, 1));
} finally { await browser.close(); srv.close(); }
