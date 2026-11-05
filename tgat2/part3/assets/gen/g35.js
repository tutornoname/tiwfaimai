/* ติวไฟไหม้ — 3.5 รหัสและการเข้ารหัส
   ตัวตรวจ: ไล่ทุกกฎในตระกูล ตัวอย่างต้องบังคับให้เหลือกฎที่สอดคล้องเพียงหนึ่งเดียว · รหัสคำไล่ทุกการจับคู่คำกับรหัส */
(function (TF) {
  'use strict';
  const C = TF.code, U = TF.util, MC = TF.mc, L = TF.LETTERS, A = C.A;
  const W5 = ['MANGO', 'TIGER', 'CLOUD', 'PLANT', 'SMILE', 'HOUSE', 'LEMON', 'RIVER', 'STONE', 'BREAD', 'CHAIR', 'DREAM', 'FLAME', 'GHOST', 'JUICE', 'KNIFE', 'LIGHT', 'MUSIC', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'ROBOT', 'SHEEP', 'TRAIN', 'WATER', 'ZEBRA', 'BEACH', 'CANDY', 'GRAPE', 'HONEY', 'KOALA', 'MAPLE', 'PANDA', 'SALAD', 'TOWEL', 'VOICE'];
  const W4 = ['BIRD', 'CAKE', 'DUCK', 'FISH', 'GOLD', 'HAND', 'KITE', 'LAMP', 'MOON', 'NOSE', 'PARK', 'RAIN', 'SHOE', 'TREE', 'WIND', 'YARN', 'BOAT', 'COIN', 'DESK', 'FROG', 'JAZZ', 'MILK'];
  TF.topicInfo['3.5'] = {
    title: '3.5 รหัสและการเข้ารหัส',
    tips: ['เขียนเลขลำดับใต้ตัวอักษร (A=1 … Z=26) แล้วดูผลต่างของแต่ละตำแหน่ง: เท่ากันหมด = เลื่อนคงที่ · เพิ่มขึ้นเป็นขั้น = เพิ่มทีละ d',
      'ผลรวมคู่ = 27 คือคู่ A↔Z · รหัสที่อ่านกลับแล้วเข้าท่า = กลับลำดับ',
      'รหัสคำ: คำที่อยู่ร่วมกันสองประโยค = รหัสที่ซ้ำกันในสองประโยคนั้น']
  };
  const mod = (x, m) => ((x % m) + m) % m;
  /* ---------- คำอธิบายกฎ ---------- */
  function describe(r) {
    const p = [];
    if (r.at) p.push('จับคู่ A↔Z (A=Z, B=Y, …)');
    if (r.k) p.push(r.k <= 13 ? `เลื่อนไปข้างหน้า ${r.k} ตัว` : `ถอยหลัง ${26 - r.k} ตัว`);
    if (r.d) p.push(r.d > 0 ? `แล้วเพิ่มอีก ${r.d} ทุกตำแหน่งถัดไป (ตำแหน่งแรกเพิ่ม 0)` : `แล้วลดอีก ${-r.d} ทุกตำแหน่งถัดไป (ตำแหน่งแรกลด 0)`);
    if (r.rev) p.push('แล้วกลับลำดับตัวอักษรทั้งคำ');
    return p.join(' → ') || 'ไม่เปลี่ยน';
  }
  function invert(r, code) {          // หาคำต้นฉบับ (กฎแต่ละตำแหน่งเป็นหนึ่งต่อหนึ่ง)
    let c = [...code]; if (r.rev) c.reverse();
    return c.map((ch, i) => A[[...A].findIndex(x => C.apply({ ...r, rev: false }, A[0].repeat(i) + x).slice(-1) === ch)]).join('');
  }
  const ROWS = (w, code) => {
    const n = [...w].map(ch => A.indexOf(ch) + 1), cn = [...code].map(ch => A.indexOf(ch) + 1);
    return [[w, ...w], ['ลำดับ', ...n], ['รหัส', ...code], ['ลำดับรหัส', ...cn]];
  };

  /* ---------- รหัสตัวอักษร ---------- */
  function ruleFor(kind) {
    const k = () => U.pick([1, 2, 3, 4, 5, 22, 23, 24, 25]);
    if (kind === 'shift') return { at: false, rev: false, d: 0, k: k() };
    if (kind === 'inc') return { at: false, rev: false, d: U.pick([1, 2, -1]), k: U.pick([0, 0, 1, 2, 25]) };
    if (kind === 'atrev') return U.pick([{ at: true, rev: false, d: 0, k: 0 }, { at: false, rev: true, d: 0, k: k() }, { at: true, rev: false, d: 0, k: U.pick([1, 2, 25]) }]);
    return U.pick([{ at: true, rev: true, d: 0, k: U.pick([0, 1, 25]) }, { at: false, rev: true, d: U.pick([1, -1]), k: U.pick([0, 1, 2]) }, { at: true, rev: false, d: 1, k: 0 }, { at: false, rev: true, d: 2, k: 25 }]);
  }
  function makeLetter(kind, decode) {
    const r = ruleFor(kind), len = Math.random() < 0.5 ? 4 : 5, pool = U.shuffle((len === 4 ? W4 : W5).slice());
    const ex = []; let i = 0;
    while (C.consistent(ex).length !== 1 && ex.length < 3) { const w = pool[i++]; ex.push([w, C.apply(r, w)]); }
    if (C.consistent(ex).length !== 1) return null;
    const qw = pool[i++], qc = C.apply(r, qw);
    const truth = decode ? qw : qc;
    const vars = [
      [{ ...r, k: mod(-r.k, 26), d: -r.d }, 'dir', 'เลื่อนผิดทาง — ตัวอย่างเลื่อน' + (r.k && r.k <= 13 ? 'ไปข้างหน้า' : 'ถอยหลัง')],
      [{ ...r, rev: !r.rev }, 'rev', r.rev ? 'ลืมกลับลำดับตัวอักษร' : 'กลับลำดับทั้งที่กฎไม่ได้กลับ'],
      [{ ...r, k: mod(r.k + r.d, 26) }, 'idx', 'เริ่มเพิ่มทีละขั้นผิดตำแหน่ง — ตำแหน่งแรกยังไม่เพิ่ม'],
      [{ ...r, at: !r.at, k: r.at ? r.k : r.k }, 'at', r.at ? 'ลืมจับคู่ A↔Z' : 'ใส่คู่ A↔Z ทั้งที่กฎไม่ได้ใช้'],
      [{ ...r, k: mod(r.k + 1, 26) }, 'off1', 'นับเลื่อนเกินไปหนึ่งตัว'],
      [{ ...r, k: mod(r.k - 1, 26) }, 'off1b', 'นับเลื่อนขาดไปหนึ่งตัว'],
      [{ ...r, d: 0 }, 'nod', 'ลืมเพิ่มทีละขั้นตามตำแหน่ง']
    ];
    const cands = [{ t: truth, ok: true }], seen = new Set([truth]);
    for (const [v, tag, why] of U.shuffle(vars)) { const t = decode ? invert(v, qc) : C.apply(v, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag, why }); } }
    while (cands.length < 5) { const t = decode ? U.pick(pool) : C.apply({ ...r, k: mod(r.k + 2 + U.R(20), 26) }, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag: 'g', why: 'ไม่ตรงกับกฎที่หาได้' }); } }
    const top = [cands[0], ...cands.slice(1, 5)], opts = U.shuffle(top.slice());
    const d = { type: 'letter', ex, qw, qc, decode, opts: opts.map(c => c.t) };
    const ask = decode ? `ถ้ารหัสคือ <b class="code">${qc}</b> คำเดิมคือคำใด` : `คำว่า <b class="code">${qw}</b> จะเขียนเป็นรหัสว่าอะไร`;
    const rows = [...ex.flatMap(([w, c]) => ROWS(w, c)), ...ROWS(qw, qc)];
    const len2 = Math.max(...rows.map(x => x.length));
    return {
      stem: '<p>ใช้กฎเดียวกันเข้ารหัสคำภาษาอังกฤษ</p><ul class="defs1">' + ex.map(([w, c]) => `<li><b class="code">${w}</b> เขียนเป็นรหัส <b class="code">${c}</b></li>`).join('') + `</ul><p class="ask">${ask}</p>`,
      options: opts.map(c => ({ text: c.t, correct: !!c.ok, why: c.ok ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(top[0]),
      solution: { svg: TF.draw.table(['', ...[...Array(len2 - 1).keys()].map(i => 'ตัวที่ ' + (i + 1))], rows), legend: TF.draw.legend.code, steps: ['ลองทุกกฎในตระกูล (เลื่อน k · เพิ่มทีละ d · คู่ A↔Z · กลับลำดับ ผสมกันได้) เหลือกฎเดียวที่เข้ากับตัวอย่าง: ' + describe(r), decode ? `ถอดกลับจาก ${qc} → ${qw}` : `ใช้กับ ${qw} → ${qc}`], shortcut: 'ดูผลต่าง "ลำดับรหัส − ลำดับเดิม" ทีละตำแหน่ง ถ้าคงที่คือเลื่อน ถ้าเพิ่มเป็นขั้นคือเพิ่มทีละ d ถ้าผลรวมเป็น 27 คือคู่ A↔Z' },
      data: d, rule: r
    };
  }
  function verifyLetter(q) {
    const d = q.data, rs = C.consistent(d.ex);
    if (rs.length !== 1) return 'กฎที่เข้ากับตัวอย่างไม่ได้มีหนึ่งเดียว (' + rs.length + ')';
    for (const [w, c] of d.ex) if (!q.stem.includes(w) || !q.stem.includes(c)) return 'example text';
    if (C.apply(rs[0], d.qw) !== d.qc) return 'query code';
    const truth = d.decode ? d.qw : d.qc;
    if (d.decode && invert(rs[0], d.qc) !== d.qw) return 'decode';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    return MC.check('one', d.opts.map(t => t === truth ? 'ALL' : 'NONE'), q.answerIndex);
  }

  /* ---------- รหัสตัวเลข: ลำดับตัวอักษร (A=1) ---------- */
  function makeNum() {
    const r = { mir: Math.random() < 0.3, rev: Math.random() < 0.3, k: U.pick([0, 0, 1, 2, 3, -1]) };
    const pool = U.shuffle(W4.slice()), ex = []; let i = 0;
    while (C.nconsistent(ex).length !== 1 && ex.length < 3) { const w = pool[i++]; ex.push([w, C.applyNum(r, w)]); }
    if (C.nconsistent(ex).length !== 1) return null;
    const qw = pool[i++], truth = C.applyNum(r, qw);
    const vars = [[{ ...r, k: r.k - 1 }, 'a0', 'นับ A เป็น 0 แทน 1 หรือนับลำดับขาดไปหนึ่ง'], [{ ...r, k: r.k + 1 }, 'p1', 'นับลำดับเกินไปหนึ่ง'], [{ ...r, rev: !r.rev }, 'rev', r.rev ? 'ลืมกลับลำดับ' : 'กลับลำดับทั้งที่กฎไม่ได้กลับ'], [{ ...r, mir: !r.mir }, 'mir', r.mir ? 'ลืมนับจากท้าย (Z=1)' : 'นับจากท้ายทั้งที่กฎนับจาก A'], [{ ...r, k: 0 }, 'nok', 'ลืมบวกค่าคงที่']];
    const cands = [{ t: truth, ok: true }], seen = new Set([truth]);
    for (const [v, tag, why] of U.shuffle(vars)) { const t = C.applyNum(v, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag, why }); } }
    while (cands.length < 5) { const t = C.applyNum({ ...r, k: r.k + 2 + U.R(4) }, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag: 'g', why: 'ไม่ตรงกับกฎที่หาได้' }); } }
    const top = cands.slice(0, 5), opts = U.shuffle(top.slice());
    const d = { type: 'num', ex, qw, opts: opts.map(c => c.t) };
    const desc = (r.mir ? 'ใช้ลำดับนับจากท้าย (Z=1, Y=2, …)' : 'ใช้ลำดับตัวอักษร (A=1, B=2, …)') + (r.k ? (r.k > 0 ? ` แล้วบวก ${r.k}` : ` แล้วลบ ${-r.k}`) : '') + (r.rev ? ' แล้วกลับลำดับ' : '');
    return {
      stem: '<p>ใช้กฎเดียวกันเปลี่ยนคำเป็นตัวเลข</p><ul class="defs1">' + ex.map(([w, c]) => `<li><b class="code">${w}</b> เขียนเป็น <b class="code">${c}</b></li>`).join('') + `</ul><p class="ask">คำว่า <b class="code">${qw}</b> จะเขียนเป็นอะไร</p>`,
      options: opts.map(c => ({ text: c.t, correct: !!c.ok, why: c.ok ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(top[0]),
      solution: { svg: TF.draw.table(['', ...[...Array(qw.length).keys()].map(i => 'ตัวที่ ' + (i + 1))], [...ex.flatMap(([w, c]) => [[w, ...w], ['ลำดับ A=1', ...[...w].map(ch => A.indexOf(ch) + 1)], ['รหัส', ...c.split('-')]]), [qw, ...qw], ['ลำดับ A=1', ...[...qw].map(ch => A.indexOf(ch) + 1)], ['รหัส', ...truth.split('-')]]), legend: TF.draw.legend.code, steps: ['ลองทุกกฎในตระกูล (นับจาก A หรือจาก Z · บวกค่าคงที่ · กลับลำดับ) เหลือกฎเดียว: ' + desc, `ใช้กับ ${qw} → ${truth}`], shortcut: 'จำตำแหน่งหลัก E=5, J=10, O=15, T=20, Y=25 แล้วนับต่อ จะเร็วกว่านับจาก A ทุกครั้ง' },
      data: d
    };
  }
  function verifyNum(q) {
    const d = q.data, rs = C.nconsistent(d.ex); if (rs.length !== 1) return 'กฎไม่เป็นหนึ่งเดียว';
    for (const [w, c] of d.ex) if (!q.stem.includes(w) || !q.stem.includes(c)) return 'example text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    const truth = C.applyNum(rs[0], d.qw);
    return MC.check('one', d.opts.map(t => t === truth ? 'ALL' : 'NONE'), q.answerIndex);
  }

  /* ---------- รหัสหลักตัวเลข: บวกแบบวน + กลับลำดับ ---------- */
  function makeDigit() {
    const r = { rev: Math.random() < 0.4, d: U.pick([0, 0, 1, -1]), k: 1 + U.R(9) };
    const num = () => { let s; do { s = String(1000 + U.R(9000)); } while (new Set(s).size < 3); return s; };
    const ex = [];
    while (C.dconsistent(ex).length !== 1 && ex.length < 3) { const w = num(); ex.push([w, C.applyDigit(r, w)]); }
    if (C.dconsistent(ex).length !== 1) return null;
    const qw = num(), truth = C.applyDigit(r, qw);
    const vars = [[{ ...r, k: mod(-r.k, 10), d: -r.d }, 'sub', 'บวกกับลบสลับกัน'], [{ ...r, rev: !r.rev }, 'rev', r.rev ? 'ลืมกลับลำดับหลัก' : 'กลับลำดับทั้งที่กฎไม่ได้กลับ'], [{ ...r, k: mod(r.k + 1, 10) }, 'off', 'บวกเกินไปหนึ่ง'], [{ ...r, d: 0 }, 'nod', 'ลืมเพิ่มทีละขั้นตามตำแหน่ง'], [{ ...r, k: mod(r.k - 1, 10) }, 'off2', 'บวกขาดไปหนึ่ง']];
    const cands = [{ t: truth, ok: true }], seen = new Set([truth]);
    const nowrap = (r.rev ? [...qw].reverse() : [...qw]).map((c, i) => String(+c + r.k + (r.rev ? qw.length - 1 - i : i) * r.d)).join('');
    if (nowrap !== truth && /^\d+$/.test(nowrap)) { seen.add(nowrap); cands.push({ t: nowrap, tag: 'wrap', why: 'บวกแล้วไม่วน — เกิน 9 ต้องวนกลับเริ่ม 0 (เก็บแค่หลักหน่วย)' }); }
    for (const [v, tag, why] of U.shuffle(vars)) { const t = C.applyDigit(v, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag, why }); } }
    for (let kk = 0; kk < 10; kk++) for (const rv of [r.rev, !r.rev]) { const t = C.applyDigit({ ...r, k: kk, rev: rv }, qw); if (!seen.has(t)) { seen.add(t); cands.push({ t, tag: 'g', why: 'ไม่ตรงกับกฎที่หาได้' }); } }
    const lo = cands.slice(1).filter(c => +c.t < +truth), hi = cands.slice(1).filter(c => +c.t > +truth);
    const okR = [0, 1, 2, 3, 4].filter(x => lo.length >= x && hi.length >= 4 - x); if (!okR.length) return null;
    const rk = U.pick(okR), pref = (x, y) => (x.tag === 'g') - (y.tag === 'g');      // สุ่มอันดับของคำตอบ แล้วเลือกตัวหลอกจากความผิดพลาดจริงก่อน
    const top = [cands[0], ...lo.sort(pref).slice(0, rk), ...hi.sort(pref).slice(0, 4 - rk)], opts = top.slice().sort((a, b) => +a.t - +b.t);   // ตัวเลือกตัวเลขเรียงน้อยไปมาก
    const d = { type: 'digit', ex, qw, opts: opts.map(c => c.t) };
    const desc = `บวก ${r.k} ทุกหลักแบบวน (9+1 = 0)` + (r.d ? `, หลักถัดไป${r.d > 0 ? 'บวกเพิ่ม' : 'ลดลง'}อีกหลักละ ${Math.abs(r.d)}` : '') + (r.rev ? ' แล้วกลับลำดับหลัก' : '');
    return {
      stem: '<p>ใช้กฎเดียวกันเข้ารหัสตัวเลข</p><ul class="defs1">' + ex.map(([w, c]) => `<li><b class="code">${w}</b> เข้ารหัสได้ <b class="code">${c}</b></li>`).join('') + `</ul><p class="ask"><b class="code">${qw}</b> จะเข้ารหัสได้เท่าใด</p>`,
      options: opts.map(c => ({ text: c.t, correct: !!c.ok, why: c.ok ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(top[0]),
      solution: { svg: TF.draw.table(['', 'หลัก 1', 'หลัก 2', 'หลัก 3', 'หลัก 4'], [...ex.flatMap(([w, c]) => [['เดิม ' + w, ...w], ['รหัส ' + c, ...c]]), ['เดิม ' + qw, ...qw], ['รหัส ' + truth, ...truth]]), legend: 'เทียบหลักต่อหลัก (ถ้ากฎกลับลำดับ ให้เทียบหลักแรกกับหลักสุดท้าย) · ไล่ทุกกฎในตระกูลแล้วเหลือกฎเดียว', steps: ['ลองทุกกฎ (บวกแบบวน k · เพิ่มทีละ d · กลับลำดับ) เหลือกฎเดียว: ' + desc, `ใช้กับ ${qw} → ${truth}`], shortcut: 'ถ้าผลต่างหลักแรกกับหลักแรกไม่คงที่ ลองเทียบหลักแรกกับหลักสุดท้าย (กลับลำดับ) ทันที' },
      data: d
    };
  }
  function verifyDigit(q) {
    const d = q.data, rs = C.dconsistent(d.ex); if (rs.length !== 1) return 'กฎไม่เป็นหนึ่งเดียว';
    for (const [w, c] of d.ex) if (!q.stem.includes(w) || !q.stem.includes(c)) return 'example text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    if (d.opts.some((t, i) => i && +t <= +d.opts[i - 1])) return 'ตัวเลือกตัวเลขต้องเรียงน้อยไปมาก';
    const truth = C.applyDigit(rs[0], d.qw);
    return MC.check('one', d.opts.map(t => t === truth ? 'ALL' : 'NONE'), q.answerIndex);
  }

  /* ---------- รหัสคำ ---------- */
  const VOC = [['แมว', 'กิน', 'ปลา', 'ทอด', 'ชอบ', 'นม', 'สด', 'ดื่ม'], ['ฉัน', 'ไป', 'ตลาด', 'เช้า', 'เย็น', 'นี้', 'วัด', 'เดิน'], ['น้อง', 'เล่น', 'ฟุตบอล', 'กับ', 'พี่', 'เพื่อน', 'ทุก', 'วัน'], ['ครู', 'สอน', 'เลข', 'อังกฤษ', 'ห้อง', 'เรา', 'สนุก', 'มาก']];
  const SYL = ['โป', 'ตะ', 'มิ', 'รู', 'เก', 'ซา', 'ลอ', 'ฟี', 'นู', 'ทะ', 'จิ', 'พอ', 'วู', 'คี'];
  function makeWord(ns) {
    const words = U.shuffle(U.pick(VOC).slice()).slice(0, ns === 3 ? 5 : 6), codes = U.shuffle(SYL.slice()).slice(0, words.length), map = {};
    words.forEach((w, i) => map[w] = codes[i]);
    const sents = [], seenS = new Set();
    for (let t = 0; t < 50 && sents.length < ns; t++) { const s = U.shuffle(words.slice()).slice(0, 3); const k = s.slice().sort().join(); if (!seenS.has(k)) { seenS.add(k); sents.push({ w: s, c: U.shuffle(s.map(x => map[x])) }); } }
    if (sents.length < ns || words.some(w => !sents.some(s => s.w.includes(w)))) return null;
    const ms = C.wordModels(words, codes, sents);
    const byWord = w => [...new Set(ms.map(m => m[w]))];
    const solved = words.filter(w => byWord(w).length === 1);
    if (!solved.length || solved.length === words.length && ns === 4 && Math.random() < 0.5) return null;
    const x = U.pick(solved), ans = map[x], askCode = Math.random() < 0.4;
    const inX = sents.filter(s => s.w.includes(x)), outX = sents.filter(s => !s.w.includes(x));
    let cands;
    if (!askCode) {
      cands = [{ t: ans, ok: true }];
      const co = U.shuffle([...new Set(inX.flatMap(s => s.c))].filter(c => c !== ans));
      for (const c of co) { const owner = words.find(w => map[w] === c); cands.push({ t: c, tag: 'co', why: `รหัสนี้อยู่ประโยคเดียวกับ "${x}" แต่${byWord(owner).length === 1 ? 'เป็นของคำว่า "' + owner + '"' : 'ยังจับคู่กับคำอื่นได้ ไม่ใช่ของ "' + x + '" แน่นอน'}` }); }
      for (const c of U.shuffle(codes.filter(c => !cands.some(o => o.t === c)))) cands.push({ t: c, tag: 'out', why: `รหัสนี้อยู่ในประโยคที่ไม่มีคำว่า "${x}" จึงเป็นของ "${x}" ไม่ได้` });
    } else {
      cands = [{ t: x, ok: true }];
      const co = U.shuffle([...new Set(sents.filter(s => s.c.includes(ans)).flatMap(s => s.w))].filter(w => w !== x));
      for (const w of co) cands.push({ t: w, tag: 'co', why: `คำว่า "${w}" อยู่ประโยคเดียวกับรหัส "${ans}" แต่รหัสของ "${w}" ไม่ใช่ "${ans}"` });
      for (const w of U.shuffle(words.filter(w => !cands.some(o => o.t === w)))) cands.push({ t: w, tag: 'out', why: `คำว่า "${w}" ไม่ได้อยู่ทุกประโยคที่มีรหัส "${ans}"` });
    }
    if (cands.length < 5) return null;
    const top = cands.slice(0, 5), opts = U.shuffle(top.slice());
    const d = { type: 'word', words, codes, sents, x, askCode, opts: opts.map(c => c.t) };
    const inter = inX.reduce((s, z) => s.filter(c => z.c.includes(c)), codes.slice()), left = inter.filter(c => !outX.some(z => z.c.includes(c)));
    const steps = [`"${x}" อยู่ในประโยค ${inX.map(s => sents.indexOf(s) + 1).join(', ')} → รหัสต้องซ้ำกันในประโยคเหล่านั้น: ${inter.join(', ')}`];
    if (outX.length) steps.push(`ตัดรหัสที่อยู่ในประโยคที่ไม่มี "${x}" (ประโยค ${outX.map(s => sents.indexOf(s) + 1).join(', ')}) → เหลือ ${left.join(', ') || '(ต้องไล่ต่อ)'}`);
    if (left.length !== 1) steps.push(`ยังเหลือหลายตัว จึงไล่ทุกการจับคู่ที่ไม่ขัดกับทุกประโยค (${ms.length} แบบ) ได้รหัสของ "${x}" แบบเดียวคือ ${ans}`);
    steps.push(askCode ? `รหัส "${ans}" จึงหมายถึงคำว่า "${x}"` : `รหัสของ "${x}" คือ ${ans}`);
    return {
      stem: '<p>ในภาษารหัสหนึ่ง</p><ul class="defs1">' + sents.map((s, i) => `<li>ประโยค ${i + 1}: "${U.esc(s.w.join(' '))}" เขียนเป็น "${U.esc(s.c.join(' '))}"</li>`).join('') + '</ul><p class="note">ลำดับของรหัสไม่จำเป็นต้องตรงกับลำดับของคำ</p>' + `<p class="ask">${askCode ? `รหัส "${U.esc(ans)}" หมายถึงคำใด` : `คำว่า "${U.esc(x)}" มีรหัสว่าอะไร`}</p>`,
      options: opts.map(c => ({ text: c.t, correct: !!c.ok, why: c.ok ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(top[0]),
      solution: { svg: TF.draw.table(['คำ \\ ประโยค', ...sents.map((_, i) => String(i + 1))], [...words.map(w => [w, ...sents.map(s => s.w.includes(w) ? '✓' : '')]), ['รหัส', ...sents.map(s => s.c.join(' '))]]), legend: TF.draw.legend.cross, steps, shortcut: 'ดูประโยคที่มีคำที่ถาม 2 ประโยค หารหัสที่ซ้ำกัน แล้วตัดรหัสที่ไปโผล่ในประโยคที่ไม่มีคำนั้น' },
      data: d
    };
  }
  function verifyWord(q) {
    const d = q.data;
    for (const s of d.sents) if (!q.stem.includes(U.esc(s.w.join(' '))) || !q.stem.includes(U.esc(s.c.join(' ')))) return 'sentence text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    const ms = C.wordModels(d.words, d.codes, d.sents); if (!ms.length) return 'ขัดกันเอง';
    const labs = d.askCode ? d.opts.map(w => TF.bf.labelOf(ms, m => m[w] === m[d.x])) : d.opts.map(c => TF.bf.labelOf(ms, m => m[d.x] === c));
    if (d.askCode && !q.stem.includes(U.esc(ms[0][d.x]))) return 'asked code';
    return MC.check('one', labs, q.answerIndex);
  }
  function verify(q) {
    const e = MC.basic(q); if (e) return TF.res(e);
    const t = q.data.type;
    return TF.res(t === 'letter' ? verifyLetter(q) : t === 'num' ? verifyNum(q) : t === 'digit' ? verifyDigit(q) : verifyWord(q));
  }
  const reg = (id, name, stars, target, make) => TF.register({ topic: '3.5', id, name, stars, target, make, verify });
  reg('shift', 'เลื่อนตัวอักษรคงที่', 1, 30, () => makeLetter('shift', false));
  reg('num', 'ตัวอักษรเป็นตัวเลข (A=1)', 1, 30, makeNum);
  reg('inc', 'เพิ่มทีละขั้นตามตำแหน่ง', 2, 45, () => makeLetter('inc', Math.random() < 0.3));
  reg('atrev', 'คู่ A↔Z / กลับลำดับ', 2, 45, () => makeLetter('atrev', Math.random() < 0.3));
  reg('digit', 'รหัสหลักตัวเลข (บวกแบบวน)', 2, 45, makeDigit);
  reg('word3', 'รหัสคำ 3 ประโยค', 2, 45, () => makeWord(3));
  reg('combo', 'กฎผสมหลายชั้น', 3, 60, () => makeLetter('combo', Math.random() < 0.4));
  reg('word4', 'รหัสคำ 4 ประโยค', 3, 60, () => makeWord(4));
})(window.TF = window.TF || {});
