import request from '@/utils/request'

/**
 * 获取操作日志列表
 * @param {object} params - 查询参数
 */
export function getOperationLogs(params) {
  return request({
    url: '/logs',
    method: 'get',
    params
  })
}

/**
 * 清空操作日志
 */
export function clearOperationLogs() {
  return request({
    url: '/logs',
    method: 'delete'
  })
}