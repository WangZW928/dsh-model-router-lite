# Changelog

## 0.1.0

First public release / 首个公开版。

- Task preferences for fresh native subagents: routine, complex and ordinary-risk review.
- Explicit user choices and native model-selection permissions take priority.
- No extra routing model, scheduler, network calls or custom tools.
- Public defaults grant no permissions and contain no model IDs; no prompt section is added until a preference is configured.
- English/Chinese documentation and metadata, original icon, MIT license.
- 19 unit tests; public archive install/uninstall smoke test on DSH 0.2.1-rc.5. Live cross-provider execution and GUI rendering remain unverified.

配置后，给子 agent 增加按任务类型选模型的建议；不更改主模型，不自动授权。此功能是提示策略，不是强制路由，不承诺降本、提速或质量提升。
