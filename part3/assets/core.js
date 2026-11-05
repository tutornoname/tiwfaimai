/* ติวไฟไหม้ · TGAT2 ส่วนที่ 3 — แกนกลาง: สุ่ม, ทะเบียน generator, ตรวจก่อนแสดง, selftest */
(function (TF) {
  'use strict';
  const U = TF.util = {
    R: n => Math.floor(Math.random() * n),
    pick: a => a[Math.floor(Math.random() * a.length)],
    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    time(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  };
  TF.LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ'];
  TF.MIX = { 1: 0.3, 2: 0.5, 3: 0.2 };              // ง่าย 30% / กลาง 50% / ยาก 20%
  TF.TARGET = { 1: 30, 2: 45, 3: 60 };              // เวลาเป้าหมาย (วินาที)
  TF.TOPICS = [
    { id: '3.1', slug: '3-1', title: 'เงื่อนไขสัญลักษณ์' },
    { id: '3.2', slug: '3-2', title: 'สรุปความ ทั้งหมด / บางส่วน / ไม่มี' },
    { id: '3.3', slug: '3-3', title: 'จัดตำแหน่ง ลำดับ และที่นั่ง' },
    { id: '3.4', slug: '3-4', title: 'ความสัมพันธ์เครือญาติและทิศทาง' },
    { id: '3.5', slug: '3-5', title: 'รหัสและการเข้ารหัส' },
    { id: '3.6', slug: '3-6', title: 'เงื่อนไขหลายชั้น: ข้อใดสรุปได้แน่นอน' }
  ];
  TF.patterns = [];
  TF.topicInfo = {};
  TF.register = p => { p.target = p.target || TF.TARGET[p.stars]; TF.patterns.push(p); };
  TF.patternsOf = topic => TF.patterns.filter(p => !topic || p.topic === topic);

  function pickStars(list) {
    const have = [1, 2, 3].filter(s => list.some(p => p.stars === s));
    const tot = have.reduce((t, s) => t + TF.MIX[s], 0);
    let r = Math.random() * tot;
    for (const s of have) { r -= TF.MIX[s]; if (r < 0) return s; }
    return have[have.length - 1];
  }
  /* เลือกรูปแบบถัดไป: ตามระดับ และไม่ซ้ำรูปแบบเดิมติดกัน */
  TF.choose = function (list, level, lastId) {
    const stars = level === 'all' ? pickStars(list) : +level;
    let pool = list.filter(p => p.stars === stars && p.id !== lastId);
    if (!pool.length) pool = list.filter(p => p.stars === stars);
    if (!pool.length) pool = list.filter(p => p.id !== lastId);
    return U.pick(pool.length ? pool : list);
  };
  /* สร้างโจทย์ 1 ข้อ: ต้องผ่านตัวตรวจ brute force ก่อนเสมอ ไม่ผ่าน = สุ่มใหม่ */
  TF.generate = function (p) {
    for (let t = 0; t < 1000; t++) {
      let q = null;
      try { q = p.make(); } catch (e) { q = null; }
      if (!q) continue;
      q.pattern = p.id; q.stars = p.stars; q.target = p.target; q.topic = p.topic;
      let v; try { v = p.verify(q); } catch (e) { v = { ok: false, msg: String(e) }; }
      if (v.ok) return q;
    }
    return null;
  };
  /* ?selftest=1 : สุ่ม N ข้อต่อ generator แล้วนับข้อที่ตัวสร้างส่งออกมาแต่ไม่ผ่านตัวตรวจ */
  TF.selftest = function (list, N) {
    N = N || 500;
    return list.map(p => {
      const r = { id: p.id, name: p.name, stars: p.stars, n: N, fail: 0, giveup: 0, tries: 0, ans: [0, 0, 0, 0, 0], msg: '' };
      for (let i = 0; i < N; i++) {
        let q = null, t = 0;
        while (!q && t < 1000) { t++; try { q = p.make(); } catch (e) { q = null; r.msg = r.msg || String(e); } }
        r.tries += t;
        if (!q) { r.giveup++; continue; }
        q.pattern = p.id; q.stars = p.stars; q.target = p.target; q.topic = p.topic;
        let v; try { v = p.verify(q); } catch (e) { v = { ok: false, msg: String(e) }; }
        if (!v.ok) { r.fail++; r.msg = r.msg || v.msg; }
        r.ans[q.answerIndex]++;
      }
      r.tries = r.tries / N;
      return r;
    });
  };
  TF.mixCheck = function (list, N) {
    N = N || 10000; const c = { 1: 0, 2: 0, 3: 0 }; let last = null, repeat = 0;
    for (let i = 0; i < N; i++) { const p = TF.choose(list, 'all', last); c[p.stars]++; if (p.id === last) repeat++; last = p.id; }
    return { n: N, pct: { 1: c[1] / N, 2: c[2] / N, 3: c[3] / N }, repeat };
  };
})(window.TF = window.TF || {});

/* ===== ตัวช่วยสร้างตัวเลือกจากข้อความที่ติดป้าย ALL / NONE / SOME (ใช้ร่วมหลายหัวข้อ) ===== */
(function (TF) {
  'use strict';
  const U = TF.util;
  const WANT = { def: l => l === 'ALL', imp: l => l === 'NONE', pos: l => l !== 'NONE' };
  /* cands: [{key, text, lab, tag, ...}] · คืน 5 ตัวเลือก (ถูก 1) โดยให้ตัวหลอกมาจากความผิดพลาดหลายแบบที่สุด */
  function build(qtype, cands, opt) {
    opt = opt || {};
    const ok = WANT[qtype], seen = new Set(), uniq = [];
    for (const c of U.shuffle(cands.slice())) if (!seen.has(c.key)) { seen.add(c.key); uniq.push(c); }
    const good = uniq.filter(c => ok(c.lab) && (!opt.goodIf || opt.goodIf(c)));
    if (!good.length) return null;
    const ans = opt.pickGood ? opt.pickGood(good) : U.pick(good);
    let bad = uniq.filter(c => !ok(c.lab) && c.key !== ans.key && (!opt.badIf || opt.badIf(c, ans)));
    if (qtype === 'imp' && opt.mixImp !== false) {         // เป็นไปไม่ได้: ตัวหลอกต้องมีทั้งข้อที่ "จริงแน่" และ "ไม่แน่"
      const s = bad.filter(c => c.lab === 'SOME'), a = bad.filter(c => c.lab === 'ALL');
      if (s.length < 1 || a.length < 1) return null;
    }
    const groups = {}; for (const c of bad) (groups[c.tag || 'x'] = groups[c.tag || 'x'] || []).push(c);
    const keys = U.shuffle(Object.keys(groups)), out = [];
    while (out.length < 4 && keys.some(k => groups[k].length)) for (const k of keys) { if (out.length >= 4) break; if (groups[k].length) out.push(groups[k].shift()); }
    if (out.length < 4) return null;
    if (new Set(out.map(c => c.tag || 'x')).size < (opt.minTags || 2)) return null;
    if (qtype === 'imp' && opt.mixImp !== false && !(out.some(c => c.lab === 'SOME') && out.some(c => c.lab === 'ALL'))) return null;
    const opts = [ans, ...out];
    if (opt.sortNum) opts.sort((x, y) => x.num - y.num); else U.shuffle(opts);
    return { opts, answerIndex: opts.indexOf(ans), ans };
  }
  /* ตัวตรวจ: เงื่อนไขของคำตอบที่ถูกตามรูปแบบคำถาม */
  function check(qtype, labs, ai) {
    if (labs.length !== 5) return 'ต้องมี 5 ตัวเลือก';
    if (qtype === 'def') return labs.filter(l => l === 'ALL').length === 1 && labs[ai] === 'ALL' ? '' : 'def: ' + labs.join();
    if (qtype === 'imp') return labs.filter(l => l === 'NONE').length === 1 && labs[ai] === 'NONE' ? '' : 'imp: ' + labs.join();
    if (qtype === 'pos') return labs[ai] !== 'NONE' && labs.every((l, i) => i === ai || l === 'NONE') ? '' : 'pos: ' + labs.join();
    if (qtype === 'one') return labs.filter(l => l === 'ALL').length === 1 && labs[ai] === 'ALL' && labs.every((l, i) => i === ai || l === 'NONE') ? '' : 'one: ' + labs.join();
    return 'unknown qtype';
  }
  const ASK = { def: 'ข้อใดสรุปได้<u>แน่นอน</u>', imp: 'ข้อใด<u>เป็นไปไม่ได้</u>', pos: 'ข้อใด<u>อาจเป็นจริง</u>' };
  const WORD = { ALL: 'จริงแน่นอน', NONE: 'เป็นไปไม่ได้', SOME: 'ไม่แน่' };
  /* ตรวจทั่วไป: ข้อความตัวเลือกต้องตรงกับข้อมูลโครงสร้าง, 5 ตัวเลือกไม่ซ้ำ, ธงคำตอบตรงกัน */
  function basic(q) {
    if (!q || q.options.length !== 5) return 'ต้องมี 5 ตัวเลือก';
    if (new Set(q.options.map(o => o.text)).size !== 5) return 'ตัวเลือกซ้ำ';
    if (q.options.filter(o => o.correct).length !== 1 || !q.options[q.answerIndex] || !q.options[q.answerIndex].correct) return 'ธงคำตอบไม่ตรง';
    return '';
  }
  TF.mc = { build, check, ASK, WORD, basic };
  TF.res = msg => msg ? { ok: false, msg } : { ok: true };
})(window.TF = window.TF || {});
