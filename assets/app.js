/* ติวไฟไหม้ · TGAT2 สุ่มทำโจทย์เพิ่ม — หน้าเว็บเดียวใช้ร่วมทั้ง 4 ส่วน
   ลิงก์จาก QR:  ?t=2.3#2.<กุญแจ>  (ชีทแยกส่วน เปิดได้เฉพาะส่วนนั้น)
                 ?t=2.3#A.<กุญแจ>  (เล่มรวม เปิดได้ทั้ง 4 ส่วน)
   ?t=  ว่าง = หน้ารวม · 2 = หน้าส่วนที่ 2 · 2.3 = ฝึกหัวข้อ 2.3 · 2.test = ชุดทดสอบสุ่ม 20 ข้อ
   คลังโจทย์แต่ละส่วนถูกเข้ารหัส (AES-GCM) เปิดได้ด้วยกุญแจจาก QR เท่านั้น */
(function () {
  'use strict';
  const C = window.CATALOG, L = ['ก', 'ข', 'ค', 'ง', 'จ'], PARTS = Object.keys(C.parts);
  const app = document.getElementById('app');
  const $ = (s, r) => (r || app).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const smooth = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tfm.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tfm.' + k, JSON.stringify(v)); } catch (e) { /* โหมดส่วนตัวบางเครื่องเก็บไม่ได้ */ } }
  };
  const route = () => new URLSearchParams(location.search).get('t') || '';
  const href = t => '?t=' + encodeURIComponent(t);
  const topicOf = id => { const p = C.parts[id.split('.')[0]]; return p && p.topics.find(t => t.id === id); };

  /* ---------- กุญแจและการถอดรหัส ---------- */
  const b64d = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  async function aes(keyB64, data) {
    const k = await crypto.subtle.importKey('raw', b64d(keyB64), 'AES-GCM', false, ['decrypt']);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.slice(0, 12) }, k, data.slice(12)));
  }
  let fflateP = null;
  function loadFflate() {
    return fflateP || (fflateP = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'assets/fflate.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  }
  async function gunzip(u) {
    if ('DecompressionStream' in window) {
      try { return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()); } catch (e) { /* ใช้ตัวสำรอง */ }
    }
    await loadFflate(); return window.fflate.gunzipSync(u);
  }
  let keyFile = null;
  async function keysJson() { if (!keyFile) { const r = await fetch('data/keys.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('keys'); keyFile = await r.json(); } return keyFile; }
  const myKeys = () => store.get('keys', {});
  const hasPart = n => !!myKeys()[n];

  async function unlockFromHash() {
    const h = location.hash.slice(1);
    if (!h) return null;
    history.replaceState(null, '', location.pathname + location.search);   // ไม่ทิ้งกุญแจไว้ในแถบที่อยู่
    const m = h.match(/^([A1-9])\.([A-Za-z0-9_-]{16,})$/);
    if (!m) return { bad: true };
    if (!window.crypto || !crypto.subtle) return { bad: true, insecure: true };
    try {
      const K = await keysJson();
      const have = myKeys();
      if (m[1] === 'A') {
        const map = JSON.parse(new TextDecoder().decode(await aes(m[2], b64d(K.all))));
        Object.assign(have, map); store.set('keys', have); store.set('book', 'all');
        return { all: true, fresh: true };
      }
      if (!K.chk[m[1]]) return { bad: true };
      await aes(m[2], b64d(K.chk[m[1]]));          // กุญแจผิด = ถอดรหัสไม่ผ่าน
      const isNew = have[m[1]] !== m[2]; have[m[1]] = m[2]; store.set('keys', have);
      return { part: m[1], fresh: isNew };
    } catch (e) { return { bad: true }; }
  }

  const banks = {};
  async function bank(n) {
    if (banks[n]) return banks[n];
    const key = myKeys()[n];
    if (!key) throw Object.assign(new Error('locked'), { code: 'locked' });
    const r = await fetch('data/p' + n + '.bin');
    if (!r.ok) throw Object.assign(new Error('missing'), { code: 'missing' });
    const raw = await aes(key, new Uint8Array(await r.arrayBuffer()));
    return (banks[n] = JSON.parse(new TextDecoder().decode(await gunzip(raw))));
  }

  /* ---------- ส่วนประกอบหน้า ---------- */
  function header(sub) {
    return `<header class="brand"><a class="brand-name" href="./">ติวไฟไหม้</a><span class="brand-sub">${sub || 'TGAT2 · สุ่มทำโจทย์เพิ่ม'}</span></header>`;
  }
  const footer = () => `<footer>© ติวไฟไหม้ · โจทย์ฝึกเพิ่มเติมสำหรับผู้ที่มีชีท · <a href="./">หน้ารวม</a></footer>`;
  const lineLink = () => `<a href="${C.line}" target="_blank" rel="noopener">LINE ติวไฟไหม้</a>`;

  function lockedBox(n) {
    const p = C.parts[n];
    return `<div class="locked">🔒 <b>ส่วนที่ ${n} ${esc(p.title)}</b><br>ปลดล็อกได้โดยสแกน QR ในชีทส่วนที่ ${n} หรือในเล่มรวม</div>`;
  }
  function errorPage(msg) {
    app.innerHTML = header() + `<main class="wrap"><div class="notice warn">${msg}</div><a class="btn" href="./" style="text-align:center;line-height:52px;text-decoration:none">ไปหน้ารวม</a>${footer()}</main>`;
  }

  /* ---------- หน้ารวม / หน้าส่วน ---------- */
  function partBlock(n) {
    const p = C.parts[n];
    if (!hasPart(n)) return lockedBox(n);
    if (!p.ready) return `<section class="part"><h2>ส่วนที่ ${n} ${esc(p.title)}</h2><div class="locked">กำลังเพิ่มโจทย์ส่วนนี้ เปิดให้ฝึกเร็ว ๆ นี้</div></section>`;
    const total = p.topics.reduce((t, x) => t + x.n, 0);
    const items = p.topics.map(t => {
      const seen = store.get('seen.' + t.id, []).length, st = store.get('st.' + t.id, { n: 0, ok: 0 });
      const pct = Math.min(100, Math.round(seen / t.n * 100));
      return `<li><a href="${href(t.id)}"><span class="tt"><span class="num">${t.id}</span>${esc(t.title)}<span class="bar"><i style="width:${pct}%"></i></span></span><span class="st">${st.n ? `ถูก ${st.ok}/${st.n}` : t.n + ' ข้อ'}</span></a></li>`;
    }).join('');
    return `<section class="part"><h2>ส่วนที่ ${n} ${esc(p.title)}<small>${total} ข้อ</small></h2><ul class="topics">${items}</ul>
      <a class="btn ghost small" href="${href(n + '.test')}" style="display:flex;align-items:center;justify-content:center;text-decoration:none">ชุดทดสอบสุ่ม ส่วนที่ ${n} · 20 ข้อ 15 นาที</a></section>`;
  }
  function hub(only, info) {
    const mine = PARTS.filter(hasPart);
    let h = header(only ? `<a href="./">TGAT2</a> · ส่วนที่ ${only}` : '') + '<main class="wrap">';
    if (info && info.bad) h += `<div class="notice warn">${info.insecure ? 'เบราว์เซอร์นี้เปิดโจทย์ไม่ได้ ลองเปิดด้วย Chrome หรือ Safari รุ่นล่าสุด' : 'QR นี้ใช้เปิดโจทย์ไม่ได้ ลองสแกนใหม่อีกครั้ง'} ถ้ายังไม่ได้ ติดต่อ ${lineLink()}</div>`;
    if (info && info.fresh) h += `<div class="notice">${info.all ? 'ปลดล็อกเล่มรวมแล้ว เข้าได้ทั้ง 4 ส่วน' : 'ปลดล็อกส่วนที่ ' + info.part + ' แล้ว'} · ครั้งต่อไปเปิดหน้านี้ในเครื่องเดิมได้เลย ไม่ต้องสแกนใหม่</div>`;
    if (!mine.length) {
      h += `<h1>สุ่มทำโจทย์เพิ่ม TGAT2</h1><p class="lead">หน้านี้สำหรับผู้ที่มีชีทติวไฟไหม้ สแกน QR "สแกนเพื่อสุ่มทำโจทย์เพิ่ม" ในชีทเพื่อเริ่มฝึก</p>
        <ul class="tips"><li>ชีทแยกส่วน เปิดได้เฉพาะส่วนนั้น</li><li>เล่มรวม เปิดได้ทั้ง 4 ส่วน</li><li>สแกนครั้งเดียว เครื่องจะจำไว้</li></ul>`;
      return (app.innerHTML = h + footer() + '</main>');
    }
    if (only) h += partBlock(only);
    else {
      h += `<h1>สุ่มทำโจทย์เพิ่ม TGAT2</h1><p class="lead">เลือกหัวข้อที่อยากฝึก เว็บจะสุ่มข้อที่ยังไม่เคยทำก่อน และจำผลไว้ในเครื่องนี้</p>`;
      h += mine.map(partBlock).join('');
      const locked = PARTS.filter(n => !hasPart(n));
      if (locked.length) h += '<h2>ส่วนอื่น</h2>' + locked.map(lockedBox).join('');
    }
    app.innerHTML = h + footer() + '</main>';
  }

  /* ---------- แสดงโจทย์และเฉลย ---------- */
  function stemHTML(q) {
    let h = q.q || '';
    if (q.b) h += q.b;
    if (q.f) h += `<div class="fig${/viewBox="0 0 1\d\d /.test(q.f) ? ' sq' : ''}">${q.f}</div>`;
    return h;
  }
  function optsHTML(q, chosen) {
    return q.o.map((o, i) => {
      let cls = 'opt', mk = '';
      if (chosen != null) {
        if (i === q.a) { cls += ' is-right'; mk = '✓'; }
        else if (i === chosen) { cls += ' is-wrong'; mk = '✗'; }
        else cls += ' is-dim';
      }
      return `<button type="button" class="${cls}" data-i="${i}"${chosen != null ? ' disabled' : ''}><span class="ol">${L[i]}.</span><span class="ot">${o}</span><span class="mk" aria-hidden="true">${mk}</span></button>`;
    }).join('');
  }
  function solutionHTML(q, chosen, used) {
    const ok = chosen === q.a;
    let h = '';
    if (used != null) {
      const pace = used <= q.t ? 'ทันเวลาเป้าหมาย' : 'ช้ากว่าเป้าหมาย ' + fmt(used - q.t);
      h += ok ? `<div class="verdict ok">ถูก · ใช้ ${fmt(used)} (เป้า ${fmt(q.t)})<span class="sub">${pace}</span></div>`
        : `<div class="verdict no">${chosen == null ? 'ไม่ได้ตอบ' : 'ยังไม่ถูก'} · คำตอบคือ ${L[q.a]}${q.os ? '' : '. ' + q.o[q.a]}<span class="sub">ใช้ ${fmt(used)} (เป้า ${fmt(q.t)})</span></div>`;
    }
    if (chosen != null && !ok && q.w[chosen]) h += `<div class="why"><b>ตัวเลือก ${L[chosen]} มาจาก:</b> ${q.w[chosen]}</div>`;
    if (q.sf) h += q.sf;
    h += '<h3>วิธีคิดทีละบรรทัด</h3><ol class="steps">' + q.s.map(x => `<li>${x}</li>`).join('') + '</ol>';
    if (q.h) h += `<div class="short"><b>วิธีลัด</b> ${q.h}</div>`;
    const others = q.w.map((w, i) => w && i !== chosen ? `<li><b>${L[i]}</b> ${w}</li>` : '').join('');
    if (others) h += `<details class="others"><summary>ตัวเลือกอื่นผิดเพราะอะไร</summary><ul>${others}</ul></details>`;
    return h;
  }
  function wireOpts(box, fn) { box.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b && !b.disabled) fn(+b.dataset.i); }); }

  /* ---------- ฝึกรายหัวข้อ ---------- */
  async function topic(id) {
    const n = id.split('.')[0], meta = topicOf(id);
    if (!meta) return errorPage('ไม่พบหัวข้อนี้');
    if (!hasPart(n)) { hub(); app.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="notice warn">หัวข้อ ${esc(id)} อยู่ในส่วนที่ ${n} ซึ่งยังไม่ได้ปลดล็อกในเครื่องนี้</div>`); return; }
    let B; try { B = await bank(n); } catch (e) { return errorPage(e.code === 'missing' ? 'กำลังเพิ่มโจทย์ส่วนนี้ เปิดให้ฝึกเร็ว ๆ นี้' : 'โหลดโจทย์ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่ ถ้ายังไม่ได้ ติดต่อ ' + lineLink()); }
    const T = B.topics[id], all = T.qs, byId = Object.fromEntries(all.map(q => [q.i, q]));
    document.title = id + ' ' + T.title + ' · ติวไฟไหม้';
    let mode = store.get('lv.' + id, 'all'), q = null, t0 = 0, tick = null, done = false;
    const ses = { n: 0, ok: 0, time: 0 };
    const firstVisit = !store.get('st.' + id, null);
    app.innerHTML = header(`<a href="${href(n)}">ส่วนที่ ${n}</a> · หัวข้อ ${id}`) + `<main class="wrap">
      <h1>${id} ${esc(T.title)}</h1>
      <p class="lead" id="lead"></p>
      ${T.tips.length ? `<details class="tipbox"${firstVisit ? ' open' : ''}><summary>เคล็ดลับหัวข้อนี้</summary><ul class="tips">${T.tips.map(x => `<li>${x}</li>`).join('')}</ul></details>` : ''}
      <div class="levels" role="group" aria-label="เลือกระดับ">${[['all', 'ทุกระดับ'], ['1', '★'], ['2', '★★'], ['3', '★★★']].map(([v, s]) => `<button type="button" class="lv" data-l="${v}" aria-label="${v === 'all' ? 'ทุกระดับ' : 'ระดับ ' + v + ' ดาว'}">${s}</button>`).join('')}</div>
      <div class="chips"><button type="button" class="chip" id="wrongmode" aria-pressed="false"></button></div>
      <div id="note"></div>
      <section class="card" aria-live="polite">
        <div class="qmeta"><span class="timer" id="timer">0:00</span><span><span class="qtype" id="qtype"></span> <span class="stars" id="stars"></span></span></div>
        <div class="stem" id="stem"></div>
        <div class="opts" id="opts"></div>
      </section>
      <section class="result" id="result" hidden></section>
      <button type="button" class="btn" id="next">ข้อต่อไป</button>
      <p class="stats" id="stats"></p>
      ${footer()}</main>`;
    const wrongs = () => store.get('wr.' + id, []).filter(x => byId[x]);
    function paint() {
      app.querySelectorAll('.lv').forEach(b => b.setAttribute('aria-pressed', String(mode === b.dataset.l)));
      const w = wrongs().length, wb = $('#wrongmode');
      wb.textContent = 'ทบทวนข้อที่เคยผิด (' + w + ')'; wb.setAttribute('aria-pressed', String(mode === 'wrong')); wb.disabled = !w && mode !== 'wrong';
      const seen = store.get('seen.' + id, []).filter(x => byId[x]).length;
      $('#lead').textContent = `คลังโจทย์ ${all.length} ข้อ · ทำไปแล้ว ${seen} ข้อ`;
      const st = store.get('st.' + id, { n: 0, ok: 0, on: 0 });
      $('#stats').innerHTML = ses.n ? `รอบนี้ ${ses.n} ข้อ · ถูก ${ses.ok} · เฉลี่ย ${fmt(ses.time / ses.n)} ต่อข้อ` + (st.n > ses.n ? `<small>สะสมในเครื่องนี้ ${st.n} ข้อ · ถูก ${st.ok} · ทันเวลา ${st.on || 0}</small>` : '') : 'ตอบแล้วจะเห็นสถิติของรอบนี้ที่นี่';
    }
    function setTimer() { const s = (Date.now() - t0) / 1000, el = $('#timer'); el.textContent = fmt(s) + ' / เป้า ' + fmt(q.t); el.classList.toggle('over', s > q.t); }
    function pick() {
      $('#note').innerHTML = '';
      if (mode === 'wrong') {
        const w = wrongs();
        if (!w.length) { mode = 'all'; store.set('lv.' + id, mode); $('#note').innerHTML = '<div class="notice">ไม่มีข้อที่ผิดค้างแล้ว กลับไปสุ่มทุกระดับ</div>'; return pick(); }
        const c = w.filter(x => !q || x !== q.i), from = c.length ? c : w;
        return byId[from[Math.floor(Math.random() * from.length)]];
      }
      const pool = all.filter(x => mode === 'all' || x.l === +mode);
      const seen = new Set(store.get('seen.' + id, []));
      let fresh = pool.filter(x => !seen.has(x.i));
      if (!fresh.length) {
        store.set('seen.' + id, [...seen].filter(x => !pool.some(p => p.i === x)));
        $('#note').innerHTML = `<div class="notice">ทำครบทุกข้อ${mode === 'all' ? 'ในหัวข้อนี้' : 'ระดับนี้'}แล้ว เริ่มสุ่มรอบใหม่</div>`;
        fresh = pool.filter(x => !q || x.i !== q.i);
        if (!fresh.length) fresh = pool;
      }
      return fresh[Math.floor(Math.random() * fresh.length)];
    }
    function next() {
      q = pick(); done = false;
      $('#stars').textContent = stars(q.l); $('#stars').setAttribute('aria-label', 'ระดับ ' + q.l + ' ดาว');
      $('#qtype').textContent = q.ty || '';
      $('#stem').innerHTML = stemHTML(q);
      const ob = $('#opts'); ob.className = 'opts' + (q.os ? ' svgopts' : ''); ob.innerHTML = optsHTML(q, null);
      $('#result').hidden = true; $('#result').innerHTML = '';
      t0 = Date.now(); clearInterval(tick); setTimer(); tick = setInterval(setTimer, 250);
      paint();
    }
    function answer(i) {
      if (done) return; done = true; clearInterval(tick);
      const used = (Date.now() - t0) / 1000, ok = i === q.a;
      const ob = $('#opts'); ob.innerHTML = optsHTML(q, i); ob.classList.add('answered');
      $('#result').innerHTML = solutionHTML(q, i, used); $('#result').hidden = false;
      ses.n++; ses.time += used; if (ok) ses.ok++;
      const st = store.get('st.' + id, { n: 0, ok: 0, on: 0 }); st.n++; if (ok) { st.ok++; if (used <= q.t) st.on = (st.on || 0) + 1; } store.set('st.' + id, st);
      const seen = store.get('seen.' + id, []); if (!seen.includes(q.i)) { seen.push(q.i); store.set('seen.' + id, seen); }
      let w = store.get('wr.' + id, []); w = ok ? w.filter(x => x !== q.i) : (w.includes(q.i) ? w : w.concat(q.i)); store.set('wr.' + id, w);
      paint();
      $('#result').scrollIntoView({ behavior: smooth(), block: 'start' });
    }
    wireOpts($('#opts'), answer);
    $('#next').addEventListener('click', () => { next(); window.scrollTo({ top: 0, behavior: smooth() }); });
    app.querySelectorAll('.lv').forEach(b => b.addEventListener('click', () => { mode = b.dataset.l; store.set('lv.' + id, mode); next(); }));
    $('#wrongmode').addEventListener('click', () => { mode = mode === 'wrong' ? 'all' : 'wrong'; store.set('lv.' + id, mode); next(); });
    next();
  }

  /* ---------- ชุดทดสอบสุ่ม 20 ข้อ 15 นาที ---------- */
  function mockIntro(n, info) {
    const P = C.parts[n];
    if (!P || !hasPart(n)) return hub(null, info);
    const hist = store.get('mock.' + n, []);
    app.innerHTML = header(`<a href="${href(n)}">ส่วนที่ ${n}</a> · ชุดทดสอบสุ่ม`) + `<main class="wrap">
      ${info && info.fresh ? `<div class="notice">${info.all ? 'ปลดล็อกเล่มรวมแล้ว เข้าได้ทั้ง 4 ส่วน' : 'ปลดล็อกส่วนที่ ' + n + ' แล้ว'} · ครั้งต่อไปเปิดในเครื่องเดิมได้เลย</div>` : ''}
      <h1>ชุดทดสอบสุ่ม ส่วนที่ ${n}</h1>
      <p class="lead">${esc(P.title)} · สุ่มใหม่ทุกครั้งจากทุกหัวข้อของส่วนนี้</p>
      <ul class="tips"><li>20 ข้อ เวลา 15 นาที เหมือนชุดทดสอบท้ายส่วนในชีท</li><li>เปลี่ยนคำตอบและย้อนดูข้อก่อนหน้าได้จนกว่าจะกดส่ง</li><li>ส่งแล้วจะเห็นคะแนน ตารางวิเคราะห์จุดอ่อน และเฉลยทุกข้อ</li></ul>
      ${hist.length ? `<p class="lead">ทำไปแล้ว ${hist.length} ครั้ง · ล่าสุด ${hist[hist.length - 1].s}/20 · สูงสุด ${Math.max(...hist.map(h => h.s))}/20</p>` : ''}
      <button type="button" class="btn" id="go">เริ่มจับเวลา</button>
      ${footer()}</main>`;
    $('#go').addEventListener('click', () => mock(n));
  }
  async function mock(n) {
    const P = C.parts[n];
    if (!P) return errorPage('ไม่พบส่วนนี้');
    if (!hasPart(n)) return hub();
    let B; try { B = await bank(n); } catch (e) { return errorPage(e.code === 'missing' ? 'กำลังเพิ่มโจทย์ส่วนนี้ เปิดให้ฝึกเร็ว ๆ นี้' : 'โหลดโจทย์ไม่สำเร็จ ลองใหม่อีกครั้ง'); }
    document.title = 'ชุดทดสอบสุ่ม ส่วนที่ ' + n + ' · ติวไฟไหม้';
    const ids = P.topics.map(t => t.id), N = 20, LIMIT = 15 * 60;
    const per = ids.map((_, i) => Math.floor(N / ids.length) + (i < N % ids.length ? 1 : 0));
    const items = [];
    ids.forEach((tid, k) => {                       // แต่ละหัวข้อ: คละระดับ ง่าย/กลาง/ยาก
      const qs = shuffle(B.topics[tid].qs.slice()), pickd = [];
      for (const lv of shuffle([1, 2, 2, 3])) { if (pickd.length >= per[k]) break; const x = qs.find(q => q.l === lv && !pickd.includes(q)); if (x) pickd.push(x); }
      for (const x of qs) { if (pickd.length >= per[k]) break; if (!pickd.includes(x)) pickd.push(x); }
      pickd.forEach(q => items.push({ q, tid, ch: null }));
    });
    let cur = 0, t0 = Date.now(), tick = null, over = false;
    app.innerHTML = header(`<a href="${href(n)}">ส่วนที่ ${n}</a> · ชุดทดสอบสุ่ม`) + `<main class="wrap">
      <h1>ชุดทดสอบสุ่ม ส่วนที่ ${n}</h1>
      <p class="lead">20 ข้อ · 15 นาที · ทำรวดเดียวโดยไม่หยุดนาฬิกา ข้อใดใช้เวลาเกิน 1 นาทีครึ่งให้เดาแล้วข้ามทันที</p>
      <div class="mock-head"><span id="pos"></span><span class="clock" id="clock">15:00</span></div>
      <div class="grid20" id="grid"></div>
      <section class="card"><div class="qmeta"><span class="qtype" id="qtype"></span><span class="stars" id="stars"></span></div><div class="stem" id="stem"></div><div class="opts" id="opts"></div></section>
      <div class="navrow"><button type="button" class="btn ghost" id="prev">ข้อก่อนหน้า</button><button type="button" class="btn ghost" id="fwd">ข้อถัดไป</button></div>
      <button type="button" class="btn" id="submit">ส่งคำตอบ</button>
      ${footer()}</main>`;
    function draw() {
      const it = items[cur];
      $('#pos').textContent = `ข้อ ${cur + 1} / ${N} · หัวข้อ ${it.tid}`;
      $('#stars').textContent = stars(it.q.l); $('#qtype').textContent = it.q.ty || '';
      $('#stem').innerHTML = stemHTML(it.q);
      const ob = $('#opts'); ob.className = 'opts' + (it.q.os ? ' svgopts' : '');
      ob.innerHTML = it.q.o.map((o, i) => `<button type="button" class="opt${it.ch === i ? ' is-right' : ''}" data-i="${i}" aria-pressed="${it.ch === i}"><span class="ol">${L[i]}.</span><span class="ot">${o}</span><span class="mk">${it.ch === i ? '●' : ''}</span></button>`).join('');
      $('#grid').innerHTML = items.map((x, i) => `<button type="button" data-k="${i}" class="${x.ch != null ? 'done' : ''}${i === cur ? ' cur' : ''}" aria-label="ข้อ ${i + 1}">${i + 1}</button>`).join('');
      $('#prev').disabled = cur === 0; $('#fwd').disabled = cur === N - 1;
    }
    function clock() {
      const left = LIMIT - (Date.now() - t0) / 1000, el = $('#clock');
      el.textContent = fmt(left); el.classList.toggle('low', left < 120);
      if (left <= 0) finish(true);
    }
    function finish(timeout) {
      if (over) return; over = true; clearInterval(tick);
      const used = Math.min(LIMIT, (Date.now() - t0) / 1000), score = items.filter(x => x.ch === x.q.a).length;
      items.forEach(x => {                          // ข้อที่ผิดในชุดทดสอบ → ไปอยู่ในโหมดทบทวนของหัวข้อนั้น
        let w = store.get('wr.' + x.tid, []);
        w = x.ch === x.q.a ? w.filter(i => i !== x.q.i) : (w.includes(x.q.i) ? w : w.concat(x.q.i));
        store.set('wr.' + x.tid, w);
      });
      const hist = store.get('mock.' + n, []); hist.push({ d: Date.now(), s: score, t: Math.round(used) }); store.set('mock.' + n, hist.slice(-20));
      const rows = ids.map(tid => {
        const a = items.filter(x => x.tid === tid), ok = a.filter(x => x.ch === x.q.a).length, wrong = a.length - ok;
        return `<tr><td>${tid} ${esc(topicOf(tid).title)}</td><td class="n">${ok}/${a.length}</td><td class="n">${wrong >= 2 ? `<a class="flag" href="${href(tid)}">ควรทบทวน</a>` : '<span class="okflag">ผ่าน</span>'}</td></tr>`;
      }).join('');
      const rev = items.map((x, i) => {
        const ok = x.ch === x.q.a;
        return `<details class="rev"><summary><span class="${ok ? 'o' : 'x'}">${ok ? '✓' : '✗'}</span> ข้อ ${i + 1} · หัวข้อ ${x.tid} · ${x.ch == null ? 'ไม่ได้ตอบ' : 'ตอบ ' + L[x.ch]}${ok ? '' : ' · เฉลย ' + L[x.q.a]}</summary>
          <div class="stem">${stemHTML(x.q)}</div><div class="opts answered${x.q.os ? ' svgopts' : ''}">${optsHTML(x.q, x.ch == null ? -1 : x.ch)}</div>${solutionHTML(x.q, x.ch, null)}</details>`;
      }).join('');
      const best = Math.max(...hist.map(h => h.s));
      app.innerHTML = header(`<a href="${href(n)}">ส่วนที่ ${n}</a> · ผลชุดทดสอบ`) + `<main class="wrap">
        <h1>ผลชุดทดสอบสุ่ม ส่วนที่ ${n}</h1>
        ${timeout ? '<div class="notice warn">หมดเวลา 15 นาที ระบบส่งคำตอบให้อัตโนมัติ</div>' : ''}
        <p class="score">${score} / ${N}</p>
        <p class="lead">ใช้เวลา ${fmt(used)} · ทำชุดทดสอบส่วนนี้ไปแล้ว ${hist.length} ครั้ง · คะแนนสูงสุด ${best}</p>
        <h2>ตารางวิเคราะห์จุดอ่อน</h2>
        <p class="lead">หัวข้อที่ผิดตั้งแต่ 2 ข้อ ให้กลับไปฝึกหัวข้อนั้น ข้อที่ผิดจะอยู่ในปุ่ม "ทบทวนข้อที่เคยผิด" ของหัวข้อ</p>
        <div class="tscroll"><table class="res"><tr><th>หัวข้อ</th><th>ถูก</th><th></th></tr>${rows}</table></div>
        <h2>เฉลยรายข้อ</h2>${rev}
        <a class="btn" href="${href(n + '.test')}" style="display:flex;align-items:center;justify-content:center;text-decoration:none">สุ่มชุดทดสอบใหม่</a>
        ${footer()}</main>`;
      window.scrollTo(0, 0);
    }
    $('#opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || over) return; const it = items[cur], i = +b.dataset.i; it.ch = it.ch === i ? null : i; draw(); });
    $('#grid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = +b.dataset.k; draw(); } });
    $('#prev').addEventListener('click', () => { if (cur > 0) { cur--; draw(); } });
    $('#fwd').addEventListener('click', () => { if (cur < N - 1) { cur++; draw(); window.scrollTo({ top: 0, behavior: smooth() }); } });
    $('#submit').addEventListener('click', () => {
      const left = items.filter(x => x.ch == null).length;
      if (left && !confirm(`ยังไม่ได้ตอบ ${left} ข้อ ต้องการส่งคำตอบเลยไหม`)) return;
      finish(false);
    });
    draw(); clock(); tick = setInterval(clock, 500);
  }

  /* ---------- เริ่มทำงาน ---------- */
  async function start() {
    const info = await unlockFromHash();
    const t = route();
    if (/^\d$/.test(t) && C.parts[t]) return hub(t, info);
    if (/^\d\.test$/.test(t)) return info && info.bad ? hub(null, info) : mockIntro(t[0], info);
    if (/^\d\.\d+$/.test(t)) {
      if (info && info.bad) return hub(null, info);
      await topic(t);
      if (info && info.fresh) { const m = app.querySelector('main'); m && m.insertAdjacentHTML('afterbegin', `<div class="notice">${info.all ? 'ปลดล็อกเล่มรวมแล้ว เข้าได้ทั้ง 4 ส่วน' : 'ปลดล็อกส่วนที่ ' + info.part + ' แล้ว'} · ครั้งต่อไปเปิดในเครื่องเดิมได้เลย</div>`); }
      return;
    }
    hub(null, info);
  }
  start().catch(() => errorPage('เกิดข้อผิดพลาด ลองโหลดหน้าใหม่'));
})();
