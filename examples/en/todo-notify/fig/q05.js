// What you can do from a notification: add tappable things to the same card. Below: steps to finish
const card = '<rect x="20" y="24" width="480" height="128" rx="12" style="fill:var(--paper);stroke:var(--frame);stroke-width:1.5"/>'
  + MONO(36, 46, 'ToDo · now', 'mute', 12) + T(36, 72, 'Buy milk', 'ink', 16, 700) + T(36, 94, 'Due 18:00 (1 hour left)', 'sub', 12);
const btn = (x, w, s, on) => '<rect x="' + x + '" y="108" width="' + w + '" height="32" rx="6" style="fill:var(--' + (on ? 'accent' : 'surface') + ');stroke:var(--' + (on ? 'accent' : 'ink') + ');stroke-width:1.2"/>' + T(x + w / 2, 129, s, on ? 'on-accent' : 'ink', 13, 700, 'middle');
const steps = (k, list, msg) => '<g data-layer="' + k + '">' + list.map((s, i) => tag(20 + i * 124, 196, s, i === list.length - 1 ? 'ok' : 'ink', 'surface', 12, 112)
  + (i < list.length - 1 ? '<path d="M' + (134 + i * 124) + ' 206 H' + (142 + i * 124) + '" style="stroke:var(--ink);stroke-width:1.5"/>' : '')).join('')
  + T(20, 250, msg, 'ink', 12, 700) + '</g>';
const base = card + T(20, 184, 'Steps to finish', 'sub', 12);
const A = '<g data-layer="A">' + T(250, 130, 'Tapping it opens the app', 'mute', 12) + '</g>' + steps('A', ['Tap the card', 'Find it in app', 'Mark it done'], '3 steps. You get distracted in the app and forget');
const B = '<g data-layer="B">' + btn(250, 70, 'Done', true) + btn(330, 158, 'Remind me in 1 hour', false) + '</g>' + steps('B', ['Tap "Done"'], '1 step. No need to open the app');
const C = '<g data-layer="C">' + '<rect x="250" y="108" width="238" height="32" rx="6" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.2"/>' + T(262, 129, 'Reply: tomorrow morning', 'mute', 12) + '</g>'
  + steps('C', ['Expand card', 'Type new time', 'Send'], '3 steps. The phrase can be misread');
return '<svg viewBox="0 0 520 266" role="img" aria-label="A notification card: Buy milk, due 18:00, 1 hour left. A: tapping only opens the app, so finishing takes 3 steps: tap the card, find it in the app, mark it done. B: Done and Remind in 1 hour buttons are added, so finishing takes 1 step: tap Done. C: a reply field changes the due time, which takes 3 steps: expand the card, type the new time, send.">'
  + base + A + B + C + '</svg>';
