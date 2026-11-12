/* html-foundation の parts.js — 設計図の線画の部品(references/04-parts.md)。
   どの関数も SVG の文字列を返す。<svg viewBox="0 0 1000 H"> の中に並べて使う。
   色は base.css の変数(var(--ink) など)を style で指すので、方向とダークに合わせて自動で変わる。
   線の太さは3段: 区画 1・物と流れ 1.5・主役の流れ 3。強調の色(accent)は主役と押せる物だけに使う。
   ページに <script> ごと貼るか、<script src> で読む。部品の名前がページの名前とぶつかるなら、全体を関数で包む。 */

/* 色の名前('ink' 'sub' 'mute' 'stroke' 'accent' 'ok' 'ng' 'q' 'surface' 'none' など)を CSS の値にする */
const V = c => (c === 'none' ? 'none' : c.startsWith('#') || c.startsWith('var(') ? c : `var(--${c})`);
const ESC = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ST = (stroke = 'ink', fill = 'surface', w = 1.5, more = '') =>
  `style="stroke:${V(stroke)};fill:${V(fill)};stroke-width:${w}${more ? ';' + more : ''}"`;

/* 文字。T は1行、TL は複数行。大きさは viewBox の単位で 12 以上にする(05 の物差しが 11px 未満を止める) */
const T = (x, y, s, c = 'ink', sz = 13, w = 400, a = 'start') =>
  `<text x="${x}" y="${y}" font-size="${sz}" font-weight="${w}" text-anchor="${a}" style="fill:${V(c)}">${ESC(s)}</text>`;
const TL = (x, y, ls, c = 'ink', sz = 13, w = 400, a = 'start', lh = 1.45) => ls.map((s, i) => T(x, y + i * sz * lh, s, c, sz, w, a)).join('');
const MONO = (x, y, s, c = 'mute', sz = 12, a = 'start') =>
  `<text x="${x}" y="${y}" font-size="${sz}" font-weight="600" text-anchor="${a}" style="fill:${V(c)};font-family:var(--mono)">${ESC(s)}</text>`;

/* 矢じりは開いた V。太さによらず同じ大きさ。1ページに1回、どれかの <svg> の頭に defs(p) を置く。
   p は ID の頭。同じページに部品の組を2つ置くときは変える。ids: p-ink・p-mute・p-accent・p-ok・p-ng */
const defs = (p = 'hf') => {
  const mk = c => `<marker id="${p}-${c}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M1.5 1.5L8.5 5L1.5 8.5" style="fill:none;stroke:${V(c)};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round"/></marker>`;
  return `<defs>${['ink', 'mute', 'accent', 'ok', 'ng'].map(mk).join('')}</defs>`;
};

/* 区画: 破線の枠と、左上に等幅の名前。線は 1(いちばん細い) */
const region = (x, y, w, h, name, c = 'frame') =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ${ST(c, 'none', 1, 'stroke-dasharray:5 4')}/>${name ? MONO(x + 10, y + 18, name) : ''}</g>`;

/* 流れ: 矢印つきの線 1.5。d は縦横の線で描き、角は丸める。矢印には近くに札(note)を付ける */
const flow = (d, c = 'ink', p = 'hf', dash = false) =>
  `<path d="${d}" ${ST(c, 'none', 1.5, `stroke-linecap:round;stroke-linejoin:round${dash ? ';stroke-dasharray:4 4' : ''}`)} marker-end="url(#${p}-${c})"/>`;
/* 主役の流れ: 線 3。矢じりは付けない(向きは配置と札で見せる) */
const road = (d, c = 'ink') => `<path d="${d}" ${ST(c, 'none', 3, 'stroke-linecap:round;stroke-linejoin:round')}/>`;
/* 線の上の札: 地の色で抜いた小さな文字 */
const note = (x, y, s, c = 'sub', sz = 12, a = 'middle') => {
  const w = String(s).length * sz * 0.95 + 10;
  const x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x;
  return `<g><rect x="${x0}" y="${y - sz}" width="${w}" height="${sz + 6}" rx="2" style="fill:var(--surface)"/>${T(x0 + w / 2, y + 1, s, c, sz, 400, 'middle')}</g>`;
};

/* ---------- 物(線 1.5、地は面の色) ---------- */
const gate = (x, y, s = 1, bar = 'accent', post = 'ink') =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="M-14 22V-10M14 22V-10" ${ST(post, 'none', 1.5, 'stroke-linecap:round')}/><rect x="-20" y="-18" width="40" height="8" rx="1" ${ST(bar)}/></g>`;
const cog = (x, y, s = 1) =>
  `<g transform="translate(${x},${y}) scale(${s})"><circle r="9" ${ST('ink', 'none', 3, 'stroke-dasharray:2.4 2.3')}/><circle r="6.5" ${ST('ink', 'surface', 1.3)}/><circle r="2" ${ST('ink', 'none', 1.2)}/></g>`;
const bot = (x, y, s = 1) =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 -8V-12" ${ST('ink', 'none', 1.3)}/><circle cy="-13.5" r="1.6" ${ST('ink', 'surface', 1.3)}/><rect x="-9" y="-8" width="18" height="14" rx="2" ${ST('ink', 'surface', 1.3)}/><rect x="-8" y="8" width="16" height="12" rx="2" ${ST('ink', 'surface', 1.3)}/><rect x="-5.5" y="-3" width="3" height="3" style="fill:var(--ink)"/><rect x="2.5" y="-3" width="3" height="3" style="fill:var(--ink)"/></g>`;
const man = (x, y, s = 1, ghost = false, c = 'ink') =>
  `<g transform="translate(${x},${y}) scale(${s})"><circle r="7.5" ${ST(c, 'surface', 1.5, ghost ? 'stroke-dasharray:3 2' : '')}/><path d="M-10 24V16Q-10 10 -4 10H4Q10 10 10 16V24" ${ST(c, 'surface', 1.5, ghost ? 'stroke-dasharray:3 2' : '')}/></g>`;
const house = (x, y, s = 1, label = 'main') =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="M-34 -24L0 -48L34 -24" ${ST('ink', 'none', 1.5, 'stroke-linejoin:round')}/><rect x="-28" y="-24" width="56" height="44" ${ST()}/>${T(0, 4, label, 'ink', 13, 700, 'middle')}</g>`;
const shield = (x, y, s = 1) =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 -16L13 -11V0C13 9 6 14 0 17C-6 14 -13 9 -13 0V-11Z" ${ST('ink', 'surface', 1.4)}/><rect x="-5" y="-3" width="10" height="8" rx="1" ${ST('ink', 'none', 1.4)}/><path d="M-3 -3V-6A3 3 0 0 1 3 -6V-3" ${ST('ink', 'none', 1.4)}/></g>`;
const lock = (x, y, s = 1, c = 'ink') =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="M-6 -2V-7A6 6 0 0 1 6 -7V-2" ${ST(c, 'none')}/><rect x="-9" y="-2" width="18" height="14" rx="1.5" ${ST(c)}/><circle cy="4" r="1.8" ${ST(c)}/></g>`;
/* 書類: 右上を折った紙。title は中の1行目 */
const doc = (x, y, w, h, title = '', c = 'ink', fill = 'surface') =>
  `<g><path d="M${x} ${y}H${x + w - 14}L${x + w} ${y + 14}V${y + h}H${x}Z" ${ST(c, fill)}/><path d="M${x + w - 14} ${y}V${y + 14}H${x + w}" ${ST(c, 'none', 1.2)}/>${title ? T(x + 10, y + 20, title, c, 13, 700) : ''}</g>`;
/* 文の行の代わりの灰の線。3本目ごとに短くする */
const lines = (x, y, w, n, gap = 9, c = 'stroke') =>
  Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * gap}H${x + w * (i % 3 === 2 ? 0.6 : 1)}" ${ST(c, 'none', 2, 'stroke-linecap:round')}/>`).join('');
/* 札: 角の小さな四角に言葉。c は線と文字、fill は地 */
const tag = (x, y, s, c = 'ink', fill = 'surface', sz = 12, w = null) => {
  const ww = w ?? String(s).length * sz * 0.95 + 14;
  return `<g><rect x="${x}" y="${y}" width="${ww}" height="${sz + 9}" rx="3" ${ST(c, fill, 1)}/>${T(x + ww / 2, y + sz + 2, s, c, sz, 700, 'middle')}</g>`;
};
const crate = (x, y, w, h, lab) =>
  `<g><path d="M${x} ${y + 16}L${x + w / 2} ${y}L${x + w} ${y + 16}" ${ST('ink', 'none')}/><rect x="${x}" y="${y + 16}" width="${w}" height="${h - 16}" rx="1" ${ST()}/>${T(x + w / 2, y + h / 2 + 14, lab, 'ink', 12, 700, 'middle')}</g>`;
const cal = (x, y, lab) =>
  `<g><rect x="${x}" y="${y}" width="44" height="40" rx="2" ${ST()}/><path d="M${x} ${y + 11}H${x + 44}" ${ST('ink', 'none')}/>${T(x + 22, y + 31, lab, 'ink', 12, 700, 'middle')}</g>`;
/* 付箋: 確かめる物(要確認)に使う。既定は黄土 */
const sticky = (x, y, w, h, ls, kind = 'q', rot = 0) =>
  `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" ${ST(kind, kind + '-soft', 1)}/>${TL(x + 8, y + 18, ls, kind, 12)}</g>`;

/* ---------- 押せる番号と印 ---------- */
/* 番号: on=押せる(強調色の四角に白い番号と ▸)、off=押せない(灰の枠)。
   押せる物には data-n を付ける。ページの JS で [data-n] の click と Enter を拾う。▸ は四角の右 14〜19 に出るので隣と離す */
const badge = (x, y, n, on = true, label = '') => on
  ? `<g class="nb" data-n="${ESC(n)}" tabindex="0" role="button" aria-label="${ESC(label || n + ' を開く')}"><rect class="bx" x="${x - 11}" y="${y - 11}" width="22" height="22" rx="3" style="fill:var(--accent)"/>${T(x, y + 4.5, n, 'on-accent', 13, 700, 'middle')}<path d="M${x + 14} ${y - 5}l5 5-5 5" ${ST('accent', 'none', 2.2, 'stroke-linecap:round;stroke-linejoin:round')}/></g>`
  : `<g class="nb off" aria-hidden="true"><rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="3" ${ST('mute', 'surface', 1.2)}/>${T(x, y + 4.5, n, 'mute', 13, 700, 'middle')}</g>`;
/* 引き出しの札: (ax,ay) の物から (x,y) の札へ線を引く。kind='q' は要確認(黄土の地)、'fill' は補った所(墨の枠・✎ は呼ぶ側が書く) */
const callout = (x, y, w, t1, t2, ax, ay, kind = 'q') => {
  const c = kind === 'q' ? 'q' : 'ink', f = kind === 'q' ? 'q-soft' : 'surface';
  return `<g><path d="M${x + w / 2} ${y + 38}L${ax} ${ay}" ${ST(c, 'none', 1.2)}/><rect x="${x}" y="${y}" width="${w}" height="38" rx="2" ${ST(c, f, kind === 'q' ? 1 : 1.5)}/>${T(x + 10, y + 16, t1, c, 12, 700)}${T(x + 10, y + 32, t2, 'ink', 12)}</g>`;
};
