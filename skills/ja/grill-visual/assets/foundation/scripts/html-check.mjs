#!/usr/bin/env node
// 土台の物差し(references/05-checks.md)。
// 壊れ(文字の重なり・横のはみ出し・小さすぎる文字・色の多すぎる絵)は ✗ で止め、
// 読みやすさの数(本文の大きさ・行間・1行の字数・矢印の札)は ! で知らせる。
// 数の線は下の DEFAULTS。ページや仕事ごとに変えるときは --config <JSON> で上書きする。
// 狭い幅で1行の字数以外を、広い幅で1行の字数を測る。
// 依存を足さないため、Playwright が入れたヘッドレスの Chromium(か Chrome)を CDP で直に動かす。Node 22 以上(WebSocket が要る)。
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = `使い方: node html-check.mjs <HTML のパスか URL> [オプション]
  --narrow <px>   狭い幅(既定 680)
  --wide <px>     広い幅(既定 1280)
  --shots <dir>   狭い幅で、絵(幅 240px 以上の SVG)を1枚ずつ PNG に撮る。採点する AI に渡す
  --prep <js>     測る前にページで動かす JS(例: 全部を並べる切り替えを押す)
  --dark          ダークで測る(既定はライト)
  --config <json> 数の線を上書きする JSON(キーは DEFAULTS と同じ。書いたキーだけ変わる)
  --json          結果を JSON で出す
終了コード: 0 = ✗ なし、1 = ✗ あり、2 = 動かせなかった
Chromium の場所は HTML_CHECK_CHROME で渡せる。無ければ Playwright の置き場と Chrome を探す。`;

// 数の線。本文 15px・行間 1.7・1行 40字・絵は4色までは references/02-look.md と 05-checks.md の既定
const DEFAULTS = {
  minText: 11,            // ページと絵の文字の下限(px)。下回れば ✗
  bodyMin: 14, bodyMax: 15.5, // 本文(main か body の文字)の範囲(px)。外れれば !
  lineHeightBody: 1.7,    // 本文の行間の下限。足りなければ !
  lineHeightOther: 1.5,   // 本文より小さい文の行間の下限
  maxChars: 40,           // 広い幅での1行の字数の上限。超えれば !
  maxColors: 4,           // 絵1枚の色の上限(地・文字・灰・白・黒は数えない)。超えれば ✗
  picMinWidth: 240,       // これより狭い SVG は絵として数えない(印やアイコン)
  arrowPad: 36,           // 矢印の札を探す範囲(px)
};
const args = process.argv.slice(2);
const opt = { narrow: 680, wide: 1280, json: false, shots: null, prep: '', dark: false, config: null };
let target = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--json') opt.json = true;
  else if (a === '--dark') opt.dark = true;
  else if (a === '--narrow') opt.narrow = Number(args[++i]);
  else if (a === '--wide') opt.wide = Number(args[++i]);
  else if (a === '--shots') opt.shots = resolve(args[++i]);
  else if (a === '--prep') opt.prep = args[++i];
  else if (a === '--config') opt.config = resolve(args[++i]);
  else if (a === '-h' || a === '--help') { console.log(USAGE); process.exit(0); }
  else target = a;
}
if (!target) { console.error(USAGE); process.exit(2); }
const url = /^(https?|file):/.test(target) ? target : pathToFileURL(resolve(target)).href;
let cfg = { ...DEFAULTS };
if (opt.config) {
  try {
    const over = JSON.parse(readFileSync(opt.config, 'utf8'));
    for (const k of Object.keys(over)) if (!(k in DEFAULTS)) throw new Error(`知らないキー ${k}`);
    cfg = { ...cfg, ...over };
  } catch (e) { console.error(`--config を読めない: ${e.message}`); process.exit(2); }
}

function findChrome() {
  const env = process.env.HTML_CHECK_CHROME;
  if (env) return { bin: env, shell: /headless.shell/.test(env) };
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright'),
    join(homedir(), '.cache/ms-playwright'), join(homedir(), 'AppData/Local/ms-playwright')].filter(Boolean);
  for (const r of roots) {
    if (!existsSync(r)) continue;
    const dirs = readdirSync(r).filter(d => d.startsWith('chromium_headless_shell-'))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of dirs) for (const sub of readdirSync(join(r, d))) for (const name of ['chrome-headless-shell', 'chrome-headless-shell.exe', 'headless_shell']) {
      const p = join(r, d, sub, name);
      if (existsSync(p)) return { bin: p, shell: true };
    }
  }
  for (const p of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'])
    if (existsSync(p)) return { bin: p, shell: false };
  return null;
}

// ページの中で動かす測り方。mode は 'narrow' か 'wide'、cfg は数の線
function measure(mode, cfg) {
  const out = { mode, width: innerWidth, checks: [], pics: [] };
  const add = (level, rule, msg, ex) => out.checks.push({ level, rule, msg, ex: ex || [] });
  const vis = e => { if (!e.getClientRects().length) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0; };
  const skip = e => !!e.closest('[data-check-skip]');
  const short = s => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
  const where = e => { const p = e.closest('[id]'); return p ? '#' + p.id : e.tagName.toLowerCase(); };
  const r1 = v => Math.round(v * 10) / 10;
  document.querySelectorAll('details').forEach(d => { d.open = true; });

  if (mode === 'wide') {
    const blocks = [...document.querySelectorAll('p,li,dd,td,blockquote,figcaption,.caption')]
      .filter(e => vis(e) && !skip(e) && !e.closest('svg,pre'));
    const bad = [];
    for (const e of blocks) {
      const s = getComputedStyle(e), fs = parseFloat(s.fontSize);
      const w = e.getBoundingClientRect().width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const len = e.innerText.replace(/\s/g, '').length;
      const line = Math.min(len, w / fs);
      if (line > cfg.maxChars + 0.5) bad.push({ e, line });
    }
    bad.sort((a, b) => b.line - a.line);
    if (bad.length) add('warn', '1行の字数', `${cfg.maxChars}字を超える段落が ${bad.length} か所(最大 約${Math.round(bad[0].line)}字)`, bad.slice(0, 4).map(o => `約${Math.round(o.line)}字「${short(o.e.innerText)}」${where(o.e)}`));
    else add('ok', '1行の字数', `すべて ${cfg.maxChars}字以内(${blocks.length} か所)`);
    return out;
  }

  // ページの文字
  const textEls = [], seen = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    if (!n.textContent.trim()) continue;
    const e = n.parentElement;
    if (!e || seen.has(e)) continue;
    seen.add(e);
    if (e.closest('svg,script,style,noscript,template') || skip(e) || !vis(e)) continue;
    textEls.push(e);
  }
  const paras = [...document.querySelectorAll('p,li,dd')].filter(e => vis(e) && !skip(e) && !e.closest('svg') && e.textContent.trim().length >= 20);
  // 本文 = ページの基本の文字(main か body の大きさ)。既定は 15px(14px も可)。16px 以上は主張が強い。知らせるだけ
  const body = r1(parseFloat(getComputedStyle(document.querySelector('main') || document.body).fontSize));
  if (body < cfg.bodyMin - 0.05 || body > cfg.bodyMax + 0.05) add('warn', '本文の文字', `本文(main か body の文字)が ${body}px。${cfg.bodyMin}〜${cfg.bodyMax}px にする`);
  else add('ok', '本文の文字', `本文 ${body}px`);

  // 札・注記も含め、下限より小さい文字は読めないので止める
  const small = textEls.map(e => ({ e, fs: parseFloat(getComputedStyle(e).fontSize) })).filter(o => o.fs < cfg.minText - 0.05);
  if (small.length) add('x', 'ページの文字', `${cfg.minText}px 未満が ${small.length} / ${textEls.length} か所(最小 ${r1(Math.min(...small.map(o => o.fs)))}px)`,
    small.sort((a, b) => a.fs - b.fs).slice(0, 5).map(o => `${r1(o.fs)}px「${short(o.e.textContent)}」${where(o.e)}`));
  else add('ok', 'ページの文字', `すべて ${cfg.minText}px 以上(${textEls.length} か所)`);

  const lhBad = paras.filter(e => {
    if (e.innerText.replace(/\s/g, '').length <= cfg.maxChars) return false;
    const s = getComputedStyle(e), fs = parseFloat(s.fontSize);
    const lh = s.lineHeight === 'normal' ? fs * 1.2 : parseFloat(s.lineHeight);
    return lh / fs < (fs >= body - 0.5 ? cfg.lineHeightBody : cfg.lineHeightOther) - 0.01;
  });
  const lhRule = `本文 ${cfg.lineHeightBody}・ほか ${cfg.lineHeightOther} 以上`;
  if (lhBad.length) add('warn', '行間', `足りない段落が ${lhBad.length} か所(${lhRule})`, lhBad.slice(0, 4).map(e => {
    const s = getComputedStyle(e); return `${r1(parseFloat(s.lineHeight) / parseFloat(s.fontSize))}「${short(e.textContent)}」${where(e)}`; }));
  else add('ok', '行間', lhRule);

  // 絵
  const svgs = [...document.querySelectorAll('svg')].filter(s => vis(s) && !skip(s));
  const st = [];
  for (const svg of svgs) for (const t of svg.querySelectorAll('text')) {
    if (!vis(t) || skip(t) || !t.textContent.trim()) continue;
    const m = t.getScreenCTM();
    if (!m) continue;
    st.push({ t, svg, px: parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b), r: t.getBoundingClientRect() });
  }
  // 絵は縮めずに横へ送る。表示した大きさが下限より小さければ止める
  const sb = st.filter(o => o.px < cfg.minText - 0.05);
  if (sb.length) add('x', '絵の文字', `${cfg.minText}px 未満が ${sb.length} / ${st.length} か所(最小 ${r1(Math.min(...sb.map(o => o.px)))}px)`,
    sb.sort((a, b) => a.px - b.px).slice(0, 5).map(o => `${r1(o.px)}px「${short(o.t.textContent)}」${where(o.svg)}`));
  else add('ok', '絵の文字', st.length ? `すべて ${cfg.minText}px 以上(最小 ${r1(Math.min(...st.map(o => o.px)))}px・${st.length} か所)` : '絵の文字なし');

  const ov = [], outside = [];
  for (const svg of svgs) {
    const sr = svg.getBoundingClientRect();
    const ts = st.filter(o => o.svg === svg);
    for (let i = 0; i < ts.length; i++) {
      const a = ts[i].r;
      if (a.left < sr.left - 1 || a.right > sr.right + 1 || a.top < sr.top - 1 || a.bottom > sr.bottom + 1) outside.push(ts[i]);
      for (let j = i + 1; j < ts.length; j++) {
        const b = ts[j].r;
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1)
          ov.push(`「${short(ts[i].t.textContent)}」と「${short(ts[j].t.textContent)}」${where(svg)}`);
      }
    }
  }
  if (ov.length) add('x', '絵の文字の重なり', `重なる文字が ${ov.length} 組`, ov.slice(0, 5));
  else add('ok', '絵の文字の重なり', '重なりなし');

  const de = document.documentElement, over = de.scrollWidth - de.clientWidth;
  const wideEls = over > 1 ? [...document.body.querySelectorAll('*')].filter(e => vis(e) && e.getBoundingClientRect().right > de.clientWidth + 1 && !e.closest('svg')).slice(0, 4) : [];
  if (over > 1 || outside.length) add('x', '横のはみ出し', [over > 1 ? `ページが ${over}px はみ出す` : '', outside.length ? `絵の外へ出る文字が ${outside.length} か所` : ''].filter(Boolean).join('。'),
    [...wideEls.map(e => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} ${where(e)}`), ...outside.slice(0, 4).map(o => `「${short(o.t.textContent)}」${where(o.svg)}`)]);
  else add('ok', '横のはみ出し', 'はみ出しなし');

  // 色(地と文字の色・灰色・白・黒は数えない)
  const hsl = c => {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (a === 0) return null;
    const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) h = mx === R ? 60 * (((G - B) / d) % 6) : mx === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
    return { h: (h + 360) % 360, s, l, hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('') };
  };
  // 地の色 = ページの地と明るさが近い色(ライトでは淡い色、ダークでは暗い色)
  const bgL = (hsl(getComputedStyle(document.body).backgroundColor) || { l: 1 }).l;
  const colorBad = [], arrows = [];
  for (const svg of svgs) {
    const sr = svg.getBoundingClientRect();
    if (sr.width < cfg.picMinWidth) continue;
    const name = svg.id || short(svg.getAttribute('aria-label') || '') || where(svg);
    out.pics.push({ name, label: svg.getAttribute('aria-label') || '', x: sr.left + scrollX, y: sr.top + scrollY, w: sr.width, h: sr.height });
    const cs = [];
    for (const e of svg.querySelectorAll('*')) {
      if (/^(text|tspan|textPath|marker|defs|g|a|svg|title|desc)$/.test(e.tagName) || e.closest('defs,text') || !vis(e)) continue;
      const s = getComputedStyle(e);
      for (const c of [s.fill, s.stroke]) { const v = hsl(c); if (v && v.s >= 0.2 && v.l > 0.08 && v.l < 0.97 && Math.abs(v.l - bgL) >= 0.2) cs.push(v); }
    }
    const groups = [];
    for (const c of cs) if (!groups.some(g => Math.min(Math.abs(g.h - c.h), 360 - Math.abs(g.h - c.h)) <= 8 && Math.abs(g.l - c.l) < 0.08)) groups.push(c);
    // 強調1色と状態の色で足りるように、上限を置く
    if (groups.length > cfg.maxColors) colorBad.push(`${name}: ${groups.length}色(${groups.map(g => g.hex).join(' ')})`);
    // 矢印の札(線と矢印には意味の札を付ける)
    for (const p of svg.querySelectorAll('[marker-end],[marker-start]')) {
      if (!vis(p) || skip(p)) continue;
      const r = p.getBoundingClientRect(), pad = cfg.arrowPad;
      const near = st.some(o => o.svg === svg && o.r.right > r.left - pad && o.r.left < r.right + pad && o.r.bottom > r.top - pad && o.r.top < r.bottom + pad);
      if (!near) arrows.push(`${name}: (${Math.round(r.left - sr.left)}, ${Math.round(r.top - sr.top)}) の矢印`);
    }
  }
  if (colorBad.length) add('x', '絵の色', `${cfg.maxColors}色を超える絵が ${colorBad.length} 枚`, colorBad.slice(0, 4));
  else add('ok', '絵の色', `すべて ${cfg.maxColors}色以内(${out.pics.length} 枚)`);
  if (arrows.length) add('warn', '矢印の札', `近くに札の無い矢印が ${arrows.length} 本`, arrows.slice(0, 4));
  else add('ok', '矢印の札', '札の無い矢印なし');
  return out;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = findChrome();
if (!chrome) { console.error('Chromium が見つからない。`npx playwright install chromium-headless-shell` を1回流すか、HTML_CHECK_CHROME に実行ファイルを渡す'); process.exit(2); }
const udd = mkdtempSync(join(tmpdir(), 'html-check-'));
const flags = ['--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${udd}`];
if (!chrome.shell) flags.unshift('--headless=new');
const proc = spawn(chrome.bin, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
const finish = code => { try { ws?.close(); } catch {} proc.kill(); try { rmSync(udd, { recursive: true, force: true }); } catch {} process.exit(code); };

try {
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chromium が起動しない')), 20000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    proc.on('exit', c => rej(new Error(`Chromium が終わった(${c})`)));
  });
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP につながらない')); });
  let seq = 0;
  const pend = new Map(), listeners = new Set();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else listeners.forEach(f => f(m));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++seq; pend.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const waitEvent = (method, sessionId, ms = 30000) => new Promise((res, rej) => {
    const f = m => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(t); listeners.delete(f); res(m.params); } };
    const t = setTimeout(() => { listeners.delete(f); rej(new Error(`${method} が来ない`)); }, ms);
    listeners.add(f);
  });
  const evaluate = async (sessionId, expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error('ページの JS で失敗: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const openAt = async width => {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: opt.dark ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    const load = waitEvent('Page.loadEventFired', sessionId);
    await send('Page.navigate', { url }, sessionId);
    await load;
    await sleep(800);
    if (opt.prep) { await evaluate(sessionId, opt.prep); await sleep(500); }
    return sessionId;
  };

  const narrowS = await openAt(opt.narrow);
  const narrow = await evaluate(narrowS, `(${measure})('narrow', ${JSON.stringify(cfg)})`);
  const shots = [];
  if (opt.shots && narrow.pics.length) {
    mkdirSync(opt.shots, { recursive: true });
    // 横送りの枠の中の絵も、切らずに全部を撮る。枠の外へ出た所も枠と同じ地にし、横送りの影は外す
    await evaluate(narrowS, `document.querySelectorAll('svg').forEach(s=>{let bg='';for(let e=s.parentElement;e&&e!==document.documentElement;e=e.parentElement){const c=getComputedStyle(e);if(c.overflowX!=='visible')e.style.overflowX='visible';e.style.boxShadow='none';if(!bg&&c.backgroundColor!=='rgba(0, 0, 0, 0)'&&c.backgroundColor!=='transparent')bg=c.backgroundColor;}if(bg&&!s.style.background)s.style.background=bg;})`);
    for (const [i, p] of narrow.pics.entries()) {
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: p.x, y: p.y, width: p.w, height: p.h, scale: 1 } }, narrowS);
      const file = join(opt.shots, `${String(i + 1).padStart(2, '0')}_${p.name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 24)}.png`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      shots.push(file);
    }
  }
  const wideS = await openAt(opt.wide);
  const wide = await evaluate(wideS, `(${measure})('wide', ${JSON.stringify(cfg)})`);
  const all = [...narrow.checks, ...wide.checks];
  const x = all.filter(c => c.level === 'x').length, warn = all.filter(c => c.level === 'warn').length;
  const result = { target, config: cfg, narrow, wide, shots, x, warn, result: x ? '作り直し' : '合格' };
  if (opt.json) console.log(JSON.stringify(result, null, 2));
  else {
    const mark = { ok: '✓', x: '✗', warn: '!' };
    const lines = [`html-check  ${target}`];
    for (const [lab, part] of [[`狭い幅 ${opt.narrow}px`, narrow], [`広い幅 ${opt.wide}px`, wide]]) {
      lines.push(lab);
      for (const c of part.checks) { lines.push(`  ${mark[c.level]} ${c.rule}: ${c.msg}`); for (const e of c.ex) lines.push(`      ${e}`); }
    }
    if (shots.length) lines.push(`撮った絵: ${shots.length} 枚(${opt.shots})`);
    lines.push(`結果: ✗ ${x} 件 · ! ${warn} 件 → ${result.result}`);
    console.log(lines.join('\n'));
  }
  finish(x ? 1 : 0);
} catch (e) {
  console.error('html-check が動かなかった: ' + e.message);
  finish(2);
}
