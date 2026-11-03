import assert from 'node:assert/strict';
import test from 'node:test';
import { Config, apply, inject } from '../index.js';

test('Host Config defaults to enabled with inherited routing', () => {
  assert.deepEqual(Config(), { enabled: true, routes: [] });
  assert.deepEqual(inject, ['systemPrompt', 'tools']);
});

test('Host Config validates task enum and both exact IDs', () => {
  const valid = { routes: [{ task: 'routine', provider: 'kimi-coding', model: 'k3' }] };
  assert.equal(Config(valid).routes[0].model, 'k3');
  for (const route of [
    { task: 'unknown', provider: 'x', model: 'y' },
    { task: 'routine', model: 'y' },
    { task: 'routine', provider: 'x' },
    { task: 'routine', provider: 'x', model: '' },
  ]) assert.throws(() => Config({ routes: [route] }));
});

test('apply rejects duplicate preferences before registration', () => {
  const route = { task: 'routine', provider: 'x', model: 'y' };
  const ctx = { systemPrompt: { section: () => assert.fail('invalid config registered') } };
  assert.throws(() => apply(ctx, Config({ routes: [route, route] })), /unique task/);
});

test('Host entry registers the expected section with a validated Config', () => {
  const registrations = [];
  const ctx = { tools: { get: () => undefined }, systemPrompt: { section: (s) => registrations.push(s) } };
  apply(ctx, Config({ routes: [{ task: 'routine', provider: 'provider-a', model: 'model-a' }] }));
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].name, 'model-router-lite:routing');
  assert.equal(registrations[0].text({ scope: {} }), '');
});
