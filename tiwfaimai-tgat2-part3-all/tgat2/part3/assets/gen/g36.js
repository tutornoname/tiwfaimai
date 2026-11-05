/* ติวไฟไหม้ — 3.6 เงื่อนไขหลายชั้น: ข้อใดสรุปได้แน่นอน
   ตัวตรวจ: ไล่ทุกค่าความจริง / ทุกการจับคู่ / ทุกทีม · ตัวเลือก "ถ้า…แล้ว…" ห้ามจริงโดยอัตโนมัติ */
(function (TF) {
  'use strict';
  const G = TF.logic, MT = TF.match, TM = TF.team, U = TF.util, MC = TF.mc, L = TF.LETTERS;
  const NAMES = ['เมย์', 'ภู', 'จูน', 'ปาล์ม', 'ใหม่', 'ต้า', 'แนน', 'บอส', 'เฟิร์น', 'กัน', 'ริน', 'โจ้'];
  const VERBS = ['ไปค่าย', 'เรียนดนตรี', 'ว่ายน้ำ', 'อ่านหนังสือ', 'ไปตลาด', 'เล่นเกม', 'ปลูกต้นไม้', 'ทำอาหาร', 'วิ่งตอนเช้า', 'ไปห้องสมุด'];
  TF.topicInfo['3.6'] = {
    title: '3.6 เงื่อนไขหลายชั้น: ข้อใดสรุปได้แน่นอน',
    tips: ['"ถ้า A แล้ว B" = "ถ้าไม่ B แล้วไม่ A" (กลับข้างพร้อมนิเสธ) แต่ไม่เท่ากับ "ถ้า B แล้ว A"',
      '"A หรือ B" = อย่างน้อยหนึ่งอย่าง · ถ้ารู้ว่าไม่ A ก็ได้ B ทันที',
      'จับคู่/เลือกทีม: ทำตาราง ✓✗ เริ่มจากเงื่อนไขที่บังคับแน่ แล้วไล่ทุกแบบที่เหลือ']
  };

  /* ===================== ตรรกะประพจน์ ===================== */
  const lit = (i, neg) => neg ? { t: 'not', a: { t: 'v', i } } : { t: 'v', i };
  function sayE(e, P) {
    const atom = (x) => x.t === 'v' ? `${P[x.i].s} ${P[x.i].v}` : `${P[x.a.i].s} ไม่${P[x.a.i].v}`;
    if (e.t === 'v' || e.t === 'not') return atom(e);
    if (e.t === 'imp') return `ถ้า ${atom(e.a)} แล้ว ${atom(e.b)}`;
    if (e.t === 'or') return `${atom(e.a)} หรือ ${atom(e.b)} (อย่างน้อยหนึ่งอย่าง)`;
    if (e.t === 'and') return `${atom(e.a)} และ ${atom(e.b)}`;
    throw new Error('say ' + e.t);
  }
  const ekey = (e, n) => G.models(n, []).map(v => G.ev(e, v) ? 1 : 0).join('');   // ความหมาย = ตารางค่าความจริง
  const props = n => { const s = U.shuffle(NAMES.slice()), v = U.shuffle(VERBS.slice()); return [...Array(n)].map((_, i) => ({ s: s[i], v: v[i] })); };
  const rb = () => Math.random() < 0.35;
  function propPrem(n, withOr) {
    const ord = U.shuffle([...Array(n).keys()]), P = [];
    P.push({ t: 'imp', a: lit(ord[0], rb()), b: lit(ord[1], rb()) });
    P.push({ t: 'imp', a: lit(ord[1], P[0].b.t === 'not'), b: lit(ord[2], rb()) });   // ต่อลูกโซ่ได้จริง
    if (withOr) P.push({ t: 'or', a: lit(ord[3], rb()), b: lit(ord[U.R(3)], rb()) });
    else if (n > 3) P.push({ t: 'imp', a: lit(ord[3], rb()), b: lit(ord[U.R(3)], rb()) });
    const f = U.pick([0, 2, 3].filter(i => i < n)); P.push(lit(ord[f], rb()));         // ข้อเท็จจริงหนึ่งข้อ
    return U.shuffle(P);
  }
  function propCands(n) {
    const out = [];
    for (let i = 0; i < n; i++) for (const ng of [false, true]) out.push(lit(i, ng));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) for (const na of [false, true]) for (const nb of [false, true]) {
      out.push({ t: 'imp', a: lit(i, na), b: lit(j, nb) });
      if (i < j) out.push({ t: 'or', a: lit(i, na), b: lit(j, nb) }, { t: 'and', a: lit(i, na), b: lit(j, nb) });
    }
    return out;
  }
  const vacuous = (e, M) => (e.t === 'imp' && (TF.bf.labelOf(M, v => G.ev(e.a, v)) === 'NONE' || TF.bf.labelOf(M, v => G.ev(e.b, v)) === 'ALL'))
    || (e.t === 'or' && (TF.bf.labelOf(M, v => G.ev(e.a, v)) === 'ALL' || TF.bf.labelOf(M, v => G.ev(e.b, v)) === 'ALL'));   // ห้ามจริงโดยอัตโนมัติ
  function minimal(e, prem, n, want) {      // ข้อความในโจทย์น้อยที่สุดที่ทำให้ได้ผลนี้
    const sets = []; for (let i = 0; i < prem.length; i++) sets.push([i]);
    for (let i = 0; i < prem.length; i++) for (let j = i + 1; j < prem.length; j++) sets.push([i, j]);
    for (let i = 0; i < prem.length; i++) sets.push(prem.map((_, j) => j).filter(j => j !== i));
    for (const s of sets) { const M = G.models(n, s.map(i => prem[i])); if (M.length && TF.bf.labelOf(M, v => G.ev(e, v)) === want) return s.map(i => prem[i]); }
    return null;
  }
  function propTag(e, P, M, n) {
    const same = (x, y) => ekey(x, n) === ekey(y, n);
    const neg = x => x.t === 'not' ? x.a : { t: 'not', a: x };
    for (const p of P) if (p.t === 'imp') {
      if (e.t === 'imp' && same(e, { t: 'imp', a: p.b, b: p.a })) return { tag: 'conv', why: 'กลับเงื่อนไข — "ถ้า A แล้ว B" ไม่ได้แปลว่า "ถ้า B แล้ว A"' };
      if (e.t === 'imp' && same(e, { t: 'imp', a: neg(p.a), b: neg(p.b) })) return { tag: 'inv', why: 'ใส่ "ไม่" ทั้งสองข้างโดยไม่สลับข้าง — ที่ถูกคือ "ถ้าไม่ B แล้วไม่ A"' };
    }
    if (e.t === 'and') return { tag: 'and', why: '"และ" ต้องจริงทั้งสองอย่าง แต่โจทย์บังคับได้ไม่ถึง' };
    if (e.t === 'or') return { tag: 'or', why: '"หรือ" นี้ยังไม่ถูกบังคับให้เกิด' };
    return { tag: 'lit' + e.t, why: '' };
  }
  function makeProp(n, withOr, qtype) {
    const P = props(n), prem = propPrem(n, withOr), M = G.models(n, prem);
    if (!M.length || M.length === 1 && Math.random() < 0.6) return null;
    const pk = new Set(prem.map(e => ekey(e, n))), cands = [];
    for (const e of propCands(n)) {
      if (pk.has(ekey(e, n)) || vacuous(e, M)) continue;
      const lab = TF.bf.labelOf(M, v => G.ev(e, v));
      const t = qtype === 'def' ? propTag(e, prem, M, n) : { tag: e.t + lab, why: '' };
      cands.push({ e, key: ekey(e, n) + '|' + sayE(e, P), sem: ekey(e, n), lab, ...t });
    }
    // ตัวเลือกห้ามมีความหมายเดียวกัน: เก็บข้อความละหนึ่งความหมาย
    const bySem = {}; for (const c of U.shuffle(cands)) if (!bySem[c.sem]) bySem[c.sem] = c;
    const B = MC.build(qtype, Object.values(bySem), { minTags: 2 }); if (!B) return null;
    const ex = (e, want) => { const v = M.find(v => G.ev(e, v) === want); return v ? P.map((p, i) => `${p.s}${v[i] ? '' : 'ไม่'}${p.v}`).join(' · ') : ''; };
    const opts = B.opts.map(o => {
      let why = o.why, x = '';
      if (o !== B.ans) {
        if (o.lab === 'SOME') { x = (qtype === 'def' ? 'กรณีที่ข้อนี้ไม่จริง: ' : 'กรณีที่ข้อนี้จริง: ') + ex(o.e, qtype !== 'def'); why = why || (qtype === 'def' ? 'ยังไม่แน่ — มีกรณีที่ไม่จริง' : 'ข้อนี้ยังเป็นไปได้'); }
        else if (o.lab === 'NONE') { const mm = minimal(o.e, prem, n, 'NONE'); why = (o.tag === 'conv' || o.tag === 'inv' ? why + ' · ' : '') + 'ข้อนี้เป็นไปไม่ได้ เพราะขัดกับ ' + (mm ? mm.map(e => '"' + sayE(e, P) + '"').join(' กับ ') : 'เงื่อนไขทุกข้อรวมกัน'); }
        else why = 'ข้อนี้จริงทุกกรณี — ระวังอ่านคำถามสลับ';
      }
      return { text: sayE(o.e, P), correct: o === B.ans, why, ex: x, e: o.e };
    });
    const status = P.map((_, i) => { const l = TF.bf.labelOf(M, v => v[i]); return l === 'ALL' ? 'T' : l === 'NONE' ? 'F' : '?'; });
    const edges = prem.filter(e => e.t !== 'v' && e.t !== 'not').map(e => ({ a: (e.a.t === 'v' ? e.a : e.a.a).i, b: (e.b.t === 'v' ? e.b : e.b.a).i, na: e.a.t === 'not', nb: e.b.t === 'not', kind: e.t }));
    const steps = ['เริ่มจากข้อเท็จจริงที่บอกตรง ๆ แล้วไล่ลูกศร (ใช้ได้ทั้งทางตรงและกลับข้างพร้อมนิเสธ)', 'ไล่ทุกค่าความจริงที่ไม่ขัดเงื่อนไข เหลือ ' + M.length + ' กรณี: ' + P.map((p, i) => `${p.s}${p.v} ${status[i] === 'T' ? '✓' : status[i] === 'F' ? '✗' : '?'}`).join(' · ')]
      .concat(opts.map((o, i) => `${L[i]}. ${o.text} → ${MC.WORD[TF.bf.labelOf(M, v => G.ev(o.e, v))]}${o.correct ? ' ✓' : ''}`));
    const d = { type: 'prop', n, P, prem, qtype, opts: opts.map(o => o.e) };
    return {
      stem: '<p>กำหนดให้ข้อความต่อไปนี้เป็นจริงทั้งหมด</p><ol class="concl">' + prem.map(e => '<li>' + U.esc(sayE(e, P)) + '</li>').join('') + '</ol><p class="ask">' + MC.ASK[qtype] + '</p>',
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why, ex: o.ex })),
      answerIndex: B.answerIndex,
      solution: { svg: TF.draw.logic(P.map(p => p.s), edges, status), legend: TF.draw.legend.logic + ' · ' + P.map(p => `${p.s} = ${p.s}${p.v}`).join(' · '), steps, shortcut: 'ทำลูกศรต่อกันเป็นลูกโซ่ แล้วใช้คู่ "กลับข้าง + นิเสธ" เดินย้อนได้ ส่วนตัวเลือกที่ "กลับเงื่อนไข" หรือ "ใส่ไม่ทั้งสองข้าง" ตัดทิ้งทันที' },
      data: d
    };
  }
  function verifyProp(q) {
    const d = q.data;
    for (const e of d.prem) if (!q.stem.includes(U.esc(sayE(e, d.P)))) return 'premise text';
    if (q.options.some((o, i) => o.text !== sayE(d.opts[i], d.P))) return 'option text';
    const M = G.models(d.n, d.prem); if (!M.length) return 'เงื่อนไขขัดกันเอง';
    const sem = d.opts.map(e => ekey(e, d.n)), pk = new Set(d.prem.map(e => ekey(e, d.n)));
    if (new Set(sem).size !== 5 || sem.some(s => pk.has(s))) return 'ตัวเลือกความหมายซ้ำ/ซ้ำโจทย์';
    if (d.opts.some(e => vacuous(e, M))) return 'มีตัวเลือก ถ้า…แล้ว… ที่จริงโดยอัตโนมัติ';
    return MC.check(d.qtype, d.opts.map(e => TF.bf.labelOf(M, v => G.ev(e, v))), q.answerIndex);
  }

  /* ---------- ข้อความที่มีความหมายเหมือนกัน (ตารางค่าความจริง) ---------- */
  function makeEquiv() {
    const P = props(2), na = rb(), nb = rb(), base = Math.random() < 0.7 ? { t: 'imp', a: lit(0, na), b: lit(1, nb) } : { t: 'or', a: lit(0, na), b: lit(1, nb) };
    const neg = x => x.t === 'not' ? x.a : { t: 'not', a: x };
    const A = base.a, Bx = base.b, list = [];
    if (base.t === 'imp') {
      list.push({ e: { t: 'imp', a: neg(Bx), b: neg(A) }, tag: 'ok' }, { e: { t: 'or', a: neg(A), b: Bx }, tag: 'ok2' },
        { e: { t: 'imp', a: Bx, b: A }, tag: 'conv', why: 'กลับเงื่อนไข — ความหมายไม่เหมือนเดิม' }, { e: { t: 'imp', a: neg(A), b: neg(Bx) }, tag: 'inv', why: 'ใส่ "ไม่" ทั้งสองข้างแต่ไม่สลับข้าง' },
        { e: { t: 'and', a: A, b: Bx }, tag: 'and', why: '"และ" บังคับให้เกิดทั้งคู่ แต่ "ถ้า…แล้ว…" ไม่ได้บังคับให้ข้อแรกเกิด' }, { e: { t: 'or', a: A, b: neg(Bx) }, tag: 'or', why: 'เปลี่ยนเป็น "หรือ" ผิดข้าง — ที่ถูกคือ "ไม่ A หรือ B"' }, { e: { t: 'imp', a: A, b: neg(Bx) }, tag: 'negb', why: 'เปลี่ยนผลลัพธ์เป็นนิเสธ ความหมายตรงข้าม' },
        { e: { t: 'or', a: A, b: Bx }, tag: 'orp', why: '"หรือ" แบบไม่มีนิเสธไม่ใช่ความหมายของ "ถ้า…แล้ว…" — ที่ถูกคือ "ไม่ A หรือ B"' }, { e: { t: 'and', a: A, b: neg(Bx) }, tag: 'negall', why: 'นี่คือกรณีเดียวที่ทำให้ข้อความเดิมเป็นเท็จ' });
    } else {
      list.push({ e: { t: 'imp', a: neg(A), b: Bx }, tag: 'ok' }, { e: { t: 'imp', a: neg(Bx), b: A }, tag: 'ok2' },
        { e: { t: 'imp', a: A, b: Bx }, tag: 'conv', why: '"A หรือ B" แปลว่า "ถ้าไม่ A แล้ว B" ไม่ใช่ "ถ้า A แล้ว B"' }, { e: { t: 'and', a: A, b: Bx }, tag: 'and', why: '"หรือ" ต้องการแค่อย่างน้อยหนึ่งอย่าง ไม่ใช่ทั้งสองอย่าง' },
        { e: { t: 'imp', a: A, b: neg(Bx) }, tag: 'xor', why: '"หรือ" ในข้อนี้ยอมให้เกิดทั้งสองอย่างได้' }, { e: { t: 'or', a: neg(A), b: neg(Bx) }, tag: 'negs', why: 'ใส่ "ไม่" ทั้งสองข้าง ความหมายเปลี่ยน' }, { e: { t: 'imp', a: neg(Bx), b: neg(A) }, tag: 'inv2', why: 'กลับข้างแบบ "ถ้า…แล้ว…" ใช้กับ "หรือ" ตรง ๆ ไม่ได้' },
        { e: { t: 'and', a: neg(A), b: neg(Bx) }, tag: 'none', why: 'ตรงข้ามกับ "อย่างน้อยหนึ่งอย่าง" — นี่คือกรณีที่ทำให้ข้อความเดิมเป็นเท็จ' }, { e: { t: 'imp', a: Bx, b: A }, tag: 'conv2', why: '"หรือ" ไม่ได้บอกว่าเหตุการณ์หนึ่งทำให้อีกเหตุการณ์เกิด' }, { e: { t: 'and', a: A, b: neg(Bx) }, tag: 'one', why: 'นี่เป็นแค่กรณีเดียวของ "หรือ" ไม่ใช่ความหมายทั้งหมด' });
    }
    const bk = ekey(base, 2), eq = list.filter(x => ekey(x.e, 2) === bk), ne = list.filter(x => ekey(x.e, 2) !== bk);
    const uniq = []; for (const x of U.shuffle(ne)) if (!uniq.some(y => ekey(y.e, 2) === ekey(x.e, 2))) uniq.push(x);
    if (!eq.length || uniq.length < 4) return null;
    const ans = U.pick(eq), opts = U.shuffle([ans, ...uniq.slice(0, 4)]);
    const d = { type: 'equiv', n: 2, P, base, opts: opts.map(o => o.e) };
    const rows = G.models(2, []).map(v => [`${P[0].s}${v[0] ? '' : 'ไม่'}${P[0].v} · ${P[1].s}${v[1] ? '' : 'ไม่'}${P[1].v}`, G.ev(base, v) ? '✓' : '✗', ...opts.map(o => G.ev(o.e, v) ? '✓' : '✗')]);
    return {
      stem: `<p>ข้อความ: "${U.esc(sayE(base, P))}"</p><p class="ask">ข้อใดมี<u>ความหมายเหมือน</u>ข้อความนี้</p>`,
      options: opts.map(o => ({ text: sayE(o.e, P), correct: o === ans, why: o === ans ? '' : o.why, ex: '' })),
      answerIndex: opts.indexOf(ans),
      solution: { svg: TF.draw.table(['กรณี', 'ข้อความ', ...L], rows), legend: 'ตารางค่าความจริง: ✓ = ข้อความเป็นจริงในกรณีนั้น · ข้อที่ความหมายเหมือนต้องได้ ✓/✗ ตรงกับคอลัมน์ "ข้อความ" ทุกแถว', steps: ['เขียนทุกกรณีของสองเหตุการณ์ (4 กรณี) แล้วเทียบผลทีละตัวเลือก', `ตัวเลือก ${L[opts.indexOf(ans)]} ได้ผลตรงกับข้อความเดิมทุกกรณี`], shortcut: base.t === 'imp' ? '"ถ้า A แล้ว B" เหมือนกับ "ถ้าไม่ B แล้วไม่ A" และ "ไม่ A หรือ B" เท่านั้น' : '"A หรือ B" เหมือนกับ "ถ้าไม่ A แล้ว B" และ "ถ้าไม่ B แล้ว A"' },
      data: d
    };
  }
  function verifyEquiv(q) {
    const d = q.data;
    if (!q.stem.includes(U.esc(sayE(d.base, d.P)))) return 'base text';
    if (q.options.some((o, i) => o.text !== sayE(d.opts[i], d.P))) return 'option text';
    const bk = ekey(d.base, 2), sem = d.opts.map(e => ekey(e, 2));
    if (new Set(sem).size !== 5) return 'ตัวเลือกความหมายซ้ำกัน';
    return MC.check('one', sem.map(s => s === bk ? 'ALL' : 'NONE'), q.answerIndex);
  }

  /* ===================== จับคู่ ===================== */
  const MTH = [
    { A: ['แมว', 'สุนัข', 'กระต่าย', 'ปลาทอง'], va: 'เลี้ยง', B: ['ฟุตบอล', 'แบดมินตัน', 'ว่ายน้ำ', 'ปิงปอง'], vb: 'ชอบเล่น', intro: 'แต่ละคนเลี้ยงสัตว์คนละชนิด' , intro2: 'และชอบเล่นกีฬาคนละประเภท' },
    { A: ['ชมรมดนตรี', 'ชมรมวาดภาพ', 'ชมรมหุ่นยนต์', 'ชมรมภาษา'], va: 'อยู่', B: ['สีแดง', 'สีฟ้า', 'สีเขียว', 'สีเหลือง'], vb: 'ใส่เสื้อ', intro: 'แต่ละคนอยู่ชมรมคนละชมรม', intro2: 'และใส่เสื้อคนละสี' }
  ];
  function sayM(c, th) {
    const v = g => g === 'A' ? th.va : th.vb;
    if (c.t === 'is') return `${c.p} ${v(c.g)}${c.v}`;
    if (c.t === 'not') return `${c.p} ไม่ได้${v(c.g)}${c.v}`;
    if (c.t === 'either') return `${c.p} ${v(c.g)}${c.v} หรือ${c.w}`;
    if (c.t === 'link') return `คนที่${th.va}${c.a} ${th.vb}${c.b}`;
    if (c.t === 'notlink') return `คนที่${th.va}${c.a} ไม่ได้${th.vb}${c.b}`;
  }
  const mkey = c => JSON.stringify([c.t, c.g, c.p, c.v, c.w, c.a, c.b]);
  function makeMatch(n, two, qtype) {
    const th = U.pick(MTH), people = U.shuffle(NAMES.slice()).slice(0, n), A = U.shuffle(th.A.slice()).slice(0, n), Bv = two ? U.shuffle(th.B.slice()).slice(0, n) : null;
    const all = MT.solve(people, A, Bv, []), H = U.pick(all);
    const pool = [];
    for (const p of people) {
      for (const g of two ? ['A', 'B'] : ['A']) { const S = g === 'A' ? A : Bv; for (const v of S) { pool.push({ t: H[g][p] === v ? 'is' : 'not', g, p, v }); for (const w of S) if (w !== v && (H[g][p] === v || H[g][p] === w)) pool.push({ t: 'either', g, p, v, w }); } }
    }
    if (two) for (const a of A) for (const b of Bv) pool.push({ t: people.some(p => H.A[p] === a && H.B[p] === b) ? 'link' : 'notlink', a, b });
    const truthy = U.shuffle(pool.filter(c => MT.holds(H, { ...c, people })).filter(c => c.t !== 'is' || Math.random() < 0.25));
    let clues = [], sols = all;
    const want = qtype === 'one' ? 1 : 2 + U.R(2);
    for (const c of truthy) { if (sols.length <= want) break; const ns = sols.filter(m => MT.holds(m, { ...c, people })); if (ns.length < sols.length && ns.length >= (qtype === 'one' ? 1 : 2)) { clues.push(c); sols = ns; } }
    if (qtype === 'one' ? sols.length !== 1 : sols.length < 2 || sols.length > 4) return null;
    for (const c of clues.slice()) { const rest = clues.filter(x => x !== c); if (MT.solve(people, A, Bv, rest).length === sols.length) clues = rest; }
    const ck = new Set(clues.map(mkey)), cands = [];
    for (const p of people) for (const g of two ? ['A', 'B'] : ['A']) for (const v of g === 'A' ? A : Bv) cands.push({ t: 'is', g, p, v });
    if (two) for (const a of A) for (const b of Bv) cands.push({ t: 'link', a, b });
    const qt = qtype === 'one' ? 'def' : qtype;
    const C2 = cands.filter(c => !ck.has(mkey(c))).map(c => {
      const lab = TF.bf.labelOf(sols, m => MT.holds(m, { ...c, people }));
      let tag = 'g' + lab, why = '';
      if (lab === 'NONE') { const v = clues.find(x => all.every(m => !(MT.holds(m, { ...x, people }) && MT.holds(m, { ...c, people })))) || clues.find(x => MT.solve(people, A, Bv, clues.filter(y => y !== x)).some(m => MT.holds(m, { ...c, people }))); tag = v ? 'contra' + v.t : 'multi'; why = v ? `ขัดกับเงื่อนไข "${sayM(v, th)}"` : 'ขัดกับเงื่อนไขหลายข้อรวมกัน'; }
      else if (lab === 'SOME') { tag = 'some' + c.t; why = qt === 'def' ? 'จริงเพียงบางแบบ ยังไม่แน่นอน' : 'ยังเป็นไปได้ในบางแบบ'; }
      else { tag = 'readq'; why = 'ข้อนี้จริงทุกแบบ — ระวังอ่านคำถามสลับ'; }
      return { c, key: mkey(c), lab, tag, why };
    });
    const B = MC.build(qt, C2, { minTags: 2, mixImp: qt === 'imp' }); if (!B) return null;
    const desc = m => people.map(p => `${p}: ${m.A[p]}${two ? ' / ' + m.B[p] : ''}`).join(' · ');
    const opts = B.opts.map(o => ({ text: sayM(o.c, th), correct: o === B.ans, why: o === B.ans ? '' : o.why, ex: o !== B.ans && o.lab === 'SOME' ? 'ดูแบบที่ ' + (sols.findIndex(m => MT.holds(m, { ...o.c, people }) === (qt !== 'def')) + 1) : '', c: o.c }));
    const grid = (g, S) => TF.draw.table([g === 'A' ? '' : '', ...S], people.map(p => [p, ...S.map(v => { const l = TF.bf.labelOf(sols, m => m[g][p] === v); return l === 'ALL' ? '✓' : l === 'NONE' ? '✗' : '?'; })]));
    const d = { type: 'match', th: MTH.indexOf(th), people, A, B: Bv, clues, qt, opts: opts.map(o => o.c) };
    const steps = [`ไล่ทุกการจับคู่ที่ไม่ขัดเงื่อนไข เหลือ ${sols.length} แบบ`, ...sols.map((m, i) => `แบบที่ ${i + 1}: ${desc(m)}`), ...opts.map((o, i) => `${L[i]}. ${o.text} → ${MC.WORD[TF.bf.labelOf(sols, m => MT.holds(m, { ...o.c, people }))]}${o.correct ? ' ✓' : ''}`)];
    return {
      stem: `<p>${people.join(', ')} ${th.intro}${two ? th.intro2 : ''} (ตัวเลือกมี ${A.join(', ')}${two ? ' และ ' + Bv.join(', ') : ''})</p><ol class="concl">${clues.map(c => '<li>' + U.esc(sayM(c, th)) + '</li>').join('')}</ol><p class="ask">${MC.ASK[qt]}</p>`,
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why, ex: o.ex })),
      answerIndex: B.answerIndex,
      solution: { svg: grid('A', A) + (two ? '<div style="height:8px"></div>' + grid('B', Bv) : ''), legend: TF.draw.legend.match, steps, shortcut: 'ทำตาราง คน × ตัวเลือก ใส่ ✗ จากเงื่อนไข "ไม่" ก่อน ช่องไหนเหลือ ✓ ได้ช่องเดียวในแถว/คอลัมน์ ล็อกได้ทันที' },
      data: d
    };
  }
  function verifyMatch(q) {
    const d = q.data, th = MTH[d.th];
    for (const c of d.clues) if (!q.stem.includes(U.esc(sayM(c, th)))) return 'clue text';
    if (q.options.some((o, i) => o.text !== sayM(d.opts[i], th))) return 'option text';
    const sols = MT.solve(d.people, d.A, d.B, d.clues); if (!sols.length) return 'ขัดกันเอง';
    const ck = new Set(d.clues.map(mkey));
    if (new Set(d.opts.map(mkey)).size !== 5 || d.opts.some(c => ck.has(mkey(c)))) return 'ตัวเลือกซ้ำ';
    return MC.check(d.qt, d.opts.map(c => TF.bf.labelOf(sols, m => MT.holds(m, { ...c, people: d.people }))), q.answerIndex);
  }

  /* ===================== เลือกทีม ===================== */
  function sayT(c) {
    return {
      req: `ถ้าเลือก ${c.a} ต้องเลือก ${c.b} ด้วย`, excl: `${c.a} กับ ${c.b} ห้ามอยู่ทีมเดียวกัน`, atleast: `ต้องเลือก ${c.a} หรือ ${c.b} อย่างน้อยหนึ่งคน`,
      must: `ต้องเลือก ${c.a}`, notif: `ถ้าไม่เลือก ${c.a} ต้องเลือก ${c.b}`, in: `${c.a} ได้อยู่ในทีม`, out: `${c.a} ไม่ได้อยู่ในทีม`, both: `${c.a} และ ${c.b} อยู่ในทีมทั้งคู่`, imp: `ถ้า ${c.a} อยู่ในทีม แล้ว ${c.b} อยู่ในทีมด้วย`
    }[c.t];
  }
  const tkey = c => JSON.stringify([c.t, c.a, c.b]);
  const tHolds = (T, c) => c.t === 'imp' ? (!T.includes(c.a) || T.includes(c.b)) : TM.holds(T, c);
  function makeTeam(qtype) {
    const n = 6, k = 3, names = U.shuffle(NAMES.slice()).slice(0, n), all = TF.bf.combos(names, k), H = U.pick(all);
    const pool = [];
    for (const a of names) for (const b of names) if (a !== b) { pool.push({ t: 'req', a, b }, { t: 'excl', a, b }, { t: 'atleast', a, b }, { t: 'notif', a, b }); }
    const truthy = U.shuffle(pool.filter(c => TM.holds(H, c) && !(c.t === 'excl' && c.a > c.b) && !(c.t === 'atleast' && c.a > c.b)));
    let clues = [], sols = all;
    for (const c of truthy) { if (sols.length <= 3 || clues.length >= 5) break; const ns = sols.filter(T => TM.holds(T, c)); if (ns.length < sols.length && ns.length >= 2) { clues.push(c); sols = ns; } }
    if (sols.length < 2 || sols.length > 4 || clues.length < 3) return null;
    for (const c of clues.slice()) { const rest = clues.filter(x => x !== c); if (TM.solve(names, k, rest).length === sols.length) clues = rest; }
    if (clues.length < 3) return null;
    const ck = new Set(clues.map(tkey)), cands = [];
    for (const a of names) { cands.push({ t: 'in', a }, { t: 'out', a }); for (const b of names) if (a !== b) { cands.push({ t: 'imp', a, b }); if (a < b) cands.push({ t: 'both', a, b }); } }
    const C2 = [];
    for (const c of cands) {
      if (ck.has(tkey(c))) continue;
      if (c.t === 'imp') { const la = TF.bf.labelOf(sols, T => T.includes(c.a)), lb = TF.bf.labelOf(sols, T => T.includes(c.b)); if (la === 'NONE' || lb === 'ALL') continue; }   // ห้ามจริงโดยอัตโนมัติ
      const lab = TF.bf.labelOf(sols, T => tHolds(T, c));
      let tag = c.t + lab, why = '';
      if (lab === 'SOME') why = qtype === 'def' ? 'จริงเพียงบางทีม ยังไม่แน่นอน' : 'ยังเป็นไปได้ในบางทีม';
      else if (lab === 'NONE') { const v = clues.find(x => all.every(T => !(TM.holds(T, x) && tHolds(T, c)))) || clues.find(x => TM.solve(names, k, clues.filter(y => y !== x)).some(T => tHolds(T, c))); why = v ? `ขัดกับเงื่อนไข "${sayT(v)}"` : 'ขัดกับเงื่อนไขหลายข้อรวมกัน'; tag = 'contra' + (v ? v.t : ''); }
      else { why = 'ข้อนี้จริงทุกทีม — ระวังอ่านคำถามสลับ'; tag = 'readq'; }
      C2.push({ c, key: tkey(c), lab, tag, why });
    }
    const B = MC.build(qtype, C2, { minTags: 2 }); if (!B) return null;
    const opts = B.opts.map(o => ({ text: sayT(o.c), correct: o === B.ans, why: o === B.ans ? '' : o.why, ex: o !== B.ans && o.lab === 'SOME' ? 'ดูทีม: ' + sols.find(T => tHolds(T, o.c) === (qtype !== 'def')).join(', ') : '', c: o.c }));
    const d = { type: 'team', names, k, clues, qtype, opts: opts.map(o => o.c) };
    const steps = [`ไล่ทุกทีม ${k} คนจาก ${n} คน (${all.length} แบบ) เหลือทีมที่ไม่ขัดเงื่อนไข ${sols.length} แบบ: ` + sols.map(T => '{' + T.join(', ') + '}').join(' · '), ...opts.map((o, i) => `${L[i]}. ${o.text} → ${MC.WORD[TF.bf.labelOf(sols, T => tHolds(T, o.c))]}${o.correct ? ' ✓' : ''}`)];
    return {
      stem: `<p>ต้องเลือกนักเรียน ${k} คนจาก ${names.join(', ')} ไปแข่งขัน โดยมีเงื่อนไขดังนี้</p><ol class="concl">${clues.map(c => '<li>' + U.esc(sayT(c)) + '</li>').join('')}</ol><p class="ask">${MC.ASK[qtype]}</p>`,
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why, ex: o.ex })),
      answerIndex: B.answerIndex,
      solution: { svg: '<ol class="teamlist">' + sols.map(T => '<li>' + U.esc(T.join(', ')) + '</li>').join('') + '</ol>', legend: TF.draw.legend.team, steps, shortcut: 'เริ่มจากเงื่อนไข "ห้ามอยู่ด้วยกัน" กับ "ถ้าเลือก…ต้องเลือก…" แล้วนับที่ว่างที่เหลือ — ทีมมีแค่ ' + k + ' ที่ ถ้าเงื่อนไขดึงคนมาเกินก็ตัดได้ทันที' },
      data: d
    };
  }
  function verifyTeam(q) {
    const d = q.data;
    for (const c of d.clues) if (!q.stem.includes(U.esc(sayT(c)))) return 'clue text';
    if (q.options.some((o, i) => o.text !== sayT(d.opts[i]))) return 'option text';
    const sols = TM.solve(d.names, d.k, d.clues); if (!sols.length) return 'ขัดกันเอง';
    const ck = new Set(d.clues.map(tkey));
    if (new Set(d.opts.map(tkey)).size !== 5 || d.opts.some(c => ck.has(tkey(c)))) return 'ตัวเลือกซ้ำ';
    for (const c of d.opts) if (c.t === 'imp' && (TF.bf.labelOf(sols, T => T.includes(c.a)) === 'NONE' || TF.bf.labelOf(sols, T => T.includes(c.b)) === 'ALL')) return 'ถ้า…แล้ว… จริงโดยอัตโนมัติ';
    return MC.check(d.qtype, d.opts.map(c => TF.bf.labelOf(sols, T => tHolds(T, c))), q.answerIndex);
  }
  function verify(q) {
    const e = MC.basic(q); if (e) return TF.res(e);
    const t = q.data.type;
    return TF.res(t === 'prop' ? verifyProp(q) : t === 'equiv' ? verifyEquiv(q) : t === 'match' ? verifyMatch(q) : verifyTeam(q));
  }
  const reg = (id, name, stars, target, make) => TF.register({ topic: '3.6', id, name, stars, target, make, verify });
  reg('prop-chain', 'ลูกโซ่ ถ้า…แล้ว… · สรุปได้แน่นอน', 1, 45, () => makeProp(3, false, 'def'));
  reg('match3', 'จับคู่ 3×3', 1, 45, () => makeMatch(3, false, 'one'));
  reg('equiv', 'ข้อความที่มีความหมายเหมือนกัน', 2, 45, makeEquiv);
  reg('prop-imp', 'ลูกโซ่ 4 เหตุการณ์ · เป็นไปไม่ได้', 2, 60, () => makeProp(4, false, 'imp'));
  reg('team-def', 'เลือกทีม 3 จาก 6 · สรุปได้แน่นอน', 2, 75, () => makeTeam('def'));
  reg('match4', 'จับคู่ 4×4 · หลายแบบ', 3, 90, () => makeMatch(4, false, 'def'));
  reg('match2a', 'จับคู่สองคุณสมบัติ', 3, 90, () => makeMatch(3, true, 'def'));
  reg('prop-or', 'ถ้า…แล้ว… ผสม หรือ', 3, 75, () => makeProp(4, true, 'def'));
  reg('team-imp', 'เลือกทีม · เป็นไปไม่ได้', 3, 75, () => makeTeam('imp'));
})(window.TF = window.TF || {});
