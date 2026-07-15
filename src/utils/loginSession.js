/**
 * 解析 JeecgBoot 登录响应，统一写入 authStore 的 { token, user } 结构。
 */
export function normalizeLoginSession(res, { role = 'developer', fallbackUsername = '' } = {}) {
  if (res.code !== 0 || !res.data) {
    return { ok: false, message: res.msg || res.message || '登录失败，请检查账号密码' }
  }

  const data = res.data
  const token = typeof data === 'string' ? data : data.token
  if (!token) {
    return { ok: false, message: res.msg || res.message || '登录失败，未返回 token' }
  }

  const info = typeof data === 'object' && data.userInfo ? data.userInfo : {}
  const username = info.username || fallbackUsername
  const user = {
    id: info.id || username,
    nickname: info.realname || info.realName || username || fallbackUsername,
    phone: info.phone || username || fallbackUsername,
    role,
  }

  return { ok: true, token, user }
}
