import request from '@/utils/request'

/**
 * 获取职位列表
 * @param {object} params - 查询参数
 */
export function getJobList(params) {
  return request({
    url: '/jobs',
    method: 'get',
    params
  })
}

/**
 * 获取职位详情
 * @param {number} id - 职位ID
 */
export function getJobDetail(id) {
  return request({
    url: `/jobs/${id}`,
    method: 'get'
  })
}

/**
 * 新增职位
 * @param {object} data - 职位数据
 */
export function createJob(data) {
  return request({
    url: '/jobs',
    method: 'post',
    data
  })
}

/**
 * 更新职位
 * @param {number} id - 职位ID
 * @param {object} data - 职位数据
 */
export function updateJob(id, data) {
  return request({
    url: `/jobs/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除职位
 * @param {number} id - 职位ID
 */
export function deleteJob(id) {
  return request({
    url: `/jobs/${id}`,
    method: 'delete'
  })
}

/**
 * 更新职位状态
 * @param {number} id - 职位ID
 * @param {number} status - 状态
 */
export function updateJobStatus(id, status) {
  return request({
    url: `/jobs/${id}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 批量更新职位状态
 * @param {array} ids - 职位ID列表
 * @param {number} status - 状态
 */
export function batchUpdateJobStatus(ids, status) {
  return request({
    url: '/jobs/batch/status',
    method: 'put',
    data: ids,
    params: { status }
  })
}