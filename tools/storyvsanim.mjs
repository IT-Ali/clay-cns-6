// tools/storyvsanim.mjs: story_vs_anim.png: for beats 3, 5, 7, 8 and 9, the animation frame at the middle of the hold
// (rendered exactly as render.mjs renders a frame: window.seek(i / 30) on the render page) next to its storyboard panel,
// with the pixel difference. Both come from the same style, shots and solved poses (no copies); the storyboard panel
// is a JPEG, so a small difference from the compression is expected.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const W = 960, H = 540, N = 16;
const PAIRS = [[3, 'b03a', 413], [5, 'b05a', 1043], [7, 'b07a', 1523], [8, 'b08a', 1763], [9, 'b09a', 2003]];
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + `?render=1&samples=${N}&w=${W}&h=${H}&captions=1`);
  const panels = Object.fromEntries(PAIRS.map(([, id]) => [id, 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'out', 'storyboard', 'panels', id + '.jpg')).toString('base64')]));
  const res = await page.evaluate(async ({ PAIRS, panels, W, H }) => {
    const cv = document.getElementById('c'), sw = 640, sh = 360, out = document.createElement('canvas');
    out.width = sw * 2 + 30; out.height = PAIRS.length * (sh + 40) + 10;
    const x = out.getContext('2d'); x.fillStyle = '#0d3a3d'; x.fillRect(0, 0, out.width, out.height);
    const stats = [];
    for (let k = 0; k < PAIRS.length; k++) {
      const [beat, id, i] = PAIRS[k];
      window.CAPTIONS = true; window.seek(i / 30);
      const a = document.createElement('canvas'); a.width = W; a.height = H; const ax = a.getContext('2d'); ax.drawImage(cv, 0, 0);
      const im = new Image(); im.src = panels[id]; await im.decode();
      const b = document.createElement('canvas'); b.width = W; b.height = H; const bx = b.getContext('2d'); bx.drawImage(im, 0, 0, W, H);
      const A = ax.getImageData(0, 0, W, H).data, B = bx.getImageData(0, 0, W, H).data; let sum = 0, mx = 0, over8 = 0;
      for (let p = 0; p < A.length; p += 4) { const d = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2])); sum += d; if (d > mx) mx = d; if (d > 8) over8++; }
      const st = { beat, panel: id, frame: i, t: +(i / 30).toFixed(4), meanDiff: +(sum / (W * H)).toFixed(2), maxDiff: mx, pixelsOver8: over8 };
      stats.push(st);
      const y = 10 + k * (sh + 40);
      x.drawImage(b, 10, y + 26, sw, sh); x.drawImage(a, 20 + sw, y + 26, sw, sh);
      x.fillStyle = '#f8eedb'; x.font = '600 17px Fredoka, sans-serif';
      x.fillText(`Beat ${beat} - storyboard panel ${id} (t = ${st.t} s)`, 10, y + 18);
      x.fillText(`animation frame ${i} (render.mjs path)  -  mean diff ${st.meanDiff}/255, max ${mx}, ${(over8 / (W * H) * 100).toFixed(2)}% of pixels > 8`, 20 + sw, y + 18);
    }
    return { png: out.toDataURL('image/png').split(',')[1], stats };
  }, { PAIRS, panels, W, H });
  fs.writeFileSync(path.join(ROOT, 'story_vs_anim.png'), Buffer.from(res.png, 'base64'));
  fs.writeFileSync(path.join(ROOT, 'checks', 'story_vs_anim.json'), JSON.stringify(res.stats, null, 1));
  console.log(JSON.stringify(res.stats));
} finally { await browser.close(); srv.close(); }
