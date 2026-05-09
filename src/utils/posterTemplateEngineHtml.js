/**
 * 海报模板引擎 - 统一导出（兼容旧导入方式）
 * 请使用 @/utils/poster/index.js 导入新模板
 */

// 白底蓝字模板
export { multi01HtmlTemplate } from './poster/multi01Template.js'
export { single01HtmlTemplate } from './poster/single01Template.js'
export { multi02HtmlTemplate } from './poster/multi02Template.js'

// 深蓝底白字模板
export { multi01BlueHtmlTemplate } from './poster/multi01BlueTemplate.js'
export { single01BlueHtmlTemplate } from './poster/single01BlueTemplate.js'
export { multi02BlueHtmlTemplate } from './poster/multi02BlueTemplate.js'

// 渲染工具
export { htmlToCanvas, renderHtmlToPng, uploadPngToBackend, renderTemplate } from './poster/posterUtils.js'
