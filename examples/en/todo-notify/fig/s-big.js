// Notifications after the decisions: the card on screen, how it fires over a day, and when permission is asked, on one sheet
const chip = (x, y, id) => '<a class="chip" href="#d-' + id.toLowerCase() + '"><rect x="' + x + '" y="' + y + '" width="38" height="20" rx="3"/><text x="' + (x + 19) + '" y="' + (y + 14) + '" font-size="12" text-anchor="middle">' + id + '</text></a>';
const phone = region(20, 20, 280, 370, 'Card on the screen', 'ink')
  + '<rect x="50" y="46" width="200" height="320" rx="20" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="130" y="56" width="40" height="5" rx="2.5" style="fill:var(--line)"/>'
  + T(150, 118, '17:00', 'ink', 34, 700, 'middle') + T(150, 142, 'Thu, Nov 12', 'sub', 12, 400, 'middle')
  + '<rect x="62" y="172" width="176" height="112" rx="10" style="fill:var(--paper);stroke:var(--frame)"/>'
  + MONO(74, 192, 'ToDo · now', 'mute', 12) + T(74, 214, 'Buy milk', 'ink', 14, 700) + T(74, 234, 'Due 18:00 (1 hour left)', 'sub', 12)
  + '<rect x="74" y="246" width="64" height="28" rx="6" style="fill:var(--accent)"/>' + T(106, 265, 'Done', 'on-accent', 12, 700, 'middle')
  + '<rect x="146" y="246" width="80" height="28" rx="6" style="fill:var(--surface);stroke:var(--ink)"/>' + T(186, 265, 'In 1 hour', 'ink', 12, 700, 'middle')
  + chip(62, 300, 'Q01') + chip(106, 300, 'Q05');
const X = h => 340 + h * 17.5;
const day = region(320, 20, 460, 370, 'A busy day', 'ink')
  + '<rect x="' + X(0) + '" y="110" width="' + (X(7) - X(0)) + '" height="50" style="fill:var(--paper);stroke:var(--mute);stroke-width:1"/>'
  + '<rect x="' + X(22) + '" y="110" width="' + (X(24) - X(22)) + '" height="50" style="fill:var(--paper);stroke:var(--mute);stroke-width:1"/>'
  + T(X(3.5), 140, 'Quiet', 'mute', 12, 400, 'middle') + T(X(23), 140, 'Quiet', 'mute', 12, 400, 'middle')
  + '<path d="M' + X(0) + ' 160 H' + X(24) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [0, 6, 12, 18, 24].map(h => MONO(X(h), 182, h + ':00', 'mute', 12, 'middle')).join('')
  + [11, 17, 19].map(h => '<circle cx="' + X(h) + '" cy="92" r="8" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/><path d="M' + X(h) + ' 100 V158" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>').join('')
  + T(X(11), 72, 'Nearest 3, 1 hour before each', 'accent', 12, 700, 'middle')
  + '<rect x="' + (X(21.5) - 9) + '" y="83" width="18" height="18" rx="3" style="fill:var(--surface);stroke:var(--accent);stroke-width:1.5"/>' + '<path d="M' + X(21.5) + ' 101 V158" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>'
  + T(X(21.5) + 30, 50, '21:30 the rest, in one message', 'ink', 12, 700, 'end')
  + chip(340, 200, 'Q02') + chip(384, 200, 'Q04') + chip(428, 200, 'Q06')
  + TL(340, 250, ['• Fires 1 hour before the due time', '• Individual alerts: 3 a day at most. The rest in one at 21:30', '• Quiet 22:00 to 7:00. Due times then are notified earlier', '• Tap "Done" or "In 1 hour" on the notification'], 'ink', 12);
const ask = region(800, 20, 180, 370, 'Asking permission')
  + '<rect x="820" y="56" width="140" height="196" rx="16" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + T(834, 96, 'Buy milk', 'ink', 13, 700) + '<rect x="834" y="106" width="112" height="22" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + MONO(842, 122, 'Due 18:00', 'accent', 12)
  + '<rect x="830" y="146" width="120" height="78" rx="8" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/>' + TL(890, 164, ['Allow', 'notifications?'], 'ink', 12, 700, 'middle')
  + T(858, 210, "Don't", 'sub', 12, 400, 'middle') + T(922, 210, 'Allow', 'accent', 12, 700, 'middle')
  + TL(820, 284, ['Asked when the first', 'due time is set'], 'ink', 12) + chip(820, 330, 'Q03');
return '<svg viewBox="0 0 1000 410" role="img" aria-label="Notifications after the decisions. Left: the card on a phone lock screen, Buy milk, due 18:00, 1 hour left, with Done and In 1 hour buttons. Middle: how it fires on a busy day. The 3 nearest due times fire individually 1 hour before, the rest go out as one message at 21:30, and nothing fires from 22:00 to 7:00. Right: when permission is asked. The app asks whether to allow notifications when the first due time is set.">'
  + phone + day + ask + '</svg>';
