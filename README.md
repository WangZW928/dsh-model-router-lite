# Model Router Lite · 轻量模型路由

[中文说明](./README.zh.md) · [Releases](https://github.com/WangZW928/dsh-model-router-lite/releases) · [Issues](https://github.com/WangZW928/dsh-model-router-lite/issues)

**Task-based model preferences for native DSH subagents.**

After setup, the parent agent is guided to choose an authorized model for each fresh subagent task. No extra routing-model call, scheduler, or dashboard.

## What changes?

| Without this plugin's policy | With model permission and preferences configured |
| --- | --- |
| A subagent normally inherits the parent/default model when no route is specified. DSH already supports explicit model selection. | Routine tasks, complex work, and independent reviews receive your chosen model preferences. |
| You give model-selection instructions yourself. | The parent gets a short, reusable policy and checks the native allowed-model catalog before explicitly routing. |
| The main conversation keeps its selected model. | Still unchanged. Only fresh `subagent` calls are covered. |

```text
Task → parent agent classifies it
       ├─ routine → your routine model preference
       ├─ complex → your complex model preference
       └─ review  → your review model preference

High risk / uncertainty → complex takes priority
Missing default preference → inherit parent model
```

**This is advisory prompt guidance, not enforced routing.** It does not benchmark models or guarantee lower cost, greater speed, or better answers. Explicit user choices take priority when authorized; an unavailable explicit choice must be reported, not silently replaced.

## Install

Requires DSH **0.2.1-rc.5** or compatible 0.2.x stable releases. Use your active profile's plugin manager to install the [public npm package](https://www.npmjs.com/package/dsh-model-router-lite):

```text
dsh-model-router-lite@0.1.0
```

For a CLI-managed installation:

```sh
dsh plugin --profile YOUR_PROFILE add dsh-model-router-lite@0.1.0
```

Alternatively, install the [prebuilt GitHub release archive](https://github.com/WangZW928/dsh-model-router-lite/releases/download/v0.1.0/dsh-model-router-lite-0.1.0.tgz). Replace `YOUR_PROFILE` with the actual profile. Desktop users should install through the app, not assume their profile is `web`. No build or install scripts are shipped.

Public npm/GitHub availability is separate from catalog acceptance and index synchronization. Track the [market submission](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/11758) for its current review status.

## Set up once

**Installing alone does not select different models.** Public defaults contain no model IDs and grant no permissions.

1. Configure providers/models in DSH. In the native Subagent model-selection settings, explicitly authorize the routes you want to use. Cross-provider tasks send their child-task context to the chosen provider.
2. Set this plugin's `routes` in its native plugin configuration. Use exact `provider` and `model` IDs from DSH, not display names. Each category accepts at most one preference; omitted categories inherit the parent model.
3. Start a **new top-level conversation** with Standard, PTC, or Cordis. Existing conversations keep their recorded permission snapshot.

Example plugin config — replace these placeholders with authorized IDs:

```yaml
enabled: true
routes:
  - task: routine
    provider: YOUR_PROVIDER_ID
    model: YOUR_ROUTINE_MODEL_ID
  - task: complex
    provider: YOUR_PROVIDER_ID
    model: YOUR_COMPLEX_MODEL_ID
  - task: review
    provider: YOUR_PROVIDER_ID
    model: YOUR_REVIEW_MODEL_ID
```

- `routine`: bounded lookup, extraction, summaries, mechanical edits.
- `complex`: implementation, architecture, hard debugging, uncertain or high-risk work.
- `review`: independent review of ordinary-risk work; high-risk review belongs to `complex`.

Ask normally: **“Split the independent research and implementation work into subagents where useful. Briefly explain each model choice.”** The agent need not delegate when it can finish the task directly.

## Boundaries

- Uses native `list_subagent_models` lazily and native `subagent` parameters; it creates no tools, background jobs, telemetry, or network calls of its own.
- Shows guidance only in scopes exposing native model-selection arguments and the discovery tool. No fork, Team, Workflow, main-model, or Minimal-preset routing.
- Unavailable/incompatible default preferences fall back to the parent route. Partially executed work must be reconciled before retrying.
- Profile-wide Host plugin, not workspace-only. Disabling the plugin removes guidance; it does not revoke permissions you granted in DSH or rewrite existing session snapshots.
- No automatic authorization, provider discovery expansion, credential access, or hard security boundary. No promise that the parent always follows the policy.

## Validation and development

Policy/schema/resource tests cover scope gating, exact IDs, duplicate rules, fallback instructions, safe defaults, and package contents. The original local implementation activated on DSH 0.2.1-rc.5; unit tests do **not** establish live provider connectivity, comparative quality, or real cross-model execution. Rendered GUI metadata and a full live cross-provider run remain unverified.

```sh
pnpm install --ignore-scripts
pnpm check
pnpm test
pnpm pack
```

MIT licensed. The branching-route icon is original artwork. Dependency: the DSH Schemastery peer; no compiled assets or lifecycle scripts are required.
