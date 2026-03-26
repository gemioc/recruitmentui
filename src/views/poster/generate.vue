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
              <!-- 使用iframe或object显示SVG -->
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
              <el-input v-model="formData.welfare" placeholder="如: 五险一金、双休、年终奖" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getJobList, getJobDetail } from '@/api/job'
import { getPosterTemplates, generatePoster } from '@/api/poster'

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

// 预览样式
const previewStyle = computed(() => ({
  aspectRatio: selectedTemplate.value?.aspectRatio || '16/9'
}))

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
    if (!para) {
      lines.push('')
      continue
    }
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
    if (index === 0) {
      return line
    }
    return `<tspan x="${x}" dy="${lineHeight}">${line}</tspan>`
  }).join('')
}

// 构建预览SVG URL - 横版模板 1920x1080
const buildPreviewSvgUrl = () => {
  if (!selectedTemplate.value) return ''

  const svgContent = `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A5F"/>
      <stop offset="100%" style="stop-color:#2B5B8A"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <g transform="translate(80, 80)">
    <circle cx="300" cy="350" r="280" fill="#3B82F6" opacity="0.15"/>
    <circle cx="300" cy="350" r="180" fill="#3B82F6" opacity="0.2"/>
    <text x="300" y="180" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#FFFFFF" text-anchor="middle" opacity="0.9">${formData.company || '公司名称'}</text>
    <text x="300" y="280" font-family="Microsoft YaHei, sans-serif" font-size="72" fill="#FFFFFF" text-anchor="middle" font-weight="bold">诚聘英才</text>
    <text x="300" y="340" font-family="Arial, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle" opacity="0.8">JOIN US</text>
    <rect x="200" y="370" width="200" height="4" fill="#4A90C8" rx="2"/>
    <rect x="50" y="420" width="500" height="80" rx="10" fill="#FFFFFF" opacity="0.95"/>
    <text x="300" y="475" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#1E3A5F" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text>
    <text x="300" y="560" font-family="Microsoft YaHei, sans-serif" font-size="42" fill="#FFD700" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text>
  </g>

  <g transform="translate(720, 80)">
    <rect x="0" y="0" width="1100" height="920" rx="20" fill="#FFFFFF"/>
    <text x="550" y="50" font-family="Arial, sans-serif" font-size="24" fill="#64748B" text-anchor="middle">POSITION DETAILS</text>
    <text x="550" y="90" font-family="Microsoft YaHei, sans-serif" font-size="32" fill="#1E3A5F" text-anchor="middle" font-weight="bold">职位详情</text>
    <line x1="50" y1="115" x2="1050" y2="115" stroke="#E2E8F0" stroke-width="2"/>

    <g transform="translate(50, 140)">
      <rect x="0" y="0" width="480" height="50" rx="8" fill="#F8FAFC"/>
      <text x="20" y="33" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#64748B">工作地点</text>
      <text x="460" y="33" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#1E293B" text-anchor="end" font-weight="500">${formData.location || '不限'}</text>

      <rect x="500" y="0" width="480" height="50" rx="8" fill="#F8FAFC"/>
      <text x="520" y="33" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#64748B">学历要求</text>
      <text x="960" y="33" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#1E293B" text-anchor="end" font-weight="500">${formData.education || '不限'}</text>

      <rect x="0" y="65" width="480" height="50" rx="8" fill="#F8FAFC"/>
      <text x="20" y="98" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#64748B">经验要求</text>
      <text x="460" y="98" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#1E293B" text-anchor="end" font-weight="500">${formData.experience || '不限'}</text>

      <rect x="500" y="65" width="480" height="50" rx="8" fill="#F8FAFC"/>
      <text x="520" y="98" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#64748B">招聘人数</text>
      <text x="960" y="98" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#1E293B" text-anchor="end" font-weight="500">${formData.recruitCount || '若干'}人</text>
    </g>

    <text x="50" y="300" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#1E3A5F" font-weight="bold">岗位职责</text>
    <rect x="50" y="320" width="1000" height="120" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
    <text x="70" y="350" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#475569">${generateTspanText(formData.responsibilities || '面议', 70, 22, 60)}</text>

    <text x="50" y="480" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#1E3A5F" font-weight="bold">任职要求</text>
    <rect x="50" y="500" width="1000" height="140" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
    <text x="70" y="535" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#475569">${generateTspanText(formData.requirements || '面议', 70, 22, 60)}</text>

    <text x="50" y="680" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#1E3A5F" font-weight="bold">福利待遇</text>
    <rect x="50" y="700" width="1000" height="100" rx="10" fill="#EFF6FF"/>
    <text x="70" y="740" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#475569">${generateTspanText(formData.welfare || '面议', 70, 22, 60)}</text>

    <rect x="50" y="830" width="1000" height="60" rx="10" fill="#1E3A5F"/>
    <text x="150" y="868" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#FFFFFF">联系人：${formData.contactName || '---'}</text>
    <text x="550" y="868" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#FFFFFF" text-anchor="middle">联系电话：${formData.contactPhone || '---'}</text>
    <text x="950" y="868" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FFFFFF" text-anchor="end" opacity="0.8">期待您的加入</text>
  </g>
</svg>
`
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
  if (!template || !template.templatePath) return ''
  // 确保路径正确拼接，templatePath格式如: /templates/template-modern.svg
  const path = template.templatePath.startsWith('/')
    ? template.templatePath
    : '/' + template.templatePath
  // 返回 /files/templates/template-modern.svg
  return '/files' + path
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
    const res = await generatePoster({
      templateId: selectedTemplate.value.id,
      jobId: formData.jobId,
      posterName: formData.title || '海报_' + formData.jobTitle
    })
    // 后端返回的路径如: /posters/poster_xxx.png
    // 通过代理访问: /files/posters/poster_xxx.png
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

      &:hover {
        border-color: #409eff;
      }

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

        .preview-svg,
        .preview-img {
          width: 100%;
          display: block;
        }
      }
    }
  }

  .config-form {
    .divider-title {
      font-weight: bold;
      white-space: nowrap;
    }

    :deep(.el-form-item__label) {
      white-space: nowrap;
    }
  }
}

.result-container {
  text-align: center;

  .result-image {
    max-width: 100%;
    border-radius: 8px;
  }
}
</style>