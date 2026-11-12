# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting instead:
**Security** tab → **Report a vulnerability**.

Include what you ran, what happened, and which version (tag or commit) you used.
You will get a first reply within 7 days.

## Supported versions

Only the latest tag receives fixes.

## Scope

The skill runs local scripts (`build.mjs`, `verify.mjs`, `task.mjs`). See "Caution" in the README for what they read and write.
Diagram fragments run in `node:vm`, which is not a sandbox. Building a fragment from an untrusted source is outside the supported use.

---

# セキュリティ

脆弱性は公開の Issue に書かず、GitHub の非公開の報告（**Security** タブ → **Report a vulnerability**）で知らせてください。
動かした物・起きたこと・版（タグか commit）を書いてください。7日以内に最初の返事をします。
直すのは最新のタグだけです。
