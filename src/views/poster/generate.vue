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

            <el-form-item label="联系方式">
              <el-switch v-model="formData.showContact" />
            </el-form-item>

            <template v-if="formData.showContact">
              <el-form-item label="联系人">
                <el-input v-model="formData.contactName" placeholder="联系人" />
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="formData.contactPhone" placeholder="联系电话" />
              </el-form-item>
            </template>

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
  showContact: true,
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
  // 直接返回模板路径，由后端处理数据填充
  // 或者在前端构建带数据的SVG
  return buildPreviewSvgUrl()
})

// 构建预览SVG URL
const buildPreviewSvgUrl = () => {
  if (!selectedTemplate.value) return ''

  // 根据模板颜色方案获取渐变色
  const colorScheme = selectedTemplate.value.colorScheme || 'BLUE'
  const colors = {
    BLUE: {
      start: '#1e3c72',
      end: '#2a5298',
      salaryBg: 'rgba(245,108,108,0.9)'
    },
    GREEN: {
      start: '#11998e',
      end: '#38ef7d',
      salaryBg: 'rgba(255,255,255,0.95)',
      salaryColor: '#11998e'
    },
    RED: {
      start: '#ee0979',
      end: '#ff6a00',
      salaryBg: 'rgba(255,255,255,0.95)',
      salaryColor: '#ee0979'
    }
  }
  const color = colors[colorScheme] || colors.BLUE

  // 创建预览SVG
  const svgContent = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color.start}"/>
          <stop offset="100%" style="stop-color:${color.end}"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg-gradient)"/>
      <circle cx="1700" cy="150" r="200" fill="rgba(255,255,255,0.05)"/>
      <circle cx="200" cy="900" r="150" fill="rgba(255,255,255,0.05)"/>
      <text x="960" y="120" font-family="Microsoft YaHei, sans-serif" font-size="48" fill="rgba(255,255,255,0.9)" text-anchor="middle">诚聘英才</text>
      <line x1="760" y1="150" x2="1160" y2="150" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
      <text x="960" y="280" font-family="Microsoft YaHei, sans-serif" font-size="72" fill="#fff" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text>
      <text x="960" y="380" font-family="Microsoft YaHei, sans-serif" font-size="42" fill="rgba(255,255,255,0.9)" text-anchor="middle">${formData.company || '公司名称'}</text>
      <rect x="710" y="430" width="500" height="80" rx="10" fill="${color.salaryBg}"/>
      <text x="960" y="485" font-family="Microsoft YaHei, sans-serif" font-size="48" fill="${color.salaryColor || '#fff'}" text-anchor="middle" font-weight="bold">${formData.salary || '薪资范围'}</text>
      <rect x="360" y="560" width="1200" height="280" rx="15" fill="rgba(255,255,255,0.1)"/>
      <text x="960" y="620" font-family="Microsoft YaHei, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">岗位要求</text>
      <g transform="translate(460, 680)">
        <rect x="0" y="0" width="240" height="60" rx="8" fill="rgba(255,255,255,0.15)"/>
        <text x="120" y="40" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#fff" text-anchor="middle">${formData.location || '不限'}</text>
        <text x="120" y="-10" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">工作地点</text>
        <rect x="280" y="0" width="240" height="60" rx="8" fill="rgba(255,255,255,0.15)"/>
        <text x="400" y="40" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#fff" text-anchor="middle">${formData.education || '不限'}</text>
        <text x="400" y="-10" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">学历要求</text>
        <rect x="560" y="0" width="240" height="60" rx="8" fill="rgba(255,255,255,0.15)"/>
        <text x="680" y="40" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#fff" text-anchor="middle">${formData.experience || '不限'}</text>
        <text x="680" y="-10" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">经验要求</text>
      </g>
      <rect x="360" y="870" width="1200" height="150" rx="15" fill="rgba(255,255,255,0.15)"/>
      <text x="500" y="920" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">联系人：</text>
      <text x="600" y="920" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#fff">${formData.contactName || '-'}</text>
      <text x="500" y="970" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">联系电话：</text>
      <text x="620" y="970" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#fff">${formData.contactPhone || '-'}</text>
      <text x="960" y="1060" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="rgba(255,255,255,0.4)" text-anchor="middle">期待您的加入</text>
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
  // 确保路径正确拼接，templatePath格式如: /templates/template-blue.svg
  const path = template.templatePath.startsWith('/')
    ? template.templatePath
    : '/' + template.templatePath
  // 返回 /files/templates/template-blue.svg
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
    // 后端返回的路径如: /posters/poster_xxx.svg
    // 通过代理访问: /files/posters/poster_xxx.svg
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
    showContact: true,
    contactName: '',
    contactPhone: ''
  })
}

// 下载
const handleDownload = () => {
  const link = document.createElement('a')
  link.href = resultImage.value
  link.download = `${formData.title || '海报'}.svg`
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