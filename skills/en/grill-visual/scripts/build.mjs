#!/usr/bin/env node
// grill-visual の組み立て。議論のフォルダの page.json と図の断片（fig/）から index.html を書く。
// モデルが書くのは page.json と図の断片だけ。tokens.css・parts.js（html-foundation）と、
// 骨格の CSS・JS・回答欄・回答バー（assets/frame/）はここで差し込む。回答欄の形を仕組みで守るため。
// データの形は references/data.md。
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chart } from './charts.mjs';
import vm from 'node:vm';

const USAGE = `使い方: node build.mjs <議論のフォルダ> [--fig <QID>] [--tasks]
  page.json と fig/ から index.html を書く。page.json に summary があれば summary.html も書く。
  tasks.json があれば、まとめが数秒ごとに読み直す tasks.js も書く。
  --tasks     tasks.json を確かめて tasks.js だけを書く（エージェントがタスクを書き戻したとき。開いたままのまとめが描き直す）
  --fig Q01   その問いの図を、案とコマごとに並べた確かめ用のページ fig/q01.check.html を書く
              （直した図1枚を html-check にかけるとき。index.html は書かない）
終了コード: 0 = 書いた、1 = page.json か図が崩れている（どの項目かを出す）、2 = 引数の誤り
土台の場所は HTML_FOUNDATION で渡せる。無ければ中の assets/foundation、隣の html-foundation の順に探す。`;

const args = process.argv.slice(2);
let dir = null, onlyFig = null, onlyTasks = false;
for (let i = 0; i < args.length; i++) {
  // 問いの ID（q01）は大文字にそろえる。断片のパス（fig/x.js）は拡張子で読み方が変わるので、そのまま
  if (args[i] === '--fig') { const v = args[++i] || ''; onlyFig = /^q\d+$/i.test(v) ? v.toUpperCase() : v; }
  else if (args[i] === '--tasks') onlyTasks = true;
  else if (args[i] === '-h' || args[i] === '--help') { console.log(USAGE); process.exit(0); }
  else dir = resolve(args[i]);
}
if (!dir || !existsSync(join(dir, 'page.json'))) { console.error(USAGE + (dir ? `\n\npage.json が無い: ${dir}` : '')); process.exit(2); }

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FRAME = join(SKILL, 'assets/frame');
// 公開版は土台の写しを中（assets/foundation）に持つ。無ければ隣の html-foundation スキルを使う
const HF = [process.env.HTML_FOUNDATION, join(SKILL, 'assets/foundation'), join(SKILL, '../html-foundation')]
  .filter(Boolean).find(p => existsSync(join(p, 'assets/tokens.css')));
if (!HF) { console.error('土台（assets/foundation か html-foundation）が見つからない。HTML_FOUNDATION で場所を渡す'); process.exit(2); }
const rd = p => readFileSync(p, 'utf8');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ひな形: frame/parts.html を <!-- @名前 --> で切る。{{x}} は文字、{{{x}}} は HTML */
const TPL = {};
rd(join(FRAME, 'parts.html')).split(/^<!-- @([\w-]+) -->\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) TPL[v] = a[i + 1]; });
const fill = (name, o) => TPL[name].replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, raw, txt) => (raw ? (o[raw] ?? '') : esc(o[txt] ?? ''))).replace(/\n$/, '');

/* ---------- page.json を確かめる。崩れは項目の場所を集めて、最後にまとめて止まる ---------- */
const errs = [];
const bad = (where, what) => errs.push(`${where}: ${what}`);

/* ---------- tasks.json（形は references/data.md の「タスクのデータ」） ---------- */
const TASKS_PATH = join(dir, 'tasks.json');
let tasksData = null;
if (existsSync(TASKS_PATH)) {
  try { tasksData = JSON.parse(readFileSync(TASKS_PATH, 'utf8')); } catch (e) { bad('tasks.json', `読めない: ${e.message}`); }
  if (tasksData) {
    const T_ = Array.isArray(tasksData.tasks) ? tasksData.tasks : (bad('tasks.json.tasks', '配列が要る'), []);
    const st = tasksData.states || {}, by = {};
    if (!Array.isArray(tasksData.for_agent) || !tasksData.for_agent.length) bad('tasks.json.for_agent', '進め方の文の配列が要る');
    T_.forEach((t, i) => { const w = `tasks.json.tasks[${i}]${t?.id ? `（${t.id}）` : ''}`;
      if (!/^T\d{2,}$/.test(t?.id || '')) bad(`${w}.id`, 'T01 の形が要る'); else if (by[t.id]) bad(`${w}.id`, '同じ ID がほかにもある'); else by[t.id] = t;
      ['title', 'done_when', 'how_to_check'].forEach(k => { if (!isStrT(t?.[k])) bad(`${w}.${k}`, '文字が要る'); });
      if (!st[t?.state]) bad(`${w}.state`, `知らない state「${t?.state}」（${Object.keys(st).join(', ')}）`);
      if (!Array.isArray(t?.steps) || !t.steps.length) bad(`${w}.steps`, '手順の配列が要る');
      if (t?.steps_done !== undefined && !(Number.isInteger(t.steps_done) && t.steps_done >= 0 && t.steps_done <= (t.steps || []).length)) bad(`${w}.steps_done`, '0〜手順の数の整数');
      ['depends_on', 'from', 'proof', 'files'].forEach(k => { if (!Array.isArray(t?.[k])) bad(`${w}.${k}`, '配列が要る（無ければ []）'); }); });
    T_.forEach(t => (t.depends_on || []).forEach(d => { if (!by[d]) bad(`tasks.json（${t.id}）.depends_on`, `無いタスク「${d}」`); }));
    const mark = {};
    const visit = (id, path) => { if (mark[id] === 2 || !by[id]) return; if (mark[id] === 1) { bad('tasks.json', `依存が輪になっている: ${path.join(' → ')}`); return; }
      mark[id] = 1; (by[id].depends_on || []).forEach(d => visit(d, [...path, d])); mark[id] = 2; };
    T_.forEach(t => visit(t.id, [t.id]));
  }
}
function isStrT(v) { return typeof v === 'string' && v.trim() !== ''; }
// 開いたままのまとめが数秒ごとに読む。書きかけを読ませないよう、別名で書いてから置き換える
function writeTasksJs() {
  const out = join(dir, 'tasks.js');
  writeFileSync(out + '.tmp', `window.TASKS_DATA=${JSON.stringify(tasksData)};\n`);
  renameSync(out + '.tmp', out);
}
if (onlyTasks) {
  if (!tasksData && !errs.length) { console.error('tasks.json が無い'); process.exit(1); }
  if (errs.length) { console.error(`tasks.json が崩れている（${errs.length} 件）:\n` + errs.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
  writeTasksJs();
  const n = tasksData.tasks.length, d = tasksData.tasks.filter(t => t.state === 'done').length;
  console.log(`tasks.js を書いた（${d}/${n} 完了）`);
  process.exit(0);
}
let page;
try { page = JSON.parse(rd(join(dir, 'page.json'))); } catch (e) { console.error(`page.json を読めない: ${e.message}`); process.exit(1); }
const isStr = v => typeof v === 'string' && v.trim() !== '';
const need = (o, where, keys, test = isStr, what = '文字が要る') => keys.forEach(k => { if (!test(o?.[k])) bad(`${where}.${k}`, what); });
need(page, 'page.json', ['version', 'round'], Number.isInteger, '整数が要る');
need(page, 'page.json', ['date', 'title', 'lead']);
if (page.status && !['open', 'ended'].includes(page.status)) bad('page.json.status', 'open か ended');
if (page.status === 'ended') need(page, 'page.json', ['end']);
page.map = page.map || {};
if (page.map.figs !== undefined && (!Array.isArray(page.map.figs) || !page.map.figs.length)) bad('page.json.map.figs', '図の断片のパスの配列（省くと組み立てが論点と依存から描く）');
if (!Array.isArray(page.questions)) bad('page.json.questions', '配列が要る');
if (!Array.isArray(page.decisions)) bad('page.json.decisions', '配列が要る（無ければ []）');
const Q = Array.isArray(page.questions) ? page.questions : [];
const D = Array.isArray(page.decisions) ? page.decisions : [];
const qById = {};
Q.forEach((q, i) => {
  const w = `questions[${i}]${q?.id ? `（${q.id}）` : ''}`;
  if (!/^Q\d{2,}$/.test(q?.id || '')) bad(`${w}.id`, 'Q01 の形が要る');
  else if (qById[q.id]) bad(`${w}.id`, '同じ ID がほかにもある');
  else qById[q.id] = q;
  need(q, w, ['title', 'impact', 'undo', 'background', 'issue', 'fig', 'fig_top', 'order']);
  need(q, w, ['round'], Number.isInteger, '整数が要る');
  if (!Array.isArray(q.options) || q.options.length < 2) { bad(`${w}.options`, '選択肢が2つ以上要る'); q.options = []; }
  const keys = new Set();
  q.options.forEach((o, j) => {
    need(o, `${w}.options[${j}]`, ['key', 'name', 'text', 'pros', 'cons']);
    if (keys.has(o.key)) bad(`${w}.options[${j}].key`, '同じ key がほかにもある');
    keys.add(o.key);
  });
  if (!q.skip) {
    need(q, w, ['why']);
    if (!Array.isArray(q.recommended) || !q.recommended.length) bad(`${w}.recommended`, '推奨の key の配列が要る');
  }
  (q.recommended || []).forEach(k => { if (!keys.has(k)) bad(`${w}.recommended`, `選択肢に無い key「${k}」`); });
  if (!q.multi && (q.recommended || []).length > 1) bad(`${w}.recommended`, '1つだけ選ぶ問いに推奨が2つある');
  (q.after || []).forEach(a => { if (!Q.some(x => x.id === a)) bad(`${w}.after`, `無い問い「${a}」`); });
  if (isStr(q.order) && q.order.split('\n').length > 2) bad(`${w}.order`, '注文書は2行まで');
});
const dById = {};
D.forEach((d, i) => {
  const w = `decisions[${i}]${d?.id ? `（${d.id}）` : ''}`;
  const q = qById[d?.id];
  if (!q) bad(`${w}.id`, '問いに無い ID');
  if (dById[d?.id]) bad(`${w}.id`, '同じ決定がほかにもある');
  dById[d?.id] = d;
  need(d, w, ['round'], Number.isInteger, '整数が要る');
  need(d, w, ['line', 'adopted', 'reason', 'cost', 'rejected']);
  if (!Array.isArray(d.pick) || !d.pick.length) bad(`${w}.pick`, '選んだ key の配列が要る');
  else if (q) d.pick.forEach(k => { if (!q.options.some(o => o.key === k)) bad(`${w}.pick`, `選択肢に無い key「${k}」`); });
  if (q && !q.multi && (d.pick || []).length > 1) bad(`${w}.pick`, '1つだけ選ぶ問いに2つある');
});

/* ---------- 図の断片 ---------- */
// .svg はそのまま。.js は parts.js の部品を使える関数の中身で、<svg> の文字列を return する。.html は表などをそのまま入れる
const PARTS = rd(join(HF, 'assets/parts.js'));
const figCache = {};
function loadFig(path, where) {
  if (figCache[path] !== undefined) return figCache[path];
  const p = join(dir, path);
  let s = null;
  if (!isStr(path)) bad(where, '図の断片のパスが要る');
  else if (!existsSync(p)) bad(where, `図の断片が無い: ${path}`);
  else if (path.endsWith('.js')) {
    try { s = vm.runInNewContext(`${PARTS}\n;(function(){\n${rd(p)}\n})()`, {}, { filename: path, timeout: 5000 }); }
    catch (e) { bad(where, `${path} を動かせない: ${e.message}`); }
    if (s !== null && typeof s !== 'string') { bad(where, `${path} が文字列を返さない`); s = null; }
  } else if (path.endsWith('.json')) {
    // 数の図：型と数から charts.mjs が描く
    try { s = chart(JSON.parse(rd(p)), path, bad, esc); } catch (e) { bad(where, `${path} を読めない: ${e.message}`); }
  } else s = rd(p);
  if (s !== null) {
    s = s.trim();
    if (!path.endsWith('.html')) {
      if (!/^<svg[\s>]/.test(s) || !/<\/svg>$/.test(s)) { bad(where, `${path} は <svg> で始まり </svg> で終わる1つの要素にする`); s = null; }
      else if (!/^<svg[^>]*\bviewBox=/.test(s)) { bad(where, `${path} の <svg> に viewBox が要る`); s = null; }
      else if (!/^<svg[^>]*\baria-label=/.test(s)) bad(where, `${path} の <svg> に aria-label（図の説明）が要る`);
    }
  }
  return (figCache[path] = s);
}
// 同じ断片をページに2回以上置くとき、断片の中で決めた id と、その id への参照に頭を付ける
function prefixIds(svg, pre) {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  if (!ids.size) return svg;
  return svg.replace(/(\sid=")([^"]+)(")/g, (m, a, id, b) => (ids.has(id) ? a + pre + id + b : m))
    .replace(/url\(#([^)]+)\)/g, (m, id) => (ids.has(id) ? `url(#${pre}${id})` : m))
    .replace(/((?:xlink:)?href="#)([^"]+)(")/g, (m, a, id, b) => (ids.has(id) ? a + pre + id + b : m));
}
// 層（data-layer）とコマ（data-frame・data-step）を持つ図は、<svg> に見せる状態を書く。表示は CSS が決める
const layerKeys = new Set();
let maxFrame = 0;
function scanFig(svg) {
  for (const m of svg.matchAll(/data-layer="([^"]+)"/g)) m[1].split(/\s+/).forEach(k => layerKeys.add(k));
  for (const m of svg.matchAll(/data-(?:frame|step)="(\d+)"/g)) maxFrame = Math.max(maxFrame, Number(m[1]));
}
// 決定の前と後のように見せる層が決まっている所では、出さない層を取り除いてページを軽くする
function pruneLayers(svg, keys) {
  let out = '', i = 0;
  const re = /<g\b[^>]*\sdata-layer="([^"]+)"[^>]*>/g;
  for (let m; (m = re.exec(svg));) {
    if (m.index < i || m[1].split(/\s+/).some(k => keys.includes(k))) continue;
    let depth = 1, j = re.lastIndex;
    const tag = /<g\b[^>]*?(\/?)>|<\/g>/g;
    tag.lastIndex = j;
    for (let t; depth && (t = tag.exec(svg));) { if (t[0] === '</g>') depth--; else if (!t[1]) depth++; j = tag.lastIndex; }
    out += svg.slice(i, m.index); i = j; re.lastIndex = j;
  }
  return out + svg.slice(i);
}
const framesOf = svg => Math.max(0, ...[...svg.matchAll(/data-(?:frame|step)="(\d+)"/g)].map(m => Number(m[1])));
function stateFig(svg, attrs) {
  const a = Object.entries(attrs).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  return svg.replace(/^<svg/, '<svg' + a);
}
// 依存マップの札 <a data-q="Q01">：状態（決定・今回・見送り・後で）の色と文字を page.json から付ける。
// 札の形と位置、線は断片のまま。色は page.css が data-st で塗る
function tagStates(s, where) {
  return s.replace(/<a\b([^>]*?)\sdata-q="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (m, a1, id, a2, inner) => {
    const q = qById[id], d = dById[id];
    const [st, label] = d ? ['done', `Decided (${d.pick.join(', ')})`] : !q ? ['later', 'Later'] : q.skip ? ['skip', 'Skipped'] : ['now', q.round === page.round ? 'This round' : 'Awaiting answer'];
    if (!/\sdata-state\b/.test(inner)) errs.push(`${where}: 札 data-q="${id}" に <text data-state> が無い（状態の文字を入れる所）`);
    inner = inner.replace(/(<text\b[^>]*\sdata-state\b[^>]*>)[\s\S]*?(<\/text>)/, `$1${esc(id)} · ${esc(label)}$2`);
    const attrs = (a1 + a2).replace(/\s(?:href|class|data-st)="[^"]*"/g, '');
    return `<a${attrs} data-q="${id}" data-st="${st}"${st === 'later' ? '' : ` href="#${id.toLowerCase()}" class="qnode"`}>${inner}</a>`;
  });
}
function figBlock(path, where, { pre = '', view, at, id, keys, label } = {}) {
  let s = loadFig(path, where);
  if (s === null) return '';
  if (path.endsWith('.html')) return s;
  if (/\sdata-q="/.test(s)) s = tagStates(s, where);
  if (pre) s = prefixIds(s, pre);
  if (pre && view) s = pruneLayers(s, view);
  if (label) s = s.replace(/^(<svg[^>]*?\saria-label=")[^"]*"/, (m, a) => a + esc(label) + '"');
  scanFig(s);
  const layered = /data-layer=/.test(s), framed = framesOf(s);
  return stateFig(s, { id, 'data-view': layered ? (view || []).join(' ') : undefined, 'data-keys': layered && keys ? keys.join(' ') : undefined,
    'data-at': framed ? String(at === 'last' ? framed : at || 1) : undefined, 'data-frames': framed ? String(framed) : undefined });
}
// 層とコマを出し入れする CSS。断片が使った key とコマの数だけ書く
function layerCSS() {
  let c = 'svg[data-view] [data-layer]{display:none}\n';
  for (const k of layerKeys) c += `svg[data-view~="${k}"] [data-layer~="${k}"]{display:inline}\n`;
  if (maxFrame) {
    c += 'svg[data-at] [data-frame]{display:none}\nsvg[data-at] [data-step]{opacity:.18;transition:opacity .2s}\n@media (prefers-reduced-motion:reduce){svg[data-at] [data-step]{transition:none}}\n';
    for (let n = 1; n <= maxFrame; n++) {
      c += `svg[data-at="${n}"] [data-frame="${n}"]{display:inline}\n`;
      c += Array.from({ length: n }, (_, i) => `svg[data-at="${n}"] [data-step="${i + 1}"]`).join(',') + '{opacity:1}\n';
    }
  }
  return c;
}

/* ---------- 依存マップ（組み立てが描く） ---------- */
// map.figs が無ければ、論点（map.nodes か questions）と依存（after）から札と線を描く。
// 札は手で描くマップと同じ印（<a data-q>・data-tag・data-state）なので、状態の色と文字は tagStates が付ける
function mapFig() {
  const src = Array.isArray(page.map.nodes) && page.map.nodes.length ? page.map.nodes : Q.map(q => ({ id: q.id }));
  const nodes = src.map((n, i) => {
    const q = qById[n?.id];
    if (!/^Q\d{2,}$/.test(n?.id || '')) bad(`page.json.map.nodes[${i}].id`, 'Q01 の形が要る');
    return { id: n?.id || '', name: n?.name || q?.title || '', after: (q ? q.after : n?.after) || [] };
  });
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  nodes.forEach((n, i) => n.after.forEach(a => { if (!byId[a]) bad(`page.json.map.nodes[${i}]（${n.id}）`, `依存先「${a}」がマップに無い`); }));
  // 列は、依存をたどった最も長い道の長さ。輪は止める
  const col = {};
  const depth = (id, seen) => {
    if (col[id] !== undefined) return col[id];
    if (seen.includes(id)) { bad('page.json.map', `依存が輪になっている: ${[...seen, id].join(' → ')}`); return 0; }
    return (col[id] = Math.max(0, ...byId[id].after.filter(a => byId[a]).map(a => depth(a, [...seen, id]) + 1)));
  };
  nodes.forEach(n => depth(n.id, []));
  const C = Math.max(0, ...nodes.map(n => col[n.id])) + 1;
  const colW = 960 / C, w = Math.min(220, Math.floor(colW - 44)), per = Math.max(4, Math.floor((w - 20) / 12.5));
  const names = Object.fromEntries(nodes.map(n => {
    const s = [...n.name], l = [s.slice(0, per).join(''), s.slice(per, per * 2).join('')].filter(Boolean);
    if (s.length > per * 2) l[1] = s.slice(per, per * 2 - 1).join('') + '…';
    return [n.id, l];
  }));
  const h = 31 + 17 * Math.max(1, ...Object.values(names).map(l => l.length)), gap = 16;
  const cols = Array.from({ length: C }, (_, c) => nodes.filter(n => col[n.id] === c));
  const rows = Math.max(...cols.map(c => c.length));
  const pos = {};
  // 2列目からは、依存先の高さの平均で並べ替えて、線の交わりを減らす
  const midY = n => { const ys = n.after.filter(a => pos[a]).map(a => pos[a].y); return ys.length ? ys.reduce((s, v) => s + v, 0) / ys.length : 0; };
  cols.forEach((list, c) => (c ? [...list].sort((a, b) => midY(a) - midY(b)) : list)
    .forEach((n, r) => { pos[n.id] = { x: 20 + c * colW, y: 16 + (rows - list.length) * (h + gap) / 2 + r * (h + gap) }; }));
  let edges = '', tags = '';
  nodes.forEach(n => n.after.filter(a => pos[a]).forEach(a => {
    const s = pos[a], t = pos[n.id], x1 = s.x + w, y1 = s.y + h / 2, x2 = t.x - 4, y2 = t.y + h / 2, dx = Math.max(16, (x2 - x1) / 2);
    edges += `<path d="M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}" fill="none" stroke="var(--sub)" stroke-width="1.5" marker-end="url(#map-ar)"/>`;
  }));
  nodes.forEach(n => {
    const { x, y } = pos[n.id];
    tags += `<a data-q="${esc(n.id)}"><rect data-tag x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--surface)" stroke="var(--frame)" stroke-width="1.5"/>`
      + `<text data-state x="${x + 10}" y="${y + 20}" font-size="12" font-weight="700" fill="var(--ink)">${esc(n.id)}</text>`
      + names[n.id].map((l, k) => `<text x="${x + 10}" y="${y + 38 + 17 * k}" font-size="12" fill="var(--ink)">${esc(l)}</text>`).join('') + '</a>';
  });
  const dep = nodes.filter(n => n.after.length).map(n => `${n.id} after ${n.after.join(', ')}`);
  const label = `Dependency map of the issues. ${nodes.map(n => `${n.id} ${n.name}`).join(', ')}. ${dep.length ? dep.join(', ') + '.' : 'No dependencies.'}`;
  const defs = '<defs><marker id="map-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="var(--sub)" stroke-width="1.5"/></marker></defs>';
  return `<svg viewBox="0 0 1000 ${Math.ceil(32 + rows * (h + gap) - gap)}" role="img" aria-label="${esc(label)}">${defs}${edges}${tags}</svg>`;
}

/* ---------- 区画・問い ---------- */
const lead = s => (s ? `<p class="lead small">${esc(s)}</p>` : '');
function section(sec, where, sid, idattr = '') {
  const figs = (sec.figs || []).map((f, i) => `<div class="wide" style="margin-top:10px">${figBlock(f, `${where}.figs[${i}]`)}</div>`).join('');
  const note = sec.note ? `<p class="vnote">${esc(sec.note)}</p>` : '';
  const det = (sec.details || []).map(d => `<details><summary>${esc(d.summary)}</summary>${d.html || ''}</details>`).join('');
  return fill('section', { idattr, sid, eyebrow: sec.eyebrow || '', title: sec.title || '', lead: lead(sec.lead), figs, note, details: det });
}
const keyName = k => k;
function question(q, i) {
  const qid = q.id.toLowerCase(), d = dById[q.id], where = `questions[${i}]（${q.id}）.fig`;
  const view = [(d ? d.pick : q.recommended || [q.options[0].key])[0]];
  const type = q.multi ? 'checkbox' : 'radio';
  const opt = o => ({ type, qid, key: o.key, name: o.name, text: o.text, rec: (q.recommended || []).includes(o.key) ? fill('rec', {}) : '',
    desc: o.desc ? esc(o.desc) + '<br>' : '', pros: o.pros, cons: o.cons });
  const choices = q.options.map(o => fill(q.skip ? 'choice-plain' : 'choice', opt(o))).join('\n');
  const badge = q.skip ? fill('badge-skip', { qid }) : d ? fill('badge-done', { qid, pick: d.pick.join(', ') }) : fill('badge-open', { qid });
  const answer = q.skip ? fill('answer-skip', { skip: q.skip, choices }) : fill('answer', { qid, ID: q.id, title: q.title, why: q.why, choices });
  const keys = q.options.map(o => o.key);
  const fig = figBlock(q.fig, where, { view, id: `svg-${qid}`, keys });
  // 層があれば案を見るボタン、コマがあればステップ再生を付ける
  const views = /\sdata-view="/.test(fig) ? fill('views', { ID: q.id, qid, buttons: keys.map(k => fill('view-btn', { key: k, on: String(k === view[0]) })).join('') }) : '';
  const n = fig ? framesOf(fig) : 0, caps = q.steps || [];
  if (fig && caps.length && !n) bad(`${where}`, 'steps があるのに、図に data-frame・data-step が無い');
  if (n > 1 && caps.length && caps.length !== n) bad(`questions[${i}]（${q.id}）.steps`, `コマの説明が ${caps.length} 個、図のコマが ${n} 個`);
  const player = n > 1 ? fill('player', { qid, caps: JSON.stringify(caps), n, cap: caps[0] || '' }) : '';
  const sfx = ` · ${d ? 'decided' : q.skip ? 'skipped' : 'not chosen'}`;
  return fill('question', {
    qid, ID: q.id, impact: q.impact, undo: q.undo, multi: q.multi ? ' · multiple choice' : '', round: q.round, title: q.title, badge,
    background: q.background, issue: q.issue, fig_top: q.fig_top, preview: `Showing option ${keyName(view[0])}${sfx}`, sfx,
    views, fig, player, fig_note: q.fig_note || '',
    details: q.details ? `<details><summary>Background details and grounds</summary><p>${esc(q.details)}</p></details>` : '', answer });
}

/* ---------- 決定の前と後 ---------- */
// 前と後は同じ断片の別の層を指す。同じ断片を2回置くので id に頭を付ける。変えない決定（same）は図1枚
function decision(d, i) {
  const qid = d.id.toLowerCase(), w = `decisions[${i}]（${d.id}）`;
  const one = (k, ref, cap, label) => {
    if (!ref || !isStr(ref.fig)) { bad(`${w}.${k === 'b' ? 'before' : 'after'}`, '{fig, layers} が要る'); return ''; }
    const svg = figBlock(ref.fig, `${w}.${k === 'b' ? 'before' : 'after'}.fig`, { pre: `d${qid}${k}-`, view: ref.layers?.length ? ref.layers : undefined, at: ref.at || 'last', label: `${label}：${cap || ''}` });
    return fill('ba-fig', { k, label, svg, ok: k === 'a' ? ' ok' : '', cap });
  };
  if (!d.same && !d.before) bad(`${w}.before`, '前の図が要る（変えない決定なら same: true）');
  const figs = d.same ? one('a', d.after, d.cap_after, 'No change before and after')
    : one('b', d.before, d.cap_before, 'Before') + one('a', d.after, d.cap_after, 'After');
  return fill('decision', { qid, ID: d.id, line: d.line, pick: d.pick.join(', '), figs, adopted: d.adopted, reason: d.reason, cost: d.cost, rejected: d.rejected,
    more: d.note ? ', note' : '', note: d.note ? `<dt>Note</dt><dd>${esc(d.note)}</dd>` : '' });
}
function decisions() {
  if (!D.length) return fill('decisions', { n: 0, lead: 'No decisions yet. They are recorded after answers in the chat.', rows: '' });
  const rounds = [...new Set(D.map(d => d.round))].sort((a, b) => a - b);
  const rows = rounds.map(r => (rounds.length > 1 ? fill('decision-round', { round: r }) : '') + D.filter(d => d.round === r).map(d => decision(d, D.indexOf(d))).join('\n')).join('\n');
  return fill('decisions', { n: D.length, lead: 'Left is before the decision, right is after. Both are layers of the same diagram, drawn the same way on the same scale.', rows });
}

/* ---------- 組み立て ---------- */
const tokens = rd(join(HF, 'assets/tokens.css'));
// 図は描いた幅（viewBox の幅）より大きく広げない。小さく描いた図を広い枠に置くと、文字が2倍近くまで膨らむため。
// 幅を --vbw に書き、CSS が max-width と最小幅の上限に使う
const capSvg = html => html.replace(/<svg\b([^>]*?)\sviewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+[\d.]+"([^>]*)>/g, (m, a, w, b) => {
  if (/--vbw/.test(m)) return m;
  return /\sstyle="/.test(m) ? m.replace(/\sstyle="/, ` style="--vbw:${w}px;`) : m.replace(/>$/, ` style="--vbw:${w}px">`);
});
const doc = (title, css, body, js) => `<!doctype html>
<html lang="ja" data-direction="${esc(page.direction || 'blueprint')}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<!-- grill-visual の build.mjs が page.json と fig/ から組み立てた。手で直さず、page.json か図の断片を直して組み立て直す -->
<style>
${tokens}
${css}</style>
</head>
<body>
${capSvg(body)}
<script>
${js}</script>
</body>
</html>
`;

function buildIndex() {
  const ended = page.status === 'ended';
  const lim = (n, unit) => (Number.isInteger(n) ? ` (limit ${n}${unit})` : '');
  const head = fill('head', { version: page.version, date: page.date, ended: ended ? ' · ended' : '', title: page.title, lead: page.lead,
    round: page.round, rlimit: lim(page.limits?.r, ''), asked: Q.length, qlimit: lim(page.limits?.q, ''), decided: D.length });
  const intro = (page.intro || []).map((s, i) => section(s, `intro[${i}]`, s.id || `intro${i + 1}`, s.id ? ` id="${esc(s.id)}"` : '')).join('\n');
  const auto = !page.map.figs;
  if (auto) figCache['auto:map'] = mapFig();
  const map = section({ eyebrow: 'MAP', title: 'How the issues connect, and where we are', ...page.map, ...(auto ? { figs: ['auto:map'] } : {}) }, 'map', 'map');
  // 今回答える問いを先に全文で並べ、決まった問い・見送りは全体の備考の後ろへ1件ずつ畳む。どこが回答待ちかを紛れさせないため
  const open = Q.filter(q => !q.skip && !dById[q.id]);
  const closed = [...Q.filter(q => !q.skip && dById[q.id]), ...Q.filter(q => q.skip)];
  const qs = open.map(q => question(q, Q.indexOf(q))).join('\n');
  const done = closed.length ? fill('done-group', { n: closed.length, rows: closed.map(q => fill('done-q', {
    ID: q.id, title: q.title, done: q.skip ? '' : ' done', state: q.skip ? 'Skipped' : `決定（${dById[q.id].pick.join(', ')}）`, card: question(q, Q.indexOf(q)) })).join('\n') }) : '';
  const end = ended ? fill('end', { text: page.end }) : '';
  const notes = fill('notes-all', { first: (open[0] || Q[0] || { id: 'Q01' }).id });
  const body = `<main>\n${head}\n${intro}\n${map}\n${end}\n${qs}\n${notes}\n${done}\n${decisions()}\n</main>\n${rd(join(FRAME, 'dock.html'))}`;
  const css = rd(join(FRAME, 'page.css')) + '\n/* 層とコマ（build.mjs が断片から書く） */\n' + layerCSS();
  return doc(page.title, css, body, rd(join(FRAME, 'page.js')) + rd(join(FRAME, 'figure.js')));
}

/* ---------- まとめ（summary.html） ---------- */
// 章の枠・決定のカード・タスクの章・経緯の図は、page.json と tasks.json からここで作る。モデルが書くのは summary の図の断片だけ
const STPL = {};
rd(join(FRAME, 'summary-parts.html')).split(/^<!-- @([\w-]+) -->\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) STPL[v] = a[i + 1]; });
const sfill = (name, o) => STPL[name].replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, raw, txt) => (raw ? (o[raw] ?? '') : esc(o[txt] ?? ''))).replace(/\n$/, '');
const P = vm.runInNewContext(`${PARTS}\n;({ T, TL, MONO, ST, defs })`, {});
// 経緯の図: ラウンドごとの札を時間の線に並べる。推奨と違う選択は自動で足し、札の色を変える
function historyFig(S) {
  const items = (page.rounds || []).map(r => {
    const ds = D.filter(d => d.round === r.n);
    const diff = ds.filter(d => { const q = qById[d.id]; return q && d.pick.join() !== (q.recommended || []).join(); }).map(d => `${d.id} differs from the recommendation: ${d.pick.join(', ')}`);
    return { name: `Round ${r.n}`, sub: `v${r.version} · ${r.asked.length} asked → ${ds.length} decided`, lines: [...diff, ...(r.notes || [])], c: diff.length ? 'q' : 'ok' };
  });
  const open = Q.filter(q => !q.skip && !dById[q.id]).length;
  if (page.status === 'ended') items.push({ name: 'End', sub: `v${page.version} · open ${open}`, lines: S.end_notes || [], c: 'accent' });
  if (!items.length) return '';
  const n = items.length, gap = 20, w = Math.min(230, Math.floor((960 - (n - 1) * gap) / n)), per = Math.max(6, Math.floor((w - 24) / 12.6));
  const wrap = s => { const out = []; for (let i = 0; i < s.length; i += per) out.push(s.slice(i, i + per)); return out; };
  const lines = items.map(it => it.lines.flatMap(wrap));
  const h = 62 + 40 + Math.max(1, ...lines.map(l => l.length)) * 17.4 + 16;
  let o = `<path d="M40 44H${40 + n * (w + gap) - gap}" style="fill:none;stroke:var(--ink);stroke-width:1.5"/>`;
  items.forEach((it, i) => {
    const x = 40 + i * (w + gap);
    o += `<circle cx="${x + 20}" cy="44" r="7" ${P.ST(it.c, 'surface', 2)}/>` + P.T(x + 36, 38, it.name, 'ink', 14, 700)
      + `<rect x="${x}" y="62" width="${w}" height="${h - 70}" rx="4" ${P.ST(it.c === 'q' ? 'q' : 'line', 'surface', 1.2)}/>`
      + P.T(x + 12, 88, it.sub, 'ink', 13, 700) + P.TL(x + 12, 116, lines[i], 'sub', 12);
  });
  return `<svg viewBox="0 0 1000 ${Math.ceil(h)}" role="img" aria-label="${esc(items.map(it => `${it.name}：${it.sub}`).join('。'))}">${o}</svg>`;
}
function buildSummary() {
  const S = page.summary, W = 'summary';
  need(S, W, ['title', 'lead']);
  if (!S.big?.fig) bad(`${W}.big.fig`, '完成形の図の断片が要る');
  if (!Array.isArray(S.mech) || !S.mech.length) bad(`${W}.mech`, '仕組みの図が1枚以上要る');
  const tk = tasksData?.tasks || [];
  const openQs = Q.filter(q => !q.skip && !dById[q.id]);
  const toc = [['#s1', '1 Finished picture'], ['#s2', '2 Mechanism'], ['#s3', '3 Decisions'], ['#s4', '4 Tasks'], ['#s5', '5 Rejected, assumptions'], ['#s6', '6 History'], ...(openQs.length ? [['#s7', '7 Open']] : []),
    ['index.html', 'Discussion page'], ['discussion.md', 'Record'], ...(tasksData ? [['tasks.json', 'tasks.json']] : [])].map(([h, t]) => `<a href="${h}">${t}</a>`).join('');
  const head = sfill('head', { version: page.version, date: page.date, title: S.title, lead: S.lead, decided: D.length, open: openQs.length,
    tasks: tk.length, props: tk.filter(t => t.proposal).length, rounds: page.round, asked: Q.length,
    progress: tasksData ? sfill('progress-top', {}) : '', toc, changes: (S.changes || []).length ? sfill('changes', { items: S.changes.map(c => `<li>${esc(c)}</li>`).join('') }) : '' });
  const s1 = sfill('s1', { title: S.big?.title || 'After all decisions', lead: S.big?.lead || 'Green chips are decided questions. Press one to jump to its diagram and reason.', fig: S.big?.fig ? figBlock(S.big.fig, `${W}.big.fig`) : '' });
  const panels = (S.mech || []).map((m, i) => {
    const id = `m${i + 1}`, fig = figBlock(m.fig, `${W}.mech[${i}].fig`, { id: `svg-${id}` }), nfr = fig ? framesOf(fig) : 0, caps = m.steps || [];
    if (nfr > 1 && caps.length && caps.length !== nfr) bad(`${W}.mech[${i}].steps`, `コマの説明が ${caps.length} 個、図のコマが ${nfr} 個`);
    const player = nfr > 1 ? fill('player', { qid: id, caps: JSON.stringify(caps), n: nfr, cap: caps[0] || '' }) : '';
    return sfill('panel', { full: m.full ? ' full' : '', title: m.title, box: m.full ? 'wide-fig' : 'fig-box', fig, player });
  }).join('\n');
  const s2 = sfill('s2', { title: S.mech_title || 'Diagrams for reading the decisions', panels });
  // 3 決定: まとまり（group）ごと。前と後は同じ断片の別の層
  // まとまりの並びは summary.groups の順。無いものは決定の順に後ろへ
  const groups = [...new Set([...(S.groups || []).map(g => g.name), ...D.map(d => d.group || 'Decisions')])].filter(g => D.some(d => (d.group || 'Decisions') === g));
  const gsub = Object.fromEntries((S.groups || []).map(g => [g.name, g.sub || '']));
  const card = d => {
    const q = qById[d.id], qid = d.id.toLowerCase(), i = D.indexOf(d);
    const v = (k, ref, cap) => sfill('dfig', { k, on: k === 'a' ? ' on' : '', ok: k === 'a' ? ' ok' : '', label: k === 'a' ? (d.same ? 'No change: ' : 'After: ') : 'Before: ', cap,
      svg: figBlock(ref.fig, `decisions[${i}]（${d.id}）`, { pre: `s${qid}${k}-`, view: ref.layers?.length ? ref.layers : undefined, at: ref.at || 'last', label: `${k === 'a' ? 'After' : 'Before'}: ${cap || ''}` }) });
    const figs = (d.after ? v('a', d.after, d.cap_after) : '') + (!d.same && d.before ? v('b', d.before, d.cap_before) : '');
    const opts = q.options.map(o => sfill('opt', { pick: d.pick.includes(o.key) ? ' class="pick"' : '', key: o.key, text: o.text, res: d.pick.includes(o.key) ? 'chosen' : '—', rec: (q.recommended || []).includes(o.key) ? 'recommended' : '' })).join('');
    return sfill('dcard', { wide: d.wide ? ' wide' : '', qid, ID: d.id, name: q.title, round: d.round, seg: d.same ? '' : sfill('seg', { ID: d.id }), figs, line: d.line,
      adopted: d.adopted, reason: d.reason, cost: d.cost, rejected: d.rejected, note: d.note ? `<dt>Note</dt><dd>${esc(d.note)}</dd>` : '', opts });
  };
  const s3 = sfill('s3', { n: D.length, groups: groups.map(g => sfill('dgroup', { name: g, sub: gsub[g] || '', cards: D.filter(d => (d.group || 'Decisions') === g).map(card).join('\n') })).join('\n') });
  const s4 = tasksData ? sfill('s4', { title: S.tasks_title || 'Work derived from the decisions' }) : sfill('s4-none', {});
  const li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('') || '<li>Not recorded</li>';
  const s5 = sfill('s5', { assume: li(S.assumptions), revisit: li(S.revisit) });
  const s6 = sfill('s6', { title: S.history_title || `${D.length} decided in ${page.round} rounds`, fig: historyFig(S) });
  const more = Object.fromEntries((S.open || []).map(o => [o.id, o]));
  const s7 = openQs.length ? sfill('s7', { boxes: openQs.map(q => sfill('openbox', { state: 'Open', ID: q.id, title: q.title,
    reason: more[q.id]?.reason || 'Awaiting answer', rec: (q.recommended || []).map(k => `${k}: ${q.options.find(o => o.key === k)?.text || ''}`).join(', ') || '—',
    needs: more[q.id]?.needs || '—', tasks: more[q.id]?.tasks || '—' })).join('\n') }) : '';
  const data = tasksData ? `<script type="application/json" id="tasks-data">${JSON.stringify(tasksData).replace(/</g, '\\u003c')}</script>\n` : '';
  const body = `<main>\n${head}\n${s1}\n${s2}\n${s3}\n${s4}\n${s5}\n${s6}\n${s7}\n</main>\n${tasksData ? sfill('livepill', {}) : ''}\n${data}`;
  const css = rd(join(FRAME, 'summary.css')) + '\n/* 層とコマ（build.mjs が断片から書く） */\n' + layerCSS();
  return doc(`${page.title} · summary`, css, body, PARTS + rd(join(FRAME, 'figure.js')) + rd(join(FRAME, 'summary.js')));
}

if (onlyFig) {
  // 問いの ID か、問いでない断片のパス（依存マップ fig/map.svg・まとめの fig/s-big.svg など）
  const q = qById[onlyFig] || (existsSync(join(dir, onlyFig)) ? { id: basename(onlyFig).replace(/\.\w+$/, ''), title: onlyFig, order: '—', fig: onlyFig } : null);
  if (!q) { console.error(`page.json に ${onlyFig} が無く、${join(dir, onlyFig)} も無い`); process.exit(1); }
  const svg = loadFig(q.fig, `${q.id}.fig`);
  if (svg === null || errs.length) { console.error(errs.join('\n')); process.exit(1); }
  const views = /data-layer=/.test(svg) ? [...new Set([...svg.matchAll(/data-layer="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)))] : [''];
  const n = Math.max(1, framesOf(svg));
  let blocks = '';
  // 幅 1000 の図（マップ・区画・まとめ）は、ページと同じく狭い幅で縮めずに横へ送る
  const wide = +(svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/) || [])[1] > 600;
  views.forEach(v => { for (let f = 1; f <= n; f++) { const fig = figBlock(q.fig, q.id, { pre: `c${v}${f}-`, view: v ? [v] : undefined, at: f }); blocks += `<div class="visual" style="margin-top:16px"><div class="visual-top"><span>${esc(q.id)}${v ? ` · 層 ${esc(v)}` : ''}${n > 1 ? ` · コマ ${f}` : ''}</span></div>${wide ? `<div class="wide">${fig}</div>` : fig}</div>`; } });
  const out = join(dir, 'fig', `${q.id.toLowerCase()}.check.html`);
  writeFileSync(out, doc(`${q.id} の図の確かめ`, rd(join(FRAME, 'page.css')) + '\n' + layerCSS(), `<main><h1>${esc(q.id)} ${esc(q.title)}</h1><p class="lead small">注文書：${esc(q.order)}</p>${blocks}</main>`, ''));
  console.log(`${out} を書いた（層 ${views.filter(Boolean).join(', ') || 'なし'} × コマ ${n}）`);
  process.exit(0);
}

const html = buildIndex();
const sum = page.summary ? buildSummary() : null;
if (errs.length) {
  console.error(`page.json・tasks.json か図の断片が崩れている（${errs.length} 件）。直してから組み立て直す:\n` + errs.map(e => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
writeFileSync(join(dir, 'index.html'), html);
const wrote = [`index.html（${Q.length}問・${D.length}決定・${[...html].length.toLocaleString()}字）`];
if (sum) { writeFileSync(join(dir, 'summary.html'), sum); wrote.push(`summary.html（${[...sum].length.toLocaleString()}字）`); }
if (tasksData) { writeTasksJs(); wrote.push(`tasks.js（${tasksData.tasks.filter(t => t.state === 'done').length}/${tasksData.tasks.length} 完了）`); }
console.log(wrote.join(', ') + ' を書いた');
