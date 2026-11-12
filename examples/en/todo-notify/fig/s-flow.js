// From a due time to a notification. One stage appears per frame
const S = [
  ['Set a due time', ['If it is the first,', 'ask for permission'], 'Q03'],
  ['1 hour before', ['Fire time =', 'due time − 1 hour'], 'Q02'],
  ['Quiet hours?', ['If 22:00 to 7:00,', 'move earlier to 21:30'], 'Q06'],
  ["Today's count", ['Up to the 3rd: single', '4th on: into roundup'], 'Q04'],
  ['Send it', ['With "Done" and', '"In 1 hour" buttons'], 'Q05']
];
let s = defs('sf');
S.forEach(([h, items, id], i) => {
  const x = 20 + i * 196, last = i === 4;
  s += '<g data-step="' + (i + 1) + '">'
    + '<rect x="' + x + '" y="30" width="176" height="150" rx="4" style="fill:var(--' + (last ? 'accent-soft' : 'surface') + ');stroke:var(--' + (last ? 'accent' : 'frame') + ');stroke-width:' + (last ? 1.5 : 1) + '"/>'
    + MONO(x + 12, 52, String(i + 1), 'mute', 12) + T(x + 30, 52, h, 'ink', 13, 700)
    + TL(x + 12, 88, items, 'ink', 12)
    + MONO(x + 12, 164, id, 'mute', 12)
    + (i < 4 ? flow('M' + (x + 177) + ' 105 H' + (x + 194), 'ink', 'sf') : '')
    + '</g>';
});
return '<svg viewBox="0 0 1000 200" role="img" aria-label="Five stages from a due time to a notification. 1: set a due time; if it is the first, ask for permission. 2: set the fire time to 1 hour before the due time. 3: if it falls between 22:00 and 7:00, move it earlier to 21:30. 4: up to the 3rd today is sent individually; from the 4th on, it goes into the roundup. 5: send the notification with Done and In 1 hour buttons.">' + s + '</svg>';
