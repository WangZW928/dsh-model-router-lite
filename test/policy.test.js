import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { registerPolicy, renderPolicy, selectionIsVisible, validateRoutes, SECTION_NAME } from '../policy.js';

const routes = [
  { task: 'routine', provider: 'kimi-coding', model: 'k3' },
  { task: 'complex', provider: 'openai-codex', model: 'gpt-6-astra' },
  { task: 'review', provider: 'kimi-coding', model: 'k3' },
];
const selectable = { parameters: { properties: { provider: { type: 'string' }, model: { type: 'string' } } } };
const toolView = (entries) => ({ get: (name) => entries[name] });

test('valid preferences are copied and frozen without mutating input', () => {
  const input = structuredClone(routes);
  const result = validateRoutes(input);
  assert.deepEqual(result, routes);
  assert.notEqual(result[0], input[0]);
  assert.ok(Object.isFrozen(result[0]));
  assert.deepEqual(input, routes);
});

test('missing categories inherit rather than guess a model', () => {
  assert.deepEqual(validateRoutes(), []);
  const text = renderPolicy([]);
  assert.equal(text.split('\n').filter((line) => line.startsWith('- ') && line.includes('inherit the parent route')).length, 3);
  assert.ok(!text.includes('kimi-coding'));
});

test('reject duplicate tasks and unknown classifications', () => {
  assert.throws(() => validateRoutes([routes[0], routes[0]]), /unique task/);
  assert.throws(() => validateRoutes([{ ...routes[0], task: 'cheap' }]), /unique task/);
  assert.throws(() => validateRoutes(null), /at most one/);
  assert.throws(() => validateRoutes([...routes, routes[0]]), /at most one/);
});

for (const key of ['provider', 'model']) {
  test(`reject malformed ${key} while supporting namespaced model IDs`, () => {
    for (const value of ['', ' ', 'x\ny', 'x\ty', 'x\0y', 'x'.repeat(201), undefined, 42]) {
      assert.throws(() => validateRoutes([{ ...routes[0], [key]: value }]), /exact ID/);
    }
    assert.equal(validateRoutes([{ ...routes[0], model: 'vendor/model:latest' }])[0].model, 'vendor/model:latest');
  });
}

test('only actual native selection and discovery capability enables guidance', () => {
  assert.equal(selectionIsVisible(toolView({ subagent: selectable, list_subagent_models: {} })), true);
  assert.equal(selectionIsVisible(toolView({ subagent: selectable })), false);
  assert.equal(selectionIsVisible(toolView({ list_subagent_models: {} })), false);
  assert.equal(selectionIsVisible(toolView({ subagent: { parameters: { properties: {} } }, list_subagent_models: {} })), false);
  assert.equal(selectionIsVisible(toolView({ subagent: { parameters: { properties: { provider: {} } } }, list_subagent_models: {} })), false);
  assert.equal(selectionIsVisible(toolView({ spawn_teammate: selectable, subagent_fork: selectable, list_subagent_models: {} })), false);
});

test('tool checks use exactly the requesting scope, not the global view', () => {
  const scope = {};
  const tools = { get: (name, seenScope) => {
    assert.equal(seenScope, scope);
    return name === 'subagent' ? selectable : {};
  } };
  assert.equal(selectionIsVisible(tools, scope), true);
});

test('prompt encodes explicit choices, discovery, fallback, risk and partial-work safety', () => {
  const text = renderPolicy(routes);
  assert.match(text, /"provider":"kimi-coding","model":"k3"/);
  assert.match(text, /"provider":"openai-codex","model":"gpt-6-astra"/);
  for (const fragment of ['High risk or uncertainty', 'explicit user model choices', 'list_subagent_models', 'exact provider+model', 'omit provider/model', 'partial execution', 'no child started', 'fork, Team, or Workflow', 'not capability or price benchmarks', 'For configured preferences (not explicit user model requests)']) {
    assert.ok(text.includes(fragment), fragment);
  }
});

test('registration is a single scoped-gated section with no tools, hooks or state', () => {
  let section;
  const visible = new Set();
  const ctx = {
    systemPrompt: { section: (value) => { assert.equal(section, undefined); section = value; } },
    tools: { get: (name, scope) => visible.has(scope) ? (name === 'subagent' ? selectable : {}) : undefined },
  };
  registerPolicy(ctx, { routes });
  assert.equal(section.name, SECTION_NAME);
  assert.equal(section.interpolate, false);
  assert.equal(section.complete, undefined);
  assert.ok(Number.isFinite(section.order));
  assert.equal(section.text(), '');
  const active = {};
  const oldSession = {};
  visible.add(active);
  assert.equal(section.text({ scope: active }), renderPolicy(routes));
  assert.equal(section.text({ scope: oldSession }), '');
  visible.delete(active);
  assert.equal(section.text({ scope: active }), '');
});

test('disabled plugin registers nothing', () => {
  registerPolicy({ systemPrompt: { section: () => assert.fail('disabled') } }, { enabled: false, routes });
});

test('prompt budget remains small and no route directory is dumped', () => {
  const text = renderPolicy(routes);
  const bytes = Buffer.byteLength(text);
  assert.ok(bytes < 2600, `prompt budget: ${bytes}`);
  assert.ok(!text.includes('gpt-6-luna'));
  console.log(JSON.stringify({ policyBefore: { bytes: 0, tokenEstimate: 0 }, policyAfter: { bytes, tokenEstimate: Math.ceil(text.length / 4) }, estimate: 'ASCII characters / 4; not a provider tokenizer or full-session token count', newToolSchemas: 0 }));
});

test('package exports all runtime and display resources; no build/install scripts', () => {
  const root = new URL('../', import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  for (const name of ['index.js', 'policy.js', 'cordis.patch.yml', 'README.md', 'icon.svg', 'locale/en.json', 'locale/zh.json']) {
    assert.ok(statSync(new URL(name, root)).isFile(), name);
  }
  assert.equal(pkg.exports['./icon'], './icon.svg');
  assert.equal(pkg.exports['./locale/*.json'], './locale/*.json');
  for (const key of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(pkg.scripts[key], undefined);
  for (const language of ['en', 'zh']) {
    const locale = JSON.parse(readFileSync(new URL(`locale/${language}.json`, root), 'utf8'));
    assert.ok(locale.meta.title && locale.meta.description);
  }
  const svg = readFileSync(new URL('icon.svg', root), 'utf8');
  assert.ok(Buffer.byteLength(svg) < 256 * 1024);
  assert.match(svg, /<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.doesNotMatch(svg, /<script|<foreignObject|href=/);
});
