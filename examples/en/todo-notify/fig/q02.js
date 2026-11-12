// When to notify: 3 due times and the fire times on the same time ruler
const X = h => 140 + (h - 6) * 18.5;
const rows = [['Book dentist', 12], ['Buy milk', 18], ['Pay invoice', 23]];
const Y = i => 104 + i * 50;
let base = [6, 9, 12, 15, 18, 21, 24].map(h => MONO(X(h), 58, h + ':00', 'mute', 12, 'middle') + '<path d="M' + X(h) + ' 66 V' + (Y(2) + 16) + '" style="stroke:var(--line);stroke-width:1;stroke-dasharray:2 4"/>').join('');
rows.forEach(([s, h], i) => {
  base += T(20, Y(i) + 4, s, 'ink', 13) + '<path d="M' + X(6) + ' ' + Y(i) + ' H' + X(24) + '" style="stroke:var(--frame);stroke-width:1.5"/>'
    + '<rect x="' + (X(h) - 5) + '" y="' + (Y(i) - 5) + '" width="10" height="10" style="fill:var(--ink)"/>';
});
const ring = (h, i) => '<circle cx="' + X(h) + '" cy="' + (Y(i) - 18) + '" r="7" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>'
  + '<path d="M' + X(h) + ' ' + (Y(i) - 11) + ' V' + (Y(i) - 5) + '" style="stroke:var(--accent);stroke-width:1.5"/>';
const legend = '<rect x="20" y="236" width="10" height="10" style="fill:var(--ink)"/>' + T(36, 245, 'Due', 'sub', 12)
  + '<circle cx="86" cy="241" r="6" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>' + T(98, 245, 'Fires', 'sub', 12);
const lay = (k, hs, msg) => '<g data-layer="' + k + '">' + hs.map((h, i) => (h == null ? '' : ring(h, i))).join('') + T(150, 245, msg, 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 260" role="img" aria-label="On a ruler from 6:00 to 24:00, three due times are placed: Book dentist 12:00, Buy milk 18:00, Pay invoice 23:00. Circles show when the notification fires in each option. A: three alerts at the due times. B: three alerts, 1 hour before each due time. C: one alert at 9:00 covering all three. Today: nothing fires.">'
  + base + legend
  + lay('N', [null, null, null], 'Nothing fires today')
  + lay('A', [12, 18, 23], 'At the due time. No time to act')
  + lay('B', [11, 17, 22], '1 hour before. Time to act')
  + '<g data-layer="C">' + ring(9, 0) + '<path d="M' + X(9) + ' ' + (Y(0) - 11) + ' V' + (Y(2) - 4) + '" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>' + T(X(9) + 10, Y(1) - 14, 'All 3 in one alert', 'accent', 12, 700) + T(150, 245, 'Once at 9:00. Evening deadlines get forgotten', 'ink', 12, 700) + '</g>'
  + '</svg>';
