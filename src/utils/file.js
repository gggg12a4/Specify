/**
 * 文件上传相关工具函数
 */

/**
 * 将文件读取为 Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Base64 字符串（不含 data: 前缀）
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64String = e.target.result
      // 移除 data:image/png;base64, 前缀
      const base64Data = base64String.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件的 MIME 类型
 * @param {File} file - 文件对象
 * @returns {string} MIME 类型
 */
export function getFileMimeType(file) {
  return file.type || 'application/octet-stream'
}

/**
 * 根据文件类型判断内容类型
 * @param {File} file - 文件对象
 * @returns {string} 'image' | 'audio' | 'video' | 'file'
 */
export function detectContentType(file) {
  const mimeType = file.type.toLowerCase()

  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio'
  }
  if (mimeType.startsWith('video/')) {
    return 'video'
  }
  return 'file'
}

/**
 * 验证图片文件
 * @param {File} file - 文件对象
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 默认 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options

  if (!file) {
    return { valid: false, error: '请选择文件' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的图片格式' }
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    return { valid: false, error: `图片大小不能超过 ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * 验证视频文件
 * @param {File} file - 文件对象
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateVideoFile(file, options = {}) {
  const {
    maxSize = 50 * 1024 * 1024, // 默认 50MB
    allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
  } = options

  if (!file) {
    return { valid: false, error: '请选择文件' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的视频格式' }
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    return { valid: false, error: `视频大小不能超过 ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * 验证音频文件
 * @param {File} file - 文件对象
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateAudioFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 默认 10MB
    allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
  } = options

  if (!file) {
    return { valid: false, error: '请选择文件' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的音频格式' }
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    return { valid: false, error: `音频大小不能超过 ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 创建图片预览 URL
 * @param {File} file - 文件对象
 * @returns {string} 预览 URL
 */
export function createPreviewURL(file) {
  return URL.createObjectURL(file)
}

/**
 * 释放预览 URL
 * @param {string} url - 预览 URL
 */
export function revokePreviewURL(url) {
  URL.revokeObjectURL(url)
}
