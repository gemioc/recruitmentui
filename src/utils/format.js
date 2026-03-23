import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置中文语言
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 */
export function formatDateOnly(date) {
  return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {string|Date} date - 日期
 */
export function formatTime(date) {
  return formatDate(date, 'HH:mm:ss')
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 格式化时长（秒转为 时:分:秒）
 * @param {number} seconds - 秒数
 */
export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '-'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数
 */
export function formatMoney(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '-'
  return '¥' + Number(amount).toFixed(decimals)
}

/**
 * 格式化薪资范围
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 */
export function formatSalary(min, max) {
  if (!min && !max) return '面议'

  const formatK = (val) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'K'
    }
    return val
  }

  if (min && max) {
    return `${formatK(min)}-${formatK(max)}`
  } else if (min) {
    return `${formatK(min)}以上`
  } else {
    return `${formatK(max)}以下`
  }
}

/**
 * 获取相对时间（如：刚刚、5分钟前、昨天等）
 * @param {string|Date} date - 日期
 */
export function formatRelativeTime(date) {
  if (!date) return '-'

  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return formatDate(date, 'YYYY-MM-DD')
}