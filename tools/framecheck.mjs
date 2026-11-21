// tools/framecheck.mjs: every contact measured from the meshes AT ITS ANIMATION FRAMES (during the 2.5 mm give, at both
// extremes of the roll, at the top of the knee lift): the palm and all five digits within 0-1.5 mm, the forearm never
// inside. Writes checks/contact-frames.json.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + '?render=1&samples=1&w=320&h=180');
  const rows = await page.evaluate(() => {
    const W = window.WORLD, P = W.P, out = [];
    const C = [['tone_R', 15.6], ['tone_R', 16.6], ['knee_R', 20.5], ['tone_L', 25.8], ['tone_L', 26.8], ['knee_L', 30.7], ['hipflex_R', 37.5], ['hipflex_L', 40.3], ['hipext_R', 45.5], ['hipext_L', 48.3], ['kneeflex_R', 53.5], ['kneeflex_L', 56.3], ['kneeext_R', 62.0], ['kneeextAux_R', 62.0], ['kneeext_L', 64.6], ['kneeextAux_L', 64.6], ['dorsi_R', 69.3], ['dorsi_L', 71.7], ['plantar_R', 77.0], ['plantar_L', 79.3]];
    for (const [id, t] of C) {
      window.FORCE_POSE = true; W.update(t + 1e-6); window.FORCE_POSE = false;
      const [name, side] = id.split('_'), aux = name === 'kneeextAux', h = aux ? (side === 'R' ? 'L' : 'R') : side, leg = aux ? (side === 'R' ? 'L' : 'R') : side;
      const r = CONTACT.review(P, W.EX[h], aux ? [leg, side] : [leg]), g = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, +(v.gap * 100).toFixed(2)]));
      out.push({ contact: id, t, ok: ['palm', 'thumb', 'index', 'middle', 'ring', 'little'].every((k) => g[k] >= 0 && g[k] <= 1.5) && g.forearm >= 0, gapsMm: g, leg: P.leg(leg) });
    }
    return out;
  });
  fs.mkdirSync(path.join(ROOT, 'checks'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'checks', 'contact-frames.json'), JSON.stringify({ checked: new Date().toISOString(), allOk: rows.every((r) => r.ok), rows }, null, 1));
  for (const r of rows) console.log(r.contact, r.t, r.ok ? 'OK' : 'BAD', JSON.stringify(r.gapsMm));
} finally { await browser.close(); srv.close(); }
