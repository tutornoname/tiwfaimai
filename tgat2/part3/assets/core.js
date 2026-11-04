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
