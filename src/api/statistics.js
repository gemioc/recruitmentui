import request from '@/utils/request'

/**
 * 获取推送统计
 * @param {object} params - 查询参数
 */
export function getPushStatistics(params) {
  return request({
    url: '/statistics/push',
    method: 'get',
    params
  })
}

/**
 * 获取设备统计
 * @param {object} params - 查询参数
 */
export function getDeviceStatistics(params) {
  return request({
    url: '/statistics/device',
    method: 'get',
    params
  })
}

/**
 * 获取内容统计
 */
export function getContentStatistics() {
  return request({
    url: '/statistics/content',
    method: 'get'
  })
}

/**
 * 导出统计数据
 * @param {object} params - 查询参数
 */
export function exportStatistics(params) {
  return request({
    url: '/statistics/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}