import request from '@/utils/request'

/**
 * 用户登录
 * @param {object} data - {username, password}
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return request({
    url: '/auth/userInfo',
    method: 'get'
  })
}

/**
 * 修改密码
 * @param {object} data - {oldPassword, newPassword}
 */
export function updatePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}