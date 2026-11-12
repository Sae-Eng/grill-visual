// The app today: you can write a due time, but you don't notice it until you open the app
const phone = (x, y, w, h) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="' + (x + w / 2 - 20) + '" y="' + (y + 9) + '" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const box = (x, y) => '<rect x="' + x + '" y="' + (y - 11) + '" width="12" height="12" rx="2" style="fill:none;stroke:var(--ink);stroke-width:1.3"/>';
const rows = [['Buy milk', 'Today 18:00'], ['Pay invoice', 'Today 23:00'], ['Book dentist', 'Fri 12:00']];
const left = region(20, 20, 300, 264, 'The app today')
  + phone(80, 44, 180, 228)
  + T(98, 84, "Today's to-dos", 'ink', 13, 700)
  + rows.map(([t, d], i) => { const y = 120 + i * 46; return box(98, y) + T(118, y, t, 'ink', 13) + MONO(118, y + 17, d, 'mute', 12); }).join('')
  + T(170, 262, 'Due times, but no alerts', 'sub', 12, 400, 'middle');
const X = h => 370 + (h - 9) * 20;
const mid = region(340, 20, 300, 264, 'Milk, over one day')
  + T(360, 60, 'Due at 18:00', 'ink', 13, 700)
  + '<path d="M' + X(9) + ' 200 H' + X(21) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [9, 12, 15, 18, 21].map(h => '<path d="M' + X(h) + ' 195 V205" style="stroke:var(--ink);stroke-width:1.5"/>' + MONO(X(h), 224, h + ':00', 'mute', 12, 'middle')).join('')
  + '<path d="M' + X(18) + ' 195 V120" style="stroke:var(--accent);stroke-width:1.5"/>' + tag(X(18) - 18, 98, 'Due', 'accent', 'accent-soft', 12, 36)
  + T(X(13.5), 186, 'No alerts in between', 'sub', 12, 400, 'middle')
  + man(X(21), 136, 0.9)
  + T(X(21) + 4, 258, 'Opens at 21:00: overdue', 'ink', 12, 700, 'end');
const bell = (x, y) => '<path d="M' + (x - 14) + ' ' + (y + 10) + 'Q' + (x - 14) + ' ' + (y - 16) + ' ' + x + ' ' + (y - 18) + 'Q' + (x + 14) + ' ' + (y - 16) + ' ' + (x + 14) + ' ' + (y + 10) + 'Z" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>'
  + '<path d="M' + (x - 18) + ' ' + (y + 10) + 'H' + (x + 18) + '" style="stroke:var(--accent);stroke-width:1.5"/><circle cx="' + x + '" cy="' + (y + 15) + '" r="3" style="fill:var(--accent)"/>';
const right = region(660, 20, 320, 264, 'To decide', 'ink')
  + bell(720, 96) + T(752, 92, 'Add notifications', 'ink', 15, 700) + T(752, 112, 'but not noisy ones', 'sub', 12)
  + TL(684, 168, ['Where to show it (Q01)', 'When to notify (Q02)', 'When to ask permission (Q03)', 'How many to send (Q04)'], 'ink', 13);
return '<svg viewBox="0 0 1000 300" role="img" aria-label="The app today. Left: the to-do list screen. Buy milk, today 18:00; Pay invoice, today 23:00; Book dentist, Friday 12:00. You can write due times, but nothing alerts you. Middle: a day for the milk. Nothing alerts you before the 18:00 due time, and at 21:00 the person opens the app and sees it is overdue. Right: what to decide. Add notifications, but not noisy ones: where to show them, when to notify, when to ask permission, how many to send.">'
  + left + mid + right + '</svg>';
