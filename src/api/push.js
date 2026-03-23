import request from '@/utils/request'

/**
 * 推送海报
 * @param {object} data - 推送数据
 */
export function pushPoster(data) {
  return request({
    url: '/push/poster',
    method: 'post',
    data
  })
}

/**
 * 推送视频
 * @param {object} data - 推送数据
 */
export function pushVideo(data) {
  return request({
    url: '/push/video',
    method: 'post',
    data
  })
}

/**
 * 推送多内容
 * @param {object} data - 推送数据
 */
export function pushMultiple(data) {
  return request({
    url: '/push/multiple',
    method: 'post',
    data
  })
}

/**
 * 设备控制
 * @param {object} data - {deviceIds, action}
 */
export function controlDevice(data) {
  return request({
    url: '/push/control',
    method: 'post',
    data
  })
}

/**
 * 获取推送记录列表
 * @param {object} params - 查询参数
 */
export function getPushRecords(params) {
  return request({
    url: '/push/records',
    method: 'get',
    params
  })
}

/**
 * 获取推送详情
 * @param {number} id - 记录ID
 */
export function getPushDetail(id) {
  return request({
    url: `/push/records/${id}`,
    method: 'get'
  })
}