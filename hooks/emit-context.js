#!/usr/bin/env node
// GitHub Copilot CLI sessionStart hook.
//
// Contract (docs.github.com/en/copilot/reference/hooks-reference):
// the sessionStart event may inject `additionalContext` into the new
// session by writing a JSON object with that key to stdout. This is the
// only hook event in the current reference whose output is documented as
// affecting session context, so it is the single injection point HainaCode
// needs — no per-turn re-injection hook is used.
'use strict';

const fs = require('fs');
const path = require('path');

const INSTRUCTIONS_PATH = path.join(__dirname, '..', 'instructions', 'core.md');

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
    // than failing. The reason still goes to stderr, which Copilot CLI
    // doesn't read as hook output, so it's safe for manual debugging.
    process.stderr.write(`[HainaCode] Failed to load instructions: ${err.message}\n`);
    return;
  }
  if (!text) return;
  process.stdout.write(JSON.stringify({ additionalContext: text }));
}

main();

module.exports = { readInstructions, INSTRUCTIONS_PATH };
