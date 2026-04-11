/**
 * 文件URL处理工具
 * 根据环境返回完整的文件访问URL
 */

/**
 * 获取文件完整URL
 * @param {string} relativePath - 相对路径，如 /images/2026/04/xxx.png 或 /files/images/2026/04/xxx.png
 * @returns {string} 完整URL
 */
export function getFileUrl(relativePath) {
  if (!relativePath) return ''

  // 已经是完整URL（如 http://... 或 //...）直接返回
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('//')) {
    return relativePath
  }

  // 判断是否生产环境（通过VITE_API_BASE_URL判断）
  const isProd = import.meta.env.VITE_API_BASE_URL === '/api'

  // 统一处理路径：确保有 /files/ 前缀
  let path = relativePath

  if (path.startsWith('/files/')) {
    // 已经是 /files/ 路径，保持不变
    path = path.slice(1) // 去掉前导 /
  } else if (path.startsWith('/')) {
    // 没有 /files/ 前缀，需要添加
    path = 'files' + path
  } else {
    // 没有前导 /，添加 /files/
    path = 'files/' + path
  }

  if (isProd) {
    // 生产环境：nginx已配置 /files/ 代理到后端
    return `/${path}`
  } else {
    // 开发环境：需要通过 /api 前缀访问后端
    return `/api/${path}`
  }
}

/**
 * 获取海报文件URL
 * @param {string} filePath - 海报文件路径
 */
export function getPosterUrl(filePath) {
  return getFileUrl(filePath)
}

/**
 * 获取图片文件URL
 * @param {string} filePath - 图片文件路径
 */
export function getImageUrl(filePath) {
  return getFileUrl(filePath)
}
