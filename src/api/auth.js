/**
 * 认证相关 API（JeecgBoot /specify/sys/*）。
 * 开发者门户、管理后台共用登录与图形验证码接口。
 */
import request from './request'

/** POST /sys/login */
export const login = (data) => request.post('/sys/login', data)

/** GET /sys/randomImage/{key} */
export const getRandomImage = (key) => request.get(`/sys/randomImage/${key}`)

/** POST /sys/user/register — 匿名注册，成功后需另行登录 */
export const register = (data) => request.post('/sys/user/register', data)
