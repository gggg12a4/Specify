<template>
  <div class="template-management admin-page">
    <div class="page-header">
      <div class="header-title">
        <h2>表单模板</h2>
        <span class="count-badge">共 {{ totalCount }} 个</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openTemplateForm()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加模板
        </button>
      </div>
    </div>
    <div class="table-wrap" v-if="templates.length > 0 || isLoading">
      <table v-if="!isLoading">
        <thead>
          <tr>
            <th>类型标识</th>
            <th>展示名</th>
            <th>说明</th>
            <th>后端执行类</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in templates" :key="t.id">
            <td class="font-medium">{{ t.name }}</td>
            <td class="font-medium">{{ t.displayName }}</td>
            <td
              class="text-muted"
              style="
                max-width: 260px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
              :title="t.description"
            >
              {{ t.description }}
            </td>
            <td class="text-mono" style="font-size: 11px">{{ t.handlerPath }}</td>
            <td class="actions">
              <button
                class="btn btn-ghost btn-sm"
                @click="openTemplateForm(t)"
              >
                编辑
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="confirmDelete(t)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else>
        <thead>
          <tr>
            <th>标识</th>
            <th>名称</th>
            <th>说明</th>
            <th>handlerPath</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" style="text-align: center; padding: 60px 0;">
              <div class="loading-spinner"></div>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="!isLoading && templates.length > 0"
        :total="totalCount"
        :pageSize="pageSize"
        v-model="currentPage"
      />
    </div>
    <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <p>暂无表单模板数据</p>
      </div>

    <!-- 表单模板弹窗 -->
    <div
      v-if="showTemplateModal"
      class="modal-mask"
      @click.self="showTemplateModal = false"
    >
      <div class="modal" style="width: 740px; max-height: 90vh">
        <div class="modal-header">
          {{ templateForm.id ? "编辑表单模板" : "添加表单模板" }}
        </div>
        <div class="modal-body">
          <div class="form-card">
            <div class="section-title" style="margin-top: 0">基本信息</div>
            <div class="form-row">
              <div class="form-field" v-if="!templateForm.id">
                <label>类型标识 *</label>
                <input
                  v-model="templateForm.name"
                  placeholder="如 SimpleAgent"
                />
                <div class="hint" style="font-size: 11px; color: var(--color-text-muted, #9ca3af); margin-top: 3px">核心标识，创建后不可修改</div>
              </div>
              <div class="form-field" v-if="templateForm.id">
                <label>类型标识</label>
                <input :value="templateForm.name" disabled style="background: #f3f4f6" />
              </div>
              <div class="form-field">
                <label>展示名 *</label>
                <input v-model="templateForm.displayName" placeholder="如 知识库检索工具" />
              </div>
            </div>
            <div class="form-field">
              <label>类型描述</label>
              <input v-model="templateForm.description" placeholder="连接向量数据库，支持基于文档的高级语义检索..." />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>后端执行类 *</label>
                <input v-model="templateForm.handlerPath" placeholder="specify.agent.RAGAgent" />
              </div>
            </div>
            <div class="form-field instance-level-field">
              <label>instance_level *</label>
              <div class="radio-group">
                <label>
                  <input type="radio" v-model.number="csInstanceLevel" :value="0" />
                  0
                </label>
                <label>
                  <input type="radio" v-model.number="csInstanceLevel" :value="1" />
                  1
                </label>
                <label>
                  <input type="radio" v-model.number="csInstanceLevel" :value="2" />
                  2
                </label>
                <label>
                  <input type="radio" v-model.number="csInstanceLevel" :value="3" />
                  3
                </label>
              </div>
              <div class="hint">0=平台实例 1=App缓存 2=用户缓存 3=用完即弃</div>
            </div>
          </div>

          <!-- configSchema 可视化编辑器 -->
          <div class="form-card">
          <ConfigSchemaEditor
            v-model:fields="csFields"
            @toast="$emit('toast', $event)"
            header-title="表单字段配置（基于此模板创建工具时渲染的参数）"
          />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showTemplateModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="saveTemplateData">
            确认保存
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-mask" @click.self="showDeleteModal = false">
      <div class="modal" style="width: 400px; max-height: 50vh">
        <div class="modal-header">删除表单模板「{{ deleteTargetName }}」</div>
        <div class="modal-body">
          <p style="margin: 0 0 16px; color: var(--color-text)">删除后该模板将不可恢复，且无法再用于创建新工具。</p>
          <p style="margin: 0 0 16px; color: var(--color-error)">⚠️ 请输入确认密码以执行删除。</p>

          <div class="form-field">
            <label>确认密码 *</label>
            <input v-model="deletePassword" type="password" placeholder="请输入确认密码" @keyup.enter="executeDelete" />
          </div>

          <p v-if="deleteError" style="color: var(--color-error, #ef4444); font-size: 12px; margin: 0">{{ deleteError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-sm btn-danger" @click="executeDelete" :disabled="isDeleting">
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import ConfigSchemaEditor from './components/ConfigSchemaEditor.vue';
import Pagination from '@/components/common/Pagination.vue';
import { getToolTemplates, saveToolTemplate, deleteToolTemplate } from '@/api/admin';

const emit = defineEmits(['toast', 'update:templates']);

const templates = ref([]);
const isLoading = ref(true);
const showTemplateModal = ref(false);
const showDeleteModal = ref(false);
const deleteError = ref('');
const deletePassword = ref('');
const isDeleting = ref(false);
const deleteTargetId = ref(null);
const deleteTargetName = ref('');
const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

watch(currentPage, () => {
  loadTemplates();
});

const templateForm = reactive({
  id: null,
  name: '',
  displayName: '',
  description: '',
  handlerPath: '',
  configSchema: null
});

const csFields = ref([]);
const csInstanceLevel = ref(3);

async function loadTemplates() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize
    };
    const r = await getToolTemplates(params);
    if (r.code === 0 || r.success || r.code === 200) {
      const resultData = r.result || r.data;
      const dataArray = resultData?.records || resultData || [];
      const sortedData = dataArray.sort((a, b) => {
        // 排序使用 createTime 升序，否则使用 id 升序
        if (a.createTime && b.createTime) {
          return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
        }
        return (a.id || 0) - (b.id || 0);
      });
      templates.value = sortedData;
      totalCount.value = resultData?.total || sortedData.length;
      emit('update:templates', sortedData);
    }
  } catch (e) {
    emit('toast', { msg: '加载模版失败', type: 'error' });
  } finally {
    isLoading.value = false;
  }
}

function openTemplateForm(t) {
  if (t) {
    Object.assign(templateForm, {
      id: t.id,
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      handlerPath: t.handlerPath
    });
    let schema = {};
    if (typeof t.configSchema === 'string' && t.configSchema) {
      try {
        schema = JSON.parse(t.configSchema);
      } catch(e) {
        console.warn('Failed to parse configSchema string:', t.configSchema);
      }
    } else if (typeof t.configSchema === 'object' && t.configSchema) {
      schema = t.configSchema;
    }
    csInstanceLevel.value = schema.instanceLevel ?? 3;
    csFields.value = (schema.fields || []).map(f => ({ ...f }));
  } else {
    Object.assign(templateForm, {
      id: null,
      name: '',
      displayName: '',
      description: '',
      handlerPath: ''
    });
    csInstanceLevel.value = 3;
    csFields.value = [];
  }
  showTemplateModal.value = true;
}

async function saveTemplateData() {
  if (!templateForm.id && !templateForm.name) {
    emit('toast', { msg: '必填项 类型标识 * 没填', type: 'error' });
    return;
  }
  if (!templateForm.displayName) {
    emit('toast', { msg: '必填项 展示名 * 没填', type: 'error' });
    return;
  }
  if (!templateForm.handlerPath) {
    emit('toast', { msg: '必填项 后端执行类 * 没填', type: 'error' });
    return;
  }

  const payload = { ...templateForm };
  payload.configSchema = JSON.stringify({
    instanceLevel: csInstanceLevel.value,
    fields: csFields.value
  });

  try {
    const r = await saveToolTemplate(payload);
    if (r.code === 0 || r.success || r.code === 200) {
      showTemplateModal.value = false;
      emit('toast', { msg: '保存成功' });
      loadTemplates();
    } else {
      emit('toast', { msg: r.msg || r.message, type: 'error' });
    }
  } catch (e) {
    emit('toast', { msg: '保存失败', type: 'error' });
  }
}

function confirmDelete(t) {
  const usageCount = t.referencedBy?.length || 0;
  if (usageCount > 0) {
    emit('toast', { msg: `已有 ${usageCount} 个工具基于此模板，请先删除相关工具后再删除模板`, type: 'error' });
    return;
  }

  deleteTargetId.value = t.id;
  deleteTargetName.value = t.displayName || t.name || '未知';
  deletePassword.value = '';
  deleteError.value = '';
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!deletePassword.value) {
    deleteError.value = '请输入确认密码';
    return;
  }

  isDeleting.value = true;
  deleteError.value = '';

  try {
    const r = await deleteToolTemplate({ id: deleteTargetId.value, password: deletePassword.value });
    if (r.code === 0 || r.success || r.code === 200) {
      showDeleteModal.value = false;
      emit('toast', { msg: '已删除' });
      loadTemplates();
    } else {
      deleteError.value = r.message || r.msg || '删除失败，请检查密码或重试';
    }
  } catch (e) {
    deleteError.value = e?.response?.data?.message || e?.response?.data?.msg || e?.message || '删除失败，网络或服务器错误';
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
@import '@/assets/admin-common.css';

/* Buttons */
.btn-text {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  height: 28px;
  box-sizing: border-box;
}

.btn-text:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text);
}

.btn-text-danger {
  background: var(--color-error, #ef4444);
  color: #fff;
  border: none;
}

.btn-text-danger:hover {
  background: #dc2626;
  color: #fff;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:not(:disabled):hover {
  background: var(--color-primary-hover);
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
  border-radius: var(--radius-md, 8px);
}

.btn-danger:not(:disabled):hover {
  background: #dc2626;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:not(:disabled):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* Modals with Backdrop Blur */
.th-name, .td-name { width: 140px; }
.th-display, .td-display { width: 150px; }
.th-desc, .td-desc { width: auto; }
.th-handler, .td-handler { width: 180px; }
.th-sort, .td-sort { width: 60px; text-align: center; }
.th-actions, .td-actions { width: 120px; text-align: right; }
.td-sort, .th-sort { text-align: center; }
.td-actions, .th-actions { text-align: right; }
.td-handler { font-size: 11px; }

/* Modern Inputs with Primary-Soft Focus Glow */

.section-title {
  font-size: var(--text-xs, 12px);
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

/* Custom Scrollbar for Modal Body */
.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* Loading Spinner */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
