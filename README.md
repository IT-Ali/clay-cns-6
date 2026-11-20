# CNS examination, part 6 of 11: motor system of the legs (Soft Clay)

Inspection, tone and power of both legs, about 85 s, 11 beats. It starts and ends on the CNS home shot, so it joins
parts 5 and 7 end to end. Everything is built from code with three.js 0.187.0 and the series kit.

## Rendering on your PC (Windows, Node, Google Chrome)

The folder ships with `solved.json`. Every pose and contact was solved once on the build machine, and both render
commands only **load** it. They stop with a message if it is missing or out of date. Don't run `npm run solve` on the
render PC.

```bash
npm install
```

**Preview**. It uses Chrome with the GPU (D3D11) at 960x540, 30 fps,
8 samples, captions on:

```bash
npm run preview -- --beats 3,8
```

```bash
npm run preview
```

It writes to `out\preview\`:
- `preview.mp4`
- `check.json`: first vs last frame pixel difference, mean loudness and duration.
- `sheet.jpg`: a frame every 2 s with its time.
- `frames\`: kept, so a stopped run carries on where it stopped.

To send it back, zip `out\preview` without the `frames` folder.

**Final** (the series quality from `SET.RENDER`: 64 samples, 1920x1080, 30 fps, with sound):

```bash
npm start
```

It writes to `out\final\`:
- `cns6_full_captions.mp4` and `cns6_full_clean.mp4`
- `beats\cns6_beatNN_<name>_captions.mp4` and `_clean.mp4`, one pair per beat
- `frames_clean\` and `frames_captions\`: kept. Running `npm start` again carries on from the frames already made.

Each frame is rendered once (clean). The captioned frame is the same image with the series caption drawn on it by the
same caption code. Frames without a caption are hard links.

Options for both commands: `--beats 1,2` (only those beats), `--software` (no GPU), `--frames N` (only the first N
frames, for testing), `--samples N`, `--width W`, `--height H`.

The sound is the quiet-room ambience plus very soft mattress rustles when his legs move. It is normalised to about
-15 LUFS with `loudnorm ... ,aresample=48000,aformat=sample_fmts=s16:channel_layouts=stereo` (the `aformat` is needed for
ffmpeg 6 on Windows). The ambience fades in over the first 0.5 s and out over the last 0.5 s.

## The folder

| Path | What it is |
|---|---|
| `index.html` | The player (play, scrub, sound, captions and loop toggles) and the render page (`?render=1`) |
| `part/cns6-style.js` | This part: the schedule (beats, captions, tone and power timings), contact specs, leg poses, shots, hand tracks, muscle firming, update(t) and sound(k). Each shot, pose and contact is defined once; the storyboard and the video both seek this same style. |
| `part/contact.js` | Contact solver and gap measurement: hands anchored to skin vertices, mesh point-to-triangle gaps, settled to 0.05 mm, never inside |
| `solved.json` | The solved poses and contacts (with the gaps measured at the solve) |
| `shared/` | Series kit v5, unchanged |
| `lib/` | STAGE, SOUND and TEXT3D kits, unchanged (md5 checked) |
| `ref/` | The patient reference images |
| `render.mjs` | `npm run preview` / `npm start` |
| `tools/solve.mjs` | `npm run solve`, build machine only |
| `tools/storyboard.mjs` | Storyboard and review panels, rendered by seeking the style |
| `vendor/fonts/` | Fredoka, kept locally so captions never depend on the network |

Units: 1 world unit = 10 cm. His head is at screen left, his right side faces the camera, and the examiner stands on
his right. For the left-side tests the film hard-cuts to a camera on his left, where the examiner has walked round.
