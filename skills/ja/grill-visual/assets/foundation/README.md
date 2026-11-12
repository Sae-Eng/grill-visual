# 土台（foundation）

grill-visual のページの見た目と物差しの土台。`build.mjs` と `verify.mjs` は、ここを先に読む。
ここは grill-visual に同梱した写し。

## 地図

| 段 | ファイル | 中身 | 読むとき |
|---|---|---|---|
| 01 好み・原則 | [references/01-preferences.md](references/01-preferences.md) | 絵が主役・実物と実名・工程の粒度・入れ子・毎回発想・方向の徹底・避ける組 | 毎回 |
| 02 見た目の方向 | [references/02-look.md](references/02-look.md) | 既定(書体・文字の段・余白と線と角)、方向の組のメニュー、色の決め方 | 毎回。方向は題材で選ぶ |
| 03 図とページの型 | [references/03-types.md](references/03-types.md) | 図の型の表、図の決まり、描き方、ページの型 | 図の形を決めるとき |
| 04 部品と数 | [references/04-parts.md](references/04-parts.md) | `assets/tokens.css`(変数)・`assets/parts.js`(線画)の使い方 | 図を書き始めるとき |
| 05 確かめ方 | [references/05-checks.md](references/05-checks.md) | 物差し `scripts/html-check.mjs`、採点、ブラウザで見る | 作ったあと |

## 入っている物

- `assets/tokens.css`：色・文字・余白の変数。ライトとダーク。
- `assets/parts.js`：図の部品（人・AI・書類・矢印・札など）。図の断片 `.js` から呼ぶ。
- `scripts/html-check.mjs`：物差し。Chromium で開いて、はみ出し・重なり・文字の大きさなどを測る。
