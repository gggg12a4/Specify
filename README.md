# Specify Web

基于 Vue 3 的 AI Agent 平台前端，对接 Specify 后端（JeecgBoot）。支持平台管理、开发者创建/编排 App、终端用户运行 App，以及 SSE 流式对话与文件空间管理。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API）+ Vite 5 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4（三套门户 + 角色隔离） |
| HTTP | Axios |
| 样式 | 原生 CSS 变量（深色 / 浅色主题） |
| Markdown | marked、markdown-it + highlight.js |
| 其他 | crypto-js（密码加密）、viewerjs（图片预览） |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（默认 http://0.0.0.0:5173）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

开发环境下，请求通过 Vite 代理转发到后端。默认配置见 `vite.config.js`：

```js
proxy: {
  '/api': {
    target: 'http://192.168.20.235:8080/specify',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

按需修改 `target` 为你的后端地址。所有 API 请求以 `/api` 为前缀，由 `src/api/request.js` 统一封装，并自动附加 `X-Access-Token`。

### 环境变量（可选）

```env
# 会话接口是否走 localStorage Mock（见 src/api/session.js）
VITE_USE_MOCK=true
```

> 开发者 App 数据当前保存在浏览器 `localStorage`（`specify_apps_v2`），与后端 App 接口逐步对接中。

---

## 应用架构

前端按角色划分为三套门户，路由守卫在 `src/router/index.js` 中实现角色隔离：

| 门户 | 路径前缀 | 角色 | 职责 |
|------|----------|------|------|
| 平台管理 | `/admin` | `admin` | 模型、工具、模板、账号等平台配置 |
| 开发者 | `/developer` | `developer` | 创建 / 编辑 App、工作空间 |
| 终端用户 | `/user` | `user` | 运行 App、查看个人门户 |

已登录用户访问 `/` 时，会按角色自动跳转：`admin` → `/admin`，其他 → `/developer/workspace`。

### 路由一览

#### 公开路由

| 路径 | 名称 | 说明 |
|------|------|------|
| `/` | Home | 首页（登录入口） |
| `/share/:code` | AppShare | 通过分享码访问 App |

#### 开发者路由 `/developer`

| 路径 | 名称 | 说明 |
|------|------|------|
| `/developer/workspace` | AgentSpace | 工作空间：我的 App、推荐、最近使用 |
| `/developer/app/create` | AppCreate | 创建 App |
| `/developer/app/:id/intro` | AppIntro | 创建成功引导（文件空间说明） |
| `/developer/app/:id/edit` | AppEdit | App 配置编辑 |

#### 用户路由 `/user`

| 路径 | 名称 | 说明 |
|------|------|------|
| `/user/home` | UserHome | 用户门户（占位页） |
| `/user/app/:id/run` | AppRun | 对话运行（含文件面板） |

#### 管理后台 `/admin`

| 路径 | 说明 |
|------|------|
| `/admin/platforms` | 平台（模型分组）管理 |
| `/admin/models` | 模型列表 |
| `/admin/basetools` | BaseTool 管理 |
| `/admin/agent-tools` | Agent 工具管理 |
| `/admin/agent-tools/create` | 新增 Agent 工具 |
| `/admin/agent-tools/:id/edit` | 编辑 Agent 工具 |
| `/admin/mcp-tools` | MCP 工具管理 |
| `/admin/templates` | 表单模板管理 |
| `/admin/accounts` | 管理员账号 |
| `/admin/roles` | 角色管理 |

#### 兼容重定向

旧路径仍可用，避免外链失效：

```
/workspace        → /developer/workspace
/app/create       → /developer/app/create
/app/:id/edit     → /developer/app/:id/edit
/app/:id/run      → /user/app/:id/run
/agent-space      → /developer/workspace
/login            → /
```

---

## 功能模块

### 平台管理（Admin）

- **模型与平台**：模型列表、模型分组（平台）CRUD
- **工具管理**：BaseTool、Agent 工具、MCP 工具
- **Agent 子工具环检测**：编辑 Agent 工具时，前端检测 Agent → Agent 循环引用并禁用勾选（`src/utils/agentSubToolCycle.js`）
- **模板管理**：工具配置 Schema 编辑器
- **账号与角色**：管理员账号、角色权限

### 开发者（Developer）

- **App 生命周期**：创建 → 引导页 → 编辑 → 分享
- **System Prompt**：编写系统提示词，引导 AI 使用文件空间
- **工具编排**
  - SP 内置工具（SPread、SPglob、SPgrep 等），可独立启用并配置参数
  - 平台特殊工具、自定义子 Agent
  - MCP 服务接入与配置
- **高级参数**：最大步数、压缩策略、超时、安全策略等
- **文件空间**：`shared/` 资料库 + 用户目录（`workspace`、`temp`、`memory`、`assets`）

### 对话运行（AppRunView）

- SSE 流式对话
- 调试 / 正式两种运行模式
- 工具调用展示、Token 统计
- 文件树：上传、下载、建目录、删除
- 运行前模型 / 计费配置（`RunConfigModal`）

### 通用能力

- 登录 / 注册（`AuthModal`）
- 深色 / 浅色主题（`useTheme`）
- Toast、确认框、输入框等通知组件（`useNotification`）

---

## 项目结构

```
web/
├── 接口文档/                  # 后端接口说明（平台、工具、文件系统等）
├── src/
│   ├── api/
│   │   ├── admin.js           # 管理后台接口
│   │   ├── chat.js            # 聊天 / SSE 流
│   │   ├── session.js         # 会话接口（支持 VITE_USE_MOCK）
│   │   ├── request.js         # Axios 封装、Token、JeecgBoot 响应适配
│   │   └── adapters/
│   │       ├── sseParser.js   # SSE 事件解析
│   │       └── realApiAdapter.js
│   ├── stores/
│   │   ├── auth.js            # 登录态（localStorage 持久化）
│   │   ├── app.js             # App CRUD（localStorage，含旧数据迁移）
│   │   └── lm.js              # 模型偏好与 BYOK Key
│   ├── router/index.js        # 路由与角色守卫
│   ├── layouts/
│   │   ├── AdminLayout.vue
│   │   ├── DeveloperLayout.vue
│   │   └── UserLayout.vue
│   ├── views/
│   │   ├── HomepageView.vue   # 公开首页
│   │   ├── AgentSpaceView.vue # 开发者工作空间
│   │   ├── CreateAppView.vue
│   │   ├── AppIntroView.vue   # 创建成功引导
│   │   ├── AppEditView.vue    # App 配置编辑
│   │   ├── AppRunView.vue     # 对话运行
│   │   └── admin/             # 管理后台页面
│   │       ├── PlatformManagement.vue   # 平台（模型分组）管理
│   │       ├── ModelList.vue            # 模型列表
│   │       ├── BaseToolManagement.vue   # BaseTool 管理
│   │       ├── AgentToolManagement.vue  # Agent 工具列表
│   │       ├── AgentToolEdit.vue        # Agent 工具新增/编辑（含子工具环检测）
│   │       ├── McpToolManagement.vue  # MCP 工具管理
│   │       ├── TemplateManagement.vue   # 表单模板管理
│   │       ├── AdminAccountManagement.vue  # 管理员账号
│   │       ├── RoleManagement.vue       # 角色管理
│   │       └── components/
│   │           ├── ConfigSchemaEditor.vue # 配置 Schema 可视化编辑器
│   │           ├── PublicFileTree.vue   # 公共文件树（Agent 工具文件访问目录）
│   │           └── PublicFileTreeNode.vue
│   ├── components/
│   │   ├── app/               # App 弹窗、文件树、工具配置
│   │   ├── agent/             # AgentCard 等
│   │   ├── lm/                # LmSelector
│   │   └── common/            # 通用 UI 组件
│   ├── composables/           # useTheme、useNotification 等
│   ├── constants/spTools.js   # SP 内置工具元数据
│   ├── types/message.js       # 消息类型定义
│   ├── utils/
│   │   ├── agentSubToolCycle.js  # Agent 子工具环检测
│   │   ├── modelGroupDisplay.js  # 模型分组展示
│   │   ├── file.js / time.js / crypto.js
│   │   └── ...
│   └── assets/styles/         # 全局样式与 CSS 变量
├── vite.config.js
└── package.json
```

---

## 数据与接口

### 本地持久化

| Key | Store | 说明 |
|-----|-------|------|
| `specify_token` / `specify_user` | `auth` | 登录 Token 与用户信息 |
| `specify_apps_v2` | `app` | 开发者创建的 App 列表 |
| `specify_model_prefs` / `specify_api_keys` | `lm` | 模型偏好与 BYOK Key |

### 后端接口

| 模块 | 文件 | 说明 |
|------|------|------|
| 平台管理 | `src/api/admin.js` | 真实后端（JeecgBoot），仅 admin 门户使用 |
| 开发者 / 用户 | `src/api/mockApi.js` | Mock API（localStorage），developer / user 门户使用 |

登录入口也按角色分离：

- **开发者 / 终端用户**：首页「登录 / 注册」→ `AuthModal` → `mockApi.login` / `register`
- **平台管理员**：首页「管理入口」→ 独立表单 → `admin.js` 的 `login` + 验证码

角色与路由对应：`admin` → `/admin`，`developer` → `/developer`，`user` → `/user`。

详细接口定义见 `接口文档/` 目录。

---

## 开发说明

### 路径别名

`@` → `src/`（在 `vite.config.js` 中配置）

### 消息流

聊天请求经 `realApiAdapter` 转换为后端格式，SSE 响应由 `sseParser` 解析为前端消息对象（`types/message.js`）。

### Agent 工具环检测

在 `AgentToolEdit.vue` 编辑已有工具时：

1. 拉取所有 Agent 的子工具关系，构建引用图
2. 对候选子工具做 BFS，判断是否间接引用当前工具
3. UI 层禁用勾选并提示，防止 `A → B → A` 循环引用

仅检测 `platform_agent_tools` 类型的 Agent → Agent 引用，新建工具时暂无 `id`，不做检测。

---

## License

MIT
