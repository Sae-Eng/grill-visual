# 04 Parts and values

Use finished CSS and parts instead of writing them every time. Writing them each time makes values drift and the look inconsistent.
The example is `assets/sample.html` (it uses tokens.css, base.css and parts.js).


## tokens.css and base.css

| File | Content | Where to paste |
|---|---|---|
| `assets/tokens.css` | Variables only (defaults and direction sets, light and dark) | At the top of the page's `<style>` |
| `assets/base.css` | Ground and part classes (table below) | After tokens.css |

Paste the content so the page is one self-contained file. Choose the direction with `<html data-direction="…">` (02).
Dark follows the OS setting and can be overridden with `<html data-theme="light|dark">`.
Makers with their own parts (grill-visual and others) paste only tokens.css and draw their parts with these variables (so class names do not collide).

### Variables (tokens.css)

| Kind | Variables |
|---|---|
| Typeface and text scale | `--font` `--mono` `--fs` (15px) `--fs-s` (13) `--fs-label` (12) `--fs-h3/h2/h1` (17/20/26) `--lh` (1.7) `--lh-s` (1.5) `--lh-h` (1.4) |
| Spacing, lines, corners | `--s1` to `--s7` (4, 8, 12, 16, 24, 32, 48px) `--r` (4px) `--r-chip` (3px) `--rule` (1.5px) `--hit` (44px) `--measure` (40em) `--page` (1080px) `--fig-min` (940px) |
| Ground and text | `--bg` (ground) `--surface` (surface) `--paper` (light surface) `--ink` (ink) `--sub` `--mute` `--line` `--line2` `--frame` `--stroke` |
| Accent | `--accent` `--accent-soft` `--on-accent` (text on the accent) |
| State | `--ok` `--ok-soft` (good) `--ng` `--ng-soft` (bad) `--q` `--q-soft` (to check, needs checking) |
| Other | `--grid` (grid lines) `--focus` (focus ring) |

To change color for a subject, override `:root{--accent:…;--accent-soft:…}` on the page side. Write the dark values too.

### Part classes (base.css)

| class | Use |
|---|---|
| `.sec` `.sec-head` | An area. An ink rule at the top, the area name in `.label`, `h2`, `.lead` |
| `.label` | A small gray monospace tag (area and item names) |
| `.tree` `.k` | A tree nesting content under headings. `<li><span class="k">heading</span><ul><li>content</li></ul></li>` |
| `.cells` `.cell` `.v` `.d` | Cells divided by rules. A number (`.v`) and a description (`.d`) |
| `.chip` `.ok` `.ng` `.q` `.now` | State tags. A color dot and a word. Only `.q` (needs checking) is filled |
| `.btn` `.primary` `.seg` | Buttons. "Next" is `.primary` (filled ink), "Previous" is outline only. `.seg` groups a switch. The chosen one has `aria-pressed="true"` |
| `.fig` `.fig-type` `figcaption` | Diagram frame (grid ground, scrolls sideways when narrow), the "picture type" sentence above, the caption |
| `.num` | Numbers in monospace with digits aligned |
| `.note` | A note with a rule on the left |
| `table` `details` | Ruled tables, folded parts |

- Narrow diagrams scroll sideways instead of shrinking. The minimum width of `.fig svg` is `--fig-min` (940px), the value that keeps text at 11px or more on screen with viewBox width 1000 and text 12. Change it together if you change the viewBox.
- Add `data-check-skip` to things the measure should not measure, such as control bars (05).

## parts.js

Parts for blueprint line drawings. Every function returns an SVG string. Add them up as in `svg.innerHTML = defs('hf') + region(...) + ...`.
Pass colors by name (`'ink'` `'sub'` `'mute'` `'stroke'` `'frame'` `'accent'` `'ok'` `'ng'` `'q'` `'surface'` `'none'`). They become `var(--name)` inside, so they follow the direction and dark mode.

| Function | Draws |
|---|---|
| `T(x,y,s,c,sz,w,a)` `TL(x,y,lines,…)` `MONO(x,y,s,c,sz,a)` | Text, multiple lines, monospace text. Text is escaped automatically |
| `defs(p)` | Open-V arrowheads (`p-ink` `p-mute` `p-accent` `p-ok` `p-ng`). Once per diagram |
| `region(x,y,w,h,name)` | An area: dashed frame and monospace name (line 1) |
| `flow(d,c,p,dash)` | A flow: line 1.5 with an arrowhead. `c` is one of the five colors with arrowheads |
| `road(d)` | The main flow: line 3 |
| `note(x,y,s,c,sz,a)` | A label on a line (text cut out with the ground color) |
| `gate` `cog` `bot` `man` `house` `shield` `lock` | Gate, gear, AI, person, house (default name main), shield, lock |
| `doc(x,y,w,h,title)` `lines(x,y,w,n)` | A document with a folded corner, gray lines standing in for text |
| `tag(x,y,s,c,fill)` `crate` `cal` `sticky(x,y,w,h,lines,kind)` | Tag, box, date, sticky note (default is the ochre of "needs checking") |
| `badge(x,y,n,on,label)` | A pressable number (white number and ▸ on an accent square). `on=false` is a gray outline. The page's JS picks up presses via `[data-n]` |
| `callout(x,y,w,t1,t2,ax,ay,kind)` | A tag drawn out from a thing. `kind='q'` is needs checking, `'fill'` is something supplied |

- `defs` IDs may differ per diagram within a page (arrowheads in hidden diagrams may not render, so placing them per diagram is safest).
- If part names collide with the page's names, wrap all of parts.js in a function before use.
