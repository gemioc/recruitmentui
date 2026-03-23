/**
 * 本地存储封装
 */

/**
 * 存储数据到localStorage
 * @param {string} key - 键名
 * @param {any} value - 值
 */
export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('存储数据失败:', e)
  }
}

/**
 * 从localStorage获取数据
 * @param {string} key - 键名
 * @returns {any} 数据
 */
export function getStorage(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (e) {
    console.error('获取数据失败:', e)
    return null
  }
}

/**
 * 从localStorage删除数据
 * @param {string} key - 键名
 */
export function removeStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error('删除数据失败:', e)
  }
}

/**
 * 清空localStorage
 */
export function clearStorage() {
  try {
    localStorage.clear()
  } catch (e) {
    console.error('清空存储失败:', e)
  }
}