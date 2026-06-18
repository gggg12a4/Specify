import { ref } from 'vue'

// Toast 实例引用
let toastInstance = null

// 确认对话框状态
const confirmDialogState = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
  resolve: null
})

// 输入对话框状态
const inputDialogState = ref({
  visible: false,
  title: '',
  label: '',
  placeholder: '',
  defaultValue: '',
  validator: null,
  resolve: null
})

/**
 * 设置 Toast 组件实例
 */
export function setToastInstance(instance) {
  toastInstance = instance
}

/**
 * 显示 Toast 消息
 * @param {Object} options - Toast 配置
 * @param {string} options.type - 类型: 'success' | 'error' | 'warning' | 'info'
 * @param {string} options.message - 消息内容
 * @param {number} [options.duration=3000] - 显示时长（毫秒）
 */
export function showToast({ type = 'info', message, duration = 3000 }) {
  if (!toastInstance) {
    console.error('Toast instance not initialized')
    return
  }
  toastInstance.addToast({ type, message, duration })
}

/**
 * 显示成功提示
 */
export function showSuccess(message, duration) {
  showToast({ type: 'success', message, duration })
}

/**
 * 显示错误提示
 */
export function showError(message, duration) {
  showToast({ type: 'error', message, duration })
}

/**
 * 显示警告提示
 */
export function showWarning(message, duration) {
  showToast({ type: 'warning', message, duration })
}

/**
 * 显示信息提示
 */
export function showInfo(message, duration) {
  showToast({ type: 'info', message, duration })
}

/**
 * 显示确认对话框
 * @param {Object} options - 对话框配置
 * @param {string} [options.title='确认'] - 标题
 * @param {string} options.message - 消息内容
 * @param {string} [options.confirmText='确认'] - 确认按钮文字
 * @param {string} [options.cancelText='取消'] - 取消按钮文字
 * @param {boolean} [options.danger=false] - 是否为危险操作（红色按钮）
 * @returns {Promise<boolean>} - 用户选择结果
 */
export function showConfirm({
  title = '确认',
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false
}) {
  return new Promise((resolve) => {
    confirmDialogState.value = {
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      danger,
      resolve
    }
  })
}

/**
 * 处理确认对话框的确认操作
 */
export function handleConfirmDialogConfirm() {
  if (confirmDialogState.value.resolve) {
    confirmDialogState.value.resolve(true)
  }
  confirmDialogState.value.visible = false
}

/**
 * 处理确认对话框的取消操作
 */
export function handleConfirmDialogCancel() {
  if (confirmDialogState.value.resolve) {
    confirmDialogState.value.resolve(false)
  }
  confirmDialogState.value.visible = false
}

/**
 * 获取确认对话框状态
 */
export function getConfirmDialogState() {
  return confirmDialogState
}

/**
 * 显示输入对话框
 * @param {Object} options - 对话框配置
 * @param {string} [options.title='输入'] - 标题
 * @param {string} [options.label=''] - 输入框标签
 * @param {string} [options.placeholder='请输入...'] - 输入框占位符
 * @param {string} [options.defaultValue=''] - 默认值
 * @param {Function} [options.validator=null] - 验证函数，返回 true 表示通过，返回字符串表示错误信息
 * @returns {Promise<string|null>} - 用户输入的值，取消则返回 null
 */
export function showInput({
  title = '输入',
  label = '',
  placeholder = '请输入...',
  defaultValue = '',
  validator = null
}) {
  return new Promise((resolve) => {
    inputDialogState.value = {
      visible: true,
      title,
      label,
      placeholder,
      defaultValue,
      validator,
      resolve
    }
  })
}

/**
 * 处理输入对话框的确认操作
 */
export function handleInputDialogConfirm(value) {
  if (inputDialogState.value.resolve) {
    inputDialogState.value.resolve(value)
  }
  inputDialogState.value.visible = false
}

/**
 * 处理输入对话框的取消操作
 */
export function handleInputDialogCancel() {
  if (inputDialogState.value.resolve) {
    inputDialogState.value.resolve(null)
  }
  inputDialogState.value.visible = false
}

/**
 * 获取输入对话框状态
 */
export function getInputDialogState() {
  return inputDialogState
}
