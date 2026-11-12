// 今のアプリ：期限を書いても、開かないと気づかない
const phone = (x, y, w, h) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="' + (x + w / 2 - 20) + '" y="' + (y + 9) + '" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const box = (x, y) => '<rect x="' + x + '" y="' + (y - 11) + '" width="12" height="12" rx="2" style="fill:none;stroke:var(--ink);stroke-width:1.3"/>';
const rows = [['牛乳を買う', '今日 18:00'], ['請求書を払う', '今日 23:00'], ['歯医者を予約', '金曜 12:00']];
const left = region(20, 20, 300, 264, 'いまのアプリ')
  + phone(80, 44, 180, 228)
  + T(98, 84, '今日の ToDo', 'ink', 13, 700)
  + rows.map(([t, d], i) => { const y = 120 + i * 46; return box(98, y) + T(118, y, t, 'ink', 13) + MONO(118, y + 17, d, 'mute', 12); }).join('')
  + T(170, 262, '期限は書ける。知らせは無い', 'sub', 12, 400, 'middle');
const X = h => 370 + (h - 9) * 20;
const mid = region(340, 20, 300, 264, '牛乳の一日')
  + T(360, 60, '期限は 18:00', 'ink', 13, 700)
  + '<path d="M' + X(9) + ' 200 H' + X(21) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [9, 12, 15, 18, 21].map(h => '<path d="M' + X(h) + ' 195 V205" style="stroke:var(--ink);stroke-width:1.5"/>' + MONO(X(h), 224, h + '時', 'mute', 12, 'middle')).join('')
  + '<path d="M' + X(18) + ' 195 V120" style="stroke:var(--accent);stroke-width:1.5"/>' + tag(X(18) - 18, 98, '期限', 'accent', 'accent-soft')
  + T(X(13.5), 186, 'この間、何も知らせない', 'sub', 12, 400, 'middle')
  + man(X(21), 136, 0.9)
  + T(X(21) + 4, 258, '21時に開いて、過ぎたと気づく', 'ink', 12, 700, 'end');
const bell = (x, y) => '<path d="M' + (x - 14) + ' ' + (y + 10) + 'Q' + (x - 14) + ' ' + (y - 16) + ' ' + x + ' ' + (y - 18) + 'Q' + (x + 14) + ' ' + (y - 16) + ' ' + (x + 14) + ' ' + (y + 10) + 'Z" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>'
  + '<path d="M' + (x - 18) + ' ' + (y + 10) + 'H' + (x + 18) + '" style="stroke:var(--accent);stroke-width:1.5"/><circle cx="' + x + '" cy="' + (y + 15) + '" r="3" style="fill:var(--accent)"/>';
const right = region(660, 20, 320, 264, '決めたいこと', 'ink')
  + bell(720, 96) + T(752, 92, '通知を付ける', 'ink', 15, 700) + T(752, 112, 'ただし、うるさくしない', 'sub', 12)
  + TL(684, 168, ['どこに出すか（Q01）', 'いつ出すか（Q02）', '許可をいつ聞くか（Q03）', 'どれだけ出すか（Q04）'], 'ink', 13);
return '<svg viewBox="0 0 1000 300" role="img" aria-label="今のアプリ。左は ToDo の一覧の画面で、牛乳を買う 今日18時、請求書を払う 今日23時、歯医者を予約 金曜12時と期限は書けるが、知らせは無い。中央は牛乳の一日で、期限の18時まで何も知らせず、21時にアプリを開いて過ぎたと気づく。右は決めたいことで、通知を付けるがうるさくしない。どこに出すか、いつ出すか、許可をいつ聞くか、どれだけ出すか。">'
  + left + mid + right + '</svg>';
