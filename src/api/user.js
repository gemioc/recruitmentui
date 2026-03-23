import request from '@/utils/request'

/**
 * 获取用户列表
 * @param {object} params - 查询参数
 */
export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * 新增用户
 * @param {object} data - 用户数据
 */
export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 * @param {number} id - 用户ID
 * @param {object} data - 用户数据
 */
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 更新用户状态
 * @param {number} id - 用户ID
 * @param {number} status - 状态
 */
export function updateUserStatus(id, status) {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 重置用户密码
 * @param {number} id - 用户ID
 * @param {string} newPassword - 新密码
 */
export function resetUserPassword(id, newPassword) {
  return request({
    url: `/users/${id}/resetPassword`,
    method: 'put',
    data: newPassword,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}

/**
 * 批量更新用户状态
 * @param {array} ids - 用户ID列表
 * @param {number} status - 状态
 */
export function batchUpdateUserStatus(ids, status) {
  return request({
    url: '/users/batch/status',
    method: 'put',
    data: ids,
    params: { status }
  })
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 */
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}