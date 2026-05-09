/**
 * 多岗位招聘 HTML 模板
 * 深蓝底白字风格（商务风）
 * @param {Object} data - 模板数据
 */
export function multi01BlueHtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = ''
  } = data

  const jobRows = jobs.length > 0 ? jobs : [{}, {}, {}, {}]

  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder"></div>`

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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1920px; height: 1080px; font-family: '宋体', 'SimSun', serif; background: #1a3a5c; overflow: hidden; margin: 0; padding: 0; }
    .poster { width: 1920px; height: 1080px; max-height: 1080px; background: #1a3a5c; position: relative; border: 8px solid #ffffff; overflow: hidden; box-sizing: border-box; }
    .content { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; }
    .header { display: flex; align-items: center; padding: 0 30px; height: 160px; flex-shrink: 0; }
    .logo { width: 140px; height: 140px; object-fit: contain; border-radius: 8px; }
    .logo-placeholder { width: 140px; height: 140px; background: rgba(255,255,255,0.1); border: 2px dashed rgba(255,255,255,0.5); border-radius: 8px; }
    .company-name { flex: 1; text-align: center; font-size: 72px; font-weight: bold; color: #ffffff; letter-spacing: 4px; padding-right: 160px; }
    .table-container { padding: 0; flex: 1; overflow: hidden; box-sizing: border-box; }
    .job-table { width: 100%; height: 100%; border-collapse: collapse; font-size: 30px; table-layout: fixed; }
    .job-table th, .job-table td { border: 1px solid #ffffff; padding: 0; text-align: center; vertical-align: middle; color: #ffffff; }
    .job-table thead { background: rgba(255,255,255,0.15); }
    .job-table th { height: 65px; font-weight: bold; font-size: 32px; font-family: '宋体', 'SimSun', serif; }
    .job-table td { height: 130px; color: #ffffff; text-align: center; font-weight: normal; font-size: 28px; line-height: 1.5; font-family: '宋体', 'SimSun', serif; }
    .job-table td.cell-welfare { text-align: left; padding: 10px 20px; line-height: 1.5; word-break: break-word; font-size: 32px; font-family: '宋体', 'SimSun', serif; }
    .cell-post { width: 230px; }
    .cell-count { width: 190px; }
    .cell-salary { width: 200px; }
    .cell-education { width: 200px; }
    .job-table td.cell-post { vertical-align: middle; padding: 10px 15px; }
    .footer { height: 80px !important; display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 0 30px !important; margin: 0 !important; border-top: 1px solid #ffffff !important; font-size: 32px !important; font-weight: normal !important; color: #ffffff !important; background: transparent !important; box-sizing: border-box !important; flex-wrap: nowrap !important; overflow: visible !important; flex-shrink: 0 !important; font-family: '宋体', 'SimSun', serif !important; }
    .footer-left { display: flex !important; align-items: center !important; flex-shrink: 0 !important; }
    .footer-right { display: flex !important; align-items: center !important; flex-shrink: 0 !important; gap: 24px !important; }
    .footer-label { color: #ffffff !important; font-size: 32px !important; font-weight: bold !important; font-family: '宋体', 'SimSun', serif !important; }
    .footer-value { color: #ffffff !important; font-size: 32px !important; font-weight: normal !important; margin-right: 8px !important; font-family: '宋体', 'SimSun', serif !important; }
    .footer-right .footer-value { margin-right: 0 !important; }
  </style>
</head>
<body>
  <div class="poster">
    <div class="content">
      <div class="header">
        ${logoHtml}
        <div class="company-name">${escapeHtml(company)}</div>
      </div>
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

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
