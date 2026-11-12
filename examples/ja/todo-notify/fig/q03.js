// 許可をいつ聞くか：使い始めの3つの場面を1コマずつ出し、許可の窓がどこに出るかを案で替える
const P = [20, 190, 360];
const phone = x => '<rect x="' + x + '" y="20" width="140" height="196" rx="16" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>'
  + '<rect x="' + (x + 50) + '" y="28" width="40" height="5" rx="2.5" style="fill:var(--line)"/>';
const ask = x => '<rect x="' + (x + 10) + '" y="96" width="120" height="78" rx="8" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/>'
  + T(x + 70, 120, '通知を許可？', 'ink', 12, 700, 'middle') + '<path d="M' + (x + 10) + ' 138 H' + (x + 130) + '" style="stroke:var(--line)"/>'
  + T(x + 38, 162, 'しない', 'sub', 12, 400, 'middle') + T(x + 102, 162, '許可', 'accent', 12, 700, 'middle');
const s1 = '<g data-step="1">' + phone(P[0]) + T(P[0] + 70, 74, 'ようこそ', 'ink', 14, 700, 'middle') + lines(P[0] + 20, 196, 100, 2, 10) + MONO(P[0] + 4, 236, '1 初めて開く', 'ink', 12) + '</g>';
const s2 = '<g data-step="2">' + phone(P[1]) + T(P[1] + 14, 62, '牛乳を買う', 'ink', 13, 700)
  + '<rect x="' + (P[1] + 14) + '" y="72" width="112" height="22" rx="4" style="fill:var(--accent-soft);stroke:var(--accent)"/>' + MONO(P[1] + 22, 88, '期限 18:00', 'accent', 12)
  + MONO(P[1] + 4, 236, '2 期限を付ける', 'ink', 12) + '</g>';
const s3 = '<g data-step="3">' + phone(P[2]) + T(P[2] + 70, 70, '17:00', 'ink', 22, 700, 'middle') + MONO(P[2] + 4, 236, '3 期限の1時間前', 'ink', 12) + '</g>';
const got = '<rect x="' + (P[2] + 10) + '" y="108" width="120" height="48" rx="8" style="fill:var(--paper);stroke:var(--frame)"/>' + T(P[2] + 20, 128, '牛乳を買う', 'ink', 12, 700) + T(P[2] + 20, 146, '18:00 まで', 'sub', 12);
const miss = T(P[2] + 70, 136, '届かない', 'mute', 13, 700, 'middle');
const lay = (k, at, ok, msg) => '<g data-layer="' + k + '">' + (at == null ? '' : '<g data-step="' + (at + 1) + '">' + ask(P[at]) + '</g>') + '<g data-step="3">' + (ok ? got : miss) + '</g>' + T(20, 266, msg, 'ink', 12, 700) + '</g>';
return '<svg viewBox="0 0 520 280" role="img" aria-label="使い始めの3つの場面。1 初めて開く、2 牛乳に期限 18時を付ける、3 期限の1時間前。A は1で許可の窓が出て、何の通知か分からず断られやすい。B は2で窓が出て、期限を付けた直後なので理由が伝わる。C は窓を出さず、設定を開いた人にしか届かない。">'
  + s1 + s2 + s3
  + lay('A', 0, true, '開いた瞬間に聞く。何の通知か分からず断られやすい')
  + lay('B', 1, true, '期限を付けた直後に聞く。理由が伝わる')
  + lay('C', null, false, '聞かない。設定を開いた人にしか届かない')
  + '</svg>';
