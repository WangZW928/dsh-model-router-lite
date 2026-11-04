# 轻量模型路由 · Model Router Lite

[English](./README.md) · [下载版本](https://github.com/WangZW928/dsh-model-router-lite/releases) · [反馈问题](https://github.com/WangZW928/dsh-model-router-lite/issues)

**配置后，按任务类型建议原生子 agent 选择已授权模型。**

不额外调用分类模型，不增加调度器，不做独立面板。让主 agent 在拆任务时参考一套可复用的模型选择规则。

## 安装前后，有什么变化？

| 没有本插件的策略 | 完成授权与偏好配置后 |
| --- | --- |
| 不指定模型时，子 agent 通常沿用主模型/默认模型；DSH 本来就支持显式选择模型。 | 整理、复杂实现、独立审查可分别参考你配置的模型偏好。 |
| 需要自己反复交代如何选模型。 | 主 agent 收到简短规则，显式选模型前检查原生授权目录。 |
| 主对话使用已选模型。 | 保持不变，仅影响新建 `subagent` 的选择建议。 |

```text
任务 → 主 agent 判断类型
       ├─ 整理/提取/机械修改 → routine 偏好
       ├─ 复杂实现/排错     → complex 偏好
       └─ 普通独立审查     → review 偏好

高风险或不确定 → 优先按 complex 处理
默认偏好不可用 → 继承主模型
```

**这是建议，不是强制分流。** 不保证省钱、提速或提升答案质量。用户明确指定的模型优先，但仍需授权；明确指定不可用时应说明原因，而不是静默替换。

## 安装

需要 DSH **0.2.1-rc.5** 或兼容的 0.2.x 稳定版本。在当前 profile 的插件管理器中安装 [npm 公开包](https://www.npmjs.com/package/dsh-model-router-lite)：

```text
dsh-model-router-lite@0.1.0
```

CLI 用户：

```sh
dsh plugin --profile YOUR_PROFILE add dsh-model-router-lite@0.1.0
```

也可安装 [GitHub 预打包版本](https://github.com/WangZW928/dsh-model-router-lite/releases/download/v0.1.0/dsh-model-router-lite-0.1.0.tgz)。把 `YOUR_PROFILE` 换成实际 profile。Desktop 用户应通过应用安装，不要默认使用 `web` profile。安装包不含构建或安装脚本。

npm/GitHub 公开可下载、市场审核收录、索引更新是不同状态；能下载不等于已经被市场收录。当前审核状态见 [市场申请](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/11758)。

## 首次配置：三步

**仅安装不会自动分配不同模型。** 公开版不预设供应商或模型，不更改原生授权。

1. 在 DSH 配置供应商和模型，并在原生 Subagent 模型选择设置中明确授权。跨供应商委派会把子任务上下文发给对应供应商。
2. 在本插件的原生配置中填写 `routes`。使用 DSH 的精确 `provider` / `model` 标识，不是显示名称。每类最多一条，没配置的类别继承主模型。
3. **新开顶层对话**，使用 Standard、PTC 或 Cordis 预设。旧对话继续使用其创建时记录的权限。

配置示例；占位符必须换成你已授权的标识：

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

- `routine`：范围明确的查询、提取、整理、机械修改。
- `complex`：实现、架构、困难排错，以及不确定或高风险工作。
- `review`：普通风险的独立审查；高风险审查归入 `complex`。

正常提需求即可，例如：**“把独立的调研和实现部分合理分给子 agent，并简述选模型的原因。”** 不需要为了选模型强行使用 Workflow，也不要求每次都委派。

## 明确边界

- 按需使用原生 `list_subagent_models` 和 `subagent` 参数；不新增工具、后台任务、遥测或自己的网络请求。
- 只有当前作用域支持原生模型参数和目录工具时才显示策略。不改 fork、Team、Workflow 或主模型，不支持无委派能力的 Minimal 预设。
- 默认偏好缺失或不兼容时继承主模型；子任务执行了一部分后，应先核对成果再重试。
- Host 插件影响当前 profile，不只影响当前工作区。关闭插件只移除建议，不撤销你在 DSH 授予的权限，也不重写已有会话。
- 不自动授权新增模型或供应商，不访问凭证，不构成硬性安全边界，也不保证主 agent 每次都遵守建议。

## 验证与开发

策略、Config 和资源测试覆盖作用域隔离、精确标识、重复规则、回退说明、安全默认值与安装包内容。原本地实现已在 DSH 0.2.1-rc.5 激活；单元测试不等于验证了真实供应商连通性、模型优劣或跨模型执行。GUI 渲染和完整的真实跨供应商委派仍未验收。

```sh
pnpm install --ignore-scripts
pnpm check
pnpm test
pnpm pack
```

MIT 许可，分支路由图标为原创。依赖 DSH 同款 Schemastery peer，无需编译或运行安装脚本。
