// tools/sbpage.mjs: builds the storyboard review page (out/storyboard/index.html) from out/storyboard/storyboard.json
// and the rendered panels. The difference images for the muscle panels (e) are made with ffmpeg (blend=difference, x8).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './common.mjs';

const OUT = path.join(ROOT, 'out', 'storyboard');
const M = JSON.parse(fs.readFileSync(path.join(OUT, 'storyboard.json'), 'utf8'));
const solved = JSON.parse(fs.readFileSync(path.join(ROOT, 'solved.json'), 'utf8'));
let FF = 'ffmpeg'; try { FF = (await import('ffmpeg-static')).default || FF; } catch (e) { /* PATH */ }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const P = M.panels;
M.assumptions = [
  'His legs, landmarks and the CNS home are the shared kit v5, unchanged. In that home pose (used in every part) the heel lies 3.3 mm above the mattress and the calf presses 5 mm into the soft mattress; I kept it so the joins match.',
  'Tone, roll: hipRot +-25 degrees, two full cycles in 4 s; the foot flops loosely by lagging the roll (ankle inversion +-9 degrees, a quarter turn behind). The leg is re-seated on each angle so it rests on the mattress as at home.',
  'Tone, knee lift: the palm goes under the knee just below the crease (the hollow itself is concave, so a flat palm cannot lie in it). The back of the glove needs the knee at 19.5 degrees before it clears the mattress, so the hand lifts the knee that far as it slides in, then lifts briskly from 19.5 to 45 degrees in 0.4 s (about 16 cm in all). The heel stays on the mattress throughout (0.05 mm, from a solved table of hip angles).',
  'Hip flexion: hipFlex 21 degrees lifts the heel 29 cm off the bed (asked: about 30 cm). The palm presses on the front of the knee and lower thigh, the only bare skin above the knee, since the trousers are rolled to 5 cm above it.',
  'Hip extension: the heel is lifted 5.0 cm (hipFlex 3.3 degrees); the heel rises 2.6 mm as the fingers come under it, so the hand never goes into the mattress.',
  'Knee flexion: knee 90 degrees, foot flat (hip 51.7, ankle -39.5): the lowest point of the foot touches the mattress (0.05 mm), heel 5.4 mm and ball 6.9 mm, since the foot is turned out 7 degrees in the shared model.',
  "Knee extension: knee 60 degrees with the heel on the bed. The step does not say where the examiner's left hand goes, so it rests on his other knee (the usual technique), and the forearm runs under the bent knee, touching it (0.3 mm right, 0.07 mm left).",
  'Ankle: dorsiflexion +15 degrees, plantar flexion -30 degrees (the foot clearly pointing down), both filmed from his side at ankle height; panel f shows the two holds side by side with the angles measured from the foot and shin landmarks. For plantar flexion the leg pivots very slightly at the hip so the heel does not sink into the bed.',
  'Power: the limb gives 2.5 mm in the direction of the examiner\'s push over 0.2 s and then holds. For hip extension it dips 2.5 mm and the hand does not rise.',
  'Muscle firming (my own code, no added mesh): a smooth outward swell of the skin over the belly while he holds. Tibialis anterior 4.5 mm (a long ridge on the front of the shin), calf 4 mm, quadriceps above the knee 2.5 mm, hamstrings behind the knee 2 mm. It never swells down into the bed. Panel e shows before, during and the difference: the tibialis anterior ridge reads clearly; the calf change is barely visible because the calf lies on the bed. If either reads as a lump to you, or you want the calf firmer, tell me.',
  'Holds: the picture is still and has no caption; the quiet breathing goes on. The only speech is his silent "no" in beat 2 (visemes E-O-M, no sound).',
  'Breathing: 13.7 breaths a minute, exactly 19 breaths between the two home holds, so it starts and stops on the home phase with no jump.',
  'Pupils: 3.5 mm outside the home frames (shared README for the CNS video); the home frames use setFace({}) exactly as the README home code.',
  "Grain: the stage's grain changes every frame; the home-lock frames use frame 0's grain, so the first and last frames are pixel-identical (and match frame 0 of the other parts).",
  'Resting hands: in the push-in the gloved hands slide along the mattress edge to rest nearer his hip (and back in the pull-back), so no resting arm stands next to the low cameras of his legs. A travelling arm stays raised until the hand is nearly down, so it never swings toward the lens.',
  "The examiner's arms: resting hands keep the home-shot arm. A working forearm rises to the elbow and the upper arm rises toward a standing examiner's shoulder, leaning toward his head or feet, so it leaves the frame at a top corner rather than standing between the camera and the contact.",
  'Left-side shots look across the bed from his left; the series lamp is on his right, so his left side is in its soft shade (I did not add a light).',
  'Sound: only the room ambience and very soft rustles when his legs move, roll or slide. Normalising the whole mix to -15 LUFS (the MACHINE rule) raises the quiet room bed to that level, because nothing else is loud. Tell me if you prefer a fixed gain that matches the other parts.',
  'The style kit says "no hard cuts"; MY CONTENT asks for hard cuts when the examiner walks round to his left and back. I followed MY CONTENT.',
  'Fingers and thumb: every digit of a working hand is solved on its own: it bends (all its joints in proportion) until it lies on the skin at 0.05 mm, or, if no skin is within its reach, it is curled into the hand. Nothing hangs in the air. Every gap panel labels all five digits and the palm with values measured from the meshes, and solved.json lists each digit with its state.',
];

// difference images for the muscle firming (before vs during, amplified 8x)
for (const [a, b] of [['re_ta_before', 're_ta_during'], ['re_calf_before', 're_calf_during']]) {
  if (!P[a] || !P[b]) continue;
  const out = path.join(OUT, 'panels', b.replace('during', 'diff') + '.jpg');
  spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(OUT, P[a].file), '-i', path.join(OUT, P[b].file), '-filter_complex', "[0]format=gbrp[a];[1]format=gbrp[b];[a][b]blend=all_mode=difference,lutrgb=r='clip(val*8,0,255)':g='clip(val*8,0,255)':b='clip(val*8,0,255)',format=yuvj444p", '-q:v', '3', out]);
  P[b.replace('during', 'diff')] = { id: b.replace('during', 'diff'), group: 'e', kind: 'review', title: (b.includes('ta') ? 'Tibialis anterior' : 'Calf') + ': where the skin changed (difference before vs during, x8)', file: 'panels/' + path.basename(out) };
}
if (P.rf_dorsi_R && P.rf_plantar_R) {
  const out = path.join(OUT, 'panels', 'rf_ankles.jpg');
  spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(OUT, P.rf_dorsi_R.file), '-i', path.join(OUT, P.rf_plantar_R.file), '-filter_complex', 'hstack=inputs=2', '-q:v', '3', out]);
  P.rf_ankles = { id: 'rf_ankles', group: 'f', kind: 'review', wide: true, title: `The two holds side by side: dorsiflexion ${P.rf_dorsi_R.ankle.measuredDeg >= 0 ? '+' : ''}${P.rf_dorsi_R.ankle.measuredDeg} deg (set +${P.rf_dorsi_R.ankle.setDeg}) and plantar flexion ${P.rf_plantar_R.ankle.measuredDeg} deg (set ${P.rf_plantar_R.ankle.setDeg}), measured foot line to shin line`, file: 'panels/rf_ankles.jpg' };
  delete P.rf_dorsi_R; delete P.rf_plantar_R;
}
const capAt = (t) => (M.caps.find((c) => t >= c.t0 && t <= c.t1) || {}).text || '';
const fmt = (t) => t.toFixed(2).replace(/\.00$/, '.0') + ' s';

const beatCards = M.beats.map((b) => {
  const ps = Object.values(P).filter((p) => p.kind === 'beat' && p.beat === b.n).sort((a, c) => a.t - c.t);
  const caps = M.caps.filter((c) => c.t1 > b.t0 && c.t0 < b.t1);
  return `<section class="beat" id="beat-${b.n}">
    <header><span class="bn">Beat ${b.n}</span><h2>${esc(b.name)}</h2><span class="tm">${fmt(b.t0)} - ${fmt(b.t1)}${b.hold ? ` · hold ${fmt(b.hold[0])} - ${fmt(b.hold[1])} (no caption)` : ''}</span></header>
    <p class="caps">${caps.length ? caps.map((c) => `On screen ${fmt(c.t0)} - ${fmt(c.t1)}: <q>${esc(c.text)}</q>`).join('<br>') : 'No caption.'}</p>
    <div class="grid">${ps.map((p) => `<figure><img src="${p.file}" alt="Beat ${b.n} at ${fmt(p.t)}" loading="lazy" width="960" height="540">
      <figcaption><b>${fmt(p.t)}</b>${capAt(p.t) ? '' : ' · <span class="muted">no caption</span>'}<br>${esc(p.what)}<br><span class="k">Camera</span> ${esc(p.camera)}<br><span class="k">Sound</span> ${esc(p.sound)}</figcaption></figure>`).join('')}</div>
  </section>`;
}).join('\n');

const gapTable = (p) => {
  if (!p.gaps || !Object.keys(p.gaps).length) return '';
  const rows = [];
  for (const [id, parts] of Object.entries(p.gaps)) {
    if (typeof parts === 'number') { rows.push(`<tr><td>heel - mattress</td><td class="n ${parts < 0 ? 'bad' : parts <= 1.5 ? 'ok' : 'warn'}">${parts.toFixed(2)}</td></tr>`); continue; }
    for (const [k, v] of Object.entries(parts)) {
      if (k === 'forearm' && !id.startsWith('kneeextAux')) continue;
      const named = k === 'palm' || (id.startsWith('kneeextAux') && k === 'forearm');
      const cls = v.mm < 0 || v.state === 'FLOATING' ? 'bad' : v.mm <= 1.5 ? 'ok' : v.state === 'curled' ? 'muted' : named ? 'bad' : 'muted';
      rows.push(`<tr${named ? ' class="named"' : ''}><td>${id.startsWith('kneeextAux') ? 'other hand: ' : ''}${k}${named ? ' (touching part)' : ''}</td><td class="n ${cls}">${v.mm.toFixed(2)}</td><td>${v.state || ''}</td></tr>`);
    }
  }
  return `<table><thead><tr><th>part</th><th class="n">gap, mm</th><th>state</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
};
const groups = { f: 'f) Ankle dorsiflexion vs plantar flexion', a: 'a) Plan: his right and left', b: 'b) Tone: the palm on the lower thigh and knee, the knee lift with the heel on the mattress', c: 'c) Power: each movement, the hand on the named point, right and left', d: 'd) The rolled trouser cuffs at the most bent knee', e: 'e) Tibialis anterior and the calf, before and during' };
const reviewCards = Object.entries(groups).map(([g, title]) => {
  const ps = Object.values(P).filter((p) => p.kind === 'review' && p.group === g);
  return `<section class="beat review" id="review-${g}"><header><h2>${esc(title)}</h2></header><div class="grid">${ps.map((p) => `<figure${p.wide ? ' class="wide"' : ''}><img src="${p.file}" alt="${esc(p.title)}" loading="lazy" width="${p.wide ? 1920 : 960}" height="540" style="${p.wide ? 'aspect-ratio:32/9' : ''}"><figcaption><b>${esc(p.title)}</b>${p.t != null ? ` · ${fmt(p.t)}` : ''}${gapTable(p)}</figcaption></figure>`).join('')}</div></section>`;
}).join('\n');

// solve summary: every contact's gaps at the solve
const solveRows = Object.entries(solved.contacts).map(([id, c]) => `<tr><td>${id}</td><td class="n ${c.gapsMm.palm <= 1.5 && c.gapsMm.palm >= 0 ? 'ok' : 'bad'}">${c.gapsMm.palm.toFixed(2)}</td><td class="n">${['index', 'middle', 'ring', 'little'].map((k) => c.digits && c.digits[k] && c.digits[k].state === 'curled' ? 'curled' : c.gapsMm[k].toFixed(2)).join(' / ')}</td><td class="n">${c.digits && c.digits.thumb && c.digits.thumb.state === 'curled' ? 'curled' : c.gapsMm.thumb.toFixed(2)}</td><td class="n">${c.forearmMm != null ? c.forearmMm.toFixed(2) + ' (under the knee)' : c.gapsMm.forearm.toFixed(1)}</td><td class="n">${c.slideLift != null ? (id.startsWith('knee_') ? c.slideLift + ' deg knee' : c.slideLift.toFixed(1) + ' deg hip') : ''}</td></tr>`).join('');
const legRows = ['R', 'L'].flatMap((s) => Object.entries(solved.legs[s].pose).map(([k, st]) => `<tr><td>${s} ${k}</td><td>${esc(Object.entries(st).filter(([a, b]) => Math.abs(b) > 1e-6).map(([a, b]) => `${a} ${(+b).toFixed(1)}`).join(', ') || 'straight (home)')}</td><td class="n">${solved.legs[s].measured[k].ankleDeg}</td><td class="n">${solved.legs[s].measured[k].heelMm.toFixed(2)}</td><td class="n">${solved.legs[s].measured[k].lowestLowerLegMm.toFixed(2)}</td></tr>`)).join('');

const html = `<title>CNS 6 Storyboard</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600&display=swap">
<style>
  /* Layout: a review sheet. Beats run top to bottom, each a header row and a grid of stills with their notes. */
  :root { --bg: #f2f6f5; --panel: #ffffff; --fg: #17302f; --muted: #5b7371; --line: #d3e0de; --accent: #12808a; --ok: #1d7a43; --warn: #9a6a00; --bad: #b3261e;
    --display: "Fredoka", "Trebuchet MS", sans-serif; --body: "Inter", system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #0b2224; --panel: #11302f; --fg: #e4efed; --muted: #94b0ad; --line: #24494a; --accent: #4fc3cc; --ok: #6fdc97; --warn: #f2c35b; --bad: #ff8a80; color-scheme: dark } }
  :root[data-theme="dark"] { --bg: #0b2224; --panel: #11302f; --fg: #e4efed; --muted: #94b0ad; --line: #24494a; --accent: #4fc3cc; --ok: #6fdc97; --warn: #f2c35b; --bad: #ff8a80; color-scheme: dark }
  body { background: var(--bg); color: var(--fg); font: 400 15px/1.55 var(--body); }
  .wrap { max-width: 1500px; margin: 0 auto; padding-block: 28px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 34px; }
  h1, h2 { font-family: var(--display); font-weight: 600; text-wrap: balance; margin: 0; }
  h1 { font-size: clamp(26px, 4vw, 38px); }
  h2 { font-size: 22px; }
  .lede { max-width: 72ch; color: var(--muted); margin: 6px 0 0; }
  nav { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; }
  nav a { color: var(--accent); }
  .beat { display: grid; gap: 12px; border-top: 1px solid var(--line); padding-top: 18px; }
  .beat header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
  .bn { font: 600 13px var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
  .tm { color: var(--muted); font-variant-numeric: tabular-nums; font-size: 14px; }
  .caps { margin: 0; font-size: 14px; }
  q { font-style: normal; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: 16px; }
  figure { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; display: grid; min-width: 0; }
  figure.wide { grid-column: 1 / -1; }
  figure img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; background: #0d3a3d; }
  figcaption { padding: 10px 12px 12px; font-size: 13.5px; min-width: 0; }
  .k { font-weight: 600; color: var(--muted); }
  .muted { color: var(--muted); }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 13px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid var(--line); }
  .n { text-align: right; }
  tr.named td { font-weight: 600; }
  .ok { color: var(--ok); } .warn { color: var(--warn); } .bad { color: var(--bad); font-weight: 600; }
  .tablewrap { overflow-x: auto; }
  ul.notes { margin: 0; padding-left: 20px; max-width: 95ch; display: grid; gap: 6px; }
</style>
<div class="wrap">
  <header>
    <h1>CNS part 6: motor system of the legs</h1>
    <p class="lede">Storyboard for review: ${M.beats.length} beats, ${(M.beats[M.beats.length - 1].t1).toFixed(0)} s. Every still is the animation frame at that time, rendered by seeking the part's own style (same shots, same solved poses), in software WebGL at 16 samples (review panels at 8). Captions are shown; the clean version is the same frames without them. Gaps are measured from the meshes at render time.</p>
  </header>
  <nav>${M.beats.map((b) => `<a href="#beat-${b.n}">${b.n}. ${esc(b.name)}</a>`).join('')}<a href="#review-a">Review panels a-e</a><a href="#solve">Solve data</a><a href="#assume">Assumptions</a></nav>
  ${beatCards}
  ${reviewCards}
  <section class="beat" id="solve"><header><h2>Solve data (solved.json, loaded by both render commands)</h2></header>
    <div class="tablewrap"><table><thead><tr><th>contact</th><th class="n">palm, mm</th><th class="n">fingers i/m/r/l, mm (or curled)</th><th class="n">thumb, mm</th><th class="n">forearm, mm</th><th class="n">slide-in lift</th></tr></thead><tbody>${solveRows}</tbody></table></div>
    <div class="tablewrap"><table><thead><tr><th>leg pose</th><th>angles (deg)</th><th class="n">ankle (measured), deg</th><th class="n">heel - mattress, mm</th><th class="n">lowest of lower leg, mm</th></tr></thead><tbody>${legRows}</tbody></table></div>
  </section>
  <section class="beat" id="assume"><header><h2>Facts and numbers I assumed</h2></header><ul class="notes">${(M.assumptions || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ul></section>
</div>`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('wrote', path.join(OUT, 'index.html'), Object.keys(P).length, 'panels');
