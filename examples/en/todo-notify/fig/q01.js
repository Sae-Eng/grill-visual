// Where to show it: the same phone screen, and whether you notice in 3 situations
const phone = '<rect x="30" y="24" width="170" height="250" rx="18" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="95" y="33" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const lock = T(115, 92, '17:00', 'ink', 30, 700, 'middle') + T(115, 114, 'Thu, Nov 12', 'sub', 12, 400, 'middle');
const card = (a, b, c) => '<rect x="42" y="146" width="146" height="62" rx="8" style="fill:var(--paper);stroke:var(--frame)"/>'
  + MONO(52, 164, a, 'mute', 12) + T(52, 184, b, 'ink', 13, 700) + T(52, 200, c, 'sub', 12);
const rowsY = [96, 136, 176];
const base = phone + T(234, 56, 'Do you notice it while closed?', 'ink', 13, 700)
  + ['Opening the app', 'Seeing the lock screen', 'Opening your email'].map((s, i) => T(234, rowsY[i], s, 'ink', 12)).join('');
const marks = arr => arr.map((on, i) => tag(436, rowsY[i] - 15, on ? 'Noticed' : 'Missed', on ? 'ok' : 'mute', 'surface', 12, 70)).join('');
const N = '<g data-layer="N">' + lock + marks([false, false, false]) + T(234, 236, 'Nothing notifies you today', 'sub', 12) + '</g>';
const A = '<g data-layer="A">'
  + T(46, 70, "Today's to-dos", 'ink', 13, 700)
  + '<rect x="42" y="82" width="146" height="26" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + T(52, 100, '1 due soon', 'accent', 12, 700)
  + lines(46, 132, 130, 6, 18)
  + marks([true, false, false]) + TL(234, 230, ['Nothing happens until you open it.', 'You notice only after opening'], 'sub', 12) + '</g>';
const B = '<g data-layer="B">' + lock + card('ToDo · now', 'Buy milk', 'Due 18:00')
  + marks([true, true, false]) + TL(234, 230, ['You notice by glancing at the screen.', 'Permission needed first (Q03)'], 'sub', 12) + '</g>';
const C = '<g data-layer="C">' + lock + card('Email · 7:00', '3 to-dos today', 'All in one email')
  + marks([false, false, true]) + TL(234, 230, ['Once a day only.', 'Too late for urgent due times'], 'sub', 12) + '</g>';
return '<svg viewBox="0 0 520 290" role="img" aria-label="Left: a phone screen. Right: whether you notice in 3 situations while the app is closed. A, an in-app badge: you notice only when you open the app. B, a device notification: a card for Buy milk, due 18:00, appears on the lock screen, so you notice when you look at the lock screen or open the app. C, a morning email: you notice only when you open the email. Today nothing notifies you.">'
  + base + N + A + B + C + '</svg>';
