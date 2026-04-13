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
 * 渲染单行文本
 */
function renderText(el, data) {
  let text = el.text || ''

  // 如果有 key，从数据获取值
  if (el.key) {
    text = data[el.key] || el.default || ''
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
    text = data[el.key] || el.default || ''
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
             ${hasAnchor ? `text-anchor="${anchor}"` : ''}></text>`
  }

  const tspans = result.lines.map((line, index) => {
    const dy = index === 0 ? 0 : (el.lineHeight || 22)
    return `<tspan x="${el.x}" dy="${dy}" ${hasAnchor ? `text-anchor="${anchor}"` : ''}>${escapeXml(line)}</tspan>`
  }).join('')

  return `<text x="${el.x}" y="${el.y}"
           font-family="${el.fontFamily || 'Microsoft YaHei, sans-serif'}"
           font-size="${result.fontSize}"
           fill="${el.color || '#000'}"
           ${hasAnchor ? `text-anchor="${anchor}"` : ''}>${tspans}</text>`
}

// ================== 蓝白商务模板定义 (template-business 风格) ==================

export const tech01Template = {
  id: 'tech_01',
  name: '蓝白商务',
  colorScheme: 'BLUE',
  canvas: { width: 1920, height: 1080 },

  defs: {
    bgGrad: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1E3A5F' },
        { offset: '100%', color: '#2B5B8A' }
      ]
    }
  },

  background: {
    type: 'gradient',
    gradientId: 'bgGrad'
  },

  elements: [
    // ===== 左侧主视觉区域 =====

    // 装饰圆（垂直居中）
    { elType: 'circle', cx: 380, cy: 540, r: 280, fill: '#3B82F6', opacity: 0.15 },
    { elType: 'circle', cx: 380, cy: 540, r: 180, fill: '#3B82F6', opacity: 0.2 },

    // 公司信息（支持换行，最多2行，第二行也居中）
    { elType: 'tspanText', x: 380, y: 220, fontSize: 56, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'company', containerWidth: 420, containerHeight: 130, lineHeight: 65, minFontSize: 36, default: '公司名称' },

    // JOIN US
    { elType: 'text', x: 380, y: 420, fontSize: 28, color: '#FFFFFF', anchor: 'middle', fontFamily: 'Arial', opacity: 0.8, text: 'JOIN US' },

    // 装饰线
    { elType: 'rect', x: 280, y: 455, width: 200, height: 4, rx: 2, fill: '#4A90C8' },

    // 职位名称背景
    { elType: 'rect', x: 130, y: 510, width: 500, height: 80, rx: 10, fill: '#FFFFFF', opacity: 0.95 },
    // 职位名称（可缩放字号）
    { elType: 'text', x: 380, y: 565, fontSize: 36, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'jobTitle', containerWidth: 480, default: '职位名称' },

    // 薪资
    { elType: 'text', x: 380, y: 660, fontSize: 42, color: '#FFD700', anchor: 'middle', fontWeight: 'bold', key: 'salary', default: '面议' },

    // ===== 右侧信息卡片 =====

    // 白色卡片背景
    { elType: 'rect', x: 760, y: 80, width: 1060, height: 920, rx: 20, fill: '#FFFFFF' },

    // 标题区域
    { elType: 'text', x: 1290, y: 130, fontSize: 24, color: '#64748B', anchor: 'middle', fontFamily: 'Arial', text: 'POSITION DETAILS' },
    { elType: 'text', x: 1290, y: 170, fontSize: 32, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', text: '职位详情' },
    { elType: 'line', x1: 810, y1: 195, x2: 1770, y2: 195, stroke: '#E2E8F0', 'stroke-width': 2 },

    // ===== 基本信息网格 =====
    // 工作地点
    { elType: 'rect', x: 810, y: 220, width: 440, height: 50, rx: 8, fill: '#F8FAFC' },
    { elType: 'text', x: 830, y: 253, fontSize: 16, color: '#64748B', text: '工作地点' },
    { elType: 'text', x: 1230, y: 253, fontSize: 16, color: '#1E293B', anchor: 'end', fontWeight: '500', key: 'location', containerWidth: 280, default: '不限' },

    // 学历要求
    { elType: 'rect', x: 1270, y: 220, width: 440, height: 50, rx: 8, fill: '#F8FAFC' },
    { elType: 'text', x: 1290, y: 253, fontSize: 16, color: '#64748B', text: '学历要求' },
    { elType: 'text', x: 1690, y: 253, fontSize: 16, color: '#1E293B', anchor: 'end', fontWeight: '500', key: 'education', containerWidth: 280, default: '不限' },

    // 经验要求
    { elType: 'rect', x: 810, y: 285, width: 440, height: 50, rx: 8, fill: '#F8FAFC' },
    { elType: 'text', x: 830, y: 318, fontSize: 16, color: '#64748B', text: '经验要求' },
    { elType: 'text', x: 1230, y: 318, fontSize: 16, color: '#1E293B', anchor: 'end', fontWeight: '500', key: 'experience', containerWidth: 280, default: '不限' },

    // 招聘人数
    { elType: 'rect', x: 1270, y: 285, width: 440, height: 50, rx: 8, fill: '#F8FAFC' },
    { elType: 'text', x: 1290, y: 318, fontSize: 16, color: '#64748B', text: '招聘人数' },
    { elType: 'text', x: 1690, y: 318, fontSize: 16, color: '#1E293B', anchor: 'end', fontWeight: '500', key: 'recruitCount', containerWidth: 260, default: '若干' },

    // ===== 职位信息 =====
    { elType: 'text', x: 810, y: 380, fontSize: 20, color: '#1E3A5F', fontWeight: 'bold', text: '职位信息' },
    { elType: 'rect', x: 810, y: 400, width: 960, height: 260, rx: 10, fill: '#F8FAFC', stroke: '#E2E8F0', 'stroke-width': 1 },
    { elType: 'tspanText', x: 830, y: 430, fontSize: 15, color: '#475569', key: 'jobInfo', containerWidth: 880, containerHeight: 220, lineHeight: 22, minFontSize: 10, default: '职位信息内容' },

    // ===== 福利待遇 =====
    { elType: 'text', x: 810, y: 700, fontSize: 20, color: '#1E3A5F', fontWeight: 'bold', text: '福利待遇' },
    { elType: 'rect', x: 810, y: 720, width: 960, height: 100, rx: 10, fill: '#EFF6FF' },
    { elType: 'tspanText', x: 830, y: 750, fontSize: 15, color: '#475569', key: 'welfare', containerWidth: 880, containerHeight: 60, lineHeight: 22, minFontSize: 10, default: '福利待遇内容' },

    // ===== 联系方式 =====
    { elType: 'rect', x: 810, y: 910, width: 960, height: 60, rx: 10, fill: '#1E3A5F' },
    { elType: 'text', x: 910, y: 948, fontSize: 18, color: '#FFFFFF', key: 'contactName', default: '联系人' },
    { elType: 'text', x: 1290, y: 948, fontSize: 18, color: '#FFFFFF', anchor: 'middle', key: 'contactPhone', default: '联系电话' },
    { elType: 'text', x: 1750, y: 948, fontSize: 16, color: '#FFFFFF', anchor: 'end', opacity: 0.8, text: '期待您的加入' }
  ]
}

// 注册模板
registerTemplate('tech_01', tech01Template)

// ================== 墨绿商务模板定义 ==================

export const tech02Template = {
  id: 'tech_02',
  name: '墨绿商务',
  colorScheme: 'GREEN',
  canvas: { width: 1920, height: 1080 },

  defs: {
    greenBg: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '100%',
      stops: [
        { offset: '0%', color: '#1B5E20' },
        { offset: '100%', color: '#2E7D32' }
      ]
    },
    goldAccent: {
      type: 'linearGradient',
      x1: '0%', y1: '0%', x2: '100%', y2: '0%',
      stops: [
        { offset: '0%', color: '#FFC107' },
        { offset: '100%', color: '#FFD54F' }
      ]
    }
  },

  background: {
    type: 'gradient',
    gradientId: 'greenBg'
  },

  elements: [
    // ===== 顶部标题区域 =====
    { elType: 'rect', x: 100, y: 40, width: 1720, height: 160, rx: 16, fill: '#FFFFFF' },
    { elType: 'rect', x: 100, y: 40, width: 1720, height: 6, rx: 3, fill: 'url(#goldAccent)' },
    { elType: 'text', x: 960, y: 120, fontSize: 64, color: '#1B5E20', anchor: 'middle', fontWeight: 'bold', text: '招 贤 纳 士' },
    { elType: 'text', x: 960, y: 170, fontSize: 28, color: '#2E7D32', anchor: 'middle', fontFamily: 'Arial', letterSpacing: 8, text: 'JOIN US' },

    // ===== 顶部信息横条 =====
    { elType: 'rect', x: 100, y: 220, width: 1720, height: 70, rx: 8, fill: '#FFFFFF' },
    { elType: 'rect', x: 100, y: 220, width: 1720, height: 6, rx: 3, fill: 'url(#greenBg)' },

    // 工作地点
    { elType: 'rect', x: 120, y: 235, width: 380, height: 40, rx: 6, fill: '#E8F5E9' },
    { elType: 'text', x: 140, y: 248, fontSize: 11, color: '#666666', text: '工作地点' },
    { elType: 'text', x: 140, y: 268, fontSize: 14, color: '#1B5E20', fontWeight: 'bold', key: 'location', containerWidth: 340, default: '不限' },

    // 学历要求
    { elType: 'rect', x: 520, y: 235, width: 380, height: 40, rx: 6, fill: '#E8F5E9' },
    { elType: 'text', x: 540, y: 248, fontSize: 11, color: '#666666', text: '学历要求' },
    { elType: 'text', x: 540, y: 268, fontSize: 14, color: '#1B5E20', fontWeight: 'bold', key: 'education', containerWidth: 340, default: '不限' },

    // 经验要求
    { elType: 'rect', x: 920, y: 235, width: 380, height: 40, rx: 6, fill: '#E8F5E9' },
    { elType: 'text', x: 940, y: 248, fontSize: 11, color: '#666666', text: '经验要求' },
    { elType: 'text', x: 940, y: 268, fontSize: 14, color: '#1B5E20', fontWeight: 'bold', key: 'experience', containerWidth: 340, default: '不限' },

    // 招聘人数
    { elType: 'rect', x: 1320, y: 235, width: 480, height: 40, rx: 6, fill: '#E8F5E9' },
    { elType: 'text', x: 1340, y: 248, fontSize: 11, color: '#666666', text: '招聘人数' },
    { elType: 'text', x: 1340, y: 268, fontSize: 14, color: '#1B5E20', fontWeight: 'bold', key: 'recruitCount', containerWidth: 420, default: '若干' },

    // ===== 左侧区域 =====
    { elType: 'rect', x: 100, y: 310, width: 580, height: 700, rx: 12, fill: '#FFFFFF' },

    // 公司名称
    { elType: 'text', x: 390, y: 380, fontSize: 22, color: '#1B5E20', anchor: 'middle', key: 'company', default: '公司名称' },

    // 装饰线
    { elType: 'rect', x: 200, y: 410, width: 380, height: 3, rx: 2, fill: 'url(#goldAccent)' },

    // 职位名称卡片
    { elType: 'rect', x: 140, y: 450, width: 500, height: 100, rx: 12, fill: '#F1F8E9', stroke: '#2E7D32', 'stroke-width': 2 },
    { elType: 'text', x: 390, y: 515, fontSize: 36, color: '#1B5E20', anchor: 'middle', fontWeight: 'bold', key: 'jobTitle', containerWidth: 460, default: '职位名称' },

    // 薪资
    { elType: 'rect', x: 140, y: 580, width: 500, height: 70, rx: 10, fill: 'url(#goldAccent)' },
    { elType: 'text', x: 390, y: 628, fontSize: 36, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'salary', default: '面议' },

    // 福利待遇
    { elType: 'text', x: 140, y: 700, fontSize: 18, color: '#1B5E20', fontWeight: 'bold', text: '★ 福利待遇 ★' },
    { elType: 'rect', x: 140, y: 720, width: 500, height: 80, rx: 8, fill: '#F1F8E9' },
    { elType: 'tspanText', x: 155, y: 745, fontSize: 14, color: '#37474F', key: 'welfare', containerWidth: 470, containerHeight: 50, lineHeight: 20, minFontSize: 10, default: '福利待遇内容' },

    // ===== 右侧区域 =====
    { elType: 'rect', x: 700, y: 310, width: 1120, height: 700, rx: 12, fill: '#FFFFFF' },
    { elType: 'rect', x: 700, y: 310, width: 1120, height: 6, rx: 3, fill: 'url(#greenBg)' },

    // 职位详情标题
    { elType: 'text', x: 740, y: 380, fontSize: 28, color: '#1B5E20', fontWeight: 'bold', text: '职位详情' },
    { elType: 'text', x: 740, y: 410, fontSize: 14, color: '#666666', fontFamily: 'Arial', text: 'POSITION DETAILS' },
    { elType: 'line', x1: 740, y1: 430, x2: 1780, y2: 430, stroke: '#E8F5E9', 'stroke-width': 2 },

    // ===== 职位信息 =====
    { elType: 'text', x: 740, y: 470, fontSize: 18, color: '#1B5E20', fontWeight: 'bold', text: '职位信息' },
    { elType: 'rect', x: 740, y: 490, width: 1040, height: 220, rx: 8, fill: '#F1F8E9' },
    { elType: 'tspanText', x: 755, y: 515, fontSize: 14, color: '#37474F', key: 'jobInfo', containerWidth: 970, containerHeight: 185, lineHeight: 20, minFontSize: 10, default: '职位信息内容' },

    // ===== 联系栏 =====
    { elType: 'rect', x: 740, y: 740, width: 1040, height: 70, rx: 10, fill: 'url(#greenBg)' },
    { elType: 'text', x: 820, y: 780, fontSize: 20, color: '#FFFFFF', key: 'contactName', containerWidth: 300, default: '联系人' },
    { elType: 'text', x: 1200, y: 780, fontSize: 20, color: '#FFC107', key: 'contactPhone', default: '联系电话' },

    // ===== 底部装饰 =====
    { elType: 'line', x1: 100, y1: 990, x2: 1820, y2: 990, stroke: '#1B5E20', 'stroke-width': 3 }
  ]
}

// 注册墨绿模板
registerTemplate('tech_02', tech02Template)

// ================== 行政专员模板 (template-admin 风格) ==================

export const adminTemplate = {
  id: 'admin_01',
  name: '蓝白商务',
  colorScheme: 'BLUE',
  templatePath: '/templates/template-admin.svg',
  canvas: { width: 1920, height: 1080 },

  background: {
    type: 'solid',
    color: '#F8FAFC'
  },

  elements: [
    // ===== 装饰元素 =====
    { elType: 'circle', cx: 0, cy: 0, r: 300, fill: '#3B82F6', opacity: 0.05 },
    { elType: 'circle', cx: 0, cy: 0, r: 200, fill: '#3B82F6', opacity: 0.08 },
    { elType: 'circle', cx: 150, cy: 150, r: 80, fill: 'none', stroke: '#3B82F6', 'stroke-width': 2, opacity: 0.15 },
    { elType: 'circle', cx: 1920, cy: 1080, r: 350, fill: '#3B82F6', opacity: 0.05 },
    { elType: 'circle', cx: 1920, cy: 1080, r: 220, fill: '#3B82F6', opacity: 0.08 },
    { elType: 'line', x1: 0, y1: 200, x2: 300, y2: 200, stroke: '#3B82F6', 'stroke-width': 2, opacity: 0.2 },
    { elType: 'line', x1: 1620, y1: 880, x2: 1920, y2: 880, stroke: '#3B82F6', 'stroke-width': 2, opacity: 0.2 },

    // ===== 左侧蓝色竖条 =====
    { elType: 'rect', x: 0, y: 0, width: 8, height: 1080, rx: 0, fill: '#3B82F6' },

    // ===== 左侧主视觉区 =====
    { elType: 'rect', x: 60, y: 100, width: 600, height: 880, rx: 16, fill: '#FFFFFF', stroke: '#E2E8F0', 'stroke-width': 1 },

    // 公司名称
    { elType: 'text', x: 360, y: 180, fontSize: 64, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'company', default: '公司名称' },

    // 分隔线
    { elType: 'rect', x: 140, y: 210, width: 440, height: 3, rx: 2, fill: '#3B82F6' },

    // 职位名称
    { elType: 'text', x: 360, y: 320, fontSize: 48, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'jobTitle', containerWidth: 520, default: '职位名称' },

    // 薪资
    { elType: 'rect', x: 140, y: 380, width: 440, height: 80, rx: 12, fill: '#3B82F6' },
    { elType: 'text', x: 360, y: 438, fontSize: 42, color: '#FFFFFF', anchor: 'middle', fontWeight: 'bold', key: 'salary', default: '面议' },

    // 信息标签 - 第一行
    { elType: 'rect', x: 140, y: 520, width: 200, height: 80, rx: 8, fill: '#F1F8E9' },
    { elType: 'text', x: 240, y: 555, fontSize: 12, color: '#64748B', anchor: 'middle', text: '工作地点' },
    { elType: 'text', x: 240, y: 580, fontSize: 16, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'location', containerWidth: 180, default: '不限' },

    { elType: 'rect', x: 360, y: 520, width: 200, height: 80, rx: 8, fill: '#F1F8E9' },
    { elType: 'text', x: 460, y: 555, fontSize: 12, color: '#64748B', anchor: 'middle', text: '学历要求' },
    { elType: 'text', x: 460, y: 580, fontSize: 16, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'education', containerWidth: 180, default: '不限' },

    // 信息标签 - 第二行
    { elType: 'rect', x: 140, y: 620, width: 200, height: 80, rx: 8, fill: '#F1F8E9' },
    { elType: 'text', x: 240, y: 655, fontSize: 12, color: '#64748B', anchor: 'middle', text: '经验要求' },
    { elType: 'text', x: 240, y: 680, fontSize: 16, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'experience', containerWidth: 180, default: '不限' },

    { elType: 'rect', x: 360, y: 620, width: 200, height: 80, rx: 8, fill: '#F1F8E9' },
    { elType: 'text', x: 460, y: 655, fontSize: 12, color: '#64748B', anchor: 'middle', text: '招聘人数' },
    { elType: 'text', x: 460, y: 680, fontSize: 16, color: '#1E3A5F', anchor: 'middle', fontWeight: 'bold', key: 'recruitCount', containerWidth: 180, default: '若干' },

    // JOIN US
    { elType: 'text', x: 360, y: 780, fontSize: 28, color: '#3B82F6', anchor: 'middle', fontFamily: 'Arial', letterSpacing: 4, text: 'JOIN US' },

    // 底部装饰
    { elType: 'rect', x: 140, y: 820, width: 440, height: 4, rx: 2, fill: '#3B82F6', opacity: 0.3 },

    // 左侧联系人信息
    { elType: 'text', x: 360, y: 870, fontSize: 16, color: '#64748B', anchor: 'middle', key: 'contactName', default: '联系人' },
    { elType: 'text', x: 360, y: 895, fontSize: 16, color: '#64748B', anchor: 'middle', key: 'contactPhone', default: '联系电话' },

    // ===== 右侧区域 =====
    { elType: 'rect', x: 700, y: 100, width: 1160, height: 880, rx: 16, fill: '#FFFFFF', stroke: '#E2E8F0', 'stroke-width': 1 },

    // 右侧标题
    { elType: 'text', x: 760, y: 180, fontSize: 36, color: '#1E3A5F', fontWeight: 'bold', text: '职位详情' },
    { elType: 'text', x: 760, y: 215, fontSize: 14, color: '#94A3B8', fontFamily: 'Arial', text: 'POSITION DETAILS' },
    { elType: 'line', x1: 760, y1: 245, x2: 1820, y2: 245, stroke: '#E2E8F0', 'stroke-width': 2 },

    // ===== 福利待遇 =====
    { elType: 'rect', x: 760, y: 280, width: 8, height: 40, rx: 4, fill: '#3B82F6' },
    { elType: 'text', x: 785, y: 310, fontSize: 22, color: '#1E3A5F', fontWeight: 'bold', text: '福利待遇' },
    { elType: 'rect', x: 760, y: 335, width: 1060, height: 80, rx: 10, fill: '#F8FAFC', stroke: '#E2E8F0', 'stroke-width': 1 },
    { elType: 'tspanText', x: 785, y: 375, fontSize: 16, color: '#475569', key: 'welfare', containerWidth: 1010, containerHeight: 30, lineHeight: 22, minFontSize: 12, default: '福利待遇内容' },

    // ===== 岗位职责 =====
    { elType: 'rect', x: 760, y: 450, width: 8, height: 40, rx: 4, fill: '#3B82F6' },
    { elType: 'text', x: 785, y: 480, fontSize: 22, color: '#1E3A5F', fontWeight: 'bold', text: '职位信息' },
    { elType: 'rect', x: 760, y: 505, width: 1060, height: 240, rx: 10, fill: '#F8FAFC', stroke: '#E2E8F0', 'stroke-width': 1 },
    { elType: 'tspanText', x: 785, y: 545, fontSize: 15, color: '#475569', key: 'jobInfo', containerWidth: 980, containerHeight: 190, lineHeight: 22, minFontSize: 10, default: '职位信息内容' }
  ]
}

// 注册行政模板
registerTemplate('admin_01', adminTemplate)
