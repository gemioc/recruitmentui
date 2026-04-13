import request from '@/utils/request'

/**
 * 获取图片列表
 * @param {object} params - 查询参数
 */
export function getImageList(params) {
  return request({
    url: '/images',
    method: 'get',
    params
  })
}

/**
 * 创建图片记录
 * @param {object} data - 图片数据
 */
export function createImage(data) {
  return request({
    url: '/images',
    method: 'post',
    data
  })
}

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @param {string} imageName - 图片名称
 * @param {function} onProgress - 上传进度回调
 */
export function uploadImage(file, imageName, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  if (imageName) {
    formData.append('imageName', imageName)
  }

  return request({
    url: '/images/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 更新图片信息
 * @param {number} id - 图片ID
 * @param {object} data - 图片数据
 */
export function updateImage(id, data) {
  return request({
    url: `/images/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除图片
 * @param {number} id - 图片ID
 */
export function deleteImage(id) {
  return request({
    url: `/images/${id}`,
    method: 'delete'
  })
}

/**
 * 设置图片置顶
 * @param {number} id - 图片ID
 * @param {number} isTop - 是否置顶
 */
export function setImageTop(id, isTop) {
  return request({
    url: `/images/${id}/top`,
    method: 'put',
    params: { isTop }
  })
}

/**
 * 获取图片访问地址
 * @param {number} id - 图片ID
 */
export function getImageUrl(id) {
  return request({
    url: `/images/${id}/url`,
    method: 'get'
  })
}