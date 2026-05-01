/**
 * 海报模板渲染引擎 v2
 * 基于 JSON 模板定义，生成 SVG 海报
 * TV 场景优化：保证内容不超出 1920x1080
 */

import { smartTextWrap, truncateSingleLine, escapeXml } from './textWrap'

// 模板注册表
const templateRegistry = {}

/**
 * 注册模板
 */
export function registerTemplate(templateId, templateData) {
  templateRegistry[templateId] = templateData
}

/**
 * 渲染模板
 * @param {string} templateId - 模板ID
 * @param {Object} data - 业务数据
 * @returns {string} SVG 字符串
 */
export function renderTemplate(templateId, data) {
  const template = templateRegistry[templateId]
  if (!template) {
    console.error(`Template ${templateId} not found in registry`)
    return '<svg width="1920" height="1080"></svg>'
  }
  return buildSvg(template, data)
}

/**
 * 构建完整 SVG
 */
function buildSvg(template, data) {
  const { canvas = { width: 1920, height: 1080 }, defs, background, elements } = template

  let svg = `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">`

  // defs
  if (defs) {
    svg += '<defs>'
    for (const [id, grad] of Object.entries(defs)) {
      if (grad.type === 'linearGradient') {
        svg += `<linearGradient id="${id}" x1="${grad.x1}" y1="${grad.y1}" x2="${grad.x2}" y2="${grad.y2}">`
        for (const stop of grad.stops) {
          const opacity = stop.opacity !== undefined ? stop.opacity : 1
          svg += `<stop offset="${stop.offset}" style="stop-color:${stop.color};stop-opacity:${opacity}"/>`
        }
        svg += '</linearGradient>'
      }
    }
    svg += '</defs>'
  }

  // 背景
  if (background) {
    if (background.type === 'gradient' && background.gradientId) {
      svg += `<rect width="${canvas.width}" height="${canvas.height}" fill="url(#${background.gradientId})"/>`
    } else {
      svg += `<rect width="${canvas.width}" height="${canvas.height}" fill="${background.color || '#000'}"/>`
    }
  }

  // 渲染所有元素
  if (elements) {
    for (const el of elements) {
      svg += renderElement(el, data)
    }
  }

  svg += '</svg>'
  return svg
}

/**
 * 渲染单个元素
 */
function renderElement(el, data) {
  // 跳过分组占位符
  if (el.type === 'group') {
    let result = ''
    if (el.children) {
      for (const child of el.children) {
        result += renderElement(child, data)
      }
    }
    return result
  }

  // forEach 循环渲染（支持动态数量岗位卡片）
  if (el.forEach) {
    const items = data[el.forEach] || []
    const itemVar = el.itemVar || 'item'
    const indexVar = el.indexVar || 'index'
    const { xBase = 0, yBase = 0, colCount = 1, colWidth = 0, rowHeight = 0 } = el
    let result = ''
    items.forEach((item, index) => {
      const col = index % colCount
      const row = Math.floor(index / colCount)
      const computedX = xBase + col * colWidth
      const computedY = yBase + row * rowHeight
      const itemData = { ...data, [itemVar]: item, [indexVar]: index, computedX, computedY, col, row }
      if (el.children) {
        el.children.forEach(child => {
          result += renderElementWithComputedPosition(child, itemData)
        })
      }
    })
    return result
  }

  switch (el.elType) {
    case 'rect':
      return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"
               rx="${el.rx || 0}" fill="${el.fill || 'none'}"
               stroke="${el.stroke || 'none'}" stroke-width="${el['stroke-width'] || 0}"/>`

    case 'line':
      return `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"
               stroke="${el.stroke || '#000'}" stroke-width="${el['stroke-width'] || 1}"
               opacity="${el.opacity || 1}"/>`

    case 'circle':
      return `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}"
               fill="${el.fill || 'none'}" stroke="${el.stroke || 'none'}"
               stroke-width="${el['stroke-width'] || 0}" opacity="${el.opacity || 1}"/>`

    case 'polygon':
      return `<polygon points="${el.points}" fill="${el.fill || 'none'}"
               stroke="${el.stroke || 'none'}" stroke-width="${el['stroke-width'] || 0}"
               opacity="${el.opacity || 1}"/>`

    case 'text':
      return renderText(el, data)

    case 'tspanText':
      return renderTspanText(el, data)

    default:
      return ''
  }
}

/**
 * 渲染带动态位置的单个元素（用于 forEach 中的子元素）
 */
function renderElementWithComputedPosition(el, data) {
  // 复制元素，避免修改原始模板
  const elCopy = { ...el }

  // 如果元素有 key 属性且值是 'computedX' 或 'computedY'，替换为实际值
  if (elCopy.key === 'computedX') {
    elCopy.key = undefined
    elCopy.text = String(data.computedX || 0)
    return renderText(elCopy, data)
  }
  if (elCopy.key === 'computedY') {
    elCopy.key = undefined
    elCopy.text = String(data.computedY || 0)
    return renderText(elCopy, data)
  }

  // 动态计算 x 和 y 坐标
  // 支持表达式格式：x: '{computedX + 20}' 或直接使用 computedX
  if (elCopy.x !== undefined) {
    if (typeof elCopy.x === 'string' && elCopy.x.includes('{')) {
      // 表达式格式：{computedX + offset} 或 {computedX}
      elCopy.x = evaluateExpression(elCopy.x, data)
    } else if (typeof elCopy.x === 'string' && elCopy.x === 'computedX') {
      elCopy.x = data.computedX
    } else if (typeof elCopy.x === 'number' && data.computedX !== undefined) {
      elCopy.x = data.computedX + elCopy.x
    }
  }
  if (elCopy.y !== undefined) {
    if (typeof elCopy.y === 'string' && elCopy.y.includes('{')) {
      elCopy.y = evaluateExpression(elCopy.y, data)
    } else if (typeof elCopy.y === 'string' && elCopy.y === 'computedY') {
      elCopy.y = data.computedY
    } else if (typeof elCopy.y === 'number' && data.computedY !== undefined) {
      elCopy.y = data.computedY + elCopy.y
    }
  }

  // 处理其他坐标属性
  if (elCopy.x1 !== undefined && typeof elCopy.x1 === 'string' && elCopy.x1.includes('{')) {
    elCopy.x1 = evaluateExpression(elCopy.x1, data)
  }
  if (elCopy.y1 !== undefined && typeof elCopy.y1 === 'string' && elCopy.y1.includes('{')) {
    elCopy.y1 = evaluateExpression(elCopy.y1, data)
  }
  if (elCopy.x2 !== undefined && typeof elCopy.x2 === 'string' && elCopy.x2.includes('{')) {
    elCopy.x2 = evaluateExpression(elCopy.x2, data)
  }
  if (elCopy.y2 !== undefined && typeof elCopy.y2 === 'string' && elCopy.y2.includes('{')) {
    elCopy.y2 = evaluateExpression(elCopy.y2, data)
  }

  // 处理 fill 属性中的表达式
  if (elCopy.fill !== undefined && typeof elCopy.fill === 'string' && elCopy.fill.includes('{')) {
    const result = evaluateExpression(elCopy.fill, data)
    if (result !== null) {
      elCopy.fill = String(result)
    }
  }

  // 处理 color 属性中的表达式
  if (elCopy.color !== undefined && typeof elCopy.color === 'string' && elCopy.color.includes('{')) {
    const result = evaluateExpression(elCopy.color, data)
    if (result !== null) {
      elCopy.color = String(result)
    }
  }

  return renderElement(elCopy, data)
}

/**
 * 计算表达式（支持数学运算和三元表达式）
 */
function evaluateExpression(expr, data) {
  try {
    // 替换变量
    let evalStr = expr.replace(/\{|\}/g, '')
    evalStr = evalStr.replace(/computedX/g, String(data.computedX ?? 0))
    evalStr = evalStr.replace(/computedY/g, String(data.computedY ?? 0))
    evalStr = evalStr.replace(/col/g, String(data.col ?? 0))
    evalStr = evalStr.replace(/row/g, String(data.row ?? 0))
    // 使用间接调用 eval 避免严格模式问题
    const fn = new Function('"use strict"; return (' + evalStr + ')')
    return fn()
  } catch (e) {
    console.warn('Expression evaluation failed:', expr, e)
    return null
  }
}

/**
 * 渲染单行文本
 */
function renderText(el, data) {
  let text = el.text || ''

  // 如果有 key，从数据获取值（支持嵌套属性如 item.jobTitle 或数组索引如 jobs[0].jobTitle）
  if (el.key) {
    let value = data
    // 支持点号路径和数组索引访问（如 jobs[0].jobTitle 或 jobs.0.jobTitle）
    const normalizedKey = el.key.replace(/\[(\d+)\]/g, '.$1')
    if (normalizedKey.includes('.')) {
      const keys = normalizedKey.split('.')
      for (const k of keys) {
        if (value == null) {
          value = undefined
          break
        }
        value = value?.[k]
      }
    } else {
      value = data[el.key]
    }
    // 使用默认值保护，确保 undefined/null 都能 fallback
    text = (value != null && value !== '') ? String(value) : (el.default != null ? String(el.default) : '')
  }

  // 容器宽度限制
  if (el.containerWidth && el.containerWidth > 0) {
    text = truncateSingleLine(text, el.containerWidth, el.fontSize || 14, '...')
  }

  const escaped = escapeXml(text)
  const anchor = el.anchor || 'start'
  const fontWeight = el.fontWeight || el['font-weight'] || 'normal'
  const letterSpacing = el.letterSpacing || el.ls || 0

  return `<text x="${el.x}" y="${el.y}"
           font-family="${el.fontFamily || 'Microsoft YaHei, sans-serif'}"
           font-size="${el.fontSize || 14}"
           fill="${el.color || '#000'}"
           text-anchor="${anchor}"
           font-weight="${fontWeight}"
           letter-spacing="${letterSpacing}">${escaped}</text>`
}

/**
 * 渲染多行文本（智能换行）
 */
function renderTspanText(el, data) {
  let text = el.text || ''

  if (el.key) {
    let value = data
    // 支持点号路径和数组索引访问（如 jobs[0].jobTitle 或 jobs.0.jobTitle）
    const normalizedKey = el.key.replace(/\[(\d+)\]/g, '.$1')
    if (normalizedKey.includes('.')) {
      const keys = normalizedKey.split('.')
      for (const k of keys) {
        value = value?.[k]
      }
    } else {
      value = data[el.key]
    }
    text = (value != null && value !== '') ? String(value) : (el.default != null ? String(el.default) : '')
    // 确保空值不传入 smartTextWrap，避免渲染 "undefined" 字符串
    if (!text) return ''
  }

  const result = smartTextWrap(text, {
    containerWidth: el.containerWidth || 500,
    containerHeight: el.containerHeight || 100,
    fontSize: el.fontSize || 14,
    minFontSize: el.minFontSize || 10,
    lineHeight: el.lineHeight ? (el.lineHeight / (el.fontSize || 14)) : 1.5,
    overflow: el.overflow || 'hidden'
  })

  // 只有明确设置了 anchor 属性才应用，默认左对齐
  const hasAnchor = el.anchor !== undefined
  const anchor = hasAnchor ? el.anchor : 'start'

  if (result.lines.length === 0) {
    return `<text x="${el.x}" y="${el.y}"
             font-family="${el.fontFamily || 'Microsoft YaHei, sans-serif'}"
             font-size="${result.fontSize}"
             font-weight="${el.fontWeight || 'normal'}"
             ${hasAnchor ? `text-anchor="${anchor}"` : ''}></text>`
  }

  const tspans = result.lines.map((line, index) => {
    const dy = index === 0 ? 0 : (el.lineHeight || 22)
    return `<tspan x="${el.x}" dy="${dy}" ${hasAnchor ? `text-anchor="${anchor}"` : ''}>${escapeXml(line)}</tspan>`
  }).join('')

  return `<text x="${el.x}" y="${el.y}"
           font-family="${el.fontFamily || 'Microsoft YaHei, sans-serif'}"
           font-size="${result.fontSize}"
           font-weight="${el.fontWeight || 'normal'}"
           fill="${el.color || '#000'}"
           ${hasAnchor ? `text-anchor="${anchor}"` : ''}>${tspans}</text>`
}

// ================== 蓝色商务模板定义 (template-business 风格) ==================

export const tech01Template = {
  id: 'tech_01',
  name: '蓝白商务',
  colorScheme: 'BLUE',
  canvas: { width: 1920, height: 1080 },

  defs: {
    topBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1E3A5F' },
        { offset: '100%', color: '#2B5B8A' }
      ]
    },
    accentLine: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '0%',
      stops: [
        { offset: '0%', color: '#3B82F6' },
        { offset: '100%', color: '#60A5FA' }
      ]
    },
    contactBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '0%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1E3A5F' },
        { offset: '100%', color: '#2d3748' }
      ]
    }
  },

  background: {
    type: 'solid',
    color: '#F8FAFC'
  },

  elements: [
    // ===== 顶部深色背景区域 =====
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 180, fill: 'url(#topBg)' },
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 6, fill: 'url(#accentLine)' },

    // ===== 公司名称 =====
    { elType: 'text', x: 960, y: 120, fontSize: 88, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'company', containerWidth: 2400, minFontSize: 80, default: '公司名称' },

    // 主标题
    // { elType: 'text', x: 960, y: 150, fontSize: 28, color: '#a0aec0', anchor: 'middle', fontWeight: 'bold', fontFamily: 'Arial', letterSpacing: 4, text: '招贤纳士 · WE ARE HIRING' },

    // 顶部装饰线
    { elType: 'rect', x: 0, y: 174, width: 1920, height: 6, fill: 'url(#accentLine)' },

    // ===== 左侧蓝色竖条 =====
    { elType: 'rect', x: 0, y: 0, width: 8, height: 1080, fill: '#3B82F6' },

    // ===== 白色主容器 - 整体下移，高度增加 =====
    { elType: 'rect', x: 40, y: 240, width: 1840, height: 800, rx: 16, fill: '#FFFFFF', stroke: '#E2E8F0', 'stroke-width': 1 },

    // ===== 职位名称 + 薪资 =====
    { elType: 'text', x: 80, y: 300, fontSize: 40, color: '#1E3A5F', fontWeight: 'bold', key: 'jobTitle', containerWidth: 1400, default: '职位名称' },
    { elType: 'rect', x: 1500, y: 255, width: 320, height: 55, rx: 8, fill: '#3B82F6' },
    { elType: 'text', x: 1660, y: 292, fontSize: 32, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'salary', default: '面议' },

    // ===== 信息标签栏 =====
    { elType: 'rect', x: 80, y: 335, width: 1720, height: 60, rx: 8, fill: '#F8FAFC' },

    // 工作地点
    { elType: 'rect', x: 100, y: 345, width: 150, height: 50, rx: 4, fill: '#e2e8f0' },
    { elType: 'text', x: 170, y: 378, fontSize: 26, color: '#718096', fontWeight: 'bold', anchor: 'middle', text: '工作地点' },
    { elType: 'text', x: 250, y: 378, fontSize: 26, color: '#2d3748', fontWeight: 'bold', key: 'location', containerWidth: 720, minFontSize: 20, default: '不限' },

    // 学历要求
    { elType: 'rect', x: 950, y: 345, width: 120, height: 50, rx: 4, fill: '#e2e8f0' },
    { elType: 'text', x: 1010, y: 378, fontSize: 26, color: '#718096', fontWeight: 'bold', anchor: 'middle', text: '学历要求' },
    { elType: 'text', x: 1090, y: 378, fontSize: 26, color: '#2d3748', fontWeight: 'bold', key: 'education', containerWidth: 300, default: '不限' },

    // 经验要求
    { elType: 'rect', x: 1280, y: 345, width: 120, height: 50, rx: 4, fill: '#e2e8f0' },
    { elType: 'text', x: 1340, y: 378, fontSize: 26, color: '#718096', fontWeight: 'bold', anchor: 'middle', text: '经验要求' },
    { elType: 'text', x: 1420, y: 378, fontSize: 26, color: '#2d3748', fontWeight: 'bold', key: 'experience', containerWidth: 300, default: '不限' },

    // 招聘人数
    { elType: 'rect', x: 1620, y: 345, width: 120, height: 50, rx: 4, fill: '#e2e8f0' },
    { elType: 'text', x: 1680, y: 378, fontSize: 26, color: '#718096', fontWeight: 'bold', anchor: 'middle', text: '招聘人数' },
    { elType: 'text', x: 1760, y: 378, fontSize: 26, color: '#2d3748', fontWeight: 'bold', anchor: 'end', key: 'recruitCount', containerWidth: 180, default: '若干' },

    // 分隔线
    { elType: 'line', x1: 80, y1: 420, x2: 1860, y2: 420, stroke: '#e2e8f0', 'stroke-width': 1 },

    // ===== 职位信息区域 =====
    { elType: 'rect', x: 0, y: 0, width: 12, height: 40, rx: 6, fill: '#3B82F6' },
    { elType: 'text', x: 105, y: 460, fontSize: 26, color: '#1E3A5F', fontWeight: 'bold', text: '职位信息' },
    { elType: 'rect', x: 80, y: 480, width: 1720, height: 200, rx: 10, fill: '#F8FAFC', stroke: '#e2e8f0', 'stroke-width': 1 },
    { elType: 'tspanText', x: 105, y: 520, fontSize: 34, color: '#475569', fontWeight: 'bold', key: 'jobInfo', containerWidth: 1600, containerHeight: 130, lineHeight: 38, minFontSize: 22, autoWrap: true, wordBreak: true },

    // ===== 福利待遇区域 =====
    { elType: 'rect', x: 0, y: 0, width: 12, height: 40, rx: 6, fill: '#fffaf0' },
    { elType: 'text', x: 105, y: 730, fontSize: 26, color: '#1E3A5F', fontWeight: 'bold', text: '福利待遇' },
    { elType: 'rect', x: 80, y: 750, width: 1720, height: 200, rx: 10, fill: '#fffaf0', stroke: '#fffaf0', 'stroke-width': 1 },
    { elType: 'tspanText', x: 105, y: 790, fontSize: 34, color: '#475569', fontWeight: 'bold', key: 'welfare', containerWidth: 1600, containerHeight: 130, lineHeight: 38, minFontSize: 22, autoWrap: true, wordBreak: true },

    // ===== 底部联系方式栏 - 移到海报最下方 =====
    { elType: 'rect', x: 40, y: 980, width: 1840, height: 60, rx: 10, fill: 'url(#contactBg)' },
    { elType: 'text', x: 160, y: 1020, fontSize: 28, color: '#FFFFFF', text: '联 系 人：', fontWeight: 'bold' },
    { elType: 'text', x: 280, y: 1020, fontSize: 28, color: '#FFFFFF', key: 'contactName', fontWeight: 'bold' },
    { elType: 'text', x: 1500, y: 1020, fontSize: 28, color: '#FFFFFF', text: '联系电话：', fontWeight: 'bold' },
    { elType: 'text', x: 1620, y: 1020, fontSize: 28, color: '#FFFFFF', key: 'contactPhone', fontWeight: 'bold' }
  ]
}

// 注册模板
registerTemplate('tech_01', tech01Template)

// ================== 蓝白商务模板 (template-admin 风格) ==================

export const adminTemplate = {
  id: 'admin_01',
  name: '蓝白商务',
  colorScheme: 'BLUE',
  templatePath: '/templates/template-admin.svg',
  canvas: { width: 1920, height: 1080 },

  defs: {
    mainBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1a365d' },
        { offset: '100%', color: '#2c5282' }
      ]
    },
    topBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '0%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1e3a5f' },
        { offset: '100%', color: '#2b5b8a' }
      ]
    },
    accentLine: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '0%',
      stops: [
        { offset: '0%', color: '#4299e1' },
        { offset: '100%', color: '#38b2ac' }
      ]
    },
    salaryBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '0%',
      stops: [
        { offset: '0%', color: '#4299e1' },
        { offset: '100%', color: '#38b2ac' }
      ]
    },
    labelBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '0%', y2: '100%',
      stops: [
        { offset: '0%', color: '#2D4A6B' },
        { offset: '100%', color: '#1E3A5F' }
      ]
    }
  },

  background: {
    type: 'gradient',
    gradientId: 'mainBg'
  },

  elements: [
    // ===== 顶部公司名称区域（深蓝背景）=====
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 180, fill: 'url(#topBg)' },
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 6, fill: 'url(#accentLine)' },

    // ===== 公司名称 - 中间最上方 =====
    { elType: 'text', x: 960, y: 120, fontSize: 88, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'company', containerWidth: 2400, minFontSize: 80, default: '公司名称' },

    // 主标题
    // { elType: 'text', x: 960, y: 150, fontSize: 28, color: '#A0B4C8', anchor: 'middle', fontFamily: 'Arial', letterSpacing: 4, text: '招贤纳士 · WE ARE HIRING' },

    // 顶部装饰线
    { elType: 'rect', x: 0, y: 174, width: 1920, height: 6, fill: 'url(#accentLine)' },

    // ===== 左侧蓝色竖条 =====
    { elType: 'rect', x: 0, y: 0, width: 8, height: 1080, fill: '#4299e1' },

    // ===== 半透明主容器 =====
    { elType: 'rect', x: 40, y: 240, width: 1840, height: 800, rx: 16, fill: '#1E3A5F', stroke: '#3D5A7A', 'stroke-width': 1 },

    // ===== 职位名称 + 薪资 =====
    { elType: 'text', x: 80, y: 310, fontSize: 42, color: '#FFFFFF', fontWeight: 'bold', key: 'jobTitle', containerWidth: 1400, default: '职位名称' },
    { elType: 'rect', x: 1350, y: 275, width: 480, height: 60, rx: 10, fill: 'url(#salaryBg)' },
    { elType: 'text', x: 1600, y: 315, fontSize: 32, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'salary', default: '面议' },

    // ===== 信息标签栏 =====
    { elType: 'rect', x: 80, y: 355, width: 1720, height: 90, rx: 8, fill: 'url(#labelBg)' },

    // 工作地点
    { elType: 'rect', x: 200, y: 365, width: 520, height: 70, rx: 8, fill: '#3D5A7A' },
    { elType: 'text', x: 460, y: 395, fontSize: 22, color: '#A0B4C8', anchor: 'middle', fontWeight: 'bold', text: '工作地点' },
    { elType: 'text', x: 460, y: 425, fontSize: 20, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'location', containerWidth: 520, default: '不限' },

    // 学历要求
    { elType: 'rect', x: 740, y: 365, width: 320, height: 70, rx: 8, fill: '#3D5A7A' },
    { elType: 'text', x: 900, y: 395, fontSize: 24, color: '#A0B4C8', anchor: 'middle', fontWeight: 'bold', text: '学历要求' },
    { elType: 'text', x: 900, y: 425, fontSize: 26, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'education', containerWidth: 300, default: '不限' },

    // 经验要求
    { elType: 'rect', x: 1080, y: 365, width: 320, height: 70, rx: 8, fill: '#3D5A7A' },
    { elType: 'text', x: 1240, y: 395, fontSize: 24, color: '#A0B4C8', anchor: 'middle', fontWeight: 'bold', text: '经验要求' },
    { elType: 'text', x: 1240, y: 425, fontSize: 26, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'experience', containerWidth: 300, default: '不限' },

    // 招聘人数
    { elType: 'rect', x: 1420, y: 365, width: 320, height: 70, rx: 8, fill: '#3D5A7A' },
    { elType: 'text', x: 1580, y: 395, fontSize: 24, color: '#A0B4C8', anchor: 'middle', fontWeight: 'bold', text: '招聘人数' },
    { elType: 'text', x: 1580, y: 425, fontSize: 26, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'recruitCount', containerWidth: 300, default: '若干' },

    // 分隔线
    { elType: 'line', x1: 80, y1: 475, x2: 1860, y2: 475, stroke: '#4299e1', 'stroke-width': 1, opacity: 0.3 },

    // ===== 职位信息区域 =====
    { elType: 'rect', x: 80, y: 500, width: 8, height: 40, rx: 4, fill: '#4299e1' },
    { elType: 'text', x: 105, y: 530, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', text: '职位信息' },
    { elType: 'rect', x: 80, y: 550, width: 1720, height: 160, rx: 10, fill: '#2D4A6B', stroke: '#3D5A7A', 'stroke-width': 1 },
    { elType: 'tspanText', x: 105, y: 590, fontSize: 34, color: '#FFFFFF', fontWeight: 'bold', key: 'jobInfo', containerWidth: 1600, containerHeight: 120, lineHeight: 38, minFontSize: 22, autoWrap: true, wordBreak: true },

    // ===== 福利待遇区域 =====
    { elType: 'rect', x: 80, y: 735, width: 8, height: 40, rx: 4, fill: '#4299e1' },
    { elType: 'text', x: 105, y: 765, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', text: '福利待遇' },
    { elType: 'rect', x: 80, y: 785, width: 1720, height: 160, rx: 10, fill: '#2D4A6B', stroke: '#3D5A7A', 'stroke-width': 1 },
    { elType: 'tspanText', x: 105, y: 820, fontSize: 34, color: '#FFFFFF', fontWeight: 'bold', key: 'welfare', containerWidth: 1600, containerHeight: 120, lineHeight: 38, minFontSize: 22, autoWrap: true, wordBreak: true },

    // ===== 底部联系方式栏 =====
    { elType: 'rect', x: 40, y: 970, width: 1840, height: 70, rx: 10, fill: '#0F2640' },
    { elType: 'text', x: 160, y: 1005, fontSize: 28, color: '#FFFFFF', fontWeight: 'bold', text: '联 系 人：' },
    { elType: 'text', x: 280, y: 1005, fontSize: 28, color: '#FFFFFF', key: 'contactName', fontWeight: 'bold' },
    { elType: 'text', x: 1600, y: 1005, fontSize: 28, color: '#FFFFFF', fontWeight: 'bold', anchor: 'end', text: '联系电话：' },
    { elType: 'text', x: 1780, y: 1005, fontSize: 28, color: '#FFFFFF', anchor: 'end', key: 'contactPhone', fontWeight: 'bold' },

    // ===== 右侧装饰元素 =====
    { elType: 'circle', cx: 1880, cy: 800, r: 280, fill: '#4299e1', opacity: 0.08 },
    { elType: 'circle', cx: 1880, cy: 850, r: 180, fill: '#4299e1', opacity: 0.12 },

    // ===== 底部装饰线 =====
    { elType: 'line', x1: 100, y1: 1010, x2: 1820, y2: 1010, stroke: '#4299e1', 'stroke-width': 3, opacity: 0.3 }
  ]
}

// 注册行政模板
registerTemplate('admin_01', adminTemplate)

// ================== 多岗位招聘模板 (multi-jobs) ==================
export const multi01Template = {
  id: 'multi_01',
  name: '多岗招聘',
  colorScheme: 'BLUE',
  canvas: { width: 1920, height: 1080 },

  defs: {
    mainBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1a365d' },
        { offset: '100%', color: '#2c5282' }
      ]
    },
    accentGrad: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '0%',
      stops: [
        { offset: '0%', color: '#4299e1' },
        { offset: '100%', color: '#38b2ac' }
      ]
    }
  },

  background: {
    type: 'gradient',
    gradientId: 'mainBg'
  },

  elements: [
    // ===== 顶部全宽背景 =====
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 180, fill: 'url(#mainBg)' },

    // 顶部装饰线
    { elType: 'rect', x: 0, y: 0, width: 1920, height: 4, fill: 'url(#accentGrad)' },

    // 公司名称（顶部居中）
    { elType: 'text', x: 960, y: 80, fontSize: 87, color: '#ffffff', anchor: 'middle', fontWeight: 'bold', key: 'company', containerWidth: 2400, minFontSize: 80, default: '公司名称' },

    // 顶部底部装饰线
    { elType: 'rect', x: 0, y: 100, width: 1920, height: 4, fill: 'url(#accentGrad)' },

    // ===== 动态岗位卡片（4岗位 2×2 网格）=====
    {
      forEach: 'jobs',
      itemVar: 'job',
      indexVar: 'index',
      xBase: 20,
      yBase: 126,
      colCount: 2,
      colWidth: 940,
      rowHeight: 485,
      children: [
        // 卡片背景（白底）
        { elType: 'rect', x: '{computedX}', y: '{computedY}', width: 930, height: 470, rx: 12, fill: '#ffffff', stroke: '#e2e8f0', 'stroke-width': 1 },
        // 左侧彩色边条
        { elType: 'rect', x: '{computedX}', y: '{computedY}', width: 8, height: 470, rx: 4, fill: 'url(#accentGrad)' },
        // 职位名称
        { elType: 'text', x: '{computedX + 30}', y: '{computedY + 40}', fontSize: 28, color: '#1a365d', fontWeight: 'bold', key: 'job.jobTitle', containerWidth: 860, default: '职位名称' },
        // 信息栏背景（压缩高度）
        { elType: 'rect', x: '{computedX + 30}', y: '{computedY + 55}', width: 860, height: 36, rx: 6, fill: '#f7fafc' },
        // 薪资
        { elType: 'text', x: '{computedX + 45}', y: '{computedY + 80}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', text: '薪资：' },
        { elType: 'text', x: '{computedX + 105}', y: '{computedY + 80}', fontSize: 22, color: '#e53e3e', fontWeight: 'bold', key: 'job.salary', default: '面议' },
        // 人数
        { elType: 'text', x: '{computedX + 280}', y: '{computedY + 80}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', text: '人数：' },
        { elType: 'text', x: '{computedX + 345}', y: '{computedY + 80}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', key: 'job.recruitCount', default: '若干' },
        // 学历
        { elType: 'text', x: '{computedX + 500}', y: '{computedY + 80}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', text: '学历：' },
        { elType: 'text', x: '{computedX + 570}', y: '{computedY + 80}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', key: 'job.education', default: '不限' },
        // ===== 工作地（独立一行）=====
        { elType: 'rect', x: '{computedX + 30}', y: '{computedY + 100}', width: 860, height: 38, rx: 6, fill: '#ebf8ff' },
        { elType: 'text', x: '{computedX + 45}', y: '{computedY + 126}', fontSize: 22, color: '#2b6cb0', fontWeight: 'bold', text: '工作地：' },
        { elType: 'text', x: '{computedX + 145}', y: '{computedY + 126}', fontSize: 22, color: '#2d3748', fontWeight: 'bold', key: 'job.location', containerWidth: 700, default: '不限' },
        // ===== 福利待遇（28px）=====
        { elType: 'text', x: '{computedX + 30}', y: '{computedY + 160}', fontSize: 24, color: '#2d3748', fontWeight: 'bold', text: '★ 福利待遇' },
        { elType: 'tspanText', x: '{computedX + 30}', y: '{computedY + 193}', fontSize: 26, color: '#4a5568', fontWeight: 'normal', key: 'job.welfare', containerWidth: 834, containerHeight: 72, lineHeight: 38, minFontSize: 26, autoWrap: true, wordBreak: true },
        // ===== 职位信息（28px，支持120字）=====
        { elType: 'text', x: '{computedX + 30}', y: '{computedY + 235}', fontSize: 24, color: '#2d3748', fontWeight: 'bold', text: '★ 职位信息' },
        { elType: 'tspanText', x: '{computedX + 30}', y: '{computedY + 267}', fontSize: 26, color: '#4a5568', fontWeight: 'normal', key: 'job.jobInfo', containerWidth: 834, containerHeight: 192, lineHeight: 36, minFontSize: 26, autoWrap: true, wordBreak: true},
        // ===== 底部联系信息 ======
        { elType: 'rect', x: '{computedX + 30}', y: '{computedY + 420}', width: 860, height: 38, rx: 6, fill: '#f7fafc' },
        { elType: 'text', x: '{computedX + 45}', y: '{computedY + 445}', fontSize: 20, color: '#718096', fontWeight: 'bold', text: '联系人：' },
        { elType: 'text', x: '{computedX + 130}', y: '{computedY + 445}', fontSize: 22, color: '#1a365d', fontWeight: 'bold', key: 'job.contactName', containerWidth: 200 },
        { elType: 'text', x: '{computedX + 450}', y: '{computedY + 445}', fontSize: 20, color: '#718096', fontWeight: 'bold', text: '联系电话：' },
        { elType: 'text', x: '{computedX + 565}', y: '{computedY + 445}', fontSize: 22, color: '#1a3658', fontWeight: 'bold', key: 'job.contactPhone', containerWidth: 280 }
      ]
    },

    // ===== 底部装饰 =====
    // { elType: 'rect', x: 0, y: 1030, width: 1920, height: 50, fill: '#1a365d' }
  ]
}

// 注册多岗位模板
registerTemplate('multi_01', multi01Template)
