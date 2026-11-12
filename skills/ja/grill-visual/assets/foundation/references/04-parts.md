# 04 部品と数

できあがった CSS と部品を使い、毎回書かない。書くたびに値が揺れ、見た目がそろわなくなるため。
見本は `assets/sample.html`(tokens.css・base.css・parts.js を使っている)。


## tokens.css と base.css

| ファイル | 中身 | 貼る所 |
|---|---|---|
| `assets/tokens.css` | 変数だけ(既定と方向の組、ライトとダーク) | ページの `<style>` の頭 |
| `assets/base.css` | 地と部品の class(下の表) | tokens.css の後 |

中身ごと貼り、1ファイルで完結させる。`<html data-direction="…">` で方向を選ぶ(02)。
ダークは OS の設定に従い、`<html data-theme="light|dark">` で上書きできる。
自分の部品を持つ作り手(grill-visual など)は tokens.css だけを貼り、部品をこの変数で描く(class 名がぶつからないように)。

### 変数(tokens.css)

| 種類 | 変数 |
|---|---|
| 書体と文字の段 | `--font` `--mono` `--fs`(15px) `--fs-s`(13) `--fs-label`(12) `--fs-h3/h2/h1`(17/20/26) `--lh`(1.7) `--lh-s`(1.5) `--lh-h`(1.4) |
| 余白と線と角 | `--s1`〜`--s7`(4・8・12・16・24・32・48px) `--r`(4px) `--r-chip`(3px) `--rule`(1.5px) `--hit`(44px) `--measure`(40em) `--page`(1080px) `--fig-min`(940px) |
| 地と文字 | `--bg`(地) `--surface`(面) `--paper`(薄い面) `--ink`(墨) `--sub` `--mute` `--line` `--line2` `--frame` `--stroke` |
| 強調 | `--accent` `--accent-soft` `--on-accent`(強調の上の文字) |
| 状態 | `--ok` `--ok-soft`(よい) `--ng` `--ng-soft`(だめ) `--q` `--q-soft`(確かめる・要確認) |
| そのほか | `--grid`(方眼の線) `--focus`(フォーカスの輪) |

題材で色を変えるときは、`:root{--accent:…;--accent-soft:…}` をページの側で上書きする。ダークの値も書く。

### 部品の class(base.css)

| class | 用途 |
|---|---|
| `.sec` `.sec-head` | 区画。頭に墨の罫線、`.label` の区画名、`h2`、`.lead` |
| `.label` | 等幅の小さな灰の札(区画名・項目名) |
| `.tree` `.k` | 見出しの下に中身を入れ子で並べる木。`<li><span class="k">見出し</span><ul><li>中身</li></ul></li>` |
| `.cells` `.cell` `.v` `.d` | 罫線で区切ったセル。数(`.v`)と説明(`.d`) |
| `.chip` `.ok` `.ng` `.q` `.now` | 状態の札。色の点と言葉。塗るのは `.q`(要確認)だけ |
| `.btn` `.primary` `.seg` | ボタン。「次」は `.primary`(墨の塗り)、「前」は枠だけ。`.seg` で切り替えの組。選んだ物は `aria-pressed="true"` |
| `.fig` `.fig-type` `figcaption` | 図の枠(方眼の地・狭い幅で横へ送る)、図の上の「絵の型」の1文、図の説明 |
| `.num` | 等幅で桁をそろえる数 |
| `.note` | 左の罫線の注 |
| `table` `details` | 罫線の表、畳む所 |

- 狭い幅の図は縮めずに横へ送る。`.fig svg` の最小幅は `--fig-min`(940px)。viewBox の幅 1000・文字 12 のとき、表示で 11px 以上を保つ値。viewBox を変えるなら合わせて変える。
- 物差しに測らせたくない操作の帯などは `data-check-skip` を付ける(05)。

## parts.js

設計図の線画の部品。どの関数も SVG の文字列を返す。`svg.innerHTML = defs('hf') + region(...) + ...` のように足して使う。
色は名前で渡す(`'ink'` `'sub'` `'mute'` `'stroke'` `'frame'` `'accent'` `'ok'` `'ng'` `'q'` `'surface'` `'none'`)。中で `var(--名前)` になるので、方向とダークに合わせて変わる。

| 関数 | 描く物 |
|---|---|
| `T(x,y,s,c,sz,w,a)` `TL(x,y,lines,…)` `MONO(x,y,s,c,sz,a)` | 文字・複数行・等幅の文字。文字は自動でエスケープする |
| `defs(p)` | 開いた V の矢じり(`p-ink` `p-mute` `p-accent` `p-ok` `p-ng`)。1枚の図に1回 |
| `region(x,y,w,h,name)` | 区画: 破線の枠と等幅の名前(線 1) |
| `flow(d,c,p,dash)` | 流れ: 矢印つきの線 1.5。`c` は矢じりのある5色のどれか |
| `road(d)` | 主役の流れ: 線 3 |
| `note(x,y,s,c,sz,a)` | 線の上の札(地の色で抜いた文字) |
| `gate` `cog` `bot` `man` `house` `shield` `lock` | 門・歯車・AI・人・家(既定の名前は main)・盾・鍵 |
| `doc(x,y,w,h,title)` `lines(x,y,w,n)` | 右上を折った書類、文の行の代わりの灰の線 |
| `tag(x,y,s,c,fill)` `crate` `cal` `sticky(x,y,w,h,lines,kind)` | 札・箱・日付・付箋(既定は要確認の黄土) |
| `badge(x,y,n,on,label)` | 押せる番号(強調色の四角に白い番号と ▸)。`on=false` は灰の枠。押した物はページの JS で `[data-n]` を拾う |
| `callout(x,y,w,t1,t2,ax,ay,kind)` | 物から引き出した札。`kind='q'` は要確認、`'fill'` は補った所 |

- `defs` の ID は、ページの中で図ごとに変えてよい(隠れた図の矢じりは描かれないことがあるため、図ごとに置くのが安全)。
- 部品の名前がページの名前とぶつかるなら、parts.js 全体を関数で包んでから使う。

