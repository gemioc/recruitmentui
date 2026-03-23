import request from '@/utils/request'

/**
 * 获取设备列表
 * @param {object} params - 查询参数
 */
export function getDeviceList(params) {
  return request({
    url: '/devices',
    method: 'get',
    params
  })
}

/**
 * 获取设备详情
 * @param {number} id - 设备ID
 */
export function getDeviceDetail(id) {
  return request({
    url: `/devices/${id}`,
    method: 'get'
  })
}

/**
 * 新增设备
 * @param {object} data - 设备数据
 */
export function createDevice(data) {
  return request({
    url: '/devices',
    method: 'post',
    data
  })
}

/**
 * 更新设备
 * @param {number} id - 设备ID
 * @param {object} data - 设备数据
 */
export function updateDevice(id, data) {
  return request({
    url: `/devices/${id}`,
    method: 'put',
    data
  })
}

/**
 * 更新设备状态
 * @param {number} id - 设备ID
 * @param {number} status - 状态
 */
export function updateDeviceStatus(id, status) {
  return request({
    url: `/devices/${id}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 删除设备
 * @param {number} id - 设备ID
 */
export function deleteDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'delete'
  })
}

/**
 * 重启设备
 * @param {number} id - 设备ID
 */
export function restartDevice(id) {
  return request({
    url: `/devices/${id}/restart`,
    method: 'post'
  })
}

/**
 * 获取设备分组列表
 */
export function getDeviceGroups() {
  return request({
    url: '/devices/groups',
    method: 'get'
  })
}

/**
 * 新增设备分组
 * @param {object} data - 分组数据
 */
export function createDeviceGroup(data) {
  return request({
    url: '/devices/groups',
    method: 'post',
    data
  })
}

/**
 * 更新设备分组
 * @param {number} id - 分组ID
 * @param {object} data - 分组数据
 */
export function updateDeviceGroup(id, data) {
  return request({
    url: `/devices/groups/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除设备分组
 * @param {number} id - 分组ID
 */
export function deleteDeviceGroup(id) {
  return request({
    url: `/devices/groups/${id}`,
    method: 'delete'
  })
}

/**
 * 获取设备监控统计
 */
export function getDeviceMonitor() {
  return request({
    url: '/devices/monitor',
    method: 'get'
  })
}