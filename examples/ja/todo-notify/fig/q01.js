// どこに出すか：同じ電話の画面と、3つの場面で気づけるか
const phone = '<rect x="30" y="24" width="170" height="250" rx="18" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="95" y="33" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const lock = T(115, 92, '17:00', 'ink', 30, 700, 'middle') + T(115, 114, '11月12日 木曜', 'sub', 12, 400, 'middle');
const card = (a, b, c) => '<rect x="42" y="146" width="146" height="62" rx="8" style="fill:var(--paper);stroke:var(--frame)"/>'
  + MONO(52, 164, a, 'mute', 12) + T(52, 184, b, 'ink', 13, 700) + T(52, 200, c, 'sub', 12);
const rowsY = [96, 136, 176];
const base = phone + T(234, 56, '閉じているとき、気づけるか', 'ink', 13, 700)
  + ['アプリを開いたとき', 'ロック中の画面を見たとき', 'メールを開いたとき'].map((s, i) => T(234, rowsY[i], s, 'ink', 12)).join('');
const marks = arr => arr.map((on, i) => tag(436, rowsY[i] - 15, on ? '気づける' : '気づけない', on ? 'ok' : 'mute', 'surface', 12, 70)).join('');
const N = '<g data-layer="N">' + lock + marks([false, false, false]) + T(234, 236, '今は何も知らせない', 'sub', 12) + '</g>';
const A = '<g data-layer="A">'
  + T(46, 70, '今日の ToDo', 'ink', 13, 700)
  + '<rect x="42" y="82" width="146" height="26" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + T(52, 100, '期限が近い 1件', 'accent', 12, 700)
  + lines(46, 132, 130, 6, 18)
  + marks([true, false, false]) + TL(234, 230, ['開くまで何も起きない。', '気づくのは、開いたあと'], 'sub', 12) + '</g>';
const B = '<g data-layer="B">' + lock + card('ToDo · 今', '牛乳を買う', '18:00 まで')
  + marks([true, true, false]) + TL(234, 230, ['画面を見れば気づく。', '最初に許可が要る（Q03）'], 'sub', 12) + '</g>';
const C = '<g data-layer="C">' + lock + card('メール · 7:00', '今日の ToDo 3件', '朝に1通でまとめて')
  + marks([false, false, true]) + TL(234, 230, ['1日1回だけ。', '急ぎの期限に間に合わない'], 'sub', 12) + '</g>';
return '<svg viewBox="0 0 520 290" role="img" aria-label="左は電話の画面、右はアプリを閉じているときに3つの場面で気づけるか。A アプリの中の札は、アプリを開いたときだけ気づける。B 端末の通知は、ロック中の画面に牛乳を買う 18時までの札が出て、開いたときとロック中の画面で気づける。C 朝のメールは、メールを開いたときだけ気づける。今は何も知らせない。">'
  + base + N + A + B + C + '</svg>';
