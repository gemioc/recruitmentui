import request from '@/utils/request'

/**
 * 获取推送统计概览
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
 * 获取推送记录明细列表
 * @param {object} params - 查询参数
 */
export function getPushRecordList(params) {
  return request({
    url: '/statistics/push/records',
    method: 'get',
    params
  })
}

/**
 * 获取设备状态统计
 * @param {object} params - 查询参数
 */
export function getDeviceStatusStatistics(params) {
  return request({
    url: '/statistics/device/status',
    method: 'get',
    params
  })
}

/**
 * 获取设备统计
 */
export function getDeviceStatistics() {
  return request({
    url: '/statistics/device',
    method: 'get'
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
 * 导出推送记录Excel
 * @param {object} params - 查询参数
 */
export function exportPushRecords(params) {
  return request({
    url: '/statistics/push/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 导出统计报表
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

/**
 * 获取设备列表（用于筛选下拉框）
 */
export function getDeviceList() {
  return request({
    url: '/devices',
    method: 'get',
    params: { pageNum: 1, pageSize: 1000 }
  })
}