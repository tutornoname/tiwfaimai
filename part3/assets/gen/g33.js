/* ติวไฟไหม้ — 3.3 จัดตำแหน่ง ลำดับ และที่นั่ง
   ตัวตรวจ: ไล่ทุกการเรียง (โต๊ะกลมปักคนแรกไว้ เพื่อตัดกรณีที่ได้จากการหมุนโต๊ะ) */
(function (TF) {
  'use strict';
  const S = TF.seat, U = TF.util, MC = TF.mc, L = TF.LETTERS;
  const NAMES = ['ต้น', 'ฝน', 'บีม', 'ปอ', 'มายด์', 'กาย', 'ฟ้า', 'น้ำ', 'ไอซ์', 'แพรว', 'พลอย', 'ภูมิ', 'ขิม', 'ออม', 'ตาล', 'เจ', 'วิว', 'นัท'];
  const RANK = [
    { gt: 'สูงกว่า', rank: 'สูงเป็นอันดับที่', top: 'สูงที่สุด', bot: 'เตี้ยที่สุด', between: 'สูงอยู่ระหว่างสองคนนี้', mid: 'ไม่ใช่คนที่สูงที่สุดและไม่ใช่คนที่เตี้ยที่สุด', adj: 'สูงเป็นอันดับติดกัน', intro: 'เพื่อน {n} คนยืนเทียบความสูงกัน ไม่มีใครสูงเท่ากัน (อันดับที่ 1 = สูงที่สุด)' },
    { gt: 'ได้คะแนนมากกว่า', rank: 'ได้คะแนนเป็นอันดับที่', top: 'ได้คะแนนมากที่สุด', bot: 'ได้คะแนนน้อยที่สุด', between: 'ได้คะแนนอยู่ระหว่างสองคนนี้', mid: 'ไม่ใช่คนที่ได้คะแนนมากที่สุดและไม่ใช่คนที่ได้น้อยที่สุด', adj: 'ได้คะแนนเป็นอันดับติดกัน', intro: 'เพื่อน {n} คนสอบวิชาเดียวกัน ไม่มีใครได้คะแนนเท่ากัน (อันดับที่ 1 = คะแนนมากที่สุด)' },
    { gt: 'มาถึงก่อน', rank: 'มาถึงเป็นคนที่', top: 'มาถึงเป็นคนแรก', bot: 'มาถึงเป็นคนสุดท้าย', between: 'มาถึงระหว่างสองคนนี้', mid: 'ไม่ได้มาถึงเป็นคนแรกและไม่ได้มาเป็นคนสุดท้าย', adj: 'มาถึงติดกัน (ไม่มีใครมาคั่น)', intro: 'เพื่อน {n} คนมาถึงจุดนัดทีละคน ไม่มีใครมาพร้อมกัน' }
  ];
  TF.topicInfo['3.3'] = {
    title: '3.3 จัดตำแหน่ง ลำดับ และที่นั่ง',
    tips: ['เริ่มจากเงื่อนไขที่ล็อกแน่นที่สุด (ตำแหน่งตายตัว · ติดกัน · ตรงข้าม) ผูกเป็นก้อนก่อนวาง',
      '"ทางซ้ายของ" ไม่ต้องติดกัน · "ติดทางซ้าย" ต้องนั่งติดกัน',
      'โต๊ะกลม: ทุกคนหันเข้ากลางโต๊ะ ขวามือ = ทวนเข็มนาฬิกาเมื่อมองจากด้านบน · ปักคนแรกไว้ก่อนเสมอ']
  };
  function say(c, d) {
    const a = c.a, b = c.b;
    if (d.kind === 'rank') { const T = RANK[d.th]; return {
      gt: `${a} ${T.gt} ${b}`, rank: `${a} ${T.rank} ${c.p + 1}`, mid: `${a} ${T.mid}`, adj: `${a} กับ ${b} ${T.adj}`,
      gapR: `${a} ${T.gt} ${b} โดยมีคน${T.between} ${c.k} คน`, notPos: `${a} ไม่ได้${T.rank.replace(/^ได้/, '')} ${c.p + 1}` }[c.t]; }
    if (d.kind === 'round') return {
      adjRight: `${a} นั่งติดทางขวามือของ ${b}`, adjLeft: `${a} นั่งติดทางซ้ายมือของ ${b}`, adj: `${a} นั่งติดกับ ${b}`, notAdj: `${a} ไม่ได้นั่งติดกับ ${b}`, opp: `${a} นั่งตรงข้ามกับ ${b}` }[c.t];
    return {
      pos: `${a} นั่งตำแหน่งที่ ${c.p + 1}`, notPos: `${a} ไม่ได้นั่งตำแหน่งที่ ${c.p + 1}`, leftOf: `${a} นั่งอยู่ทางซ้ายของ ${b} (ไม่จำเป็นต้องติดกัน)`,
      adjLeft: `${a} นั่งติดทางซ้ายของ ${b}`, adjRight: `${a} นั่งติดทางขวาของ ${b}`, adj: `${a} นั่งติดกับ ${b}`, notAdj: `${a} ไม่ได้นั่งติดกับ ${b}`,
      end: `${a} นั่งริมสุดด้านใดด้านหนึ่ง`, notEnd: `${a} ไม่ได้นั่งริมสุด`, gap: `ระหว่าง ${a} กับ ${b} มีคนนั่งคั่นอยู่ ${c.k} คน` }[c.t];
  }
  const ckey = c => c.t + '|' + ((c.t === 'adj' || c.t === 'notAdj' || c.t === 'opp') ? [c.a, c.b].sort().join(',') : c.a + ',' + (c.b || '')) + '|' + (c.p != null ? c.p : '') + '|' + (c.k != null ? c.k : '');
  const intro = d => d.kind === 'row' ? `${d.names.length} คนนั่งเก้าอี้เรียงกันเป็นแถวเดียว ตำแหน่งที่ 1 ถึง ${d.names.length} นับจากซ้ายไปขวา (ซ้าย/ขวา ในข้อนี้คือตามที่ผู้อ่านมองเห็น)`
    : d.kind === 'round' ? `${d.names.length} คนนั่งรอบโต๊ะกลม ${d.names.length} ที่ เว้นระยะเท่ากัน ทุกคนหันหน้าเข้ากลางโต๊ะ (ขวามือ = ทวนเข็มนาฬิกาเมื่อมองจากด้านบน)`
      : RANK[d.th].intro.replace('{n}', d.names.length);
  const solve = d => S.arr(d.kind, d.names).filter(a => d.clues.every(c => S.holds(d.kind, a, c)));

  /* ข้อความจริงทั้งหมดของผังหนึ่ง (ใช้ทั้งเป็นเงื่อนไขและตัวเลือก) */
  function facts(kind, a, forClue) {
    const n = a.length, out = [];
    for (const x of a) for (const y of a) if (x !== y) {
      if (kind === 'row') { out.push({ t: 'leftOf', a: x, b: y }, { t: 'adjLeft', a: x, b: y }, { t: 'adjRight', a: x, b: y }, { t: 'adj', a: x, b: y }, { t: 'notAdj', a: x, b: y }); for (let k = 1; k <= n - 3; k++) out.push({ t: 'gap', a: x, b: y, k }); }
      else if (kind === 'round') { out.push({ t: 'adjRight', a: x, b: y }, { t: 'adjLeft', a: x, b: y }, { t: 'adj', a: x, b: y }, { t: 'notAdj', a: x, b: y }); if (n % 2 === 0) out.push({ t: 'opp', a: x, b: y }); }
      else { out.push({ t: 'gt', a: x, b: y }, { t: 'adj', a: x, b: y }); for (let k = 1; k <= n - 3; k++) out.push({ t: 'gapR', a: x, b: y, k }); }
    }
    for (const x of a) {
      if (kind === 'row') { for (let p = 0; p < n; p++) out.push({ t: 'pos', a: x, p }, { t: 'notPos', a: x, p }); out.push({ t: 'end', a: x }, { t: 'notEnd', a: x }); }
      if (kind === 'rank') { for (let p = 0; p < n; p++) out.push({ t: 'rank', a: x, p }, { t: 'notPos', a: x, p }); out.push({ t: 'mid', a: x }); }
    }
    return forClue ? out.filter(c => S.holds(kind, a, c)) : out;
  }
  const WEIGHT = { pos: 0.6, rank: 0.6, notPos: 0.7, leftOf: 1, gt: 1.4, adjLeft: 1, adjRight: 1, adj: 1, notAdj: 0.8, end: 0.7, notEnd: 0.6, gap: 0.9, gapR: 0.9, opp: 1.2, mid: 0.7 };
  function wpick(list) { const t = list.reduce((s, c) => s + WEIGHT[c.t], 0); let r = Math.random() * t; for (const c of list) { r -= WEIGHT[c.t]; if (r < 0) return c; } return list[list.length - 1]; }

  function puzzle(kind, n, maxSol, minSol) {
    const names = U.shuffle(NAMES.slice()).slice(0, n), d = { kind, names, th: U.R(3), clues: [] };
    const all = S.arr(kind, names), H = U.pick(all);
    let pool = facts(kind, H, true), sols = all;
    while (sols.length > maxSol && d.clues.length < 7) {
      const c = wpick(pool); pool = pool.filter(x => x !== c);
      const ns = sols.filter(a => S.holds(kind, a, c));
      if (ns.length === sols.length || ns.length < minSol) continue;
      d.clues.push(c); sols = ns;
    }
    if (sols.length > maxSol || sols.length < minSol) return null;
    for (const c of d.clues.slice()) {                    // ตัดเงื่อนไขที่ไม่จำเป็นออก
      const rest = d.clues.filter(x => x !== c);
      if (all.filter(a => rest.every(x => S.holds(kind, a, x))).length === sols.length) d.clues = rest;
    }
    if (d.clues.length < 3) return null;
    d.clues = U.shuffle(d.clues);
    return { d, sols };
  }
  function countSteps(d) {
    const all = S.arr(d.kind, d.names); let cur = all; const seq = [all.length];
    for (const c of d.clues) { cur = cur.filter(a => S.holds(d.kind, a, c)); seq.push(cur.length); }
    return 'จำนวนผังที่เหลือเมื่อใช้เงื่อนไขทีละข้อตามลำดับ: ' + seq.join(' → ');
  }
  const arrText = (d, a) => d.kind === 'row' ? '(ซ้าย) ' + a.join(' · ') + ' (ขวา)' : d.kind === 'round' ? 'เริ่มที่ ' + a[0] + ' ไล่ไปทางขวามือ: ' + a.concat(a[0]).join(' → ') : 'อันดับ 1 ถึง ' + a.length + ': ' + a.join(' · ');
  const stemOf = (d, ask) => `<p>${U.esc(intro(d))}</p><ol class="concl">${d.clues.map(c => '<li>' + U.esc(say(c, d)) + '</li>').join('')}</ol><p class="ask">${ask}</p>`;
  const SH = {
    row: 'ผูกเงื่อนไข "ติดกัน/ติดทางซ้าย" เป็นก้อนก่อน แล้วลองวางก้อนลงแถว — "ทางซ้ายของ" ใช้ตัดกรณีทีหลัง',
    round: 'ปักคนที่ถูกพูดถึงบ่อยสุดไว้ด้านล่างของโต๊ะ ขวามือของเขาคือฝั่งขวาของภาพ (ทวนเข็ม) แล้ววางคนที่ติดกันก่อน',
    rank: 'เขียนเป็นบันไดตั้ง อันดับ 1 อยู่บน วางคนที่รู้อันดับก่อน "มีคนคั่น k คน" = ห่างกัน k + 1 อันดับ'
  };

  /* ---------- แบบผังเดียว: ถามว่า "ใคร" ---------- */
  function askOf(kind, n) {
    if (kind === 'row') return Math.random() < 0.6 ? { t: 'pos', p: U.R(n) } : { t: 'adjRight', ref: true };
    if (kind === 'round') return n % 2 === 0 && Math.random() < 0.4 ? { t: 'opp', ref: true } : { t: Math.random() < 0.5 ? 'adjRight' : 'adjLeft', ref: true };
    return { t: 'rank', p: U.R(n) };
  }
  function askText(d, qa) {
    if (qa.t === 'pos') return `ใครนั่งตำแหน่งที่ ${qa.p + 1}`;
    if (qa.t === 'rank') return `ใคร${RANK[d.th].rank} ${qa.p + 1}`;
    if (qa.t === 'opp') return `ใครนั่งตรงข้ามกับ ${qa.b}`;
    return `ใครนั่งติดทาง${qa.t === 'adjRight' ? 'ขวา' : 'ซ้าย'}${d.kind === 'round' ? 'มือ' : ''}ของ ${qa.b}`;
  }
  const claimOf = (qa, x) => ({ t: qa.t, a: x, b: qa.b, p: qa.p });
  function makeWho(kind, n) {
    const P = puzzle(kind, n, 1, 1); if (!P) return null;
    const { d } = P, A = P.sols[0], qa = askOf(kind, n);
    if (qa.ref) qa.b = U.pick(d.names);
    const who = d.names.filter(x => x !== qa.b && S.holds(kind, A, claimOf(qa, x)));
    if (who.length !== 1) return null;
    const ans = who[0];
    if (d.clues.some(c => ckey(c) === ckey(claimOf(qa, ans)))) return null;   // ห้ามบอกคำตอบตรง ๆ ในเงื่อนไข
    const mir = { adjRight: 'adjLeft', adjLeft: 'adjRight' }, tagged = {};
    const put = (x, tag, why) => { if (x && x !== ans && x !== qa.b && !tagged[x]) tagged[x] = { tag, why }; };
    if (mir[qa.t]) put(d.names.find(x => x !== qa.b && S.holds(kind, A, claimOf({ t: mir[qa.t], b: qa.b }, x))), 'mirror', `สลับซ้าย-ขวา — คนนี้นั่งติดทาง${qa.t === 'adjRight' ? 'ซ้าย' : 'ขวา'}${kind === 'round' ? 'มือ' : ''}ของ ${qa.b}` + (kind === 'round' ? ' (ขวามือ = ทวนเข็ม เพราะหันเข้ากลางโต๊ะ)' : ''));
    if (qa.t === 'pos' || qa.t === 'rank') { put(A[n - 1 - qa.p], 'rev', `นับกลับด้าน — คนนี้อยู่ลำดับที่ ${qa.p + 1} เมื่อนับจาก${kind === 'row' ? 'ขวา' : 'ท้าย'}`); [qa.p - 1, qa.p + 1].forEach(p => { if (p >= 0 && p < n) put(A[p], 'off1', `นับคลาดไปหนึ่งตำแหน่ง — คนนี้อยู่ลำดับที่ ${p + 1}`); }); }
    if (qa.t === 'opp') { const i = A.indexOf(ans); [A[(i + 1) % n], A[(i + n - 1) % n]].forEach(x => put(x, 'near', 'คนนี้นั่งข้างคนที่อยู่ตรงข้าม ไม่ใช่ตรงข้ามพอดี (ตรงข้าม = ห่างกัน 3 ที่)')); }
    if (kind === 'row') {                                  // อ่าน "ทางซ้ายของ" เป็น "ติดทางซ้าย"
      const alt = { ...d, clues: d.clues.map(c => c.t === 'leftOf' ? { ...c, t: 'adjLeft' } : c) }, sa = solve(alt);
      if (sa.length === 1) put(d.names.find(x => x !== qa.b && S.holds(kind, sa[0], claimOf(qa, x))), 'adjmis', 'อ่าน "ทางซ้ายของ" เป็น "ติดทางซ้าย" — เงื่อนไขนี้ไม่จำเป็นต้องนั่งติดกัน');
    }
    const others = U.shuffle(d.names.filter(x => x !== ans && x !== qa.b));
    for (const x of others) put(x, 'gen', '');
    const dis = U.shuffle(Object.keys(tagged)).sort((x, y) => (tagged[x].tag === 'gen') - (tagged[y].tag === 'gen')).slice(0, 4);
    if (dis.length < 4 || new Set(dis.map(x => tagged[x].tag)).size < 2) return null;
    const opts = U.shuffle([ans, ...dis]);
    const where = x => kind === 'round' ? `${x} นั่งติดทางขวามือของ ${A[(A.indexOf(x) + n - 1) % n]}` : kind === 'row' ? `${x} นั่งตำแหน่งที่ ${A.indexOf(x) + 1}` : `${x} อยู่อันดับที่ ${A.indexOf(x) + 1}`;
    d.q = { mode: 'who', qa, opts };
    return {
      stem: stemOf(d, askText(d, qa)),
      options: opts.map(x => ({ text: x, correct: x === ans, why: x === ans ? '' : (tagged[x].why || 'ไม่ตรงกับผังที่เป็นไปได้เพียงแบบเดียว') + ' · ในผังจริง ' + where(x), ex: '' })),
      answerIndex: opts.indexOf(ans),
      solution: { svg: TF.draw.seats(kind, [A], [ans, qa.b].filter(Boolean)), legend: TF.draw.legend[kind], steps: [countSteps(d), 'ได้ผังเดียว: ' + arrText(d, A), `จึงตอบ ${ans}`], shortcut: SH[kind] },
      data: d
    };
  }

  /* ---------- แบบหลายผัง: สรุปได้แน่นอน / เป็นไปไม่ได้ ---------- */
  function makeMulti(kind, n, qtype) {
    const P = puzzle(kind, n, 4, 2); if (!P) return null;
    const { d, sols } = P, ck = new Set(d.clues.map(ckey));
    const ref = d.clues.flatMap(c => [c.a, c.b]).filter(Boolean);
    const mirC = c => ({ ...c, t: { adjLeft: 'adjRight', adjRight: 'adjLeft' }[c.t] || c.t, a: c.t === 'leftOf' ? c.b : c.a, b: c.t === 'leftOf' ? c.a : c.b });
    const msols = S.arr(kind, d.names).filter(a => d.clues.every(c => S.holds(kind, a, mirC(c))));
    const ALL = S.arr(kind, d.names), relaxed = d.clues.map(x => ALL.filter(a => d.clues.every(y => y === x || S.holds(kind, a, y))));
    const cands = [];
    for (const c of facts(kind, sols[0], false)) {
      if (c.t === 'notAdj' || c.t === 'notPos' || c.t === 'notEnd' || ck.has(ckey(c))) continue;
      const lab = TF.bf.labelOf(sols, a => S.holds(kind, a, c));
      let tag = 'g' + lab, why = '';
      if (lab === 'NONE') {
        if (msols.length && msols.every(a => S.holds(kind, a, c))) { tag = 'mirror'; why = 'สลับซ้าย-ขวา — ข้อนี้จะจริงก็ต่อเมื่ออ่านซ้ายเป็นขวา'; }
        else { const v = d.clues.find(x => ALL.every(a => !(S.holds(kind, a, x) && S.holds(kind, a, c)))) || d.clues.find((x, xi) => relaxed[xi].some(a => S.holds(kind, a, c))); tag = 'contra'; why = v ? 'ขัดกับเงื่อนไข "' + say(v, d) + '"' : 'ขัดกับเงื่อนไขหลายข้อรวมกัน'; }
      } else if (lab === 'SOME') { tag = 'some' + c.t; why = qtype === 'def' ? 'จริงเพียงบางผัง ยังไม่แน่นอน' : 'ยังเป็นไปได้ในบางผัง'; }
      else { tag = 'readq'; why = 'ข้อนี้จริงทุกผัง คือสรุปได้แน่นอน — ระวังอ่านคำถามสลับ'; }
      if (!ref.includes(c.a) && Math.random() < 0.5) continue;    // เน้นคนที่โจทย์พูดถึง
      cands.push({ c, key: ckey(c), lab, tag, why });
    }
    const B = MC.build(qtype, cands, { minTags: 2 }); if (!B) return null;
    const opts = B.opts.map(o => {
      let ex = '';
      if (o !== B.ans && o.lab === 'SOME') { const i = sols.findIndex(a => S.holds(kind, a, o.c) === (qtype !== 'def')); ex = `ดูแบบที่ ${i + 1}: ` + arrText(d, sols[i]); }
      return { text: say(o.c, d), correct: o === B.ans, why: o === B.ans ? '' : o.why, ex, c: o.c };
    });
    d.q = { mode: qtype, opts: opts.map(o => o.c) };
    const steps = [countSteps(d), ...sols.map((a, i) => `แบบที่ ${i + 1}: ` + arrText(d, a)), ...opts.map((o, i) => `${L[i]}. ${o.text} → ${MC.WORD[TF.bf.labelOf(sols, a => S.holds(kind, a, o.c))]}${o.correct ? ' ✓' : ''}`)];
    return {
      stem: stemOf(d, MC.ASK[qtype]),
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why, ex: o.ex })),
      answerIndex: B.answerIndex,
      solution: { svg: TF.draw.seats(kind, sols, [B.ans.c.a, B.ans.c.b].filter(Boolean)), legend: TF.draw.legend[kind], steps, shortcut: SH[kind] + (qtype === 'def' ? ' · ข้อที่สรุปได้แน่นอนต้องจริงครบทุกผัง' : ' · ข้อที่เป็นไปไม่ได้ต้องผิดครบทุกผัง') },
      data: d
    };
  }

  function verify(q) {
    const d = q.data, e = MC.basic(q); if (e) return TF.res(e);
    for (const c of d.clues) if (!q.stem.includes(U.esc(say(c, d)))) return TF.res('clue text');
    if (!q.stem.includes(U.esc(intro(d)))) return TF.res('intro');
    const sols = solve(d); if (!sols.length) return TF.res('เงื่อนไขขัดกันเอง');
    if (d.q.mode === 'who') {
      if (sols.length !== 1) return TF.res('ต้องได้ผังเดียว แต่ได้ ' + sols.length);
      if (q.options.some((o, i) => o.text !== d.q.opts[i]) || new Set(d.q.opts).size !== 5 || d.q.opts.includes(d.q.qa.b)) return TF.res('option names');
      const labs = d.q.opts.map(x => TF.bf.labelOf(sols, a => S.holds(d.kind, a, claimOf(d.q.qa, x))));
      return TF.res(MC.check('one', labs, q.answerIndex));
    }
    if (q.options.some((o, i) => o.text !== say(d.q.opts[i], d))) return TF.res('option text');
    const ck = new Set(d.clues.map(ckey));
    if (new Set(d.q.opts.map(ckey)).size !== 5 || d.q.opts.some(c => ck.has(ckey(c)))) return TF.res('ตัวเลือกซ้ำ/ซ้ำเงื่อนไข');
    return TF.res(MC.check(d.q.mode, d.q.opts.map(c => TF.bf.labelOf(sols, a => S.holds(d.kind, a, c))), q.answerIndex));
  }
  const reg = (id, name, stars, target, make) => TF.register({ topic: '3.3', id, name, stars, target, make, verify });
  reg('row-who', 'แถวเดียว 5 ที่ · ผังเดียว', 1, 45, () => makeWho('row', 5));
  reg('rank-who', 'ลำดับ 5 คน · ผังเดียว', 1, 45, () => makeWho('rank', 5));
  reg('row-def', 'แถวเดียว · หลายผัง · สรุปได้แน่นอน', 2, 75, () => makeMulti('row', 5 + U.R(2), 'def'));
  reg('round-who', 'โต๊ะกลม 6 ที่ · ผังเดียว', 2, 75, () => makeWho('round', 6));
  reg('rank-def', 'ลำดับ 6 คน · หลายผัง · สรุปได้แน่นอน', 2, 75, () => makeMulti('rank', 6, 'def'));
  reg('round-def', 'โต๊ะกลม · หลายผัง · สรุปได้แน่นอน', 3, 90, () => makeMulti('round', 5 + U.R(2), 'def'));
  reg('row-imp', 'แถว 6 ที่ · หลายผัง · เป็นไปไม่ได้', 3, 90, () => makeMulti('row', 6, 'imp'));
  reg('round-imp', 'โต๊ะกลม 6 ที่ · หลายผัง · เป็นไปไม่ได้', 3, 90, () => makeMulti('round', 6, 'imp'));
})(window.TF = window.TF || {});
