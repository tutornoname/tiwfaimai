/* ติวไฟไหม้ — หน้าเว็บ: หน้าหัวข้อ, หน้ารวม + สุ่มรวม 20 ข้อ, โหมด ?selftest=1 */
(function (TF) {
  'use strict';
  const U = TF.util, L = TF.LETTERS, esc = U.esc;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* เบราว์เซอร์ไม่ให้เก็บ ข้ามไป */ } }
  };
  const SELFTEST = /[?&]selftest=1\b/.test(location.search);
  const stars = n => '★'.repeat(n);
  const brand = (sub) => `<header class="brand"><a class="brand-name" href="${sub.home}">ติวไฟไหม้</a><span class="brand-sub">${sub.html}</span></header>`;
  const smooth = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function optsHTML(q, chosen) {
    return q.options.map((o, i) => {
      let cls = 'opt', mk = '';
      if (chosen != null) {
        if (o.correct) { cls += ' is-right'; mk = '✓'; }
        else if (i === chosen) { cls += ' is-wrong'; mk = '✗'; }
        else cls += ' is-dim';
      }
      return `<button type="button" class="${cls}" data-i="${i}"><span class="ol">${L[i]}.</span><span class="ot">${esc(o.text)}</span><span class="mk" aria-hidden="true">${mk}</span></button>`;
    }).join('');
  }
  function solutionHTML(q, chosen, used) {
    const ok = chosen === q.answerIndex, a = q.answerIndex;
    let h = '';
    if (used != null) {
      const diff = Math.round(used - q.target);
      const pace = diff <= 0 ? 'ทันเวลาเป้าหมาย' : 'ช้ากว่าเป้าหมาย ' + U.time(diff);
      h += ok
        ? `<div class="verdict ok">ถูก · ใช้ ${U.time(used)} (เป้า ${U.time(q.target)})<span class="sub">${pace}</span></div>`
        : `<div class="verdict no">${chosen == null ? 'ไม่ได้ตอบ' : 'ยังไม่ถูก'} · คำตอบคือ ${L[a]}. ${esc(q.options[a].text)}<span class="sub">ใช้ ${U.time(used)} (เป้า ${U.time(q.target)})</span></div>`;
    }
    if (chosen != null && !ok) {
      const o = q.options[chosen];
      h += `<div class="why"><b>ตัวเลือก ${L[chosen]} มาจาก:</b> ${esc(o.why)}${o.ex ? `<span class="ex">${esc(o.ex)}</span>` : ''}</div>`;
    }
    const s = q.solution;
    h += `<figure class="dg-wrap">${s.svg}<figcaption>${s.legend}</figcaption></figure>`;
    h += '<h3>วิธีคิดทีละบรรทัด</h3><ol class="steps">' + s.steps.map(x => `<li>${esc(x)}</li>`).join('') + '</ol>';
    h += `<div class="short"><b>วิธีลัด</b> ${esc(s.shortcut)}</div>`;
    return h;
  }

  /* ---------------- โหมด selftest ---------------- */
  function runSelftest(root, list, title) {
    root.innerHTML += `<main class="wrap"><h1>selftest · ${esc(title)}</h1><p class="note">สุ่ม 500 ข้อต่อ generator แล้วให้ตัวตรวจอิสระไล่ทุกกรณีซ้ำ ข้อที่ตัวสร้างส่งออกมาแต่ไม่ผ่าน = "ไม่ผ่าน" ต้องได้ 0</p><div id="st-out">กำลังทดสอบ…</div></main>`;
    const out = root.querySelector('#st-out'), rows = [];
    let i = 0;
    function step() {
      if (i < list.length) { rows.push(TF.selftest([list[i]], 500)[0]); i++; out.textContent = `กำลังทดสอบ ${i}/${list.length}…`; setTimeout(step, 0); return; }
      const fail = rows.reduce((t, r) => t + r.fail + r.giveup, 0), mix = TF.mixCheck(list);
      let h = `<p class="${fail ? 'fail' : 'pass'}">${fail ? 'ไม่ผ่าน ' + fail + ' ข้อ' : 'ผ่านทั้งหมด · ไม่ผ่าน 0 ข้อ'} จาก ${rows.length * 500} ข้อ (${rows.length} generator)</p>`;
      h += '<div class="tscroll"><table class="st"><tr><th>generator</th><th>ระดับ</th><th>ไม่ผ่าน</th><th>สุ่มซ้ำเฉลี่ย</th><th>คำตอบ ก/ข/ค/ง/จ</th></tr>';
      for (const r of rows) h += `<tr><td>${esc(r.name)}<br><small>${esc(r.id)}</small></td><td>${stars(r.stars)}</td><td class="n ${r.fail + r.giveup ? 'fail' : 'pass'}">${r.fail + r.giveup}</td><td class="n">${r.tries.toFixed(1)}</td><td class="n">${r.ans.join('/')}</td></tr>` + (r.msg ? `<tr><td colspan="5"><small>${esc(r.msg)}</small></td></tr>` : '');
      h += '</table></div>';
      h += `<p>สัดส่วนโหมด "ทุกระดับ" (สุ่ม ${mix.n} ครั้ง): ★ ${(mix.pct[1] * 100).toFixed(1)}% · ★★ ${(mix.pct[2] * 100).toFixed(1)}% · ★★★ ${(mix.pct[3] * 100).toFixed(1)}% · รูปแบบซ้ำติดกัน ${mix.repeat} ครั้ง</p>`;
      out.innerHTML = h;
      window.TF_SELFTEST = { rows, mix, fail };
    }
    setTimeout(step, 0);
  }

  /* ---------------- หน้าหัวข้อ ---------------- */
  function topic(id) {
    const t = TF.TOPICS.find(x => x.id === id), info = TF.topicInfo[id] || { title: id + ' ' + t.title, tips: [] };
    const list = TF.patternsOf(id), root = document.getElementById('app');
    document.title = info.title + ' · ติวไฟไหม้';
    root.innerHTML = brand({ home: '../', html: '<a href="../">TGAT2 · ส่วนที่ 3</a>' });
    if (SELFTEST) return runSelftest(root, list, info.title);
    if (!list.length) {
      root.innerHTML += `<main class="wrap"><h1>${esc(info.title)}</h1><div class="card"><p>หัวข้อนี้กำลังจะเปิดให้ฝึก ระหว่างนี้ลองหัวข้ออื่นที่พร้อมแล้วได้</p></div><a class="btn" href="../" style="text-align:center;line-height:52px;text-decoration:none">ไปหน้ารวมส่วนที่ 3</a></main>`;
      return;
    }
    const KEY = 'tiwfaimai.p3.' + id;
    let level = store.get(KEY + '.level', 'all'), last = null, q = null, t0 = 0, tick = null, done = false;
    const ses = { n: 0, ok: 0, time: 0 };
    root.innerHTML += `<main class="wrap">
      <h1>${esc(info.title)}</h1>
      <ul class="tips">${info.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="levels" role="group" aria-label="เลือกระดับ">
        ${[['all', 'ทุกระดับ'], ['1', '★'], ['2', '★★'], ['3', '★★★']].map(([v, s]) => `<button type="button" class="lv" data-l="${v}" aria-pressed="${String(level === v)}" aria-label="${v === 'all' ? 'ทุกระดับ' : 'ระดับ ' + v + ' ดาว'}">${s}</button>`).join('')}
      </div>
      <section class="card" aria-live="polite">
        <div class="qmeta"><span class="timer" id="timer">0:00</span><span class="stars" id="stars"></span></div>
        <div class="stem" id="stem"></div>
        <div class="opts" id="opts"></div>
      </section>
      <section class="result" id="result" hidden></section>
      <button type="button" class="btn" id="next">ข้อต่อไป</button>
      <p class="stats" id="stats"></p>
      <footer>© ติวไฟไหม้ · <a href="../">ทุกหัวข้อในส่วนที่ 3</a></footer>
    </main>`;
    const $ = s => root.querySelector(s);
    function showStats() {
      const all = store.get(KEY + '.all', { n: 0, ok: 0 });
      $('#stats').innerHTML = ses.n
        ? `รอบนี้ทำ ${ses.n} ข้อ · ถูก ${ses.ok} · เฉลี่ย ${U.time(ses.time / ses.n)} ต่อข้อ` + (all.n > ses.n ? `<small>สะสมในเครื่องนี้ ${all.n} ข้อ · ถูก ${all.ok}</small>` : '')
        : 'ตอบแล้วจะเห็นสถิติของรอบนี้ที่นี่';
    }
    function setTimer() {
      const s = (Date.now() - t0) / 1000, el = $('#timer');
      el.textContent = U.time(s) + ' / เป้า ' + U.time(q.target);
      el.classList.toggle('over', s > q.target);
    }
    function next() {
      const p = TF.choose(list, level, last);
      q = TF.generate(p);
      if (!q) { $('#stem').innerHTML = '<p>สุ่มโจทย์ไม่สำเร็จ กด "ข้อต่อไป" อีกครั้ง</p>'; return; }
      last = p.id; done = false;
      $('#stars').textContent = stars(q.stars); $('#stars').setAttribute('aria-label', 'ระดับ ' + q.stars + ' ดาว');
      $('#stem').innerHTML = q.stem;
      $('#opts').innerHTML = optsHTML(q, null);
      $('#opts').classList.remove('answered');
      $('#result').hidden = true; $('#result').innerHTML = '';
      t0 = Date.now(); clearInterval(tick); setTimer(); tick = setInterval(setTimer, 250);
    }
    function answer(i) {
      if (done) return; done = true; clearInterval(tick);
      const used = (Date.now() - t0) / 1000, ok = i === q.answerIndex;
      $('#opts').innerHTML = optsHTML(q, i); $('#opts').classList.add('answered');
      $('#result').innerHTML = solutionHTML(q, i, used); $('#result').hidden = false;
      ses.n++; ses.time += used; if (ok) ses.ok++;
      const all = store.get(KEY + '.all', { n: 0, ok: 0 }); all.n++; if (ok) all.ok++; store.set(KEY + '.all', all);
      showStats();
      $('#result').scrollIntoView({ behavior: smooth(), block: 'start' });
    }
    $('#opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) answer(+b.dataset.i); });
    $('#next').addEventListener('click', () => { next(); window.scrollTo({ top: 0, behavior: smooth() }); });
    root.querySelectorAll('.lv').forEach(b => b.addEventListener('click', () => {
      level = b.dataset.l; store.set(KEY + '.level', level);
      root.querySelectorAll('.lv').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      next();
    }));
    showStats(); next();
  }

  /* ---------------- หน้ารวม part3 + สุ่มรวม ---------------- */
  function hub() {
    const root = document.getElementById('app'), list = TF.patternsOf();
    document.title = 'TGAT2 ส่วนที่ 3 ความสามารถทางเหตุผล · ติวไฟไหม้';
    root.innerHTML = brand({ home: './', html: 'TGAT2 · ส่วนที่ 3' });
    if (SELFTEST) return runSelftest(root, list, 'ทุกหัวข้อที่เปิดแล้ว');
    const ready = new Set(list.map(p => p.topic));
    const main = document.createElement('main'); main.className = 'wrap'; root.appendChild(main);
    function home() {
      main.innerHTML = `<h1>ส่วนที่ 3 ความสามารถทางเหตุผล</h1>
        <p class="tips" style="padding:0">ฝึกทีละหัวข้อ หรือสุ่มรวม 20 ข้อ จับเวลา 15 นาที โจทย์ใหม่ทุกครั้ง</p>
        <div class="card"><h2 style="margin-top:0">สุ่มรวมทุกหัวข้อ</h2>
          <p style="margin:0;color:var(--muted);font-size:15px">20 ข้อ · 15 นาที · ง่าย 30% กลาง 50% ยาก 20% · เฉลยทั้งหมดตอนจบ${ready.size < TF.TOPICS.length ? '<br>ตอนนี้สุ่มจากหัวข้อที่เปิดแล้ว: ' + [...ready].sort().join(', ') : ''}</p>
          <button type="button" class="btn" id="go">เริ่มทำ 20 ข้อ</button></div>
        <h2>เลือกหัวข้อ</h2>
        <ul class="topics">${TF.TOPICS.map(t => ready.has(t.id)
          ? `<li><a href="${t.slug}/"><span>${t.id} ${esc(t.title)}</span><span class="st">พร้อมฝึก</span></a></li>`
          : `<li><a href="${t.slug}/" class="soon-link"><span>${t.id} ${esc(t.title)}</span><span class="st" style="color:var(--muted)">เร็ว ๆ นี้</span></a></li>`).join('')}</ul>
        <footer>© ติวไฟไหม้</footer>`;
      main.querySelector('#go').addEventListener('click', mock);
    }
    function mock() {
      const N = 20, LIMIT = 15 * 60, items = [];
      let last = null, cur = null, tq = 0, tick = null;
      const tStart = Date.now();
      function draw() {
        if (items.length >= N) return finish();
        const p = TF.choose(list, 'all', last); cur = TF.generate(p); if (!cur) return draw();
        last = p.id; tq = Date.now();
        main.innerHTML = `<div class="mock-head"><span>ข้อ ${items.length + 1}/${N}</span><span class="clock" id="clock"></span></div>
          <section class="card"><div class="qmeta"><span>เป้า ${U.time(cur.target)}</span><span class="stars">${stars(cur.stars)}</span></div>
          <div class="stem">${cur.stem}</div><div class="opts" id="opts">${optsHTML(cur, null)}</div></section>
          <button type="button" class="btn ghost" id="skip">ข้ามข้อนี้</button>`;
        main.querySelector('#opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) record(+b.dataset.i); });
        main.querySelector('#skip').addEventListener('click', () => record(null));
        clock(); window.scrollTo({ top: 0 });
      }
      function clock() {
        const left = LIMIT - (Date.now() - tStart) / 1000, el = main.querySelector('#clock');
        if (left <= 0) { if (cur && items.length < N) items.push({ q: cur, chosen: null, used: (Date.now() - tq) / 1000 }); return finish(); }
        if (el) { el.textContent = U.time(left); el.style.color = left < 60 ? 'var(--warn)' : ''; }
      }
      function record(i) { items.push({ q: cur, chosen: i, used: (Date.now() - tq) / 1000 }); draw(); }
      function finish() {
        clearInterval(tick); tick = null;
        const total = Math.min((Date.now() - tStart) / 1000, LIMIT), ok = items.filter(x => x.chosen === x.q.answerIndex).length;
        const by = [1, 2, 3].map(s => { const a = items.filter(x => x.q.stars === s); return `${stars(s)} ${a.filter(x => x.chosen === x.q.answerIndex).length}/${a.length}`; }).join(' · ');
        const best = store.get('tiwfaimai.p3.mock.best', 0); if (ok > best) store.set('tiwfaimai.p3.mock.best', ok);
        main.innerHTML = `<h1>ผลสุ่มรวม</h1><div class="card"><div class="score">${ok}/${N}</div>
          <p style="margin:6px 0 0">ใช้เวลา ${U.time(total)} จาก 15:00 · ${by}${items.length < N ? '<br>หมดเวลาก่อนครบ ' + N + ' ข้อ ข้อที่เหลือนับเป็นไม่ได้ตอบ' : ''}${best ? '<br><small>สถิติดีที่สุดในเครื่องนี้ ' + Math.max(best, ok) + '/' + N + '</small>' : ''}</p></div>
          <h2>เฉลยทีละข้อ</h2>` +
          items.map((x, k) => `<details class="rev"><summary>ข้อ ${k + 1} ${stars(x.q.stars)} · ${x.chosen === x.q.answerIndex ? 'ถูก' : x.chosen == null ? 'ไม่ได้ตอบ' : 'ผิด'} · ${U.time(x.used)}</summary>
            <div class="stem">${x.q.stem}</div><div class="opts answered">${optsHTML(x.q, x.chosen == null ? -1 : x.chosen)}</div>${solutionHTML(x.q, x.chosen, null)}</details>`).join('') +
          `<button type="button" class="btn" id="again">ทำชุดใหม่ 20 ข้อ</button><button type="button" class="btn ghost" id="back">กลับหน้ารวม</button>`;
        main.querySelector('#again').addEventListener('click', mock);
        main.querySelector('#back').addEventListener('click', home);
        window.scrollTo({ top: 0 });
      }
      tick = setInterval(() => { if (tick) clock(); }, 500);
      draw();
    }
    home();
  }
  TF.ui = { topic, hub };
})(window.TF = window.TF || {});
