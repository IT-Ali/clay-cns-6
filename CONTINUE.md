# CONTINUE: CNS part 6 (motor system of the legs)

How a new session picks this up. The full prompt is in the user's upload `soft-clay-cns-part6-motor-legs-prompt.txt`.
The MY CONTENT section is the spec; follow it exactly.

## State (round 2: storyboard fixes and build checks; stopped for the user's review)

Round 1 storyboard was reviewed: leg poses, cameras, captions, left side, cuffs, tibialis anterior, home check and lib/
approved. Round 2 fixed:
- [x] Floating fingers: every digit of a working hand is solved on its own (bisection over its bend; a boundary that
  jumps from far off to deep inside is rejected; no reach -> curled into the hand). solved.json lists each digit's
  state and gap. All 18 contacts: palm and all five digits on the skin at 0.05 mm, nothing inside.
- [x] Inside/outside of the skin and toes decided by their own normals (the rolled cuff by the bone axis); thumb
  metacarpal counted with the thumb.
- [x] Dorsiflexion: palm across the middle of the top of the foot, fingers across; 11 mm short of the toe tips.
- [x] Plantar flexion -30 degrees (measured -29.7), dorsiflexion +15 (+14.9); both filmed from the side at ankle
  height; review panel f shows the two holds side by side with the measured angles.
- [x] Sleeves (b06, b08, b10): working arms rise steeply to a top corner; resting hands lie nearer his hip during the
  close shots (both sides), so no resting sleeve stands next to the low cameras; a travelling arm stays raised until
  the hand is nearly down (no sweep at the lens).
- [x] Storyboard re-rendered and republished: https://claude.ai/artifact/AhX8aCaa6X3ZSCM6kUfCgx (copy in storyboard/)
- [x] checks/contact-frames.json (`node tools/framecheck.mjs`): every contact at its animation frames (give, roll
  extremes, top of the lift): all OK
- [x] story_vs_anim.png (`node tools/storyvsanim.mjs`), beats 3, 5, 7, 8, 9: same frames (mean diff ~2/255, JPEG)
- [x] TRANSITIONS SCAN (`node tools/transitions.mjs`): 19 strips in checks/transitions/, checked: no pans through empty
  teal, no sleeve or forearm across the lens, hands settled at every cut, captions clear of the contacts
- [x] home-check.json (`node tools/homecheck.mjs`): first vs last frame 0 differing pixels
- [x] `npm run preview` tested in software on 3 frames (sound -14.9 LUFS)
- [x] PC zip (git archive: no node_modules, no frames)
- [ ] NEXT: the user's review; then the user renders `npm run preview -- --beats 3,8` on the PC, then the full part,
  then `npm start`

Notes: `node tools/solve.mjs` takes about 45 min in software (`--only a,b` re-solves those contacts and keeps the rest;
`--only none` runs the leg tables and the mirror step only).

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
