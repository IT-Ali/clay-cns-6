// part/contact.js: the contact solver of CNS part 6 (the examiner's gloved hands on the patient's legs). Own code; it
// only READS the shared kit (P.legMeshes, P.legPoint, HANDS, the examiner arm) and never edits it.
//
// A contact is anchored to one vertex of the posed leg skin (found once from the named landmarks), so the hand moves
// with the leg exactly (rolling, lifting, the 2-3 mm give under resistance). The hand's orientation is stored in the
// local surface frame at that vertex (n = outward skin normal, t = along the bone, b = n x t):
//   spec = { leg: 'R'|'L', vi, seg: 'thigh'|'shank'|'foot', hand: 'R'|'L' (the examiner's hand), contact: 'palm',
//            angle: deg (finger direction in the t-b plane, from t toward b), pitch: deg (fingers tipped off the skin),
//            pose: base hand pose, back: [kt, kb, kn, kx, ky, kz] (forearm direction: local + world parts), sleeve: dir }
//   sol  = { offset (along n), curl: { index: [..], ... }, thumb: [..] }   (made by CONTACT.solve, saved in solved.json)
// Gaps are measured from the meshes: point-to-triangle distance from every vertex of each hand part to the skin mesh,
// signed by the skin's outward normal (negative = inside the skin).
(function (root) {
  const THREE = root.THREE, K = root.K, HANDS = root.HANDS;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const CONTACT = (root.CONTACT = {});
  CONTACT.TARGET = 0.0005;        // the gap the solver aims for under the touching part: 0.05 mm (always < 1.5 mm, never inside)
  CONTACT.LIMIT = 0.015;          // 1.5 mm: the contact rule

  // ---------------------------------------------------------------- the skin as a searchable surface
  // vertex -> triangles (the index never changes), and a hash grid of the posed vertices near a point
  const CELL = 0.05, adjCache = new Map();
  // every surface of one leg the hand can touch: the skin, that trouser leg (the rolled cuff) and that foot's toes
  CONTACT.surfaces = (P, leg) => {
    const out = [P.legMeshes[leg]];
    P.group.updateMatrixWorld(true);
    P.group.traverse((m) => {
      if (!m.isMesh || !m.visible) return;
      if (m.name === 'trouser-leg-' + leg) out.push(m);
      else if (m.name === 'toe') { const w = m.getWorldPosition(V(0, 0, 0)); if (Math.sign(w.z) === (leg === 'R' ? 1 : -1)) out.push(m); }
    });
    return out;
  };
  // a snapshot in world space of a set of meshes: positions, normals, a hash grid of the vertices near `center`
  CONTACT.skin = (meshes, center, R = 1.6) => {
    if (!Array.isArray(meshes)) meshes = [meshes];
    let n = 0, ni = 0; for (const m of meshes) { n += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
    const W = new Float32Array(n * 3), WN = new Float32Array(n * 3), grid = new Map(), v = V(0, 0, 0);
    const key = meshes.map((m) => m.uuid).join('|');
    let tri = adjCache.get(key);
    const I = tri ? null : new Uint32Array(ni);
    let off = 0, io = 0;
    for (const m of meshes) {
      m.updateWorldMatrix(true, false);
      const g = m.geometry, A = g.attributes.position, Nn = g.attributes.normal, M = m.matrixWorld, NM = new THREE.Matrix3().getNormalMatrix(M);
      for (let i = 0; i < A.count; i++) {
        const gi = off + i;
        v.fromBufferAttribute(Nn, i).applyMatrix3(NM).normalize(); WN[3 * gi] = v.x; WN[3 * gi + 1] = v.y; WN[3 * gi + 2] = v.z;
        v.fromBufferAttribute(A, i).applyMatrix4(M); W[3 * gi] = v.x; W[3 * gi + 1] = v.y; W[3 * gi + 2] = v.z;
        if (center && v.distanceTo(center) > R) continue;
        const k = Math.floor(v.x / CELL) + ',' + Math.floor(v.y / CELL) + ',' + Math.floor(v.z / CELL);
        let c = grid.get(k); if (!c) grid.set(k, (c = [])); c.push(gi);
      }
      if (I) { if (g.index) { const src = g.index.array; for (let k = 0; k < src.length; k++) I[io++] = src[k] + off; } else for (let k = 0; k < A.count; k++) I[io++] = k + off; }
      off += A.count;
    }
    if (!tri) {
      const cnt = new Uint32Array(n + 1);
      for (let i = 0; i < I.length; i++) cnt[I[i] + 1]++;
      for (let i = 0; i < n; i++) cnt[i + 1] += cnt[i];
      const fill = cnt.slice(), list = new Uint32Array(I.length);
      for (let i = 0; i < I.length; i++) list[fill[I[i]]++] = (i / 3) | 0;
      tri = { start: cnt, list, I }; adjCache.set(key, tri);
    }
    return { meshes, W, WN, grid, tri };
  };
  CONTACT.legSkin = (P, leg, center, R) => Object.assign(CONTACT.skin(CONTACT.surfaces(P, leg), center, R), { axes: CONTACT.axes(P, leg), P, leg });
  // closest point on triangle (Ericson, Real-Time Collision Detection 5.1.5)
  const ab = V(0, 0, 0), ac = V(0, 0, 0), ap = V(0, 0, 0), bp = V(0, 0, 0), cp = V(0, 0, 0), out = V(0, 0, 0);
  function closestTri(p, a, b, c, o) {
    ab.subVectors(b, a); ac.subVectors(c, a); ap.subVectors(p, a);
    const d1 = ab.dot(ap), d2 = ac.dot(ap); if (d1 <= 0 && d2 <= 0) return o.copy(a);
    bp.subVectors(p, b); const d3 = ab.dot(bp), d4 = ac.dot(bp); if (d3 >= 0 && d4 <= d3) return o.copy(b);
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) return o.copy(a).addScaledVector(ab, d1 / (d1 - d3));
    cp.subVectors(p, c); const d5 = ab.dot(cp), d6 = ac.dot(cp); if (d6 >= 0 && d5 <= d6) return o.copy(c);
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) return o.copy(a).addScaledVector(ac, d2 / (d2 - d6));
    const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return o.copy(b).addScaledVector(V(0, 0, 0).subVectors(c, b), (d4 - d3) / ((d4 - d3) + (d5 - d6)));
    const den = 1 / (va + vb + vc); return o.copy(a).addScaledVector(ab, vb * den).addScaledVector(ac, vc * den);
  }
  const ta = V(0, 0, 0), tb = V(0, 0, 0), tc = V(0, 0, 0), q = V(0, 0, 0), nn = V(0, 0, 0);
  // signed distance from world point p to the skin (searched within `reach` world units); { d, at, n } or null
  CONTACT.dist = (sk, p, reach = 0.15) => {
    const r = Math.ceil(reach / CELL), cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL), cz = Math.floor(p.z / CELL);
    let best = -1, bd = Infinity; const W = sk.W;
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
      const c = sk.grid.get((cx + i) + ',' + (cy + j) + ',' + (cz + k)); if (!c) continue;
      for (const vi of c) { const dx = W[3 * vi] - p.x, dy = W[3 * vi + 1] - p.y, dz = W[3 * vi + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = vi; } }
    }
    if (best < 0) return null;
    // exact: the triangles round the nearest vertex and its neighbours' triangles
    const { start, list, I } = sk.tri; let md = Infinity, mat = null, mn = null;
    const seen = new Set(), verts = [best];
    for (let s = start[best]; s < start[best + 1]; s++) { const f = list[s]; for (let k = 0; k < 3; k++) verts.push(I[3 * f + k]); }
    for (const v0 of verts) for (let s = start[v0]; s < start[v0 + 1]; s++) {
      const f = list[s]; if (seen.has(f)) continue; seen.add(f);
      const i0 = I[3 * f], i1 = I[3 * f + 1], i2 = I[3 * f + 2];
      ta.fromArray(W, 3 * i0); tb.fromArray(W, 3 * i1); tc.fromArray(W, 3 * i2);
      closestTri(p, ta, tb, tc, q); const d = q.distanceToSquared(p);
      if (d < md) { md = d; mat = q.clone(); mn = nn.set(sk.WN[3 * i0] + sk.WN[3 * i1] + sk.WN[3 * i2], sk.WN[3 * i0 + 1] + sk.WN[3 * i1 + 1] + sk.WN[3 * i2 + 1], sk.WN[3 * i0 + 2] + sk.WN[3 * i1 + 2] + sk.WN[3 * i2 + 2]).normalize().clone(); }
    }
    // the sign: outside if p lies beyond the surface point as seen from the leg's bone axis (robust for the skin, the
    // rolled cuff and the toes, whatever their normals); far inside (no surface within reach) falls back on P.legSDF
    let sgn = 1;
    if (sk.axes) { const ax = axisPoint(sk.axes, mat), out = mat.clone().sub(ax); sgn = Math.sign(p.clone().sub(mat).dot(out)) || 1; }
    else sgn = Math.sign(p.clone().sub(mat).dot(mn)) || 1;
    return { d: sgn * Math.sqrt(md), at: mat, n: mn };
  };
  // far from every surface within reach: the nearest of a sparse set of surface vertices, signed by the bone axis (so a
  // point deep inside is still caught); only its sign matters, and that it is beyond `reach`
  CONTACT.far = (sk, p) => {   // { d (signed, approximate), at }
    const W = sk.W, n = W.length / 3; let best = -1, bd = Infinity;
    for (let i = 0; i < n; i += 5) { const dx = W[3 * i] - p.x, dy = W[3 * i + 1] - p.y, dz = W[3 * i + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = i; } }
    if (best < 0) return null;
    const at = V(W[3 * best], W[3 * best + 1], W[3 * best + 2]);
    let sgn = 1; if (sk.axes) { const ax = axisPoint(sk.axes, at); sgn = Math.sign(p.clone().sub(at).dot(at.clone().sub(ax))) || 1; }
    return { d: sgn * Math.sqrt(bd), at };
  };
  const segPt = (a, b, p) => { const ab2 = b.clone().sub(a), u = K.clamp(p.clone().sub(a).dot(ab2) / ab2.lengthSq()); return a.clone().addScaledVector(ab2, u); };
  const axisPoint = (axes, p) => { let best = null, bd = Infinity; for (const [a, b] of axes) { const c = segPt(a, b, p), d = c.distanceToSquared(p); if (d < bd) { bd = d; best = c; } } return best; };
  // the bone axes of one leg in its current pose: thigh, shank, foot (ankle to the middle of the forefoot)
  CONTACT.axes = (P, leg) => {
    const hip = P.legPoint(leg, 'hip'), knee = P.legPoint(leg, 'knee'), ankle = P.legPoint(leg, 'ankle');
    const fm = P.legPoint(leg, 'ball').add(P.legPoint(leg, 'dorsum')).multiplyScalar(0.5);
    return [[hip, knee], [knee, ankle], [ankle, fm]];
  };

  // ---------------------------------------------------------------- the parts of a gloved hand (and the forearm)
  CONTACT.parts = (arm) => {
    const h = arm.hand, F = h.fingers, parts = { palm: [] };
    for (const c of h.body.children) if (c.isMesh) parts.palm.push(c);
    for (const c of h.thumb.meta.children) if (c.isMesh) parts.palm.push(c);
    for (const k of Object.keys(F)) { parts[k] = []; F[k].mcp.traverse((m) => { if (m.isMesh) parts[k].push(m); }); }
    parts.thumb = []; h.thumb.mcp.traverse((m) => { if (m.isMesh) parts.thumb.push(m); });
    parts.forearm = []; arm.fore.traverse((m) => { if (m.isMesh && m.material === arm.fore.children[0].material) parts.forearm.push(m); });
    return parts;
  };
  // the gap of each part: its lowest vertex relative to the skin. stride > 1 samples fewer vertices (solving)
  const pv = V(0, 0, 0);
  // the gap of a part: the deepest (or lowest) of its vertices relative to the surface. Vertices within `reach` are
  // measured exactly (point to triangle); the others are checked for being deep inside (signed by the bone axis), and
  // if NO vertex is within reach the part's distance is the nearest of a sample of them (so a gap is always a number)
  CONTACT.partGap = (sk, meshes, stride = 1, reach = 0.1) => {
    let best = { gap: Infinity, at: null, skin: null }, nNear = 0; const faraway = [];
    for (const m of meshes) {
      m.updateWorldMatrix(true, false); const A = m.geometry.attributes.position;
      for (let i = 0; i < A.count; i += stride) {
        pv.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld);
        const r = CONTACT.dist(sk, pv, reach);
        if (r) { nNear++; if (r.d < best.gap) best = { gap: r.d, at: pv.clone(), skin: r.at }; }
        else faraway.push(pv.clone());
      }
    }
    const step = Math.max(1, Math.floor(faraway.length / 120));
    for (let i = 0; i < faraway.length; i += step) {
      const r = CONTACT.far(sk, faraway[i], true);
      if (r && (r.d < 0 || !nNear) && r.d < best.gap) best = { gap: r.d, at: faraway[i], skin: r.at };
    }
    return best;
  };
  CONTACT.gaps = (sk, arm, names, stride = 1) => {
    const parts = CONTACT.parts(arm), o = {};
    for (const k of names || Object.keys(parts)) o[k] = CONTACT.partGap(sk, parts[k], stride);
    return o;
  };

  // ---------------------------------------------------------------- anchors and surface frames on the leg
  // the vertex of the posed skin nearest a world point (used once, at the solve)
  CONTACT.nearestVertex = (P, leg, p) => {
    const m = P.legMeshes[leg]; m.updateWorldMatrix(true, false);
    const A = m.geometry.attributes.position, v = V(0, 0, 0); let best = 0, bd = Infinity;
    for (let i = 0; i < A.count; i++) { v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); const d = v.distanceToSquared(p); if (d < bd) { bd = d; best = i; } }
    return best;
  };
  // the anchor's world point and its outward normal, averaged over a patch of skin (radius NR_PATCH in the REST shape,
  // so the same vertices are averaged in every pose): the hand lies on the form of the leg, not on one small bump
  CONTACT.NR_PATCH = 0.25;
  const patchCache = new Map();
  const patch = (m, vi, rad = CONTACT.NR_PATCH) => {
    const key = m.uuid + ':' + vi + ':' + rad; if (patchCache.has(key)) return patchCache.get(key);
    const R = m.geometry.attributes.restPos || m.geometry.attributes.position, c = V(0, 0, 0).fromBufferAttribute(R, vi), v = V(0, 0, 0), out = [];
    for (let i = 0; i < R.count; i++) { v.fromBufferAttribute(R, i); const d = v.distanceTo(c); if (d < rad) out.push([i, 1 - (d / rad) ** 2]); }
    patchCache.set(key, out); return out;
  };
  CONTACT.vertex = (P, leg, vi, rad) => {
    const m = P.legMeshes[leg]; m.updateWorldMatrix(true, false);
    const p = V(0, 0, 0).fromBufferAttribute(m.geometry.attributes.position, vi).applyMatrix4(m.matrixWorld);
    const N = m.geometry.attributes.normal, n = V(0, 0, 0), t = V(0, 0, 0), NM = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    for (const [i, w] of patch(m, vi, rad)) n.addScaledVector(t.fromBufferAttribute(N, i), w);
    n.applyMatrix3(NM).normalize();
    // never trust an average that turned away from the skin at the anchor itself
    const n0 = V(0, 0, 0).fromBufferAttribute(N, vi).applyMatrix3(NM).normalize();
    if (n.dot(n0) < 0.75) n.copy(n0);
    return { p, n };
  };
  // the frame at an anchor: n outward, t along the bone (thigh: hip->knee, shank: knee->ankle, foot: heel->toes)
  CONTACT.frame = (P, leg, vi, seg, rad) => {
    const { p, n } = CONTACT.vertex(P, leg, vi, rad);
    const a = seg === 'thigh' ? P.legPoint(leg, 'hip') : seg === 'shank' ? P.legPoint(leg, 'knee') : P.legPoint(leg, 'heelBack');
    const b = seg === 'thigh' ? P.legPoint(leg, 'knee') : seg === 'shank' ? P.legPoint(leg, 'ankle') : P.legPoint(leg, 'toeTip');
    const t = b.sub(a); t.addScaledVector(n, -t.dot(n)).normalize();
    const bb = V(0, 0, 0).crossVectors(n, t).normalize();
    return { p, n, t, b: bb };
  };
  // the hand's quaternion and the palm-contact point for a spec at the current pose
  CONTACT.pose = (P, spec, offset, sol) => {
    const F = CONTACT.frame(P, spec.leg, spec.vi, spec.seg, spec.patch), a = (spec.angle || 0) * Math.PI / 180, pi = ((spec.pitch || 0) + ((sol && sol.pitch) || 0)) * Math.PI / 180;
    const fd = F.t.clone().multiplyScalar(Math.cos(a)).addScaledVector(F.b, Math.sin(a)).multiplyScalar(Math.cos(pi)).addScaledVector(F.n, Math.sin(pi)).normalize();
    const dorsal = F.n.clone().addScaledVector(fd, -F.n.dot(fd)).normalize();
    const roll = ((spec.roll || 0) + ((sol && sol.roll) || 0)) * Math.PI / 180;
    if (roll) dorsal.applyAxisAngle(fd, roll);
    const quat = HANDS.quat(fd, dorsal);
    const at = F.p.clone().addScaledVector(F.n, offset);
    const k = spec.back || [-1, 0, 0.2, 0, 0, 0];
    const back = fd.clone().multiplyScalar(k[0]).addScaledVector(F.b, k[1]).addScaledVector(F.n, k[2]).add(V(k[3], k[4], k[5])).normalize();
    return { F, fd, quat, at, back };
  };
  // put the arm on a spec with a solution (the forearm and sleeve follow; the sleeve leaves on the examiner's side)
  CONTACT.handPose = (spec, sol) => {
    const base = spec.pose, curl = {};
    for (const k of ['index', 'middle', 'ring', 'little']) curl[k] = (sol && sol.curl && sol.curl[k]) || (base.curl && base.curl[k]) || base.all;
    return Object.assign({}, base, { curl, thumb: (sol && sol.thumb) || base.thumb });
  };
  CONTACT.apply = (P, arm, spec, sol, extra) => {
    const pz = CONTACT.pose(P, spec, sol ? sol.offset : 0.02, sol);
    if (extra) { if (extra.lift) pz.at.addScaledVector(pz.F.n, extra.lift); if (extra.shift) pz.at.add(extra.shift); }
    arm.hand.pose(CONTACT.handPose(spec, sol));
    HANDS.place(arm.hand, spec.contact || 'palm', pz.at, pz.quat);
    CONTACT.follow(arm, pz.back, spec.sleeve);
    return pz;
  };
  // the forearm behind the hand, then the upper sleeve leaving toward the examiner (+Z on his right, -Z on his left)
  CONTACT.follow = (arm, back, sleeve) => {
    arm.follow(back);
    if (sleeve) {
      const up = V(0, 1, 0), sx = V(...sleeve).normalize(), sz = V(0, 0, 0).crossVectors(sx, up).normalize(), sy = V(0, 0, 0).crossVectors(sz, sx);
      arm.upper.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sx, sy, sz));
    }
  };

  // ---------------------------------------------------------------- the solver
  // 1. the hand moves along the skin normal until the named part (spec.touch, default the palm) is TARGET above the
  //    skin (digits straight while it settles);
  // 2. each finger, then the thumb, bends toward the skin (all its joints in proportion) until it lies ON the skin
  //    (TARGET, found by bisection, so never inside); a digit that cannot reach the skin within its range is curled
  //    clearly into the hand. Nothing is left hanging in the air: every digit is 'on skin' (< 1.5 mm) or 'curled';
  // 3. nothing anywhere (hand or forearm) is inside: the hand is lifted by the deepest part, and the digits are
  //    settled again if it moved. spec.rollSearch: a few turns of the hand about its fingers are tried; the one where
  //    the named part ends up touching wins.
  CONTACT.FINGER_CURLED = 1.5;      // a finger with no skin within reach: curled into the hand
  CONTACT.THUMB_CURLED = 1.1;
  const fingerCurl = (c) => [c, c * 0.95, c * 0.6];
  const thumbAt = (base, c) => [base[0] + 0.7 * c, base[1], base[2] + 0.6 * c, base[3] + 0.5 * c];
  const solveOnce = (P, arm, spec, sk, roll) => {
    const touch = spec.touch || 'palm', T = CONTACT.TARGET;
    const tb = (spec.pose.thumb || [0.08, 0, 0.05, 0.03]).slice();
    const sol = { offset: 0.03, roll, pitch: 0, curl: {}, thumb: thumbAt(tb, -0.3), digits: {} };
    const FK = ['index', 'middle', 'ring', 'little'];
    for (const k of FK) sol.curl[k] = fingerCurl(-0.05);
    const gapOf = (k) => { CONTACT.apply(P, arm, spec, sol); return CONTACT.partGap(sk, CONTACT.parts(arm)[k], 1, 0.12).gap; };
    // 1. the palm
    for (let it = 0; it < 10; it++) sol.offset += K.clamp(T - gapOf(touch), -0.15, 0.15);
    const settleDigit = (k) => {
      const thumb = k === 'thumb', lo = thumb ? -0.6 : -0.35, hi = thumb ? 1.4 : 1.6, set = (c) => { if (thumb) sol.thumb = thumbAt(tb, c); else sol.curl[k] = fingerCurl(c); };
      let prev = null, found = null;
      for (let c = lo; c <= hi + 1e-6; c += 0.1) { set(c); if (gapOf(k) <= T) { found = c; break; } prev = c; }
      if (found == null) { const c = thumb ? CONTACT.THUMB_CURLED : CONTACT.FINGER_CURLED; set(c); sol.digits[k] = { c: +c.toFixed(3), state: 'curled' }; return; }
      if (prev == null) { set(found); sol.digits[k] = { c: +found.toFixed(3), state: 'on skin' }; return; }
      let a = prev, z = found;                       // gap(a) > T >= gap(z)
      for (let j = 0; j < 14; j++) { const m = (a + z) / 2; set(m); if (gapOf(k) > T) a = m; else z = m; }
      set(a); sol.digits[k] = { c: +a.toFixed(4), state: 'on skin' };
    };
    const digits = spec.settle === false ? [] : [...(spec.settleFingers || FK), 'thumb'];
    for (let pass = 0; pass < 2; pass++) {
      // 2. the digits
      for (const k of digits) settleDigit(k);
      // 3. never inside: lift by the deepest part (hand and forearm)
      CONTACT.apply(P, arm, spec, sol);
      let all = CONTACT.gaps(sk, arm, null, 1), mn = Math.min(...Object.values(all).map((x) => x.gap)), lifted = 0;
      for (let k = 0; k < 10 && mn < T; k++) { const d = (T - mn) * 1.05; sol.offset += d; lifted += d; CONTACT.apply(P, arm, spec, sol); all = CONTACT.gaps(sk, arm, null, 1); mn = Math.min(...Object.values(all).map((x) => x.gap)); }
      sol.gaps = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, +(v.gap * 100).toFixed(3)]));   // mm
      sol.score = all[touch].gap;
      if (lifted < 0.0005) break;                 // the digits rest where they were settled
    }
    for (const k of Object.keys(sol.digits)) { sol.digits[k].mm = sol.gaps[k]; if (sol.digits[k].state === 'on skin' && sol.gaps[k] > CONTACT.LIMIT * 100) sol.digits[k].state = 'FAIL: floating'; }
    return sol;
  };
  CONTACT.solve = (P, arm, spec) => {
    const center = CONTACT.vertex(P, spec.leg, spec.vi, spec.patch).p, sk = CONTACT.legSkin(P, spec.leg, center, 2.8);
    let best = null;
    for (const r of spec.rollSearch || [0]) { const sol = solveOnce(P, arm, spec, sk, r); if (!best || sol.score < best.score - 1e-5) best = sol; }
    CONTACT.apply(P, arm, spec, best);
    return best;
  };

  // gaps in mm for a review panel: every part of the hand (and forearm) with its nearest skin point
  CONTACT.review = (P, arm, legs) => {
    const res = {};
    for (const leg of legs) {
      const sk = CONTACT.legSkin(P, leg, null);
      for (const [k, v] of Object.entries(CONTACT.gaps(sk, arm, null, 1))) if (!res[k] || v.gap < res[k].gap) res[k] = Object.assign({ leg }, v);
    }
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
