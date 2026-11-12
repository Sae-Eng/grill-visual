// 場面の図を土台の parts.js の部品で描く例（fig/q05.js として置く。架空の議論「ToDo アプリに通知を付ける」の Q05）。
// 関数の中身として書き、<svg> の文字列を return する。下絵は1回、案で変わる所だけを <g data-layer> にする。部品の一覧は土台の references/04-parts.md
const card = '<rect x="20" y="24" width="480" height="128" rx="12" style="fill:var(--paper);stroke:var(--frame);stroke-width:1.5"/>'
  + MONO(36, 46, 'ToDo · 今', 'mute', 12) + T(36, 72, '牛乳を買う', 'ink', 16, 700) + T(36, 94, '18:00 まで（あと1時間）', 'sub', 12);
const btn = (x, w, s, on) => '<rect x="' + x + '" y="108" width="' + w + '" height="32" rx="6" style="fill:var(--' + (on ? 'accent' : 'surface') + ');stroke:var(--' + (on ? 'accent' : 'ink') + ');stroke-width:1.2"/>' + T(x + w / 2, 129, s, on ? 'on-accent' : 'ink', 13, 700, 'middle');
const steps = (k, list, msg) => '<g data-layer="' + k + '">' + list.map((s, i) => tag(20 + i * 124, 196, s, i === list.length - 1 ? 'ok' : 'ink', 'surface', 12, 112)
  + (i < list.length - 1 ? '<path d="M' + (134 + i * 124) + ' 206 H' + (142 + i * 124) + '" style="stroke:var(--ink);stroke-width:1.5"/>' : '')).join('')
  + T(20, 250, msg, 'ink', 12, 700) + '</g>';
const base = card + T(20, 184, '終えるまでの手数', 'sub', 12);
const A = '<g data-layer="A">' + T(36, 130, '押すとアプリが開く', 'mute', 12) + '</g>' + steps('A', ['札を押す', 'アプリで探す', '印を付ける'], '3手。開いたついでに別の物を見て、忘れる');
const B = '<g data-layer="B">' + btn(250, 100, '完了', true) + btn(360, 128, '1時間後にもう一度', false) + '</g>' + steps('B', ['「完了」を押す'], '1手。アプリを開かずに済む');
const C = '<g data-layer="C">' + '<rect x="250" y="108" width="238" height="32" rx="6" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.2"/>' + T(262, 129, '返信：明日の朝', 'mute', 12) + '</g>'
  + steps('C', ['札を伸ばす', '期限を打つ', '送る'], '3手。期限の言い方を読み違えることがある');
return '<svg viewBox="0 0 520 266" role="img" aria-label="牛乳を買う 18時まで あと1時間 の通知の札。A は押すとアプリが開くだけで、札を押す・アプリで探す・印を付けるの3手。B は完了と1時間後にもう一度のボタンが付き、完了を押す1手。C は返信で期限を変える欄が付き、札を伸ばす・期限を打つ・送るの3手。">'
  + base + A + B + C + '</svg>';
