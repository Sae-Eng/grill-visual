# 05 How to check

Stop breakage after making a page. The measure every time; scoring only when needed.

| Stage | Who | When | What |
|---|---|---|---|
| 1 Measure | Machine | Every time | Run `html-check` and bring ✗ to 0. Read the ! and decide whether to fix |
| 2 Look in the browser | The AI that made it | Every time | Open one representative screen in the built-in browser and look at diagrams, text, links, folding and switching |
| 3 Scoring | An AI other than the maker (one, once) | Documents for people, and when asked | Score with the table below. The maker fixes the failures and stops |

## 1 The measure: html-check

```sh
node <this skill>/scripts/html-check.mjs <HTML path or URL> [--prep <JS>] [--dark] [--shots <dir>] [--config <JSON>] [--json]
```

- Node 22 or later. Chromium is looked for in Playwright's location or Chrome. If missing, run `npx playwright install chromium-headless-shell` once or pass it with `HTML_CHECK_CHROME`.
- Exit codes: 0 = no ✗, 1 = ✗ found, 2 = could not run.
- Measures text and diagrams at a narrow width (680px) and characters per line at a wide width (1280px).

| Item | Default line | Result | Config key |
|---|---|---|---|
| Text too small | Page text and the text of displayed diagrams at 11px or more | ✗ stop | `minText` |
| Overlapping diagram text | No overlap | ✗ stop | — |
| Horizontal overflow | The page does not overflow sideways. Diagram text does not leave the diagram | ✗ stop | — |
| Diagram colors | At most four per sheet | ✗ stop | `maxColors` |
| Body size | 14 to 15.5px | ! report | `bodyMin` `bodyMax` |
| Line height | Body 1.7, others 1.5 or more | ! report | `lineHeightBody` `lineHeightOther` |
| Characters per line | 40 or fewer | ! report | `maxChars` |
| Arrow labels | A label near each arrow | ! report | `arrowPad` |

- To change a line, pass JSON with only the keys to change via `--config` (e.g. `{"maxChars": 45}`). Write the reason on the page or in the maker skill.
- How diagram colors are counted: ground and text colors, gray, white and black are not counted. Colors close in lightness to the page ground (under 20% difference) count as ground. Colors with nearly the same hue and lightness count as one. SVGs narrower than 240px are not counted as diagrams (`picMinWidth`).
- Closed `<details>` are opened before measuring. Diagrams hidden by a switch are not measured, so press a switch that shows everything with `--prep` before measuring (e.g. `--prep "document.getElementById('all-btn').click()"`).
- For things deliberately below the line (small text in a bad example, control bars), add `data-check-skip` to the element and write the reason on the page.
- Pages with a dark mode are also run with `--dark`.


## 2 Look in the browser

- Open it in the built-in browser (the browser inside the tool in use). Look at one representative PC screen.
- If there are switches or step players, look at every option and every frame. Check that counts, order and connections stated in the text match what is shown.
- Check that nothing breaks at narrow, normal and wide widths, and fix the most visible breakage first using screenshots.
- Clear any selections or switches pressed for checking by reloading before handing over. Close the tabs you opened.


## 3 Scoring (documents for people, and when asked)

The AI that made it does not score it. Start one AI with a fresh context and give it only the following.
Do not give the maker's explanation (what was done cleverly), so it looks from the same place as a reader.

- Diagram images (PNGs taken at the narrow width by `--shots <dir>`) and an image of the whole page
- The one line for each diagram and the "picture type" sentence above it
- This scoring table and the return format

### Seven items per diagram

| Item | Pass | Fail example |
|---|---|---|
| The one line comes across from the diagram | Looking only at the diagram, without the line, you can say in one sentence what it conveys. Where the eye goes first is the line's protagonist | The eye does not go to the line's protagonist |
| About four protagonists | About four protagonists for the eye to follow | Five or more stories side by side |
| One means of expression | The means (analogy, real screen, chart) is consistent within the sheet | Rings, ladders and bands mixed |
| Lines, arrows and colors are clear | Lines and arrows have labels. Color meanings are clear from labels. Four colors at most | An unnamed band. Too many colors |
| Numbers and labels sit on things | Labels are next to things. Numbers do not overlap. "Needs checking" tags state their content briefly | Overlapping numbers. Tags with only a number |
| The picture is the protagonist | An analogy, scene or real screen is the protagonist | Boxes connected by arrows are the protagonist |
| The structure is clear | Areas, flow direction and levels read from the diagram as the "picture type" sentence says. Area names are inside the diagram | Area boundaries are invisible |

- Machine-drawn ER and state diagrams are exempt from "the picture is the protagonist" (count as pass).

### Five items for the whole page

| Item | Pass | Fail example |
|---|---|---|
| The point comes first | The first screen shows what the document is and the top of the overall diagram | Explanatory text continues and the diagram is below the fold |
| Easy to move and find | You know where you are and can go back on press. Pressable things are marked; areas show where they begin and end | No way back from a close-up to the overview |
| Interactions respond immediately | Pressing moves at once. Nothing keeps moving just by opening | Something looks pressable but does nothing |
| Readable for anyone at any width | At narrow widths diagrams scroll sideways instead of shrinking. State is not shown by color alone | Diagram text unreadable at narrow width |
| Ways of seeing only HTML has | There are ways of seeing paper cannot offer, such as pressing to dig in or switching to compare | It would be the same printed on paper |

### Return format

```json
{
  "pictures": [
    {"name": "Overall diagram", "one": "the one line for the diagram",
     "items": [{"item": "The one line comes across from the diagram", "value": "pass", "note": ""},
               {"item": "About four protagonists", "value": "fail", "note": "where, which rule, how to fix"}]}
  ],
  "page": [{"item": "The point comes first", "value": "pass", "note": ""}],
  "result": "fix the failures"
}
```

- `value` is pass, fail or cannot judge. `result` is "fix the failures" if there is any fail, otherwise "pass", or "pass (cannot judge N)" if there are cannot-judge items.
- After fixing the failures, the maker adds `fix` (how it was fixed) to the failed items. No re-scoring (run it again if asked).
- Show "cannot judge" items to a person with the reason.
