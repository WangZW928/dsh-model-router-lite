/** Pure policy rendering; no network calls, settings writes, or scheduling. */
export const TASKS = Object.freeze(['routine', 'complex', 'review']);
export const SECTION_NAME = 'model-router-lite:routing';

const TASK_DESCRIPTIONS = Object.freeze({
  routine: 'bounded lookup, extraction, summaries, mechanical edits',
  complex: 'implementation, architecture, difficult debugging, uncertain or high-risk work',
  review: 'independent review of ordinary-risk work',
});

export function validateRoutes(routes = []) {
  if (!Array.isArray(routes) || routes.length > TASKS.length) {
    throw new TypeError('routes must contain at most one entry per task (routine, complex, review)');
  }
  const seen = new Set();
  return routes.map((route) => {
    if (!route || !TASKS.includes(route.task) || seen.has(route.task)) {
      throw new TypeError('Each route needs a unique task: routine, complex, or review');
    }
    for (const key of ['provider', 'model']) {
      const value = route[key];
      if (typeof value !== 'string' || !value.length || value.length > 200 || /[\s\x00-\x1f\x7f]/u.test(value)) {
        throw new TypeError(`${route.task}.${key} must be a nonempty exact ID without whitespace (max 200 characters)`);
      }
    }
    seen.add(route.task);
    return Object.freeze({ task: route.task, provider: route.provider, model: route.model });
  });
}

export function selectionIsVisible(tools, scope) {
  // Never expose routing guidance to an old session, restricted agent, fork-only
  // preset or Team-only scope that cannot actually pass native route parameters.
  const subagent = tools.get('subagent', scope);
  const properties = subagent?.parameters?.properties;
  return Boolean(properties?.provider && properties?.model && tools.get('list_subagent_models', scope));
}

export function renderPolicy(routes) {
  const byTask = new Map(validateRoutes(routes).map((route) => [route.task, route]));
  const preferences = TASKS.map((task) => {
    const route = byTask.get(task);
    const target = route ? JSON.stringify({ provider: route.provider, model: route.model }) : 'inherit the parent route (omit provider/model)';
    return `- ${task} (${TASK_DESCRIPTIONS[task]}): ${target}.`;
  });
  return [
    '# Native subagent model routing',
    'These are configurable preferences, not capability or price benchmarks. Do not delegate just to use another model.',
    'For fresh subagent calls, classify the task and use the matching preference below. High risk or uncertainty takes precedence over routine/review. Honor explicit user model choices only when authorized; if unavailable, report it rather than silently substitute.',
    ...preferences,
    'Before the first explicit route choice, use list_subagent_models to discover current allowed routes; reuse its result and refresh only on route errors. Select exact provider+model pairs from that catalog. Never infer cost, quality, or availability from a model name; check context/input compatibility when relevant.',
    'If a preferred route is absent or incompatible, omit provider/model to inherit the parent route and explain the fallback. Do not alter fork, Team, or Workflow semantics, force Workflow use, or change the main model.',
    'Briefly state the selected model and reason before delegating. Keep that choice for the child. For configured preferences (not explicit user model requests), a rejected creation may fall back once if no child started; after partial execution, reconcile work before any retry. Validate the result, not the model label.',
  ].join('\n');
}

export function registerPolicy(ctx, config = {}) {
  if (config.enabled === false) return;
  const routes = validateRoutes(config.routes ?? []);
  // Public installs are inert until users opt into at least one preference.
  if (routes.length === 0) return;
  const text = renderPolicy(routes);
  // systemPrompt.section owns its Cordis effect; unloading removes it. No
  // per-agent listeners/caches, request interception, or custom tools are needed.
  ctx.systemPrompt.section({
    name: SECTION_NAME,
    order: 85,
    interpolate: false,
    text: ({ scope } = {}) => selectionIsVisible(ctx.tools, scope) ? text : '',
  });
}
