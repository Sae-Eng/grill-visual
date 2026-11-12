#!/usr/bin/env node
// tasks.json を書く唯一の入口。サブエージェントが並べて書いても壊れないよう、ロックを取って
// 読み・直し・書き、そのまま build.mjs --tasks で tasks.js を書き直す（開いたままのまとめが数秒で描き直す）。
//
//   node task.mjs <議論のフォルダ> T01 doing [--by 担当]     取る（依存が done でないと断る）。担当は run_by に入る
//   node task.mjs <議論のフォルダ> T01 step                  手順を1つ済みにする
//   node task.mjs <議論のフォルダ> T01 done --proof パス [--proof パス] --checked "確かめた結果"
//   node task.mjs <議論のフォルダ> T01 blocked --note "理由"
//   node task.mjs <議論のフォルダ> T01 todo                  戻す
//   node task.mjs <議論のフォルダ> T01 dropped --note "理由"  やめる（持ち主が決めたときだけ。進み具合の分母から外れる）
//   どの操作にも --note "注" を付けられる（注を書き換える）
//   node task.mjs <議論のフォルダ> patch 差分.json            tasks を id で足す・上書きし、ほかの項目は置き換える
import { readFileSync, writeFileSync, renameSync, mkdirSync, rmdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const D = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(process.argv[2] || '.');
const F = join(DIR, 'tasks.json'), LOCK = F + '.lock';
class Stop extends Error {}
const die = m => { throw new Stop(m); };
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
let got = false;

function main() {
  const [a0, a1, ...rest] = process.argv.slice(3);
  if (!a0 || !a1) die('使い方は先頭のコメントを見る');
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    const k = rest[i]?.replace(/^--/, ''), v = rest[i + 1];
    if (!k || v === undefined) die(`値の無い引数：${rest[i]}`);
    k === 'proof' ? (flags.proof ||= []).push(v) : (flags[k] = v);
  }
  // ロック：mkdir は1人しか成功しない。30秒より古いロックは落ちた書き手の残りとして外す
  for (let i = 0; i < 200 && !got; i++) {
    try { mkdirSync(LOCK); got = true; } catch {
      try { if (Date.now() - statSync(LOCK).mtimeMs > 30000) rmdirSync(LOCK); } catch {}
      sleep(50);
    }
  }
  if (!got) die('ロックを取れない（10秒）。tasks.json.lock が残っていないか見る');

  const d = JSON.parse(readFileSync(F, 'utf8'));
  const by = Object.fromEntries(d.tasks.map(t => [t.id, t]));
  let msg;
  if (a0 === 'patch') {
    const p = JSON.parse(readFileSync(a1, 'utf8'));
    for (const [k, v] of Object.entries(p)) if (k !== 'tasks') d[k] = v;
    for (const t of p.tasks || []) by[t.id] ? Object.assign(by[t.id], t) : d.tasks.push(by[t.id] = t);
    msg = `patch：${(p.tasks || []).map(t => t.id).join('・') || '（tasks なし）'}`;
  } else {
    const t = by[a0] || die(`${a0} が無い`);
    const n = t.steps.length;
    if (a1 === 'doing') {
      const wait = t.depends_on.filter(x => by[x]?.state !== 'done');
      if (wait.length) die(`${a0} の依存が終わっていない：${wait.join('・')}`);
      t.state = 'doing'; if (flags.by) t.run_by = flags.by;
    } else if (a1 === 'step') {
      if (t.state !== 'doing') die(`${a0} は作業中でない（${t.state}）。先に doing にする`);
      t.steps_done = Math.min((t.steps_done || 0) + 1, n);
    } else if (a1 === 'done') {
      t.state = 'done'; t.steps_done = n;
      for (const p of flags.proof || []) if (!t.proof.includes(p)) t.proof.push(p);
      if (flags.checked) t.checked = flags.checked;
    } else if (a1 === 'blocked') {
      if (!flags.note) die('blocked には --note "理由" が要る');
      t.state = 'blocked'; t.note = flags.note;
    } else if (a1 === 'dropped') {
      if (!flags.note) die('dropped には --note "理由" が要る');
      t.state = 'dropped'; delete t.run_by;
    } else if (a1 === 'todo') {
      t.state = 'todo'; t.steps_done = 0; delete t.run_by;
    } else die(`知らない操作：${a1}`);
    if (flags.note) t.note = flags.note;
    msg =`${a0}：${d.states[t.state]}（手順 ${t.state === 'done' ? n : t.steps_done || 0}/${n}）`;
  }
  // 崩れたまま書かない
  for (const t of d.tasks) {
    if (!d.states[t.state]) die(`${t.id} の state「${t.state}」は states に無い`);
    for (const x of t.depends_on) if (!by[x]) die(`${t.id} の depends_on の ${x} が無い`);
  }
  writeFileSync(F + '.tmp', JSON.stringify(d, null, 2) + '\n');
  renameSync(F + '.tmp', F);
  const b = spawnSync(process.execPath, [join(D, 'build.mjs'), DIR, '--tasks'], { encoding: 'utf8' });
  if (b.status !== 0) die('tasks.json は書いたが、tasks.js の組み立てに失敗：' + (b.stderr || b.stdout).trim());
  const live = d.tasks.filter(t => t.state !== 'dropped');
  const all = live.reduce((s, t) => s + t.steps.length, 0);
  const did = live.reduce((s, t) => s + (t.state === 'done' ? t.steps.length : Math.min(t.steps_done || 0, t.steps.length)), 0);
  console.log(`${msg} · 全体 ${Math.round(did / all * 100)}%（${did}/${all}）`);
}

try { main(); } catch (e) {
  console.error('task.mjs: ' + (e instanceof Stop ? e.message : e.stack));
  process.exitCode = 1;
} finally { if (got) rmdirSync(LOCK); }
