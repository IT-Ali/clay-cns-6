# CONTINUE: CNS part 6 (motor system of the legs)

How a new session picks this up. The full prompt is in the user's upload `soft-clay-cns-part6-motor-legs-prompt.txt`.
The MY CONTENT section is the spec; follow it exactly.

## State (round 3: two small fixes after the build review; stopped for the user's review)

Round 2 build was reviewed ("nearly approved"). Round 3 fixed:
- [x] One-frame pose pop at the left cuts: every hard cut now sits ON the 1/15 s pose grid (`G(t)` in the style: the
  first pose step at or after t). 39.5, 55.7, 64.1, 73.5 and 78.7 moved +1/30 s to 39.5333, 55.7333, 64.1333, 73.5333,
  78.7333, with the left-side resist windows that start at the cut and the beat 9/10 boundary (and beat 10's hold) moved
  with them. Captions do not change at cuts, so their times stay. In addition the shot on screen is chosen on the pose
  clock (`runAt` uses `SET.poseTime`), so camera, legs and hands can only change together.
- [x] `tools/cutframes.mjs`: the frames at every hard cut, 1/30 s apart, 3 each side, rendered on the render.mjs path:
  checks/transitions/cut_*.jpg and cuts.json (camera run, legs and hands per frame; they change on the same frame)
- [x] Knee extension, the arm under the knee (b08b right, b08c left): now from the FAR side. The glove lies on the
  mattress under the knee on the camera side (0.05 mm), the forearm touches the hollow of the knee (0.05 mm), and the
  forearm and sleeve rise behind his knee and leave the frame at the top edge. Solved by `solveAux` (kneeextAux_R/L in
  solved.json, with its report). Its way in: over the raised knee, fingers turned down, edge-on down into the gap
  between his legs, the hand turns flat and slides under the knee while the forearm pivots through a gate point between
  his legs (`auxPath`, `auxLever`); out is the same backwards. Every frame of it measured: never inside either leg.
  Stills: checks/kneeext-arm-path.jpg. The storyboard artifact still shows the round-2 arm in b08b/b08c (no storyboard
  round was asked for).
- [x] checks/contact-frames.json (`node tools/framecheck.mjs`), the arm under the knee checked by its own rules
- [x] TRANSITIONS SCAN refreshed (1/8 s strips) and the cut frames (1/30 s)
- [x] story_vs_anim.png (beats 3, 5, 7, 8, 9), home-check.json, `npm run preview` on 3 frames
- [x] PC zip (git archive: no node_modules, no frames)
- [ ] NEXT: the user's review; then the user renders `npm run preview -- --beats 3,8` on the PC, then the full part,
  then `npm start`

Solve: solved.json is stamped `cns6-solve-v17`. Times are NOT in the solve hash (only SPECS, muscles, roll, knee lift and
the contact target), so retiming needs no re-solve. Changing SPECS or SOLVE_VERSION does: re-solve what changed with
`node tools/solve.mjs --only a,b` (`--only none`: legs, the arm under the knee, the mirror step and the rests).

## Round 2 (done)

- Floating fingers: every digit solved on its own; all 18 contacts palm and five digits on the skin at 0.05 mm.
- Dorsiflexion palm across the middle of the top of the foot; plantar -30 / dorsiflexion +15, both from the side at
  ankle height; sleeves rise to a top corner; resting hands nearer his hip in the close shots.
- Storyboard: https://claude.ai/artifact/AhX8aCaa6X3ZSCM6kUfCgx (copy in storyboard/)

Notes: `node tools/solve.mjs` takes about 45 min in software.

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
node tools/framecheck.mjs
```

```bash
node tools/cutframes.mjs
```

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
