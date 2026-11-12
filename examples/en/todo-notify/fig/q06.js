// Quiet hours: on a 0 to 24 ruler, where the notification for an invoice due at 23:00 fires
const X = h => 40 + h * 18.5;
const Y = 130;
let base = '<path d="M' + X(0) + ' ' + Y + ' H' + X(24) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [0, 6, 12, 18, 24].map(h => '<path d="M' + X(h) + ' ' + (Y - 5) + ' V' + (Y + 5) + '" style="stroke:var(--ink);stroke-width:1.5"/>' + MONO(X(h), Y + 24, h + ':00', 'mute', 12, 'middle')).join('')
  + '<rect x="' + (X(23) - 5) + '" y="' + (Y - 5) + '" width="10" height="10" style="fill:var(--ink)"/>' + T(X(23) + 18, Y + 44, 'Invoice 23:00', 'ink', 12, 700, 'end');
const band = (a, b, dash) => '<rect x="' + X(a) + '" y="' + (Y - 40) + '" width="' + (X(b) - X(a)) + '" height="40" style="fill:var(--paper);stroke:var(--mute);stroke-width:1' + (dash ? ';stroke-dasharray:4 3' : '') + '"/>';
const ring = (h, c) => '<circle cx="' + X(h) + '" cy="' + (Y - 58) + '" r="8" style="fill:var(--' + c + '-soft);stroke:var(--' + c + ');stroke-width:1.5"/>'
  + '<path d="M' + X(h) + ' ' + (Y - 50) + ' V' + (Y - 6) + '" style="stroke:var(--' + c + ');stroke-width:1.5;stroke-dasharray:3 3"/>';
const N = '<g data-layer="N">' + T(20, 236, 'Nothing fires yet (Q02 decided 1 hour before)', 'sub', 12) + '</g>';
const A = '<g data-layer="A">' + ring(22, 'accent') + T(X(22), Y - 74, '22:00', 'accent', 12, 700, 'middle')
  + T(20, 216, 'Fires at 22:00 at night. May wake someone', 'ink', 12, 700) + '</g>';
const B = '<g data-layer="B">' + band(0, 7) + band(22, 24) + T(X(3.5), Y - 16, 'Quiet', 'mute', 12, 400, 'middle')
  + ring(21.5, 'accent') + T(X(21.5) - 12, Y - 74, 'Moved earlier to 21:30', 'accent', 12, 700, 'end')
  + TL(20, 206, ['Nothing fires 22:00 to 7:00.', 'Due times in that window are notified earlier'], 'ink', 12, 700) + '</g>';
const C = '<g data-layer="C">' + band(0, 7, true) + band(22, 24, true) + T(X(3.5), Y - 16, 'Up to the device', 'mute', 12, 400, 'middle')
  + ring(22, 'q') + T(X(22), Y - 74, '?', 'q', 13, 700, 'middle')
  + TL(20, 206, ["Rely on the device's focus mode.", "Whether it fires depends on each person's settings"], 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 250" role="img" aria-label="On a ruler from 0:00 to 24:00, an invoice is due at 23:00. A notification 1 hour before would fire at 22:00. A, no quiet hours: it fires at 22:00. B, quiet from 22:00 to 7:00: due times in that window are notified earlier, at 21:30. C, leave it to the device focus mode: whether it fires depends on each person\'s settings.">'
  + base + N + A + B + C + '</svg>';
