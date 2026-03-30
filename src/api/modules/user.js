import { get, post, put } from '@/utils/request'

/**
 * 用户相关接口
 */

// 账号密码登录
export const login = data => post('/user/login', data)

// 手机号验证码登录
export const loginByPhone = data => post('/user/login/phone', data)

// 退出登录
export const logout = () => post('/user/logout')

// 获取验证码
export const getSmsCode = data => post('/user/sms/code', data)

// 获取当前用户信息
export const getUserInfo = () => get('/user/info')

// 更新用户信息
export const updateUserInfo = data => put('/user/info', data)

// 修改密码
export const changePassword = data => put('/user/password', data)

// 刷新 Token
export const refreshToken = data => post('/user/token/refresh', data)
