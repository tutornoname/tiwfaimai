/* ติวไฟไหม้ — 3.4 ความสัมพันธ์เครือญาติและทิศทาง
   เครือญาติ: ไล่ทุกค่าที่โจทย์ไม่ได้บอก (เพศ · ใครเกิดก่อน) ทุกกรณีที่ไม่ขัดต้องได้คำตอบเดียวกัน
   ทิศเดิน: คำนวณเส้นทางใหม่ทั้งหมด · ทิศสัมพัทธ์: แยกแกน ออก-ตก / เหนือ-ใต้ แล้วไล่ทุกลำดับของแต่ละแกน */
(function (TF) {
  'use strict';
  const K = TF.kin, DR = TF.dir, O = TF.order, U = TF.util, MC = TF.mc, L = TF.LETTERS;
  const NAMES = ['ก้อง', 'ดาว', 'เอิร์ธ', 'ใบเตย', 'ปั้น', 'มุก', 'โอ๊ต', 'แก้ม', 'ต่อ', 'ขวัญ', 'เพชร', 'ส้ม', 'เบนซ์', 'ปิ่น', 'ตูน', 'หยก'];
  TF.topicInfo['3.4'] = {
    title: '3.4 ความสัมพันธ์เครือญาติและทิศทาง',
    tips: ['ญาติ: วาดผังจากคนที่ถูกถาม ไล่ทีละเส้น · ลุง/ป้า = พี่ของพ่อแม่ · อา = น้องพ่อ · น้า = น้องแม่ · ปู่ย่าฝั่งพ่อ ตายายฝั่งแม่',
      'เดินเลี้ยว: ขวา/ซ้ายเทียบกับทิศที่หันอยู่ตอนนั้น ไม่ใช่ทิศของกระดาษ · ระยะตรงใช้สามเหลี่ยมมุมฉาก 3-4-5, 5-12-13',
      'ทิศสัมพัทธ์: แยกคิดทีละแกน (ออก-ตก กับ เหนือ-ใต้) แล้วค่อยรวมเป็นทิศเดียว']
  };

  /* ===================== เครือญาติ ===================== */
  const MEANING = {
    'พ่อ': 'พ่อ', 'แม่': 'แม่', 'ปู่': 'พ่อของพ่อ', 'ย่า': 'แม่ของพ่อ', 'ตา': 'พ่อของแม่', 'ยาย': 'แม่ของแม่',
    'ลุง': 'พี่ชายของพ่อหรือแม่ (รวมถึงสามีของป้า)', 'ป้า': 'พี่สาวของพ่อหรือแม่ (รวมถึงภรรยาของลุง)', 'อา': 'น้องของพ่อ (รวมถึงคู่สมรสของอา)', 'น้า': 'น้องของแม่ (รวมถึงคู่สมรสของน้า)',
    'ลูกพี่ลูกน้อง': 'ลูกของลุง ป้า น้า หรืออา', 'พี่ชาย': 'พี่ผู้ชาย', 'พี่สาว': 'พี่ผู้หญิง', 'น้องชาย': 'น้องผู้ชาย', 'น้องสาว': 'น้องผู้หญิง',
    'พี่เขย': 'สามีของพี่สาว', 'พี่สะใภ้': 'ภรรยาของพี่ชาย', 'น้องเขย': 'สามีของน้องสาว', 'น้องสะใภ้': 'ภรรยาของน้องชาย',
    'หลานชาย': 'ลูกชายของลูก หรือของพี่น้อง', 'หลานสาว': 'ลูกสาวของลูก หรือของพี่น้อง', 'ลูกชาย': 'ลูกผู้ชาย', 'ลูกสาว': 'ลูกผู้หญิง',
    'ลูกเขย': 'สามีของลูกสาว', 'ลูกสะใภ้': 'ภรรยาของลูกชาย', 'สามี': 'สามี', 'ภรรยา': 'ภรรยา',
    'พ่อตา': 'พ่อของภรรยา', 'แม่ยาย': 'แม่ของภรรยา', 'พ่อสามี': 'พ่อของสามี', 'แม่สามี': 'แม่ของสามี'
  };
  const POOL = ['ปู่', 'ย่า', 'ตา', 'ยาย', 'ลุง', 'ป้า', 'อา', 'น้า', 'พี่ชาย', 'พี่สาว', 'น้องชาย', 'น้องสาว', 'หลานชาย', 'หลานสาว', 'ลูกพี่ลูกน้อง', 'พี่เขย', 'น้องเขย', 'พี่สะใภ้', 'น้องสะใภ้', 'ลูกเขย', 'ลูกสะใภ้', 'พ่อตา', 'แม่ยาย', 'พ่อสามี', 'แม่สามี'];
  /* ข้อความหนึ่งข้อต่อหนึ่งเส้น: สุ่มทิศการพูด และสุ่มว่าจะบอกเพศ/ใครเกิดก่อนหรือไม่ */
  function hopStmt(h, i, g, old) {
    const a = i, b = i + 1, gw = (x, m, f, n) => x === null ? n : x === 'M' ? m : f;
    const r = Math.random(), hide = Math.random() < 0.45;
    if (h === 'up') return r < 0.5 ? { i, kind: 'b2a', who: b, gen: g[b], w: g[b] === 'M' ? 'พ่อ' : 'แม่' }
      : { i, kind: 'a2b', who: a, gen: hide ? null : g[a], w: gw(hide ? null : g[a], 'ลูกชาย', 'ลูกสาว', 'ลูก') };
    if (h === 'down') return r < 0.5 ? { i, kind: 'b2a', who: b, gen: hide ? null : g[b], w: gw(hide ? null : g[b], 'ลูกชาย', 'ลูกสาว', 'ลูก') }
      : { i, kind: 'a2b', who: a, gen: g[a], w: g[a] === 'M' ? 'พ่อ' : 'แม่' };
    if (h === 'side') {
      if (Math.random() < 0.2) return { i, kind: 'pair', w: 'พี่น้องกัน', old: null };
      const fw = r < 0.5, who = fw ? b : a, older = fw ? old[i] : !old[i], base = older ? 'พี่' : 'น้อง', gg = hide ? null : g[who];
      return { i, kind: fw ? 'b2a' : 'a2b', who, gen: gg, old: old[i], w: base + (gg === null ? '' : gg === 'M' ? 'ชาย' : 'สาว') };
    }
    if (Math.random() < 0.3) return { i, kind: 'pair', w: 'สามีภรรยากัน' };
    const fw = r < 0.5, who = fw ? b : a;
    return { i, kind: fw ? 'b2a' : 'a2b', who, gen: g[who], w: g[who] === 'M' ? 'สามี' : 'ภรรยา' };
  }
  const sayHop = (s, N) => s.kind === 'pair' ? `${N[s.i]} กับ ${N[s.i + 1]} เป็น${s.w}` : s.kind === 'b2a' ? `${N[s.i + 1]} เป็น${s.w}ของ ${N[s.i]}` : `${N[s.i]} เป็น${s.w}ของ ${N[s.i + 1]}`;
  const toModelStmts = S => S.map(s => ({ who: s.who, gen: s.gen || null, hop: s.i, old: s.old == null ? null : s.old }));
  function kinAnswers(d) { const ms = K.models(d.hops, toModelStmts(d.st)); return { ms, terms: [...new Set(ms.map(m => K.term(d.hops, m.g, m.old)))] }; }

  function makeKin(paths) {
    const hops = U.pick(paths).split(','), n = hops.length + 1, N = U.shuffle(NAMES.slice()).slice(0, n);
    const g = [...Array(n)].map(() => Math.random() < 0.5 ? 'M' : 'F'), old = hops.map(h => h === 'side' ? Math.random() < 0.5 : null);
    if (hops.some((h, i) => h === 'marry' && g[i] === g[i + 1])) return null;
    const st = hops.map((h, i) => hopStmt(h, i, g, old));
    if (hops.includes('marry') && hops[0] === 'marry' && !st.some(s => s.who === 0 && s.gen) && Math.random() < 0.5) return null;
    const d = { hops, names: N, st: U.shuffle(st.slice()) };
    const { ms, terms } = kinAnswers(d);
    if (terms.length !== 1 || !terms[0]) return null;
    const ans = terms[0], m0 = ms[0], tagged = {};
    const put = (t, tag, why) => { if (t && t !== ans && !tagged[t]) tagged[t] = { tag, why }; };
    put(K.reverse(hops, m0.g, m0.old), 'rev', `ตอบกลับทิศ — นี่คือสิ่งที่ ${N[0]} เป็นของ ${N[n - 1]} แต่คำถามถามว่า ${N[n - 1]} เป็นอะไรของ ${N[0]}`);
    if (n > 2) { const g2 = m0.g.slice(); g2[1] = g2[1] === 'M' ? 'F' : 'M'; put(K.term(hops, g2, m0.old), 'side', `สลับฝั่ง — ${N[1]} เป็น${m0.g[1] === 'M' ? 'ฝั่งพ่อ' : 'ฝั่งแม่'} (ปู่ย่า/อา = ฝั่งพ่อ · ตายาย/น้า = ฝั่งแม่)`); }
    { const o2 = m0.old.map(o => o == null ? o : !o); put(K.term(hops, m0.g, o2), 'old', 'สลับพี่-น้อง — ลุง/ป้า/พี่เขย/พี่สะใภ้ ใช้กับฝั่งที่เกิดก่อน · อา/น้า/น้องเขย/น้องสะใภ้ ใช้กับฝั่งที่เกิดทีหลัง'); }
    { const g2 = m0.g.slice(); g2[n - 1] = g2[n - 1] === 'M' ? 'F' : 'M'; put(K.term(hops, g2, m0.old), 'gen', `เพศผิด — ${N[n - 1]} เป็น${m0.g[n - 1] === 'M' ? 'ผู้ชาย' : 'ผู้หญิง'}`); }
    { const g2 = m0.g.slice(); g2[0] = g2[0] === 'M' ? 'F' : 'M'; if (hops[0] === 'marry') put(K.term(hops, g2, m0.old), 'inlaw', 'พ่อตา/แม่ยาย = พ่อแม่ของภรรยา · พ่อสามี/แม่สามี = พ่อแม่ของสามี'); }
    for (const t of U.shuffle(POOL.slice())) put(t, 'gen2', '');
    const dis = Object.keys(tagged).sort((x, y) => (tagged[x].tag === 'gen2') - (tagged[y].tag === 'gen2')).slice(0, 4);
    if (new Set(dis.map(t => tagged[t].tag)).size < 2) return null;
    const opts = U.shuffle([ans, ...dis]);
    d.opts = opts;
    const gsym = N.map((_, i) => { const s = new Set(ms.map(m => m.g[i])); return s.size > 1 ? '?' : (m0.g[i] === 'M' ? '♂' : '♀'); });
    const unknown = gsym.map((s, i) => s === '?' ? N[i] : null).filter(Boolean);
    const unOld = d.st.some(s => s.kind === 'pair' && s.w === 'พี่น้องกัน');
    const steps = ['ไล่จาก ' + N[0] + ' ทีละเส้น: ' + hops.map((h, i) => `${N[i + 1]} เป็น${{ up: 'พ่อหรือแม่', down: 'ลูก', side: 'พี่น้อง', marry: 'คู่สมรส' }[h]}ของ ${N[i]}`).join(' → ')];
    if (unknown.length || unOld) steps.push('โจทย์ไม่ได้บอก' + (unknown.length ? 'เพศของ ' + unknown.join(', ') : '') + (unOld ? (unknown.length ? ' และ' : '') + 'ใครเกิดก่อนในคู่พี่น้อง' : '') + ` → ไล่ทุกกรณีที่ไม่ขัดกับโจทย์ (${ms.length} กรณี) ได้คำตอบเดียวกัน`);
    steps.push(`${ans} = ${MEANING[ans]} → ${N[n - 1]} เป็น${ans}ของ ${N[0]}`);
    return {
      stem: '<ol class="concl">' + d.st.map(s => '<li>' + U.esc(sayHop(s, N)) + '</li>').join('') + `</ol><p class="ask">${U.esc(N[n - 1])} เป็นอะไรกับ ${U.esc(N[0])} (${U.esc(N[n - 1])} เป็น ___ ของ ${U.esc(N[0])})</p>`,
      options: opts.map(t => ({ text: t, correct: t === ans, why: t === ans ? '' : (tagged[t].why || `${t} = ${MEANING[t]} ซึ่งไม่ตรงกับผัง`), ex: '' })),
      answerIndex: opts.indexOf(ans),
      solution: { svg: TF.draw.family(hops, N, gsym, [0, n - 1]), legend: TF.draw.legend.family, steps, shortcut: 'ถามว่า "ก เป็นอะไรของ ข" ให้ยืนที่ ข แล้วมองไปหา ก เสมอ — ระวังตอบกลับทิศ (ลุง ↔ หลาน)' },
      data: { type: 'kin', d }
    };
  }
  function verifyKin(q) {
    const d = q.data.d;
    for (const s of d.st) if (!q.stem.includes(U.esc(sayHop(s, d.names)))) return 'statement text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    const { ms, terms } = kinAnswers(d);
    if (!ms.length) return 'ขัดกันเอง';
    const labs = d.opts.map(t => TF.bf.labelOf(ms, m => K.term(d.hops, m.g, m.old) === t));
    return terms.length === 1 ? MC.check('one', labs, q.answerIndex) : 'คำตอบไม่เป็นหนึ่งเดียว';
  }

  /* ===================== ทิศ: เดินและเลี้ยว ===================== */
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 6, 10], [4, 3, 5], [12, 5, 13], [12, 9, 15]];
  const TURNW = { R: 'เลี้ยวขวา', L: 'เลี้ยวซ้าย', B: 'กลับหลังหัน' };
  function walkGen(needTriple) {
    for (let t = 0; t < 400; t++) {
      const legs = 3 + U.R(2), moves = [];
      for (let i = 0; i < legs; i++) moves.push({ turn: i === 0 ? null : (Math.random() < 0.12 ? 'B' : U.pick(['L', 'R'])), d: 1 + U.R(9) });
      if (moves.filter(m => m.turn === 'B').length > 1) continue;
      const face = U.R(4), w = DR.walk(face, moves);
      if (!w.x || !w.y) { if (needTriple) continue; if (!w.x && !w.y) continue; }
      if (needTriple) { const h = Math.hypot(w.x, w.y); if (!TRIPLES.some(tr => tr[2] === h && Math.abs(w.x) !== Math.abs(w.y))) continue; }
      return { face, moves, w };
    }
    return null;
  }
  const UNIT = ['เมตร', 'กิโลเมตร'];
  function walkText(d) {
    const u = UNIT[d.u], parts = d.moves.map((m, i) => (i === 0 ? '' : TURNW[m.turn] + ' แล้ว') + `เดินตรงไป ${m.d * d.s} ${u}`);
    return `${d.who} ยืนหันหน้าไปทางทิศ${DR.DIRS4[d.face]} ${parts.join(' จากนั้น')}`;
  }
  const mirrorMoves = mv => mv.map(m => ({ ...m, turn: m.turn === 'L' ? 'R' : m.turn === 'R' ? 'L' : m.turn }));
  const opp8 = s => DR.DIRS8[(DR.DIRS8.indexOf(s) + 4) % 8];
  function makeWalk(qt) {
    const W = walkGen(qt === 'dist'); if (!W) return null;
    const d = { type: 'walk', qt, who: U.pick(NAMES), face: W.face, moves: W.moves, u: U.R(2), s: 1 };
    if (d.u === 0) d.s = U.pick([10, 100]);
    const w = W.w, pos = DR.dir8(w.x, w.y), face = DR.DIRS4[w.f], mw = DR.walk(d.face, mirrorMoves(d.moves)), mpos = DR.dir8(mw.x, mw.y), mface = DR.DIRS4[mw.f];
    const sum = d.moves.reduce((s, m) => s + m.d, 0), hyp = Math.hypot(w.x, w.y);
    let cands = [];
    if (qt === 'pos') {
      const add = (t, tag, why) => { if (t && !cands.some(c => c.t === t)) cands.push({ t, tag, why }); };
      add(pos, 'ok', '');
      add(mpos, 'mirror', 'สลับขวา-ซ้าย — การเลี้ยวต้องเทียบกับทิศที่หันอยู่ตอนนั้น');
      add(opp8(pos), 'opp', 'ตอบกลับด้าน — นี่คือทิศของจุดเริ่มต้นเมื่อมองจากตำแหน่งสุดท้าย');
      add(DR.dir8(w.x, 0) || DR.dir8(0, w.y), 'part', 'ดูแค่แกนเดียว — ตำแหน่งสุดท้ายเยื้องทั้งสองแกน จึงต้องเป็นทิศเฉียง');
      add(DR.dir8(0, w.y) || DR.dir8(w.x, 0), 'part2', 'ดูแค่แกนเดียว — ต้องรวมทั้งแกนออก-ตก และเหนือ-ใต้');
      add(face, 'face', 'สับสนระหว่าง "ทิศที่หันหน้า" กับ "ทิศของตำแหน่งเทียบจุดเริ่ม"');
      for (const x of U.shuffle(DR.DIRS8.slice())) add(x, 'g', 'ไม่ตรงกับตำแหน่งที่คำนวณได้');
      cands = [cands[0], ...cands.slice(1, 5)];
      if (cands[0].t !== pos || new Set(cands.map(c => c.t)).size !== 5) return null;
    } else if (qt === 'both') {
      const add = (p, f, tag, why) => { const t = `อยู่ทางทิศ${p}ของจุดเริ่มต้น และหันหน้าไปทางทิศ${f}`; if (p && f && !cands.some(c => c.t === t)) cands.push({ t, tag, why, p, f }); };
      add(pos, face, 'ok', '');
      add(mpos, mface, 'mirror', 'สลับขวา-ซ้ายทุกครั้งที่เลี้ยว');
      add(pos, mface, 'mface', 'ตำแหน่งถูก แต่ทิศที่หันหน้าผิด — เลี้ยวขวาจากทิศเหนือคือหันไปทางตะวันออก');
      add(opp8(pos), face, 'opp', 'ตำแหน่งกลับด้าน — นี่คือทิศของจุดเริ่มเมื่อมองจากตำแหน่งสุดท้าย');
      add(pos, DR.DIRS4[d.face], 'start', 'ใช้ทิศที่หันตอนเริ่ม ลืมนับการเลี้ยว');
      add(pos, DR.DIRS4[(w.f + 2) % 4], 'back', 'ทิศที่หันหน้ากลับด้าน');
      for (const p of U.shuffle(DR.DIRS8.slice())) add(p, U.pick(DR.DIRS4), 'g', 'ไม่ตรงกับเส้นทางที่คำนวณได้');
      cands = [cands[0], ...cands.slice(1, 5)];
      if (new Set(cands.map(c => c.t)).size !== 5) return null;
    } else {
      const add = (v, tag, why) => { if (v > 0 && Number.isInteger(v) && !cands.some(c => c.v === v)) cands.push({ v, tag, why }); };
      add(hyp, 'ok', '');
      add(sum, 'sum', 'บวกระยะทุกช่วงที่เดิน — นั่นคือระยะทางที่เดินจริง ไม่ใช่ระยะตรง');
      add(Math.abs(w.x) + Math.abs(w.y), 'manh', 'บวกระยะสองแกนตรง ๆ — ระยะตรงต้องใช้ทฤษฎีบทพีทาโกรัส');
      add(Math.hypot(mw.x, mw.y), 'mirror', 'สลับขวา-ซ้ายตอนเลี้ยว ทำให้ได้ตำแหน่งสุดท้ายผิด');
      add(Math.abs(Math.abs(w.x) - Math.abs(w.y)), 'diff', 'ลบระยะสองแกน — ระยะตรงคือด้านตรงข้ามมุมฉาก');
      add(Math.max(Math.abs(w.x), Math.abs(w.y)), 'max', 'ดูเฉพาะแกนที่ไกลกว่า');
      for (const v of [hyp - 1, hyp - 2, hyp + 1, hyp + 2, hyp - 3, hyp + 3, hyp + 4, hyp - 4]) add(v, 'near', 'คำนวณระยะตรงคลาดเคลื่อน');
      const lo = cands.slice(1).filter(c => c.v < hyp), hi = cands.slice(1).filter(c => c.v > hyp);
      const ok = [0, 1, 2, 3, 4].filter(r => lo.length >= r && hi.length >= 4 - r); if (!ok.length) return null;
      const r = U.pick(ok), pref = (x, y) => (x.tag === 'near') - (y.tag === 'near');   // ให้ตัวหลอกจากความผิดพลาดจริงมาก่อน
      cands = [cands[0], ...lo.sort(pref).slice(0, r), ...hi.sort(pref).slice(0, 4 - r)];
      cands.forEach(c => c.t = `${c.v * d.s} ${UNIT[d.u]}`);
    }
    const ans = cands[0], opts = qt === 'dist' ? cands.slice().sort((a, b) => a.v - b.v) : U.shuffle(cands.slice());
    if (qt !== 'dist' && new Set(opts.slice(1).map(c => c.tag)).size < 2 && false) return null;
    d.opts = opts.map(c => c.t); d.ansText = ans.t;
    const ask = qt === 'pos' ? `ตอนนี้ ${d.who} อยู่ทางทิศใดของจุดเริ่มต้น` : qt === 'both' ? `ตอนนี้ ${d.who} อยู่ทางทิศใดของจุดเริ่มต้น และหันหน้าไปทางทิศใด` : `ตอนนี้ ${d.who} อยู่ห่างจากจุดเริ่มต้นเป็นระยะตรงเท่าใด`;
    let f = d.face; const steps = d.moves.map((m, i) => { if (m.turn === 'R') f = (f + 1) % 4; else if (m.turn === 'L') f = (f + 3) % 4; else if (m.turn === 'B') f = (f + 2) % 4; return `${i === 0 ? 'เริ่ม' : TURNW[m.turn]} → หันไปทางทิศ${DR.DIRS4[f]} เดิน ${m.d * d.s} ${UNIT[d.u]}`; });
    steps.push(`รวมแกน: ${w.x ? (w.x > 0 ? 'ตะวันออก' : 'ตะวันตก') + ' ' + Math.abs(w.x) * d.s : 'ไม่เยื้องออก-ตก'} · ${w.y ? (w.y > 0 ? 'เหนือ' : 'ใต้') + ' ' + Math.abs(w.y) * d.s : 'ไม่เยื้องเหนือ-ใต้'} ${UNIT[d.u]}`);
    if (qt === 'dist') steps.push(`ระยะตรง = √(${Math.abs(w.x) * d.s}² + ${Math.abs(w.y) * d.s}²) = ${hyp * d.s} ${UNIT[d.u]}`);
    else steps.push(`อยู่ทางทิศ${pos}ของจุดเริ่มต้น${qt === 'both' ? ' และหันหน้าไปทางทิศ' + face : ''}`);
    const SH = { pos: 'ไม่ต้องวาดทั้งเส้น: รวมระยะแกนออก-ตก กับเหนือ-ใต้แยกกัน แล้วดูเครื่องหมายสองแกน', both: 'จดทิศที่หันหลังเลี้ยวทุกครั้ง (น. → ขวา = อ. → ขวา = ต.) แล้วค่อยรวมระยะสองแกน', dist: 'รวมระยะสองแกนก่อน แล้วจับคู่กับสามเหลี่ยมเลขลงตัว 3-4-5 · 6-8-10 · 5-12-13 · 9-12-15 ได้คำตอบทันที' };
    return {
      stem: `<p>${U.esc(walkText(d))}</p><p class="ask">${U.esc(ask)}</p>`,
      options: opts.map(c => ({ text: c.t, correct: c === ans, why: c === ans ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(ans),
      solution: { svg: TF.draw.grid(W.w.pts, W.w.pts.map((_, i) => i === 0 ? 'เริ่ม' : i === W.w.pts.length - 1 ? 'จบ' : null), W.w.pts), legend: TF.draw.legend.walk, steps, shortcut: SH[qt] },
      data: { type: 'walk', d }
    };
  }
  function verifyWalk(q) {
    const d = q.data.d;
    if (!q.stem.includes(U.esc(walkText(d)))) return 'walk text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    const w = DR.walk(d.face, d.moves), u = UNIT[d.u];
    const truth = d.qt === 'pos' ? DR.dir8(w.x, w.y) : d.qt === 'both' ? `อยู่ทางทิศ${DR.dir8(w.x, w.y)}ของจุดเริ่มต้น และหันหน้าไปทางทิศ${DR.DIRS4[w.f]}` : `${Math.hypot(w.x, w.y) * d.s} ${u}`;
    if (!truth || (d.qt === 'dist' && !Number.isInteger(Math.hypot(w.x, w.y)))) return 'ไม่มีคำตอบที่ลงตัว';
    const labs = d.opts.map(t => t === truth ? 'ALL' : 'NONE');
    if (d.qt === 'dist') { const v = d.opts.map(t => parseFloat(t)); if (v.some((x, i) => i && x <= v[i - 1])) return 'ตัวเลือกตัวเลขต้องเรียงน้อยไปมาก'; }
    return MC.check('one', labs, q.answerIndex);
  }

  /* ===================== ทิศสัมพัทธ์ ===================== */
  const PLACES = ['บ้าน', 'โรงเรียน', 'ตลาด', 'วัด', 'สวนสาธารณะ', 'ร้านกาแฟ', 'ห้องสมุด', 'สถานีรถไฟ', 'โรงพยาบาล', 'ไปรษณีย์', 'สนามกีฬา', 'ร้านหนังสือ'];
  const AX = { 'เหนือ': [0, 1], 'ตะวันออกเฉียงเหนือ': [1, 1], 'ตะวันออก': [1, 0], 'ตะวันออกเฉียงใต้': [1, -1], 'ใต้': [0, -1], 'ตะวันตกเฉียงใต้': [-1, -1], 'ตะวันตก': [-1, 0], 'ตะวันตกเฉียงเหนือ': [-1, 1] };
  const opSign = s => s > 0 ? '>' : s < 0 ? '<' : '=';
  function axisPrem(st, ax) { return st.map(s => [s.a, opSign(AX[s.dir][ax]), s.b]); }
  function relSolve(d) {
    const Mx = O.models(d.vars, axisPrem(d.st, 0)), My = O.models(d.vars, axisPrem(d.st, 1));
    return { Mx, My };
  }
  function relDir(Mx, My, a, b) {                    // ทิศของ a เทียบ b ถ้าแน่นอน
    const comp = M => ['>', '<', '='].find(op => O.label(M, [a, op, b]) === 'ALL');
    const cx = comp(Mx), cy = comp(My); if (!cx || !cy || (cx === '=' && cy === '=')) return null;
    const v = { '>': 1, '<': -1, '=': 0 };
    return DR.dir8(v[cx], v[cy]);
  }
  const sayRel = s => `${s.a}อยู่ทางทิศ${s.dir}ของ${s.b}`;
  function makeRel() {
    const n = 5, P = U.shuffle(PLACES.slice()).slice(0, n), co = {};
    const used = new Set();
    for (const p of P) { let c; do { c = [U.R(4), U.R(4)]; } while (used.has(c + '')); used.add(c + ''); co[p] = c; }
    const order = U.shuffle(P.slice()), st = [];
    for (let i = 1; i < n; i++) { const a = order[i], b = order[U.R(i)], dir = DR.dir8(co[a][0] - co[b][0], co[a][1] - co[b][1]); st.push(Math.random() < 0.5 ? { a, b, dir } : { a: b, b: a, dir: opp8(dir) }); }
    const d = { type: 'rel', vars: P, st: U.shuffle(st) };
    const { Mx, My } = relSolve(d); if (!Mx.length || !My.length) return null;
    const pairs = []; for (const a of P) for (const b of P) if (a !== b && !st.some(s => (s.a === a && s.b === b) || (s.a === b && s.b === a))) pairs.push([a, b]);
    const ok = U.shuffle(pairs).find(([a, b]) => relDir(Mx, My, a, b) && relDir(Mx, My, a, b).includes('เฉียง') === (Math.random() < 0.7));
    const pr = ok || U.shuffle(pairs).find(([a, b]) => relDir(Mx, My, a, b)); if (!pr) return null;
    const [a, b] = pr, ans = relDir(Mx, My, a, b), v = AX[ans], cands = [{ t: ans, tag: 'ok' }];
    const add = (t, tag, why) => { if (t && !cands.some(c => c.t === t)) cands.push({ t, tag, why }); };
    add(opp8(ans), 'opp', `ตอบกลับด้าน — นี่คือทิศของ${b}เมื่อมองจาก${a}`);
    add(DR.dir8(-v[0], v[1]), 'mirror', 'สลับตะวันออกกับตะวันตก');
    add(DR.dir8(v[0], -v[1]), 'mirror2', 'สลับเหนือกับใต้');
    if (v[0] && v[1]) { add(DR.dir8(v[0], 0), 'part', 'ดูแค่แกนออก-ตก — อีกแกนก็เยื้องด้วย จึงเป็นทิศเฉียง'); add(DR.dir8(0, v[1]), 'part', 'ดูแค่แกนเหนือ-ใต้ — อีกแกนก็เยื้องด้วย จึงเป็นทิศเฉียง'); }
    else { add(DR.dir8(v[0] || 1, v[1] || 1), 'diag', 'เดาว่าเฉียง ทั้งที่อีกแกนตรงกันพอดี'); add(DR.dir8(v[0] || -1, v[1] || -1), 'diag', 'เดาว่าเฉียง ทั้งที่อีกแกนตรงกันพอดี'); }
    for (const x of U.shuffle(DR.DIRS8.slice())) add(x, 'g', 'ไม่ตรงกับผัง');
    const top = [cands[0], ...cands.slice(1, 5)], opts = U.shuffle(top.slice());
    d.q = [a, b]; d.opts = opts.map(c => c.t);
    const mx = Mx.reduce((best, m) => new Set(Object.values(m)).size > new Set(Object.values(best)).size ? m : best, Mx[0]);
    const my = My.reduce((best, m) => new Set(Object.values(m)).size > new Set(Object.values(best)).size ? m : best, My[0]);
    const Sx = O.structure(P, Mx), Sy = O.structure(P, My);
    const steps = [
      'แยกแกนออก-ตก (มากกว่า = อยู่ทางตะวันออกกว่า): ' + (Sx.isChain ? Sx.chainText : Sx.relate(a, b).text),
      'แยกแกนเหนือ-ใต้ (มากกว่า = อยู่ทางเหนือกว่า): ' + (Sy.isChain ? Sy.chainText : Sy.relate(a, b).text),
      `${a} เทียบ ${b}: แกนออก-ตก ${{ 1: 'อยู่ทางตะวันออก', '-1': 'อยู่ทางตะวันตก', 0: 'ตรงกัน' }[v[0]]} · แกนเหนือ-ใต้ ${{ 1: 'อยู่ทางเหนือ', '-1': 'อยู่ทางใต้', 0: 'ตรงกัน' }[v[1]]} → ทิศ${ans}`
    ];
    return {
      stem: '<p class="note">ทิศหลัก (เหนือ ใต้ ตะวันออก ตะวันตก) หมายถึงตรงทิศพอดี ทิศเฉียงหมายถึงเยื้องทั้งสองแกน</p><ol class="concl">' + d.st.map(s => '<li>' + U.esc(sayRel(s)) + '</li>').join('') + `</ol><p class="ask">${U.esc(a)}อยู่ทางทิศใดของ${U.esc(b)}</p>`,
      options: opts.map(c => ({ text: c.t, correct: c === top[0], why: c === top[0] ? '' : c.why, ex: '' })),
      answerIndex: opts.indexOf(top[0]),
      solution: { svg: TF.draw.grid(P.map(p => [mx[p], my[p]]), P, null), legend: TF.draw.legend.rel, steps, shortcut: 'ทิศสัมพัทธ์ = สองโจทย์ลำดับ 3.1 ซ้อนกัน: แกนออก-ตก กับแกนเหนือ-ใต้ ถ้าแกนไหนสรุปไม่ได้ ข้อนั้นตอบไม่ได้' },
      data: { type: 'rel', d }
    };
  }
  function verifyRel(q) {
    const d = q.data.d;
    for (const s of d.st) if (!q.stem.includes(U.esc(sayRel(s)))) return 'statement text';
    if (q.options.some((o, i) => o.text !== d.opts[i])) return 'option text';
    const { Mx, My } = relSolve(d); if (!Mx.length || !My.length) return 'ขัดกันเอง';
    const t = relDir(Mx, My, d.q[0], d.q[1]); if (!t) return 'ทิศไม่แน่นอน';
    return MC.check('one', d.opts.map(x => x === t ? 'ALL' : 'NONE'), q.answerIndex);
  }
  function verify(q) {
    const e = MC.basic(q); if (e) return TF.res(e);
    return TF.res(q.data.type === 'kin' ? verifyKin(q) : q.data.type === 'walk' ? verifyWalk(q) : verifyRel(q));
  }
  const reg = (id, name, stars, target, make) => TF.register({ topic: '3.4', id, name, stars, target, make, verify });
  reg('kin2', 'เครือญาติ 2 ชั้น', 1, 30, () => makeKin(['up,up', 'up,side', 'side,down', 'down,down']));
  reg('walk-pos', 'เดินเลี้ยว · ทิศเทียบจุดเริ่ม', 1, 30, () => makeWalk('pos'));
  reg('kin-hidden', 'เครือญาติ · ไล่ค่าที่โจทย์ไม่บอก', 2, 45, () => makeKin(['up,side,down', 'up,side', 'up,up', 'side,down']));
  reg('walk-dist', 'เดินเลี้ยว · ระยะตรง', 2, 45, () => makeWalk('dist'));
  reg('walk-both', 'เดินเลี้ยว · ตำแหน่งและทิศที่หัน', 2, 45, () => makeWalk('both'));
  reg('kin-inlaw', 'เครือญาติ · ญาติทางการแต่งงาน', 3, 60, () => makeKin(['marry,up', 'down,marry', 'side,marry', 'up,side,marry']));
  reg('rel-grid', 'ทิศสัมพัทธ์ · หลายจุด', 3, 60, makeRel);
})(window.TF = window.TF || {});
