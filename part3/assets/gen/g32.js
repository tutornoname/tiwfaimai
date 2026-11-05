/* ติวไฟไหม้ — 3.2 สรุปความ ทั้งหมด / บางส่วน / ไม่มี
   ตรวจด้วยการไล่ทุกรูปแบบว่าง/ไม่ว่างของช่องเวนน์ 2 รอบ (ยอมให้กลุ่มว่าง / ทุกกลุ่มต้องมีสมาชิก) ต้องได้ผลตรงกัน */
(function (TF) {
  'use strict';
  const V = TF.venn, U = TF.util, MC = TF.mc, L = TF.LETTERS;
  const THEMES = [
    { cl: 'คน', w: ['นักร้อง', 'นักเต้น', 'นักวาด', 'นักบิน', 'หมอฟัน', 'เชฟ', 'นักกีฬา', 'นักเขียน', 'ช่างภาพ', 'ครูสอนว่ายน้ำ'] },
    { cl: 'คัน', w: ['รถสีแดง', 'รถไฟฟ้า', 'รถเช่า', 'รถมือสอง', 'รถสองประตู', 'รถนำเข้า', 'รถหลังคาเปิด'] },
    { cl: 'เล่ม', w: ['หนังสือปกแข็ง', 'หนังสือการ์ตูน', 'หนังสือภาษาจีน', 'หนังสือมือสอง', 'หนังสือหายาก', 'หนังสือขายดี', 'หนังสือภาพ'] },
    { cl: 'ตัว', w: ['เสื้อลายทาง', 'เสื้อแขนยาว', 'เสื้อสีขาว', 'เสื้อมีฮู้ด', 'เสื้อผ้าไหม', 'เสื้อลดราคา', 'เสื้อทีม'] }
  ];
  TF.topicInfo['3.2'] = {
    title: '3.2 สรุปความ ทั้งหมด / บางส่วน / ไม่มี',
    tips: ['"ทุก" = วงซ้อน (ช่องนอกวงในว่าง) · "ไม่มี" = วงแยก (ช่องซ้อนว่าง) · "บาง" = วาง ×',
      'วาดข้อ "ทุก/ไม่มี" ก่อน แล้วค่อยวาง × ถ้า × วางได้หลายช่อง ข้อสรุปที่อาศัย × นั้นไม่แน่',
      'บาง + บาง หรือ ไม่มี + ไม่มี สรุปอะไรไม่ได้ · นิเสธ: ทุก ↔ บาง…ไม่ใช่ · ไม่มี ↔ บาง…เป็น']
  };
  const say = (s, d) => {
    const X = d.names[s.x], Y = d.names[s.y];
    return s.f === 'all' ? `${X}ทุก${d.cl}เป็น${Y}` : s.f === 'none' ? `ไม่มี${X}${d.cl}ใดเป็น${Y}` : s.f === 'some' ? `${X}บาง${d.cl}เป็น${Y}` : `${X}บาง${d.cl}ไม่ใช่${Y}`;
  };
  const skey = s => (s.f === 'none' || s.f === 'some') ? s.f + Math.min(s.x, s.y) + Math.max(s.x, s.y) : s.f + s.x + '>' + s.y;
  const lab = (M, s, k) => { let t = 0; for (const m of M) if (V.holds(m, s, k)) t++; return t === M.length ? 'ALL' : t === 0 ? 'NONE' : 'SOME'; };

  function premises(k) {
    const idx = U.shuffle([...Array(k).keys()]), P = [];
    for (let i = 0; i < k - 1; i++) {
      const r = Math.random(), f = r < 0.4 ? 'all' : r < 0.6 ? 'none' : r < 0.85 ? 'some' : 'not';
      const [a, b] = Math.random() < 0.5 ? [idx[i], idx[i + 1]] : [idx[i + 1], idx[i]];
      P.push({ f, x: a, y: b });
    }
    if (!P.some(p => p.f === 'all' || p.f === 'none')) return null;
    return U.shuffle(P);
  }
  /* คำอธิบายความผิดพลาดที่พบบ่อย */
  function tagOf(c, P, labv, d) {
    const has = (f, x, y) => P.some(p => p.f === f && ((p.x === x && p.y === y) || ((f === 'some' || f === 'none') && p.x === y && p.y === x)));
    const link = (x, z, f) => [...Array(d.k).keys()].some(y => y !== x && y !== z && P.some(p => p.f === f && (p.x === x && p.y === y || p.x === y && p.y === x)) && P.some(p => p.f === f && (p.x === z && p.y === y || p.x === y && p.y === z)));
    const X = d.names[c.x], Y = d.names[c.y];
    if (c.f === 'all' && has('all', c.y, c.x)) return { tag: 'conv', why: `กลับประโยค "ทุก" — โจทย์บอกว่า${Y}ทุก${d.cl}เป็น${X} ไม่ได้แปลว่า${X}ทุก${d.cl}เป็น${Y}` };
    if ((c.f === 'some' || c.f === 'not') && (link(c.x, c.y, 'some') || link(c.x, c.y, 'not'))) return { tag: 'somesome', why: '"บาง" ต่อกับ "บาง" สรุปอะไรไม่ได้ เพราะ × ของสองข้อความอาจอยู่คนละช่อง' };
    if (c.f === 'none' && link(c.x, c.y, 'none')) return { tag: 'nonenone', why: '"ไม่มี" สองครั้งไม่ได้บังคับว่าสองกลุ่มปลายทางแยกกัน' };
    if (c.f === 'not' && (has('some', c.x, c.y) || has('all', c.x, c.y) === false && labv(c.x, c.y, 'some') === 'ALL')) return { tag: 'somenot', why: `"${X}บาง${d.cl}เป็น${Y}" ไม่ได้บอกว่ามี${X}ที่ไม่ใช่${Y}` };
    if (c.f === 'all' && labv(c.x, c.y, 'some') === 'ALL') return { tag: 'someall', why: '"บาง" ไม่ได้แปลว่า "ทุก" — รู้แค่ว่ามีอย่างน้อยหนึ่ง' };
    return { tag: 'gen' + c.f, why: '' };
  }
  function minimalWhy(c, P, d, wantLab) {   // หาข้อความในโจทย์น้อยที่สุดที่ทำให้ได้ผลนี้
    const sets = [];
    for (let i = 0; i < P.length; i++) sets.push([i]);
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) sets.push([i, j]);
    sets.push(P.map((_, i) => i));
    for (const s of sets) { const M = V.models(d.k, s.map(i => P[i]), false); if (M.length && lab(M, c, d.k) === wantLab) return s.map(i => '"' + say(P[i], d) + '"').join(' กับ '); }
    return 'ข้อความทั้งหมด';
  }
  function example(M, c, want, d) {
    let best = null, bc = 99;
    for (const m of M) if (V.holds(m, c, d.k) === want) { const n = m.toString(2).split('1').length - 1; if (n < bc) { bc = n; best = m; } }
    if (best == null) return '';
    const parts = [];
    for (let r = 1; r < (1 << d.k); r++) if (best & (1 << (r - 1))) parts.push('[' + d.names.filter((_, j) => r & (1 << j)).join('+') + ']');
    return parts.join(' , ') + ' (ในวงเล็บคือกลุ่มที่สมาชิกนั้นอยู่ ช่องอื่นว่าง · ทุกกลุ่มมีสมาชิก)';
  }

  function make(k, qtype) {
    const th = U.pick(THEMES), names = U.shuffle(th.w.slice()).slice(0, k);
    const P = premises(k); if (!P) return null;
    const d = { k, names, cl: th.cl, prem: P, qtype };
    const M0 = V.models(k, P, false), M1 = V.models(k, P, true);
    if (!M0.length || !M1.length) return null;
    const pk = new Set(P.map(skey)), cands = [];
    for (let x = 0; x < k; x++) for (let y = 0; y < k; y++) if (x !== y) for (const f of ['all', 'none', 'some', 'not']) {
      const c = { f, x, y }; if (pk.has(skey(c))) continue;
      const l0 = lab(M0, c, k), l1 = lab(M1, c, k);
      if (l0 !== l1) continue;                           // ขึ้นกับว่ากลุ่มว่างได้หรือไม่ → ตัดทิ้ง
      cands.push({ c, key: skey(c), lab: l0 });
    }
    const labv = (x, y, f) => lab(M0, { f, x, y }, k);
    cands.forEach(o => Object.assign(o, qtype === 'def' ? tagOf(o.c, P, labv, d) : { tag: o.c.f + o.lab, why: '' }));
    const B = MC.build(qtype, cands, { minTags: qtype === 'def' ? 3 : 2, mixImp: true }); if (!B) return null;
    const opts = B.opts.map(o => {
      const t = say(o.c, d), correct = o === B.ans;
      let why = o.why, ex = '';
      if (!correct) {
        if (o.lab === 'SOME') { ex = (qtype === 'def' ? 'กรณีที่ข้อนี้ไม่จริง: ' : 'กรณีที่ข้อนี้เป็นจริง: ') + example(M1, o.c, qtype !== 'def', d); why = why || (qtype === 'def' ? 'ข้อนี้ "อาจ" จริง แต่ไม่จริงทุกกรณี' : 'ข้อนี้ยังเป็นไปได้ — โจทย์ไม่ได้ห้ามไว้ อย่าเหมาว่าเป็นไปไม่ได้'); }
        else if (o.lab === 'NONE') why = (why ? why + ' · ' : '') + 'ข้อนี้เป็นไปไม่ได้ เพราะขัดกับ ' + minimalWhy(o.c, P, d, 'NONE');
        else why = 'ข้อนี้จริงเสมอ (สรุปได้จาก ' + minimalWhy(o.c, P, d, 'ALL') + ') — ระวังอ่านคำถามสลับ';
      }
      return { text: t, correct, why, ex, c: o.c };
    });
    const steps = ['วาดเวนน์ตามข้อ "ทุก/ไม่มี" ก่อน แล้ววาง × ของข้อ "บาง" (ดูภาพ)'].concat(opts.map((o, i) => {
      const l = lab(M0, o.c, k);
      const r = l === 'ALL' ? 'สรุปจาก ' + minimalWhy(o.c, P, d, 'ALL') : l === 'NONE' ? 'ขัดกับ ' + minimalWhy(o.c, P, d, 'NONE') : 'มีทั้งกรณีที่จริงและไม่จริง';
      return `${L[i]}. ${o.text} → ${MC.WORD[l]} (${r})${o.correct ? ' ✓' : ''}`;
    }));
    const SH = { def: 'ข้อสรุปที่ถูกต้องต้องจริงทุกภาพที่วาดได้ ถ้าวาดภาพที่ทำให้ข้อนั้นผิดได้แม้หนึ่งภาพ ตัดทิ้ง', imp: 'ข้อที่เป็นไปไม่ได้คือนิเสธของข้อที่สรุปได้แน่นอน: ทุก ↔ บาง…ไม่ใช่ · ไม่มี ↔ บาง…เป็น', pos: 'หาข้อที่ "ไม่ขัด" กับโจทย์ — ตัวหลอกทุกตัวคือข้อที่ตรงข้ามกับสิ่งที่สรุปได้แน่นอน' };
    d.opts = opts.map(o => o.c);
    return {
      stem: '<p>กำหนดให้</p><ol class="concl">' + P.map(p => '<li>' + U.esc(say(p, d)) + '</li>').join('') + '</ol><p class="note">ให้ถือว่าข้อความเป็นจริง แม้ขัดกับความจริง</p><p class="ask">' + MC.ASK[qtype] + '</p>',
      options: opts.map(o => ({ text: o.text, correct: o.correct, why: o.why, ex: o.ex })),
      answerIndex: B.answerIndex,
      solution: { svg: TF.draw.venn(k, names, M0, P), legend: TF.draw.legend.venn, steps, shortcut: SH[qtype] },
      data: d
    };
  }
  function verify(q) {
    const d = q.data, e = MC.basic(q); if (e) return TF.res(e);
    for (const p of d.prem) if (!q.stem.includes(U.esc(say(p, d)))) return TF.res('premise text');
    if (q.options.some((o, i) => o.text !== say(d.opts[i], d))) return TF.res('option text');
    const M0 = V.models(d.k, d.prem, false), M1 = V.models(d.k, d.prem, true);
    if (!M0.length || !M1.length) return TF.res('เงื่อนไขขัดกันเอง');
    const L0 = d.opts.map(c => lab(M0, c, d.k)), L1 = d.opts.map(c => lab(M1, c, d.k));
    if (L0.join() !== L1.join()) return TF.res('ผลสองรอบ (กลุ่มว่างได้/ไม่ได้) ไม่ตรงกัน');
    const pk = new Set(d.prem.map(skey));
    if (new Set(d.opts.map(skey)).size !== 5 || d.opts.some(c => pk.has(skey(c)))) return TF.res('ตัวเลือกซ้ำความหมาย/ซ้ำโจทย์');
    return TF.res(MC.check(d.qtype, L0, q.answerIndex));
  }
  const reg = (id, name, stars, k, qt) => TF.register({ topic: '3.2', id, name, stars, make: () => make(k, qt), verify });
  reg('s3-def', '3 กลุ่ม · สรุปได้แน่นอน', 1, 3, 'def');
  reg('s3-pos', '3 กลุ่ม · อาจเป็นจริง', 1, 3, 'pos');
  reg('s3-imp', '3 กลุ่ม · เป็นไปไม่ได้', 2, 3, 'imp');
  reg('s4-def', '4 กลุ่ม · สรุปได้แน่นอน', 2, 4, 'def');
  reg('s4-pos', '4 กลุ่ม · อาจเป็นจริง', 3, 4, 'pos');
  reg('s4-imp', '4 กลุ่ม · เป็นไปไม่ได้', 3, 4, 'imp');
})(window.TF = window.TF || {});
