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
