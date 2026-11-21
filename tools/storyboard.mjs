// tools/storyboard.mjs: renders the storyboard panels (one key frame per step of each beat, captions on) and the review
// panels a-e (plan, tone contacts, power contacts, trouser cuffs, muscles) by SEEKING THE STYLE ITSELF: every panel is
// the animation frame at that time, with the same shot and the same solved poses (no copies). Review panels carry
// arrows and gap numbers measured from the meshes (point-to-triangle) at render time.
//   node tools/storyboard.mjs [--samples 16] [--rsamples 8] [--only id,id] [--w 960 --h 540]
// Output: out/storyboard/panels/<id>.jpg and out/storyboard/storyboard.json. Resumable (existing panels are kept).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const W = +opt('w', 960), H = +opt('h', 540), SB = +opt('samples', 16), SR = +opt('rsamples', 8);
const only = opt('only') ? opt('only').split(',') : null;
const OUT = path.join(ROOT, 'out', 'storyboard'), PAN = path.join(OUT, 'panels');
fs.mkdirSync(PAN, { recursive: true });

// ---------------------------------------------------------------- the panels
// beat panels: [id, beat, time, what moves / changes, camera, sounds]
const BEAT = [
  ['b01a', 1, 0.0, 'The CNS home shot, held still for 1 s (no breathing, no lamp flicker): reclined at 45 degrees on one pillow, trousers rolled above the knees, sheet folded at the foot, arms resting, the gloved hands resting flat at his right side.', 'SET.HOME_CNS, still 0-1.0 s', 'Room ambience fades in over 0.5 s'],
  ['b01b', 1, 4.6, 'A slow push-in toward both legs; his face stays in frame for the question in beat 2.', 'One continuous dolly from the home shot to "overview" (1.0-4.6 s)', 'Room ambience'],
  ['b02a', 2, 5.9, 'HOLD 5.0-6.5 s (the examiner asks about pain in the hips, knees or legs). He answers "no": silent visemes E-O-M at 5.85-6.45 s, no sound. No caption.', '"overview", still', 'None (speech added later)'],
  ['b02b', 2, 9.5, 'The camera travels slowly along both legs: above the knees, the knees, the shins, the calves, the feet. Hands at rest.', 'One continuous move 6.5-12.7 s: insThigh, insKnee, insShin, insCalf, insFeet', 'Room ambience'],
  ['b02c', 2, 12.7, 'The feet, both lying the same way.', 'insFeet', 'Room ambience'],
  ['b03a', 3, 413 / 30, 'HOLD 13.0-14.5 s (the examiner asks him to let his legs go floppy). No caption.', 'Hard cut to "toneR": from his right side, low, at knee height, the whole leg', 'None'],
  ['b03b', 3, 15.6, "The examiner's right palm on the front of the lower thigh and knee rolls the leg: externally rotated (hipRot +25), the foot flops out.", 'toneR, still', 'Soft mattress rustle on each turn'],
  ['b03c', 3, 16.6, 'Rolled in (hipRot -25), the foot flops in; twice in all (15.1-19.1 s).', 'toneR', 'Soft rustle'],
  ['b03d', 3, 20.5, 'The hand slides under the knee (palm up), lifts it briskly (knee 20 -> 45 degrees in 0.4 s, about 15 cm): the heel slides up the bed and stays on it; then lowered gently.', 'toneR', 'Rustle of the heel sliding'],
  ['b04a', 4, 26.3, 'Hard cut to his LEFT (the examiner has walked round): the same roll of the left leg.', '"toneL": from his left side, across the bed', 'Soft rustles'],
  ['b04b', 4, 30.7, 'The left knee lifted briskly, the heel sliding on the bed; lowered; then a hard cut back to his right side (33.6 s).', 'toneL, then a cut to hipflexR', 'Rustle'],
  ['b05a', 5, 1043 / 30, 'HOLD 34.0-35.5 s (instruction). No caption.', 'hipflexR: from his right side at bed height', 'None'],
  ['b05b', 5, 37.5, "He lifts his straight right leg about 30 cm (hipFlex 21); the examiner's palm presses down just above the knee; he holds (the leg gives 2.5 mm, then holds).", 'hipflexR', 'Rustle as the leg lifts'],
  ['b05c', 5, 40.3, 'Hard cut to his LEFT: the same.', 'hipflexL', 'Rustle as the leg is lowered'],
  ['b06a', 6, 42.7, 'HOLD 42.0-43.5 s. No caption.', 'hipextR: from his right side, low', 'None'],
  ['b06b', 6, 45.5, "The examiner's palm under his right heel lifts it 5 cm; he pushes down into the hand and holds (the hand does not rise).", 'hipextR', 'Rustle'],
  ['b06c', 6, 48.3, 'Hard cut to his LEFT: the same.', 'hipextL', 'Rustle'],
  ['b07a', 7, 1523 / 30, 'HOLD 50.0-51.5 s. No caption.', 'kneeflexR: from his right side', 'None'],
  ['b07b', 7, 53.5, 'Knee bent, foot flat on the bed; the palm cups the back of the heel; he pulls the heel in and holds (the hamstrings firm).', 'kneeflexR', 'Rustle as the heel slides up'],
  ['b07c', 7, 56.3, 'Hard cut to his LEFT: the same.', 'kneeflexL', 'Rustle'],
  ['b08a', 8, 1763 / 30, 'HOLD 58.0-59.5 s. No caption.', 'kneeextR: from his right side', 'None'],
  ['b08b', 8, 62.0, "Knee bent 60 degrees over the examiner's left forearm (heel on the bed); the right palm on the lower shin; he straightens against it and holds (the quadriceps firms).", 'kneeextR', 'Rustle'],
  ['b08c', 8, 64.6, 'Hard cut to his LEFT: the same.', 'kneeextL', 'Rustle'],
  ['b09a', 9, 2003 / 30, 'HOLD 66.0-67.5 s. No caption.', 'dorsiR: from his right side at ankle height', 'None'],
  ['b09b', 9, 69.3, 'He pulls the foot up (ankle +15); the palm lies across the top of the middle of the foot (over the metatarsals), the fingers across the foot, pressing down; he holds (tibialis anterior stands out).', 'dorsiR: from his side at ankle height', 'Very soft rustle'],
  ['b09c', 9, 71.7, 'Hard cut to his LEFT: the same.', 'dorsiL', 'None'],
  ['b10a', 10, 74.2, 'HOLD 73.5-75.0 s. No caption.', 'plantarR: from his right side at ankle height', 'None'],
  ['b10b', 10, 77.0, 'The palm flat on the ball of the foot; he pushes the foot clearly down like a pedal (ankle -30) and holds (the calf firms).', 'plantarR: from his side at ankle height', 'Very soft rustle'],
  ['b10c', 10, 79.3, 'Hard cut to his LEFT: the same; then a hard cut back to his right side (81.0 s).', 'plantarL', 'None'],
  ['b11a', 11, 82.6, 'Both legs straight, the hands at rest; the camera pulls back.', 'One continuous move plantarR -> home (81.3-84.0 s)', 'Room ambience'],
  ['b11b', 11, 84.98, 'The CNS home shot, held still for the last second: pixel-identical to the first frame.', 'SET.HOME_CNS, still 84.0-85.0 s', 'Room ambience fades out over the last 0.5 s'],
];
// review panels: { id, group, t, title, cam ('contact:<id>' close side view | 'plan' | object), gaps: [contactId], heel: side, firmOff }
const REV = [{ id: 'ra_plan', group: 'a', t: 2.0, title: 'Plan: his RIGHT and LEFT, the examiner on his right, and where the examiner stands for the left-side tests', cam: 'plan' }];
const TONE = [['15.6', 'R', 'roll out (hipRot +25)', 'tone_R'], ['16.6', 'R', 'roll in (hipRot -25)', 'tone_R'], ['20.5', 'R', 'knee lift, highest point', 'knee_R'], ['25.8', 'L', 'roll out (hipRot +25)', 'tone_L'], ['26.8', 'L', 'roll in (hipRot -25)', 'tone_L'], ['30.7', 'L', 'knee lift, highest point', 'knee_L']];
for (const [t, s, what, c] of TONE) REV.push({ id: `rb_${c}_${t}`, group: 'b', t: +t, title: `Tone, ${s === 'R' ? 'right' : 'left'} leg: ${what}` + (what.startsWith('knee') ? ' (the scheduled shot: the whole leg and the heel)' : ''), cam: what.startsWith('knee') ? null : 'contact:' + c, gaps: [c], heel: what.startsWith('knee') ? s : null });
const POW = [['hipflex', 37.5, 40.3, 'Hip flexion: palm on the front of the thigh just above the knee'], ['hipext', 45.5, 48.3, 'Hip extension: palm under the heel, heel 5 cm up'], ['kneeflex', 53.5, 56.3, 'Knee flexion: palm cupping the back of the heel, foot flat'], ['kneeext', 62.0, 64.6, 'Knee extension: palm on the lower shin; the knee over the other forearm'], ['dorsi', 69.3, 71.7, 'Ankle dorsiflexion: palm on the top of the foot'], ['plantar', 77.0, 79.3, 'Plantar flexion: palm on the ball of the foot']];
for (const [c, tr, tl, title] of POW) for (const [s, t] of [['R', tr], ['L', tl]]) REV.push({ id: `rc_${c}_${s}`, group: 'c', t, title: `${title} (${s === 'R' ? 'right' : 'left'})`, cam: 'contact:' + c + '_' + s, gaps: c === 'kneeext' ? [c + '_' + s, 'kneeextAux_' + s] : [c + '_' + s], heel: ['kneeflex', 'kneeext'].includes(c) ? s : null });
REV.push({ id: 'rd_cuff_R', group: 'd', t: 53.5, title: 'Trouser cuffs, right knee at its most bent (knee 90, foot flat); examiner hidden for this review view only', cam: { pos: [3.6, 11.6, 9.2], target: [0.9, 7.6, 0.0], fov: 28, focus: [1.2, 8.0, 0.6], aperture: 0 }, hideEx: true, noCaption: true });
REV.push({ id: 'rd_cuff_L', group: 'd', t: 56.3, title: 'Trouser cuffs, left knee at its most bent (knee 90, foot flat); examiner hidden for this review view only', cam: { pos: [3.6, 11.6, -9.2], target: [0.9, 7.6, 0.0], fov: 28, focus: [1.2, 8.0, -0.6], aperture: 0 }, hideEx: true, noCaption: true });
REV.push({ id: 're_ta_before', group: 'e', t: 69.5, title: 'Tibialis anterior, foot pulled up: before (no firming)', cam: { pos: [9.2, 8.9, 3.4], target: [4.0, 7.0, 1.25], fov: 28, focus: [4.0, 7.0, 1.3], aperture: 0 }, firmOff: true, noCaption: true, hideEx: true });
REV.push({ id: 're_ta_during', group: 'e', t: 69.5, title: 'Tibialis anterior: during the resistance (stands out on the front of the shin)', cam: { pos: [9.2, 8.9, 3.4], target: [4.0, 7.0, 1.25], fov: 28, focus: [4.0, 7.0, 1.3], aperture: 0 }, noCaption: true, hideEx: true, diffWith: 're_ta_before' });
REV.push({ id: 're_calf_before', group: 'e', t: 77.0, title: 'Calf, foot pushed down: before (no firming)', cam: { pos: [3.4, 6.35, 5.2], target: [3.6, 6.3, 0.9], fov: 28, focus: [3.6, 6.25, 1.3], aperture: 0 }, firmOff: true, noCaption: true, hideEx: true });
REV.push({ id: 're_calf_during', group: 'e', t: 77.0, title: 'Calf: during the resistance (firms)', cam: { pos: [3.4, 6.35, 5.2], target: [3.6, 6.3, 0.9], fov: 28, focus: [3.6, 6.25, 1.3], aperture: 0 }, noCaption: true, hideEx: true, diffWith: 're_calf_before' });

REV.push({ id: 'rf_dorsi_R', group: 'f', t: 69.3, title: 'Ankle dorsiflexion hold (right), from his side at ankle height', cam: null, ankle: 'R', noCaption: true });
REV.push({ id: 'rf_plantar_R', group: 'f', t: 77.0, title: 'Plantar flexion hold (right), the same camera height and side', cam: null, ankle: 'R', noCaption: true });
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
const meta = fs.existsSync(path.join(OUT, 'storyboard.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'storyboard.json'), 'utf8')) : { panels: {} };
const save = () => fs.writeFileSync(path.join(OUT, 'storyboard.json'), JSON.stringify(meta, null, 1));
try {
  const page = await openPage(browser, url + `?render=1&samples=${SB}&w=${W}&h=${H}&captions=1`);
  meta.caps = await page.evaluate(() => window.CNS6.content.CAPTIONS);
  meta.beats = await page.evaluate(() => window.CNS6.content.BEATS);
  const todo = [...BEAT.map((b) => ({ kind: 'beat', id: b[0], beat: b[1], t: b[2], what: b[3], camera: b[4], sound: b[5] })), ...REV.map((r) => Object.assign({ kind: 'review' }, r))].filter((p) => !only || only.includes(p.id));
  for (const p of todo) {
    const f = path.join(PAN, p.id + '.jpg');
    if (fs.existsSync(f) && !only) { console.log('kept', p.id); continue; }
    const t0 = Date.now();
    const r = await page.evaluate(({ p, n, W, H }) => {
      const Wd = window.WORLD, P = Wd.P, V = (x, y, z) => new THREE.Vector3(x, y, z);
      window.FIRM_OFF = !!p.firmOff; window.HIDE_EXAMINER = !!p.hideEx; window.CAPTIONS = !(p.noCaption || p.kind === 'review');
      // the camera: the scheduled shot (beat panels) or a review camera
      window.CAM_OVERRIDE = null; window.CAM_OVERRIDE_CHANGED = true; window.FORCE_POSE = true;
      Wd.update(p.t + 1e-7);                                   // pose the frame (the exact pose of time t: same pose clock)
      let cam = null;
      if (p.cam === 'plan') cam = { pos: [1.2, 40, 7.5], target: [1.2, 6.2, 0.2], fov: 28, focus: [1.2, 6.5, 0], aperture: 0 };
      else if (typeof p.cam === 'string' && p.cam.startsWith('contact:')) {
        const id = p.cam.slice(8), [name, side] = id.split('_'), h = name === 'kneeextAux' ? (side === 'R' ? 'L' : 'R') : side, sz = side === 'R' ? 1 : -1;
        const q = Wd.EX[h].hand.world('palm'), foot = ['hipext', 'kneeflex', 'dorsi', 'plantar'].includes(name);
        const o = foot ? [2.4, 1.6, 7.0] : name === 'knee' ? [3.0, 1.0, 7.6] : [2.6, 2.4, 7.4];
        cam = { pos: [q.x + o[0], q.y + o[1], q.z + sz * o[2]], target: q.toArray(), focus: q.toArray(), fov: 28, aperture: 0 };
      } else if (p.cam && p.cam.knee) {
        const s = p.cam.knee, sz = s === 'R' ? 1 : -1, k = P.legPoint(s, 'knee');
        cam = { pos: [k.x + 1.8, k.y + 2.2, k.z + sz * 6.8], target: [k.x - 0.4, k.y - 0.1, k.z], focus: [k.x - 0.4, k.y, k.z + sz * 0.4], fov: 28, aperture: 0 };
      } else if (p.cam) cam = p.cam;
      window.CAM_OVERRIDE = cam;
      window.seek(p.t, n); window.FORCE_POSE = false; window.CAM_OVERRIDE_CHANGED = false;
      const cv = document.getElementById('c'), out = { legs: { R: P.leg('R'), L: P.leg('L') }, gaps: {} };
      // annotations (review panels only): arrows from each touching part to the skin, with the gap in mm
      const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const x = c2.getContext('2d'); x.drawImage(cv, 0, 0);
      const scr = (v) => { const q = v.clone().project(Wd.S.camera); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; };
      const boxes = [];
      const label = (txt, X, Y, col = '#fff7c2') => { x.font = '600 15px Fredoka, sans-serif'; const w = x.measureText(txt).width + 10; X = Math.max(4, Math.min(X, W - w - 4)); for (let k = 0; k < 20 && boxes.some((b) => X < b[0] + b[2] && X + w > b[0] && Y - 15 < b[1] + 23 && Y + 8 > b[1]); k++) Y += 23; boxes.push([X, Y - 15, w]); x.fillStyle = 'rgba(10,30,32,0.82)'; x.fillRect(X, Y - 15, w, 21); x.fillStyle = col; x.fillText(txt, X + 5, Y + 1); };
      const arrow = (a, b, col) => { const [x1, y1] = scr(a), [x2, y2] = scr(b); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.beginPath(); x.arc(x2, y2, 3.2, 0, 7); x.fill(); x.beginPath(); x.arc(x1, y1, 2.2, 0, 7); x.fill(); return [x1, y1]; };
      let ly = 26;
      if (p.gaps) for (const id of p.gaps) {
        const [name, side] = id.split('_'), aux = name === 'kneeextAux', h = aux ? (side === 'R' ? 'L' : 'R') : side, leg = aux ? (side === 'R' ? 'L' : 'R') : side;
        const legs = aux ? [leg, side] : [leg];
        const res = CONTACT.review(P, Wd.EX[h], legs);
        // ALL five digits and the palm (and the forearm under the knee), measured from the meshes now; a digit is either
        // ON the skin (< 1.5 mm, arrow to the skin) or curled into the hand (dot, its distance to the skin)
        const dig = (Wd.SOLVED.contacts[id] && Wd.SOLVED.contacts[id].digits) || {};
        out.gaps[id] = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { mm: +(v.gap * 100).toFixed(2), leg: v.leg, state: k === 'palm' || k === 'forearm' ? null : (v.gap * 100 < 1.5 && v.gap >= 0 ? 'on skin' : dig[k] && dig[k].state === 'curled' ? 'curled' : 'FLOATING') }]));
        for (const k of ['palm', 'thumb', 'index', 'middle', 'ring', 'little', ...(aux ? ['forearm'] : [])]) {
          const v = res[k]; if (!v || !v.at) continue;
          const mm = v.gap * 100, st = out.gaps[id][k].state, pre = aux && k !== 'forearm' ? 'other hand ' : '';
          if (st === 'curled') { const [X, Y] = scr(v.at); x.fillStyle = '#9fc4ff'; x.beginPath(); x.arc(X, Y, 3.2, 0, 7); x.fill(); label(`${pre}${k} curled into the hand (${mm.toFixed(1)} mm)`, X + 6, Y - 6, '#9fc4ff'); continue; }
          const col = mm < 0 || st === 'FLOATING' ? '#ff5a4f' : '#7dff9a';
          const [X, Y] = v.skin ? arrow(v.at, v.skin, col) : scr(v.at);
          label(`${pre}${k} ${mm.toFixed(2)} mm${st === 'FLOATING' ? ' FLOATING' : ''}`, X + 6, Y - 6, col);
        }
      }
      if (p.ankle) {   // the ankle angle: set (the leg state) and measured from the mesh landmarks (foot line to shin line)
        const set = P.leg(p.ankle).ankle, meas = window.CNS6_FOOT_ANGLE(p.ankle);
        out.ankle = { setDeg: +set.toFixed(1), measuredDeg: +meas.toFixed(1) };
        x.font = '600 26px Fredoka, sans-serif'; const txt = `ankle ${set >= 0 ? '+' : ''}${set.toFixed(1)} deg set, ${meas >= 0 ? '+' : ''}${meas.toFixed(1)} deg measured`, w = x.measureText(txt).width + 24;
        x.fillStyle = 'rgba(10,30,32,0.85)'; x.fillRect(18, H - 58, w, 40); x.fillStyle = '#fff7c2'; x.fillText(txt, 30, H - 29);
      }
      if (p.heel) {   // the heel on the mattress: the lowest point of the foot above the mattress top
        const m = P.legMeshes[p.heel]; m.updateWorldMatrix(true, false); const A = m.geometry.attributes.position, R = m.geometry.attributes.restPos, v = V(0, 0, 0); let best = { g: Infinity };
        for (let i = 0; i < A.count; i++) { if (R.getX(i) < 6.2) continue; v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); const g = v.y - Wd.SH.heightAt(v.x, v.z); if (g < best.g) best = { g, p: v.clone() }; }
        const mm = best.g * 100; out.gaps.heelMattress = +mm.toFixed(2);
        const col = mm < 0 ? '#ff5a4f' : mm <= 1.5 ? '#7dff9a' : '#ffd36b';
        const [X, Y] = arrow(best.p.clone().add(V(0, 0.35, 0)), best.p, col); label(`heel - mattress ${mm.toFixed(2)} mm`, X + 6, Y - 4, col);
      }
      if (p.cam === 'plan') {
        const lab = (txt, v, col) => { const [X, Y] = scr(v); x.font = '600 18px Fredoka, sans-serif'; const w = x.measureText(txt).width + 14; x.fillStyle = 'rgba(10,30,32,0.85)'; x.fillRect(X - w / 2, Y - 16, w, 26); x.fillStyle = col; x.textAlign = 'center'; x.fillText(txt, X, Y + 3); x.textAlign = 'left'; };
        const dot = (v, col) => { const [X, Y] = scr(v); x.fillStyle = col; x.beginPath(); x.arc(X, Y, 9, 0, 7); x.fill(); };
        lab('his RIGHT side (+Z, nearest the camera)', V(1.5, 6.2, 3.1), '#7dff9a'); lab('his LEFT side (-Z, far side)', V(1.5, 6.2, -3.1), '#ffd36b');
        lab('head (screen left)', V(-7.2, 9, 0), '#fff7c2'); lab('feet (screen right)', V(8.6, 6.4, 0), '#fff7c2');
        lab('R leg', P.legPoint('R', 'shinMid').add(V(0, 0.4, 0.15)), '#7dff9a'); lab('L leg', P.legPoint('L', 'shinMid').add(V(0, 0.4, -0.15)), '#ffd36b');
        dot(V(3.0, 6.2, 6.0), '#5a8fd8'); lab('examiner: right-side tests', V(3.0, 6.2, 6.9), '#9fc4ff');
        dot(V(3.0, 6.2, -5.4), '#5a8fd8'); lab('examiner after walking round: left-side tests', V(4.0, 6.2, -4.5), '#9fc4ff');
        lab('bedside table (his left, near his head)', V(-7.5, 9.0, -3.6), '#fff7c2');
        out.check = { R_z: +P.legPoint('R', 'knee').z.toFixed(2), L_z: +P.legPoint('L', 'knee').z.toFixed(2) };
      }
      return { jpg: c2.toDataURL('image/jpeg', 0.9).split(',')[1], out };
    }, { p, n: p.kind === 'beat' ? SB : SR, W, H });
    fs.writeFileSync(f, Buffer.from(r.jpg, 'base64'));
    meta.panels[p.id] = Object.assign({}, p, r.out, { file: 'panels/' + p.id + '.jpg', samples: p.kind === 'beat' ? SB : SR });
    save();
    console.log(p.id, ((Date.now() - t0) / 1000).toFixed(0) + ' s', JSON.stringify(r.out.gaps || {}));
  }
} finally { await browser.close(); srv.close(); }
