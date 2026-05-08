/**
 * HTML+CSS 海报模板引擎
 * 用于 multi_01 多岗位招聘模板
 * 配合 html2canvas 将 HTML 渲染为 PNG
 */

/**
 * 多岗位招聘 HTML 模板
 * @param {Object} data - 模板数据
 * @param {string} data.company - 公司名称
 * @param {Array} data.jobs - 岗位列表
 * @param {string} data.jobs[].jobTitle - 岗位名称
 * @param {string} data.jobs[].recruitCount - 招聘人数
 * @param {string} data.jobs[].salary - 工资情况
 * @param {string} data.jobs[].education - 学历要求
 * @param {string} data.jobs[].welfare - 福利待遇
 * @param {string} data.location - 工作地点
 * @param {string} data.contactName - 联系人
 * @param {string} data.contactPhone - 联系电话
 * @param {string} [data.logoBase64] - Logo 图片 Base64（可选，不提供则用占位图）
 * @returns {string} HTML 字符串
 */
export function multi01HtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = ''
  } = data

  // 确保至少有一行数据（防止表格无数据）
  const jobRows = jobs.length > 0 ? jobs : [{}, {}, {}, {}]

  // Logo HTML
  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder"></div>`

  // 表格行 HTML
  const tableRowsHtml = jobRows.map(job => `
    <tr class="job-row">
      <td class="cell-post">${escapeHtml(job.jobTitle || '')}</td>
      <td class="cell-count">${escapeHtml(job.recruitCount || '')}</td>
      <td class="cell-salary">${escapeHtml(job.salary || '')}</td>
      <td class="cell-education">${escapeHtml(job.education || '')}</td>
      <td class="cell-welfare">${escapeHtml(job.welfare || '')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>多岗位招聘海报</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1920px;
      height: 1080px;
      max-height: 1080px;
      font-family: '仿宋', 'FangSong', 'STFangsong', serif;
      background: #ffffff;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .poster {
      width: 1920px;
      height: 1080px;
      max-height: 1080px;
      background: #ffffff;
      position: relative;
      border: 8px solid #61c5f2;
      overflow: hidden;
      box-sizing: border-box;
    }

    .content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-sizing: border-box;
    }

    /* ===== 顶部区域：Logo + 公司名称 ===== */
    .header {
      display: flex;
      align-items: center;
      padding: 0 30px;
      height: 200px;
      flex-shrink: 0;
    }

    .logo {
      width: 160px;
      height: 160px;
      object-fit: contain;
      border-radius: 8px;
    }

    .logo-placeholder {
      width: 160px;
      height: 160px;
      background: #f0f0f0;
      border: 1px dashed #ccc;
      border-radius: 8px;
    }

    .company-name {
      flex: 1;
      text-align: center;
      font-size: 68px;
      font-weight: bold;
      color: #61c5f2;
      letter-spacing: 4px;
      padding-right: 160px; /* 给logo留空间 */
    }

    /* ===== 表格区域 ===== */
    .table-container {
      padding: 0;
      flex: 1;
      overflow: hidden;
      box-sizing: border-box;
    }

    .job-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      font-size: 30px;
      table-layout: fixed;
    }

    .job-table th,
    .job-table td {
      border: 1px solid #61c5f2;
      padding: 0;
      text-align: center;
      vertical-align: middle;
      color: #61c5f2;
    }

    .job-table thead {
      background: #f0f7fc;
    }

    .job-table th {
      height: 65px;
      font-weight: normal;
      font-size: 36px;
    }

    .job-table td {
      height: 130px;
      color: #333333;
      text-align: center;
    }

    /* 福利待遇：左对齐 */
    .job-table td.cell-welfare {
      text-align: left;
      padding: 10px 20px;
      line-height: 1.5;
      word-break: break-word;
    }

    .job-table .cell-post {
      width: 230px;
    }

    .job-table .cell-count {
      width: 190px;
    }

    .job-table .cell-salary {
      width: 200px;
    }

    .job-table .cell-education {
      width: 200px;
    }

    /* 岗位名称：垂直居中 */
    .job-table td.cell-post {
      vertical-align: middle;
      padding: 10px 15px;
    }

    /* ===== 底部信息栏 ===== */
    .footer {
      height: 80px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 0 30px !important;
      margin: 0 !important;
      border-top: 1px solid #61c5f2 !important;
      font-size: 36px !important;
      font-weight: bold !important;
      color: #61c5f2 !important;
      background: transparent !important;
      box-sizing: border-box !important;
      flex-wrap: nowrap !important;
      overflow: visible !important;
      flex-shrink: 0 !important;
    }

    .footer-left {
      display: flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .footer-right {
      display: flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
      gap: 30px !important;
    }

    .footer-label {
      color: #61c5f2 !important;
      font-size: 36px !important;
      font-weight: bold !important;
    }

    .footer-value {
      color: #61c5f2 !important;
      font-size: 36px !important;
      font-weight: bold !important;
      margin-right: 8px !important;
    }

    .footer-right .footer-value {
      margin-right: 0 !important;
    }
  </style>
</head>
<body>
  <div class="poster">
    <div class="content">
      <!-- 顶部区域 -->
      <div class="header">
        ${logoHtml}
        <div class="company-name">${escapeHtml(company)}</div>
      </div>

      <!-- 表格区域 -->
      <div class="table-container">
        <table class="job-table">
          <thead>
            <tr>
              <th class="cell-post">岗位名称</th>
              <th class="cell-count">招聘人数</th>
              <th class="cell-salary">工资情况</th>
              <th class="cell-education">学历要求</th>
              <th class="cell-welfare">福利待遇</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- 底部信息栏 -->
      <div class="footer">
        <div class="footer-left">
          <span class="footer-label">工作地点：</span>
          <span class="footer-value">${escapeHtml(location)}</span>
        </div>
        <div class="footer-right">
          <div class="footer-group">
            <span class="footer-label">联系人：</span>
            <span class="footer-value">${escapeHtml(contactName)}</span>
          </div>
          <div class="footer-group">
            <span class="footer-label">联系电话：</span>
            <span class="footer-value">${escapeHtml(contactPhone)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * 单岗位招聘 HTML 模板
 * 政府/就业服务类正式风格：白底+蓝色文字线条+红色Logo，文档式排版
 */
export function single01HtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = ''
  } = data

  const job = jobs[0] || {}

  // 红色房屋Logo（就业服务通用标志）
  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder">
         <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
           <path d="M60 20 L100 55 L100 100 L20 100 L20 55 Z" fill="#d32f2f" stroke="#b71c1c" stroke-width="2"/>
           <rect x="45" y="65" width="30" height="35" fill="#fff"/>
           <rect x="52" y="72" width="16" height="28" fill="#d32f2f"/>
           <circle cx="85" cy="40" r="8" fill="#d32f2f"/>
         </svg>
       </div>`

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>就业服务海报</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1920px;
      height: 1080px;
      font-family: '仿宋', 'FangSong', 'STFangsong', serif;
      background: #ffffff;
      overflow: hidden;
    }

    .poster {
      width: 1920px;
      height: 1080px;
      background: #fff;
      position: relative;
      border: 3px solid #61c5f2;
      overflow: hidden;
    }

    .content {
      position: absolute;
      top: 3px; left: 3px; right: 3px; bottom: 3px;
      display: flex;
      flex-direction: column;
      padding: 30px 50px;
      border: 2px solid #61c5f2;
    }

    /* ===== 顶部：Logo + 标题 ===== */
    .header {
      display: flex;
      align-items: center;
      height: 120px;
      flex-shrink: 0;
      border-bottom: 2px solid #61c5f2;
      padding-bottom: 15px;
    }

    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .logo-placeholder {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-placeholder svg {
      width: 90px;
      height: 90px;
    }

    .company-title {
      flex: 1;
      text-align: center;
      font-size: 52px;
      font-weight: bold;
      color: #61c5f2;
      letter-spacing: 8px;
      padding-right: 120px;
    }

    /* ===== 岗位信息表格 ===== */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 25px;
      font-size: 32px;
      border: 2px solid #61c5f2;
    }

    .info-table td {
      border: 1px solid #61c5f2;
      padding: 18px 20px;
      color: #61c5f2;
      vertical-align: middle;
      text-align: center;
    }

    .info-table tr:first-child td {
      font-weight: bold;
      background: #f0f9ff;
    }

    .info-table tr:last-child td {
      text-align: center;
      font-weight: bold;
    }

    /* ===== 职位信息区块 ===== */
    .section {
      margin-top: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .section-title {
      font-size: 32px;
      font-weight: bold;
      color: #61c5f2;
      margin-bottom: 10px;
      padding-left: 5px;
      flex-shrink: 0;
    }

    .section-box {
      border: 2px solid #61c5f2;
      padding: 20px 24px;
      font-size: 26px;
      color: #61c5f2;
      line-height: 1.8;
      flex: 1;
      min-height: 0;
    }

    /* ===== 底部联系信息栏 ===== */
    .footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 30px 10px;
      border-top: 2px solid #61c5f2;
      font-size: 36px;
      font-weight: bold;
      color: #61c5f2;
    }

    .footer-left {
      text-align: left;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="poster">
    <div class="content">
      <!-- 顶部：Logo + 标题 -->
      <div class="header">
        ${logoHtml}
        <div class="company-title">${escapeHtml(company)}</div>
      </div>

      <!-- 岗位信息表格 -->
      <table class="info-table">
        <tr>
          <td>岗位名称</td>
          <td>招聘人数</td>
          <td>工资情况</td>
          <td>学历要求</td>
        </tr>
        <tr>
          <td>${escapeHtml(job.jobTitle || '')}</td>
          <td>${escapeHtml(job.recruitCount || '')}</td>
          <td>${escapeHtml(job.salary || '')}</td>
          <td>${escapeHtml(job.education || '')}</td>
        </tr>
      </table>

      <!-- 职位信息 -->
      <div class="section">
        <div class="section-title">职位信息</div>
        <div class="section-box">${escapeHtml(job.jobInfo || '')}</div>
      </div>

      <!-- 福利待遇 -->
      <div class="section">
        <div class="section-title">福利待遇</div>
        <div class="section-box">${escapeHtml(job.welfare || '')}</div>
      </div>

      <!-- 底部联系信息 -->
      <div class="footer">
        <div class="footer-left">
          <span>工作地点：${escapeHtml(location)}</span>
        </div>
        <div class="footer-center">
          <span>联系人：${escapeHtml(contactName)}</span>
        </div>
        <div class="footer-right">
          <span>联系电话：${escapeHtml(contactPhone)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * HTML 转 PNG via html2canvas
 * @param {string} htmlContent - HTML 字符串
 * @param {Object} options - 配置选项
 * @param {string} options.logoBase64 - Logo Base64
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<string>} Base64 PNG 字符串
 */
export async function renderHtmlToPng(htmlContent, options = {}) {
  const { onProgress } = options

  return new Promise((resolve, reject) => {
    // 创建隐藏的 iframe
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:absolute;width:1920px;height:1080px;left:-9999px;top:-9999px;border:none;'
    iframe.width = '1920'
    iframe.height = '1080'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    // 等待内容加载
    iframe.onload = async () => {
      try {
        onProgress?.('rendering', '正在渲染海报...')

        // 等待所有图片加载
        await waitForImages(iframeDoc)

        // 使用原生 Canvas 方式截图（无依赖）
        const canvas = await captureIframeAsCanvas(iframe)
        const pngBase64 = canvas.toDataURL('image/png', 1.0)

        // 清理
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

/**
 * 等待 iframe 中所有图片加载完成
 */
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
        // 短暂延迟确保渲染完成
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

/**
 * 使用原生 Canvas 捕获 iframe 内容
 * 注意：跨域 iframe 无法捕获，这是局限性
 */
async function captureIframeAsCanvas(iframe) {
  return new Promise((resolve, reject) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const svg = iframeDoc.querySelector('svg')

      if (svg) {
        // 如果是 SVG，直接用 XMLSerializer
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
        // 非 SVG，使用 html2canvas
        // 注意：html2canvas 需要在外部引入
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
          // 兜底：尝试直接用 iframe 的 DOM
          const body = iframeDoc.body
          const canvas = document.createElement('canvas')
          canvas.width = 1920
          canvas.height = 1080
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, 1920, 1080)
          ctx.fillStyle = '#333333'
          ctx.font = '30px 仿宋'
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
 * HTML 字符串转 Canvas（推荐方式）
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

  // 动态加载 html2canvas
  let html2canvas
  try {
    const module = await import('html2canvas')
    html2canvas = module.default || module.html2canvas
  } catch (e) {
    // 尝试从全局获取
    html2canvas = window.html2canvas
  }

  if (!html2canvas) {
    throw new Error('html2canvas 未加载，请确保已引入该库')
  }

  // 创建临时容器
  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-${width}px;top:-${height}px;width:${width}px;height:${height}px;overflow:hidden;z-index:-1;`
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  // 等待渲染
  await new Promise(resolve => setTimeout(resolve, 100))

  // 渲染
  const canvas = await html2canvas(container, {
    width,
    height,
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    logging: false
  })

  // 清理
  const cleanup = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  return { canvas, cleanup }
}

/**
 * 上传 Base64 PNG 到后端
 * @param {string} base64Data - Base64 PNG 数据
 * @returns {Promise<string>} 后端返回的文件路径
 */
export async function uploadPngToBackend(base64Data) {
  // 移除 data:image/png;base64, 前缀
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
  // 简单的模板替换，支持 {{key}} 语法
  return templateHtml.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? escapeHtml(String(data[key])) : ''
  })
}

/**
 * 多岗位招聘 HTML 模板（模板2）
 * 左右分栏：左侧表格7行，右侧详情区，底部横条与multi_01一致
 * 配合 html2canvas 将 HTML 渲染为 PNG
 * @param {Object} data - 模板数据
 * @param {string} data.company - 公司名称
 * @param {Array} data.jobs - 岗位列表
 * @param {string} data.jobs[].jobTitle - 岗位名称
 * @param {string} data.jobs[].recruitCount - 招聘人数
 * @param {string} data.jobs[].salary - 工资情况
 * @param {string} data.jobs[].education - 学历要求
 * @param {string} data.jobs[].jobInfo - 职位信息（岗位职责+任职要求）
 * @param {string} data.jobs[].welfare - 福利待遇
 * @param {string} data.location - 工作地点
 * @param {string} data.contactName - 联系人
 * @param {string} data.contactPhone - 联系电话
 * @param {string} [data.logoBase64] - Logo Base64
 * @param {number} [data.selectedIndex] - 右侧详情区展示的岗位索引（默认0）
 */
export function multi02HtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = '',
    selectedIndex = 0
  } = data

  // 填充空白行确保7行
  const rowCount = 7
  const filledJobs = [...jobs]
  while (filledJobs.length < rowCount) {
    filledJobs.push({})
  }

  // Logo HTML
  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder"></div>`

  // 选中的岗位（用于右侧详情）
  const selectedJob = jobs[selectedIndex] || jobs[0] || {}

  // 表格行 HTML
  const tableRowsHtml = filledJobs.map((job, idx) => {
    const isSelected = idx === selectedIndex
    return `
    <tr class="job-row ${isSelected ? 'row-selected' : ''}">
      <td class="cell-post">${escapeHtml(job.jobTitle || '')}</td>
      <td class="cell-count">${escapeHtml(job.recruitCount || '')}</td>
      <td class="cell-salary">${escapeHtml(job.salary || '')}</td>
      <td class="cell-education">${escapeHtml(job.education || '')}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>多岗位招聘海报</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      font-family: '仿宋', 'FangSong', 'STFangsong', serif;
      background: #ffffff;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    .poster {
      width: 1920px;
      height: 1080px;
      background: #ffffff;
      position: relative;
      border: 8px solid #61c5f2;
      overflow: hidden;
      box-sizing: border-box;
    }
    .content {
      position: absolute;
      top: 8px; left: 8px; right: 8px; bottom: 8px;
      display: flex;
      flex-direction: column;
    }

    /* ===== 顶部区域 ===== */
    .header {
      display: flex;
      align-items: center;
      height: 160px;
      flex-shrink: 0;
      border-bottom: 3px solid #61c5f2;
      padding: 0 30px;
      gap: 30px;
    }

    .logo {
      width: 140px;
      height: 140px;
      object-fit: contain;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .logo-placeholder {
      width: 140px;
      height: 140px;
      background: #f0f0f0;
      border: 2px dashed #61c5f2;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .company-name {
      flex: 1;
      font-size: 72px;
      font-weight: bold;
      color: #61c5f2;
      letter-spacing: 4px;
      text-align: center;
    }

    /* ===== 主内容区 ===== */
    .main-area {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* ===== 左侧表格区 ===== */
    .left-table-area {
      flex: 1.8;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #61c5f2;
    }

    /* ===== 右侧详情区 ===== */
    .right-detail-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px 30px;
      gap: 16px;
      overflow: hidden;
      border: 1px solid #61c5f2;
    }

    .job-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .job-table thead {
      background: #f0f7fc;
    }

    .job-table thead th {
      height: 55px;
      font-size: 26px;
      color: #61c5f2;
      font-weight: normal;
      border: 1px solid #61c5f2;
      padding: 0;
      text-align: center;
      vertical-align: middle;
    }

    .job-table tbody tr {
      height: 109px;
    }

    .job-table tbody td {
      font-size: 26px;
      color: #61c5f2;
      border: 1px solid #61c5f2;
      padding: 0;
      text-align: center;
      vertical-align: middle;
    }

    .job-table td.cell-post {
      font-size: 28px;
      font-weight: bold;
    }

    .cell-post { width: 30%; }
    .cell-count { width: 18%; }
    .cell-salary { width: 26%; }
    .cell-education { width: 26%; }

    /* ===== 右侧详情区 ===== */
    .right-detail-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px 30px;
      gap: 12px;
      overflow: hidden;
      border: 1px solid #61c5f2;
    }

    .detail-pair {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-label {
      font-size: 30px;
      color: #61c5f2;
      font-weight: bold;
      text-align: left;
      flex-shrink: 0;
    }

    .detail-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid #61c5f2;
      padding: 10px 14px;
    }

    .detail-content {
      flex: 1;
      font-size: 26px;
      color: #61c5f2;
      line-height: 1.6;
      word-break: break-word;
      text-align: left;
      overflow: hidden;
    }

    /* ===== 底部信息栏 ===== */
    .footer {
      height: 80px;
      display: flex;
      align-items: center;
      padding: 0 30px;
      flex-shrink: 0;
      border-top: 3px solid #61c5f2;
    }

    .footer-left {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .footer-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
    }

    .footer-label {
      color: #61c5f2;
      font-size: 28px;
      font-weight: bold;
      white-space: nowrap;
    }

    .footer-value {
      color: #61c5f2;
      font-size: 28px;
      font-weight: bold;
      word-break: break-word;
    }

    .footer-left .footer-value {
      margin-left: 6px;
    }

    .footer-right .footer-label {
      margin-left: 0;
    }

    .footer-right .footer-value {
      margin-left: 0;
    }

    .footer-right .footer-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="poster">
    <div class="content">
      <!-- 顶部区域 -->
      <div class="header">
        ${logoHtml}
        <div class="company-name">${escapeHtml(company)}</div>
      </div>

      <!-- 主内容区 -->
      <div class="main-area">
        <!-- 左侧表格 -->
        <div class="left-table-area">
          <table class="job-table">
            <thead>
              <tr>
                <th class="cell-post">岗位名称</th>
                <th class="cell-count">招聘人数</th>
                <th class="cell-salary">工资情况</th>
                <th class="cell-education">学历要求</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- 右侧详情 -->
        <div class="right-detail-area">
          <div class="detail-pair">
            <div class="detail-label">职位信息</div>
            <div class="detail-section">
              <div class="detail-content">${escapeHtml(selectedJob.jobInfo || '（未填写职位信息）')}</div>
            </div>
          </div>
          <div class="detail-pair">
            <div class="detail-label">福利待遇</div>
            <div class="detail-section">
              <div class="detail-content">${escapeHtml(selectedJob.welfare || '（未填写福利待遇）')}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部信息栏 -->
      <div class="footer">
        <div class="footer-left">
          <span class="footer-label">工作地点：</span>
          <span class="footer-value">${escapeHtml(location)}</span>
        </div>
        <div class="footer-right">
          <div class="footer-group">
            <span class="footer-label">联系人：</span>
            <span class="footer-value">${escapeHtml(contactName)}</span>
          </div>
          <div class="footer-group">
            <span class="footer-label">联系电话：</span>
            <span class="footer-value">${escapeHtml(contactPhone)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * HTML 特殊字符转义
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
