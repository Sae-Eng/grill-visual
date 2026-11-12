---
name: grill-visual
description: Settle the open questions of a plan or design in short back-and-forth rounds while looking at an illustrated HTML page together. Builds a beginner-friendly overview, a dependency map of the questions, a diagram, illustration or step-by-step player for every question, and before→after diagrams of each decision; updates the same page after every answer, and when done writes summary.html with the decisions and tasks. Answers are multiple choice plus a note, copied from an always-visible answer bar and pasted back. Use for "grill me with diagrams", "discuss this in HTML", "settle this plan visually". Do not use when only an explanation is needed and nothing has to be decided.
---

# Settle a plan while looking at diagrams

Combine questions designed to carry background, issue, options and a recommendation for each item with large diagrams and plain explanations.
First build an HTML page that lets a first-time reader see "what is being decided" and "what changes with each choice",
then use that page as the shared material for the discussion. Everything needed is in this skill.

The page is assembled. The model writes only the data of questions and decisions (`page.json`) and diagram fragments (`fig/`).
`scripts/build.mjs` inserts the foundation tokens.css, the frame CSS and JS, the answer fields and the answer bar. The main agent draws a diagram for each question.

## Invocation

`$grill-visual [plan, document or questions] [q=N] [r=N]`

- Without a target, use the plan in the conversation. If the target cannot be identified, ask only for that.
- By default there is no limit on the number of questions or rounds. End when the user says "done" or nothing is left open.
- Treat `q` (total questions) and `r` (rounds) as limits only when given.
  If 0 is given, ask nothing and write the issues and recommendations up as a document.
- When resuming a discussion, carry over the question count, answers and open items from page.json and discussion.md.

## Before asking

Read the target code, documents and related records, and separate the current state, the goal, what is decided and what is unconfirmed.
Look up whatever can be looked up. Do not re-ask what is already decided unless there is a new contradiction or a changed condition.
Limit questions to the user's intent, priorities, scope and acceptable inconvenience.

First list the issues in order of impact and give them stable IDs.
Give each issue its background, impact, ease of undoing and the IDs it depends on.
Put things that are costly or far-reaching to change later (visibility, deletion, data formats, external dependencies) at the top.
If nothing is open, do not pad with questions; write a summary of the decisions.

## Where files go, and what to read

Decide the folder in this order: a folder named in the invocation, the project's rules for artifacts, then `artifacts/grill-visual/<topic>/` under the working directory.
If the owner does not want it in the repository, tell them to add that folder to `.gitignore`.
Use a separate folder for a different discussion instead of overwriting. Within the same discussion keep URLs and IDs and update in place.

```
artifacts/grill-visual/<topic>/
├── page.json       questions, decisions, history (written by the model)
├── fig/qNN.svg     diagram fragment per question (written by the main agent; numeric charts may be .json, scenes may be .js)
├── discussion.md   the record (written by the model)
├── index.html      the assembled discussion page (written by build.mjs; never edit by hand)
├── summary.html    the assembled summary (same)
└── tasks.json      when done. The source of truth for tasks (written by the model, updated by agents through scripts/task.mjs; build.mjs writes tasks.js)
```

- The first time only, read the foundation map and 01 (preferences and principles) and 02 (look). The foundation is in `assets/foundation/` inside this skill (README.md is the map); if it is missing, use the neighbouring `html-foundation` skill (SKILL.md is the map). Choose a direction from the subject and write it to `direction` in page.json (`blueprint` when unsure).
- The first time only, read [references/data.md](references/data.md) (the shape of page.json, fragments, orders and tasks.json) and [references/visual-design.md](references/visual-design.md) (how the discussion page presents things).
- Do not read the frame CSS, JS and templates (`assets/frame/`). The build inserts them and keeps their shape.
- Examples: [assets/page.example.json](assets/page.example.json) (a made-up discussion, "add notifications to a to-do app", 6 questions and 6 decisions), [assets/fig.example.svg](assets/fig.example.svg) (an SVG example: one base drawing and three option layers), [assets/fig.example.js](assets/fig.example.js) (an example drawn with parts), [assets/tasks.example.json](assets/tasks.example.json).

## What the page contains

The build lays out page.json in this order. The model provides the data and diagrams for each item.

1. **What the page decides.** The goal in one sentence (`title`) and what this round decides (`lead`). The build shows version, round, questions asked and decisions.
   Write `limits` only when `q`/`r` were given; "(limit 12)" is added.
2. **Dependency map of the issues.** Shows which issues are decided, current or later. Do not draw it. The build draws tags and lines from `map.nodes` (ID and short name) and each question's `after`, colors the state with color and text, and lets each tag jump to its question.
   Put a picture of how the target works in the first section's figure (`intro`). Diagnostics and similar sections go in `intro`. Keep section figures to one per round (the number of figures directly drives output and time).
3. **This round's questions.** Six by default, eight at most. Push issues waiting on a prerequisite to later. Use fewer when there are few independent questions. Only questions awaiting an answer appear here in full.
4. **Overall note.**
5. **Decided and skipped questions.** The build folds each one and shows only its title and a "Decided (A)" or "Skipped" tag, so they are not confused with the questions to answer now. Opening one shows the original diagram and options; jumping from a tag or a decision link opens it.
6. **Before→After of each decision.** For each decision, show the very thing that changes, before and after, side by side (`decisions[].before/after` point to different layers of the same fragment).
   Fold the reason, the accepted inconvenience and the rejected options.
7. **Always-visible answer bar.** Fixed at the bottom of the screen. Links to the IDs of this round's questions not yet answered.

### Clear and still enough to decide

- Put a diagram that explains the content on every question. State the actors, what arrows mean and the result. No decorative diagrams.
- Make scene illustrations, realistic UI mock-ups and analogies the standard means of expression.
  Use charts when numbers are backed by evidence. These are examples, not a closed list.
- Questions that follow an order or movement become a step player (`data-frame`/`data-step` in the fragment and `steps` in the question). ▶ advances one frame; it plays automatically only when "Play" is pressed.
- When the change caused by a choice helps the decision, switching options changes the same example. **Draw the base once and put only what differs between options in layers (`<g data-layer>`).** The option buttons and the choice swap the layers.
- Use everyday words and concrete examples. Analogies are a supplement; also state the real behaviour and the important conditions.
- Put detailed background and technical grounds in `details`.
  Keep the main inconvenience, cost and risk of each choice and the reason for the recommendation readable without opening anything (`pros` `cons` `why`).
- Do not mix up "confirmed fact", "proposal" and "unconfirmed" with "decided" and "awaiting answer".
  Show state in text as well as color. Never make the recommended option look selected or decided.
- The page is meant for a PC. Design and check for phones only when that is an explicit requirement.

### One question

Write each question as one entry in `questions` in page.json (fields are in data.md). The build adds the stable ID and the in-page anchor.

- **Background (`background`):** what is known and concrete examples. Separate evidence from assumptions.
- **Issue (`issue`):** what is undecided and which operation, display or practice the answer changes.
- **Diagram (`fig`) and order (`order`):** a diagram conceived for this issue. Write in at most two lines the difference to show, the means, the protagonist and the layers before drawing.
- **Options (`options`):** A/B/C and so on, options whose differences can be compared. Give each its advantages and the inconvenience it accepts. Use `multi` for questions with several choices.
- **Recommendation (`recommended` `why`):** the option that fits the current goal and why. Revisit it if the premises change.
- **The note field and the "Hold" button** are added by the build.

Ask a dependent question only after the prerequisite is answered.
Failing examples: output that is only a conclusion and questions. A question whose background is one line. A recommendation without grounds.

### Answer format (fixed)

The build inserts the answer fields (radio buttons or checkboxes, Hold, note) and the answer bar from `assets/frame/`. Do not change their shape or behaviour.

- The answer bar gathers choices and notes as lines like `Q01: A (name)` and `  Note: …` in `#answer-text`. Empty notes are not output.
- "Copy answers" puts it on the clipboard with one press, the same in Claude's built-in browser (which opens local files as a `data:` copy and has no clipboard API) and when opened directly as file://.
  The success message appears only after real success; only when every method fails does it select the text and ask for a manual copy.
- The answer memo is an unsent draft and does not count as a decision. The bar says it disappears on reload.

## One round

The first round and every later round follow the same steps. Do not rewrite the whole page; write only the parts that changed.

1. **Read the answers.** Use the pasted answers or the answers in the chat. If a built-in browser can read the page, you may read `#answer-text` directly.
2. **Update the record and data.** Record the answers and their meaning in `discussion.md`, and change only what changed in page.json (version, round, decisions added to `decisions`, the next questions, `rounds`). Write an order (`order`) for each new question.
3. **Draw the diagrams.** The main agent writes the new questions' diagrams and any diagrams to redraw to `fig/` (do not draw the dependency map; add to `map.nodes` when issues grow). Write all new diagrams in one message with parallel Write calls (each call re-reads the whole conversation, so the number of calls directly becomes cost and time). Drawing rules and the fragment format are in [references/figure.md](references/figure.md). Do not redraw diagrams that did not change.
   Do not hand diagrams to subagents. Each helper re-reads the documents and scripts, and the output and cost per diagram became several times that of the main agent.
4. **Build.** Run `node <this skill>/scripts/build.mjs <discussion folder> && node <this skill>/scripts/verify.mjs <discussion folder>/index.html` as one command (so step 5 is done in the same call). A broken page.json or a missing diagram stops the build with the location of the field; fix it.
5. **Check.** verify runs the measures across every option, every frame and dark mode, presses the answer fields and reads them, presses "Copy answers" once on a page with the clipboard API removed to see whether it copies, and takes one screenshot.
   If there is a ✗, the main agent fixes that diagram or page.json with Edit and runs from step 4 again. Do not Read page.json or diagrams back (everything that enters the conversation makes later calls heavier). Read the screenshot.
6. **Hand over.** Open the page in front of the owner and briefly give the link, this round's issues and how to answer. Do not read the opened page's text into the conversation (no `get_page_text` or `read_page`; check the look with verify's screenshot). Do not repeat the HTML in the chat.
   - In Claude's desktop app, open it in this order. Local files are shown as a snapshot taken when opened, and reopening the same URL or reloading does not show a new version.
     1. If `tabs_context` shows a tab of the same file, close it with `tabs_close`. Closing also discards that tab's answer memo, so close it only after reading in step 1.
     2. Pass `file://<absolute path>` to `preview_start`.
     3. Bring the browser pane to the front with `show_pane` (`pane: "preview"`). While hidden, the owner cannot see it even if it is open. If it says it is not open in any window, tell the owner it was opened in the browser pane and give the file path.
   - Keep pages under the working folder. A page under `/tmp` could not be read by the tools even when opened in the built-in browser (confirmed 2026-11-11).
   - In other environments, open it in that environment's built-in browser. Without one, open it in the default browser (`open` on macOS, `xdg-open` on Linux).

Explain these three ways to answer.

1. Choose on the page and paste via "Copy answers" on the answer bar (the default).
2. Write `Q01:A, Q02:C`, free text or Hold directly in the chat.
3. Where a built-in browser can read the page, the owner may choose on the page and just send "answered" in the chat. The agent reads `#answer-text`. If it cannot, ask for 1.

If a question tool that shows options is available, it may be used alongside only when this round has four or fewer questions within the tool's limit.
If the dialog is closed, wait for answers on the page.

If the user named the issues, start within that range. If the range is also left to you, pick the issues with the largest impact.

### After receiving answers

- Add decided questions to `decisions`. The build adds the "Decided (A)" tag. Point `before` and `after` to layers of that question's fragment. If there is no layer for the before state, the main agent adds one to the fragment.
- Confirm only what was answered and leave the rest unanswered. A request for explanation gets more explanation under the same ID and does not count as a new question.
- When the interpretation of an answer affects the conclusion (for example Hold contradicts the note), write the interpretation taken in `rounds[].notes` and discussion.md and ask to be corrected if wrong.

After each batch of answers, review what is open or on hold, and the issues that the answers or notes made concrete.
If issues needing the user's judgement remain, continue with the next batch on the same page.
If a note contains a request, decide whether it becomes a new issue or goes into a decision.
Answers to the current questions alone do not end the whole discussion.
If no further judgement is needed, give the reason and the remaining assumptions and end (`status: "ended"` and `end`). Do not ask questions to fill a count.

## Limits and records

Only when `q`/`r` are given, record `q` as the number of decision questions asked and `r` as the number of batches.
When one batch asks to accept several items, count each as a question.
When a limit is reached, stop digging, list the remaining issues as assumptions with impact, recommendation and the condition to revisit,
and ask once for approval as "proceed assuming the recommendations". Record this closing confirmation separately from the normal question slots.
Leave unaccepted items on hold. Never treat no answer as approval.
Record the number of questions and rounds used even without limits.

`discussion.md` is the record of the discussion and carries the same version number as page.json.
Create it at the start and keep at least the following.

- Goal, target documents, settled premises, issues and dependencies, questions and rounds used (and limits when given).
- Question ID, question text, options and recommendation shown, answer, note, what was adopted, reason.
- Assumptions and unconfirmed items with their impact, rejected alternatives and why, conditions to revisit.
- The question ID to look at next, or why the discussion ended. If there are no decisions yet, write "no decisions yet".

If there is a plan document, reflect the agreed decisions in it and refer to it from the record.
Discussing something does not mean it is implemented; implementation and other work stay within what the conversation entrusted.

## When done, write the summary

When the discussion ends (nothing open, "done", or a limit reached) and there is at least one decision, write `summary.html` in the same folder without asking.
With zero decisions, do not. The summary is also assembled: add `summary` to page.json (sentences, the finished-picture and mechanism fragments, assumptions, conditions to revisit), write the tasks to `tasks.json`, and run `build.mjs`.
The build makes the chapter frames, decision cards, the task chapter and the history diagram. The steps are in [references/summary.md](references/summary.md).

When working on tasks after the summary, follow `for_agent` in tasks.json.
- Do not write tasks.json by hand; write it with `node <this skill>/scripts/task.mjs <discussion folder>` (it takes a lock, so two writers at once do not corrupt it). When taking a task use `doing --by <worker>`, which records the worker in `run_by`.
- Tasks that can be taken now are done one by one by the parent, lowest number first. Hand them to subagents only when the owner says so explicitly.
- When handing them over, only tasks whose files do not overlap ("can run side by side" in chapter 4 of the summary). A subagent writes only `doing` and `step` for its own task; the parent writes `done` after checking `how_to_check`. The format and the list of operations are in "Writing" and "Running side by side" in [references/data.md](references/data.md).

## Check before finishing

- verify.mjs reports ✗0. For ! run html-check, look at the content and decide whether to fix it.
- The dependency map links to the questions, every question has a diagram explaining it, and the difference between options and the reason for the recommendation are clear (check with the screenshot and the one screen opened at hand-over).
- Diagrams are not copies of the examples or of an earlier round. The same kind of diagram does not repeat throughout a round (compare the "means" in the orders).
- Counts, order and connections used in the explanation match what the diagram actually shows (verify does not compare text and diagram; check with the screenshot and the screen at hand-over).
- Version, IDs, decisions and unanswered items agree across page.json, discussion.md and the page.
- No answers chosen during checking remain on the handed-over page (verify presses in its own browser and leaves nothing). Anything pressed in the built-in browser is cleared by reloading.
- If no browser is available, report with verify's result and screenshot, and say the real screen was not checked.
- Briefly give the HTML link, the decisions reflected, the issues left and where to answer next.
  If only a document was requested, end with that document without starting the actual questions.
