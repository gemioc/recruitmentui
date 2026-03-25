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

  // 根据模板判断是横版还是竖版
  const templatePath = selectedTemplate.value.templatePath || ''
  const isLandscape = templatePath.includes('r3')

  // 竖版模板 (r1样式)
  if (!isLandscape) {
    const svgContent = `
    <svg width="600" height="814" viewBox="0 0 600 814" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="814" fill="#2C2C2C"/>
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#D4AF37"/>
          <stop offset="100%" style="stop-color:#F0E68C"/>
        </linearGradient>
      </defs>

      <!-- 顶部公司名 -->
      <text x="30" y="50" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="28" fill="#D4AF37" font-weight="500">fotor ${formData.company || '金融投资公司'}</text>

      <!-- 大标题 -->
      <text x="300" y="150" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="64" fill="#F5F5DC" text-anchor="middle" font-weight="bold">精英 你在哪?</text>

      <!-- 副标题 -->
      <rect x="50" y="170" width="500" height="50" fill="#D4AF37" opacity="0.9"/>
      <text x="300" y="205" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="28" fill="#2C2C2C" text-anchor="middle" font-weight="bold">挑战年薪百万·走向人生巅峰</text>

      <!-- 职位信息 -->
      <text x="30" y="270" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="26" fill="#D4AF37" font-weight="500">${formData.jobTitle || '分公司总经理'}</text>
      <text x="320" y="270" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#F5F5DC" font-weight="500">年薪：${formData.salary || '60-100w'}</text>
      <text x="500" y="270" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#F5F5DC" font-weight="500">坐标：${formData.location || '成都'}</text>

      <!-- 职位描述 -->
      <rect x="30" y="290" width="540" height="180" rx="4" stroke="#D4AF37" stroke-width="1" fill="none"/>
      <text x="50" y="325" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="22" fill="#D4AF37" font-weight="bold">职位描述：</text>
      <text x="50" y="360" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="16" fill="#F5F5DC" font-weight="400">
        <tspan x="50" dy="0">制定分公司营销业务增长目标并有效执行</tspan>
        <tspan x="50" dy="25">负责分公司营销团队的组建；</tspan>
        <tspan x="50" dy="25">带领下属共同完成分公司整体业务指标；</tspan>
        <tspan x="50" dy="25">负责分公司员工的考核和培训；</tspan>
        <tspan x="50" dy="25">不断开发大客户资源并作长期维护。</tspan>
      </text>

      <!-- 任职要求 -->
      <rect x="30" y="480" width="540" height="200" rx="4" stroke="#D4AF37" stroke-width="1" fill="none"/>
      <text x="50" y="515" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="22" fill="#D4AF37" font-weight="bold">任职要求：</text>
      <text x="50" y="550" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="16" fill="#F5F5DC" font-weight="400">
        <tspan x="50" dy="0">六年以上金融机构工作经验；</tspan>
        <tspan x="50" dy="25">有成功运营10人以上团队经验；</tspan>
        <tspan x="50" dy="25">有较好的客户开拓与维护能力；</tspan>
        <tspan x="50" dy="25">良好的沟通协调能力，能承受工作压力；</tspan>
        <tspan x="50" dy="25">有现成的大客户资源者优先。</tspan>
      </text>

      <!-- 底部 -->
      <text x="300" y="720" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="18" fill="#D4AF37" text-anchor="middle">求贤若渴的我们，同样欢迎您的推荐。</text>
      <text x="480" y="780" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="20" fill="#D4AF37" font-weight="bold">[投递简历]</text>
    </svg>
  `
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
  }

  // 横版模板 (r3样式)
  const svgContent = `
  <svg width="1733" height="855" viewBox="0 0 1733 855" xmlns="http://www.w3.org/2000/svg">
    <rect width="1733" height="855" fill="#0066CC"/>
    <defs>
      <pattern id="stripes" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="20" stroke="#1A75D1" stroke-width="10"/>
      </pattern>
    </defs>
    <rect width="1733" height="855" fill="url(#stripes)" opacity="0.3"/>

    <!-- 左侧大标题 -->
    <g transform="translate(100, 150)">
      <path d="M0 0 Q 50 -30 100 0 T 200 0 T 300 0 T 400 0" fill="#66E0FF" opacity="0.7"/>
      <text font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="96" fill="#000000" font-weight="900">
        <tspan x="0" y="100">非你莫属</tspan>
        <tspan x="0" y="220">招募计划</tspan>
      </text>
      <rect x="50" y="250" width="400" height="60" rx="30" fill="#0052B4"/>
      <text x="250" y="290" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="32" fill="#FFFFFF" text-anchor="middle" font-weight="bold">寻找发光的你</text>
    </g>

    <!-- 右侧岗位信息 -->
    <g transform="translate(900, 100)">
      <rect x="0" y="0" width="750" height="450" rx="20" fill="#FFFFFF"/>
      <text x="375" y="60" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="32" fill="#000000" text-anchor="middle" font-weight="bold">SEARCH AFTER</text>
      <text x="375" y="120" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="36" fill="#000000" text-anchor="middle" font-weight="bold">招聘岗位 >>>>>>>>>>>>>></text>

      <rect x="100" y="150" width="200" height="50" rx="6" fill="#000000"/>
      <text x="200" y="185" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle" font-weight="bold">${formData.jobTitle || '抖音运营'}</text>
      <text x="500" y="185" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="28" fill="#000000" font-weight="bold">${formData.salary || '8000-9000K'}</text>

      <text x="50" y="250" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#000000" font-weight="500">
        <tspan x="50" dy="0">① 能够独立完成短视频拍摄任务</tspan>
        <tspan x="50" dy="40">② 负责视频后期剪辑服从公司及部门安排</tspan>
        <tspan x="50" dy="40">   理解脚本以及账号需求</tspan>
        <tspan x="50" dy="40">③ 能根据文案脚本运用镜头语言对视</tspan>
        <tspan x="50" dy="30">   频内容进行画质优化能力。</tspan>
      </text>
    </g>

    <!-- 底部联系方式 -->
    <g transform="translate(100, 700)">
      <text font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#FFFFFF" font-weight="500">
        <tspan x="0" dy="0">联系电话：${formData.contactPhone || '010-12345678'}</tspan>
        <tspan x="0" dy="35">公司地址：${formData.location || '上海市浦东新区图怪兽大楼'}</tspan>
      </text>
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
    showContact: true,
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