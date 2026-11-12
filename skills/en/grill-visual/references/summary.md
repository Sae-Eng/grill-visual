# The discussion summary (summary.html)

After the discussion ends, make one page for "reading" what was decided.
The discussion page (index.html) is for resuming and answering; the summary is for reading and moving on to the work.

The summary is assembled too. The chapter frames, decision cards, the task chapter and the history diagram are
made by `scripts/build.mjs` from page.json and tasks.json. The model writes only the fragments of the finished picture and mechanism diagrams, and the content of the tasks.
Copy the `summary` sentences (the opening one or two sentences, assumptions, conditions to revisit) from the record in discussion.md. Do not write them from scratch.

## When to make it

- Whichever way the discussion ends (nothing open, the user's "done", a limit reached), make it without asking if there is at least one decision.
- With zero decisions (only a document was made, no decisions yet), do not make it.
- When a resumed discussion ends again, rebuild the same `summary.html`. Write the decisions added, changed or withdrawn since the previous version to `summary.changes` (shown as "Changes since the previous version" at the top).

## What it is based on

- The discussion's `discussion.md` and `page.json` are authoritative, supplemented by the same conversation. Match the version number to page.json.
- Do not read other discussions or outside documents. Do not supply decisions or reasons that are not in the record (write "not recorded" if missing).

## Readers

Your future self and the agent that will implement it. You need reasons and rejected options; the agent needs tasks and completion criteria.
Do not polish it for sharing or publishing.

## Steps

1. Add `summary` to page.json (fields in the table below). Use the decision data (`decisions`) and history (`rounds`) written during the discussion as they are.
2. Write orders for the finished-picture diagram (`summary.big.fig`) and the mechanism diagrams (`summary.mech[].fig`), and have the main agent draw them ([figure.md](figure.md)). Decision diagrams reuse the layers of the discussion page's fragments, so do not redraw them.
3. Write the tasks to `tasks.json` (format in "Task data" in [data.md](data.md); example: [../assets/tasks.example.json](../assets/tasks.example.json)).
4. Run `node <this skill>/scripts/build.mjs <discussion folder>`. It writes index.html, summary.html and tasks.js.
5. Run `node <this skill>/scripts/verify.mjs <discussion folder>/summary.html` once. It measures the before and after diagrams, frames and dark mode.

### `summary` fields

| Field | Chapter | Meaning |
|---|---|---|
| `title` `lead` | 0 | The outcome in one sentence; what will be built in one or two |
| `changes` | 0 | Only when rebuilding after a resume. One line per change since the previous version |
| `big` | 1 | The large finished-picture diagram `{title, lead, fig}`. Draw the state after all decisions on one sheet |
| `mech_title` `mech` | 2 | Mechanism diagrams `[{title, fig, full, steps}]`. Two to four, of different kinds. `full` is full width; `steps` describes frames |
| `groups` | 3 | Order and subtitles of decision groups `[{name, sub}]`. Same names as the decisions' `group` |
| `tasks_title` | 4 | Heading of the task chapter |
| `assumptions` `revisit` | 5 | Assumptions (impact if wrong) and conditions to revisit. One per line |
| `history_title` `end_notes` | 6 | Heading of the history diagram and the lines on the "End" tag |
| `open` | 7 | Notes on open or held items `[{id, reason, needs, tasks}]` (optional) |

## Chapter order, and who makes what

The build fixes the chapter order and frames (`assets/frame/summary-parts.html`).

| Chapter | Content | Made by |
|---|---|---|
| 0 Header | Goal, version, decisions, open items, tasks, progress, contents, links to `index.html` and `discussion.md` | The build (text from `summary.title` `lead`) |
| 1 Finished picture | One sheet showing the state after all decisions, inside the first screen | The main agent. Put decisions on the diagram as chips `<a class="chip" href="#d-q01">`; open ones as `class="chip open"` |
| 2 Mechanism | What is needed to read the decisions: structure, flow (step player), state transitions, time, tables of concrete examples | The main agent. Do not repeat a kind. One is enough for a small discussion |
| 3 Decisions | A card per decision: the diagram of what was decided and a one-line heading, a before/after switch, folded reason, inconvenience, rejected and compared options | The build (diagrams are layers of the discussion fragments; text from `decisions`) |
| 4 Tasks | Progress, checklist, dependency diagram, table, deliverables | The build (from tasks.json; see "Tasks" below) |
| 5 Rejected and assumed | Assumptions (impact if wrong) and conditions to revisit. Folded | The build (text from `summary.assumptions` `revisit`) |
| 6 History | Questions per round, number decided, choices that differ from the recommendation, interpretations and corrections | The build (draws from `rounds` and `decisions`; choices that differ from the recommendation appear automatically) |
| 7 Open and held | Undecided questions, recommendation, what is needed to decide, affected tasks (only when any) | The build (questions without decisions and `summary.open`) |

- Diagrams are the protagonist. Text is a one-line heading plus what is folded.
- Do not settle for one diagram; vary the kind to fit the subject. Do not line up small diagrams of the same type ([visual-design.md](visual-design.md)).
- There is no "next step" chapter. No answer fields, answer bar or inputs either (a page for reading only).
- Distinguish decisions, proposals, assumptions and open items by text as well as color (the build writes the tags).

## Tasks (tasks.json)

Derive the work from the decisions and write it to `tasks.json` in dependency order.

- tasks.json is the source of truth for tasks. Keep it in the same folder as the summary. Do not export to an outside task manager or plan.md.
- Size each task so that it ends with one deliverable and one way to check it. Give each task dependencies (`depends_on`), steps (`steps`), completion criteria, a way to check and the decisions it comes from (`from`).
- Work not stated in the discussion gets `proposal: true` (a dashed line and a "proposal" tag in the diagram). Write completion criteria as states you can check by looking.
- Put the agent's procedure (`for_agent`) at the top. Use the seven lines of the example; only the task.mjs path changes per discussion.
- This step is automatic, so do not investigate code down to files and lines. File names that came up in the discussion may be written.
- Agents write tasks.json with `node <this skill>/scripts/task.mjs <discussion folder>` (never by hand). Each write rewrites tasks.js, and an open summary redraws chapter 4 and the header's progress within seconds (also when opened as file://). Tasks that can be taken now and whose files do not overlap appear in chapter 4 as "can run side by side". Use this when the owner explicitly asks for subagents in parallel ("Running side by side" in [data.md](data.md)).

## After making it

- Bring verify.mjs to ✗0.
- Open one PC screen in the built-in browser and check diagrams, overflowing text, links, folding, the before/after switch and jumping from chips.
- Add one line to "Where to look next" in discussion.md saying `summary.html` (vN) was made.
- In the chat, briefly give the summary.html link and the number of decisions, open items and tasks. Do not repeat the page.
