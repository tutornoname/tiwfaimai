/* ติวไฟไหม้ — 3.1 เงื่อนไขสัญลักษณ์ (>, <, =, ≥, ≤)
   generator แบบมีพารามิเตอร์: สุ่มโครง → ประกอบโจทย์ → ตัวตรวจ brute force (checker.js) ตัดสินทุกตัวเลือก */
(function (TF) {
  'use strict';
  const O = TF.order, U = TF.util, L = TF.LETTERS;
  const POOLS = [['K', 'L', 'M', 'N', 'P', 'Q'], ['R', 'S', 'T', 'U', 'W', 'Z'], ['F', 'G', 'H', 'J', 'V', 'D']];
  const SYMS = ['@', '#', '$', '&', '%', '*'];
  const WORD = { ALL: 'จริงแน่นอน', NONE: 'เป็นไปไม่ได้', SOME: 'ไม่แน่' };
  const FIX2 = ['ข้อสรุปทั้งสองถูก', 'ข้อสรุปทั้งสองผิด', 'ข้อสรุป 1 ถูก แต่ข้อสรุป 2 ผิด', 'ข้อสรุป 1 ผิด แต่ข้อสรุป 2 ถูก', 'สรุปไม่ได้แน่ชัด'];
  TF.topicInfo['3.1'] = {
    title: '3.1 เงื่อนไขสัญลักษณ์',
    tips: ['เรียงตัวมากไว้บนเป็นผังก่อนอ่านตัวเลือก',
      'ไล่ทางลงทิศเดียวกัน: มี > สักตัวในทาง ผลเป็น > · มีแต่ ≥ ผลเป็น ≥',
      '≥ วนกลับหาตัวเดิม = ทุกตัวในวงเท่ากัน · ทิศสวนกันหรือคนละกิ่ง = สรุปไม่ได้']
  };

  /* ---------- โครงเงื่อนไข (ภายในเก็บเป็น [ตัวบน, op, ตัวล่าง] op ∈ > ≥ =) ---------- */
  const vset = n => U.shuffle(U.pick(POOLS).slice()).slice(0, n);
  function ops(n, eq) {               // ต้องมีทั้ง > และ ≥ อย่างน้อยอย่างละตัว
    for (;;) {
      const a = [...Array(n)].map(() => eq && Math.random() < 0.15 ? '=' : Math.random() < 0.55 ? '>' : '≥');
      if (a.includes('>') && a.includes('≥')) return a;
    }
  }
  function chain(n, eq) {
    const v = vset(n), o = ops(n - 1, eq);
    return { kind: 'chain', vars: v, prem: o.map((op, i) => [v[i], op, v[i + 1]]) };
  }
  function branch() {
    const [a, b, c, d, e] = vset(5);
    const shape = U.pick([
      [[a, b], [b, c], [d, b], [c, e]],        // สองตัวบนมาบรรจบที่ b
      [[a, b], [b, c], [b, d], [d, e]],        // แยกลงสองกิ่งจาก b
      [[a, b], [b, c], [a, d], [d, e]],        // สองกิ่งขนานจาก a
      [[a, c], [b, c], [c, d], [c, e]]         // ทรงกากบาท
    ]);
    const o = ops(4, true);
    return { kind: 'branch', vars: [a, b, c, d, e], prem: shape.map((p, i) => [p[0], o[i], p[1]]) };
  }
  function cycle() {
    const [x, y, z, d, e] = vset(5);
    const prem = [[x, '≥', y], [y, '≥', z], [z, '≥', x], [U.pick([x, y, z]), Math.random() < 0.6 ? '>' : '≥', d]];
    prem.push(Math.random() < 0.5 ? [e, U.pick(['>', '≥']), U.pick([x, y, z])] : [d, U.pick(['>', '≥']), e]);
    return { kind: 'cycle', vars: [x, y, z, d, e], prem, cyc: [x, y, z] };
  }
  function custom() {
    const b = Math.random() < 0.5 ? chain(5, false) : branch();
    b.prem = b.prem.filter(p => p[1] !== '=').length === b.prem.length ? b.prem : b.prem.map(p => p[1] === '=' ? [p[0], '≥', p[2]] : p);
    const s = U.shuffle(SYMS.slice());
    b.sym = { '>': s[0], '<': s[1], '≥': s[2], '=': s[3] };
    b.kind = 'custom';
    return b;
  }

  /* ---------- แสดงผล ---------- */
  function show(r, sym) {             // สุ่มทิศการเขียน a > b หรือ b < a
    let [a, o, b] = r;
    if (sym) {
      if (o === '>' && Math.random() < 0.5) return b + ' ' + sym['<'] + ' ' + a;
      if (o === '=' && Math.random() < 0.5) return b + ' ' + sym['='] + ' ' + a;
      return a + ' ' + sym[o] + ' ' + b;
    }
    if (Math.random() < 0.5) [a, o, b] = [b, O.FLIP[o], a];
    return a + ' ' + o + ' ' + b;
  }
  function plain(t, sym) {            // แปลข้อความที่แสดงกลับเป็น > ≥ = < (ใช้ทั้งตัวสร้างและตัวตรวจ)
    const p = t.trim().split(/\s+/);
    if (p.length !== 3) throw new Error('parse: ' + t);
    let op = p[1];
    if (sym) { op = Object.keys(sym).find(k => sym[k] === p[1]); if (!op) throw new Error('sym: ' + t); }
    if (!O.OPS[op]) throw new Error('op: ' + t);
    return [p[0], op, p[2]];
  }
  const candidates = vars => {
    const out = [];
    for (const a of vars) for (const b of vars) if (a !== b) for (const o of ['>', '≥', '=']) if (o !== '=' || a < b) out.push([a, o, b]);
    return out;
  };

  /* ---------- ป้ายความผิดพลาดของตัวเลือก ---------- */
  function mistake(M, S, c, q) {
    const [a, o, b] = c, lab = O.label(M, c), rl = S.relate(a, b);
    if (q === 'imp') {
      if (lab === 'ALL') return { tag: 'readq', why: 'ข้อนี้จริงเสมอ คือเป็นข้อที่ "สรุปได้แน่นอน" แต่คำถามถามหาข้อที่ "เป็นไปไม่ได้" — ระวังอ่านคำถามสลับ' };
      if (o === '=') return { tag: 'eqok', why: (rl.kind === 'apart' ? `${a} กับ ${b} อยู่คนละกิ่ง จึงเท่ากันได้` : `ทางระหว่าง ${a} กับ ${b} มีแต่ ≥ ซึ่งยอมให้เท่ากัน`) };
      if (rl.kind === 'apart') return { tag: 'apart', why: `${a} กับ ${b} อยู่คนละกิ่ง ใครจะมากกว่าก็ได้` };
      if (rl.kind === 'up') return { tag: 'geq', why: `ผังบอกว่า ${rl.text} แต่ ${a} ${o} ${b} ยังจริงได้ในกรณีที่ทั้งสองเท่ากัน` };
      return { tag: 'geq', why: `≥ รวมกรณี > ไว้ด้วย จึงเป็นไปได้` };
    }
    if (o === '=') {
      if (lab === 'NONE') return { tag: 'eqgap', why: `มองข้าม > ที่คั่นอยู่ — ${rl.text} มี > ในทาง จึงเท่ากันไม่ได้` };
      if (rl.kind === 'apart') return { tag: 'cross', why: `${a} กับ ${b} อยู่คนละกิ่ง เทียบกันไม่ได้ อย่าเดาว่าเท่ากัน` };
      return { tag: 'eqmaybe', why: `${rl.text} มีแต่ ≥ จึงแค่ "อาจ" เท่ากัน ไม่ใช่เท่ากันแน่` };
    }
    if (rl.kind === 'same') return { tag: 'loop', why: `ผังบอกว่า ${rl.text} คือเท่ากันเสมอ จึงมากกว่ากันไม่ได้` };
    if (rl.kind === 'up') return { tag: 'rev', why: `สลับทิศ — ผังบอกว่า ${rl.text}` };
    if (rl.kind === 'down' && o === '>' && !rl.strict) return { tag: 'strict', why: `อ่าน ≥ เป็น > — ${rl.text} มีแต่ ≥ จึงอาจเท่ากัน` };
    return { tag: 'cross', why: `เชื่อมลูกโซ่ข้ามเครื่องหมายที่สวนทาง — ${a} กับ ${b} อยู่คนละกิ่ง เทียบกันไม่ได้` };
  }

  /* ---------- ส่วนเฉลย ---------- */
  const SHORT = {
    chain: 'เขียนผังเป็นเส้นเดียวก่อน แล้วดูแค่ว่าในทางระหว่างสองตัวมี > อย่างน้อยหนึ่งตัวหรือไม่',
    branch: 'ถ้าจะเดินจากตัวหนึ่งไปอีกตัวต้อง "ขึ้นแล้วลง" หรือ "ลงแล้วขึ้น" = คนละกิ่ง ตัดตัวเลือกนั้นทิ้งทันที',
    cycle: 'เจอ ≥ ที่วนกลับมาหาตัวเดิม ยุบทุกตัวในวงเป็นกล่องเดียวกันก่อน โจทย์จะเหลือสั้นลงทันที',
    custom: 'แปลสัญลักษณ์กลับเป็น > ≥ = เขียนกำกับไว้ข้างโจทย์ก่อน แล้วทำแบบปกติ',
    two: 'ตัดสินทีละข้อเป็น ถูก / ผิด / ไม่แน่ — ถ้าข้อแรกไม่แน่ ตอบ จ ได้เลยไม่ต้องดูข้อสอง',
    imp: 'หาตัวเลือกที่ "สวนผัง" เช่น ให้ตัวล่างมากกว่าตัวบน หรือให้เท่ากันทั้งที่มี > คั่น'
  };
  function headSteps(b, S) {
    const st = [];
    if (b.sym) st.push('แปลสัญลักษณ์: ' + b.premText.map(t => t + ' → ' + plain(t, b.sym).join(' ')).join(' , '));
    if (b.cyc) st.push(b.cyc.join(' ≥ ') + ' ≥ ' + b.cyc[0] + ' วนกลับด้วย ≥ → ' + b.cyc.join(' = '));
    st.push('รวมเงื่อนไขเป็นผัง' + (S.isChain ? ': ' + S.chainText : ' (ดูภาพ)'));
    return st;
  }
  const relLine = (S, c) => { const r = S.relate(c[0], c[2]); return r.text; };
  const tr = (b, t) => b.sym ? t + ' [' + plain(t, b.sym).join(' ') + ']' : t;

  /* ---------- ประกอบโจทย์ ---------- */
  function setup(b) {
    b.premText = b.prem.map(p => show(p, b.sym));
    if (b.kind !== 'chain') U.shuffle(b.premText);
    b.real = b.premText.map(t => plain(t, b.sym));
    b.M = O.models(b.vars, b.real);
    if (!b.M.length) return null;
    b.S = O.structure(b.vars, b.M);
    b.pk = new Set(b.real.map(O.key));
    b.pp = new Set(b.real.map(O.pairKey));
    return b;
  }
  function stemHTML(b, question, extra) {
    let h = '';
    if (b.sym) h += '<p class="def">กำหนดสัญลักษณ์</p><ul class="defs">' + ['>', '<', '≥', '='].map(o => `<li><b>X ${U.esc(b.sym[o])} Y</b> หมายถึง X ${U.esc(o)} Y</li>`).join('') + '</ul>';
    h += '<p>กำหนดให้ <span class="prem">' + b.premText.map(t => '<span class="nowrap">' + U.esc(t) + '</span>').join(' , ') + '</span></p>';
    h += '<p class="ask">' + question + '</p>' + (extra || '');
    return h;
  }
  const packData = (b, qtype) => ({ vars: b.vars.slice(), premText: b.premText.slice(), sym: b.sym || null, qtype });

  function pickDistractors(b, pool, q, need) {
    const tagged = pool.map(c => ({ c, m: mistake(b.M, b.S, c, q) }));
    const groups = {};
    for (const t of U.shuffle(tagged)) (groups[t.m.tag] = groups[t.m.tag] || []).push(t);
    const keys = U.shuffle(Object.keys(groups)), out = [], usedPair = {};
    let samePrem = 0;
    for (let round = 0; out.length < need && round < 6; round++) for (const k of keys) {
      if (out.length >= need) break;
      const g = groups[k]; while (g.length) {
        const t = g.shift(), pk = O.pairKey(t.c);
        if ((usedPair[pk] || 0) >= (round ? 2 : 1)) continue;
        if (b.pp.has(pk) && samePrem >= 1) continue;
        if (b.pp.has(pk)) samePrem++;
        usedPair[pk] = (usedPair[pk] || 0) + 1; out.push(t); break;
      }
    }
    return out.length === need ? out : null;
  }

  function makeDefinite(build) {
    const b = setup(build()); if (!b) return null;
    const C = candidates(b.vars).filter(c => !b.pk.has(O.key(c)));
    const good = C.filter(c => O.label(b.M, c) === 'ALL' && !b.pp.has(O.pairKey(c)) && !(c[1] === '≥' && O.label(b.M, [c[0], '>', c[2]]) === 'ALL'));
    if (!good.length) return null;
    const ans = U.pick(good);
    const pool = C.filter(c => O.label(b.M, c) !== 'ALL');
    const ds = pickDistractors(b, pool, 'def', 4); if (!ds) return null;
    if (new Set(ds.map(d => d.m.tag)).size < 3) return null;
    const opts = U.shuffle([{ c: ans, correct: true }, ...ds.map(d => ({ c: d.c, correct: false, why: d.m.why, ex: O.example(b.M, d.c, false) }))]);
    opts.forEach(o => o.text = show(o.c, b.sym));
    const answerIndex = opts.findIndex(o => o.correct);
    const steps = headSteps(b, b.S).concat(opts.map((o, i) => `${L[i]}. ${tr(b, o.text)} → ${WORD[O.label(b.M, o.c)]} (${relLine(b.S, o.c)})${o.correct ? ' ✓' : ''}`));
    return {
      stem: stemHTML(b, 'ข้อใดสรุปได้<u>แน่นอน</u>'),
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why || '', ex: o.ex ? 'กรณีที่ข้อนี้ไม่จริง: ' + o.ex : '' })),
      answerIndex,
      solution: { svg: TF.draw.order(b.S, [ans[0], ans[2]]), legend: TF.draw.legend.order, steps, shortcut: SHORT[b.kind] },
      data: packData(b, 'def')
    };
  }
  function makeImpossible(build) {
    const b = setup(build()); if (!b) return null;
    const C = candidates(b.vars).filter(c => !b.pk.has(O.key(c)));
    const none = C.filter(c => O.label(b.M, c) === 'NONE' && !b.pp.has(O.pairKey(c)));
    if (!none.length) return null;
    const ans = U.pick(none), ns = 2 + U.R(2);
    const some = C.filter(c => O.label(b.M, c) === 'SOME'), all = C.filter(c => O.label(b.M, c) === 'ALL' && !(c[1] === '≥' && O.label(b.M, [c[0], '>', c[2]]) === 'ALL'));
    const d1 = pickDistractors(b, some, 'imp', ns), d2 = pickDistractors(b, all, 'imp', 4 - ns);
    if (!d1 || !d2) return null;
    const ds = d1.concat(d2);
    if (new Set(ds.map(d => O.key(d.c))).size < 4) return null;
    const opts = U.shuffle([{ c: ans, correct: true }, ...ds.map(d => ({ c: d.c, correct: false, why: d.m.why, ex: O.label(b.M, d.c) === 'SOME' ? O.example(b.M, d.c, true) : '' }))]);
    opts.forEach(o => o.text = show(o.c, b.sym));
    const answerIndex = opts.findIndex(o => o.correct);
    const steps = headSteps(b, b.S).concat(opts.map((o, i) => `${L[i]}. ${tr(b, o.text)} → ${WORD[O.label(b.M, o.c)]} (${relLine(b.S, o.c)})${o.correct ? ' ✓' : ''}`));
    return {
      stem: stemHTML(b, 'ข้อใด<u>เป็นไปไม่ได้</u>'),
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why || '', ex: o.ex ? 'กรณีที่ข้อนี้เป็นจริง: ' + o.ex : '' })),
      answerIndex,
      solution: { svg: TF.draw.order(b.S, [ans[0], ans[2]]), legend: TF.draw.legend.order, steps, shortcut: SHORT.imp + ' · ' + SHORT[b.kind] },
      data: packData(b, 'imp')
    };
  }
  const TWO_IMPLY = [['ALL', 'ALL'], ['NONE', 'NONE'], ['ALL', 'NONE'], ['NONE', 'ALL']];
  const say = s => s === 'ALL' ? 'ถูก' : s === 'NONE' ? 'ผิด' : 'ไม่แน่';
  function makeTwo(build) {                 // ล็อกคำตอบเป้าหมายก่อน แล้วสุ่มโครงจนได้ เพื่อให้ ก–จ กระจายเท่ากัน
    const target = U.R(5);
    for (let k = 0; k < 40; k++) { const q = buildTwo(build, target); if (q) return q; }
    return null;
  }
  function buildTwo(build, target) {
    const b = setup(build()); if (!b) return null;
    const want = target < 4 ? TWO_IMPLY[target] : U.shuffle(['SOME', U.pick(['ALL', 'NONE', 'SOME'])]);
    const C = U.shuffle(candidates(b.vars).filter(c => !b.pk.has(O.key(c)) && !b.pp.has(O.pairKey(c))));
    const ok = (c, s) => O.label(b.M, c) === s && !(c[1] === '≥' && s === 'ALL' && O.label(b.M, [c[0], '>', c[2]]) === 'ALL');
    const c1 = C.find(c => ok(c, want[0])); if (!c1) return null;
    const c2 = C.find(c => ok(c, want[1]) && O.pairKey(c) !== O.pairKey(c1)); if (!c2) return null;
    const cs = [c1, c2], t = cs.map(c => show(c, b.sym)), st = cs.map(c => O.label(b.M, c));
    function whyFor(i) {
      const lines = [];
      if (i === 4) { lines.push('ทั้งสองข้อตัดสินได้แน่ ไม่มีข้อใด "ไม่แน่" จึงไม่ต้องตอบ จ'); cs.forEach((c, k) => lines.push(`ข้อสรุป ${k + 1} ${say(st[k])}: ${relLine(b.S, c)}`)); return lines.join(' · '); }
      TWO_IMPLY[i].forEach((imp, k) => {
        if (imp === st[k]) return;
        const c = cs[k];
        if (st[k] === 'SOME' && imp === 'ALL') lines.push(`ข้อสรุป ${k + 1} ยังไม่แน่ — ${mistake(b.M, b.S, c, 'def').why} (กรณีที่ไม่จริง: ${O.example(b.M, c, false)})`);
        else if (st[k] === 'SOME') lines.push(`ข้อสรุป ${k + 1} ยังเป็นไปได้ (เช่น ${O.example(b.M, c, true)}) — "ผิด" ในข้อนี้หมายถึงเป็นไปไม่ได้เท่านั้น ไม่ใช่ "ไม่แน่"`);
        else if (st[k] === 'ALL') lines.push(`ข้อสรุป ${k + 1} จริงแน่นอน: ${relLine(b.S, c)}`);
        else lines.push(`ข้อสรุป ${k + 1} เป็นไปไม่ได้: ${relLine(b.S, c)}`);
      });
      return lines.join(' · ');
    }
    const opts = FIX2.map((x, i) => ({ text: x, correct: i === target, why: i === target ? '' : whyFor(i), ex: '' }));
    const steps = headSteps(b, b.S).concat(cs.map((c, k) => `ข้อสรุป ${k + 1}: ${tr(b, t[k])} → ${say(st[k])} (${relLine(b.S, c)})`), [`จึงตอบ ${L[target]}. ${FIX2[target]}`]);
    const extra = '<ol class="concl"><li>' + U.esc(t[0]) + '</li><li>' + U.esc(t[1]) + '</li></ol><p class="note">ถูก = จริงแน่นอน · ผิด = เป็นไปไม่ได้ · ถ้ามีข้อใดไม่แน่ ให้ตอบ จ</p>';
    const d = packData(b, 'two'); d.concl = t.slice();
    return {
      stem: stemHTML(b, 'พิจารณาข้อสรุปต่อไปนี้', extra),
      options: opts, answerIndex: target, fixed: true,
      solution: { svg: TF.draw.order(b.S, [c1[0], c1[2], c2[0], c2[2]]), legend: TF.draw.legend.order, steps, shortcut: SHORT.two },
      data: d
    };
  }

  /* ---------- ตัวตรวจอิสระ: อ่านข้อความที่จะแสดงจริง แล้วไล่ทุกกรณีใหม่ทั้งหมด ---------- */
  function verify(q) {
    const d = q.data, bad = m => ({ ok: false, msg: m });
    const P = d.premText.map(t => plain(t, d.sym));
    for (const t of d.premText) if (!q.stem.includes(U.esc(t))) return bad('premise text missing in stem');
    for (const v of d.vars) if (!P.some(p => p[0] === v || p[2] === v)) return bad('unused var ' + v);
    const M = O.models(d.vars, P);
    if (!M.length) return bad('เงื่อนไขขัดกันเอง');
    if (q.options.length !== 5) return bad('need 5 options');
    if (q.options.filter(o => o.correct).length !== 1 || !q.options[q.answerIndex].correct) return bad('answer flag mismatch');
    const pk = new Set(P.map(O.key));
    if (d.qtype === 'two') {
      if (q.options.some((o, i) => o.text !== FIX2[i])) return bad('fixed options changed');
      const R = d.concl.map(t => plain(t, d.sym));
      for (const t of d.concl) if (!q.stem.includes(U.esc(t))) return bad('conclusion missing');
      if (R.some(r => pk.has(O.key(r))) || O.key(R[0]) === O.key(R[1])) return bad('conclusion repeats premise');
      const s = R.map(r => O.label(M, r));
      const exp = s.includes('SOME') ? 4 : { 'ALL,ALL': 0, 'NONE,NONE': 1, 'ALL,NONE': 2, 'NONE,ALL': 3 }[s.join()];
      return exp === q.answerIndex ? { ok: true } : bad('two-conclusion answer wrong');
    }
    const R = q.options.map(o => plain(o.text, d.sym));
    if (new Set(R.map(O.key)).size !== 5) return bad('duplicate options');
    if (R.some(r => pk.has(O.key(r)))) return bad('option repeats premise');
    const lab = R.map(r => O.label(M, r)), want = d.qtype === 'def' ? 'ALL' : 'NONE';
    if (lab.filter(l => l === want).length !== 1) return bad('correct count ≠ 1: ' + lab.join());
    if (lab[q.answerIndex] !== want) return bad('answer label wrong');
    return { ok: true };
  }

  /* ---------- ทะเบียนรูปแบบ ---------- */
  const reg = (id, name, stars, make) => TF.register({ topic: '3.1', id, name, stars, make, verify });
  reg('chain-def-s', 'ลูกโซ่สั้น · สรุปได้แน่นอน', 1, () => makeDefinite(() => chain(3 + U.R(2), false)));
  reg('chain-imp-s', 'ลูกโซ่สั้น · เป็นไปไม่ได้', 1, () => makeImpossible(() => chain(4, false)));
  reg('chain-def', 'ลูกโซ่ 5 ตัว · สรุปได้แน่นอน', 2, () => makeDefinite(() => chain(5, true)));
  reg('branch-def', 'แตกกิ่ง · สรุปได้แน่นอน', 2, () => makeDefinite(branch));
  reg('branch-imp', 'แตกกิ่ง · เป็นไปไม่ได้', 2, () => makeImpossible(branch));
  reg('cycle-def', '≥ วนกลับ · สรุปได้แน่นอน', 2, () => makeDefinite(cycle));
  reg('cycle-imp', '≥ วนกลับ · เป็นไปไม่ได้', 2, () => makeImpossible(cycle));
  reg('custom-def', 'สัญลักษณ์นิยามใหม่ · สรุปได้แน่นอน', 3, () => makeDefinite(custom));
  reg('custom-imp', 'สัญลักษณ์นิยามใหม่ · เป็นไปไม่ได้', 3, () => makeImpossible(custom));
  reg('two-branch', 'ข้อสรุป 2 ข้อ · แตกกิ่ง', 3, () => makeTwo(branch));
  reg('two-cycle', 'ข้อสรุป 2 ข้อ · ≥ วนกลับ', 3, () => makeTwo(cycle));
  reg('two-chain6', 'ข้อสรุป 2 ข้อ · ลูกโซ่ 6 ตัว', 3, () => makeTwo(() => chain(6, true)));
})(window.TF = window.TF || {});
