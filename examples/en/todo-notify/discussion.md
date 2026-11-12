# Add notifications to a to-do app without making them noisy (v3 · 2026-11-12)

A sample for grill-visual. It is a discussion about a made-up app, and all numbers are examples.

## Goal and premises

- Goal: you can write a due time, but you only notice it by opening the app. Add notifications, without making them noisy.
- Already decided: a due time can include the hour.
- Used: 2 rounds, 6 questions (no limit given).

## Questions and dependencies

| ID | Question | Impact | Depends on |
|---|---|---|---|
| Q01 | Where to show it | High | — |
| Q02 | When to notify | Medium | Q01 |
| Q03 | When to ask permission | High | Q01 |
| Q04 | Daily limit | Medium | Q02 |
| Q05 | Actions on a notification | Medium | Q01 |
| Q06 | Quiet hours | Low | Q02 |

## Round 1 (v1)

- Q01 → B Device notification (as recommended)
- Q02 → B 1 hour before (as recommended)
- Q03 → B First due time set (as recommended)

## Round 2 (v2)

- Q04 → B Up to 3 + evening roundup (as recommended)
- Q05 → B Done and in 1 hour (as recommended)
- Q06 → B 22:00 to 7:00. Note "What about night due times?" → added to B: due times in that window are notified earlier, at 21:30

## Assumptions and conditions for revisiting

- Permission is more likely right after a due time is set (assumption). If fewer than half allow it, revisit Q03.
- 3 a day is not annoying (estimate). If the roundup goes unread, try Q04 option C.

## End (v3)

Nothing is left open. summary.html and tasks.json (6 tasks) were written. Nothing is built yet.
