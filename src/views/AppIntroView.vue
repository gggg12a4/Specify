<template>
  <div class="intro-page">
    <header class="intro-header">
      <router-link to="/" class="back-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回首页
      </router-link>
    </header>

    <main class="intro-content">
      <!-- 创建成功提示 -->
      <div class="success-banner">
        <span class="success-icon">✅</span>
        <div class="success-text">
          <h1 class="success-title">App「{{ appName }}」创建成功！</h1>
          <p class="success-sub">你的专属空间已就绪，以下是空间的基本介绍。</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 空间结构 -->
      <section class="doc-section">
        <h2 class="section-title">📂 空间结构</h2>
        <p class="section-desc">
          你的 App 有一个专属文件空间。你可以在里面存放资料供 AI 使用，
          每个用户进入后也会自动拥有自己的独立目录。
        </p>
        <div class="code-block">
          <pre>{{ appName }}/
│
├── shared/           ← 你的 App 资料库，供 AI 学习和参考
├── mailbox/          ← 用户间通信，一般无需关注（详见使用教程）
│
└── users/
    ├── 用户A/         ← 用户 A 的独立空间
    │   ├── workspace/
    │   ├── temp/
    │   ├── memory/
    │   └── assets/
    │
    ├── 用户B/         ← 用户 B 的独立空间（结构相同，数据隔离）
    │   └── ...
    └── （更多用户自动创建...）</pre>
        </div>
      </section>

      <div class="divider"></div>

      <!-- App 资料库 -->
      <section class="doc-section">
        <h2 class="section-title">📦 App 资料库（shared/）</h2>
        <p class="section-desc">
          在这里存放你希望 AI 参考的资料。所有用户的 AI 都可以读取。
        </p>
        <p class="section-desc">
          例如你做了一个「产品问答助手」，可以把产品手册、FAQ 放进去：
        </p>
        <div class="code-block">
          <pre>shared/
├── 产品手册.pdf
├── 常见问题.md
└── skills/          ← 技能文件夹（配合技能管理器工具使用）</pre>
        </div>
      </section>

      <div class="divider"></div>

      <!-- 用户空间 -->
      <section class="doc-section">
        <h2 class="section-title">👤 用户空间</h2>
        <p class="section-desc">
          如果你的 App 需要帮用户处理文件（如编辑文档、分析图片、生成报告等），
          可以在提示词中使用以下文件夹名来引用。Specify 会自动为每个用户创建
          一个独立的个人网盘。不涉及文件操作可跳过。
        </p>
        <div class="user-dirs-table">
          <div v-for="dir in userDirs" :key="dir.name" class="dir-row">
            <div class="dir-name">{{ dir.name }}</div>
            <div class="dir-desc">
              <p class="dir-summary">{{ dir.summary }}</p>
              <p class="dir-example">{{ dir.example }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- 实战示例 -->
      <section class="doc-section">
        <h2 class="section-title">💡 实战示例：如何在提示词中使用空间</h2>
        <p class="section-desc">假设你要做一个「产品问答助手」：</p>

        <div class="steps">
          <div class="step-item">
            <div class="step-num">第一步</div>
            <div class="step-content">
              <p class="step-title">上传资料到 shared/</p>
              <div class="tip-box">在开发页面左侧文件空间，将产品文档上传到 shared/ 目录</div>
            </div>
          </div>

          <div class="step-item">
            <div class="step-num">第二步</div>
            <div class="step-content">
              <p class="step-title">在开发页面写系统提示词，引导 AI 使用这些资料</p>
              <div class="code-block">
                <pre>你是一个产品问答专家。

## 工作流程
1. 用户提问后，先到 shared/ 目录搜索相关的产品文档
2. 找到相关内容后，阅读文档并提取关键信息
3. 结合文档内容回答用户的问题
4. 如果用户要求生成报告，将报告保存到 workspace/

## 注意事项
- 回答必须基于 shared/ 中的文档，不要编造信息
- 引用时标注来源文件名
- 将用户的常见问题记录到 memory/faq_log.md，便于后续优化</pre>
              </div>
            </div>
          </div>

          <div class="step-item">
            <div class="step-num">第三步</div>
            <div class="step-content">
              <p class="step-title">启用需要的工具</p>
              <div class="code-block">
                <pre>☑ SPread   — AI 需要读取 shared/ 中的文档
☑ SPglob   — AI 需要浏览目录找到相关文件
☑ SPgrep   — AI 需要按关键字搜索文档内容
☑ SPwrite  — AI 需要将报告保存到 workspace/
☑ SPmake   — AI 需要向 memory/ 写入记录（安全写入，不覆盖）</pre>
              </div>
            </div>
          </div>
        </div>

        <p class="section-desc" style="margin-top:16px">
          这样每个用户进来提问时，AI 就会自动到 shared/ 查资料、
          到 workspace/ 保存产出，每个用户的空间互不干扰。
        </p>
      </section>

      <div class="divider"></div>

      <!-- 下一步 -->
      <section class="doc-section next-section">
        <h2 class="section-title">🚀 下一步</h2>
        <ol class="next-list">
          <li>前往开发页面，编写系统提示词，启用需要的工具</li>
          <li>如有 App 资料，可在开发页面上传到 shared/</li>
        </ol>
        <router-link :to="{ name: 'AppEdit', params: { id: appId } }" class="cta-btn">
          前往开发页面 →
        </router-link>
      </section>
    </main>
  </div>
</template>

<script setup>
/**
 * App 创建成功引导页（/developer/app/:id/intro）。
 * 向开发者介绍文件空间结构（shared/、users/ 下各目录）及提示词编写示例，
 * 引导其前往开发页面继续配置。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const appId = computed(() => route.params.id)
const appName = computed(() => {
  // 创建流程跳转时会带 query.name，避免 store 尚未同步时显示默认名
  if (route.query.name) return route.query.name
  return appStore.getApp(appId.value)?.name || 'App'
})

/** 用户个人空间目录说明，对应 users/{用户}/ 下的四个标准子目录 */
const userDirs = [
  {
    name: 'workspace/',
    summary: '主文件夹。用户和 AI 的主要工作目录，产出物默认保存在这里。',
    example: '例：用户说"帮我写一篇文章"，文章会保存到这里。'
  },
  {
    name: 'temp/',
    summary: '临时区（定期清理）。工具自动生成，用户一般不需要关心。',
    example: '例：搜索结果太长时，完整结果存在此处，对话中只给摘要。'
  },
  {
    name: 'memory/',
    summary: '记忆磁盘。需要长期记忆的内容可放在这里，适合保存用户偏好、关键结论等。写入需启用 SPmake（安全写入，每次新建文件不覆盖已有内容）。',
    example: '例：AI 记住用户的偏好，下次对话时可以参考。'
  },
  {
    name: 'assets/',
    summary: '用户上传内容。用户在对话中上传的文件自动保存在此。',
    example: '例：用户在对话中发了一张截图，AI 可以读取并分析。'
  }
]
</script>

<style scoped>
.intro-page {
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.intro-header {
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 5px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all 0.15s;
}
.back-btn:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

.intro-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 32px 80px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 创建成功提示 */
.success-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 28px;
  background: var(--color-primary-muted, rgba(99,102,241,0.06));
  border: 1px solid var(--color-primary-soft, rgba(99,102,241,0.2));
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
}
.success-icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}
.success-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.success-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}
.success-sub {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 32px 0;
}

/* 文档节 */
.doc-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.section-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
}

.code-block {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  overflow-x: auto;
}
.code-block pre {
  margin: 0;
  font-size: 13px;
  font-family: var(--font-mono, 'Consolas', monospace);
  color: var(--color-text-secondary);
  line-height: 1.7;
  white-space: pre;
}

/* 用户目录表格 */
.user-dirs-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.dir-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  border-bottom: 1px solid var(--color-border);
}
.dir-row:last-child {
  border-bottom: none;
}
.dir-name {
  padding: 14px 16px;
  font-size: 13px;
  font-family: var(--font-mono, 'Consolas', monospace);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
}
.dir-desc {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dir-summary {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}
.dir-example {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  font-style: italic;
}

/* 步骤 */
.steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.step-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.step-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-muted, rgba(99,102,241,0.08));
  border: 1px solid var(--color-primary-soft, rgba(99,102,241,0.2));
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  white-space: nowrap;
}
.step-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.tip-box {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  line-height: 1.6;
}

/* 下一步 */
.next-section {
  align-items: flex-start;
}
.next-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.next-list li {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: #fff;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  margin-top: 8px;
}
.cta-btn:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}
</style>
