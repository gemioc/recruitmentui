<template>
  <div class="poster-generate-container">
    <el-row :gutter="20">
      <!-- 左侧：模板选择和预览 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>选择模板</span>
            </div>
          </template>

          <div class="template-list">
            <div
              v-for="template in templateList"
              :key="template.id"
              class="template-item"
              :class="{ active: selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <img :src="getTemplatePreviewUrl(template)" :alt="template.templateName" />
              <div class="template-name">{{ template.templateName }}</div>
            </div>
          </div>
        </el-card>

        <!-- 预览区域 -->
        <el-card shadow="never" class="preview-card" v-if="selectedTemplate">
          <template #header>
            <span>海报预览</span>
          </template>
          <div class="preview-area">
            <div class="preview-wrapper">
              <object
                :data="previewSvgUrl"
                type="image/svg+xml"
                class="preview-svg"
              >
                <img :src="previewSvgUrl" alt="预览" class="preview-img" />
              </object>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：表单配置 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-text">海报配置</div>
          </template>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="80px"
            label-position="left"
            class="config-form"
          >
            <el-form-item label="选择职位" prop="jobId">
              <el-select
                v-model="formData.jobId"
                placeholder="请选择职位"
                style="width: 100%"
                @change="handleJobChange"
              >
                <el-option
                  v-for="job in jobList"
                  :key="job.id"
                  :label="job.jobName"
                  :value="job.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="海报标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入海报标题" />
            </el-form-item>

            <el-divider content-position="left">
              <span class="divider-title">显示内容</span>
            </el-divider>

            <el-form-item label="职位名称">
              <el-input v-model="formData.jobTitle" placeholder="职位名称" />
            </el-form-item>

            <el-form-item label="公司名称">
              <el-input v-model="formData.company" placeholder="公司名称" />
            </el-form-item>

            <el-form-item label="薪资范围">
              <el-input v-model="formData.salary" placeholder="如: 8000-12000" />
            </el-form-item>

            <el-form-item label="工作地点">
              <el-input v-model="formData.location" placeholder="工作地点" />
            </el-form-item>

            <el-form-item label="学历要求">
              <el-select v-model="formData.education" placeholder="请选择" style="width: 100%">
                <el-option label="不限" value="不限" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
              </el-select>
            </el-form-item>

            <el-form-item label="经验要求">
              <el-select v-model="formData.experience" placeholder="请选择" style="width: 100%">
                <el-option label="不限" value="不限" />
                <el-option label="1-3年" value="1-3年" />
                <el-option label="3-5年" value="3-5年" />
                <el-option label="5-10年" value="5-10年" />
              </el-select>
            </el-form-item>

            <el-form-item label="招聘人数">
              <el-input v-model="formData.recruitCount" placeholder="招聘人数" />
            </el-form-item>

            <el-form-item label="岗位职责">
              <el-input
                v-model="formData.responsibilities"
                type="textarea"
                :rows="3"
                placeholder="请输入岗位职责"
              />
            </el-form-item>

            <el-form-item label="任职要求">
              <el-input
                v-model="formData.requirements"
                type="textarea"
                :rows="3"
                placeholder="请输入任职要求"
              />
            </el-form-item>

            <el-form-item label="福利待遇">
              <el-input
                v-model="formData.welfare"
                type="textarea"
                :rows="3"
                placeholder="请输入福利待遇，如: 五险一金，双休、年终奖等"
              />
            </el-form-item>

            <el-divider content-position="left">
              <span class="divider-title">联系方式</span>
            </el-divider>

            <el-form-item label="联系人">
              <el-input v-model="formData.contactName" placeholder="联系人" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="formData.contactPhone" placeholder="联系电话" />
            </el-form-item>

            <el-divider />

            <el-form-item>
              <el-button type="primary" @click="handleGenerate" :loading="generating">
                生成海报
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 生成结果弹窗 -->
    <el-dialog v-model="resultVisible" title="海报生成成功" width="700px">
      <div class="result-container">
        <img :src="resultImage" alt="生成的海报" class="result-image" />
      </div>
      <template #footer>
        <el-button @click="handleDownload">下载海报</el-button>
        <el-button type="primary" @click="handlePush">推送海报</el-button>
        <el-button @click="resultVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getJobList, getJobDetail } from '@/api/job'
import { getPosterTemplates, generatePoster } from '@/api/poster'
import { renderTemplate, tech01Template } from '@/utils/posterTemplateEngine'
import '@/utils/posterTemplateEngine' // 确保注册

const router = useRouter()

// 模板列表
const templateList = ref([])
const selectedTemplate = ref(null)

// 职位列表
const jobList = ref([])

// 表单数据
const formData = reactive({
  jobId: null,
  title: '',
  jobTitle: '',
  company: '',
  salary: '',
  location: '',
  education: '',
  experience: '',
  recruitCount: '',
  responsibilities: '',
  requirements: '',
  welfare: '',
  contactName: '',
  contactPhone: ''
})

const formRef = ref(null)
const formRules = {
  jobId: [{ required: true, message: '请选择职位', trigger: 'change' }],
  title: [{ required: true, message: '请输入海报标题', trigger: 'blur' }]
}

// 生成状态
const generating = ref(false)
const resultVisible = ref(false)
const resultImage = ref('')

// 预览SVG URL（带数据）
const previewSvgUrl = computed(() => {
  if (!selectedTemplate.value) return ''
  return buildPreviewSvgUrl()
})

// 文本换行处理函数
const formatTextForSvg = (text, charsPerLine) => {
  if (!text) return ''
  const lines = []
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (!para) { lines.push(''); continue }
    let currentLine = ''
    let charCount = 0
    for (const char of para) {
      const width = /[\u4e00-\u9fa5]/.test(char) ? 1 : 0.5
      charCount += width
      if (charCount > charsPerLine && currentLine) {
        lines.push(currentLine)
        currentLine = char
        charCount = width
      } else {
        currentLine += char
      }
    }
    if (currentLine) lines.push(currentLine)
  }
  return lines
}

// 生成tspan格式的文本
const generateTspanText = (text, x, lineHeight, charsPerLine) => {
  const lines = formatTextForSvg(text, charsPerLine)
  if (lines.length === 0) return ''
  return lines.map((line, index) => {
    if (index === 0) return line
    return `<tspan x="${x}" dy="${lineHeight}">${line}</tspan>`
  }).join('')
}

// 根据模板类型获取SVG内容
const getSvgTemplateByColorScheme = (colorScheme) => {
  const c = colorScheme || 'BLUE'
  if (c === 'ORANGE') {
    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="energyBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFF4E6"/><stop offset="100%" style="stop-color:#FFE4CC"/></linearGradient><linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#FF6B35"/><stop offset="100%" style="stop-color:#FFB347"/></linearGradient><linearGradient id="warmCard" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFFFFF"/><stop offset="100%" style="stop-color:#FFFAF5"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#energyBg)"/><circle cx="1600" cy="150" r="250" fill="#FF6B35" opacity="0.08"/><circle cx="1750" cy="300" r="180" fill="#FFB347" opacity="0.1"/><circle cx="100" cy="900" r="200" fill="#FF6B35" opacity="0.08"/><rect x="0" y="0" width="1920" height="16" fill="url(#orangeGrad)"/><rect x="60" y="80" width="600" height="920" rx="20" fill="url(#warmCard)"/><rect x="60" y="80" width="600" height="140" rx="20" fill="#FF6B35"/><rect x="60" y="180" width="600" height="40" fill="#FF6B35"/><text x="360" y="150" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" text-anchor="middle" opacity="0.9">${formData.company || '公司名称'}</text><text x="360" y="200" font-family="Microsoft YaHei, sans-serif" font-size="60" fill="#FFFFFF" text-anchor="middle" font-weight="bold">招 贤 纳 士</text><rect x="100" y="260" width="520" height="110" rx="16" fill="#FFFFFF" stroke="#FF6B35" stroke-width="3"/><text x="360" y="330" font-family="Microsoft YaHei, sans-serif" font-size="38" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><rect x="100" y="400" width="520" height="80" rx="12" fill="#FF6B35"/><text x="360" y="455" font-family="Microsoft YaHei, sans-serif" font-size="40" fill="#FFFFFF" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(100, 520)"><rect x="0" y="0" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="122" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">工作地点</text><text x="122" y="58" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="265" y="0" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="387" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">学历要求</text><text x="387" y="58" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="0" y="90" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="122" y="120" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">经验要求</text><text x="122" y="148" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text><rect x="265" y="90" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="387" y="120" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">招聘人数</text><text x="387" y="148" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.recruitCount || '若干'}</text></g><text x="100" y="740" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#FF6B35" font-weight="bold">★ 福利待遇 ★</text><rect x="100" y="760" width="520" height="70" rx="10" fill="#FFF0E6"/><text x="120" y="802" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#666666">${formData.welfare || '福利待遇'}</text><rect x="700" y="80" width="1160" height="920" rx="20" fill="url(#warmCard)"/><rect x="700" y="80" width="1160" height="12" fill="url(#orangeGrad)"/><text x="760" y="150" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#FF6B35" font-weight="bold">职位详情</text><text x="760" y="185" font-family="Arial, sans-serif" font-size="16" fill="#999999">JOB DETAILS</text><line x1="760" y1="210" x2="1780" y2="210" stroke="#FFD4B8" stroke-width="2"/><rect x="700" y="240" width="8" height="200" rx="4" fill="#FF6B35"/><rect x="708" y="240" width="1132" height="200" rx="0" fill="#FFFAF5"/><text x="760" y="280" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FF6B35" font-weight="bold">岗位职责</text><text x="760" y="320" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#555555">${generateTspanText(formData.responsibilities || '岗位职责内容', 70, 22, 60)}</text><rect x="700" y="460" width="8" height="200" rx="4" fill="#FFB347"/><rect x="708" y="460" width="1132" height="200" rx="0" fill="#FFFAF5"/><text x="760" y="500" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FF8C00" font-weight="bold">任职要求</text><text x="760" y="540" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#555555">${generateTspanText(formData.requirements || '任职要求内容', 70, 22, 60)}</text><rect x="760" y="720" width="1040" height="100" rx="16" fill="#FF6B35"/><text x="900" y="770" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" font-weight="bold">联系人：${formData.contactName || '---'}</text><text x="1300" y="770" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" font-weight="bold">电话：${formData.contactPhone || '---'}</text><rect x="0" y="1064" width="1920" height="16" fill="url(#orangeGrad)"/></svg>`
  }
  if (c === 'GREEN') {
    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="natureBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F0FDF4"/><stop offset="100%" style="stop-color:#DCFCE7"/></linearGradient><linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#22C55E"/><stop offset="100%" style="stop-color:#4ADE80"/></linearGradient><linearGradient id="leafPattern" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#86EFAC;stop-opacity:0.3"/><stop offset="100%" style="stop-color:#22C55E;stop-opacity:0.1"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#natureBg)"/><rect x="0" y="0" width="1920" height="160" fill="url(#greenGrad)"/><circle cx="1650" cy="60" r="180" fill="#ffffff" opacity="0.15"/><circle cx="1800" cy="120" r="120" fill="#ffffff" opacity="0.1"/><circle cx="120" cy="80" r="100" fill="#ffffff" opacity="0.15"/><text x="960" y="100" font-family="Microsoft YaHei, sans-serif" font-size="72" fill="#FFFFFF" text-anchor="middle" font-weight="bold">JOIN US</text><rect x="140" y="200" width="1640" height="720" rx="24" fill="#FFFFFF"/><rect x="140" y="200" width="640" height="720" rx="24" fill="#FFFFFF"/><rect x="140" y="200" width="640" height="720" rx="24" fill="url(#leafPattern)"/><text x="460" y="280" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#166534" text-anchor="middle">${formData.company || '公司名称'}</text><rect x="260" y="310" width="400" height="4" rx="2" fill="url(#greenGrad)"/><text x="460" y="400" font-family="Microsoft YaHei, sans-serif" font-size="44" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><rect x="200" y="440" width="520" height="70" rx="12" fill="#DCFCE7"/><text x="460" y="492" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#16A34A" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(200, 550)"><rect x="0" y="0" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="115" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">工作地点</text><text x="115" y="60" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="250" y="0" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="365" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">学历要求</text><text x="365" y="60" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="0" y="100" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="115" y="130" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">经验要求</text><text x="115" y="160" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text><rect x="250" y="100" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="365" y="130" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">招聘人数</text><text x="365" y="160" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.recruitCount || '若干'}</text></g><rect x="820" y="200" width="960" height="720" rx="0" fill="#FFFFFF"/><rect x="820" y="200" width="960" height="10" fill="url(#greenGrad)"/><text x="860" y="270" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#14532D" font-weight="bold">福利待遇</text><rect x="860" y="295" width="880" height="70" rx="12" fill="#F0FDF4" stroke="#22C55E" stroke-width="1"/><text x="885" y="340" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#166534">${formData.welfare || '福利待遇'}</text><text x="860" y="410" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#14532D" font-weight="bold">岗位职责</text><rect x="820" y="420" width="8" height="150" rx="4" fill="#22C55E"/><rect x="828" y="420" width="932" height="150" rx="0" fill="#F0FDF4"/><text x="860" y="455" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#374151">${generateTspanText(formData.responsibilities || '岗位职责内容', 70, 22, 60)}</text><text x="860" y="610" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#14532D" font-weight="bold">任职要求</text><rect x="820" y="620" width="8" height="150" rx="4" fill="#4ADE80"/><rect x="828" y="620" width="932" height="150" rx="0" fill="#F0FDF4"/><text x="860" y="655" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#374151">${generateTspanText(formData.requirements || '任职要求内容', 70, 22, 60)}</text><rect x="820" y="800" width="920" height="80" rx="12" fill="#14532D"/><text x="900" y="845" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#FFFFFF">联系人：${formData.contactName || '---'}</text><text x="1200" y="845" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#86EFAC">电话：${formData.contactPhone || '---'}</text><rect x="140" y="920" width="1640" height="10" rx="5" fill="url(#greenGrad)"/></svg>`
  }
  return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="techBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0a1628"/><stop offset="50%" style="stop-color:#1a3a5c"/><stop offset="100%" style="stop-color:#0d2137"/></linearGradient><linearGradient id="techLine" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#00D4FF;stop-opacity:0"/><stop offset="50%" style="stop-color:#00D4FF;stop-opacity:1"/><stop offset="100%" style="stop-color:#00D4FF;stop-opacity:0"/></linearGradient><linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95"/><stop offset="100%" style="stop-color:#f0f8ff;stop-opacity:0.95"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#techBg)"/><line x1="0" y1="200" x2="600" y2="200" stroke="url(#techLine)" stroke-width="1"/><line x1="1320" y1="200" x2="1920" y2="200" stroke="url(#techLine)" stroke-width="1"/><line x1="0" y1="880" x2="500" y2="880" stroke="url(#techLine)" stroke-width="1"/><line x1="1420" y1="880" x2="1920" y2="880" stroke="url(#techLine)" stroke-width="1"/><polygon points="1700,100 1750,180 1650,180" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.5"/><polygon points="200,900 250,980 150,980" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.5"/><circle cx="1750" cy="800" r="80" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.3"/><circle cx="170" cy="180" r="60" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.3"/><rect x="60" y="120" width="580" height="840" rx="16" fill="url(#cardGrad)"/><rect x="60" y="120" width="580" height="8" rx="4" fill="#00D4FF"/><text x="350" y="180" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#5a7a9a" text-anchor="middle">${formData.company || '公司名称'}</text><text x="350" y="260" font-family="Microsoft YaHei, sans-serif" font-size="56" fill="#0a1628" text-anchor="middle" font-weight="bold">职等你来</text><text x="350" y="310" font-family="Arial, sans-serif" font-size="28" fill="#00D4FF" text-anchor="middle" letter-spacing="8">WE WANT YOU</text><line x1="150" y1="350" x2="550" y2="350" stroke="#e0e8f0" stroke-width="2"/><rect x="100" y="380" width="500" height="100" rx="12" fill="#f8fafc" stroke="#00D4FF" stroke-width="2"/><text x="350" y="445" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><text x="350" y="540" font-family="Microsoft YaHei, sans-serif" font-size="44" fill="#00D4FF" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(0, 580)"><rect x="80" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="145" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">工作地点</text><text x="145" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="225" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="290" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">学历要求</text><text x="290" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="370" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="435" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">经验要求</text><text x="435" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text></g><rect x="80" y="680" width="500" height="60" rx="8" fill="#0a1628"/><text x="100" y="720" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#00D4FF">福  利</text><text x="180" y="720" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#ffffff">${formData.welfare || '福利待遇'}</text><rect x="680" y="120" width="1180" height="840" rx="16" fill="url(#cardGrad)"/><rect x="680" y="120" width="1180" height="8" rx="4" fill="#00D4FF"/><text x="720" y="180" font-family="Microsoft YaHei, sans-serif" font-size="32" fill="#0a1628" font-weight="bold">职位详情</text><text x="720" y="215" font-family="Arial, sans-serif" font-size="16" fill="#5a7a9a">POSITION DETAILS</text><line x1="720" y1="240" x2="1800" y2="240" stroke="#e0e8f0" stroke-width="1"/><g transform="translate(720, 270)"><rect x="0" y="0" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="20" y="25" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">工作地点</text><text x="20" y="52" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.location || '不限'}</text><rect x="560" y="0" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="580" y="25" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">学历要求</text><text x="580" y="52" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.education || '不限'}</text><rect x="0" y="85" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="20" y="110" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">经验要求</text><text x="20" y="137" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.experience || '不限'}</text><rect x="560" y="85" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="580" y="110" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">招聘人数</text><text x="580" y="137" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.recruitCount || '若干'} 人</text></g><text x="720" y="470" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#0a1628" font-weight="bold">岗位职责</text><rect x="720" y="490" width="1080" height="120" rx="8" fill="#f8fafc" stroke="#e0e8f0" stroke-width="1"/><text x="740" y="520" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#37474f">${generateTspanText(formData.responsibilities || '岗位职责内容', 70, 22, 60)}</text><text x="720" y="640" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#0a1628" font-weight="bold">任职要求</text><rect x="720" y="660" width="1080" height="120" rx="8" fill="#f8fafc" stroke="#e0e8f0" stroke-width="1"/><text x="740" y="690" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#37474f">${generateTspanText(formData.requirements || '任职要求内容', 70, 22, 60)}</text><rect x="720" y="820" width="1080" height="80" rx="8" fill="#0a1628"/><text x="770" y="865" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#00D4FF">联 系 人：${formData.contactName || '---'}</text><text x="1100" y="865" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#ffffff">电    话：${formData.contactPhone || '---'}</text></svg>`
}

// 构建预览SVG URL
const buildPreviewSvgUrl = () => {
  if (!selectedTemplate.value) return ''
  const colorScheme = selectedTemplate.value.colorScheme || 'BLUE'

  // BLUE 类型使用 JSON 模板引擎渲染
  // BLUE 和 GREEN 使用 JSON 模板引擎
  if (colorScheme === 'BLUE' || colorScheme === 'GREEN') {
    try {
      // 根据 templatePath 判断使用哪个模板
      const templatePath = selectedTemplate.value.templatePath || ''
      let templateId = 'tech_01'
      if (templatePath.includes('admin')) {
        templateId = 'admin_01'
      } else if (templatePath.includes('tech_02') || colorScheme === 'GREEN') {
        templateId = 'tech_02'
      }
      const svgContent = renderTemplate(templateId, formData)
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
    } catch (e) {
      console.error('模板渲染失败:', e)
      return ''
    }
  }

  // ORANGE 使用内联 SVG
  const svgContent = getSvgTemplateByColorScheme(colorScheme)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
}

// 获取模板列表
const fetchTemplateList = async () => {
  try {
    const res = await getPosterTemplates()
    templateList.value = res.data || []
    if (templateList.value.length > 0) {
      selectTemplate(templateList.value[0])
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

// 获取职位列表
const fetchJobList = async () => {
  try {
    const res = await getJobList({ page: 1, size: 100, status: 1 })
    jobList.value = res.data.records || []
  } catch (error) {
    console.error('获取职位列表失败:', error)
  }
}

// 选择模板
const selectTemplate = (template) => {
  selectedTemplate.value = template
}

// 获取模板预览URL
const getTemplatePreviewUrl = (template) => {
  if (!template) return ''
  // 优先使用 previewPath (PNG预览图)，其次用 templatePath
  const path = template.previewPath || template.templatePath
  if (!path) return ''
  const fullPath = path.startsWith('/') ? path : '/' + path
  return '/files' + fullPath
}

// 职位选择变化
const handleJobChange = async (jobId) => {
  if (!jobId) return
  try {
    const res = await getJobDetail(jobId)
    const job = res.data
    formData.title = `${job.jobName || ''} - ${job.company || ''}`
    formData.jobTitle = job.jobName || ''
    formData.company = job.company || ''
    formData.salary = job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : ''
    formData.location = job.workAddress || ''
    formData.education = job.education || ''
    formData.experience = job.experience || ''
    formData.recruitCount = job.recruitCount || ''
    formData.responsibilities = job.responsibilities || ''
    formData.requirements = job.requirements || ''
    formData.welfare = job.welfare || ''
    formData.contactName = job.contactName || ''
    formData.contactPhone = job.contactPhone || ''
  } catch (error) {
    console.error('获取职位详情失败:', error)
  }
}

// 生成海报
const handleGenerate = async () => {
  await formRef.value.validate()
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择海报模板')
    return
  }
  generating.value = true
  try {
    // 获取渲染好的SVG内容
    let svgContent = ''
    const colorScheme = selectedTemplate.value.colorScheme
    if (colorScheme === 'BLUE' || colorScheme === 'GREEN') {
      const templatePath = selectedTemplate.value.templatePath || ''
      let templateId = 'tech_01'
      if (templatePath.includes('admin')) {
        templateId = 'admin_01'
      } else if (templatePath.includes('tech_02') || colorScheme === 'GREEN') {
        templateId = 'tech_02'
      }
      svgContent = renderTemplate(templateId, formData)
    }

    const res = await generatePoster({
      templateId: selectedTemplate.value.id,
      jobId: formData.jobId,
      posterName: formData.title || '海报_' + formData.jobTitle,
      svgContent: svgContent
    })
    const filePath = res.data.filePath || res.data
    resultImage.value = filePath.startsWith('/')
      ? '/files' + filePath
      : '/files/' + filePath
    resultVisible.value = true
    ElMessage.success('海报生成成功')
  } catch (error) {
    console.error('生成海报失败:', error)
  } finally {
    generating.value = false
  }
}

// 重置
const handleReset = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    jobId: null, title: '', jobTitle: '', company: '', salary: '',
    location: '', education: '', experience: '', recruitCount: '',
    responsibilities: '', requirements: '', welfare: '',
    contactName: '', contactPhone: ''
  })
}

// 下载
const handleDownload = () => {
  const link = document.createElement('a')
  link.href = resultImage.value
  link.download = `${formData.title || '海报'}.png`
  link.click()
  ElMessage.success('开始下载')
}

// 推送
const handlePush = () => {
  resultVisible.value = false
  router.push('/poster/list')
}

// 初始化
onMounted(() => {
  fetchTemplateList()
  fetchJobList()
})

// 页面激活时刷新数据
onActivated(() => {
  fetchTemplateList()
  fetchJobList()
})
</script>

<style lang="scss" scoped>
.poster-generate-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-header-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .template-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    .template-item {
      border: 2px solid #dcdfe6;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.3s;
      &:hover { border-color: #409eff; }
      &.active {
        border-color: #409eff;
        box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
      }
      img {
        width: 100%;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
      }
      .template-name {
        text-align: center;
        margin-top: 8px;
        font-size: 13px;
        color: #606266;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  .preview-card {
    margin-top: 20px;
    .preview-area {
      display: flex;
      justify-content: center;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;
      overflow: auto;
      .preview-wrapper {
        width: 100%;
        max-width: 640px;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        .preview-svg, .preview-img { width: 100%; display: block; }
      }
    }
  }
  .config-form {
    .divider-title { font-weight: bold; white-space: nowrap; }
    :deep(.el-form-item__label) { white-space: nowrap; }
  }
}
.result-container {
  text-align: center;
  .result-image { max-width: 100%; border-radius: 8px; }
}
</style>
