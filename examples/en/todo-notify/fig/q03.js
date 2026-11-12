// When to ask permission: three moments from first use, one frame each; the option moves the dialog
const P = [20, 190, 360];
const phone = x => '<rect x="' + x + '" y="20" width="140" height="196" rx="16" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="' + (x + 50) + '" y="28" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const ask = x => '<rect x="' + (x + 10) + '" y="96" width="120" height="78" rx="8" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/>'
  + TL(x + 70, 112, ['Allow', 'notifications?'], 'ink', 12, 700, 'middle') + '<path d="M' + (x + 10) + ' 138 H' + (x + 130) + '" style="stroke:var(--line)"/>'
  + T(x + 38, 162, "Don't", 'sub', 12, 400, 'middle') + T(x + 102, 162, 'Allow', 'accent', 12, 700, 'middle');
const s1 = '<g data-step="1">' + phone(P[0]) + T(P[0] + 70, 74, 'Welcome', 'ink', 14, 700, 'middle') + lines(P[0] + 20, 196, 100, 2, 10) + MONO(P[0] + 4, 236, '1 First launch', 'ink', 12) + '</g>';
const s2 = '<g data-step="2">' + phone(P[1]) + T(P[1] + 14, 62, 'Buy milk', 'ink', 13, 700)
  + '<rect x="' + (P[1] + 14) + '" y="72" width="112" height="22" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + MONO(P[1] + 22, 88, 'Due 18:00', 'accent', 12)
  + MONO(P[1] + 4, 236, '2 Set a due time', 'ink', 12) + '</g>';
const s3 = '<g data-step="3">' + phone(P[2]) + T(P[2] + 70, 70, '17:00', 'ink', 22, 700, 'middle') + MONO(P[2] + 4, 236, '3 1 hour before', 'ink', 12) + '</g>';
const got = '<rect x="' + (P[2] + 10) + '" y="108" width="120" height="48" rx="8" style="fill:var(--paper);stroke:var(--frame)"/>' + T(P[2] + 20, 128, 'Buy milk', 'ink', 12, 700) + T(P[2] + 20, 146, 'Due 18:00', 'sub', 12);
const miss = T(P[2] + 70, 136, 'Nothing arrives', 'mute', 13, 700, 'middle');
const lay = (k, at, ok, msg) => '<g data-layer="' + k + '">' + (at == null ? '' : '<g data-step="' + (at + 1) + '">' + ask(P[at]) + '</g>') + '<g data-step="3">' + (ok ? got : miss) + '</g>' + T(20, 266, msg, 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 280" role="img" aria-label="Three moments from first use. 1: open the app for the first time. 2: set a due time of 18:00 on Buy milk. 3: one hour before the due time. A: the permission dialog appears at step 1; people do not know what the notifications are for, so they refuse. B: the dialog appears at step 2, right after setting a due time, so the reason is clear. C: no dialog; the notification reaches only people who open settings.">'
  + s1 + s2 + s3
  + lay('A', 0, true, 'Asked at launch. Unclear why, so people refuse')
  + lay('B', 1, true, 'Asked right after setting a due time. The reason is clear')
  + lay('C', null, false, 'Never asked. Reaches only people who open settings')
  + '</svg>';
