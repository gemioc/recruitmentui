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
              <img :src="template.thumbnail" :alt="template.name" />
              <div class="template-name">{{ template.name }}</div>
            </div>
          </div>
        </el-card>

        <!-- 预览区域 -->
        <el-card shadow="never" class="preview-card" v-if="selectedTemplate">
          <template #header>
            <span>海报预览</span>
          </template>
          <div class="preview-area">
            <div class="preview-wrapper" :style="previewStyle">
              <img :src="selectedTemplate.previewUrl" alt="预览" class="preview-bg" />
              <div class="preview-content">
                <h2 class="job-title">{{ formData.jobTitle || '职位名称' }}</h2>
                <div class="company-name">{{ formData.company || '公司名称' }}</div>
                <div class="salary">{{ formData.salary || '薪资范围' }}</div>
                <div class="info-row">
                  <span>{{ formData.location || '工作地点' }}</span>
                  <span>{{ formData.education || '学历要求' }}</span>
                  <span>{{ formData.experience || '经验要求' }}</span>
                </div>
                <div class="contact-info" v-if="formData.showContact">
                  <div>联系人：{{ formData.contactName || '-' }}</div>
                  <div>电话：{{ formData.contactPhone || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：表单配置 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>海报配置</span>
          </template>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="80px"
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
                  :label="job.title"
                  :value="job.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="海报标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入海报标题" />
            </el-form-item>

            <el-divider content-position="left">显示内容</el-divider>

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

            <el-form-item label="显示联系方式">
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

// 职位选择变化
const handleJobChange = async (jobId) => {
  if (!jobId) return
  try {
    const res = await getJobDetail(jobId)
    const job = res.data
    formData.title = `${job.title} - ${job.company}`
    formData.jobTitle = job.title
    formData.company = job.company
    formData.salary = job.salary
    formData.location = job.location
    formData.education = job.education
    formData.experience = job.experience
    formData.contactName = job.contactName
    formData.contactPhone = job.contactPhone
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
      title: formData.title,
      content: {
        jobTitle: formData.jobTitle,
        company: formData.company,
        salary: formData.salary,
        location: formData.location,
        education: formData.education,
        experience: formData.experience,
        showContact: formData.showContact,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone
      }
    })
    resultImage.value = res.data.imageUrl
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
  link.download = `${formData.title}.png`
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

  .template-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
        height: 100px;
        object-fit: cover;
        border-radius: 4px;
      }

      .template-name {
        text-align: center;
        margin-top: 8px;
        font-size: 13px;
        color: #606266;
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

      .preview-wrapper {
        position: relative;
        width: 100%;
        max-width: 640px;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;

        .preview-bg {
          width: 100%;
          display: block;
        }

        .preview-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #fff;

          .job-title {
            font-size: 28px;
            margin-bottom: 10px;
          }

          .company-name {
            font-size: 18px;
            margin-bottom: 15px;
          }

          .salary {
            font-size: 24px;
            color: #f56c6c;
            margin-bottom: 15px;
          }

          .info-row {
            font-size: 14px;
            margin-bottom: 20px;

            span {
              margin: 0 10px;
            }
          }

          .contact-info {
            font-size: 14px;
            text-align: left;

            div {
              margin-bottom: 5px;
            }
          }
        }
      }
    }
  }

  .config-form {
    :deep(.el-divider__text) {
      font-weight: bold;
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