// tools/dbg.mjs: quick software stills of chosen times with an automatic or named camera (development only)
//   node tools/dbg.mjs out_dir "t:shot|auto:id,..." [w h samples]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, grab } from './common.mjs';
const [outDir, list, w = 640, h = 360, n = 1] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + `?render=1&samples=${n}&w=${w}&h=${h}`);
  for (const item of list.split(',')) {
    const [t, cam, id] = item.split(':');
    const info = await page.evaluate(({ t, cam, id }) => {
      const Wd = window.WORLD; window.CAM_OVERRIDE = null; window.CAM_OVERRIDE_CHANGED = true;
      if (cam && cam !== 'auto' && cam !== 'tl') window.CAM_OVERRIDE = Wd.SHOTS[cam];
      Wd.update(+t);
      if (cam === 'auto') {
        const side = id.split('_')[1], h = window.EXAMINER_HAND = (id.startsWith('kneeextAux') ? (side === 'R' ? 'L' : 'R') : side);
        const p = Wd.EX[h].hand.world('palm'), sz = side === 'R' ? 1 : -1;
        window.CAM_OVERRIDE = { pos: [p.x + 2.6, p.y + 2.4, p.z + sz * 6.0], target: p.toArray(), focus: p.toArray(), fov: 28, aperture: 0 };
      }
      window.seek(+t); window.CAM_OVERRIDE_CHANGED = false;
      return { leg: { R: Wd.P.leg('R'), L: Wd.P.leg('L') } };
    }, { t, cam, id });
    fs.writeFileSync(path.join(outDir, `${t}_${cam}${id ? '_' + id : ''}.png`), await grab(page));
    console.log(t, cam, id || '', JSON.stringify(Object.fromEntries(Object.entries(info.leg.R).filter(([k, v]) => v))), JSON.stringify(Object.fromEntries(Object.entries(info.leg.L).filter(([k, v]) => v))));
  }
} finally { await browser.close(); srv.close(); }
