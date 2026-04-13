/**
 * 智能文本换行工具
 * 针对 TV 海报场景优化：保证内容不超出固定容器高度
 */

/**
 * 计算单个字符的宽度因子
 * 中文字符宽度为1，英文/数字/符号宽度为0.5
 * @param {string} char
 * @returns {number}
 */
function getCharWidth(char) {
  // 中文 Unicode 范围
  if (/[\u4e00-\u9fa5]/.test(char)) {
    return 1
  }
  // 日文
  if (/[\u3040-\u30ff]/.test(char)) {
    return 1
  }
  // 韩文
  if (/[\uac00-\ud7af]/.test(char)) {
    return 1
  }
  // 全角字符
  if (/[！-～]/.test(char)) {
    return 1
  }
  // 半角字符
  return 0.5
}

/**
 * 估算文本在指定字号下的宽度(px)
 * @param {string} text
 * @param {number} fontSize
 * @returns {number}
 */
function estimateTextWidth(text, fontSize) {
  let width = 0
  for (const char of text) {
    width += getCharWidth(char) * fontSize
  }
  return width
}

/**
 * 将文本按字符分割成多行
 * @param {string} text - 原始文本
 * @param {number} containerWidth - 容器宽度(px)
 * @param {number} fontSize - 字号
 * @returns {string[]} 行数组
 */
function splitTextToLines(text, containerWidth, fontSize) {
  if (text == null || text === '') return ['']
  text = String(text)

  const lines = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    let currentLine = ''
    let currentWidth = 0

    for (const char of paragraph) {
      const charWidth = getCharWidth(char) * fontSize

      // 预估宽度 = 当前行宽度 + 字符宽度 + 边距
      const estimatedWidth = currentWidth + charWidth + 2

      if (estimatedWidth > containerWidth && currentLine.length > 0) {
        // 当前行已满，切换到新行
        lines.push(currentLine)
        currentLine = char
        currentWidth = charWidth
      } else {
        currentLine += char
        currentWidth += charWidth
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  // 过滤空行
  return lines.filter(line => line !== '')
}

/**
 * 智能文本换行主函数
 * @param {string} text - 原始文本
 * @param {Object} options - 配置项
 * @param {number} options.containerWidth - 容器宽度(px)
 * @param {number} options.containerHeight - 容器高度(px)
 * @param {number} [options.fontSize=14] - 初始字号
 * @param {number} [options.minFontSize=10] - 最小字号
 * @param {number} [options.lineHeight=1.5] - 行高倍数
 * @param {number} [options.maxLines=null] - 最大行数，null=不限制
 * @param {string} [options.overflow='hidden'] - 溢出处理：'hidden'=截断，'ellipsis'=省略号
 * @returns {Object} { lines, fontSize, isOverflow, totalHeight }
 */
export function smartTextWrap(text, options) {
  const {
    containerWidth,
    containerHeight,
    fontSize = 14,
    minFontSize = 10,
    lineHeight = 1.5,
    maxLines = null,
    overflow = 'hidden'
  } = options

  const defaultResult = {
    lines: [''],
    fontSize,
    isOverflow: false,
    totalHeight: 0
  }

  if (text == null || text === '') {
    return defaultResult
  }
  // 确保是字符串
  text = String(text)

  // 单行文本处理（不需要换行）
  const singleLineHeight = fontSize * lineHeight

  // 尝试初始字号，逐级缩小直到能放下
  let currentFontSize = fontSize
  let lines = []
  let isOverflow = false

  while (currentFontSize >= minFontSize) {
    lines = splitTextToLines(text, containerWidth, currentFontSize)

    // 计算总高度
    const totalHeight = lines.length * currentFontSize * lineHeight

    // 检测是否超出容器
    if (totalHeight <= containerHeight) {
      // 检测是否超出最大行数
      if (maxLines !== null && lines.length > maxLines) {
        currentFontSize--
        continue
      }
      return {
        lines,
        fontSize: currentFontSize,
        isOverflow: false,
        totalHeight
      }
    }

    currentFontSize--
  }

  // 最小字号仍超出，按最大行数截断
  if (maxLines !== null) {
    lines = splitTextToLines(text, containerWidth, minFontSize)
    if (lines.length > maxLines) {
      const truncatedLines = lines.slice(0, maxLines - 1)
      const lastLine = lines[maxLines - 1]

      // 尝试在最后一行加省略号
      if (overflow === 'ellipsis' && truncatedLines.length < lines.length) {
        // 找到最后一行能容纳的最大字符数
        const ellipsisWidth = estimateTextWidth('...', minFontSize)
        const availableWidth = containerWidth - ellipsisWidth

        let truncatedLastLine = ''
        let width = 0
        for (const char of lastLine) {
          const charWidth = getCharWidth(char) * minFontSize
          if (width + charWidth > availableWidth) break
          truncatedLastLine += char
          width += charWidth
        }

        truncatedLines.push(truncatedLastLine + '...')
      }

      lines = truncatedLines
      isOverflow = true
    }
  } else {
    // 无最大行数限制，超出容器高度就截断
    const maxAllowedLines = Math.floor(containerHeight / (minFontSize * lineHeight))
    if (lines.length > maxAllowedLines) {
      lines = lines.slice(0, maxAllowedLines)
      isOverflow = true
    }
  }

  const totalHeight = lines.length * minFontSize * lineHeight

  return {
    lines,
    fontSize: minFontSize,
    isOverflow,
    totalHeight
  }
}

/**
 * 单行文本处理：截断 + 省略号
 * @param {string} text - 原始文本
 * @param {number} maxWidth - 最大宽度(px)
 * @param {number} fontSize - 字号
 * @param {string} [ellipsis='...'] - 省略号
 * @returns {string}
 */
export function truncateSingleLine(text, maxWidth, fontSize, ellipsis = '...') {
  if (text == null || text === '') return ''
  // 确保是字符串
  text = String(text)

  const ellipsisWidth = estimateTextWidth(ellipsis, fontSize)
  const availableWidth = maxWidth - ellipsisWidth

  if (availableWidth <= 0) return ellipsis

  let result = ''
  let width = 0

  for (const char of text) {
    const charWidth = getCharWidth(char) * fontSize
    if (width + charWidth > availableWidth) {
      break
    }
    result += char
    width += charWidth
  }

  if (result.length < text.length) {
    return result + ellipsis
  }

  return result
}

/**
 * 生成 SVG tspan 格式的文本
 * @param {number} x - x坐标
 * @param {number} y - 起始y坐标
 * @param {string[]} lines - 行数组
 * @param {number} fontSize - 字号
 * @param {number} lineHeight - 行高
 * @returns {string} SVG text 元素字符串
 */
export function generateTspanSvg(x, y, lines, fontSize, lineHeight) {
  if (!lines || lines.length === 0) {
    return `<text x="${x}" y="${y}" font-family="Microsoft YaHei, sans-serif" font-size="${fontSize}"></text>`
  }

  const tspans = lines.map((line, index) => {
    const dy = index === 0 ? 0 : lineHeight
    const escapedLine = escapeXml(line)
    return `<tspan x="${x}" dy="${dy}">${escapedLine}</tspan>`
  }).join('')

  return `<text x="${x}" y="${y}" font-family="Microsoft YaHei, sans-serif" font-size="${fontSize}">${tspans}</text>`
}

/**
 * 转义 XML 特殊字符
 * @param {string} text
 * @returns {string}
 */
function escapeXml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export { escapeXml }
