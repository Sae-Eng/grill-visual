// いつ知らせるか：3件の期限と、鳴る時刻を同じ時間の物差しに置く
const X = h => 140 + (h - 6) * 18.5;
const rows = [['歯医者を予約', 12], ['牛乳を買う', 18], ['請求書を払う', 23]];
const Y = i => 104 + i * 50;
let base = [6, 9, 12, 15, 18, 21, 24].map(h => MONO(X(h), 58, h + '時', 'mute', 12, 'middle') + '<path d="M' + X(h) + ' 66 V' + (Y(2) + 16) + '" style="stroke:var(--line);stroke-width:1;stroke-dasharray:2 4"/>').join('');
rows.forEach(([s, h], i) => {
  base += T(20, Y(i) + 4, s, 'ink', 13) + '<path d="M' + X(6) + ' ' + Y(i) + ' H' + X(24) + '" style="stroke:var(--frame);stroke-width:1.5"/>'
    + '<rect x="' + (X(h) - 5) + '" y="' + (Y(i) - 5) + '" width="10" height="10" style="fill:var(--ink)"/>';
});
const ring = (h, i) => '<circle cx="' + X(h) + '" cy="' + (Y(i) - 18) + '" r="7" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>'
  + '<path d="M' + X(h) + ' ' + (Y(i) - 11) + ' V' + (Y(i) - 5) + '" style="stroke:var(--accent);stroke-width:1.5"/>';
const legend = '<rect x="20" y="236" width="10" height="10" style="fill:var(--ink)"/>' + T(36, 245, '期限', 'sub', 12)
  + '<circle cx="86" cy="241" r="6" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>' + T(98, 245, '通知が鳴る', 'sub', 12);
const lay = (k, hs, msg) => '<g data-layer="' + k + '">' + hs.map((h, i) => (h == null ? '' : ring(h, i))).join('') + T(200, 245, msg, 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 260" role="img" aria-label="6時から24時の物差しに、歯医者 12時・牛乳 18時・請求書 23時の3件の期限を置き、案ごとに通知が鳴る時刻を丸で示す。A は期限ちょうどに3回。B は期限の1時間前に3回。C は朝9時に1回、3件をまとめて。今は鳴らない。">'
  + base + legend
  + lay('N', [null, null, null], '今は鳴らない')
  + lay('A', [12, 18, 23], '期限ちょうど。動く時間が無い')
  + lay('B', [11, 17, 22], '1時間前。間に合うように動ける')
  + '<g data-layer="C">' + ring(9, 0) + '<path d="M' + X(9) + ' ' + (Y(0) - 11) + ' V' + (Y(2) - 4) + '" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3"/>' + T(X(9) + 10, Y(1) - 14, '3件をまとめて1回', 'accent', 12, 700) + T(200, 245, '朝9時に1回。夕方の期限を忘れる', 'ink', 12, 700) + '</g>'
  + '</svg>';
