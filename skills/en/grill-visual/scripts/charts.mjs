// 数の図を、数と札から SVG に描く。
// fig/qNN.json に型（bars・tiles）と数・札・層を書くと、build.mjs がここで SVG にする。
// モデルが座標と SVG を書かずに済むので、図1枚の出力と考える量が減る。決まりは手で描く図と同じ（references/figure.md）。

const TONE = {
  base: 'fill="var(--surface)" stroke="var(--frame)"',
  accent: 'fill="var(--accent)" stroke="var(--accent)"',
  soft: 'fill="var(--accent-soft)" stroke="var(--accent)"',
  est: 'fill="var(--paper)" stroke="var(--accent)" stroke-dasharray="5 3"',
  q: 'fill="var(--q-soft)" stroke="var(--q)"',
  ok: 'fill="var(--ok-soft)" stroke="var(--ok)"',
  mute: 'fill="var(--paper)" stroke="var(--mute)" stroke-dasharray="3 3"',
};
const INK = { accent: 'var(--paper)' };
const r = v => Math.round(v * 10) / 10;
// 文字の幅の見積もり：全角は文字の大きさ、半角はその約0.58倍
export const textW = (s, size = 12) => [...String(s)].reduce((w, c) => w + (c.charCodeAt(0) < 0x2e80 ? 0.58 : 1) * size, 0);

export function chart(spec, where, bad, esc) {
  const T = (x, y, s, o = {}) => `<text x="${r(x)}" y="${r(y)}" font-size="${o.size || 12}"${o.bold ? ' font-weight="700"' : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''} fill="${o.fill || 'var(--ink)'}"${o.mono ? ' style="font-family:var(--mono)"' : ''}>${esc(s)}</text>`;
  const layer = (k, s) => (k ? `<g data-layer="${esc(k)}">${s}</g>` : s);
  const fits = (x, s, w, size) => { if (x + textW(s, size) > spec.width - 4) bad(w, `はみ出す（右端 約${Math.round(x + textW(s, size))}・幅 ${spec.width}。短くするか尺度を変える）`); };
  if (!spec || typeof spec !== 'object') { bad(where, '図の json が読めない'); return null; }
  spec.width = spec.width || 520;
  if (typeof spec.label !== 'string' || !spec.label.trim()) bad(`${where}.label`, '図の説明（aria-label）が要る');
  const W = spec.width;
  let y = spec.title ? 40 : 16, o = spec.title ? T(20, 20, spec.title, { fill: 'var(--mute)', mono: true }) : '';
  const labelW = rows => Math.max(60, ...rows.map(s => textW(s.label || '', 13))) + 16;

  if (spec.type === 'bars') {
    // 横棒。segs は左から積む（from を書いた区切りはその位置から。時間の帯に使う）。layers は案ごとに足す区切り・札・注
    const rows = spec.rows || [];
    if (!rows.length) bad(`${where}.rows`, '行が要る');
    if (!(spec.max > 0)) bad(`${where}.max`, '尺度の最大（数）が要る');
    const x0 = 20 + labelW(rows), k = (W - 20 - x0) / (spec.max || 1), top = y;
    rows.forEach((row, i) => {
      const w = `${where}.rows[${i}]`;
      o += T(20, y + 18, row.label || '', { size: 13, bold: true });
      let noteH = 0;
      [row, ...Object.entries(row.layers || {}).map(([key, v]) => ({ ...v, key }))].forEach(p => {
        let g = '', end = x0;
        (p.segs || []).forEach((sg, j) => {
          if (!(sg.v >= 0)) bad(`${w}.segs[${j}].v`, '0 以上の数が要る');
          const x = sg.from !== undefined ? x0 + sg.from * k : end, wd = (sg.v || 0) * k;
          g += `<rect x="${r(x)}" y="${y}" width="${r(Math.max(wd, 2))}" height="26" ${TONE[sg.tone] || TONE.soft} stroke-width="1.5"/>`;
          if (sg.text) {
            if (textW(sg.text) > wd - 12) bad(`${w}.segs[${j}].text`, `棒に収まらない（棒 ${Math.round(wd)}・文字 約${Math.round(textW(sg.text))}）。after に出すか短くする`);
            g += T(x + 8, y + 18, sg.text, { fill: INK[sg.tone] || 'var(--ink)' });
          }
          end = Math.max(end, x + wd);
        });
        if (p.after) { fits(end + 8, p.after, `${w}.after`); g += T(end + 8, y + 18, p.after, { bold: !!p.key, fill: p.key ? 'var(--accent)' : 'var(--ink)' }); }
        if (p.note) { fits(x0, p.note, `${w}.note`); g += T(x0, y + 44, p.note, { fill: 'var(--sub)' }); noteH = 22; }
        o += layer(p.key, g);
      });
      y += 38 + noteH;
    });
    const bottom = y - 12, marks = spec.marks || [];
    marks.forEach(m => {
      const x = x0 + m.v * k, end = m.text && x + textW(m.text) / 2 > W - 4;
      o += layer(m.layer, `<path d="M${r(x)} ${top - 6} V${bottom + 6}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>`
        + (m.text ? T(end ? x : x, bottom + 22, m.text, { bold: true, fill: 'var(--accent)', anchor: end ? 'end' : 'middle' }) : ''));
    });
    if (marks.some(m => m.text)) y += 24;
    if (spec.ticks) {
      o += spec.ticks.map((t, i) => { const last = i === spec.ticks.length - 1; return T(x0 + t * k, y + 12, last && spec.unit ? `${t}${spec.unit}` : String(t), { fill: 'var(--mute)', mono: true, anchor: last ? 'end' : 'middle' }); }).join('');
      y += 26;
    }
  } else if (spec.type === 'tiles') {
    // タイルの並び。swap は案ごとに差し替える文字（{"A B": "なし"}）。差し替える案では元の文字を隠す
    const rows = spec.rows || [], keys = spec.keys || [], tw = 36, th = 30, gap = 5;
    if (!rows.length) bad(`${where}.rows`, '行が要る');
    const x0 = 20 + labelW(rows), top = y, cw = spec.count ? Math.max(textW(spec.count.label || ''), 60) + 16 : 0;
    rows.forEach((row, i) => {
      o += T(20, y + 20, row.label || '');
      const items = row.items || [];
      if (x0 + items.length * (tw + gap) > W - 20 - cw) bad(`${where}.rows[${i}].items`, '行に収まらない（タイルを減らすか width を広げる）');
      items.forEach((it, j) => {
        const t = typeof it === 'string' ? { text: it } : it, x = x0 + j * (tw + gap), cx = x + tw / 2;
        const mono = /^[\x20-\x7e]+$/.test(t.text || '');
        o += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="3" fill="var(--surface)" stroke="var(--frame)" stroke-width="1.2"/>`;
        const txt = T(cx, y + 20, t.text || '', { anchor: 'middle', mono });
        if (!t.swap) { o += txt; return; }
        if (!keys.length) bad(`${where}.keys`, 'swap を使うときは層の名前の配列（keys）が要る');
        const used = Object.keys(t.swap).flatMap(s => s.split(/\s+/)), rest = keys.filter(x => !used.includes(x)).join(' ');
        if (rest) o += layer(rest, txt);
        Object.entries(t.swap).forEach(([ks, s]) => {
          o += layer(ks, `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="3" fill="var(--paper)" stroke="var(--mute)" stroke-width="1.2" stroke-dasharray="3 3"/>` + T(cx, y + 20, s, { anchor: 'middle', fill: 'var(--mute)' }));
        });
      });
      y += th + 10;
    });
    if (spec.count) {
      o += T(W - 8, top + 48, spec.count.label || '', { anchor: 'end', fill: 'var(--sub)' });
      Object.entries(spec.count.values || {}).forEach(([ks, s]) => { o += layer(ks, T(W - 8, top + 76, s, { anchor: 'end', size: 18, bold: true, fill: 'var(--accent)' })); });
    }
  } else { bad(`${where}.type`, 'bars か tiles'); return null; }

  if (spec.legend) {
    let x = 20;
    spec.legend.forEach(l => { o += `<rect x="${x}" y="${y}" width="12" height="12" ${TONE[l.tone] || TONE.soft} stroke-width="1"/>` + T(x + 18, y + 11, l.text); x += 18 + textW(l.text) + 20; });
    if (x > W) bad(`${where}.legend`, 'はみ出す');
    y += 26;
  }
  if (spec.foot) { fits(20, spec.foot, `${where}.foot`); o += T(20, y + 12, spec.foot, { fill: 'var(--sub)' }); y += 24; }
  return `<svg viewBox="0 0 ${W} ${Math.ceil(y + 4)}" role="img" aria-label="${esc(spec.label || '')}">${o}</svg>`;
}
