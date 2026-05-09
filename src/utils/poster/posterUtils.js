/**
 * 海报渲染工具函数
 * 配合 html2canvas 将 HTML 渲染为 PNG
 */

/**
 * HTML 字符串转 Canvas
 * @param {string} htmlContent - HTML 字符串
 * @param {Object} options - 配置
 * @returns {Promise<{canvas: HTMLCanvasElement, cleanup: Function}>}
 */
export async function htmlToCanvas(htmlContent, options = {}) {
  const {
    width = 1920,
    height = 1080,
    scale = 1,
    backgroundColor = '#ffffff'
  } = options

  let html2canvas
  try {
    const module = await import('html2canvas')
    html2canvas = module.default || module.html2canvas
  } catch (e) {
    html2canvas = window.html2canvas
  }

  if (!html2canvas) {
    throw new Error('html2canvas 未加载，请确保已引入该库')
  }

  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-${width}px;top:-${height}px;width:${width}px;height:${height}px;overflow:hidden;z-index:-1;`
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  await new Promise(resolve => setTimeout(resolve, 100))

  const canvas = await html2canvas(container, {
    width,
    height,
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    logging: false
  })

  const cleanup = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  return { canvas, cleanup }
}

/**
 * HTML 转 PNG via html2canvas
 * @param {string} htmlContent - HTML 字符串
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} Base64 PNG 字符串
 */
export async function renderHtmlToPng(htmlContent, options = {}) {
  const { onProgress } = options

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:absolute;width:1920px;height:1080px;left:-9999px;top:-9999px;border:none;'
    iframe.width = '1920'
    iframe.height = '1080'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    iframe.onload = async () => {
      try {
        onProgress?.('rendering', '正在渲染海报...')

        await waitForImages(iframeDoc)

        const canvas = await captureIframeAsCanvas(iframe)
        const pngBase64 = canvas.toDataURL('image/png', 1.0)

        document.body.removeChild(iframe)
        resolve(pngBase64)
      } catch (err) {
        document.body.removeChild(iframe)
        reject(err)
      }
    }

    iframe.onerror = () => {
      document.body.removeChild(iframe)
      reject(new Error('Iframe 加载失败'))
    }
  })
}

function waitForImages(doc) {
  return new Promise((resolve) => {
    const images = doc.querySelectorAll('img')
    if (images.length === 0) {
      resolve()
      return
    }

    let loadedCount = 0
    const checkDone = () => {
      loadedCount++
      if (loadedCount >= images.length) {
        setTimeout(resolve, 100)
      }
    }

    images.forEach(img => {
      if (img.complete) {
        checkDone()
      } else {
        img.onload = checkDone
        img.onerror = checkDone
      }
    })
  })
}

async function captureIframeAsCanvas(iframe) {
  return new Promise((resolve, reject) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const svg = iframeDoc.querySelector('svg')

      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 1920
          canvas.height = 1080
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, 1920, 1080)
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          resolve(canvas)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('SVG 图片加载失败'))
        }
        img.src = url
      } else {
        if (typeof html2canvas !== 'undefined') {
          html2canvas(iframe.contentWindow.document.body, {
            width: 1920,
            height: 1080,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            resolve(canvas)
          }).catch(reject)
        } else {
          const body = iframeDoc.body
          const canvas = document.createElement('canvas')
          canvas.width = 1920
          canvas.height = 1080
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, 1920, 1080)
          ctx.fillStyle = '#333333'
          ctx.font = '30px 宋体'
          ctx.textAlign = 'center'
          ctx.fillText('海报渲染中...', 960, 540)
          resolve(canvas)
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 上传 Base64 PNG 到后端
 * @param {string} base64Data - Base64 PNG 数据
 * @returns {Promise<string>} 后端返回的文件路径
 */
export async function uploadPngToBackend(base64Data) {
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '')

  const response = await fetch('/api/poster/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: base64 })
  })

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`)
  }

  const result = await response.json()
  return result.data || result.path
}

/**
 * HTML 模板引擎通用渲染函数
 * @param {string} templateHtml - HTML 模板字符串
 * @param {Object} data - 数据对象
 * @returns {string} 渲染后的 HTML
 */
export function renderTemplate(templateHtml, data) {
  return templateHtml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? escapeHtml(String(data[key])) : ''
  })
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
