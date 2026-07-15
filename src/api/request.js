import axios from 'axios'

const request = axios.create({
  baseURL: '/api', // 使用相对路径，通过 Vite 代理
  timeout: 60000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 使用登录后写入的 token（specify_token）
    const token = localStorage.getItem('specify_token')
    if (token) {
      config.headers['X-Access-Token'] = token // JeecgBoot 使用 X-Access-Token
      // 保留 Bearer token 以防某些非 Jeecg 的接口需要
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 业务错误：HTTP 200 + success=false（如注册接口）优先按失败处理
    if (res.success === false) {
      return Promise.reject(new Error(res.message || res.msg || 'Error'))
    }
    // 业务错误：HTTP 200 但 code 非成功值（JeecgBoot Result）
    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      return Promise.reject(new Error(res.message || res.msg || 'Error'))
    }
    // 兼容 JeecgBoot 后端格式 (success: true 或 code: 200) 到前端期望的格式 (code: 0)
    if (res.success === true || res.code === 200 || res.code === 0) {
      return {
        code: 0,
        data: res.result !== undefined ? res.result : res,
        msg: res.message || res.msg
      }
    }
    return res
  },
  error => {
    console.error('请求错误:', error)

    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        // 未授权
        console.error('未授权，请检查 API Key 配置')
        const errorMsg = data?.message || '未授权，请检查 API Key'
        error.message = errorMsg

        // 登录已失效，弹出提示，延迟 1.5 秒后跳转首页
        import('@/composables/useNotification').then(({ showWarning }) => {
          showWarning('登录已失效，请重新登录')
        })

        setTimeout(() => {
          import('@/stores/auth').then(({ useAuthStore }) => {
            const authStore = useAuthStore()
            authStore.logout()
          })
        }, 1500)
      } else if (status === 422) {
        // 验证错误
        const message = data.detail?.[0]?.msg || '请求参数验证失败'
        console.error('验证错误:', message)
        error.message = message
      } else if (status >= 500) {
        // 服务器错误
        console.error('服务器错误，请稍后重试')
        error.message = '服务器错误，请稍后重试'
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误，请检查网络连接')
      error.message = '网络错误，请检查网络连接'
    }

    return Promise.reject(error)
  }
)

export default request
