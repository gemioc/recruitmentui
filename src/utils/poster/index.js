/**
 * 海报模板引擎 - 统一导出
 * 包含白底蓝字和深蓝底白字两套模板
 */

// 白底蓝字模板
export { multi01HtmlTemplate } from './multi01Template.js'
export { single01HtmlTemplate } from './single01Template.js'
export { multi02HtmlTemplate } from './multi02Template.js'

// 深蓝底白字模板
export { multi01BlueHtmlTemplate } from './multi01BlueTemplate.js'
export { single01BlueHtmlTemplate } from './single01BlueTemplate.js'
export { multi02BlueHtmlTemplate } from './multi02BlueTemplate.js'

// 渲染工具
export { htmlToCanvas, renderHtmlToPng, uploadPngToBackend, renderTemplate } from './posterUtils.js'
