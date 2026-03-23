import request from '@/utils/request'

/**
 * 获取系统配置
 */
export function getSystemConfig() {
  return request({
    url: '/config',
    method: 'get'
  })
}

/**
 * 更新系统配置
 * @param {object} data - 配置数据 { type, data }
 */
export function updateSystemConfig(data) {
  return request({
    url: '/config',
    method: 'put',
    data
  })
}

/**
 * 获取存储配置
 */
export function getStorageConfig() {
  return request({
    url: '/config/storage',
    method: 'get'
  })
}

/**
 * 测试存储配置
 * @param {object} data - 存储配置
 */
export function testStorageConfig(data) {
  return request({
    url: '/config/storage/test',
    method: 'post',
    data
  })
}