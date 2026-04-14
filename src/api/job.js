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

/**
 * 批量删除职位
 * @param {array} ids - 职位ID列表
 */
export function batchDeleteJobs(ids) {
  return request({
    url: '/jobs/batch',
    method: 'delete',
    data: ids
  })
}

/**
 * 获取职位统计数据
 */
export function getJobStats() {
  return request({
    url: '/jobs/stats',
    method: 'get'
  })
}

/**
 * 下载职位导入模板
 */
export function downloadJobTemplate() {
  return request({
    url: '/jobs/template',
    method: 'get',
    responseType: 'blob'
  })
}

/**
 * 批量导入职位
 * @param {File} file - Excel文件
 */
export function importJobs(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/jobs/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}