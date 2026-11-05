/* ติวไฟไหม้ — ตัววาด SVG กลาง (ใช้ร่วมทุกหัวข้อ) */
(function (TF) {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tw = s => [...s].reduce((w, ch) => w + (ch === ' ' ? 5 : /[=≥>]/.test(ch) ? 11 : 11), 0);
  /* เส้นลำดับแนวตั้ง: ตัวมากอยู่บน กล่องเดียวกัน = เท่ากัน กำกับ > / ≥ ข้างเส้น
     S = TF.order.structure(...), hi = ตัวแปรที่ต้องเน้น */
  function order(S, hi) {
    hi = new Set(hi || []);
    const k = S.cls.length, layer = new Array(k).fill(0);
    for (let pass = 0; pass < k; pass++) for (const [i, j] of S.edges) layer[j] = Math.max(layer[j], layer[i] + 1);
    const L = Math.max(...layer) + 1, W = 300, GAP = 64, H = L * GAP + 6;
    const rows = [...Array(L)].map(() => []);
    layer.forEach((l, i) => rows[l].push(i));
    const x = new Array(k), y = new Array(k);
    rows.forEach((r, l) => {
      if (l > 0) {
        const bc = i => { const ps = S.edges.filter(e => e[1] === i).map(e => x[e[0]]); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : W / 2; };
        r.sort((a, b) => bc(a) - bc(b));
      }
      r.forEach((i, n) => { x[i] = W * (n + 1) / (r.length + 1); y[i] = 6 + l * GAP; });
    });
    const bw = i => Math.max(40, tw(S.name(i)) + 22);
    let s = `<svg class="dg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="ผังลำดับ ${esc(S.chainText || '')}">`;
    for (const [i, j, op] of S.edges) {
      const x1 = x[i], y1 = y[i] + 32, x2 = x[j], y2 = y[j];
      s += `<line class="dg-e${op === '≥' ? ' dg-ge' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      s += `<text class="dg-op" x="${mx + (x2 > x1 ? 12 : x2 < x1 ? -12 : 10)}" y="${my + 5}" text-anchor="${x2 >= x1 ? 'start' : 'end'}">${esc(op)}</text>`;
    }
    for (let i = 0; i < k; i++) {
      const w = bw(i), on = S.cls[i].some(v => hi.has(v));
      s += `<g><rect class="dg-n${on ? ' dg-hi' : ''}" x="${x[i] - w / 2}" y="${y[i]}" width="${w}" height="32" rx="8"/>`;
      s += `<text class="dg-t${on ? ' dg-hit' : ''}" x="${x[i]}" y="${y[i] + 21}" text-anchor="middle">${esc(S.name(i))}</text></g>`;
    }
    return s + '</svg>';
  }
  const legend = { order: 'บนมากกว่าล่าง · กล่องเดียวกัน = เท่ากัน · เส้นทึบ = มากกว่า (&gt;) · เส้นประ = มากกว่าหรือเท่ากับ (≥) · กล่องสีคือตัวที่ตัวเลือกถามถึง' };
  TF.draw = { order, legend };
})(window.TF = window.TF || {});

/* ===== ตัววาดของหัวข้อ 3.2–3.6 ===== */
(function (TF) {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const D = TF.draw;

  /* ---------- 3.2 เวนน์ (3 วงกลม หรือ 4 วงรี) ---------- */
  const SHAPES = {
    3: { W: 330, H: 280, E: [{ cx: 133, cy: 112, rx: 66, ry: 66, a: 0 }, { cx: 197, cy: 112, rx: 66, ry: 66, a: 0 }, { cx: 165, cy: 168, rx: 66, ry: 66, a: 0 }] },
    4: { W: 380, H: 300, E: [{ cx: 165, cy: 155, rx: 120, ry: 60, a: Math.PI / 4 }, { cx: 215, cy: 155, rx: 120, ry: 60, a: -Math.PI / 4 }, { cx: 195, cy: 125, rx: 120, ry: 60, a: Math.PI / 4 }, { cx: 185, cy: 125, rx: 120, ry: 60, a: -Math.PI / 4 }] }
  };
  function q(e, x, y) { const c = Math.cos(e.a), s = Math.sin(e.a), dx = x - e.cx, dy = y - e.cy, u = (dx * c + dy * s) / e.rx, v = (-dx * s + dy * c) / e.ry; return u * u + v * v; }
  const spots = {};
  function regionSpots(k) {            // จุดกลางของแต่ละช่อง: จุดที่อยู่ห่างเส้นขอบมากที่สุด
    if (spots[k]) return spots[k];
    const S = SHAPES[k], best = {};
    for (let x = 4; x < S.W; x += 3) for (let y = 4; y < S.H; y += 3) {
      let m = 0, clear = Infinity;
      S.E.forEach((e, j) => { const v = q(e, x, y); if (v <= 1) m |= 1 << j; clear = Math.min(clear, Math.abs(Math.sqrt(v) - 1) * e.ry); });
      if (m && (!best[m] || clear > best[m].c)) best[m] = { x, y, c: clear };
    }
    return (spots[k] = best);
  }
  function venn(k, names, models, prem) {
    const S = SHAPES[k], sp = regionSpots(k), R = (1 << k) - 1;
    const allEmpty = r => models.every(m => !(m & (1 << (r - 1))));
    const allFull = r => models.every(m => m & (1 << (r - 1)));
    const mark = {};
    for (let r = 1; r <= R; r++) mark[r] = allEmpty(r) ? 'shade' : allFull(r) ? 'x' : '';
    let qn = 0;
    prem.forEach(s => {
      if (s.f !== 'some' && s.f !== 'not') return;
      const cand = []; for (let r = 1; r <= R; r++) if ((r & (1 << s.x)) && (s.f === 'some' ? r & (1 << s.y) : !(r & (1 << s.y))) && mark[r] !== 'shade') cand.push(r);
      if (cand.some(r => mark[r] === 'x')) return;
      qn++; cand.forEach(r => { if (!mark[r]) mark[r] = 'q' + qn; else if (mark[r][0] === 'q') mark[r] += ',' + qn; });
    });
    let s = `<svg class="dg" viewBox="0 0 ${S.W} ${S.H}" width="100%" style="max-width:${S.W}px" role="img" aria-label="แผนภาพเวนน์">`;
    const clipId = 'v' + Math.random().toString(36).slice(2, 7);
    // ระบายช่องที่ว่างแน่นอน: ตัดด้วยวงที่อยู่ (clip) และเจาะวงที่ไม่อยู่ (mask)
    const ell = (e, cls) => `<ellipse${cls ? ' ' + cls : ''} cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${e.a * 180 / Math.PI} ${e.cx} ${e.cy})"/>`;
    let defs = S.E.map((e, j) => `<clipPath id="${clipId}c${j}">${ell(e)}</clipPath>`).join(''), body = '';
    for (let r = 1; r <= R; r++) if (mark[r] === 'shade') {
      defs += `<mask id="${clipId}m${r}"><rect width="${S.W}" height="${S.H}" fill="#fff"/>${S.E.map((e, j) => r & (1 << j) ? '' : ell(e, 'fill="#000"')).join('')}</mask>`;
      let g = `<rect class="dg-shade" width="${S.W}" height="${S.H}" mask="url(#${clipId}m${r})"/>`;
      S.E.forEach((e, j) => { if (r & (1 << j)) g = `<g clip-path="url(#${clipId}c${j})">${g}</g>`; });
      body += g;
    }
    s += `<defs>${defs}</defs>${body}`;
    S.E.forEach(e => { s += `<ellipse class="dg-ring" cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${e.a * 180 / Math.PI} ${e.cx} ${e.cy})"/>`; });
    for (let r = 1; r <= R; r++) {
      const p = sp[r]; if (!p) continue;
      if (mark[r] === 'x') s += `<text class="dg-x" x="${p.x}" y="${p.y + 7}" text-anchor="middle">×</text>`;
      else if (mark[r] && mark[r][0] === 'q') s += `<text class="dg-q" x="${p.x}" y="${p.y + 5}" text-anchor="middle">×?${qn > 1 ? mark[r].slice(1) : ''}</text>`;
    }
    // ชื่อกลุ่ม
    const cx = S.W / 2, cy = S.H / 2;
    S.E.forEach((e, j) => {               // วางชื่อกลุ่มนอกวง ตามทิศจากกลางภาพไปยังช่องที่เป็นของกลุ่มนั้นกลุ่มเดียว
      if (k === 3) { const P3 = [[S.E[0].cx - 30, 30, 'middle'], [S.E[1].cx + 30, 30, 'middle'], [S.E[2].cx, S.H - 6, 'middle']][j]; s += `<text class="dg-lab" x="${P3[0]}" y="${P3[1]}" text-anchor="middle">${esc(names[j])}</text>`; return; }
      const p = sp[1 << j]; let dx = p.x - cx, dy = p.y - cy; const L0 = Math.hypot(dx, dy) || 1; dx /= L0; dy /= L0;
      let x = p.x, y = p.y; for (let t = 0; t < 300 && S.E.some(f => q(f, x, y) <= 1); t++) { x += dx * 2; y += dy * 2; }
      x += dx * 6; y += dy * 6 + (dy > 0.3 ? 12 : dy < -0.3 ? -2 : 5);
      const anchor = dx > 0.35 ? 'start' : dx < -0.35 ? 'end' : 'middle';
      x = Math.max(anchor === 'end' ? 70 : 4, Math.min(S.W - (anchor === 'start' ? 70 : 4), x)); y = Math.max(14, Math.min(S.H - 4, y));
      s += `<text class="dg-lab" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}">${esc(names[j])}</text>`;
    });
    return s + '</svg>';
  }
  D.venn = venn;
  D.legend.venn = 'สีทึบ = ช่องที่ไม่มีสมาชิกแน่นอน · × = มีสมาชิกแน่นอน · ×? = ข้อความ "บาง…" บังคับว่าอย่างน้อยหนึ่งช่องที่มีเครื่องหมายเลขเดียวกันต้องมีสมาชิก แต่ไม่รู้ว่าช่องไหน (ส่วนที่ไม่แน่) · ช่องว่าง = ไม่รู้';

  /* ---------- 3.3 ผังที่นั่ง / ลำดับ (ทุกแบบที่เป็นไปได้) ---------- */
  function seats(kind, arrs, hi, theme) {
    hi = new Set(hi || []);
    const box = (x, y, name, w) => `<g><rect class="dg-n${hi.has(name) ? ' dg-hi' : ''}" x="${x - w / 2}" y="${y - 15}" width="${w}" height="30" rx="8"/><text class="dg-t${hi.has(name) ? ' dg-hit' : ''}" x="${x}" y="${y + 6}" text-anchor="middle">${esc(name)}</text></g>`;
    let s = '';
    arrs.forEach((a, k) => {
      const n = a.length, tag = arrs.length > 1 ? `<text class="dg-cap" x="6" y="14">แบบที่ ${k + 1}</text>` : '';
      if (kind === 'row') {
        const W = 340, H = 64, w = Math.min(54, (W - 12) / n - 4);
        s += `<svg class="dg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="ผังแถว แบบที่ ${k + 1}">${tag}`;
        a.forEach((nm, i) => { s += box(6 + (W - 12) * (i + 0.5) / n, 40, nm, w); s += `<text class="dg-cap" x="${6 + (W - 12) * (i + 0.5) / n}" y="${H - 1}" text-anchor="middle">${i + 1}</text>`; });
        s += '</svg>';
      } else if (kind === 'round') {
        const W = 220, H = 200, cx = 110, cy = 104, R = 70;
        s += `<svg class="dg dg-round" viewBox="0 0 ${W} ${H}" width="48%" role="img" aria-label="ผังโต๊ะกลม แบบที่ ${k + 1}">${tag}<circle class="dg-ring" cx="${cx}" cy="${cy}" r="${R - 26}"/>`;
        s += `<path class="dg-arc" d="M${cx + 18} ${cy + 12} A 22 22 0 0 0 ${cx + 18} ${cy - 12}"/><path class="dg-arrowhead" d="M${cx + 18} ${cy - 12} l-5 1 l3 -5 z"/>`;
        a.forEach((nm, i) => { const f = (90 - i * 360 / n) * Math.PI / 180; s += box(cx + R * Math.cos(f), cy + R * Math.sin(f), nm, 50); });
        s += '</svg>';
      } else {
        const W = 150, H = 30 + n * 36;
        s += `<svg class="dg dg-rank" viewBox="0 0 ${W} ${H}" width="32%" role="img" aria-label="ลำดับ แบบที่ ${k + 1}">${tag}`;
        a.forEach((nm, i) => { s += `<text class="dg-cap" x="16" y="${44 + i * 36}" text-anchor="middle">${i + 1}</text>` + box(85, 38 + i * 36, nm, 80); });
        s += '</svg>';
      }
    });
    return `<div class="dg-row">${s}</div>`;
  }
  D.seats = seats;
  D.legend.row = 'ตำแหน่งนับจากซ้ายไปขวาตามที่ผู้อ่านมองเห็น · แสดงทุกแบบที่เข้ากับเงื่อนไข · กล่องสีคือคนที่ถามถึง';
  D.legend.round = 'มองจากด้านบน ทุกคนหันหน้าเข้ากลางโต๊ะ · ลูกศรกลางโต๊ะ = ทิศทวนเข็มนาฬิกา = ไปทางขวามือ · แสดงทุกแบบที่เข้ากับเงื่อนไข (หมุนโต๊ะแล้วซ้ำถือเป็นแบบเดียว)';
  D.legend.rank = 'อันดับ 1 อยู่บนสุด · แสดงทุกแบบที่เข้ากับเงื่อนไข · กล่องสีคือคนที่ถามถึง';

  /* ---------- 3.4 ผังครอบครัว ---------- */
  function family(hops, names, gsym, hi) {
    const n = names.length, gen = [0], col = [0];
    hops.forEach((h, i) => { gen.push(gen[i] + (h === 'up' ? -1 : h === 'down' ? 1 : 0)); col.push(i + 1); });
    const g0 = Math.min(...gen), G = Math.max(...gen) - g0 + 1, W = Math.max(240, n * 84), H = G * 86 + 10;
    const X = i => 42 + col[i] * ((W - 84) / Math.max(1, n - 1)), Y = i => 30 + (gen[i] - g0) * 86;
    let s = `<svg class="dg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="ผังครอบครัว">`;
    hops.forEach((h, i) => {
      const x1 = X(i), y1 = Y(i), x2 = X(i + 1), y2 = Y(i + 1);
      if (h === 'marry') s += `<line class="dg-e" x1="${x1 + 30}" y1="${y1 - 3}" x2="${x2 - 30}" y2="${y2 - 3}"/><line class="dg-e" x1="${x1 + 30}" y1="${y1 + 3}" x2="${x2 - 30}" y2="${y2 + 3}"/>`;
      else if (h === 'side') s += `<path class="dg-e dg-ge" d="M${x1} ${y1 - 18} V${y1 - 30} H${x2} V${y2 - 18}"/><text class="dg-cap" x="${(x1 + x2) / 2}" y="${y1 - 34}" text-anchor="middle">พี่น้อง</text>`;
      else { const top = h === 'up' ? i + 1 : i, bot = h === 'up' ? i : i + 1; s += `<path class="dg-e" d="M${X(top)} ${Y(top) + 18} V${(Y(top) + Y(bot)) / 2} H${X(bot)} V${Y(bot) - 18}"/>`; }
    });
    for (let i = 0; i < n; i++) {
      const on = hi.includes(i), lab = names[i] + ' ' + gsym[i];
      s += `<g><rect class="dg-n${on ? ' dg-hi' : ''}" x="${X(i) - 30}" y="${Y(i) - 17}" width="60" height="34" rx="8"/><text class="dg-t${on ? ' dg-hit' : ''}" x="${X(i)}" y="${Y(i) + 6}" text-anchor="middle">${esc(lab)}</text></g>`;
    }
    return s + '</svg>';
  }
  D.family = family;
  D.legend.family = '♂ = ชาย · ♀ = หญิง · ? = โจทย์ไม่ได้บอก (ไล่ทุกกรณีแล้วได้คำตอบเดียวกัน) · เส้นคู่ = สามีภรรยา · เส้นประบน = พี่น้อง · เส้นลง = พ่อแม่กับลูก · กล่องสีคือสองคนที่ถาม';

  /* ---------- 3.4 ทิศ: เส้นทางเดิน / จุดบนตาราง ---------- */
  function compass(x, y) {
    return `<g class="dg-comp"><line class="dg-e" x1="${x}" y1="${y + 14}" x2="${x}" y2="${y - 14}"/><path class="dg-arrowhead" d="M${x} ${y - 18} l-5 8 h10 z"/><text class="dg-cap" x="${x}" y="${y - 22}" text-anchor="middle">น.</text></g>`;
  }
  function grid(pts, labels, path) {      // pts: [[x,y],...] หน่วยตาราง
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
    const span = Math.max(x1 - x0, y1 - y0), u = Math.min(36, 260 / span), W = (x1 - x0) * u + 70, H = (y1 - y0) * u + 40;
    const X = x => 20 + (x - x0) * u, Y = y => 20 + (y1 - y) * u;
    let s = `<svg class="dg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${Math.min(W, 380)}px" role="img" aria-label="ผังทิศ">`;
    for (let x = x0; x <= x1; x++) s += `<line class="dg-grid" x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}"/>`;
    for (let y = y0; y <= y1; y++) s += `<line class="dg-grid" x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}"/>`;
    if (path) { s += `<polyline class="dg-path" points="${path.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>`; if (path.length > 1) s += `<line class="dg-ghost" x1="${X(path[0][0])}" y1="${Y(path[0][1])}" x2="${X(path[path.length - 1][0])}" y2="${Y(path[path.length - 1][1])}"/>`; }
    pts.forEach((p, i) => { if (labels[i] == null) return; s += `<circle class="dg-pt" cx="${X(p[0])}" cy="${Y(p[1])}" r="5"/><text class="dg-t" x="${X(p[0]) + 8}" y="${Y(p[1]) - 7}">${esc(labels[i])}</text>`; });
    s += compass(W - 22, 34);
    return s + '</svg>';
  }
  D.grid = grid;
  D.legend.walk = 'ช่องตาราง = ระยะ 1 หน่วยตามโจทย์ · เส้นทึบ = ทางที่เดิน · เส้นประ = ระยะตรงจากจุดเริ่มถึงจุดจบ · ลูกศร น. = ทิศเหนือ';
  D.legend.rel = 'ภาพนี้เป็นเพียงกรณีหนึ่ง ระยะจริงไม่ทราบ แต่ทิศที่ถามได้ผลเดียวกันทุกกรณี · ลูกศร น. = ทิศเหนือ';

  /* ---------- ตาราง (รหัส / ตารางไขว้ / ✓✗) ---------- */
  function table(head, rows, cls) {
    return `<div class="tscroll"><table class="tbl ${cls || ''}"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th>${esc(c)}</th>` : `<td class="${c === '✓' ? 'ok' : c === '✗' ? 'no' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  D.table = table;
  D.legend.code = 'เลขใต้ตัวอักษร = ลำดับในตัวอักษร (A = 1 … Z = 26) · ไล่ตรวจทุกกฎในตระกูลแล้ว เหลือกฎที่เข้ากับตัวอย่างเพียงกฎเดียว';
  D.legend.cross = '✓ = คำนี้อยู่ในประโยคนั้น · ตัดรหัสด้วยการหาคำที่อยู่ร่วมกันและไม่ร่วมกัน · ไล่ทุกการจับคู่แล้วรหัสของคำที่ถามมีแบบเดียว';
  D.legend.match = '✓ = เป็นแน่นอน · ✗ = เป็นไม่ได้ · ? = ยังไม่แน่ (ไล่ทุกการจับคู่ที่ไม่ขัดเงื่อนไข)';
  D.legend.team = 'รายชื่อทีมทั้งหมดที่ไม่ขัดเงื่อนไข · ข้อที่สรุปได้แน่นอนต้องจริงทุกทีมในรายการ';

  /* ---------- 3.6 ลูกศรเงื่อนไข ---------- */
  function logic(labels, edges, status) {   // edges: {a,b,na,nb,kind:'imp'|'or'} · status: 'T'|'F'|'?'
    const n = labels.length, W = 340, H = 64 + n * 0 + 170, cx = W / 2, cy = 112, R = 84;
    const P = labels.map((_, i) => { const f = (-90 + i * 360 / n) * Math.PI / 180; return [cx + R * 1.35 * Math.cos(f), cy + R * Math.sin(f)]; });
    let s = `<svg class="dg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="ผังเงื่อนไข"><defs><marker id="lgah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="dg-arrowhead" d="M0 0 L10 5 L0 10 z"/></marker></defs>`;
    edges.forEach(e => {
      const [x1, y1] = P[e.a], [x2, y2] = P[e.b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const sx = x1 + ux * 34, sy = y1 + uy * 20, ex = x2 - ux * 34, ey = y2 - uy * 20;
      s += `<line class="dg-e${e.kind === 'or' ? ' dg-ge' : ''}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"${e.kind === 'imp' ? ' marker-end="url(#lgah)"' : ''}/>`;
      const lab = e.kind === 'or' ? 'หรือ' : (e.na ? 'ไม่' : '') + '→' + (e.nb ? 'ไม่' : '');
      if (e.kind === 'or' || e.na || e.nb) s += `<text class="dg-op" x="${(sx + ex) / 2}" y="${(sy + ey) / 2 - 6}" text-anchor="middle">${esc(lab)}</text>`;
    });
    labels.forEach((l, i) => {
      const st = status[i], cls = st === 'T' ? ' dg-hi' : '';
      s += `<g><rect class="dg-n${cls}" x="${P[i][0] - 32}" y="${P[i][1] - 18}" width="64" height="36" rx="8"/><text class="dg-t" x="${P[i][0]}" y="${P[i][1] + 6}" text-anchor="middle">${esc(l)} ${st === 'T' ? '✓' : st === 'F' ? '✗' : '?'}</text></g>`;
    });
    return s + '</svg>';
  }
  D.logic = logic;
  D.legend.logic = 'ลูกศร = "ถ้า…แล้ว…" (ไม่→ = ฝั่งนั้นเป็นนิเสธ) · เส้นประ = "หรือ" · ✓ = จริงทุกกรณี · ✗ = เท็จทุกกรณี · ? = ไม่แน่';
})(window.TF = window.TF || {});
