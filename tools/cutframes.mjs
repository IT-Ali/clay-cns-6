// tools/cutframes.mjs: the frames AT every hard cut, 1/30 s apart, 3 frames each side (the frame of the cut and 3 before,
// 3 after), rendered exactly as render.mjs does (window.seek(i / 30)), captions on, into checks/transitions/cut_<time>.jpg.
// For each frame it records which camera run is on, the leg pose, and both hands (wrist position and finger pose), and
// confirms that the camera, the pose and the hands change on the SAME frame: no frame shows the new camera with the old
// pose, and a stop-motion step (every 2 frames at 30 fps) never falls between the cut frame and the next one.
// Writes checks/transitions/cuts.json.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const OUT = path.join(ROOT, 'checks', 'transitions');
fs.mkdirSync(OUT, { recursive: true });
const TW = 480, TH = 270;
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const page = await openPage(browser, url + `?render=1&samples=1&w=${TW}&h=${TH}&captions=1`);
  // a hard cut: a new run whose first shot differs from where the previous run ended (6.5 s continues the overview)
  const cuts = await page.evaluate(() => { const R = window.WORLD.RUNS; return R.slice(1).filter((r, i) => r[0][1] !== R[i][R[i].length - 1][1]).map((r) => ({ at: window.WORLD.runAt(r[0][0] + 0.2).t0, name: r[0][1] })); });
  const all = [];
  for (const cut of cuts) {
    const f0 = Math.round(cut.at * 30), frames = [];
    for (let i = f0 - 3; i <= f0 + 3; i++) frames.push(i);
    const res = await page.evaluate(({ frames, cut, TW, TH }) => {
      const W = window.WORLD, cv = document.getElementById('c'), c = document.createElement('canvas');
      c.width = frames.length * TW; c.height = TH + 58; const x = c.getContext('2d'); x.fillStyle = '#0d3a3d'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#f8eedb'; x.font = '600 18px Fredoka, sans-serif'; x.fillText(`HARD CUT to ${cut.name} at ${cut.at.toFixed(4)} s (frame ${Math.round(cut.at * 30)}): frames every 1/30 s`, 8, 21);
      const rows = [];
      const r3 = (v) => v.toArray().map((q) => +q.toFixed(4));
      frames.forEach((i, k) => {
        const t = i / 30; window.CAPTIONS = true; window.seek(t, 1);
        const run = W.runAt(t), hands = {};
        for (const h of ['R', 'L']) { const g = W.EX[h].hand.group; g.updateMatrixWorld(true); hands[h] = { wrist: r3(g.getWorldPosition(new THREE.Vector3())), quat: g.getWorldQuaternion(new THREE.Quaternion()).toArray().map((q) => +q.toFixed(4)) }; }
        rows.push({ frame: i, t: +t.toFixed(4), poseTime: +window.SET.poseTime(t).toFixed(4), camRun: run.keys[0][1] + '@' + run.t0.toFixed(4), cam: r3(W.S.camera.position), legs: JSON.stringify({ R: W.P.leg('R'), L: W.P.leg('L') }), hands: JSON.stringify(hands) });
        x.drawImage(cv, k * TW, 30, TW, TH);
        x.fillStyle = i === Math.round(cut.at * 30) ? '#ffd36b' : '#f8eedb'; x.font = '600 14px Fredoka, sans-serif';
        x.fillText(`f${i}  ${t.toFixed(3)} s  pose ${window.SET.poseTime(t).toFixed(3)}${i === Math.round(cut.at * 30) ? '  <- cut' : ''}`, k * TW + 6, TH + 50);
      });
      return { rows, jpg: c.toDataURL('image/jpeg', 0.85).split(',')[1] };
    }, { frames, cut, TW, TH });
    const R = res.rows, ch = (k) => R.slice(1).map((r, j) => r[k] !== R[j][k]);   // changed vs the previous frame (index j+1)
    const cam = ch('camRun'), legs = ch('legs'), hands = ch('hands'), camF = R[1 + cam.indexOf(true)]?.frame;
    // the camera changes once, at the cut frame (index 3); the legs and the hands change only on the pose steps (every 2nd
    // frame at 30 fps), which fall ON the cut frame, never on the frame just before or just after it, so no frame shows the
    // new camera with the old pose or hands (or the old camera with the new ones)
    const odd = (arr) => arr.some((c, j) => c && (j + 1 - 3) % 2 !== 0);
    const ok = camF === R[3].frame && cam.filter(Boolean).length === 1 && !odd(legs) && !odd(hands);
    const rec = { cut: cut.name, at: +cut.at.toFixed(4), cutFrame: R[3].frame, cameraChangesAt: camF, legsChangeAt: R.slice(1).filter((r, j) => legs[j]).map((r) => r.frame), handsChangeAt: R.slice(1).filter((r, j) => hands[j]).map((r) => r.frame), onPoseGrid: Math.abs(cut.at * 15 - Math.round(cut.at * 15)) < 1e-6, ok, frames: R.map((r) => ({ frame: r.frame, t: r.t, poseTime: r.poseTime, camRun: r.camRun, cam: r.cam })) };
    all.push(rec);
    fs.writeFileSync(path.join(OUT, `cut_${cut.at.toFixed(3)}_${cut.name}.jpg`), Buffer.from(res.jpg, 'base64'));
    console.log(rec.cut, rec.at, 'cut frame', rec.cutFrame, 'camera', rec.cameraChangesAt, 'legs', rec.legsChangeAt.join(','), 'hands', rec.handsChangeAt.join(','), rec.ok ? 'OK' : 'BAD');
  }
  fs.writeFileSync(path.join(OUT, 'cuts.json'), JSON.stringify({ checked: new Date().toISOString(), allOk: all.every((r) => r.ok), cuts: all }, null, 1));
  console.log('allOk', all.every((r) => r.ok));
} finally { await browser.close(); srv.close(); }
