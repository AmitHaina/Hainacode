#!/usr/bin/env node
// SessionStart hook, shared by GitHub Copilot CLI and Codex CLI.
//
// Copilot CLI contract (docs.github.com/en/copilot/reference/hooks-reference):
// the sessionStart event may inject `additionalContext` into the new
// session by writing a JSON object with that key to stdout. This is the
// only hook event in the current reference whose output is documented as
// affecting session context, so it is the single injection point HainaCode
// needs — no per-turn re-injection hook is used.
//
// Codex CLI reuses the same script but expects the context wrapped in
// `hookSpecificOutput` instead of a top-level `additionalContext` key.
// Codex sets PLUGIN_DATA for every plugin hook; Copilot CLI sets
// COPILOT_PLUGIN_DATA instead, so the two are distinguishable at runtime.
'use strict';

const fs = require('fs');
const path = require('path');

const INSTRUCTIONS_PATH = path.join(__dirname, '..', 'instructions', 'core.md');
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

function readInstructions() {
  return fs.readFileSync(INSTRUCTIONS_PATH, 'utf8').trim();
}

function main() {
  let text;
  try {
    text = readInstructions();
  } catch (err) {
    // A missing or unreadable instructions file must never block session
    // start. Emit nothing on stdout (that would corrupt the hook's JSON
    // contract): the session proceeds without HainaCode context rather
    // than failing. The reason still goes to stderr, which neither host
    // reads as hook output, so it's safe for manual debugging.
    process.stderr.write(`[HainaCode] Failed to load instructions: ${err.message}\n`);
    return;
  }
  if (!text) return;
  if (isCodex) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }));
    return;
  }
  process.stdout.write(JSON.stringify({ additionalContext: text }));
}

// Only run as a side effect when executed directly (`node emit-context.js`
// via the sessionStart hook or the test's execFileSync). Guarding this means
// requiring the file as a module — as its exports below already imply is
// supported — doesn't trigger a stdout write as a side effect.
if (require.main === module) {
  main();
}

module.exports = { readInstructions, INSTRUCTIONS_PATH };
