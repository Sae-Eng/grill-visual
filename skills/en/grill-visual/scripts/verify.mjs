#!/usr/bin/env node
// grill-visual の確かめ。組み立てたページを1回の実行で確かめ、10行以内で返す。
// 1. 物差し html-check を、案ごとの層・コマ（window.GV.pass）とダークで並べて回す
// 2. 回答欄を1つずつ押し、#answer-text に「Q01: A（名前）」・保留・備考が出るか、clipboard API の無いページでもコピーが1回で済むかを読む
// 3. PC の1画面（1280×900）のスクショを1枚撮る
// ✗ があれば終了コード1。人に渡すときは、別に内蔵ブラウザで1回開く（SKILL.md）。
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const USAGE = `使い方: node verify.mjs <index.html か summary.html> [--shot <png>]
  --shot <png>  スクショの置き場（既定は一時フォルダ）
終了コード: 0 = ✗ なし、1 = ✗ あり、2 = 動かせなかった`;
const args = process.argv.slice(2);
let target = null, shot = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--shot') shot = resolve(args[++i]);
  else if (args[i] === '-h' || args[i] === '--help') { console.log(USAGE); process.exit(0); }
  else target = resolve(args[i]);
}
if (!target || !existsSync(target)) { console.error(USAGE); process.exit(2); }
const url = pathToFileURL(target).href;
const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// 公開版は土台の写しを中（assets/foundation）に持つ。無ければ隣の html-foundation スキルを使う
const HF = [process.env.HTML_FOUNDATION, join(SKILL, 'assets/foundation'), join(SKILL, '../html-foundation')]
  .filter(Boolean).find(p => existsSync(join(p, 'scripts/html-check.mjs')));
if (!HF) { console.error('土台（assets/foundation か html-foundation）が見つからない。HTML_FOUNDATION で場所を渡す'); process.exit(2); }
shot ||= join(tmpdir(), 'grill-visual-verify', `${basename(dirname(target))}-${basename(target, '.html')}.png`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// html-check を子のプロセスで1回流し、JSON を受ける
const htmlCheck = extra => new Promise(res => {
  const p = spawn(process.execPath, [join(HF, 'scripts/html-check.mjs'), target, '--json', ...extra], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { err += d; });
  p.on('close', code => { try { res({ code, r: JSON.parse(out) }); } catch { res({ code: 2, err: (err || out).trim().split('\n').pop() }); } });
});

// ページの中で回答欄を押して読む。押した選択はこのブラウザの中だけで、渡すページには残らない
async function answerTest() {
  const $ = id => document.getElementById(id), txt = () => ($('answer-text')?.textContent || '');
  const fire = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true }));
  const fs = [...document.querySelectorAll('fieldset[data-q]')];
  if (!$('answer-text')) return { n: 0, bad: [] };
  const bad = [];
  for (const f of fs) {
    const k = f.dataset.q, K = k.toUpperCase(), st = $('st-' + k), decided = st?.dataset.decided;
    for (const i of f.querySelectorAll('input')) {
      i.click();
      const want = `${K}: ${i.value}（${i.dataset.label}）`;
      if (!txt().split('\n').some(l => l.startsWith(K + ': ') && l.includes(`${i.value} (${i.dataset.label})`))) bad.push(`${K} ${i.value}: 「${want}」が出ない`);
      if (i.type === 'checkbox') i.click();
    }
    if (decided && !/^(Decided|Skipped)/.test(st.textContent)) bad.push(`${K}: 決定の札が「${st.textContent}」に変わった`);
    const h = f.querySelector('[data-hold]');
    if (!h) bad.push(`${K}: 保留のボタンが無い`);
    else { h.click(); if (!txt().split('\n').includes(`${K}: Hold`)) bad.push(`${K}: 保留が出ない`); h.click(); }
    const ta = f.querySelector(`[data-note="${k}"]`);
    if (!ta) bad.push(`${K}: 備考欄が無い`);
    else { ta.value = '確かめ'; fire(ta, 'input'); if (!txt().includes('  Note: 確かめ')) bad.push(`${K}: 備考が出ない`); ta.value = ''; fire(ta, 'input'); }
  }
  const all = $('n-all');
  if (all) { all.value = '全体の確かめ'; fire(all, 'input'); if (!txt().includes('Overall: 全体の確かめ')) bad.push('全体の備考が出ない'); }
  else bad.push('全体の備考が無い');
  $('copy')?.click();
  await new Promise(r => setTimeout(r, 300));
  if (!$('copy-status')?.textContent.trim()) bad.push('コピーを押しても何も出ない');
  return { n: fs.length, bad };
}

// Chromium を CDP で直に動かす（html-check と同じ探し方。依存を足さないため）
function findChrome() {
  const env = process.env.HTML_CHECK_CHROME;
  if (env) return { bin: env, shell: /headless.shell/.test(env) };
  for (const r of [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')].filter(Boolean)) {
    if (!existsSync(r)) continue;
    for (const d of readdirSync(r).filter(d => d.startsWith('chromium_headless_shell-')).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])))
      for (const sub of readdirSync(join(r, d))) for (const n of ['chrome-headless-shell', 'headless_shell']) if (existsSync(join(r, d, sub, n))) return { bin: join(r, d, sub, n), shell: true };
  }
  for (const p of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']) if (existsSync(p)) return { bin: p, shell: false };
  return null;
}
async function browserPart() {
  const chrome = findChrome();
  if (!chrome) throw new Error('Chromium が無い。npx playwright install chromium-headless-shell');
  const udd = mkdtempSync(join(tmpdir(), 'gv-verify-'));
  const flags = ['--remote-debugging-port=0', `--user-data-dir=${udd}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--allow-file-access-from-files'];
  if (!chrome.shell) flags.unshift('--headless=new');
  const proc = spawn(chrome.bin, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let ws;
  try {
    const wsUrl = await new Promise((res, rej) => {
      let buf = ''; const t = setTimeout(() => rej(new Error('Chromium が起動しない')), 20000);
      proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    });
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP につながらない')); });
    let seq = 0; const pend = new Map(), ls = new Set();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else ls.forEach(f => f(m)); };
    const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
    const ev = async (s, expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, s); if (r.exceptionDetails) throw new Error('ページの JS で失敗: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, s);
    const jsErr = [];
    ls.add(m => { if (m.method === 'Runtime.exceptionThrown' && m.sessionId === s) jsErr.push(m.params.exceptionDetails.exception?.description?.split('\n')[0] || m.params.exceptionDetails.text); });
    await send('Runtime.enable', {}, s);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, s);
    const load = new Promise(res => { const f = m => { if (m.method === 'Page.loadEventFired' && m.sessionId === s) { ls.delete(f); res(); } }; ls.add(f); });
    await send('Page.navigate', { url }, s); await load; await sleep(600);
    const passes = await ev(s, `window.GV?.passes?.() || 1`);
    const { data } = await send('Page.captureScreenshot', { format: 'png' }, s);
    mkdirSync(dirname(shot), { recursive: true }); writeFileSync(shot, Buffer.from(data, 'base64'));
    const ans = await ev(s, `(${answerTest})()`);
    // Claude の内蔵ブラウザはローカルのページを data: の写しで開き、clipboard API が無い。それを真似て消し、
    // 本物のクリック（CDP の入力）で1回押して「コピーしました」が出るかを見る。押した1回で終わる約束を守るため
    const at = await ev(s, `(()=>{const b=document.getElementById('copy');if(!b)return null;Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});
      document.getElementById('copy-status').textContent='';const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    if (at) {
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 }, s);
      await sleep(200);
      const st = await ev(s, `document.getElementById('copy-status').textContent`);
      if (!st.startsWith('Copied')) ans.bad.push(`clipboard API の無いページで1回押してもコピーにならない（${st || '表示なし'}）`);
    }
    if (jsErr.length) ans.bad.unshift(`ページの JS のエラー: ${jsErr[0]}`);
    // 図を描いた幅より大きく広げると文字が膨らむ（小さく描いた図を横長の枠に置いたとき 2 倍を超えた）。1.05 倍までを許す
    const big = await ev(s, `(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);
      return [...document.querySelectorAll('svg[viewBox]')].map(v=>{const w=v.viewBox.baseVal.width,r=v.getBoundingClientRect().width;
        return {k:r/w,n:v.getAttribute('aria-label')||v.id||'figure'};}).filter(o=>o.k>1.05).map(o=>o.n.slice(0,30)+' ('+o.k.toFixed(2)+'x)');})()`);
    return { passes, ans, big };
  } finally { try { ws?.close(); } catch {} proc.kill(); try { rmSync(udd, { recursive: true, force: true }); } catch {} }
}

// Chromium が無い環境では止めない。見た目を確かめていないことだけ伝えて、組み立てた物を渡せるようにする
if (!findChrome()) {
  console.log(`verify  ${basename(dirname(target))}/${basename(target)}\n見た目は確かめていない（Chromium が見つからない。入れるなら npx playwright install chromium-headless-shell）\n結果: 未確認 → ページは開ける。崩れが無いかは開いて目で見る`);
  process.exit(0);
}

try {
  const b = await browserPart();
  const runs = Array.from({ length: b.passes }, (_, i) => ({ label: `案${i + 1}`, extra: b.passes > 1 ? ['--prep', `GV.pass(${i})`] : [] }));
  runs.push({ label: 'ダーク', extra: ['--dark', ...(b.passes > 1 ? ['--prep', 'GV.pass(0)'] : [])] });
  const res = await Promise.all(runs.map(r => htmlCheck(r.extra)));
  const lines = [`verify  ${basename(dirname(target))}/${basename(target)}`];
  let x = 0, warn = 0;
  const xm = new Map(); // 同じ ✗ が案ごとに出たら1行にまとめる
  const addX = (label, msg) => { x++; xm.set(msg, [...(xm.get(msg) || []), label]); };
  res.forEach((o, i) => {
    if (o.code === 2) { addX(runs[i].label, `html-check が動かなかった（${o.err}）`); return; }
    const all = [...o.r.narrow.checks, ...o.r.wide.checks];
    all.filter(c => c.level === 'x').forEach(c => addX(runs[i].label, `✗ ${c.rule} ${c.msg}${c.ex[0] ? ' — ' + c.ex[0] : ''}`));
    warn = Math.max(warn, all.filter(c => c.level === 'warn').length);
  });
  const xs = [...xm].map(([m, ls]) => `${ls.join(', ')}: ${m}`);
  lines.push(`物差し  ${runs.map(r => r.label).join(', ')} を回した · ✗ ${x} · ! ${warn}（! は html-check で中身を見る）`);
  xs.slice(0, 4).forEach(l => lines.push('  ' + l));
  if (xs.length > 4) lines.push(`  ほか ${xs.length - 4} 件`);
  if (b.ans.n || b.ans.bad.length) lines.push(`回答欄  ${b.ans.n}問 · ${b.ans.bad.length ? '✗ ' + b.ans.bad.slice(0, 2).join(' / ') + (b.ans.bad.length > 2 ? ` ほか${b.ans.bad.length - 2}件` : '') : '✓ 選択・保留・備考・全体の備考・1回でコピー'}`);
  x += b.ans.bad.length;
  if (b.big.length) { lines.push(`Figure size ✗ ${b.big.length} drawn larger than their own width — ${b.big[0]}`); x += b.big.length; }
  lines.push(`スクショ ${shot}`);
  lines.push(`結果: ✗ ${x} → ${x ? '直してから組み立て直す' : '渡してよい（内蔵ブラウザで1回開く）'}`);
  console.log(lines.slice(0, 10).join('\n'));
  process.exit(x ? 1 : 0);
} catch (e) {
  console.error('verify が動かなかった: ' + e.message);
  process.exit(2);
}
