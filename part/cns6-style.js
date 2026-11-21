// part/cns6-style.js: "Soft Clay" style object for PART 6 OF 11 of the neurological (CNS) examination: the motor system
// of the LEGS (inspection, tone, power). Classic script. Needs THREE, K (lib/stage.js), SOUND (lib/sound.js), shared/ (v5,
// loaded unchanged in the README order) and part/contact.js. Defines window.CNS6 (the style object).
// Units: 1 = 10 cm. Head at screen left (-X), feet at screen right (+X), his RIGHT side toward the camera (+Z).
//
// ONE SOURCE OF TRUTH: every camera (SHOTS), every leg pose (LEGS, solved), every contact (CONTACTS + solved.json) and
// every time (the schedule below) is defined once here. The storyboard, the review panels and the video all seek this
// same style, so a storyboard still IS the animation frame at that time.
(function (root) {
  const THREE = root.THREE, K = root.K;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ================================================================ CONTENT (the story, in order; times in seconds)
  const D = 85.0;
  const HOME_HOLD = 1.0;                     // the CNS home shot, still, at both ends
  // every hard cut sits ON the 1/15 s pose grid (the clay, the legs and the hands step at 15 per second), so the new
  // camera, the new pose and the hands all change on the same frame: G(t) is the first pose step at or after t
  const G = (t) => Math.ceil(t * 15 - 1e-6) / 15;
  const BEATS = [
    { n: 1, name: 'Position', t0: 0, t1: 5 },
    { n: 2, name: 'Inspection', t0: 5, t1: 13, hold: [5.0, 6.5] },
    { n: 3, name: 'Tone - right leg', t0: 13, t1: 25, hold: [13.0, 14.5] },
    { n: 4, name: 'Tone - left leg', t0: 25, t1: 34 },
    { n: 5, name: 'Hip flexion (L1, L2)', t0: 34, t1: 42, hold: [34.0, 35.5] },
    { n: 6, name: 'Hip extension (L5, S1)', t0: 42, t1: 50, hold: [42.0, 43.5] },
    { n: 7, name: 'Knee flexion (L5, S1)', t0: 50, t1: 58, hold: [50.0, 51.5] },
    { n: 8, name: 'Knee extension (L3, L4)', t0: 58, t1: 66, hold: [58.0, 59.5] },
    { n: 9, name: 'Ankle dorsiflexion (L4, L5)', t0: 66, t1: G(73.5), hold: [66.0, 67.5] },
    { n: 10, name: 'Plantar flexion (S1)', t0: G(73.5), t1: 81, hold: [G(73.5), 75.0] },
    { n: 11, name: 'End', t0: 81, t1: 85 },
  ];
  const CAPTIONS = [
    { t0: 1.4, t1: 4.7, text: 'Motor system: the legs', place: 'top' },
    { t0: 7.0, t1: 12.8, text: 'Look: no wasting, no fasciculation; the legs lie equally', place: 'top' },
    { t0: 15.3, t1: 24.7, text: 'Tone: roll the leg, lift the knee briskly - the heel slides on the bed: normal', place: 'top' },
    { t0: 25.4, t1: 33.4, text: 'Same on the left: normal tone', place: 'top' },
    { t0: 35.6, t1: 41.8, text: "Hip flexion (L1, L2): lift your leg, don't let me push it down - full power", place: 'top' },
    { t0: 43.6, t1: 49.8, text: 'Hip extension (L5, S1): push down into the bed - full power', place: 'top' },
    { t0: 51.6, t1: 57.8, text: 'Knee flexion (L5, S1): pull your heel in - full power', place: 'top' },
    { t0: 59.6, t1: 65.8, text: 'Knee extension (L3, L4): straighten, push me away - full power', place: 'top' },
    { t0: 67.6, t1: 73.3, text: 'Ankle dorsiflexion (L4, L5): pull your foot up - full power', place: 'top' },
    { t0: 75.1, t1: 80.8, text: 'Plantar flexion (S1): push down like a pedal - full power', place: 'top' },
  ];
  // The power tests share one shape (right side, then a hard cut to the left side, then back). Times per test:
  //   hold   the still hold for the examiner's instruction (no caption)
  //   move   he makes the movement into the test position (against gravity where it applies)
  //   hand   the examiner's hand travels onto the named point and settles
  //   resist he holds against the hand: the limb gives GIVE_MM, then holds firm; the muscle firms
  //   off    the hand leaves; back the limb goes back to rest;  cutL/cutR the hard cuts to his left / back to his right
  const POWER = {
    hipflex: { t: 34.0, move: [35.5, 36.3], hand: [36.2, 36.8], resist: [36.8, 38.5], off: [38.5, 39.0], back: [38.7, 39.3], cutL: G(39.5), resistL: [G(39.5), 41.1], offL: [41.1, 41.5], backL: [41.3, 41.9], cutR: 42.0 },
    hipext: { t: 42.0, hand: [43.5, 44.1], heelUp: [43.6, 43.85], move: [44.2, 44.7], resist: [44.7, 46.3], back: [46.3, 46.8], off: [46.8, 47.1], heelDown: [47.05, 47.3], rest: [47.1, 47.55], cutL: 47.6, resistL: [47.6, 49.0], backL: [49.0, 49.4], offL: [49.4, 49.7], heelDownL: [49.65, 49.9], restL: [49.7, 49.98], cutR: 50.0 },
    kneeflex: { t: 50.0, move: [51.5, 52.4], hand: [52.3, 52.9], resist: [52.9, 54.5], off: [54.5, 55.0], back: [54.7, 55.5], cutL: G(55.7), resistL: [G(55.7), 57.2], offL: [57.2, 57.6], backL: [57.4, 57.95], cutR: 58.0 },
    kneeext: { t: 58.0, move: [59.5, 60.3], aux: [59.8, 61.0], hand: [60.7, 61.2], resist: [61.2, 62.8], off: [62.8, 63.2], auxOff: [62.9, 63.9, 0.4], back: [63.45, 64.05], cutL: G(64.1), resistL: [G(64.1), 65.3], offL: [65.3, 65.6], auxOffL: [65.3, 65.96, 0.36], backL: [65.62, 65.98], cutR: 66.0 },
    dorsi: { t: 66.0, move: [67.5, 68.0], hand: [67.9, 68.5], resist: [68.5, 70.1], off: [70.1, 70.5], back: [70.3, 70.8], cutL: 71.0, resistL: [71.0, 72.5], offL: [72.5, 72.9], backL: [72.7, 73.2], cutR: G(73.5) },
    plantar: { t: G(73.5), hand: [75.0, 75.6], move: [75.6, 76.1], resist: [76.1, 77.7], back: [77.7, 78.2], off: [78.1, 78.6], cutL: G(78.7), resistL: [G(78.7), 80.1], backL: [80.1, 80.5], offL: [80.4, 80.85], cutR: 81.0 },
  };
  // tone (beats 3 and 4)
  const TONE = {
    R: { hand: [14.5, 15.1], roll: [15.1, 19.1], slide: [19.1, 19.9], kneeUp: [19.2, 19.55], lift: [19.9, 20.3], top: [20.3, 20.8], lower: [20.8, 22.2], out: [22.2, 22.5], kneeDown: [22.45, 22.8], rest: [22.5, 23.2] },
    L: { cut: 25.0, roll: [25.3, 29.3], slide: [29.3, 30.1], kneeUp: [29.4, 29.75], lift: [30.1, 30.5], top: [30.5, 31.0], lower: [31.0, 32.4], out: [32.4, 32.7], kneeDown: [32.65, 33.0], rest: [32.7, 33.4], cutR: 33.6 },
  };
  const ROLL_DEG = 25, ROLL_CYCLES = 2, LIFT_KNEE = 45;      // the roll (hipRot +-25, twice) and the brisk knee lift (~15 cm)
  const SAY_NO = [5.85, 6.45];                               // inspection hold: "no" (silent visemes)
  const GIVE_MM = 2.5;                                       // the limb gives at most 2-3 mm, then holds
  const BREATH_K = 19 * 4.6 / (D - 2 * HOME_HOLD);           // 19 quiet breaths between the two home holds (13.7 a minute)

  // ================================================================ the style
  const style = {
    id: 'cns6-soft-clay', name: 'Soft Clay - CNS part 6: motor system of the legs', duration: D,
    fonts: ['600 56px "Fredoka"'],
    render: Object.assign({}, root.SET.RENDER),
    content: { BEATS, CAPTIONS, POWER, TONE, HOME_HOLD },
    captions: true,      // the CAPTIONS switch (window.CAPTIONS = false renders the clean version)

    build(S) {
      const { SET, BED, PATIENT, SHEET, HANDS, CLAY, CAPTION, HOME, NEURO, CONTACT } = root;
      // ------------------------------------------------------------ the CNS home (exactly as shared/README.md)
      const L = SET.build(S); const bed = BED.build(S); BED.table(S);
      const P = PATIENT.build(S, { neuro: true });
      const SH = SHEET.build(S, P, { from: 'foot' });
      bed.placePillow(P.headBack(), 7.15);
      const exM = { glove: CLAY.mat('#5a8fd8', '#3e73c3', { rough: 0.42, sheen: 0.25, streak: 0.5, freq: 2, tile: 0.8, bump: 0.45, lump: 0.006, lumpSize: 0.6 }), sleeve: CLAY.mat('#24636a', '#1d5359', { rough: 0.82, streak: 0.4, scale: 1.6, side: THREE.DoubleSide }) };
      const EX = { R: HANDS.examinerArm(S, exM, 'R'), L: HANDS.examinerArm(S, exM, 'L') };
      HOME.apply(P, EX, SH, 'cns');
      P.setFace({}); P.breathe(0);
      const HOME_EX = { R: HOME.solveEx(EX, 'R', HOME.exRest('R', 'cns', SH)), L: HOME.solveEx(EX, 'L', HOME.exRest('L', 'cns', SH)) };
      // the home shot's sleeves (the kit's: down toward the camera) and, while he works, the upper arm rising to the
      // standing examiner's shoulder; both leave the frame on the examiner's side: his right (+Z) or his left (-Z)
      const SLEEVE_HOME = { R: [0, -0.42, 1], L: [0, -0.42, -1] };
      const SLEEVE = { R: [0, 0.85, 0.53], L: [0, 0.85, -0.53] };
      for (const s of ['R', 'L']) HOME_EX[s].sleeve = SLEEVE_HOME.R;
      const hs = (x, z) => SH.heightAt(x, z);

      // ------------------------------------------------------------ CONTACT SPECS (right side; the left side is the mirror)
      // anchor: a point from named leg landmarks [a, b, u] (lerp), found once on the skin (nearest vertex at rest).
      // angle: finger direction in the skin's tangent plane (0 = along the bone toward the foot, +90 = across toward
      // his midline on the right leg). back: forearm direction [along fingers, across, normal, world x, y, z].
      const PAL = HOME.FLAT.exPose;                                                  // the flat glove, fingers together
      const PALT = { all: [0.04, 0.05, 0.03], fan: { index: 0.07, middle: 0.0, ring: -0.06, little: -0.12 }, thumb: [-0.12, 0, 0.0, 0.0] };   // flat, thumb close alongside
      const CUP = { all: [0.25, 0.3, 0.2], fan: { index: 0.05, middle: 0, ring: -0.05, little: -0.1 }, thumb: [0.15, 0, 0.12, 0.08] };
      const SPECS = {
        // tone: the palm across the front of the lower thigh and knee, fingers down over the knee (the roll)
        tone: { anchor: ['patella', 'tibialTuberosity', 0.2], seg: 'thigh', angle: 15, back: [0, 0, 0, -0.5, 0.62, 0.65], pose: PAL, leg: 'rest' },
        // tone: palm up in the hollow behind the knee, fingers across under it (the brisk lift)
        knee: { anchor: ['knee', null, 0, [0.05, -0.6, 0]], seg: 'thigh', angle: -90, rollSearch: [0, -15, 15, -30, 30], back: [0, 0, 0, -0.6, 0.35, 0.7], pose: PALT, patch: 0.15, leg: 'lift45', slide: 1.2, slidePose: true },
        // hip flexion: palm on the front of the thigh just above the knee, pressing down
        hipflex: { anchor: ['patella', 'tibialTuberosity', 0.1], seg: 'thigh', angle: 12, back: [0, 0, 0, -0.5, 0.62, 0.65], pose: PAL, leg: 'hipflexUp' },
        // hip extension: palm up under the heel, fingers along the Achilles toward his knee (the heel rests in the palm)
        hipext: { anchor: ['heel', null, 0], seg: 'shank', patch: 0.12, angle: 180, sleeveZ: 0.25, back: [0, 0, 0, 0.5, 0.8, 0.32], pose: PALT, leg: 'hipextUp', slide: 1.2, slidePose: true },
        // knee flexion: the palm cups the back of the heel just below the Achilles tendon (between his heel and his bottom)
        kneeflex: { anchor: ['heelBack', 'achilles', 0.5], seg: 'shank', patch: 0.12, angle: -90, back: [0, 0, 0, -0.45, 0.75, 0.5], pose: CUP, leg: 'footFlat' },
        // knee extension: the palm on the front of the lower shin just above the ankle
        kneeext: { anchor: ['shinMid', 'ankle', 0.62, 'out'], seg: 'shank', angle: 90, sleeveZ: 0.25, back: [0, 0, 0, 0.42, 0.84, 0.34], pose: PAL, leg: 'knee60' },
        // knee extension, the other hand: palm on his other knee, the forearm under the bent knee (solved: forearm touches)
        // knee extension, the other hand: the forearm under the bent knee, coming in from the FAR side along its own axis
        // (an arc over the knee, then a slide); the glove rests flat on the mattress on the camera side of the knee, in
        // view; the forearm touches the hollow of the knee (gap TARGET); the upper arm rises from the far side to the top
        kneeextAux: { aux: true, slide: 3.0 },
        // ankle dorsiflexion: the palm on the top of the foot, fingers toward the toes, pressing it down
        // ankle dorsiflexion: the palm across the top of the middle of the foot (over the metatarsals), the fingers across
        // the foot toward its inner border; nothing over the toes, nothing beyond the toe tips (checked at the solve)
        dorsi: { anchor: ['dorsum', 'toeTip', 0.35, 'skin'], seg: 'foot', patch: 0.1, angle: 90, rollSearch: [0, 10, 20, 30, -10, -20], back: [0, 0, 0, -0.45, 0.7, 0.55], pose: PAL, leg: 'dorsiUp', toeCheck: true },
        // plantar flexion: the palm flat on the ball of the foot, fingers up toward the toes
        plantar: { anchor: ['ball', 'sole', 0.4, 'skin'], seg: 'foot', patch: 0.1, rollSearch: [40, -40, 30, -30, 20, -20], angle: -95, back: [0, 0, 0, 0.5, 0.82, 0.28], sleeveZ: 0.25, pose: PAL, leg: 'plantarDown' },
      };
      const mirrorSpec = (sp) => Object.assign({}, sp, { angle: -sp.angle, back: [sp.back[0], -sp.back[1], sp.back[2], sp.back[3], sp.back[4], -sp.back[5]] });
      // roles: the examiner's hand nearer his feet does the test; the other one rests (or goes under the knee)
      const WORK = { R: 'R', L: 'L' }, AUX = { R: 'L', L: 'R' };

      const MUSC = {
        // [landmark(s) for the centre, lerp, along-leg sigma, around sigma, max swell] (world units; 0.02 = 2 mm)
        quadriceps: { at: ['patella', 'quadriceps', 0.3], sx: 0.32, sr: 0.3, amp: 0.025 },
        hamstrings: { at: ['knee', null, 0, [-0.35, -0.5, 0]], sx: 0.38, sr: 0.22, amp: 0.02 },
        tibialisAnterior: { at: ['tibialisAnterior', null, 0], sx: 0.9, sr: 0.11, amp: 0.045 },
        calf: { at: ['calf', null, 0], sx: 0.65, sr: 0.32, amp: 0.04 },
      };
      // ------------------------------------------------------------ SOLVE (once, on the build machine) or LOAD solved.json
      const SOLVE_VERSION = 'cns6-solve-v17';
      const hashOf = (o) => { const s = JSON.stringify(o); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
      const SPEC_HASH = hashOf({ SOLVE_VERSION, SPECS, MUSC_AT: Object.fromEntries(Object.entries(MUSC).map(([k, m]) => [k, m.at])), ROLL_DEG, LIFT_KNEE, TARGET: CONTACT.TARGET });   // only what is solved
      let SOLVED = root.SOLVED;
      if (root.SOLVE_MODE) SOLVED = solveAll();
      else {
        if (!SOLVED || !SOLVED.hash) throw new Error('solved.json is missing or empty: run `npm run solve` on the build machine (it is never solved on the render PC)');
        if (SOLVED.hash !== SPEC_HASH) throw new Error('solved.json is out of date (' + SOLVED.hash + ' != ' + SPEC_HASH + '): run `npm run solve` on the build machine');
      }

      function solveAll() {
        const t0 = performance.now(), out = { hash: SPEC_HASH, version: SOLVE_VERSION, made: 'build machine', legs: {}, contacts: {}, rest: {}, log: [] };
        const log = (m) => { out.log.push(m); console.log('[solve] ' + m); };
        // the mattress under the legs: a height grid of SH.heightAt (the bare mattress and the folded sheet)
        const HG = { x0: -3, z0: -3.6, d: 0.1, nx: 141, nz: 73, h: [] };
        for (let i = 0; i < HG.nx; i++) for (let j = 0; j < HG.nz; j++) HG.h.push(hs(HG.x0 + i * HG.d, HG.z0 + j * HG.d));
        const hg = (x, z) => { const fx = K.clamp((x - HG.x0) / HG.d, 0, HG.nx - 1.001), fz = K.clamp((z - HG.z0) / HG.d, 0, HG.nz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, H = (a, b) => HG.h[a * HG.nz + b]; return K.lerp(K.lerp(H(i, j), H(i, j + 1), v), K.lerp(H(i + 1, j), H(i + 1, j + 1), v), u); };
        // the lowest vertex of a leg (only vertices whose rest leg coordinate se lies in [se0, se1]) above the mattress
        // the lowest vertex of a leg region above the mattress. Regions by the REST shape (the straight leg, the foot
        // standing up): LOWER = from the knee down (x > 2.6), FOOT = x > 6.2, HEEL = the heel pad, BALL = the sole at the ball
        const REG = { LOWER: (x, y) => x > 2.6, FOOT: (x, y) => x > 6.2, HEEL: (x, y) => x > 6.5 && y < 6.35, BALL: (x, y) => x > 7.3 && y > 7.4 && y < 8.1, ANY: () => true };
        const legLow = (side, reg) => {
          const m = P.legMeshes[side]; m.updateMatrixWorld(true);
          const A = m.geometry.attributes.position, R = m.geometry.attributes.restPos, v = V(0, 0, 0), f = REG[reg]; let best = Infinity;
          for (let i = 0; i < A.count; i++) { if (!f(R.getX(i), R.getY(i))) continue; v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); const g = v.y - hg(v.x, v.z); if (g < best) best = g; }
          return best;
        };
        // settle: the hipFlex that puts the lowest vertex of the region at `gap` above the mattress (bisection)
        const settle = (side, st, reg, gap, lo = -5, hi = 40) => {
          for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; P.setLeg(side, Object.assign({}, st, { hipFlex: m })); if (legLow(side, reg) > gap) hi = m; else lo = m; }
          return Object.assign({}, st, { hipFlex: +((lo + hi) / 2).toFixed(4) });
        };
        const T = CONTACT.TARGET;
        for (const side of ['R', 'L']) {
          P.setLeg(side, {});
          const restCalf = legLow(side, 'LOWER'), restHeel = legLow(side, 'HEEL');
          log(side + ': rest lowest calf/heel ' + (restCalf * 100).toFixed(2) + ' / ' + (restHeel * 100).toFixed(2) + ' mm above the mattress (the shared home pose)');
          const L2 = (out.legs[side] = { restCalf, restHeel, roll: [], lift: [], pose: {} });
          // the roll: for each hipRot, hipFlex so the leg rests on the mattress as at home (the calf as deep as at rest)
          for (let r = -30; r <= 30; r += 5) { const st = settle(side, { hipRot: r }, 'LOWER', restCalf); L2.roll.push([r, st.hipFlex]); }
          // the knee lift: for each knee angle, hipFlex so the heel stays ON the mattress (T above it) and nothing sinks
          // deeper than at home
          for (let kn = 0; kn <= 70; kn += 5) {
            const a = settle(side, { knee: kn }, 'FOOT', T), b = settle(side, { knee: kn }, 'LOWER', restCalf);
            L2.lift.push([kn, Math.max(a.hipFlex, b.hipFlex)]);
          }
          const liftAt = (kn) => interp(L2.lift, kn);
          P.setLeg(side, {}); L2.ankleRestDeg = footAngle(side);
          const ps = L2.pose;
          ps.rest = {};
          ps.lift45 = { knee: LIFT_KNEE, hipFlex: liftAt(LIFT_KNEE) };
          ps.knee60 = { knee: 60, hipFlex: liftAt(60) };
          ps.hipflexUp = { hipFlex: 21 };
          ps.hipextUp = settle(side, {}, 'FOOT', 0.5);                       // the heel 5 cm off the bed
          ps.dorsiUp = settle(side, { ankle: 15 }, 'LOWER', restCalf);
          ps.plantarDown = settle(side, { ankle: -30 }, 'LOWER', restCalf);
          // foot flat on the bed, knee bent: heel and ball both ON the mattress (alternating: hipFlex for the heel, ankle for the ball)
          { let st = { knee: 90, ankle: -10, hipFlex: 45 };
            for (let it = 0; it < 18; it++) {
              st = settle(side, st, 'HEEL', T, 0, 80);
              const lowBall = legLow(side, 'BALL');
              st.ankle = K.clamp(st.ankle - (lowBall - T) * 30, -40, 20);
            }
            st = settle(side, st, 'FOOT', T, 0, 80); ps.footFlat = st;
            // the 2.5 mm give (the examiner draws the heel away): the knee opens a little, the foot stays flat on the bed
            ps.footFlatGive = settle(side, Object.assign({}, st, { knee: st.knee - 0.35 }), 'FOOT', T, 0, 80); }
          L2.measured = {};
          for (const [k, st] of Object.entries(ps)) {
            P.setLeg(side, st);
            const mm = (v) => +(v * 100).toFixed(2);
            L2.measured[k] = { ankleDeg: +(footAngle(side) - L2.ankleRestDeg).toFixed(1), heelMm: mm(legLow(side, 'HEEL')), ballMm: mm(legLow(side, 'BALL')), lowestLowerLegMm: mm(legLow(side, 'LOWER')), lowestAnyMm: mm(legLow(side, 'ANY')) };
            log(side + ' ' + k + ' ' + JSON.stringify(Object.fromEntries(Object.entries(st).map(([a, b]) => [a, +(+b).toFixed(2)]))) + ' mattress gaps (mm) ' + JSON.stringify(L2.measured[k]));
          }
          P.setLeg(side, {});
        }
        // the anchors (vertices of the skin, found at rest) and the contacts, solved at their test poses
        const ONLY = root.SOLVE_ONLY, PREV = root.SOLVED_PREV; SOLVED_LEGS_NOW = out.legs;
        for (const side of ['R', 'L']) {
          for (const [id, sp0] of Object.entries(SPECS)) {
            if (sp0.aux) continue;                     // solved below (solveAux)
            if (ONLY && PREV && PREV.contacts && PREV.contacts[id + '_' + side] && !ONLY.includes(id)) { out.contacts[id + '_' + side] = PREV.contacts[id + '_' + side]; log(id + '_' + side + ' kept from the previous solve'); continue; }
            const sp = side === 'R' ? sp0 : mirrorSpec(sp0), leg = sp.other ? (side === 'R' ? 'L' : 'R') : side;
            P.setLeg('R', {}); P.setLeg('L', {});
            const [a, b, u, extra] = sp.anchor;
            let p = P.legPoint(leg, a); if (b) p.lerp(P.legPoint(leg, b), u);
            if (Array.isArray(extra)) p.add(V(...extra));
            if (extra === 'out') { const n = P.legNormal(leg, 'shinMid'); p.addScaledVector(n, 0.45); }
            const vi = CONTACT.nearestVertex(P, leg, p);
            P.setLeg(side, out.legs[side].pose[sp.leg]);
            const spec = specFor(id, side, vi);
            const arm = EX[WORK[side]];
            const sol = CONTACT.solve(P, arm, spec);
            const rec = { vi, sol: { offset: sol.offset, roll: sol.roll, pitch: sol.pitch, curl: sol.curl, thumb: sol.thumb }, gapsMm: sol.gaps, digits: sol.digits, culprit: sol.culprit };
            if (sp.toeCheck) {      // how far the hand reaches past the toe tips, along the foot (must be < 0)
              const u = P.legPoint(leg, 'toeTip').sub(P.legPoint(leg, 'heelBack')).normalize(), tip = P.legPoint(leg, 'toeTip').dot(u); let mx = -Infinity; const v = V(0, 0, 0);
              arm.hand.group.traverse((m) => { if (!m.isMesh) return; m.updateWorldMatrix(true, false); const A = m.geometry.attributes.position; for (let i = 0; i < A.count; i++) { v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); mx = Math.max(mx, v.dot(u) - tip); } });
              rec.beyondToeTipsMm = +(mx * 100).toFixed(1);
            }
            if (sp.slidePose) Object.assign(rec, solveSlide(id, side, spec, sol, hg, out.legs[side]));
            out.contacts[id + '_' + side] = rec;
            log(id + '_' + side + ' vi ' + vi + ' gaps(mm) ' + JSON.stringify(rec.gapsMm) + (rec.forearmMm != null ? ' forearm ' + rec.forearmMm : '') + (rec.slideMm != null ? ' slide lift ' + rec.slideLift : ''));
          }
          P.setLeg('R', {}); P.setLeg('L', {});
        }
        for (const side of ['R', 'L']) { out.contacts['kneeextAux_' + side] = solveAux(side); log('kneeextAux_' + side + ' ' + JSON.stringify(out.contacts['kneeextAux_' + side].report)); }
        P.setLeg('R', {}); P.setLeg('L', {});
        // mirror step: the legs and the hands are exact mirrors, so when one side of a contact did not solve cleanly and the
        // other did, the clean side's solution (roll mirrored) is tried on it, measured from the meshes, and kept only if
        // every part passes
        const valid = (rec) => rec && rec.gapsMm.palm <= 1.5 && rec.gapsMm.palm >= 0 && Object.values(rec.digits || {}).every((d) => (d.state === 'on skin' && d.mm <= 1.5 && d.mm >= 0) || (d.state === 'curled' && d.mm > 0)) && Object.values(rec.gapsMm).every((g) => g >= 0);
        for (const id of Object.keys(SPECS)) {
          if (SPECS[id].aux) continue;
          const r = out.contacts[id + '_R'], l = out.contacts[id + '_L'];
          for (const [bad, good, side] of [[r, l, 'R'], [l, r, 'L']]) {
            if (!bad || !good || valid(bad) || !valid(good)) continue;
            const spec = specFor(id, side, bad.vi), arm = EX[WORK[side]];
            P.setLeg('R', {}); P.setLeg('L', {}); P.setLeg(side, out.legs[side].pose[SPECS[id].leg]);
            const sol = JSON.parse(JSON.stringify(good.sol)); sol.roll = -(good.sol.roll || 0);
            CONTACT.apply(P, arm, spec, sol);
            const sk = CONTACT.legSkin(P, spec.leg, null), g = CONTACT.gaps(sk, arm, null, 1), mm = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, +(v.gap * 100).toFixed(3)]));
            const digits = Object.fromEntries(Object.entries(good.digits || {}).map(([k, d]) => [k, { c: d.c, state: d.state, mm: mm[k] }]));
            const rec = Object.assign({}, bad, { sol, gapsMm: mm, digits, culprit: 'mirrored from his ' + (side === 'R' ? 'left' : 'right') });
            if (valid(rec)) { out.contacts[id + '_' + side] = rec; log(id + '_' + side + ' replaced by the mirror of the other side: ' + JSON.stringify(mm)); }
            else log(id + '_' + side + ' mirror tried, not clean: ' + JSON.stringify(mm));
          }
        }
        P.setLeg('R', {}); P.setLeg('L', {});
        // the examiner's hands resting on his LEFT side (the far side): the mirror of the home rest, settled on the mattress
        for (const h of ['R', 'L']) {
          const [x, z] = HOME.CNS.ex[h === 'L' ? 'R' : 'L'];          // on his left, the examiner's LEFT hand is nearer his feet
          const sx = h === 'L' ? -1 : 1;
          const st = { contact: 'palm', at: V(x, hs(x, -z) + 0.012, -z), quat: HANDS.quat(V(sx * 0.55, 0, 0.83), V(0, 1, 0)), pose: HOME.CNS.exPose, back: V(-sx * 0.55, -0.05, -0.83), rest: { surface: hs } };
          const r = HOME.solveEx(EX, h, st);
          out.rest[h] = { wrist: r.wrist.toArray(), quat: r.quat.toArray(), pose: r.pose, back: r.back.toArray() };
        }
        HOME.apply(P, EX, SH, 'cns');
        out.ms = Math.round(performance.now() - t0);
        log('solved in ' + (out.ms / 1000).toFixed(1) + ' s');
        root.SOLVED_OUT = out;
        return JSON.parse(JSON.stringify(out));
      }

      // a spec for one side, with its anchor vertex
      // the ankle in the sagittal plane: the angle of the foot (heel to toe tip) to the shin (knee to ankle); its change from
      // rest is the measured ankle angle (+ = dorsiflexion)
      function footAngle(side) {
        const s1 = P.legPoint(side, 'ankle').sub(P.legPoint(side, 'knee')), f = P.legPoint(side, 'toeTip').sub(P.legPoint(side, 'heelBack'));
        return (Math.atan2(f.y, f.x) - Math.atan2(s1.y, s1.x)) * 180 / Math.PI;
      }
      root.CNS6_FOOT_ANGLE = (side) => footAngle(side) - SOLVED.legs[side].ankleRestDeg;
      function specFor(id, side, vi) {
        const sp0 = SPECS[id], sp = side === 'R' ? sp0 : mirrorSpec(sp0), leg = sp.other ? (side === 'R' ? 'L' : 'R') : side;
        return Object.assign({}, sp, { leg, vi, sleeve: SLEEVE[side] });
      }
      // the forearm under the bent knee: the hand rests on his other knee; the forearm is tipped up until it touches the
      // underside of the bent knee (gap TARGET), aimed across under the hollow of the knee
      var SOLVED_LEGS_NOW = null;   // (var: used by solveAll, which runs before this line)
      function solveAux(side) {
        const sz = side === 'R' ? 1 : -1, h = AUX[side], arm = EX[h], other = side === 'R' ? 'L' : 'R';
        P.setLeg(other, {}); P.setLeg(side, SOLVED_LEGS_NOW[side].pose.knee60);
        const knee = P.legPoint(side, 'knee'), pop = knee.clone().add(V(0, -0.5, 0));
        const skS = CONTACT.legSkin(P, side, null), skO = CONTACT.legSkin(P, other, null), T = CONTACT.TARGET;
        const HP = ['palm', 'index', 'middle', 'ring', 'little', 'thumb'];
        for (const dz of [1.0, 1.15, 1.3, 1.45, 1.6]) {
          const x = knee.x - 0.05, z = knee.z + sz * dz;
          const r = HOME.solveEx(EX, h, { contact: 'palm', at: V(x, hs(x, z) + 0.012, z), quat: HANDS.quat(V(0.25, 0, sz).normalize(), V(0, 1, 0)), pose: HOME.CNS.exPose, back: V(0, 0.8, -sz).normalize(), rest: { surface: hs } });
          const place = (back) => { arm.hand.pose(r.pose); arm.hand.group.position.copy(r.wrist); arm.hand.group.quaternion.copy(r.quat); arm.hand.group.updateMatrixWorld(true); CONTACT.follow(arm, back, null); };
          place(V(0, 0.8, -sz).normalize());
          const handMin = (sk) => Math.min(...Object.values(CONTACT.gaps(sk, arm, HP, 2)).map((v) => v.gap));
          if (handMin(skS) < 0.01 || handMin(skO) < 0.01) continue;            // the glove must lie clear of both legs
          const gapAt = (bx, by, stride = 2) => { place(V(bx, by, -sz).normalize()); const g = CONTACT.partGap(skS, CONTACT.parts(arm).forearm, stride, 0.12), o = CONTACT.partGap(skO, CONTACT.parts(arm).forearm, stride, 0.12); return { g: g.gap, at: g.skin, o: o.gap }; };
          // the forearm under the hollow of the knee: the tilt where it just touches there (not the calf, not the other leg)
          let best = null;
          for (let bx = -0.5; bx <= 0.51; bx += 0.1) for (let by = 0.2; by <= 3.01; by += 0.1) {
            const q = gapAt(bx, by); if (q.g >= 0 && q.o >= 0.01 && q.at && q.at.distanceTo(pop) < 0.75 && (!best || q.g < best.g)) best = { g: q.g, bx, by };
          }
          if (!best) continue;
          let lo = best.by, hi = best.by + 0.1;                 // lo: clear; hi: steeper, touching
          for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; if (gapAt(best.bx, m, 1).g >= T) lo = m; else hi = m; }
          const fin = gapAt(best.bx, lo, 1), back = V(best.bx, lo, -sz).normalize();
          place(back);
          const hg = HOME.handGaps(arm.hand, hs), mat = Math.min(...Object.values(hg).map((v) => v.gap));
          const report = { forearmKneeMm: +(fin.g * 100).toFixed(3), forearmOtherLegMm: +(fin.o * 100).toFixed(1), gloveLegMm: +(Math.min(handMin(skS), handMin(skO)) * 100).toFixed(1), gloveMattressMm: +(mat * 100).toFixed(3), palmMattressMm: +(hg.palm.gap * 100).toFixed(3), handOut: dz };
          return { aux: true, wrist: r.wrist.toArray(), quat: r.quat.toArray(), pose: r.pose, back: back.toArray(), report };
        }
        return { aux: true, fail: true, report: { fail: 'no clear place for the arm under the knee' } };
      }
      // slide-in under the knee or the heel: how high the leg must already be so the back of the hand clears the mattress
      function solveSlide(id, side, spec, sol, hg, L2) {
        const arm = EX[WORK[side]], parts = () => CONTACT.parts(arm);
        const low = () => { let best = Infinity; const v = V(0, 0, 0); for (const k of ['palm', 'index', 'middle', 'ring', 'little', 'thumb']) for (const m of parts()[k]) { m.updateMatrixWorld(true); const A = m.geometry.attributes.position; for (let i = 0; i < A.count; i += 3) { v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); best = Math.min(best, v.y - hg(v.x, v.z)); } } return best; };
        const poseAt = (u) => id === 'knee' ? { knee: u, hipFlex: interp(L2.lift, u) } : { hipFlex: u };
        let u = 0; const step = id === 'knee' ? 0.5 : 0.1;
        for (let k = 0; k < 200; k++) { P.setLeg(side, poseAt(u)); CONTACT.apply(P, arm, spec, sol); if (low() >= 0.004) break; u += step; }
        return { slideLift: +u.toFixed(2), slideMm: +(low() * 100).toFixed(2) };
      }
      function interp(tab, x) { if (x <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return K.lerp(y0, y1, (x - x0) / (x1 - x0)); } return tab[tab.length - 1][1]; }

      // ------------------------------------------------------------ LEGS: his leg state at pose-time tq
      const LG = SOLVED.legs;
      const ease = K.ease.inOut;
      const seg = (tq, w) => K.seg(tq, w[0], w[1]);
      const mix = (a, b, u) => { const o = {}; for (const k of Object.keys(PATIENT.NEURO.LEG_DEFAULT)) o[k] = K.lerp(a[k] || 0, b[k] || 0, u); return o; };
      const pose = (side, name) => LG[side].pose[name];
      const rollState = (side, rot, flop) => ({ hipRot: rot, hipFlex: interp(LG[side].roll, rot), ankleInv: flop });
      const liftState = (side, kn) => ({ knee: kn, hipFlex: interp(LG[side].lift, kn) });
      // the 2-3 mm give: the joint that carries the test turns by the angle that moves the contact GIVE_MM
      const GIVE = { hipflex: { hipFlex: -0.4 }, hipext: { hipFlex: -0.17 }, kneeflex: { knee: -0.35 }, kneeext: { knee: 0.42 }, dorsi: { ankle: -1.5 }, plantar: { ankle: 1.0 } };
      const giveAt = (tq, w) => K.ease.out(K.seg(tq, w[0], w[0] + 0.2));
      const addGive = (st, test, g) => { if (!g) return st; const o = Object.assign({}, st); for (const [k, v] of Object.entries(GIVE[test])) o[k] = (o[k] || 0) + v * g; return o; };
      const TEST_POSE = { hipflex: 'hipflexUp', hipext: 'hipextUp', kneeflex: 'footFlat', kneeext: 'knee60', dorsi: 'dorsiUp', plantar: 'plantarDown' };
      function toneLeg(side, tq) {
        const T = TONE[side], C = SOLVED.contacts['knee_' + side];
        if (tq >= T.roll[0] && tq < T.roll[1]) {
          const u = seg(tq, T.roll), env = K.smooth(0, 0.08, u) * (1 - K.smooth(0.92, 1, u)), ph = u * ROLL_CYCLES * 2 * Math.PI;
          return rollState(side, ROLL_DEG * env * Math.sin(ph), -9 * env * Math.sin(ph - 0.9));     // the foot lags and flops
        }
        const kS = C.slideLift;
        if (tq >= T.kneeUp[0] && tq < T.lift[0]) return liftState(side, kS * ease(seg(tq, T.kneeUp)));
        if (tq >= T.lift[0] && tq < T.top[0]) return liftState(side, K.lerp(kS, LIFT_KNEE, K.ease.outQuint(seg(tq, T.lift))));   // brisk
        if (tq >= T.top[0] && tq < T.lower[0]) return liftState(side, LIFT_KNEE);
        if (tq >= T.lower[0] && tq < T.out[0]) return liftState(side, K.lerp(LIFT_KNEE, kS, ease(seg(tq, T.lower))));            // gently
        if (tq >= T.out[0] && tq < T.kneeDown[0]) return liftState(side, kS);                                                    // the hand slides out
        if (tq >= T.kneeDown[0] && tq < T.kneeDown[1]) return liftState(side, kS * (1 - ease(seg(tq, T.kneeDown))));
        return {};
      }
      function powerLeg(test, side, tq) {
        const W = POWER[test], R = side === 'R', up = pose(side, TEST_POSE[test]);
        const mv = R ? W.move : null, rs = R ? W.resist : W.resistL, bk = R ? W.back : W.backL;
        let u = 0;
        if (R) u = ease(seg(tq, mv));
        else u = tq >= W.cutL ? 1 : 0;
        if (tq >= bk[0]) u = Math.min(u, 1 - ease(seg(tq, bk)));
        let st;
        if (test === 'hipext') {
          // the heel rises first to the slide height as the fingers come under it, then to 5 cm
          const C = SOLVED.contacts['hipext_' + side], hS = C.slideLift, hU = up.hipFlex;
          // the heel rises to the slide height as the fingers come under it, then the hand lifts it to 5 cm; back down
          // to the slide height with the hand, the hand slides out, then the heel settles on the bed
          const hd = R ? W.heelDown : W.heelDownL;
          let h = 0;
          if (R) { if (tq >= W.heelUp[0]) h = hS * ease(seg(tq, W.heelUp)); if (tq >= W.move[0]) h = K.lerp(hS, hU, ease(seg(tq, W.move))); }
          else if (tq >= W.cutL) h = hU;
          if (tq >= bk[0]) h = K.lerp(hU, hS, ease(seg(tq, bk)));
          if (tq >= hd[0]) h = hS * (1 - ease(seg(tq, hd)));
          st = { hipFlex: h };
        } else if (test === 'kneeflex' || test === 'kneeext') {
          // the knee bends with the heel sliding on the bed (the lift table), then the foot settles flat
          const kn = K.lerp(0, up.knee, u);
          st = test === 'kneeext' ? liftState(side, kn) : (u < 1 ? mix(liftState(side, kn), up, K.smooth(0.6, 1, u)) : up);
        } else st = mix({}, up, u);
        if (tq >= rs[0] && tq < bk[0]) {
          const g = giveAt(tq, rs);
          // knee extension: the knee gives with the heel still ON the bed (the lift table re-seats the heel)
          st = test === 'kneeext' ? liftState(side, st.knee + GIVE.kneeext.knee * g) : test === 'kneeflex' ? mix(pose(side, 'footFlat'), pose(side, 'footFlatGive'), g) : addGive(st, test, g);
        }
        return st;
      }
      function legAt(side, tq) {
        if (tq >= TONE.R.hand[0] && tq < TONE.L.cut) return side === 'R' ? toneLeg('R', tq) : {};
        if (tq >= TONE.L.cut && tq < 34.0) return side === 'L' ? toneLeg('L', tq) : {};
        for (const [test, W] of Object.entries(POWER)) {
          if (tq >= W.t && tq < W.cutL) return side === 'R' ? powerLeg(test, 'R', tq) : {};
          if (tq >= W.cutL && tq < W.cutR) return side === 'L' ? powerLeg(test, 'L', tq) : {};
        }
        return {};
      }
      // muscle firming during the resistance (own code: a smooth outward swell of the skin over the belly, max ~1.5-2 mm,
      // blended into the skin with no edge; its texture follows the rest shape so nothing slides)
      const FIRM = { hipflex: null, hipext: null, kneeflex: 'hamstrings', kneeext: 'quadriceps', dorsi: 'tibialisAnterior', plantar: 'calf' };
      function firmAt(side, tq) {
        for (const [test, W] of Object.entries(POWER)) {
          const R = side === 'R', rs = R ? W.resist : W.resistL, bk = R ? W.back : W.backL;
          if (!FIRM[test] || tq < rs[0] || tq >= bk[1]) continue;
          if ((R && tq >= W.cutL) || (!R && (tq < W.cutL || tq >= W.cutR))) continue;
          return { muscle: FIRM[test], u: K.ease.out(K.seg(tq, rs[0], rs[0] + 0.3)) * (1 - K.smooth(rs[1], rs[1] + 0.25, tq)) };
        }
        return null;
      }

      // ------------------------------------------------------------ MUSCLE FIRMING (own code, see firmAt)
      const firmRegions = {};
      const firmState = { R: null, L: null };
      const firmRegion = (side, name) => {
        const key = side + name; if (firmRegions[key]) return firmRegions[key];
        const m = P.legMeshes[side], Rp = m.geometry.attributes.restPos, c = V(0, 0, 0).fromBufferAttribute(Rp, SOLVED.firm[key]), v = V(0, 0, 0), M = MUSC[name], idx = [], w = [];
        for (let i = 0; i < Rp.count; i++) { v.fromBufferAttribute(Rp, i); const dx = (v.x - c.x) / M.sx, dr = Math.hypot(v.y - c.y, v.z - c.z) / M.sr, q = dx * dx + dr * dr; if (q < 9) { idx.push(i); w.push(Math.exp(-q)); } }
        return (firmRegions[key] = { idx: Uint32Array.from(idx), w: Float32Array.from(w), amp: M.amp });
      };
      const applyFirm = (side, f) => {
        const m = P.legMeshes[side], g = m.geometry, A = g.attributes.position.array;
        let st = firmState[side];
        if (st) {
          // still our own write (the kit did not re-skin): put the skin back as the kit left it
          let ours = true; for (let k = 0; k < st.idx.length; k += 7) { const i = st.idx[k]; if (A[3 * i] !== st.out[3 * k]) { ours = false; break; } }
          if (ours) { for (let k = 0; k < st.idx.length; k++) { const i = st.idx[k]; A[3 * i] = st.base[3 * k]; A[3 * i + 1] = st.base[3 * k + 1]; A[3 * i + 2] = st.base[3 * k + 2]; } }
          firmState[side] = null;
          if (!f || f.u <= 0) { if (ours) { g.attributes.position.needsUpdate = true; g.computeVertexNormals(); } return; }
        }
        if (!f || f.u <= 0) return;
        const r = firmRegion(side, f.muscle), N = g.attributes.normal.array, n = r.idx.length;
        const base = new Float32Array(n * 3), out = new Float32Array(n * 3);
        for (let k = 0; k < n; k++) {
          const i = r.idx[k], s = r.amp * f.u * r.w[k] * K.smooth(-0.55, 0.05, N[3 * i + 1]);   // never swells down into the bed
          base[3 * k] = A[3 * i]; base[3 * k + 1] = A[3 * i + 1]; base[3 * k + 2] = A[3 * i + 2];
          A[3 * i] += N[3 * i] * s; A[3 * i + 1] += N[3 * i + 1] * s; A[3 * i + 2] += N[3 * i + 2] * s;
          out[3 * k] = A[3 * i]; out[3 * k + 1] = A[3 * i + 1]; out[3 * k + 2] = A[3 * i + 2];
        }
        g.attributes.position.needsUpdate = true; g.computeVertexNormals();
        firmState[side] = { idx: r.idx, base, out };
      };
      if (root.SOLVE_MODE) {
        SOLVED.firm = {};
        for (const side of ['R', 'L']) for (const [name, M] of Object.entries(MUSC)) {
          P.setLeg(side, {});
          const [a, b, u, ex] = M.at; let p = P.legPoint(side, a); if (b) p.lerp(P.legPoint(side, b), u); if (ex) p.add(V(...ex));
          SOLVED.firm[side + name] = CONTACT.nearestVertex(P, side, p);
        }
        root.SOLVED_OUT.firm = SOLVED.firm;
      }

      // ------------------------------------------------------------ THE EXAMINER'S HANDS
      // A state: { rest: 'R'|'L' } (resting flat on the mattress on his right / left), or { c: 'tone_R', ... } (a contact).
      // A hand track is a list of [t, state]; between two different states the hand travels (relaxed, palm down, in a low
      // arc; into a contact marked `slide` it comes in along its fingers, under the knee or the heel); a cut jumps.
      const REST_POSE = { all: [0.16, 0.22, 0.12], fan: { index: 0.05, middle: 0, ring: -0.05, little: -0.1 }, thumb: [0.12, 0, 0.1, 0.06] };
      // where the hands rest flat on the mattress edge: 'R' = exactly the home shot (his right); 'L' = its mirror on his
      // left; during the close shots of the tests they rest nearer his hip ('RH' on his right, 'LH' on his left), out of
      // the low shots of his legs, so no resting sleeve stands next to those cameras. They move there in the push-in and
      // back in the pull-back (wide shots).
      const HIP_EX = { RH: {}, LH: {} };
      for (const h of ['R', 'L']) {
        const base = HOME.exRest(h, 'cns', SH), dx = h === 'R' ? -3.7 : -3.3, x = base.at.x + dx, z = base.at.z;
        let st = Object.assign({}, base, { at: V(x, hs(x, z) + 0.012, z), back: V(-0.35, -0.05, 0.94).normalize() });
        HIP_EX.RH[h] = HOME.solveEx(EX, h, st); HIP_EX.RH[h].back = V(-0.35, -0.05, 0.94).normalize();
        // his left: the examiner's left hand is then the one nearer his feet (the mirror)
        const [x0, z0] = HOME.CNS.ex[h === 'L' ? 'R' : 'L'], sx = h === 'L' ? -1 : 1, xl = x0 + (h === 'L' ? -3.7 : -3.3);
        st = { contact: 'palm', at: V(xl, hs(xl, -z0) + 0.012, -z0), quat: HANDS.quat(V(sx * 0.55, 0, 0.83), V(0, 1, 0)), pose: HOME.CNS.exPose, back: V(-0.35, -0.05, -0.94).normalize(), rest: { surface: hs } };
        HIP_EX.LH[h] = HOME.solveEx(EX, h, st); HIP_EX.LH[h].back = V(-0.35, -0.05, -0.94).normalize();
      }
      HOME.apply(P, EX, SH, 'cns');                 // (solveEx moved the hands: back to the home state)
      const restOf = (h, bedSide) => {
        if (bedSide === 'RH' || bedSide === 'LH') { const r = HIP_EX[bedSide][h]; return { pos: r.wrist.clone(), quat: r.quat.clone(), pose: r.pose, back: r.back.clone(), sleeve: bedSide === 'RH' ? SLEEVE_HOME.R : SLEEVE_HOME.L, isRest: true }; }
        if (bedSide === 'R') { const r = HOME_EX[h]; return { pos: r.wrist.clone(), quat: r.quat.clone(), pose: r.pose, back: r.back.clone(), sleeve: SLEEVE_HOME.R, isRest: true }; }
        const r = SOLVED.rest[h]; return { pos: V(...r.wrist), quat: new THREE.Quaternion(...r.quat), pose: r.pose, back: V(...r.back), sleeve: SLEEVE_HOME.L, isRest: true };
      };
      // a contact's hand transform on the leg as it is now; atSlide: on the leg at its slide height instead (the hand
      // coming in under the knee or the heel, or leaving again, is placed where the slid-in hand will be)
      const slidePoseOf = (name, side) => { const C = SOLVED.contacts[name + '_' + side]; return name === 'knee' ? liftState(side, C.slideLift) : { hipFlex: C.slideLift }; };
      // the arm under the knee, its way in and out (motion only, not solved): the wrist comes down between his legs at
      // z = AUX_ZOUT (his legs: the raised knee from z 0.33, the other leg to z -0.26), the forearm passes the gate at
      // z = AUX_ZGATE on the solved forearm line; AUX_TOP is the height of the crossing above the raised knee (top 9.1)
      const AUX_ZOUT = 0.06, AUX_ZGATE = -0.15, AUX_TOP = 11.6, AUX_LOW = 7.95;
      const contactOf = (h, id, atSlide) => {
        const [name, side] = id.split('_'), C = SOLVED.contacts[id];
        if (SPECS[name].aux) {
          // the forearm under the knee (from the far side): a solved transform. It comes and goes flat along the mattress,
          // between his legs and under the knee (fd, level), the forearm always passing through one GATE point between his
          // legs on the solved forearm line, so the wrist bends and the glove stays flat on the mattress
          const back = V(...C.back), sz = side === 'R' ? 1 : -1, pos = V(...C.wrist), fd = V(-back.x, 0, -back.z).normalize();
          const gate = pos.clone().addScaledVector(back, (pos.z - sz * AUX_ZGATE) / -back.z);
          return { pos, quat: new THREE.Quaternion(...C.quat), pose: C.pose, back, sleeve: V(-0.35, 0.92, 0.2 * sz).normalize().toArray(), fd, slide: (pos.z - sz * AUX_ZOUT) / fd.z, gate, sz, aux: true };
        }
        const spec = specFor(name, side, C.vi), arm = EX[h];
        let keep = null;
        if (atSlide && spec.slidePose) { keep = P.leg(side); P.setLeg(side, slidePoseOf(name, side)); }
        const pz = CONTACT.apply(P, arm, spec, C.sol);
        if (keep) P.setLeg(side, keep);
        const back = pz.back, sz = side === 'R' ? 1 : -1;
        // the upper arm rises to the standing examiner's shoulder, leaning the way the forearm leans (to his head or
        // his feet), so it leaves the frame at the top corner and never stands between the camera and the contact
        const sleeve = V(back.x * 0.75, 0.85, (spec.sleeveZ || 0.5) * sz).normalize().toArray();
        return { pos: arm.hand.group.position.clone(), quat: arm.hand.group.quaternion.clone(), pose: CONTACT.handPose(spec, C.sol), back, sleeve, fd: pz.fd.clone(), slide: spec.slide || 0 };
      };
      const lerpArr = (a, b, u) => a.map((x, i) => K.lerp(x, b[i] == null ? x : b[i], u));
      const poseMix = (a, b, u) => {
        const o = { curl: {}, fan: {}, thumb: lerpArr(a.thumb || [0.08, 0, 0.05, 0.03], b.thumb || [0.08, 0, 0.05, 0.03], u) };
        for (const k of ['index', 'middle', 'ring', 'little']) {
          o.curl[k] = lerpArr((a.curl && a.curl[k]) || a.all, (b.curl && b.curl[k]) || b.all, u);
          o.fan[k] = K.lerp((a.fan && a.fan[k]) || 0, (b.fan && b.fan[k]) || 0, u);
        }
        o.all = o.curl.middle; return o;
      };
      const setHand = (h, X) => {
        const arm = EX[h]; arm.hand.pose(X.pose);
        arm.hand.group.position.copy(X.pos); arm.hand.group.quaternion.copy(X.quat); arm.hand.group.updateMatrixWorld(true);
        CONTACT.follow(arm, X.back, X.sleeve);
      };
      // states: { rest: 'R'|'L' } a resting hand on his right / left; { c: id } on a contact; { c: id, out: 1 } the same hand
      // slid back out along its fingers (by the contact's `slide` distance), at the slide height
      const evalState = (h, s) => {
        if (s.rest) return restOf(h, s.rest);
        const st = contactOf(h, s.c, !!s.out);
        if (s.out) st.pos.addScaledVector(st.fd, -st.slide);
        return st;
      };
      // a relaxed travel from A to B in a low arc (fingers together, a little curled, palm down), settling straight into B
      // the arm: leaving a rest it rises first, coming to a rest it stays raised until the hand is nearly down, so a
      // travelling forearm or sleeve never swings toward the lens
      const arc = (a, b, v, lift = 0.45) => {
        const pos = a.pos.clone().lerp(b.pos, v); pos.y += lift * Math.sin(Math.PI * v);
        const va = b.isRest && !a.isRest ? v * v * v : a.isRest && !b.isRest ? 1 - Math.pow(1 - v, 3) : v;
        const sl = V(...a.sleeve).lerp(V(...b.sleeve), va).normalize().toArray();
        return { pos, quat: a.quat.clone().slerp(b.quat, v), pose: poseMix(poseMix(a.pose, REST_POSE, Math.sin(Math.PI * v)), b.pose, v), back: a.back.clone().lerp(b.back, va).normalize(), sleeve: sl };
      };
      // the hand tracks: [time, state, opts]; between two different states the hand travels; into a contact with a
      // `slide` it arcs to the slid-out point first and then comes in straight along its fingers (under the knee / heel /
      // the bent knee); opts.cut: the state starts here with no travel (a hard cut)
      const RR = { rest: 'R' }, RHIP = { rest: 'RH' }, LHIP = { rest: 'LH' };
      // home spot -> nearer his hip during the push-in; back to the home spot in the pull-back (both wide shots)
      // (one after the other, so the hands never pass each other: in, his-head-side hand first; out, the other first)
      const track = { L: [[0, RR, {}], [1.5, RR, {}], [2.9, RHIP, {}], [82.3, RHIP, {}], [83.6, RR, {}]], R: [[0, RR, {}], [2.7, RR, {}], [4.2, RHIP, {}], [81.3, RHIP, {}], [82.6, RR, {}]] };
      const key = (h, t, s, o) => track[h].push([t, s, o || {}]);
      const cut = (h, t, s) => key(h, t, s, { cut: true });
      { // beat 3: tone, right leg (the examiner's right hand, nearer his feet); beat 4: his left leg (the examiner's left)
        for (const side of ['R', 'L']) {
          const T = TONE[side], w = WORK[side], a = AUX[side], rest = side === 'R' ? RHIP : LHIP, tone = { c: 'tone_' + side }, kn = { c: 'knee_' + side };
          if (side === 'R') { key(w, T.hand[0], rest); key(w, T.hand[1], tone); } else { cut(w, T.cut, tone); cut(a, T.cut, LHIP); }
          key(w, T.slide[0], tone); key(w, T.slide[1], kn); key(w, T.out[0], kn); key(w, T.out[1], { c: kn.c, out: 1 }); key(w, T.rest[1], rest);
        }
        cut('R', TONE.L.cutR, RHIP); cut('L', TONE.L.cutR, RHIP);
      }
      for (const [test, W] of Object.entries(POWER)) {
        for (const side of ['R', 'L']) {
          const w = WORK[side], a = AUX[side], rest = side === 'R' ? RHIP : LHIP, c = { c: test + '_' + side }, R = side === 'R';
          const off = R ? W.off : W.offL;
          if (R) { key(w, W.hand[0], rest); key(w, W.hand[1], c); } else { cut(w, W.cutL, c); if (test !== 'kneeext') cut(a, W.cutL, LHIP); }
          if (test === 'hipext') {
            key(w, off[0], c); key(w, off[1], { c: c.c, out: 1 }); key(w, R ? W.rest[1] : W.restL[1], rest);
          } else {
            key(w, off[0], c); key(w, off[1], rest);
          }
          if (test === 'kneeext') {
            const ax = { c: 'kneeextAux_' + side }, ao = R ? W.auxOff : W.auxOffL;
            if (R) { key(a, W.aux[0], rest); key(a, W.aux[1], ax); } else cut(a, W.cutL, ax);
            key(a, ao[0], ax); key(a, ao[0] + (ao[1] - ao[0]) * ao[2], { c: ax.c, out: 1 }); key(a, ao[1], rest);   // ao[2]: the share of the slide out
          }
        }
        cut('R', W.cutR, RHIP); cut('L', W.cutR, RHIP);
      }
      for (const h of ['R', 'L']) track[h].sort((p, q) => p[0] - q[0] || (q[2].cut ? 1 : 0) - (p[2].cut ? 1 : 0));
      const same = (p, q) => p.rest === q.rest && p.c === q.c && !!p.out === !!q.out;
      const auxLever = (o, pos) => o.gate.clone().sub(pos).normalize();          // the forearm through the gate
      const auxPath = (rest, o, w) => {
        // w 0..1 from the rest to the slid-out point (between his legs, flat on the mattress):
        //   0-0.25 up from the rest, the hand turning palm down;  0.25-0.5 across above the raised knee;
        //   0.5-0.6 the fingers turn down (the hand edge-on);  0.6-0.85 down into the gap between his legs;
        //   0.85-1 the hand turns flat, fingers under the knee, the fingertips gliding on the mattress, the wrist coming down
        const f = V(0.25, 0, o.sz).normalize(), Qd = new THREE.Quaternion().setFromUnitVectors(f, V(0, -1, 0)).multiply(o.quat);
        const Bd = V(0.05, 1, -0.3 * o.sz).normalize(), up = rest.pos.clone(); up.y = AUX_TOP;
        const hi = V(o.pos.x, AUX_TOP, o.pos.z), lo = V(o.pos.x, AUX_LOW, o.pos.z);
        const seg = (a, b) => K.clamp((w - a) / (b - a)), va = 1 - Math.pow(1 - seg(0, 0.25), 3);
        let pos, quat, back;
        if (w < 0.25) { pos = rest.pos.clone().lerp(up, ease(seg(0, 0.25))); quat = rest.quat.clone().slerp(o.quat, va); back = rest.back.clone().lerp(Bd, va).normalize(); }
        else if (w < 0.5) { pos = up.clone().lerp(hi, ease(seg(0.25, 0.5))); quat = o.quat.clone(); back = Bd.clone(); }
        else if (w < 0.6) { pos = hi.clone(); quat = o.quat.clone().slerp(Qd, ease(seg(0.5, 0.6))); back = Bd.clone(); }
        else if (w < 0.85) { pos = hi.clone().lerp(lo, ease(seg(0.6, 0.85))); quat = Qd.clone(); back = Bd.clone(); }
        else {
          const v = ease(seg(0.85, 1)), th = v * Math.PI / 2;
          pos = o.pos.clone(); pos.y = o.pos.y + (AUX_LOW - o.pos.y) * Math.cos(th);
          quat = Qd.clone().slerp(o.quat, v); back = Bd.clone().lerp(auxLever(o, o.pos), v).normalize();
        }
        const pose = poseMix(poseMix(rest.pose, REST_POSE, Math.sin(Math.PI * Math.min(1, w / 0.5)) * (w < 0.5 ? 1 : 0)), o.pose, Math.min(1, w / 0.5));
        return { pos, quat, pose, back, sleeve: V(...rest.sleeve).lerp(V(...o.sleeve), va).normalize().toArray() };
      };
      const handAt = (h, tq) => {
        const tr = track[h]; let i = 0; while (i < tr.length - 1 && tr[i + 1][0] <= tq) i++;
        const [t0, s0] = tr[i], nx = tr[i + 1];
        if (!nx || nx[2].cut || same(s0, nx[1])) return evalState(h, s0);
        const u = K.clamp((tq - t0) / (nx[0] - t0)), s1 = nx[1];
        // the arm under the knee: from the rest over the raised knee, down between his legs, then flat along the mattress
        // in under the knee (auxPath, auxLever); coming out is the same path backwards
        const auxIn = s1.c && !s1.out && SPECS[s1.c.split('_')[0]].aux && s0.rest, auxOut = s0.c && s0.out && SPECS[s0.c.split('_')[0]].aux && s1.rest;
        if (auxIn || auxOut) {
          const rest = evalState(h, auxIn ? s0 : s1), o = evalState(h, { c: (auxIn ? s1 : s0).c, out: 1 }), k = 0.62;
          if (auxOut) return auxPath(rest, o, 1 - u);
          if (u < k) return auxPath(rest, o, ease(u / k));
          const bi = contactOf(h, s1.c, true), v = K.ease.out((u - k) / (1 - k)), pos = o.pos.clone().lerp(bi.pos, v);
          return { pos, quat: bi.quat, pose: bi.pose, back: auxLever(bi, pos), sleeve: bi.sleeve };
        }
        if (s1.c && s1.out && s0.c === s1.c && SPECS[s0.c.split('_')[0]].aux) {   // sliding out along the forearm, the same drop
          const a = evalState(h, s0), b = evalState(h, s1), v = ease(u), pos = a.pos.clone().lerp(b.pos, v);
          return Object.assign(a, { pos, back: auxLever(a, pos) });
        }
        // into a sliding contact: arc to the slid-out point, then straight in along the fingers
        if (s1.c && !s1.out && SPECS[s1.c.split('_')[0]].slide && !(s0.c === s1.c)) {
          const b = evalState(h, s1), bo = evalState(h, { c: s1.c, out: 1 }), a = evalState(h, s0), k = 0.62;
          if (u < k) return arc(a, bo, ease(u / k), 0.45);
          const bi = contactOf(h, s1.c, true), v = K.ease.out((u - k) / (1 - k)), pos = bo.pos.clone().lerp(bi.pos, v);
          return { pos, quat: bi.quat, pose: bi.pose, back: bi.back, sleeve: bi.sleeve };
        }
        // sliding back out along the fingers
        if (s1.out && s0.c === s1.c) { const b = evalState(h, s1), a = contactOf(h, s0.c, true), v = ease(u); return Object.assign(a, { pos: a.pos.clone().lerp(b.pos, v) }); }
        const e0 = evalState(h, s0), e1 = evalState(h, s1);
        return arc(e0, e1, ease(u), s0.rest && s1.rest ? 0 : 0.45);
      };

      // ------------------------------------------------------------ THE FACE (silent "no" in the inspection hold)
      const FACE_REST = { pupilR: 3.5, pupilL: 3.5 };
      const faceAt = (tq) => {
        if (tq >= SAY_NO[0] && tq < SAY_NO[1]) { const u = (tq - SAY_NO[0]) / (SAY_NO[1] - SAY_NO[0]); return Object.assign({ viseme: u < 0.22 ? 'E' : u < 0.75 ? 'O' : 'M' }, FACE_REST); }
        return FACE_REST;
      };

      // ------------------------------------------------------------ CAMERAS (SHOTS: one object per shot; left = mirror)
      const shot = (pos, target, focus, aperture = 0.05, fov = 28) => ({ pos, target, focus: focus || target, fov, aperture });
      const mirrorShot = (s) => ({ pos: [s.pos[0], s.pos[1], -s.pos[2]], target: [s.target[0], s.target[1], -s.target[2]], focus: [s.focus[0], s.focus[1], -s.focus[2]], fov: s.fov, aperture: s.aperture });
      const SHOTS = {
        home: Object.assign({}, SET.HOME_CNS),
        overview: shot([4.0, 14.2, 21.0], [0.6, 7.9, -0.6], [0.6, 7.9, 0.4], 0.07),
        insThigh: shot([1.2, 10.4, 8.6], [1.9, 7.0, 0.0], [1.9, 7.1, 0.6], 0.035),
        insKnee: shot([2.6, 10.0, 8.2], [2.6, 6.9, 0.0], [2.5, 7.0, 0.7], 0.035),
        insShin: shot([4.3, 9.6, 8.2], [4.3, 6.8, 0.0], [4.3, 6.9, 0.8], 0.035),
        insCalf: shot([4.9, 7.0, 8.6], [4.4, 6.35, 0.0], [4.2, 6.3, 0.9], 0.035),
        insFeet: shot([12.2, 9.4, 5.2], [7.4, 7.2, 0.0], [7.5, 7.3, 0.4], 0.035),
        toneR: shot([5.4, 8.3, 14.0], [2.9, 7.0, 0.9], [2.5, 7.0, 1.0], 0.04),
        hipflexR: shot([3.6, 9.0, 14.6], [3.0, 7.8, 0.9], [2.6, 7.6, 1.0], 0.04),
        hipextR: shot([7.4, 8.3, 12.8], [5.9, 6.9, 0.9], [6.9, 6.6, 1.0], 0.035),
        kneeflexR: shot([8.4, 8.6, 11.6], [3.9, 7.5, 0.9], [4.5, 6.9, 1.0], 0.04),
        kneeextR: shot([8.6, 9.2, 14.4], [3.7, 7.6, 0.6], [4.4, 7.4, 1.0], 0.04),
        dorsiR: shot([6.0, 6.95, 11.2], [5.7, 7.45, 1.1], [6.7, 7.2, 1.2], 0.03),          // from his side at ankle height: the shin, the whole foot, the ankle angle
        plantarR: shot([6.3, 6.95, 11.2], [6.0, 7.45, 1.1], [7.1, 7.2, 1.2], 0.03),        // the same height and side view as dorsiflexion
      };
      for (const k of ['toneR', 'hipflexR', 'hipextR', 'kneeflexR', 'kneeextR', 'dorsiR', 'plantarR']) SHOTS[k.slice(0, -1) + 'L'] = mirrorShot(SHOTS[k]);
      // the camera schedule: runs of [time, shot] (a run is one continuous K.path move; a new run is a HARD CUT)
      const RUNS = [
        [[0, 'home'], [HOME_HOLD, 'home'], [4.6, 'overview']],
        [[6.5, 'overview'], [7.7, 'insThigh'], [8.9, 'insKnee'], [10.0, 'insShin'], [11.1, 'insCalf'], [12.7, 'insFeet']],
        [[13.0, 'toneR']], [[25.0, 'toneL']], [[33.6, 'hipflexR']], [[G(39.5), 'hipflexL']],
        [[42.0, 'hipextR']], [[47.6, 'hipextL']], [[50.0, 'kneeflexR']], [[G(55.7), 'kneeflexL']],
        [[58.0, 'kneeextR']], [[G(64.1), 'kneeextL']], [[66.0, 'dorsiR']], [[71.0, 'dorsiL']],
        [[G(73.5), 'plantarR']], [[G(78.7), 'plantarL']],
        [[81.0, 'plantarR'], [81.3, 'plantarR'], [D - HOME_HOLD, 'home'], [D, 'home']],
      ];
      const vec = (c) => [...c.pos, ...c.target, ...(Array.isArray(c.focus) ? c.focus : c.target), c.fov, c.aperture];
      const runs = RUNS.map((r, i) => ({ t0: G(r[0][0]), t1: i + 1 < RUNS.length ? G(RUNS[i + 1][0][0]) : Infinity, keys: r, f: r.length > 1 ? K.path(r.map(([t, n]) => [t, vec(SHOTS[n])])) : null }));
      // which run (shot) is on decides on the POSE clock (the 1/15 s pose steps the clay and the hands use), so a hard cut
      // lands on the same frame as the new pose and hands; inside a run the camera moves on real time
      const runAt = (t) => { const tq = SET.poseTime(t); return runs.find((q) => tq >= q.t0 && tq < q.t1) || runs[runs.length - 1]; };
      const camAt = (t) => {
        const r = runAt(t);
        if (!r.f) return SHOTS[r.keys[0][1]];
        if (t <= r.keys[0][0]) return SHOTS[r.keys[0][1]];
        if (t >= r.keys[r.keys.length - 1][0]) return SHOTS[r.keys[r.keys.length - 1][1]];
        // stills inside a run: two keys of the same shot = the picture is perfectly still between them
        for (let i = 0; i < r.keys.length - 1; i++) if (t >= r.keys[i][0] && t <= r.keys[i + 1][0] && r.keys[i][1] === r.keys[i + 1][1]) return SHOTS[r.keys[i][1]];
        const v = r.f(t);
        return { pos: v.slice(0, 3), target: v.slice(3, 6), focus: v.slice(6, 9), fov: v[9], aperture: v[10] };
      };
      const shootCam = (c) => SET.shoot(S, c);
      const shadowFor = (t) => (t < 4.0 || t >= D - 2.0 ? {} : { shadowCenter: [3.6, 7.0, 0], shadowSize: 7.5 });

      // ------------------------------------------------------------ THE FRAME FOR TIME t
      const homeLock = (t) => t <= HOME_HOLD + 1e-6 || t >= D - HOME_HOLD - 1e-6;
      let lastT = null, lastTq = null;
      const update = (t) => {
        if (t === lastT && !root.CAM_OVERRIDE_CHANGED) return;     // every sub-render of a frame is the same instant (no motion blur)
        lastT = t;
        const tq = SET.poseTime(t), still = homeLock(t);
        if (tq !== lastTq || root.FORCE_POSE) {
          lastTq = tq;
          // the frame order of the README: (recline, shrug, head: unchanged here) legs, arms, face and breathing, points
          const lr = still ? {} : legAt('R', tq), ll = still ? {} : legAt('L', tq);
          P.setLeg('R', lr); P.setLeg('L', ll);
          for (const h of ['R', 'L']) setHand(h, still ? restOf(h, 'R') : handAt(h, tq));
          const firmOn = !still && !root.FIRM_OFF; applyFirm('R', firmOn ? firmAt('R', tq) : null); applyFirm('L', firmOn ? firmAt('L', tq) : null);
          P.setFace(still ? {} : faceAt(tq));
          P.breathe(still ? 0 : (tq - HOME_HOLD) * BREATH_K);
          root.NP = NEURO.points(P);
        }
        EX.R.group.visible = EX.L.group.visible = !root.HIDE_EXAMINER;   // review panels only (never in the video)
        shootCam(root.CAM_OVERRIDE || camAt(t));
        L.set(still ? 0 : tq, root.CAM_OVERRIDE ? { shadowCenter: [3.6, 7.0, 0], shadowSize: 7.5 } : shadowFor(t));
        if (still) L.lamp.intensity = SET.LAMP.power;    // no flicker on the home shot (it must match the other parts)
      };
      // the home frames carry no grain change either: the grain seed of every home-lock frame is that of frame 0, so the
      // first and the last frame of the part are pixel-identical (and identical to the other parts' first frame)
      const seek0 = S.seek;
      S.seek = (t, n) => { const lock = homeLock(t), f = S.R.fps; if (lock) S.R.fps = 1e-9; try { seek0(t, n); } finally { S.R.fps = f; } };

      const overlay = (ctx, t, W, Hh) => {
        const on = root.CAPTIONS != null ? !!root.CAPTIONS : style.captions;
        if (on) CAPTION.at(ctx, t, CAPTIONS, W, Hh);
      };
      // handles for the storyboard, the review panels and the checks (the SAME objects the video uses)
      root.WORLD = { S, P, SH, EX, bed, L, SHOTS, RUNS, camAt, runAt, legAt, handAt, firmAt, SOLVED, SPECS, specFor, contactOf, setHand, update, homeLock, track, interp, mirrorShot, HOME_EX, restOf };
      return { update, overlay };
    },

    // ================================================================ sound: the quiet room, and the real events only
    sound(k) {
      // ambience bed: fades in over the first 0.5 s and out over the last 0.5 s (no clicks where the parts join)
      k.noise(0, { dur: D, color: 'brown', filter: 'lowpass', f: 300, gain: 0.11, a: 0.5, hold: D - 1.0, bus: 'amb' });
      k.noise(0, { dur: D, color: 'pink', filter: 'highpass', f: 4500, gain: 0.012, a: 0.5, hold: D - 1.0, bus: 'amb' });
      // a very soft rustle of the mattress and the sheet when his legs move, roll or slide (very quiet, short)
      const rustle = (t, dur, g = 1, pan = 0) => {
        k.noise(t, { dur, color: 'pink', filter: 'bandpass', f: 1500, q: 0.7, gain: 0.035 * g, a: dur * 0.35, pan });
        k.noise(t, { dur: dur * 0.8, color: 'brown', filter: 'lowpass', f: 420, gain: 0.05 * g, a: dur * 0.3, pan });
      };
      const R = 0.25, Lp = -0.25;
      // tone: each turn of the roll, the slide of the heel up and back down the bed
      for (const side of ['R', 'L']) {
        const T = TONE[side], pan = side === 'R' ? R : Lp;
        for (let i = 0; i < ROLL_CYCLES * 2; i++) rustle(T.roll[0] + (i + 0.25) * (T.roll[1] - T.roll[0]) / (ROLL_CYCLES * 2), 0.42, 0.8, pan);
        rustle(T.lift[0], 0.32, 1.1, pan); rustle(T.lower[0] + 0.2, 0.9, 0.8, pan);
      }
      for (const [test, W] of Object.entries(POWER)) {
        const mv = W.move;
        if (test === 'kneeflex' || test === 'kneeext') { rustle(mv[0], mv[1] - mv[0] + 0.1, 1, R); rustle(W.back[0], W.back[1] - W.back[0], 0.9, R); rustle(W.backL[0], W.backL[1] - W.backL[0], 0.9, Lp); }
        else if (test === 'hipflex' || test === 'hipext') { rustle(test === 'hipext' ? W.heelUp[0] : mv[0], 0.35, 0.7, R); rustle(W.back[1] - 0.25, 0.3, 0.7, R); rustle(W.backL[1] - 0.25, 0.3, 0.7, Lp); }
        else { rustle(mv ? mv[0] : W.move[0], 0.22, 0.4, R); }
      }
    },
  };
  root.CNS6 = style;
})(typeof window !== 'undefined' ? window : globalThis);
