/* ติวไฟไหม้ — ตัวตรวจ brute force กลาง (ใช้ร่วมทุกหัวข้อ)
   order : ลำดับมาก-น้อยที่ยอมให้เท่ากัน (3.1 และลำดับใน 3.3)
   หัวข้ออื่นจะเพิ่ม engine ของตัวเองไว้ในไฟล์นี้ */
(function (TF) {
  'use strict';
  const OPS = { '>': (a, b) => a > b, '<': (a, b) => a < b, '=': (a, b) => a === b, '≥': (a, b) => a >= b, '≤': (a, b) => a <= b };
  const FLIP = { '>': '<', '<': '>', '=': '=', '≥': '≤', '≤': '≥' };
  function canon(r) {
    const [a, o, b] = r;
    if (o === '<' || o === '≤') return [b, FLIP[o], a];
    if (o === '=' && a > b) return [b, '=', a];
    return [a, o, b];
  }
  const key = r => canon(r).join('|');
  const pairKey = r => [r[0], r[2]].sort().join('|');

  /* ไล่ทุกกรณี: ให้แต่ละตัวมีอันดับ 0..n-1 (อันดับเท่ากันได้) ตัดกิ่งทันทีที่ขัดเงื่อนไข */
  function models(vars, prem) {
    const n = vars.length, idx = {}; vars.forEach((v, i) => idx[v] = i);
    const P = prem.map(([a, o, b]) => { if (!(a in idx) || !(b in idx) || !OPS[o]) throw new Error('bad premise'); return [idx[a], OPS[o], idx[b]]; });
    const at = vars.map(() => []);
    P.forEach(c => at[Math.max(c[0], c[2])].push(c));
    const v = new Array(n).fill(0), out = [];
    (function rec(i) {
      if (i === n) { const m = {}; vars.forEach((k, j) => m[k] = v[j]); out.push(m); return; }
      for (let r = 0; r < n; r++) {
        v[i] = r; let ok = true;
        for (const [x, f, y] of at[i]) if (!f(v[x], v[y])) { ok = false; break; }
        if (ok) rec(i + 1);
      }
    })(0);
    return out;
  }
  /* ALL = จริงทุกกรณี, NONE = เป็นไปไม่ได้, SOME = บางกรณี */
  function label(M, r) {
    const f = OPS[r[1]]; let t = 0;
    for (const m of M) if (f(m[r[0]], m[r[2]])) t++;
    return t === M.length ? 'ALL' : t === 0 ? 'NONE' : 'SOME';
  }
  function order(m) {
    const by = {}; for (const k in m) (by[m[k]] = by[m[k]] || []).push(k);
    return Object.keys(by).map(Number).sort((a, b) => b - a).map(r => by[r].sort().join(' = ')).join(' > ');
  }
  /* หาตัวอย่างกรณีที่ข้อความเป็นจริง/ไม่จริง เลือกกรณีที่มีตัวเท่ากันน้อยที่สุด */
  function example(M, r, want) {
    const f = OPS[r[1]]; let best = null, bestK = -1;
    for (const m of M) if (f(m[r[0]], m[r[2]]) === want) { const k = new Set(Object.values(m)).size; if (k > bestK) { best = m; bestK = k; } }
    return best ? order(best) : '';
  }
  /* โครงผัง: ยุบตัวที่เท่ากันแน่นอนเป็นกล่องเดียว แล้วหาเส้นเชื่อมแบบลดทอน (Hasse) */
  function structure(vars, M) {
    const cls = [], of = {};
    for (const v of vars) {
      const c = cls.find(c => label(M, [c[0], '=', v]) === 'ALL');
      if (c) c.push(v); else cls.push([v]);
    }
    cls.forEach((c, i) => c.forEach(v => of[v] = i));
    const k = cls.length, rel = [];
    for (let i = 0; i < k; i++) { rel.push([]); for (let j = 0; j < k; j++) {
      rel[i].push(i === j ? null : label(M, [cls[i][0], '>', cls[j][0]]) === 'ALL' ? '>' : label(M, [cls[i][0], '≥', cls[j][0]]) === 'ALL' ? '≥' : null);
    } }
    const edges = [];
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) if (rel[i][j]) {
      let cover = true;
      for (let m = 0; m < k; m++) if (m !== i && m !== j && rel[i][m] && rel[m][j]) { cover = false; break; }
      if (cover) edges.push([i, j, rel[i][j]]);
    }
    const name = i => cls[i].join(' = ');
    function path(i, j) {               // ทางลงจากกล่อง i ไปกล่อง j
      const prev = { [i]: null }, q = [i];
      while (q.length) { const x = q.shift(); if (x === j) break; for (const e of edges) if (e[0] === x && !(e[1] in prev)) { prev[e[1]] = e; q.push(e[1]); } }
      if (!(j in prev)) return null;
      const seq = []; let x = j; while (prev[x]) { seq.unshift(prev[x]); x = prev[x][0]; }
      return seq;
    }
    function pathText(seq) { let s = name(seq[0][0]); for (const e of seq) s += ' ' + e[2] + ' ' + name(e[1]); return s; }
    /* อธิบายความสัมพันธ์ระหว่าง a กับ b ตามผัง */
    function relate(a, b) {
      const i = of[a], j = of[b];
      if (i === j) return { kind: 'same', text: name(i) };
      let p = path(i, j); if (p) return { kind: 'down', strict: p.some(e => e[2] === '>'), text: pathText(p) };
      p = path(j, i); if (p) return { kind: 'up', strict: p.some(e => e[2] === '>'), text: pathText(p) };
      return { kind: 'apart', text: a + ' กับ ' + b + ' อยู่คนละกิ่ง' };
    }
    const isChain = edges.length === k - 1 && edges.every(e => edges.filter(f => f[0] === e[0]).length === 1 && edges.filter(f => f[1] === e[1]).length === 1);
    let chainText = '';
    if (isChain) { const top = [...Array(k).keys()].find(i => !edges.some(e => e[1] === i)); const bot = [...Array(k).keys()].find(i => !edges.some(e => e[0] === i)); chainText = k === 1 ? name(0) : pathText(path(top, bot)); }
    return { cls, of, rel, edges, name, relate, isChain, chainText };
  }
  TF.order = { OPS, FLIP, canon, key, pairKey, models, label, example, order, structure };
})(window.TF = window.TF || {});
/* ===== ตัวช่วยไล่ทุกกรณีแบบทั่วไป ===== */
(function (TF) {
  'use strict';
  function perms(a) {
    const out = [], n = a.length, b = a.slice(), used = new Array(n).fill(false), cur = [];
    (function rec() {
      if (cur.length === n) { out.push(cur.slice()); return; }
      for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(b[i]); rec(); cur.pop(); used[i] = false; }
    })();
    return out;
  }
  function combos(a, k) {
    const out = [], cur = [];
    (function rec(s) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (let i = s; i < a.length; i++) { cur.push(a[i]); rec(i + 1); cur.pop(); }
    })(0);
    return out;
  }
  function labelOf(models, pred) {
    let t = 0; for (const m of models) if (pred(m)) t++;
    return t === models.length ? 'ALL' : t === 0 ? 'NONE' : 'SOME';
  }
  TF.bf = { perms, combos, labelOf };

  /* ===== 3.2 แผนภาพเวนน์: ไล่ทุกรูปแบบว่าง/ไม่ว่างของช่อง (2^(2^k) แบบ) =====
     ช่อง r (1..2^k-1) บิต j = อยู่ในกลุ่ม j · แบบจำลอง m = บิตของช่องที่มีสมาชิก */
  const vcache = {};
  function vmasks(k) {
    if (vcache[k]) return vcache[k];
    const R = (1 << k) - 1, inSet = [];
    for (let j = 0; j < k; j++) { let m = 0; for (let r = 1; r <= R; r++) if (r & (1 << j)) m |= 1 << (r - 1); inSet.push(m); }
    return (vcache[k] = { R, inSet });
  }
  function vholds(m, s, k) {
    const { inSet } = vmasks(k), X = inSet[s.x], Y = inSet[s.y];
    if (s.f === 'all') return (m & X & ~Y) === 0;
    if (s.f === 'none') return (m & X & Y) === 0;
    if (s.f === 'some') return (m & X & Y) !== 0;
    if (s.f === 'not') return (m & X & ~Y) !== 0;
    throw new Error('form ' + s.f);
  }
  function vmodels(k, prem, nonEmpty) {
    const { R, inSet } = vmasks(k), out = [];
    for (let m = 0; m < (1 << R); m++) {
      if (nonEmpty && inSet.some(X => (m & X) === 0)) continue;
      if (prem.every(s => vholds(m, s, k))) out.push(m);
    }
    return out;
  }
  TF.venn = { masks: vmasks, holds: vholds, models: vmodels };

  /* ===== 3.3 ที่นั่ง/ลำดับ =====
     แถว: ตำแหน่ง 0 = ซ้ายสุด (ตามที่ผู้อ่านเห็น) · โต๊ะกลม: ที่นั่งเรียงทวนเข็มนาฬิกา (มองจากด้านบน)
     ทุกคนหันเข้ากลางโต๊ะ → ขวามือ = ที่ถัดไปทวนเข็ม · ลำดับ: ตำแหน่ง 0 = อันดับ 1 */
  function seatArr(kind, names) {
    if (kind === 'round') { const [f, ...r] = names; return perms(r).map(p => [f, ...p]); } // ปักคนแรก ตัดกรณีหมุนโต๊ะ
    return perms(names);
  }
  function seatHolds(kind, arr, c) {
    const n = arr.length, P = x => arr.indexOf(x), a = P(c.a), b = c.b != null ? P(c.b) : -1;
    const md = (x) => ((x % n) + n) % n;
    switch (c.t) {
      case 'pos': return a === c.p;
      case 'notPos': return a !== c.p;
      case 'leftOf': return a < b;
      case 'adjLeft': return kind === 'round' ? md(a - b) === n - 1 : a === b - 1;
      case 'adjRight': return kind === 'round' ? md(a - b) === 1 : a === b + 1;
      case 'adj': return kind === 'round' ? (md(a - b) === 1 || md(a - b) === n - 1) : Math.abs(a - b) === 1;
      case 'notAdj': return !seatHolds(kind, arr, { t: 'adj', a: c.a, b: c.b });
      case 'opp': return md(a - b) === n / 2;
      case 'end': return a === 0 || a === n - 1;
      case 'notEnd': return a !== 0 && a !== n - 1;
      case 'gap': return Math.abs(a - b) === c.k + 1;
      case 'gt': return a < b;                                // อันดับดีกว่า
      case 'rank': return a === c.p;
      case 'gapR': return b - a === c.k + 1;                  // a อยู่เหนือ b โดยมี k คนคั่น
      case 'mid': return a !== 0 && a !== n - 1;
      default: throw new Error('clue ' + c.t);
    }
  }
  TF.seat = { arr: seatArr, holds: seatHolds };

  /* ===== 3.4 เครือญาติ: คำนวณคำเรียกจากเส้นทาง (ขึ้น/ลง/พี่น้อง/คู่สมรส) ตามแบบไทย =====
     hops[i] = ความสัมพันธ์ของคน i+1 เทียบกับคน i · g[i] = 'M'|'F' · old[i] = คน i+1 แก่กว่าคน i (เฉพาะ side) */
  function kinTerm(hops, g, old) {
    const pat = hops.join(','), A = g[g.length - 1], M = A === 'M';
    switch (pat) {
      case 'up': return M ? 'พ่อ' : 'แม่';
      case 'up,up': return g[1] === 'M' ? (M ? 'ปู่' : 'ย่า') : (M ? 'ตา' : 'ยาย');
      case 'up,side': case 'up,side,marry': return old[1] ? (M ? 'ลุง' : 'ป้า') : (g[1] === 'M' ? 'อา' : 'น้า');
      case 'up,side,down': return 'ลูกพี่ลูกน้อง';
      case 'side': return old[0] ? (M ? 'พี่ชาย' : 'พี่สาว') : (M ? 'น้องชาย' : 'น้องสาว');
      case 'side,marry': return old[0] ? (M ? 'พี่เขย' : 'พี่สะใภ้') : (M ? 'น้องเขย' : 'น้องสะใภ้');
      case 'side,down': case 'down,down': return M ? 'หลานชาย' : 'หลานสาว';
      case 'down': return M ? 'ลูกชาย' : 'ลูกสาว';
      case 'down,marry': return M ? 'ลูกเขย' : 'ลูกสะใภ้';
      case 'marry': return M ? 'สามี' : 'ภรรยา';
      case 'marry,up': return g[0] === 'M' ? (M ? 'พ่อตา' : 'แม่ยาย') : (M ? 'พ่อสามี' : 'แม่สามี');
      default: return null;
    }
  }
  const INV = { up: 'down', down: 'up', side: 'side', marry: 'marry' };
  function kinReverse(hops, g, old) {     // คำเรียกในทิศกลับ (คนแรกเทียบกับคนสุดท้าย)
    return kinTerm(hops.slice().reverse().map(h => INV[h]), g.slice().reverse(), old.slice().reverse().map(o => o == null ? null : !o));
  }
  /* ไล่ทุกค่าที่โจทย์ไม่บอก: เพศของทุกคน และใครเกิดก่อนในคู่พี่น้อง */
  function kinModels(hops, stmts) {
    const n = hops.length + 1, sides = hops.map((h, i) => h === 'side' ? i : -1).filter(i => i >= 0), out = [];
    for (let gm = 0; gm < (1 << n); gm++) for (let om = 0; om < (1 << sides.length); om++) {
      const g = [...Array(n)].map((_, i) => gm & (1 << i) ? 'F' : 'M');
      const old = hops.map(() => null); sides.forEach((i, j) => old[i] = !!(om & (1 << j)));
      if (hops.some((h, i) => h === 'marry' && g[i] === g[i + 1])) continue;          // คู่สมรสเป็นชาย-หญิง
      if (stmts.every(s => (!s.gen || g[s.who] === s.gen) && (s.old == null || old[s.hop] === s.old))) out.push({ g, old });
    }
    return out;
  }
  TF.kin = { term: kinTerm, reverse: kinReverse, models: kinModels };

  /* ===== 3.4 ทิศ ===== */
  const DIRS8 = ['เหนือ', 'ตะวันออกเฉียงเหนือ', 'ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ'];
  const VEC4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // N E S W
  function dir8(dx, dy) {
    if (!dx && !dy) return null;
    const sx = Math.sign(dx), sy = Math.sign(dy);
    const t = { '0,1': 0, '1,1': 1, '1,0': 2, '1,-1': 3, '0,-1': 4, '-1,-1': 5, '-1,0': 6, '-1,1': 7 };
    return DIRS8[t[sx + ',' + sy]];
  }
  function walk(face, moves) {          // face 0..3 (N E S W) · moves: {turn:'L'|'R'|'B'|null, d}
    let x = 0, y = 0, f = face; const pts = [[0, 0]];
    for (const m of moves) {
      if (m.turn === 'R') f = (f + 1) % 4; else if (m.turn === 'L') f = (f + 3) % 4; else if (m.turn === 'B') f = (f + 2) % 4;
      x += VEC4[f][0] * m.d; y += VEC4[f][1] * m.d; pts.push([x, y]);
    }
    return { x, y, f, pts };
  }
  TF.dir = { DIRS8, DIRS4: ['เหนือ', 'ตะวันออก', 'ใต้', 'ตะวันตก'], VEC4, dir8, walk };

  /* ===== 3.5 รหัสตัวอักษร: ตระกูลกฎ (คู่ A↔Z?) × เลื่อน k × เพิ่มทีละ d × กลับลำดับ? ===== */
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function applyRule(r, w) {
    let out = [...w].map((ch, i) => { let v = A.indexOf(ch); if (r.at) v = 25 - v; v = ((v + r.k + i * r.d) % 26 + 26) % 26; return A[v]; });
    if (r.rev) out.reverse();
    return out.join('');
  }
  function ruleFamily() {
    const out = [];
    for (const at of [false, true]) for (const rev of [false, true]) for (let d = -3; d <= 3; d++) for (let k = 0; k < 26; k++) out.push({ at, rev, d, k });
    return out;
  }
  const FAM = ruleFamily();
  const consistent = ex => FAM.filter(r => ex.every(([w, c]) => applyRule(r, w) === c));
  /* รหัสตัวเลขหลัก: บวกแบบวน k (+ ทีละ d) และกลับลำดับ */
  function applyDigit(r, s) { let o = [...s].map((c, i) => String((((+c + r.k + i * r.d) % 10) + 10) % 10)); if (r.rev) o.reverse(); return o.join(''); }
  const DFAM = []; for (const rev of [false, true]) for (let d = -2; d <= 2; d++) for (let k = 0; k < 10; k++) DFAM.push({ rev, d, k });
  const dconsistent = ex => DFAM.filter(r => ex.every(([w, c]) => applyDigit(r, w) === c));
  /* ตัวอักษร → ตัวเลขลำดับ (A=1) + k · กลับด้าน (A=26) · กลับลำดับ */
  function applyNum(r, w) { let o = [...w].map(ch => { let v = A.indexOf(ch) + 1; if (r.mir) v = 27 - v; return v + r.k; }); if (r.rev) o.reverse(); return o.join('-'); }
  const NFAM = []; for (const mir of [false, true]) for (const rev of [false, true]) for (let k = -5; k <= 9; k++) NFAM.push({ mir, rev, k });
  const nconsistent = ex => NFAM.filter(r => ex.every(([w, c]) => applyNum(r, w) === c));
  /* รหัสคำ: ไล่ทุกการจับคู่คำ ↔ รหัส ให้แต่ละประโยคมีชุดรหัสตรงกัน */
  function wordModels(words, codes, sents) {
    return perms(codes).filter(p => sents.every(s => { const set = new Set(s.c); return s.w.length === s.c.length && s.w.every(w => set.has(p[words.indexOf(w)])); }))
      .map(p => { const m = {}; words.forEach((w, i) => m[w] = p[i]); return m; });
  }
  TF.code = { A, apply: applyRule, family: FAM, consistent, applyDigit, dconsistent, applyNum, nconsistent, wordModels };

  /* ===== 3.6 ตรรกะประพจน์ / จับคู่ / เลือกทีม ===== */
  function ev(e, v) {                   // e: {t:'v',i} | {t:'not',a} | {t:'imp'|'or'|'and'|'iff',a,b}
    switch (e.t) {
      case 'v': return v[e.i];
      case 'not': return !ev(e.a, v);
      case 'imp': return !ev(e.a, v) || ev(e.b, v);
      case 'or': return ev(e.a, v) || ev(e.b, v);
      case 'and': return ev(e.a, v) && ev(e.b, v);
      case 'nand': return !(ev(e.a, v) && ev(e.b, v));
      default: throw new Error('expr ' + e.t);
    }
  }
  function truthModels(n, prem) { const out = []; for (let m = 0; m < (1 << n); m++) { const v = [...Array(n)].map((_, i) => !!(m & (1 << i))); if (prem.every(e => ev(e, v))) out.push(v); } return out; }
  const sameMeaning = (n, e1, e2) => truthModels(n, []).every(v => ev(e1, v) === ev(e2, v));
  TF.logic = { ev, models: truthModels, same: sameMeaning };
})(window.TF = window.TF || {});

/* ===== 3.6 การจับคู่ และการเลือกทีม ===== */
(function (TF) {
  'use strict';
  const perms = TF.bf.perms, combos = TF.bf.combos;
  /* จับคู่: แต่ละคนได้ของในกลุ่ม A หนึ่งอย่าง (และกลุ่ม B ถ้ามี) ไม่ซ้ำกัน · m.A[คน] = ของ */
  function matchHolds(m, c) {
    switch (c.t) {
      case 'is': return m[c.g][c.p] === c.v;
      case 'not': return m[c.g][c.p] !== c.v;
      case 'either': return m[c.g][c.p] === c.v || m[c.g][c.p] === c.w;
      case 'link': return c.people.some(p => m.A[p] === c.a && m.B[p] === c.b);
      case 'notlink': return !c.people.some(p => m.A[p] === c.a && m.B[p] === c.b);
      default: throw new Error('match ' + c.t);
    }
  }
  function matchSolve(people, A, B, clues) {
    const out = [], pa = perms(A), pb = B ? perms(B) : [null];
    for (const x of pa) for (const y of pb) {
      const m = { A: {}, B: {} }; people.forEach((p, i) => { m.A[p] = x[i]; if (y) m.B[p] = y[i]; });
      if (clues.every(c => matchHolds(m, { ...c, people }))) out.push(m);
    }
    return out;
  }
  /* เลือกทีม k คนจาก n คน */
  function teamHolds(T, c) {
    const h = x => T.includes(x);
    switch (c.t) {
      case 'req': return !h(c.a) || h(c.b);
      case 'excl': return !(h(c.a) && h(c.b));
      case 'atleast': return h(c.a) || h(c.b);
      case 'must': return h(c.a);
      case 'notif': return h(c.a) || h(c.b);
      case 'in': return h(c.a);
      case 'out': return !h(c.a);
      case 'both': return h(c.a) && h(c.b);
      default: throw new Error('team ' + c.t);
    }
  }
  const teamSolve = (names, k, clues) => combos(names, k).filter(T => clues.every(c => teamHolds(T, c)));
  TF.match = { holds: matchHolds, solve: matchSolve };
  TF.team = { holds: teamHolds, solve: teamSolve };
})(window.TF = window.TF || {});
