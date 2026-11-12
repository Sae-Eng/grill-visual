// 静かな時間：0時〜24時の物差しに、請求書（23時の期限）の通知がどこで鳴るか
const X = h => 40 + h * 18.5;
const Y = 130;
let base = '<path d="M' + X(0) + ' ' + Y + ' H' + X(24) + '" style="stroke:var(--ink);stroke-width:1.5"/>'
  + [0, 6, 12, 18, 24].map(h => '<path d="M' + X(h) + ' ' + (Y - 5) + ' V' + (Y + 5) + '" style="stroke:var(--ink);stroke-width:1.5"/>' + MONO(X(h), Y + 24, h + '時', 'mute', 12, 'middle')).join('')
  + '<rect x="' + (X(23) - 5) + '" y="' + (Y - 5) + '" width="10" height="10" style="fill:var(--ink)"/>' + T(X(23), Y + 44, '請求書 23:00', 'ink', 12, 700, 'middle');
const band = (a, b, dash) => '<rect x="' + X(a) + '" y="' + (Y - 40) + '" width="' + (X(b) - X(a)) + '" height="40" style="fill:var(--paper);stroke:var(--mute);stroke-width:1' + (dash ? ';stroke-dasharray:4 3' : '') + '"/>';
const ring = (h, c) => '<circle cx="' + X(h) + '" cy="' + (Y - 58) + '" r="8" style="fill:var(--' + c + '-soft);stroke:var(--' + c + ');stroke-width:1.5"/>'
  + '<path d="M' + X(h) + ' ' + (Y - 50) + ' V' + (Y - 6) + '" style="stroke:var(--' + c + ');stroke-width:1.5;stroke-dasharray:3 3"/>';
const N = '<g data-layer="N">' + T(20, 236, '今は鳴らない（Q02 で1時間前に決まった）', 'sub', 12) + '</g>';
const A = '<g data-layer="A">' + ring(22, 'accent') + T(X(22), Y - 74, '22:00', 'accent', 12, 700, 'middle')
  + T(20, 216, '夜の22時に鳴る。寝ている人を起こすことがある', 'ink', 12, 700) + '</g>';
const B = '<g data-layer="B">' + band(0, 7) + band(22, 24) + T(X(3.5), Y - 16, '静か', 'mute', 12, 400, 'middle') + T(X(23), Y - 16, '静か', 'mute', 12, 400, 'middle')
  + ring(21.5, 'accent') + T(X(21.5) - 12, Y - 74, '21:30 に前倒し', 'accent', 12, 700, 'end')
  + TL(20, 206, ['22時〜7時は鳴らさない。', 'その間の期限は、静かになる前に知らせる'], 'ink', 12, 700) + '</g>';
const C = '<g data-layer="C">' + band(0, 7, true) + band(22, 24, true) + T(X(3.5), Y - 16, '端末しだい', 'mute', 12, 400, 'middle')
  + ring(22, 'q') + T(X(22), Y - 74, '?', 'q', 13, 700, 'middle')
  + TL(20, 206, ['端末の集中モードに任せる。', '鳴るかは人の設定しだい'], 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 250" role="img" aria-label="0時から24時の物差しに、請求書の期限23時を置く。1時間前の通知は22時。A 静かな時間なしは22時に鳴る。B 22時から7時を静かな時間にし、その間の期限は21時30分に前倒しして知らせる。C 端末の集中モードに任せ、鳴るかは人の設定しだい。">'
  + base + N + A + B + C + '</svg>';
