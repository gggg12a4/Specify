<template>
  <div class="create-app-page">
    <header class="create-header">
      <router-link to="/" class="back-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回首页
      </router-link>
    </header>

    <main class="create-content">
      <h1 class="page-title">创建新 App</h1>

      <div class="form-area">
        <div class="field">
          <label class="field-label">App 名称 <span class="required">*</span></label>
          <input
            ref="nameRef"
            v-model="form.name"
            class="field-input"
            :class="{ error: errors.name }"
            placeholder="全英文或下划线，例如：my_agent"
            maxlength="50"
            @keydown.enter="handleSubmit"
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <div class="field">
          <label class="field-label">App 描述</label>
          <textarea
            v-model="form.description"
            class="field-textarea"
            placeholder="描述一下这个 App 的用途（选填）"
            rows="2"
            maxlength="200"
          ></textarea>
        </div>
      </div>

      <div class="divider"></div>

      <div class="platform-section">
        <h2 class="section-title">选择平台</h2>
        <p class="section-hint">
          <template v-if="isFromTemplate">
            该模板基于特定能力构建，平台已被锁定为 {{ currentPlatform?.label }}。
          </template>
          <template v-else>
            选择一个 AI 平台，决定你的 App 可以使用哪些能力和工具。
          </template>
        </p>

        <div class="platform-layout">
          <!-- 左侧列表 -->
          <div class="platform-list">
            <button
              v-for="p in PLATFORMS"
              :key="p.key"
              class="platform-item"
              :class="{ active: selectedPlatform === p.key }"
              :disabled="isFromTemplate && selectedPlatform !== p.key"
              @click="selectedPlatform = p.key"
              :style="{ opacity: isFromTemplate && selectedPlatform !== p.key ? '0.4' : '1', cursor: isFromTemplate && selectedPlatform !== p.key ? 'not-allowed' : 'pointer' }"
            >
              <span class="p-indicator">{{ selectedPlatform === p.key ? '▶' : '' }}</span>
              <span class="p-name">{{ p.label }}</span>
            </button>
          </div>

          <!-- 右侧详情 -->
          <div class="platform-detail" v-if="currentPlatform">
            <h3 class="detail-name">{{ currentPlatform.label }}</h3>

            <div class="detail-row">
              <span class="detail-key">支持能力：</span>
              <span class="detail-val">{{ currentPlatform.capabilities }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-key">可用模型：</span>
              <span class="detail-val">{{ currentPlatform.models }}</span>
            </div>

            <div class="detail-features">
              <p class="features-title">特点：</p>
              <ul class="features-list">
                <li v-for="f in currentPlatform.features" :key="f">· {{ f }}</li>
              </ul>
            </div>

            <button
              class="btn-enter"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '创建中...' : '选择进入' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const nameRef = ref(null)
const submitting = ref(false)
const selectedPlatform = ref('claude')
const isFromTemplate = ref(false)
const templateData = ref(null)

const form = ref({ name: '', description: '' })
const errors = ref({ name: '' })

const PLATFORMS = [
  { key: 'claude',    label: 'Claude'   },
  { key: 'gemini',    label: 'Gemini'   },
  { key: 'gpt',       label: 'GPT'      },
  { key: 'deepseek',  label: 'DeepSeek' },
  { key: 'qwen',      label: 'Qwen'     },
]

const PLATFORM_INFO = {
  claude: {
    label: 'Claude',
    capabilities: '文本 · 图片理解 · 文档解析',
    models: 'Opus · Sonnet · Haiku',
    features: ['强推理能力，代码和分析任务表现优异', '支持文档解析和图片理解', '不支持绘图、视频和音频'],
  },
  gemini: {
    label: 'Gemini',
    capabilities: '文本 · 图片理解 · 绘图 · 视频 · 音频',
    models: '2.0 Pro · 1.5 Pro · 1.5 Flash',
    features: ['多模态能力最全，支持图片/视频/音频', '绘图能力（Imagen 系列）', '长上下文支持'],
  },
  gpt: {
    label: 'GPT',
    capabilities: '文本 · 图片理解 · 绘图 · 语音合成',
    models: '4o · 4o-mini · o1',
    features: ['综合能力强，生态成熟', '绘图（DALL-E）和语音合成（TTS）', '不支持视频和音频理解'],
  },
  deepseek: {
    label: 'DeepSeek',
    capabilities: '文本',
    models: 'V3 · R1',
    features: ['价格最低，适合纯文本场景', 'R1 推理增强，适合逻辑复杂任务', '不支持图片、视频、音频和绘图'],
  },
  qwen: {
    label: 'Qwen',
    capabilities: '文本 · 图片理解',
    models: 'Max · Plus · Turbo',
    features: ['中文理解能力强', '支持图片理解', '不支持绘图、视频和音频'],
  },
}

const currentPlatform = computed(() => PLATFORM_INFO[selectedPlatform.value])

function validate() {
  errors.value.name = ''
  if (!form.value.name.trim()) {
    errors.value.name = 'App 名称不能为空'
    return false
  }

  // 校验规则：仅支持全英文+下划线
  const namePattern = /^[a-zA-Z_]+$/;
  if (!namePattern.test(form.value.name.trim())) {
    errors.value.name = 'App 名称仅支持全英文和下划线'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) {
    nameRef.value?.focus()
    return
  }
  submitting.value = true

  let appData = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    platform: selectedPlatform.value,
  }

  // 如果是从模板克隆，合并模板的数据（系统提示词、工具配置等）
  if (isFromTemplate.value && templateData.value) {
    const tplData = JSON.parse(JSON.stringify(templateData.value))
    delete tplData.id
    delete tplData.isTemplate
    appData = { ...tplData, ...appData } // 让刚填写的 name/desc/platform 覆盖模板原本的名字
  }

  const app = appStore.addApp(appData)

  // 创建后清空模板缓存
  if (isFromTemplate.value) {
    localStorage.removeItem('specify_template_clone')
  }

  submitting.value = false
  // 无论是否是从模板创建，都直接跳到 AppEdit (由上一次的对话讨论可知不需要进Intro)
  router.push({ name: 'AppEdit', params: { id: app.id } })
}

onMounted(() => {
  if (route.query.fromTemplate === 'true') {
    isFromTemplate.value = true
    const savedTpl = localStorage.getItem('specify_template_clone')
    if (savedTpl) {
      try {
        templateData.value = JSON.parse(savedTpl)
        form.value.name = templateData.value.name || ''
        form.value.description = templateData.value.description || ''
        if (templateData.value.platform) {
          selectedPlatform.value = templateData.value.platform
        }
      } catch (e) {
        console.error('Failed to parse template clone data')
      }
    }
  }

  nameRef.value?.focus()
  if (isFromTemplate.value) {
    // 如果是克隆模式，选中文本方便直接修改
    setTimeout(() => {
      nameRef.value?.select()
    }, 50)
  }
})
</script>

<style scoped>
.create-app-page {
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.create-header {
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--color-text); }

.create-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  width: 100%;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 24px;
}

.form-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 500; color: var(--color-text); }
.required { color: #ef4444; }
.field-input,
.field-textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  resize: vertical;
}
.field-input:focus,
.field-textarea:focus { border-color: var(--color-accent); }
.field-input.error { border-color: #ef4444; }
.field-error { font-size: 12px; color: #ef4444; }

.divider { height: 1px; background: var(--color-border); margin: 28px 0; }

.section-title { font-size: 17px; font-weight: 600; color: var(--color-text); margin: 0 0 6px; }
.section-hint { font-size: 13px; color: var(--color-text-muted); margin: 0 0 20px; }

.platform-layout {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 280px;
}

.platform-list {
  width: 140px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.platform-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: left;
  transition: background 0.12s, color 0.12s;
}
.platform-item:hover { background: var(--color-hover); color: var(--color-text); }
.platform-item.active { background: var(--color-hover); color: var(--color-text); font-weight: 600; }
.p-indicator { width: 10px; font-size: 11px; color: var(--color-accent); }
.p-name { flex: 1; }

.platform-detail {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.detail-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}
.detail-key { color: var(--color-text-muted); white-space: nowrap; }
.detail-val { color: var(--color-text); }

.detail-features { flex: 1; }
.features-title { font-size: 13px; color: var(--color-text-muted); margin: 0 0 6px; }
.features-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.features-list li { font-size: 13px; color: var(--color-text); }

.btn-enter {
  align-self: flex-end;
  padding: 9px 22px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-enter:hover { opacity: 0.88; }
.btn-enter:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
