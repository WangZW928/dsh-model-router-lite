import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Config, apply } from '../index.js';

const root = new URL('../', import.meta.url);

test('public default adds zero prompt bytes and performs no service lookups', () => {
  const ctx = new Proxy({}, { get: (_target, key) => assert.fail(`unconfigured plugin accessed ${String(key)}`) });
  apply(ctx, Config());
});

test('public bundle never changes native model authorization or personal preferences', () => {
  const patch = readFileSync(new URL('cordis.patch.yml', root), 'utf8');
  assert.match(patch, /name: dsh-model-router-lite/);
  assert.match(patch, /routes: \[\]/);
  assert.doesNotMatch(patch, /subagent-model-selection-settings|allowedModels:|provider:|model:|kimi-coding|openai-codex|@local\//);
});

test('public manifest is discoverable, licensed and points at its source', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  assert.notEqual(pkg.private, true);
  assert.equal(pkg.name, 'dsh-model-router-lite');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.publishConfig.access, 'public');
  assert.ok(pkg.keywords.includes('dsh-plugin'));
  assert.equal(pkg.repository.url, 'git+https://github.com/WangZW928/dsh-model-router-lite.git');
  for (const name of ['README.md', 'README.zh.md', 'LICENSE', 'assets/icon-180.png']) {
    assert.ok(readFileSync(new URL(name, root)).length > 0);
    assert.ok(pkg.files.includes(name));
  }
});
