/**
 * 多岗位招聘 HTML 模板（模板2）
 * 左右分栏风格：左侧表格7行，右侧详情区
 * 深蓝底白字风格（商务风）
 * @param {Object} data - 模板数据
 */
export function multi02BlueHtmlTemplate(data) {
  const {
    company = '',
    jobs = [],
    location = '',
    contactName = '',
    contactPhone = '',
    logoBase64 = '',
    selectedIndex = 0
  } = data

  const rowCount = 7
  const filledJobs = [...jobs]
  while (filledJobs.length < rowCount) {
    filledJobs.push({})
  }

  const logoHtml = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="logo" />`
    : `<div class="logo-placeholder"></div>`

  const selectedJob = jobs[selectedIndex] || jobs[0] || {}

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
    body { width: 1920px; height: 1080px; font-family: '宋体', 'SimSun', serif; background: #1a3a5c; overflow: hidden; margin: 0; padding: 0; }
    .poster { width: 1920px; height: 1080px; background: #1a3a5c; position: relative; border: 8px solid #ffffff; overflow: hidden; box-sizing: border-box; }
    .content { position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; display: flex; flex-direction: column; }
    .header { display: flex; align-items: center; height: 160px; flex-shrink: 0; padding: 0 30px; }
    .logo { width: 140px; height: 140px; object-fit: contain; border-radius: 8px; flex-shrink: 0; }
    .logo-placeholder { width: 140px; height: 140px; background: rgba(255,255,255,0.1); border: 2px dashed rgba(255,255,255,0.5); border-radius: 8px; flex-shrink: 0; }
    .company-name { flex: 1; font-size: 72px; font-weight: bold; color: #ffffff; letter-spacing: 4px; text-align: center; }
    .main-area { flex: 1; display: flex; overflow: hidden; }
    .left-table-area { flex: 1.8; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #ffffff; }
    .right-detail-area { flex: 1; display: flex; flex-direction: column; padding: 20px 30px; gap: 16px; overflow: hidden; border: 1px solid #ffffff; }
    .job-table { width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; }
    .job-table thead { background: rgba(255,255,255,0.15); }
    .job-table thead th { height: 55px; font-size: 32px; color: #ffffff; font-weight: bold; border: 1px solid #ffffff; padding: 0; text-align: center; vertical-align: middle; font-family: '宋体', 'SimSun', serif; }
    .job-table tbody tr { height: 109px; }
    .job-table tbody td { font-size: 28px; color: #ffffff; border: 1px solid #ffffff; padding: 0; text-align: center; vertical-align: middle; font-weight: normal; line-height: 1.5; font-family: '宋体', 'SimSun', serif; }
    .job-table td.cell-post { font-size: 28px; font-weight: normal; line-height: 1.5; }
    .cell-post { width: 30%; }
    .cell-count { width: 18%; }
    .cell-salary { width: 26%; }
    .cell-education { width: 26%; }
    .detail-pair { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .detail-label { font-size: 32px; color: #ffffff; font-weight: bold; text-align: left; flex-shrink: 0; font-family: '宋体', 'SimSun', serif; }
    .detail-section { flex: 1; display: flex; flex-direction: column; border: 1px solid #ffffff; padding: 10px 14px; }
    .detail-content { flex: 1; font-size: 28px; color: #ffffff; line-height: 1.5; word-break: break-word; text-align: left; overflow: hidden; font-weight: normal; font-family: '宋体', 'SimSun', serif; }
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
      <div class="main-area">
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
