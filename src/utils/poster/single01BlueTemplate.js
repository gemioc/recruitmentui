/**
 * 单岗位招聘 HTML 模板
 * 深蓝底白字风格（商务风）
 * @param {Object} data - 模板数据
 */
export function single01BlueHtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = ''
  } = data

  const job = jobs[0] || {}

  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder">
         <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
           <path d="M60 20 L100 55 L100 100 L20 100 L20 55 Z" fill="#ffffff" stroke="#ffffff" stroke-width="2"/>
           <rect x="45" y="65" width="30" height="35" fill="#1a3a5c"/>
           <rect x="52" y="72" width="16" height="28" fill="#ffffff"/>
           <circle cx="85" cy="40" r="8" fill="#ffffff"/>
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
    body { width: 1920px; height: 1080px; font-family: '宋体', 'SimSun', serif; background: #1a3a5c; overflow: hidden; }
    .poster { width: 1920px; height: 1080px; background: #1a3a5c; position: relative; border: 3px solid #ffffff; overflow: hidden; }
    .content { position: absolute; top: 3px; left: 3px; right: 3px; bottom: 3px; display: flex; flex-direction: column; padding: 30px 50px; border: 2px solid #ffffff; }
    .header { display: flex; align-items: center; height: 120px; flex-shrink: 0; padding-bottom: 15px; }
    .logo { width: 140px; height: 140px; object-fit: contain; flex-shrink: 0; }
    .logo-placeholder { width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-placeholder svg { width: 90px; height: 90px; }
    .company-title { flex: 1; text-align: center; font-size: 72px; font-weight: bold; color: #ffffff; letter-spacing: 8px; padding-right: 160px; }
    .info-table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 32px; border: none; }
    .info-table td { border: 1px solid #ffffff; padding: 18px 20px; color: #ffffff; vertical-align: middle; text-align: center; font-weight: normal; font-size: 32px; line-height: 1.5; font-family: '宋体', 'SimSun', serif; }
    .info-table tr:first-child td { font-weight: bold; background: rgba(255,255,255,0.15); }
    .info-table tr:last-child td { text-align: center; font-weight: normal; font-size: 32px; line-height: 1.5; font-family: '宋体', 'SimSun', serif; }
    .section { margin-top: 20px; flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .section-title { font-size: 32px; font-weight: bold; color: #ffffff; margin-bottom: 10px; padding-left: 5px; font-family: '宋体', 'SimSun', serif; flex-shrink: 0; }
    .section-box { border: 2px solid #ffffff; padding: 20px 24px; font-size: 32px; color: #ffffff; line-height: 2; flex: 1; min-height: 0; font-weight: normal; font-family: '宋体', 'SimSun', serif; }
    .footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding: 20px 30px 10px; border-top: 2px solid #ffffff; font-size: 32px; font-weight: normal; color: #ffffff; font-family: '宋体', 'SimSun', serif; }
    .footer-left { text-align: left; }
    .footer-center { text-align: center; }
    .footer-right { text-align: right; }
  </style>
</head>
<body>
  <div class="poster">
    <div class="content">
      <div class="header">
        ${logoHtml}
        <div class="company-title">${escapeHtml(company)}</div>
      </div>
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
      <div class="section">
        <div class="section-title">职位信息</div>
        <div class="section-box">${escapeHtml(job.jobInfo || '')}</div>
      </div>
      <div class="section">
        <div class="section-title">福利待遇</div>
        <div class="section-box">${escapeHtml(job.welfare || '')}</div>
      </div>
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

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
