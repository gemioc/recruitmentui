import request from '@/utils/request'

/**
 * 获取海报列表
 * @param {object} params - 查询参数
 */
export function getPosterList(params) {
  return request({
    url: '/posters',
    method: 'get',
    params
  })
}

/**
 * 获取海报详情
 * @param {number} id - 海报ID
 */
export function getPosterDetail(id) {
  return request({
    url: `/posters/${id}`,
    method: 'get'
  })
}

/**
 * 获取海报模板列表
 */
export function getPosterTemplates() {
  return request({
    url: '/posters/templates',
    method: 'get'
  })
}

/**
 * 预览海报
 * @param {object} data - {jobId, templateId}
 */
export function previewPoster(data) {
  return request({
    url: '/posters/preview',
    method: 'post',
    data
  })
}

/**
 * 生成海报
 * @param {object} data - 海报数据
 */
export function createPoster(data) {
  return request({
    url: '/posters',
    method: 'post',
    data
  })
}

/**
 * 生成海报（别名）
 * @param {object} data - 海报数据
 */
export function generatePoster(data) {
  return request({
    url: '/posters/generate',
    method: 'post',
    data
  })
}

/**
 * 更新海报
 * @param {number} id - 海报ID
 * @param {object} data - 海报数据
 */
export function updatePoster(id, data) {
  return request({
    url: `/posters/${id}`,
    method: 'put',
    data
  })
}

/**
 * 批量生成海报
 * @param {object} data - {jobIds, templateId}
 */
export function batchCreatePoster(data) {
  return request({
    url: '/posters/batch',
    method: 'post',
    data
  })
}

/**
 * 删除海报
 * @param {number} id - 海报ID
 */
export function deletePoster(id) {
  return request({
    url: `/posters/${id}`,
    method: 'delete'
  })
}

/**
 * 导出海报
 * @param {number} id - 海报ID
 * @param {string} format - 格式 jpg/png
 */
export function exportPoster(id, format = 'jpg') {
  return request({
    url: `/posters/${id}/export`,
    method: 'get',
    params: { format },
    responseType: 'blob'
  })
}

/**
 * 批量导出海报
 * @param {array} ids - 海报ID列表
 * @param {string} format - 格式
 */
export function batchExportPoster(ids, format = 'jpg') {
  return request({
    url: '/posters/export',
    method: 'post',
    data: { ids, format },
    responseType: 'blob'
  })
}