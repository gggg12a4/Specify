# Specify-web

基于 Vue 3 的 AI Agent 平台前端，对接 [Specify](https://github.com/) Python 框架。支持创建和配置 Agent App、多工具编排、文件空间管理，以及 SSE 流式对话。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 样式 | 原生 CSS 变量（深色 / 浅色主题） |
| Markdown | marked + highlight.js |
| 图片预览 | viewerjs |

---

## 项目结构

```
src/
├── api/
│   ├── mock.js              # 全量 Mock（39 个接口），开发期无需后端
│   ├── request.js           # Axios 封装
│   ├── chat.js              # 聊天接口
│   ├── session.js           # 会话接口
│   ├── upload.js            # 文件上传
│   ├── lm.js                # 模型管理接口
│   └── adapters/
│       ├── sseParser.js     # SSE 流解析
│       └── realApiAdapter.js
├── stores/
│   ├── app.js               # App 列表与 CRUD（含本地持久化）
│   ├── auth.js              # 登录 / 注册状态
│   ├── session.js           # 会话状态
│   ├── chat.js              # 聊天消息状态
│   └── lm.js                # 模型配置状态
├── views/
│   ├── AgentSpaceView.vue   # 首页：App 广场 + 最近使用
│   ├── AppIntroView.vue     # App 介绍页
│   ├── AppEditView.vue      # App 配置编辑页
│   └── AppRunView.vue       # 对话运行页（含文件面板）
├── components/
│   ├── app/                 # App 相关弹窗与面板
│   │   ├── CreateAppModal.vue
│   │   ├── DeleteAppModal.vue
│   │   ├── AppToolsTab.vue          # SP 内置工具配置
│   │   ├── SubAgentTab.vue          # 自定义工具 / 子 Agent
│   │   ├── SkillsTab.vue            # 技能管理
│   │   ├── AppAdvancedConfigModal.vue
│   │   ├── ShareModal.vue
│   │   ├── FileTree.vue             # 文件树组件
│   │   ├── AppFilePanel.vue         # 运行页文件侧边栏
│   │   ├── ToolConfigModal.vue
│   │   ├── ToolCreateModal.vue
│   │   ├── EnableToolModal.vue
│   │   ├── ToolInfoModal.vue
│   │   ├── AppToolsSection.vue
│   │   └── RecentAppCard.vue
│   ├── agent/
│   │   ├── AgentCard.vue
│   │   └── EditAgentModal.vue
│   ├── lm/
│   │   ├── LmSelector.vue
│   │   └── LmFormModal.vue
│   ├── setup/               # 新手引导向导
│   │   ├── SetupWizard.vue
│   │   └── steps/
│   │       ├── StepAppName.vue
│   │       ├── StepModelConfig.vue
│   │       ├── StepSpConfig.vue
│   │       ├── StepSystemPrompt.vue
│   │       ├── StepCreateApp.vue
│   │       └── StepWorkspaceIntro.vue
│   ├── content/             # 消息内容渲染
│   │   ├── TextContent.vue
│   │   ├── ReasoningContent.vue
│   │   ├── ToolCallContent.vue
│   │   ├── ToolResultContent.vue
│   │   ├── ImageContent.vue
│   │   ├── AudioContent.vue
│   │   ├── VideoContent.vue
│   │   └── FileContent.vue
│   ├── layout/
│   │   └── Sidebar.vue
│   └── common/
│       ├── AuthModal.vue
│       ├── MyModelsModal.vue        # 模型 + BYOK 配置
│       ├── SettingsDrawer.vue
│       ├── Toast.vue
│       ├── DropdownMenu.vue
│       ├── ConfirmDialog.vue
│       ├── InputDialog.vue
│       ├── ParamEditDialog.vue
│       ├── UploadSelector.vue
│       ├── FilePreviewList.vue
│       ├── CreateToolModal.vue
│       ├── ToolsModal.vue
│       ├── UserProfileModal.vue
│       └── ApiConfigModal.vue
├── composables/
│   ├── useTheme.js
│   ├── useNotification.js
│   ├── useSessionContext.js
│   ├── useApiConfig.js
│   └── useSystemPrompt.js
├── constants/
│   └── spTools.js           # SP 内置工具元数据
├── types/
│   └── message.js           # Specify 消息类型定义
├── utils/
│   ├── file.js
│   ├── time.js
│   ├── debug.js
│   └── titleGenerator.js
├── assets/styles/
│   ├── variables.css        # 全局 CSS 变量（主题色等）
│   ├── common.css
│   └── reset.css
├── App.vue
└── main.js
```

---

## 路由

| 路径 | 名称 | 说明 | 需要登录 |
|------|------|------|----------|
| `/` | Home | App 广场首页 | 否 |
| `/app/:id/intro` | AppIntro | App 介绍页 | 是 |
| `/app/:id/edit` | AppEdit | App 配置编辑 | 是 |
| `/app/:id/run` | AppRun | 对话运行 | 是 |
| `/share/:code` | AppShare | 通过分享码访问 | 否 |

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（使用 Mock 数据，无需后端）
npm run dev

# 生产构建
npm run build
```

默认使用 `src/api/mock.js` 中的 Mock 数据运行，全部 39 个接口均已模拟，含 SSE 流式响应。

### 切换到真实后端

创建 `.env.local` 文件：

```env
VITE_USE_MOCK=false
VITE_API_BASE=http://your-backend-url
```

或直接修改 `src/api/request.js` 中的 `baseURL`。

---

## 功能特性

### App 管理
- 创建 / 编辑 / 删除 App
- 配置 System Prompt、高级参数（最大步数、压缩策略、超时等）
- App 公开分享（生成分享码）
- 新手引导向导（首次使用）

### 工具配置
- **SP 内置工具**：SPread、SPglob、SPgrep、SPedit、SPwrite、SPmake、SPcreatedir、SPrm、SPupload、SPSkillManager，每项可独立启用并配置参数
- **自定义工具 / 子 Agent**：创建、编辑、删除，配置独立 System Prompt 和子工具集

### 模型配置
- 主模型 + 副模型（用于子 Agent）
- 支持平台提供 或 BYOK（自带 API Key）
- API Key 管理（增 / 改 / 删，含自定义 API 地址）

### 对话运行
- SSE 流式对话，逐字输出
- 工具调用展示（调用中 / 完成 / 结果）
- 安全审批流：`form` + `suspended` 事件触发批准/拒绝面板
- 停止生成 / 重置对话
- Token 用量统计

### 文件空间
- 四个根目录：`workspace`、`temp`、`memory`、`assets`
- 上传文件（多选，拖拽）
- 上传文件夹（递归建目录 + 逐文件上传，拖拽或选择器）
- 创建文件夹（嵌套路径）
- 展开 / 折叠嵌套目录
- 下载文件
- 删除文件 / 文件夹（含递归删除子内容）
- 文件名过长自动省略，悬停显示完整名称

### 其他
- 深色 / 浅色主题切换
- 用户登录 / 注册
- Toast 通知系统

---

## Mock 数据说明

`src/api/mock.js` 模拟了全部后端接口，数据通过 `localStorage` 持久化。主要模拟接口：

- 用户认证：注册、登录、获取用户信息
- App CRUD：创建、读取、更新、删除、分享
- 模型配置：获取模型列表、保存偏好、API Key 管理
- 文件系统：getFiles、uploadFile、downloadFile、deleteFile、mkdir
- 对话：chatSSE（SSE 流）、chatApprove、chatCancel、chatReset、getSession

SSE 响应通过异步生成器实现，事件类型：`notification`、`ai_chunk`、`ai_message`、`tool_result`、`form`、`suspended`、`completed`、`error`。

---

## License

MIT
