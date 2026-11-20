# CONTINUE: CNS part 6 (motor system of the legs)

How a new session picks this up. The full prompt is in the user's upload `soft-clay-cns-part6-motor-legs-prompt.txt`.
The MY CONTENT section is the spec; follow it exactly.

## State (round 1: storyboard)

- [x] STEP 0: the attachments were checked and `lib/` matched the given md5s; `shared/`, `ref/` and `series/` were copied
  unchanged from `series-shared-v5.zip`.
- [x] `render.mjs` + `package.json` (MACHINE rules), `README.md`
- [x] `part/contact.js`: the contact solver and mesh gap measurement
- [x] `part/cns6-style.js`: all 11 beats, the schedule, shots, hand tracks, leg poses, muscle firming, sound, captions
  switch, home lock (no breathing, no flicker, grain seed of frame 0)
- [x] `solved.json` (made by `npm run solve`, about 6 min in software). Every contact gap is 0.05-0.61 mm; the forearm
  under the knee is 0.3 / 0.07 mm. The log is the `log` array in the file.
- [x] storyboard + review panels a-e (`tools/storyboard.mjs` renders them, `tools/sbpage.mjs` builds the page; a copy
  is kept in `storyboard/`). Published: https://claude.ai/artifact/AhX8aCaa6X3ZSCM6kUfCgx
- [ ] WAIT for the user's review of the storyboard
- [ ] After approval: render the animation stills story_vs_anim.png (beats 3, 5, 7, 8, 9: the hold-middle frame next to
  the storyboard panel). Note that the panels ARE frames of the style, so this checks it.
- [ ] TRANSITIONS SCAN: at every camera change (RUNS in the style: the cuts at 13.0, 25.0, 33.6, 39.5, 42.0, 47.6, 50.0,
  55.7, 58.0, 64.1, 66.0, 71.0, 73.5, 78.7, 81.0, and the moves 1.0-4.6, 6.5-12.7, 81.3-84.0) render a strip every
  1/8 s in software at low samples into checks/transitions/ and check it.
- [x] home-check.json (`node tools/homecheck.mjs`): frame 0 vs the last frame, 0 differing pixels (also the 1 s hold
  edges)
- [x] `npm run preview` tested in software (3 frames; and beat 1 at 320x180 to a 5.000 s MP4 with AAC sound, -14.9 LUFS)
- [x] PC zip: `git archive -o cns6-part6-pc.zip HEAD` (tracked files only: no node_modules, no frames)
- [ ] user renders `npm run preview -- --beats 3,8` on the PC, then the full part; then `npm start`

## Commands (build machine, no GPU)

```bash
npm install
```

```bash
npm run solve
```

```bash
node tools/storyboard.mjs
```

```bash
node tools/dbg.mjs <outdir> "16.0:toneR,20.5:tl" 640 360 1
```

`tl` uses the scheduled camera; a shot name forces that shot; `auto:<contact>` gives a close view.

```bash
node render.mjs preview --software --frames 3
```

## Design notes

- Contacts are anchored to a skin VERTEX (found once from named landmarks). The hand's orientation lives in the local
  surface frame (smoothed normal, bone direction), so the hand follows the leg exactly when it rolls, lifts or gives.
- The solved offset puts the named part (the palm) 0.05 mm above the skin. The fingers settle toward the skin, kept
  together. The thumb swings away if it would go in. The hand is then lifted by the deepest part of the hand or forearm,
  so nothing is ever inside. The surfaces are his skin, the trouser leg (the rolled cuff stands about 3 cm proud) and
  the toes. Sign comes from the bone axes.
- Left-side tests are mirrors (`mirrorSpec`): the examiner's LEFT hand works on his left (the hand nearer his feet), and
  the sleeves leave toward -Z.
- Hands at rest always use the exact home-shot arm. Working arms rise toward the standing examiner's shoulder, leaning
  toward his head or his feet, so they leave the frame at a top corner.
- The muscle firming (own code) is a smooth outward swell of the skin vertices along their normals, at most 4.5 mm on
  tibialis anterior. It never swells down into the bed. It is restored exactly afterwards (the kit's own
  computeVertexNormals).
- Heels: the rest pose of the shared kit has the heel 3.3 mm above the mattress and the calf 5 mm into it. The tone
  lift keeps the heel at 0.05 mm (the lift table in solved.json).
