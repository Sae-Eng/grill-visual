// 決めた後の通知：画面の札・一日の鳴り方・許可を聞く場面を1枚に
const chip = (x, y, id) => '<a class="chip" href="#d-' + id.toLowerCase() + '"><rect x="' + x + '" y="' + y + '" width="38" height="20" rx="3"/><text x="' + (x + 19) + '" y="' + (y + 14) + '" font-size="12" text-anchor="middle">' + id + '</text></a>';
const phone = region(20, 20, 280, 370, '画面に出る札', 'ink')
  + '<rect x="50" y="46" width="200" height="320" rx="20" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="130" y="56" width="40" height="5" rx="2.5" style="fill:var(--line)"/>'
  + T(150, 118, '17:00', 'ink', 34, 700, 'middle') + T(150, 142, '11月12日 木曜', 'sub', 12, 400, 'middle')
  + '<rect x="62" y="172" width="176" height="112" rx="10" style="fill:var(--paper);stroke:var(--frame)"/>'
  + MONO(74, 192, 'ToDo · 今', 'mute', 12) + T(74, 214, '牛乳を買う', 'ink', 14, 700) + T(74, 234, '18:00 まで（あと1時間）', 'sub', 12)
  + '<rect x="74" y="246" width="64" height="28" rx="6" style="fill:var(--accent)"/>' + T(106, 265, '完了', 'on-accent', 12, 700, 'middle')
  + '<rect x="146" y="246" width="80" height="28" rx="6" style="fill:var(--surface);stroke:var(--ink)"/>' + T(186, 265, '1時間後', 'ink', 12, 700, 'middle')
  + chip(62, 300, 'Q01') + chip(106, 300, 'Q05');
const X = h => 360 + h * 17.5;
const day = region(320, 20, 460, 370, '一日の鳴り方（期限が多い日）', 'ink')
  + '<rect x="' + X(0) + '" y="110" width="' + (X(7) - X(0)) + '" height="50" style="fill:var(--paper);stroke:var(--mute);stroke-width:1"/>'
  + '<rect x="' + X(22) + '" y="110" width="' + (X(24) - X(22)) + '" height="50" style="fill:var(--paper);stroke:var(--mute);stroke-width:1"/>'
  + T(X(3.5), 140, '静か', 'mute', 12, 400, 'middle') + T(X(23), 140, '静か', 'mute', 12, 400, 'middle')
  + '<path d="M' + X(0) + ' 160 H' + X(24) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [0, 6, 12, 18, 24].map(h => MONO(X(h), 182, h + '時', 'mute', 12, 'middle')).join('')
  + [11, 17, 19].map(h => '<circle cx="' + X(h) + '" cy="92" r="8" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/><path d="M' + X(h) + ' 100 V158" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>').join('')
  + T(X(11), 72, '1時間前に、近い順に3件まで', 'accent', 12, 700, 'middle')
  + '<rect x="' + (X(21.5) - 9) + '" y="83" width="18" height="18" rx="3" style="fill:var(--surface);stroke:var(--accent);stroke-width:1.5"/>' + '<path d="M' + X(21.5) + ' 101 V158" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>'
  + T(X(21.5) + 30, 50, '21:30 残りをまとめて1通', 'ink', 12, 700, 'end')
  + chip(340, 200, 'Q02') + chip(384, 200, 'Q04') + chip(428, 200, 'Q06')
  + TL(340, 250, ['・期限の1時間前に鳴る', '・1日に1件ずつ鳴るのは3件まで。残りは21:30 に1通', '・22時〜7時は鳴らさない。その間の期限は前倒し', '・通知から「完了」「1時間後」を押せる'], 'ink', 12);
const ask = region(800, 20, 180, 370, '許可を聞く場面')
  + '<rect x="820" y="56" width="140" height="196" rx="16" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + T(834, 96, '牛乳を買う', 'ink', 13, 700) + '<rect x="834" y="106" width="112" height="22" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + MONO(842, 122, '期限 18:00', 'accent', 12)
  + '<rect x="830" y="146" width="120" height="78" rx="8" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/>' + T(890, 170, '通知を許可？', 'ink', 12, 700, 'middle')
  + T(858, 210, 'しない', 'sub', 12, 400, 'middle') + T(922, 210, '許可', 'accent', 12, 700, 'middle')
  + TL(820, 284, ['初めて期限を', '付けたときに聞く'], 'ink', 12) + chip(820, 330, 'Q03');
return '<svg viewBox="0 0 1000 410" role="img" aria-label="決めた後の通知。左は電話のロック中の画面に出る札で、牛乳を買う 18時まで あと1時間、完了と1時間後のボタン。中央は期限が多い日の鳴り方で、期限の1時間前に近い順に3件まで鳴り、残りは21時30分に1通にまとめ、22時から7時は鳴らさない。右は許可を聞く場面で、初めて期限を付けたときに通知を許可するか聞く。">'
  + phone + day + ask + '</svg>';
