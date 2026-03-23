import request from '@/utils/request'

/**
 * 获取视频列表
 * @param {object} params - 查询参数
 */
export function getVideoList(params) {
  return request({
    url: '/videos',
    method: 'get',
    params
  })
}

/**
 * 创建视频记录
 * @param {object} data - 视频数据
 */
export function createVideo(data) {
  return request({
    url: '/videos',
    method: 'post',
    data
  })
}

/**
 * 上传视频
 * @param {File} file - 视频文件
 * @param {string} videoName - 视频名称
 * @param {function} onProgress - 上传进度回调
 */
export function uploadVideo(file, videoName, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  if (videoName) {
    formData.append('videoName', videoName)
  }

  return request({
    url: '/videos/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 更新视频信息
 * @param {number} id - 视频ID
 * @param {object} data - 视频数据
 */
export function updateVideo(id, data) {
  return request({
    url: `/videos/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除视频
 * @param {number} id - 视频ID
 */
export function deleteVideo(id) {
  return request({
    url: `/videos/${id}`,
    method: 'delete'
  })
}

/**
 * 设置视频置顶
 * @param {number} id - 视频ID
 * @param {number} isTop - 是否置顶
 */
export function setVideoTop(id, isTop) {
  return request({
    url: `/videos/${id}/top`,
    method: 'put',
    params: { isTop }
  })
}

/**
 * 获取视频播放地址
 * @param {number} id - 视频ID
 */
export function getVideoPlayUrl(id) {
  return request({
    url: `/videos/${id}/play`,
    method: 'get'
  })
}