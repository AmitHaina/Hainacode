# HainaCode

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/xAf9gNQBxG)
[![Release](https://img.shields.io/github/v/release/AmitHaina/Hainacode?style=flat-square)](https://github.com/AmitHaina/Hainacode/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A514-brightgreen?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](#how-it-works)

A GitHub Copilot CLI and Codex CLI plugin that makes the agent understand
a problem before changing code, instead of jumping straight to an
implementation.

## What it does

On every new session, HainaCode loads one rule set into context:

- Understand the actual goal before writing code. Investigate before
  implementing.
- Never guess silently: facts come from code, tests, and docs; anything
  unverifiable becomes a declared assumption (or, for irreversible actions,
  one focused question) — never a hidden guess.
- Treat a request as the goal, not a literal spec. Tell requested changes
  apart from necessary ones; say so instead of adding blindly.
- Default to action on legitimate work: no reasonless refusals, warnings,
  or lectures. Blocked parts are isolated; everything else gets done.
- Fix the root cause with the smallest correct change, scoped to the actual
  defect. Adjacent defects get one line, not a refactor.
- Reuse existing code and dependencies before writing something new.
- Never drop validation, error handling, security, or accessibility for
  the sake of a simpler diff.
- Spend tokens like a budget: no echoing, no restating, changed hunks over
  file dumps.
- Verify results in proportion to the risk of the change, and never claim
  something was tested if it wasn't.

## How it works

The plugin has one moving part: a `SessionStart` hook. When a new session
starts, `hooks/emit-context.js` reads `instructions/core.md` and injects
it into the session as context. That file is the only place the rules
live, so updating behavior means editing one file.

The same script serves both hosts. Copilot CLI and Codex CLI expect
different JSON shapes on stdout, and the two are distinguishable by which
env var the host sets on the hook process (`COPILOT_PLUGIN_DATA` vs.
`PLUGIN_DATA`):

- Copilot CLI: `{ "additionalContext": "..." }`
- Codex CLI: `{ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "..." } }`

```
HainaCode/
├── plugin.json                       # Copilot CLI plugin manifest
├── hooks.json                         # Copilot CLI sessionStart hook declaration
├── .codex-plugin/plugin.json          # Codex CLI plugin manifest
├── .github/plugin/marketplace.json    # lets this repo be added as a marketplace source
├── hooks/
│   ├── emit-context.js               # reads core.md, sends it to the session (both hosts)
│   └── codex-hooks.json               # Codex CLI SessionStart hook declaration
├── instructions/
│   └── core.md                       # the actual rules
└── test/
    └── verify-hook.js                 # checks the hook works for both hosts
```

## Installation

### Copilot CLI

```bash
copilot plugin marketplace add AmitHaina/Hainacode
copilot plugin install hainacode@hainacode
```

In an interactive Copilot CLI session, use the slash equivalents:

```
/plugin marketplace add AmitHaina/Hainacode
/plugin install hainacode@hainacode
```

To install from a local clone instead:

```bash
copilot plugin marketplace add /absolute/path/to/HainaCode
copilot plugin install hainacode@hainacode
```

Check it loaded:

```bash
copilot plugin list
```

You should see `hainacode@hainacode` in the list. Start a new Copilot CLI
session and the rules in `instructions/core.md` are active automatically,
no further setup needed.

To remove it:

```bash
copilot plugin uninstall hainacode
copilot plugin marketplace remove hainacode
```

### Codex CLI

```bash
codex plugin marketplace add AmitHaina/Hainacode
codex plugin add hainacode@hainacode
```

Run `codex`, open `/hooks`, review and trust the `SessionStart` hook, then
start a new thread — `instructions/core.md` loads automatically.

`node` needs to be on the non-interactive shell's PATH for the hook to
run (a common gap for Nix/nvm setups); if it isn't, the hook stays quiet
instead of erroring on every session.

To remove it:

```bash
codex plugin remove hainacode
```

## Usage

Nothing to type. There is no slash command and no mode to switch. Once
installed, every new session picks up the rules automatically. Just use
Copilot CLI normally, ask for a change, and it will investigate and
verify before treating the request as done.

## Updating the rules

Edit `instructions/core.md` and bump the version in `plugin.json`,
`.codex-plugin/plugin.json`, and `.github/plugin/marketplace.json`, then
push. Installed copies don't auto-update, users need to pull the new
version themselves:

```bash
copilot plugin marketplace update hainacode
copilot plugin update hainacode
```

Or update everything installed at once:

```bash
copilot plugin update --all
```

Check the new version landed:

```bash
copilot plugin list
```

Codex CLI: `codex plugin marketplace update hainacode && codex plugin update hainacode`.

## Testing changes

```bash
node test/verify-hook.js
```

This confirms the hook emits the contents of `core.md` correctly for both
Copilot CLI (`additionalContext`) and Codex CLI (`hookSpecificOutput`),
and that it fails silently instead of blocking a session if the file is
ever missing.
