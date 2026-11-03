import z from '@deepseek-ai/schemastery';
import { registerPolicy, TASKS } from './policy.js';

export const name = 'model-router-lite';
export const inject = ['systemPrompt', 'tools'];

export const Config = z.object({
  enabled: z.boolean().default(true).description('Enable advisory task-to-model routing / 启用任务模型选择建议'),
  routes: z.array(z.object({
    task: z.union(TASKS).required().description('Task category / 任务类型'),
    provider: z.string().min(1).max(200).required().description('Exact authorized provider ID / 已授权供应商标识'),
    model: z.string().min(1).max(200).required().description('Exact authorized model ID / 已授权模型标识'),
  })).max(3).default([]).description('One preference per category; omitted categories inherit the parent model. This does not grant model permission. / 每类最多一条，未配置时继承主模型；此处不授予模型权限。'),
});

export function apply(ctx, config) {
  registerPolicy(ctx, config);
}
