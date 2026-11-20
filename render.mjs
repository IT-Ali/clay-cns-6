// render.mjs: renders CNS part 6 (motor system of the legs).
//
//   npm run preview [-- --beats 3,8] [--software] [--frames N]
//       Chrome with the GPU (D3D11 on Windows), 960x540, 30 fps, 8 samples, captions on. Frames in out/preview/frames
//       (resumable), then out/preview/preview.mp4 (with sound), out/preview/check.json (first vs last frame pixel
//       difference, mean loudness, duration) and out/preview/sheet.jpg (a frame every 2 s with its time).
//   npm start [-- --beats 1,2] [--software] [--frames N]
//       The series quality (SET.RENDER: 64 samples, 1920x1080, 30 fps): out/final/cns6_full_captions.mp4 and
//       cns6_full_clean.mp4, and every beat as its own MP4 in both versions (out/final/beats/). Frames in
//       out/final/frames_clean (+ frames_captions: the captioned frames; frames without a caption are hard links).
//       Resumable: running it again carries on from the frames already made.
// Both LOAD solved.json (made once on the build machine by `npm run solve`) and never re-solve; they stop with a clear
// message if it is missing or out of date.
//   --software   software WebGL (SwiftShader) instead of the GPU (for testing on a machine with no GPU)
//   --frames N   render only the first N frames of the selection (testing)
//   --samples N, --width W, --height H   override
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve, launch, openPage } from './tools/common.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const MODE = argv[0] === 'final' ? 'final' : 'preview';
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const FPS = 30;
const CFG = MODE === 'preview'
  ? { w: 960, h: 540, samples: 8, out: path.join(ROOT, 'out', 'preview') }
  : { w: 1920, h: 1080, samples: 64, out: path.join(ROOT, 'out', 'final') };
CFG.w = +opt('width', CFG.w); CFG.h = +opt('height', CFG.h); CFG.samples = +opt('samples', CFG.samples);
const SOFTWARE = flag('software');
const MAXF = opt('frames') ? +opt('frames') : Infinity;

// ffmpeg: ffmpeg-static (bundled), else the one on PATH
let FFMPEG = 'ffmpeg';
try { const m = await import('ffmpeg-static'); if (m.default && fs.existsSync(m.default)) FFMPEG = m.default; } catch (e) { /* PATH */ }
const ff = (args, quiet = true) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) { console.error(r.stderr); throw new Error('ffmpeg failed: ' + args.join(' ')); }
  if (!quiet) console.log(r.stderr);
  return r.stderr;
};

// solved.json must be there (the page also checks that it is up to date)
if (!fs.existsSync(path.join(ROOT, 'solved.json'))) { console.error('solved.json is missing: it is made once on the build machine (npm run solve) and shipped with this folder.'); process.exit(1); }

const { srv, url } = await serve();
const browser = await launch({ gpu: !SOFTWARE });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
try {
  const page = await openPage(browser, url + `?render=1&samples=${CFG.samples}&w=${CFG.w}&h=${CFG.h}&captions=${MODE === 'preview' ? 1 : 0}`, { width: CFG.w, height: CFG.h }).catch((e) => { throw new Error('the page did not load: ' + e.message.split('\n')[0]); });
  const info = await page.evaluate(() => {
    const gl = document.getElementById('c').getContext('webgl2'), d = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return { D: window.DURATION, beats: window.STYLE.content.BEATS, gpu: gl ? gl.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : gl.RENDERER) : 'none' };
  });
  log('renderer:', info.gpu);
  if (!SOFTWARE && /swiftshader|software/i.test(info.gpu)) console.warn('WARNING: Chrome is not using the GPU (' + info.gpu + '): this will be very slow.');
  const N = Math.round(info.D * FPS);                         // frames 0..N-1 at t = i / 30
  const beatSel = opt('beats') ? opt('beats').split(',').map(Number) : null;
  const beats = info.beats.filter((b) => !beatSel || beatSel.includes(b.n));
  const frameRange = (b) => [Math.round(b.t0 * FPS), Math.min(N, Math.round(b.t1 * FPS))];
  const want = new Set();
  for (const b of beats) { const [a, z] = frameRange(b); for (let i = a; i < z; i++) want.add(i); }
  const list = [...want].sort((a, b) => a - b).slice(0, MAXF);

  // ---------------------------------------------------------------- frames (resumable: existing frames are kept)
  const dirs = MODE === 'preview' ? { cap: path.join(CFG.out, 'frames') } : { clean: path.join(CFG.out, 'frames_clean'), cap: path.join(CFG.out, 'frames_captions') };
  for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });
  const name = (i) => String(i).padStart(6, '0') + '.png';
  const done = (i) => Object.values(dirs).every((d) => { const f = path.join(d, name(i)); return fs.existsSync(f) && fs.statSync(f).size > 0; });
  const todo = list.filter((i) => !done(i));
  log(`${MODE}: ${list.length} frames selected, ${list.length - todo.length} already made, ${todo.length} to render (${CFG.w}x${CFG.h}, ${CFG.samples} samples)`);
  const t0 = Date.now();
  for (let k = 0; k < todo.length; k++) {
    const i = todo[k];
    const r = await page.evaluate(({ i, FPS, final }) => {
      const t = i / FPS, cv = document.getElementById('c');
      window.CAPTIONS = !final;                                 // preview: captions drawn by the stage; final: clean
      window.seek(t);
      const out = { a: cv.toDataURL('image/png').split(',')[1], b: null };
      if (final) {
        // the captioned frame: the clean frame with the series caption composited exactly as the stage's overlay does
        const on = window.STYLE.content.CAPTIONS || [];
        const live = (window.CNS6_CAPTIONS || window.STYLE.captionsList || null);
        const list = live || window.CNS6.content.CAPTIONS;
        if (list.some((c) => t >= c.t0 && t <= c.t1)) {
          const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
          const x = c2.getContext('2d'); x.drawImage(cv, 0, 0); CAPTION.at(x, t, list, cv.width, cv.height);
          out.b = c2.toDataURL('image/png').split(',')[1];
        }
      }
      return out;
    }, { i, FPS, final: MODE === 'final' });
    const write = (dir, b64) => { const f = path.join(dir, name(i)); fs.writeFileSync(f + '.tmp', Buffer.from(b64, 'base64')); fs.renameSync(f + '.tmp', f); };
    if (MODE === 'preview') write(dirs.cap, r.a);
    else {
      write(dirs.clean, r.a);
      const fc = path.join(dirs.cap, name(i));
      if (r.b) write(dirs.cap, r.b);
      else { try { fs.rmSync(fc, { force: true }); fs.linkSync(path.join(dirs.clean, name(i)), fc); } catch (e) { fs.copyFileSync(path.join(dirs.clean, name(i)), fc); } }
    }
    if (k % 10 === 0 || k === todo.length - 1) {
      const el = (Date.now() - t0) / 1000, per = el / (k + 1);
      log(`frame ${i} (${k + 1}/${todo.length})  ${per.toFixed(2)} s/frame, about ${((todo.length - k - 1) * per / 60).toFixed(1)} min left`);
    }
  }

  // ---------------------------------------------------------------- sound (one schedule with the picture)
  const wavPath = path.join(CFG.out, 'sound_raw.wav'), normPath = path.join(CFG.out, 'sound.wav');
  {
    const b64 = await page.evaluate(async () => {
      const r = await SOUND.renderOffline((k) => window.STYLE.sound(k), window.DURATION, 48000, { voiceover: false });
      const pcm = new Int16Array(r.inter.length);
      for (let i = 0; i < r.inter.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(r.inter[i] * 32767)));
      const u8 = new Uint8Array(pcm.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(s);
    });
    const pcm = Buffer.from(b64, 'base64'), hdr = Buffer.alloc(44);
    hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
    hdr.writeUInt32LE(48000, 24); hdr.writeUInt32LE(48000 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(wavPath, Buffer.concat([hdr, pcm]));
    // about -15 LUFS; aformat at the end (ffmpeg 6 on Windows otherwise fails with "Cannot select channel layout")
    ff(['-i', wavPath, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000,aformat=sample_fmts=s16:channel_layouts=stereo', normPath]);
  }

  // ---------------------------------------------------------------- MP4s
  const encode = (dir, out, a, z) => {
    // frames a..z-1 (the list file keeps the exact frames, also for a selection of beats)
    const lst = out + '.txt';
    fs.writeFileSync(lst, Array.from({ length: z - a }, (_, k) => `file '${path.join(dir, name(a + k)).replace(/\\/g, '/').replace(/'/g, "'\\''")}'\nduration ${1 / FPS}`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-r', String(FPS), '-i', lst, '-ss', String(a / FPS), '-t', String((z - a) / FPS), '-i', normPath,
      '-map', '0:v', '-map', '1:a', '-r', String(FPS), '-c:v', 'libx264', '-preset', MODE === 'preview' ? 'medium' : 'slow', '-crf', MODE === 'preview' ? '20' : '15', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
    fs.rmSync(lst, { force: true });
  };
  const complete = (a, z) => { for (let i = a; i < z; i++) if (!done(i)) return false; return true; };
  if (MAXF !== Infinity) { log('test run (--frames): frames written, no MP4'); }
  else if (MODE === 'preview') {
    // the selection as one MP4 (consecutive beats are one piece; a selection like 3,8 is joined end to end)
    const parts = beats.map(frameRange), outs = [];
    parts.forEach(([a, z], k) => { const o = path.join(CFG.out, `part_${k}.mp4`); encode(dirs.cap, o, a, z); outs.push(o); });
    const mp4 = path.join(CFG.out, 'preview.mp4');
    if (outs.length === 1) fs.renameSync(outs[0], mp4);
    else { const l = path.join(CFG.out, 'join.txt'); fs.writeFileSync(l, outs.map((o) => `file '${o.replace(/\\/g, '/')}'`).join('\n')); ff(['-f', 'concat', '-safe', '0', '-i', l, '-c', 'copy', mp4]); outs.forEach((o) => fs.rmSync(o)); fs.rmSync(l); }
    log('wrote', mp4);
  } else {
    const fb = path.join(CFG.out, 'beats'); fs.mkdirSync(fb, { recursive: true });
    if (!beatSel) for (const v of ['captions', 'clean']) { encode(dirs[v === 'captions' ? 'cap' : 'clean'], path.join(CFG.out, `cns6_full_${v}.mp4`), 0, N); log('wrote', `cns6_full_${v}.mp4`); }
    for (const b of beats) {
      const [a, z] = frameRange(b); if (!complete(a, z)) { log('beat', b.n, 'incomplete, skipped'); continue; }
      const slug = `cns6_beat${String(b.n).padStart(2, '0')}_${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      for (const v of ['captions', 'clean']) encode(dirs[v === 'captions' ? 'cap' : 'clean'], path.join(fb, `${slug}_${v}.mp4`), a, z);
      log('wrote beat', b.n);
    }
  }

  // ---------------------------------------------------------------- checks
  const raw = (f) => { const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 30 }); return r.stdout; };
  const check = { mode: MODE, width: CFG.w, height: CFG.h, samples: CFG.samples, renderer: info.gpu, frames: list.length, durationS: +(list.length / FPS).toFixed(3) };
  const first = path.join(MODE === 'preview' ? dirs.cap : dirs.clean, name(0)), last = path.join(MODE === 'preview' ? dirs.cap : dirs.clean, name(N - 1));
  if (fs.existsSync(first) && fs.existsSync(last)) {
    const A = raw(first), B = raw(last); let diff = 0, maxd = 0;
    for (let i = 0; i < Math.min(A.length, B.length); i += 3) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d) diff++; if (d > maxd) maxd = d; }
    check.firstVsLast = { differingPixels: diff, maxChannelDiff: maxd, identical: diff === 0 };
  } else check.firstVsLast = 'first or last frame not in this selection';
  const lufs = /I:\s+(-?[\d.]+) LUFS/.exec(ff(['-i', normPath, '-af', 'ebur128', '-f', 'null', '-']).split('Summary:').pop());
  check.meanLoudnessLUFS = lufs ? +lufs[1] : null;
  const mp4 = MODE === 'preview' ? path.join(CFG.out, 'preview.mp4') : path.join(CFG.out, 'cns6_full_captions.mp4');
  if (fs.existsSync(mp4)) { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(spawnSync(FFMPEG, ['-hide_banner', '-i', mp4], { encoding: 'utf8' }).stderr); if (m) check.mp4DurationS = +m[1] * 3600 + +m[2] * 60 + +m[3]; }
  fs.writeFileSync(path.join(CFG.out, 'check.json'), JSON.stringify(check, null, 1));
  log('check.json', JSON.stringify(check));
  // contact sheet: a frame every 2 s with its time, composed in the page
  if (MODE === 'preview') {
    const picks = list.filter((i) => i % (2 * FPS) === 0);
    const imgs = picks.map((i) => ({ t: i / FPS, src: 'data:image/png;base64,' + fs.readFileSync(path.join(dirs.cap, name(i))).toString('base64') }));
    const jpg = await page.evaluate(async (imgs) => {
      const tw = 320, th = 180, cols = 6, rows = Math.ceil(imgs.length / cols), c = document.createElement('canvas'); c.width = cols * tw; c.height = rows * (th + 22);
      const x = c.getContext('2d'); x.fillStyle = '#0d3a3d'; x.fillRect(0, 0, c.width, c.height);
      for (let k = 0; k < imgs.length; k++) {
        const im = new Image(); im.src = imgs[k].src; await im.decode();
        const cx = (k % cols) * tw, cy = Math.floor(k / cols) * (th + 22); x.drawImage(im, cx, cy, tw, th);
        x.fillStyle = '#f8eedb'; x.font = '600 15px Fredoka, sans-serif'; x.fillText(imgs[k].t.toFixed(1) + ' s', cx + 6, cy + th + 16);
      }
      return c.toDataURL('image/jpeg', 0.88).split(',')[1];
    }, imgs);
    fs.writeFileSync(path.join(CFG.out, 'sheet.jpg'), Buffer.from(jpg, 'base64'));
    log('wrote sheet.jpg');
  }
} finally { await browser.close(); srv.close(); }
