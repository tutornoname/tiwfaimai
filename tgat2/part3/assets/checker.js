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
