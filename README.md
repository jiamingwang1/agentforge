# AgentForge 🚀

**AI Agent一键部署平台 — Deploy AI Agents in One Command**

> "We run 4 AI employees ourselves. Now you can too."

## 问题

部署AI Agent太复杂：
- 选框架？OpenClaw vs n8n vs Dify vs AutoGPT？
- 配依赖？向量DB、消息队列、API keys、SSL证书...
- 维运维？升级、监控、日志、备份...

大多数人在第一步就放弃了。

## 解决方案

```bash
curl -fsSL https://agentforge.dev/install | sh
agentforge deploy openclaw    # 部署OpenClaw AI员工
agentforge deploy n8n         # 部署n8n自动化
agentforge deploy dify        # 部署Dify AI应用
```

一条命令，完整AI Agent栈就绪。包含所有依赖，自动SSL，开箱即用。

## 支持的AI Agent框架

| 框架 | 类型 | 状态 |
|------|------|------|
| OpenClaw | AI员工/助手 | 🟢 优先 |
| n8n | 工作流自动化 | 🟡 计划中 |
| Dify | AI应用平台 | 🟡 计划中 |
| LobeChat | AI对话 | 🟡 计划中 |
| AutoGPT | 自主Agent | 🟡 计划中 |
| CrewAI | 多Agent协作 | 🟡 计划中 |

## 技术架构

```
┌─────────────────────────────────────────┐
│              AgentForge CLI            │
├─────────────────────────────────────────┤
│  Agent Registry   │  Config Engine      │
│  (框架清单+版本)   │  (交互式配置向导)    │
├─────────────────────────────────────────┤
│  Docker Compose Generator               │
│  (根据框架生成完整compose文件)            │
├─────────────────────────────────────────┤
│  Dependency Resolver                     │
│  (向量DB/Redis/PostgreSQL/Caddy自动选配) │
├─────────────────────────────────────────┤
│  Deploy Engine                           │
│  (Docker/Podman, 健康检查, 自动重启)     │
├─────────────────────────────────────────┤
│  管理面板 (可选)                          │
│  (状态监控/日志/更新/备份)               │
└─────────────────────────────────────────┘
```

## 差异化

| | AgentForge | Coolify/CapRover | 手动Docker |
|---|---|---|---|
| 目标 | AI Agent专用 | 通用PaaS | 啥都行 |
| 学习曲线 | 1条命令 | 需理解PaaS | 需Docker知识 |
| AI依赖 | 自动配 | 手动加 | 全手动 |
| 模板 | AI框架专属 | 通用 | 无 |
| 配置向导 | AI场景优化 | 通用 | 无 |

## 定价

- **Free**: 1个Agent，社区支持
- **Pro $19/月**: 5个Agent，自动更新，邮件支持
- **Team $49/月**: 无限Agent，优先支持，自定义模板

## 路线图

### Phase 1 — CLI + OpenClaw (2周)
- [ ] CLI工具 (install/deploy/status/logs/update)
- [ ] OpenClaw一键部署模板
- [ ] 自动SSL (Caddy)
- [ ] 基础健康检查

### Phase 2 — 更多框架 (4周)
- [ ] n8n / Dify / LobeChat 模板
- [ ] 交互式配置向导
- [ ] 管理Web面板
- [ ] Discord通知

### Phase 3 — 商业化 (6周)
- [ ] 落地页 + 注册系统
- [ ] 付费功能（自动备份、团队协作）
- [ ] 文档站
- [ ] Product Hunt发布

## 团队

- **阿诺 (CTO)** — 架构设计、CLI开发
- **雷霆** — 数据采集、市场验证
- **小助 (CEO)** — 产品方向、商业化

---

*Built by a team of AI employees. We dogfood our own product.* 🐕
