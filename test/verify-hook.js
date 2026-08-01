#!/usr/bin/env node
// Self-check for hooks/emit-context.js. Run: node test/verify-hook.js
//
// Verifies the hook's actual stdout contract (what Copilot CLI will read
// on sessionStart), not just its internal logic, and checks the
// fail-silent path when the instructions file is missing.
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const HOOK = path.join(__dirname, '..', 'hooks', 'emit-context.js');
const REAL_INSTRUCTIONS = path.join(__dirname, '..', 'instructions', 'core.md');

// 1. Normal case: real plugin files in place, hook must emit valid JSON
// with a non-empty additionalContext string.
const stdout = execFileSync('node', [HOOK], { encoding: 'utf8' });
const parsed = JSON.parse(stdout);
assert.strictEqual(typeof parsed.additionalContext, 'string');
assert.ok(parsed.additionalContext.length > 0, 'additionalContext must not be empty');
assert.ok(
  fs.readFileSync(REAL_INSTRUCTIONS, 'utf8').trim() === parsed.additionalContext,
  'emitted context must match instructions/core.md verbatim'
);

// 2. Missing-file case: hook must exit 0 with no stdout, never throw or
// block session start.
const tmpPlugin = fs.mkdtempSync(path.join(os.tmpdir(), 'hainacode-test-'));
fs.mkdirSync(path.join(tmpPlugin, 'hooks'));
fs.copyFileSync(HOOK, path.join(tmpPlugin, 'hooks', 'emit-context.js'));
// Deliberately no instructions/ directory created alongside it.
const emptyStdout = execFileSync('node', [path.join(tmpPlugin, 'hooks', 'emit-context.js')], {
  encoding: 'utf8',
});
assert.strictEqual(emptyStdout, '', 'missing instructions file must produce no stdout');
fs.rmSync(tmpPlugin, { recursive: true, force: true });

console.log('OK: emit-context.js emits additionalContext and fails silently when the instructions file is missing');
