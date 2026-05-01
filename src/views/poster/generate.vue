<template>
  <div class="poster-generate-container">
    <!-- 模式切换 -->
    <div class="mode-tabs">
      <el-radio-group v-model="mode" size="default">
        <el-radio-button value="single">单张生成</el-radio-button>
        <el-radio-button value="batch">批量生成</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ===== 单张生成模式 ===== -->
    <template v-if="mode === 'single'">
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
                v-for="template in singleTemplateList"
                :key="template.id"
                class="template-item"
                :class="{ active: selectedTemplate?.id === template.id }"
                @click="selectTemplate(template)"
              >
                <img v-if="getTemplatePreviewUrl(template)" :src="getTemplatePreviewUrl(template)" :alt="template.templateName" />
                <div v-else class="template-placeholder" :style="{ background: template.id === 'multi_01' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0' }">
                  <span class="placeholder-text">{{ template.templateName }}</span>
                </div>
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
                  filterable
                  :filter-method="filterJob"
                  @change="handleJobChange"
                >
                  <el-option
                    v-for="job in filteredJobList"
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

              <el-form-item label="职位信息">
                <el-input
                  v-model="formData.jobInfo"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入职位信息（包括岗位职责和任职要求）"
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

      <!-- 单张生成结果弹窗 -->
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
    </template>

    <!-- ===== 批量生成模式 ===== -->
    <template v-else>
      <!-- 步骤条 -->
      <div class="batch-steps-bar">
        <div class="bs-step" :class="{ done: !!selectedTemplate, active: !selectedTemplate }">
          <div class="bs-circle">
            <el-icon v-if="selectedTemplate"><Check /></el-icon>
            <span v-else>1</span>
          </div>
          <div class="bs-text">
            <div class="bs-title">选择模板</div>
            <div class="bs-desc">{{ selectedTemplate ? selectedTemplate.templateName : '选择一个海报模板' }}</div>
          </div>
        </div>
        <div class="bs-line" :class="{ active: !!selectedTemplate }" />
        <div class="bs-step" :class="{ done: batchSelectedJobs.length > 0, active: !!selectedTemplate && batchSelectedJobs.length === 0 }">
          <div class="bs-circle">
            <el-icon v-if="batchSelectedJobs.length > 0"><Check /></el-icon>
            <span v-else>2</span>
          </div>
          <div class="bs-text">
            <div class="bs-title">勾选职位</div>
            <div class="bs-desc">{{ batchSelectedJobs.length > 0 ? `已选 ${batchSelectedJobs.length} 个职位` : '勾选要生成海报的职位' }}</div>
          </div>
        </div>
        <div class="bs-line" :class="{ active: batchSelectedJobs.length > 0 }" />
        <div class="bs-step" :class="{ done: batchSelectedJobs.length > 0 && isMultiTemplate, active: batchSelectedJobs.length > 0 && isMultiTemplate && !customBottomText }">
          <div class="bs-circle"><el-icon v-if="batchSelectedJobs.length > 0 && isMultiTemplate"><Check /></el-icon><span v-else>3</span></div>
          <div class="bs-text">
            <div class="bs-title">确认配置</div>
            <div class="bs-desc">{{ isMultiTemplate ? '设置海报样式' : '确认生成配置' }}</div>
          </div>
        </div>
        <div class="bs-line" :class="{ active: batchSelectedJobs.length > 0 && isMultiTemplate }" v-if="isMultiTemplate" />
        <div class="bs-step" :class="{ active: batchSelectedJobs.length > 0 && isMultiTemplate && !!customBottomText }" v-if="isMultiTemplate">
          <div class="bs-circle"><span>4</span></div>
          <div class="bs-text">
            <div class="bs-title">自定义设置</div>
            <div class="bs-desc">设置底部标语</div>
          </div>
        </div>
      </div>

      <el-row :gutter="20" class="batch-layout">
        <!-- 左侧：模板选择 + 职位列表 -->
        <el-col :span="16">
          <!-- 模板选择 -->
          <el-card shadow="never" class="batch-template-card">
            <template #header>
              <div class="batch-card-header">
                <div class="batch-step-tag">STEP 1</div>
                <span class="batch-card-title">选择海报模板</span>
              </div>
            </template>
            <div class="batch-template-grid">
              <div
                v-for="template in batchTemplateList"
                :key="template.id"
                class="batch-tpl-item"
                :class="{ active: selectedTemplate?.id === template.id }"
                @click="selectTemplate(template)"
              >
                <div class="batch-tpl-img-wrap">
                  <img v-if="getTemplatePreviewUrl(template)" :src="getTemplatePreviewUrl(template)" :alt="template.templateName" />
                  <div v-else class="batch-tpl-placeholder" :style="{ background: template.id === 'multi_01' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0' }">
                    <span class="placeholder-text">{{ template.templateName }}</span>
                  </div>
                  <div class="batch-tpl-check" v-if="selectedTemplate?.id === template.id">
                    <el-icon><Check /></el-icon>
                  </div>
                  <div class="batch-tpl-hover-mask">点击选用</div>
                </div>
                <div class="batch-tpl-name">{{ template.templateName }}</div>
              </div>
            </div>
          </el-card>

          <!-- 职位列表 -->
          <el-card shadow="never" class="batch-job-card">
            <template #header>
              <div class="batch-card-header">
                <div class="batch-step-tag step2">STEP 2</div>
                <span class="batch-card-title">勾选职位</span>
                <div class="batch-selected-badge" v-if="batchSelectedJobs.length > 0">
                  已选 {{ batchSelectedJobs.length }} 个
                </div>
                <div class="batch-job-toolbar">
                  <el-input
                    v-model="batchJobQuery.keyword"
                    placeholder="搜索职位名称"
                    clearable
                    size="small"
                    style="width: 150px"
                    @keyup.enter="fetchBatchJobList"
                    @clear="fetchBatchJobList"
                  >
                    <template #prefix><el-icon><Search /></el-icon></template>
                  </el-input>
                  <el-select
                    v-model="batchJobQuery.status"
                    placeholder="状态筛选"
                    clearable
                    size="small"
                    style="width: 100px"
                    @change="fetchBatchJobList"
                  >
                    <el-option label="招聘中" :value="1" />
                    <el-option label="已暂停" :value="0" />
                  </el-select>
                  <el-button size="small" type="primary" @click="fetchBatchJobList">搜索</el-button>
                </div>
              </div>
            </template>

            <el-table
              ref="batchTableRef"
              :data="batchJobList"
              v-loading="batchJobLoading"
              size="default"
              @selection-change="handleBatchSelectionChange"
              row-key="id"
              :row-class-name="({ row }) => batchSelectedJobs.find(j => j.id === row.id) ? 'selected-row' : ''"
            >
              <el-table-column type="selection" width="50" reserve-selection />
              <el-table-column prop="jobName" label="职位名称" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="job-name-cell">{{ row.jobName }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="company" label="公司" min-width="110" show-overflow-tooltip />
              <el-table-column label="薪资" width="130">
                <template #default="{ row }">
                  <span class="salary-cell">{{ formatSalary(row.salaryMin, row.salaryMax) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="workAddress" label="工作地点" width="320" />
              <el-table-column prop="education" label="学历" width="80" />
              <el-table-column label="状态" width="82">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="light">
                    {{ row.status === 1 ? '招聘中' : '已暂停' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

            <div class="batch-table-footer">
              <span class="selected-tip">
                共 <b>{{ batchJobTotal }}</b> 个职位，已勾选 <b class="accent">{{ batchSelectedJobs.length }}</b> 个
              </span>
              <el-pagination
                v-model:current-page="batchJobQuery.pageNum"
                v-model:page-size="batchJobQuery.pageSize"
                :total="batchJobTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="sizes, prev, pager, next"
                small
                @size-change="fetchBatchJobList"
                @current-change="fetchBatchJobList"
              />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：确认面板 -->
        <el-col :span="8">
          <div class="batch-summary-wrap">
            <!-- 确认清单 -->
            <el-card shadow="never" class="batch-confirm-card">
              <template #header>
                <div class="batch-card-header">
                  <div class="batch-step-tag step3">STEP 3</div>
                  <span class="batch-card-title">确认并生成</span>
                </div>
              </template>

              <!-- 确认项：模板 -->
              <div class="confirm-item" :class="{ 'confirm-done': !!selectedTemplate }">
                <div class="confirm-icon-wrap" :class="{ done: !!selectedTemplate }">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="confirm-content">
                  <div class="confirm-label">海报模板</div>
                  <div v-if="selectedTemplate" class="confirm-value">
                    <span>{{ selectedTemplate.templateName }}</span>
                  </div>
                  <div v-else class="confirm-empty">请在左侧选择模板</div>
                </div>
                <el-icon class="confirm-check" v-if="selectedTemplate"><SuccessFilled /></el-icon>
              </div>

              <!-- 确认项：职位 -->
              <div class="confirm-item" :class="{ 'confirm-done': batchSelectedJobs.length > 0 }">
                <div class="confirm-icon-wrap" :class="{ done: batchSelectedJobs.length > 0 }">
                  <el-icon><List /></el-icon>
                </div>
                <div class="confirm-content">
                  <div class="confirm-label">
                    已选职位
                    <span class="confirm-count" v-if="batchSelectedJobs.length > 0">{{ batchSelectedJobs.length }} 个</span>
                  </div>
                  <div v-if="batchSelectedJobs.length > 0" class="confirm-job-list">
                    <div
                      v-for="job in batchSelectedJobs.slice(0, 5)"
                      :key="job.id"
                      class="confirm-job-item"
                    >
                      <span class="cj-dot" />
                      <span class="cj-name">{{ job.jobName }}</span>
                      <el-icon class="cj-remove" @click="removeSelectedJob(job)"><Close /></el-icon>
                    </div>
                    <div v-if="batchSelectedJobs.length > 5" class="confirm-job-more">
                      还有 {{ batchSelectedJobs.length - 5 }} 个职位...
                      <el-button link size="small" type="danger" @click="clearBatchSelection">清空全部</el-button>
                    </div>
                  </div>
                  <div v-else class="confirm-empty">请在左侧勾选职位</div>
                </div>
                <el-icon class="confirm-check" v-if="batchSelectedJobs.length > 0"><SuccessFilled /></el-icon>
              </div>
            </el-card>

            <!-- Step 4: 自定义设置（仅多岗位模板） -->
            <el-card v-if="isMultiTemplate" shadow="never" class="batch-confirm-card step4-card">
              <template #header>
                <div class="batch-card-header">
                  <div class="batch-step-tag step4">STEP 4</div>
                  <span class="batch-card-title">自定义设置</span>
                </div>
              </template>
              <el-form label-position="top">
                <el-form-item label="底部标语">
                  <el-input
                    v-model="customBottomText"
                    type="textarea"
                    :rows="2"
                    maxlength="100"
                    show-word-limit
                    placeholder="例如：期待您的加入 · WE LOOK FORWARD TO YOUR APPLICATION"
                  />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 生成按钮区 -->
            <div class="batch-cta-wrap">
              <div class="batch-cta-stat">
                <div class="cta-stat-item">
                  <span class="cta-stat-num">{{ posterCount }}</span>
                  <span class="cta-stat-label">待生成</span>
                </div>
                <div class="cta-stat-divider" />
                <div class="cta-stat-item">
                  <span class="cta-stat-num">{{ templateList.length }}</span>
                  <span class="cta-stat-label">可用模板</span>
                </div>
              </div>
              <button
                class="batch-generate-btn"
                :class="{ disabled: !selectedTemplate || batchSelectedJobs.length === 0, loading: batchGenerating }"
                :disabled="!selectedTemplate || batchSelectedJobs.length === 0 || batchGenerating"
                @click="handleBatchGenerate"
              >
                <el-icon v-if="!batchGenerating"><MagicStick /></el-icon>
                <el-icon v-else class="btn-loading-icon"><Loading /></el-icon>
                <span>{{ batchGenerating ? '生成中...' : `批量生成 ${posterCount} 张` }}</span>
              </button>
              <div class="batch-cta-tip">
                <el-icon><InfoFilled /></el-icon>
                每张海报自动填入对应职位信息
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </template>

    <!-- ===== 批量生成进度弹窗 ===== -->
    <el-dialog
      v-model="batchProgressVisible"
      width="560px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="batchDone"
      :title="undefined"
      class="progress-dialog"
    >
      <div class="progress-container">
        <!-- 顶部圆形进度 -->
        <div class="progress-top">
          <el-progress
            type="circle"
            :percentage="batchPercent"
            :status="batchDone ? (batchErrorCount > 0 ? 'warning' : 'success') : undefined"
            :width="110"
            :stroke-width="8"
            :color="batchDone && batchErrorCount === 0 ? '#67c23a' : '#409eff'"
          />
          <div class="progress-top-text">
            <div class="ptt-count">{{ batchDoneCount }} <span>/ {{ batchProgressList.length }}</span></div>
            <div class="ptt-label" :class="batchDone ? 'done' : 'running'">
              {{ batchDone ? '已全部完成' : '正在生成...' }}
            </div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="progress-list">
          <transition-group name="progress-fade">
            <div
              v-for="item in batchProgressList"
              :key="item.jobId"
              class="progress-item"
              :class="item.status"
            >
              <div class="pi-status-dot" />
              <span class="pi-name">{{ item.jobName }}</span>
              <div class="pi-right">
                <span class="pi-status-text">
                  <template v-if="item.status === 'success'">✓ 成功</template>
                  <template v-else-if="item.status === 'error'">✗ {{ item.errorMsg || '失败' }}</template>
                  <template v-else-if="item.status === 'loading'">生成中</template>
                  <template v-else>等待中</template>
                </span>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- 完成后汇总 -->
        <div class="progress-summary" v-if="batchDone">
          <div class="ps-item success">
            <el-icon><SuccessFilled /></el-icon>
            <span>成功 <b>{{ batchSuccessCount }}</b> 张</span>
          </div>
          <div class="ps-item error" v-if="batchErrorCount > 0">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>失败 <b>{{ batchErrorCount }}</b> 张</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="progress-footer">
          <el-button v-if="batchDone" size="large" @click="batchProgressVisible = false">关闭</el-button>
          <el-button v-if="batchDone" size="large" type="primary" @click="goToPosterList">
            前往海报列表
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Picture,
  Search,
  InfoFilled,
  Close,
  MagicStick,
  SuccessFilled,
  CircleCloseFilled,
  Loading,
  Check,
  List
} from '@element-plus/icons-vue'
import { getJobList, getJobDetail } from '@/api/job'
import { getPosterTemplates, generatePoster, batchCreatePoster } from '@/api/poster'
import { renderTemplate } from '@/utils/posterTemplateEngine'
import '@/utils/posterTemplateEngine'

const router = useRouter()

// ─── 通用：模式切换 ───────────────────────────────────────────
const mode = ref('single')

// ─── 通用：模板 ───────────────────────────────────────────────
const templateList = ref([])
const selectedTemplate = ref(null)
const customBottomText = ref('')

// 单张模式：过滤掉多岗模板
const singleTemplateList = computed(() => {
  return templateList.value.filter(t => t.id !== 'multi_01')
})

// 批量模式：显示全部模板
const batchTemplateList = computed(() => {
  return templateList.value
})

// 是否多岗位模板
const isMultiTemplate = computed(() => selectedTemplate.value?.id === 'multi_01')

// 多岗位模板每张最多4个岗位，计算需要生成的张数
const posterCount = computed(() => {
  if (!isMultiTemplate.value) return batchSelectedJobs.value.length
  return Math.ceil(batchSelectedJobs.value.length / 4)
})

// ─── 单张模式：职位列表 & 表单 ───────────────────────────────
const jobList = ref([])
const filteredJobList = ref([])
const formData = reactive({
  jobId: null, title: '', jobTitle: '', company: '', salary: '',
  location: '', education: '', experience: '', recruitCount: '',
  jobInfo: '', welfare: '', contactName: '', contactPhone: ''
})
const formRef = ref(null)
const formRules = {
  jobId: [{ required: true, message: '请选择职位', trigger: 'change' }],
  title: [{ required: true, message: '请输入海报标题', trigger: 'blur' }]
}
const generating = ref(false)
const resultVisible = ref(false)
const resultImage = ref('')

// ─── 批量模式：职位表格 ───────────────────────────────────────
const batchTableRef = ref(null)
const batchJobList = ref([])
const batchJobTotal = ref(0)
const batchJobLoading = ref(false)
const batchJobQuery = reactive({
  pageNum: 1, pageSize: 10, keyword: '', status: null
})
// 组件销毁重建时从 sessionStorage 恢复勾选
const batchSelectedJobs = ref(JSON.parse(sessionStorage.getItem('batchSelectedJobs') || '[]'))

const persistBatchSelection = () => {
  sessionStorage.setItem('batchSelectedJobs', JSON.stringify(batchSelectedJobs.value))
}

// ─── 批量模式：进度 ───────────────────────────────────────────
const batchGenerating = ref(false)
const batchProgressVisible = ref(false)
const batchProgressList = ref([])
const batchDone = ref(false)
const batchDoneCount = computed(() =>
  batchProgressList.value.filter(i => i.status === 'success' || i.status === 'error').length
)
const batchPercent = computed(() => {
  if (batchProgressList.value.length === 0) return 0
  return Math.round((batchDoneCount.value / batchProgressList.value.length) * 100)
})
const batchSuccessCount = computed(() =>
  batchProgressList.value.filter(i => i.status === 'success').length
)
const batchErrorCount = computed(() =>
  batchProgressList.value.filter(i => i.status === 'error').length
)

// ─── 预览（单张模式用）────────────────────────────────────────
const previewSvgUrl = computed(() => {
  if (!selectedTemplate.value) return ''
  return buildPreviewSvgUrl()
})

// 薪资格式化（处理 min/max 为 0 或 null 的情况）
const formatSalary = (min, max) => {
  if (!min && !max) return '面议'
  if (min === max) return `${min}`
  if (!min || min === 0) return `${max}`
  if (!max || max === 0) return `${min}`
  return `${min}-${max}`
}

// 文本换行处理
const formatTextForSvg = (text, charsPerLine) => {
  if (!text) return []
  const lines = []
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (!para) { lines.push(''); continue }
    let currentLine = '', charCount = 0
    for (const char of para) {
      const width = /[\u4e00-\u9fa5]/.test(char) ? 1 : 0.5
      charCount += width
      if (charCount > charsPerLine && currentLine) {
        lines.push(currentLine); currentLine = char; charCount = width
      } else {
        currentLine += char
      }
    }
    if (currentLine) lines.push(currentLine)
  }
  return lines
}

const generateTspanText = (text, x, lineHeight, charsPerLine) => {
  const lines = formatTextForSvg(text, charsPerLine)
  if (lines.length === 0) return ''
  return lines.map((line, index) => {
    if (index === 0) return line
    return `<tspan x="${x}" dy="${lineHeight}">${line}</tspan>`
  }).join('')
}

const getSvgTemplateByColorScheme = (colorScheme) => {
  const c = colorScheme || 'BLUE'
  if (c === 'ORANGE') {
    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="energyBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFF4E6"/><stop offset="100%" style="stop-color:#FFE4CC"/></linearGradient><linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#FF6B35"/><stop offset="100%" style="stop-color:#FFB347"/></linearGradient><linearGradient id="warmCard" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFFFFF"/><stop offset="100%" style="stop-color:#FFFAF5"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#energyBg)"/><circle cx="1600" cy="150" r="250" fill="#FF6B35" opacity="0.08"/><circle cx="1750" cy="300" r="180" fill="#FFB347" opacity="0.1"/><circle cx="100" cy="900" r="200" fill="#FF6B35" opacity="0.08"/><rect x="0" y="0" width="1920" height="16" fill="url(#orangeGrad)"/><rect x="60" y="80" width="600" height="920" rx="20" fill="url(#warmCard)"/><rect x="60" y="80" width="600" height="140" rx="20" fill="#FF6B35"/><rect x="60" y="180" width="600" height="40" fill="#FF6B35"/><text x="360" y="150" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" text-anchor="middle" opacity="0.9">${formData.company || '公司名称'}</text><text x="360" y="200" font-family="Microsoft YaHei, sans-serif" font-size="60" fill="#FFFFFF" text-anchor="middle" font-weight="bold">招 贤 纳 士</text><rect x="100" y="260" width="520" height="110" rx="16" fill="#FFFFFF" stroke="#FF6B35" stroke-width="3"/><text x="360" y="330" font-family="Microsoft YaHei, sans-serif" font-size="38" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><rect x="100" y="400" width="520" height="80" rx="12" fill="#FF6B35"/><text x="360" y="455" font-family="Microsoft YaHei, sans-serif" font-size="40" fill="#FFFFFF" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(100, 520)"><rect x="0" y="0" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="122" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">工作地点</text><text x="122" y="58" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="265" y="0" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="387" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">学历要求</text><text x="387" y="58" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="0" y="90" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="122" y="120" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">经验要求</text><text x="122" y="148" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text><rect x="265" y="90" width="245" height="80" rx="10" fill="#FFF0E6"/><text x="387" y="120" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#999999" text-anchor="middle">招聘人数</text><text x="387" y="148" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#FF6B35" text-anchor="middle" font-weight="bold">${formData.recruitCount || '若干'}</text></g><text x="100" y="740" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#FF6B35" font-weight="bold">★ 福利待遇 ★</text><rect x="100" y="760" width="520" height="70" rx="10" fill="#FFF0E6"/><text x="120" y="802" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#666666">${formData.welfare || '福利待遇'}</text><rect x="700" y="80" width="1160" height="920" rx="20" fill="url(#warmCard)"/><rect x="700" y="80" width="1160" height="12" fill="url(#orangeGrad)"/><text x="760" y="150" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#FF6B35" font-weight="bold">职位详情</text><text x="760" y="185" font-family="Arial, sans-serif" font-size="16" fill="#999999">JOB DETAILS</text><line x1="760" y1="210" x2="1780" y2="210" stroke="#FFD4B8" stroke-width="2"/><rect x="700" y="240" width="8" height="200" rx="4" fill="#FF6B35"/><rect x="708" y="240" width="1132" height="200" rx="0" fill="#FFFAF5"/><text x="760" y="280" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FF6B35" font-weight="bold">岗位职责</text><text x="760" y="320" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#555555">${generateTspanText(formData.jobInfo || '岗位职责内容', 70, 22, 60)}</text><rect x="700" y="460" width="8" height="200" rx="4" fill="#FFB347"/><rect x="708" y="460" width="1132" height="200" rx="0" fill="#FFFAF5"/><text x="760" y="500" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FF8C00" font-weight="bold">任职要求</text><text x="760" y="540" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#555555">${generateTspanText(formData.jobInfo || '任职要求内容', 70, 22, 60)}</text><rect x="760" y="720" width="1040" height="100" rx="16" fill="#FF6B35"/><text x="900" y="770" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" font-weight="bold">联系人：${formData.contactName || '---'}</text><text x="1300" y="770" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#FFFFFF" font-weight="bold">电话：${formData.contactPhone || '---'}</text><rect x="0" y="1064" width="1920" height="16" fill="url(#orangeGrad)"/></svg>`
  }
  if (c === 'GREEN') {
    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="natureBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F0FDF4"/><stop offset="100%" style="stop-color:#DCFCE7"/></linearGradient><linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#22C55E"/><stop offset="100%" style="stop-color:#4ADE80"/></linearGradient><linearGradient id="leafPattern" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#86EFAC;stop-opacity:0.3"/><stop offset="100%" style="stop-color:#22C55E;stop-opacity:0.1"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#natureBg)"/><rect x="0" y="0" width="1920" height="160" fill="url(#greenGrad)"/><circle cx="1650" cy="60" r="180" fill="#ffffff" opacity="0.15"/><circle cx="1800" cy="120" r="120" fill="#ffffff" opacity="0.1"/><circle cx="120" cy="80" r="100" fill="#ffffff" opacity="0.15"/><text x="960" y="100" font-family="Microsoft YaHei, sans-serif" font-size="72" fill="#FFFFFF" text-anchor="middle" font-weight="bold">JOIN US</text><rect x="140" y="200" width="1640" height="720" rx="24" fill="#FFFFFF"/><rect x="140" y="200" width="640" height="720" rx="24" fill="#FFFFFF"/><rect x="140" y="200" width="640" height="720" rx="24" fill="url(#leafPattern)"/><text x="460" y="280" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#166534" text-anchor="middle">${formData.company || '公司名称'}</text><rect x="260" y="310" width="400" height="4" rx="2" fill="url(#greenGrad)"/><text x="460" y="400" font-family="Microsoft YaHei, sans-serif" font-size="44" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><rect x="200" y="440" width="520" height="70" rx="12" fill="#DCFCE7"/><text x="460" y="492" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#16A34A" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(200, 550)"><rect x="0" y="0" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="115" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">工作地点</text><text x="115" y="60" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="250" y="0" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="365" y="30" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">学历要求</text><text x="365" y="60" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="0" y="100" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="115" y="130" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">经验要求</text><text x="115" y="160" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text><rect x="250" y="100" width="230" height="90" rx="12" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/><text x="365" y="130" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">招聘人数</text><text x="365" y="160" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#14532D" text-anchor="middle" font-weight="bold">${formData.recruitCount || '若干'}</text></g><rect x="820" y="200" width="960" height="720" rx="0" fill="#FFFFFF"/><rect x="820" y="200" width="960" height="10" fill="url(#greenGrad)"/><text x="860" y="270" font-family="Microsoft YaHei, sans-serif" font-size="24" fill="#14532D" font-weight="bold">福利待遇</text><rect x="860" y="295" width="880" height="70" rx="12" fill="#F0FDF4" stroke="#22C55E" stroke-width="1"/><text x="885" y="340" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#166534">${formData.welfare || '福利待遇'}</text><text x="860" y="410" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#14532D" font-weight="bold">岗位职责</text><rect x="820" y="420" width="8" height="150" rx="4" fill="#22C55E"/><rect x="828" y="420" width="932" height="150" rx="0" fill="#F0FDF4"/><text x="860" y="455" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#374151">${generateTspanText(formData.jobInfo || '岗位职责内容', 70, 22, 60)}</text><text x="860" y="610" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="#14532D" font-weight="bold">任职要求</text><rect x="820" y="620" width="8" height="150" rx="4" fill="#4ADE80"/><rect x="828" y="620" width="932" height="150" rx="0" fill="#F0FDF4"/><text x="860" y="655" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#374151">${generateTspanText(formData.jobInfo || '任职要求内容', 70, 22, 60)}</text><rect x="820" y="800" width="920" height="80" rx="12" fill="#14532D"/><text x="900" y="845" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#FFFFFF">联系人：${formData.contactName || '---'}</text><text x="1200" y="845" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#86EFAC">电话：${formData.contactPhone || '---'}</text><rect x="140" y="920" width="1640" height="10" rx="5" fill="url(#greenGrad)"/></svg>`
  }
  return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="techBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0a1628"/><stop offset="50%" style="stop-color:#1a3a5c"/><stop offset="100%" style="stop-color:#0d2137"/></linearGradient><linearGradient id="techLine" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#00D4FF;stop-opacity:0"/><stop offset="50%" style="stop-color:#00D4FF;stop-opacity:1"/><stop offset="100%" style="stop-color:#00D4FF;stop-opacity:0"/></linearGradient><linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95"/><stop offset="100%" style="stop-color:#f0f8ff;stop-opacity:0.95"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#techBg)"/><line x1="0" y1="200" x2="600" y2="200" stroke="url(#techLine)" stroke-width="1"/><line x1="1320" y1="200" x2="1920" y2="200" stroke="url(#techLine)" stroke-width="1"/><line x1="0" y1="880" x2="500" y2="880" stroke="url(#techLine)" stroke-width="1"/><line x1="1420" y1="880" x2="1920" y2="880" stroke="url(#techLine)" stroke-width="1"/><polygon points="1700,100 1750,180 1650,180" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.5"/><polygon points="200,900 250,980 150,980" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.5"/><circle cx="1750" cy="800" r="80" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.3"/><circle cx="170" cy="180" r="60" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.3"/><rect x="60" y="120" width="580" height="840" rx="16" fill="url(#cardGrad)"/><rect x="60" y="120" width="580" height="8" rx="4" fill="#00D4FF"/><text x="350" y="180" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#5a7a9a" text-anchor="middle">${formData.company || '公司名称'}</text><text x="350" y="260" font-family="Microsoft YaHei, sans-serif" font-size="56" fill="#0a1628" text-anchor="middle" font-weight="bold">职等你来</text><text x="350" y="310" font-family="Arial, sans-serif" font-size="28" fill="#00D4FF" text-anchor="middle" letter-spacing="8">WE WANT YOU</text><line x1="150" y1="350" x2="550" y2="350" stroke="#e0e8f0" stroke-width="2"/><rect x="100" y="380" width="500" height="100" rx="12" fill="#f8fafc" stroke="#00D4FF" stroke-width="2"/><text x="350" y="445" font-family="Microsoft YaHei, sans-serif" font-size="36" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.jobTitle || '职位名称'}</text><text x="350" y="540" font-family="Microsoft YaHei, sans-serif" font-size="44" fill="#00D4FF" text-anchor="middle" font-weight="bold">${formData.salary || '面议'}</text><g transform="translate(0, 580)"><rect x="80" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="145" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">工作地点</text><text x="145" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.location || '不限'}</text><rect x="225" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="290" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">学历要求</text><text x="290" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.education || '不限'}</text><rect x="370" y="0" width="130" height="70" rx="8" fill="#e6f7ff"/><text x="435" y="28" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5a7a9a" text-anchor="middle">经验要求</text><text x="435" y="52" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#0a1628" text-anchor="middle" font-weight="bold">${formData.experience || '不限'}</text></g><rect x="80" y="680" width="500" height="60" rx="8" fill="#0a1628"/><text x="100" y="720" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#00D4FF">福  利</text><text x="180" y="720" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#ffffff">${formData.welfare || '福利待遇'}</text><rect x="680" y="120" width="1180" height="840" rx="16" fill="url(#cardGrad)"/><rect x="680" y="120" width="1180" height="8" rx="4" fill="#00D4FF"/><text x="720" y="180" font-family="Microsoft YaHei, sans-serif" font-size="32" fill="#0a1628" font-weight="bold">职位详情</text><text x="720" y="215" font-family="Arial, sans-serif" font-size="16" fill="#5a7a9a">POSITION DETAILS</text><line x1="720" y1="240" x2="1800" y2="240" stroke="#e0e8f0" stroke-width="1"/><g transform="translate(720, 270)"><rect x="0" y="0" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="20" y="25" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">工作地点</text><text x="20" y="52" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.location || '不限'}</text><rect x="560" y="0" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="580" y="25" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">学历要求</text><text x="580" y="52" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.education || '不限'}</text><rect x="0" y="85" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="20" y="110" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">经验要求</text><text x="20" y="137" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.experience || '不限'}</text><rect x="560" y="85" width="530" height="70" rx="8" fill="#f0f8ff"/><text x="580" y="110" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5a7a9a">招聘人数</text><text x="580" y="137" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#0a1628" font-weight="500">${formData.recruitCount || '若干'} 人</text></g><text x="720" y="470" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#0a1628" font-weight="bold">岗位职责</text><rect x="720" y="490" width="1080" height="120" rx="8" fill="#f8fafc" stroke="#e0e8f0" stroke-width="1"/><text x="740" y="520" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#37474f">${generateTspanText(formData.jobInfo || '岗位职责内容', 70, 22, 60)}</text><text x="720" y="640" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#0a1628" font-weight="bold">任职要求</text><rect x="720" y="660" width="1080" height="120" rx="8" fill="#f8fafc" stroke="#e0e8f0" stroke-width="1"/><text x="740" y="690" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#37474f">${generateTspanText(formData.jobInfo || '任职要求内容', 70, 22, 60)}</text><rect x="720" y="820" width="1080" height="80" rx="8" fill="#0a1628"/><text x="770" y="865" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#00D4FF">联 系 人：${formData.contactName || '---'}</text><text x="1100" y="865" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="#ffffff">电    话：${formData.contactPhone || '---'}</text></svg>`
}

const buildPreviewSvgUrl = () => {
  if (!selectedTemplate.value) return ''
  const colorScheme = selectedTemplate.value.colorScheme || 'BLUE'
  if (colorScheme === 'BLUE' || colorScheme === 'GREEN') {
    try {
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
  const svgContent = getSvgTemplateByColorScheme(colorScheme)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
}

// ─── 通用：获取模板列表 ───────────────────────────────────────
const fetchTemplateList = async () => {
  try {
    const res = await getPosterTemplates()
    let list = res.data || []
    // 如果数据库模板中没有 multi_01，则追加（前端注册的模板）
    if (!list.find(t => t.id === 'multi_01')) {
      list = [...list, {
        id: 'multi_01',
        templateName: '多岗招聘',
        colorScheme: 'BLUE',
        previewPath: null  // 前端渲染，无需预览图
      }]
    }
    templateList.value = list
    if (templateList.value.length > 0 && !selectedTemplate.value) {
      selectTemplate(templateList.value[0])
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

// ─── 通用：选择模板 ───────────────────────────────────────────
const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const getTemplatePreviewUrl = (template) => {
  if (!template) return ''
  const path = template.previewPath || template.templatePath
  if (!path) return ''
  const fullPath = path.startsWith('/') ? path : '/' + path
  return '/files' + fullPath
}

// ─── 单张模式：方法 ───────────────────────────────────────────
const fetchJobList = async () => {
  try {
    const res = await getJobList({ pageNum: 1, pageSize: 100, status: 1 })
    jobList.value = res.data.records || []
    filteredJobList.value = jobList.value
  } catch (error) {
    console.error('获取职位列表失败:', error)
  }
}

const filterJob = (val) => {
  if (!val) {
    filteredJobList.value = jobList.value
  } else {
    const query = val.toLowerCase()
    filteredJobList.value = jobList.value.filter(job =>
      job.jobName.toLowerCase().includes(query)
    )
  }
}

const handleJobChange = async (jobId) => {
  if (!jobId) return
  try {
    const res = await getJobDetail(jobId)
    const job = res.data
    formData.title = `${job.jobName || ''} - ${job.company || ''}`
    formData.jobTitle = job.jobName || ''
    formData.company = job.company || ''
    formData.salary = formatSalary(job.salaryMin, job.salaryMax)
    formData.location = job.workAddress || ''
    formData.education = job.education || ''
    formData.experience = job.experience || ''
    formData.recruitCount = job.recruitCount || ''
    formData.jobInfo = job.jobInfo || ''
    formData.welfare = job.welfare || ''
    formData.contactName = job.contactName || ''
    formData.contactPhone = job.contactPhone || ''
  } catch (error) {
    console.error('获取职位详情失败:', error)
  }
}

const handleGenerate = async () => {
  await formRef.value.validate()
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择海报模板')
    return
  }
  generating.value = true
  try {
    let svgContent = ''
    const colorScheme = selectedTemplate.value.colorScheme
    if (colorScheme === 'BLUE' || colorScheme === 'GREEN') {
      const templatePath = selectedTemplate.value.templatePath || ''
      let templateId = 'tech_01'
      if (templatePath.includes('admin')) templateId = 'admin_01'
      else if (templatePath.includes('tech_02') || colorScheme === 'GREEN') templateId = 'tech_02'
      svgContent = renderTemplate(templateId, formData)
    }
    const res = await generatePoster({
      templateId: selectedTemplate.value.id,
      jobId: formData.jobId,
      posterName: formData.title || '海报_' + formData.jobTitle,
      svgContent
    })
    const filePath = res.data.filePath || res.data
    resultImage.value = filePath.startsWith('/') ? '/files' + filePath : '/files/' + filePath
    resultVisible.value = true
    ElMessage.success('海报生成成功')
  } catch (error) {
    console.error('生成海报失败:', error)
  } finally {
    generating.value = false
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    jobId: null, title: '', jobTitle: '', company: '', salary: '',
    location: '', education: '', experience: '', recruitCount: '',
    jobInfo: '', welfare: '', contactName: '', contactPhone: ''
  })
}

const handleDownload = () => {
  const link = document.createElement('a')
  link.href = resultImage.value
  link.download = `${formData.title || '海报'}.png`
  link.click()
  ElMessage.success('开始下载')
}

const handlePush = () => {
  resultVisible.value = false
  router.push('/poster/list')
}

// ─── 批量模式：方法 ───────────────────────────────────────────
const fetchBatchJobList = async () => {
  batchJobLoading.value = true
  try {
    const params = {
      pageNum: batchJobQuery.pageNum,
      pageSize: batchJobQuery.pageSize,
      jobName: batchJobQuery.keyword || undefined,
      status: batchJobQuery.status ?? undefined
    }
    const res = await getJobList(params)
    batchJobList.value = res.data.records || []
    batchJobTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取职位列表失败:', error)
  } finally {
    batchJobLoading.value = false
  }
}

const handleBatchSelectionChange = (rows) => {
  // 多岗模板：超过4个岗位会自动拆分为多张海报，不再限制选择数量
  // 合并跨页选择：先移除当前页中未被选中的，再添加当前页新选中的
  const currentPageIds = batchJobList.value.map(j => j.id)
  const selectedIds = rows.map(j => j.id)
  // 移除当前页中取消的
  batchSelectedJobs.value = batchSelectedJobs.value.filter(
    j => !currentPageIds.includes(j.id) || selectedIds.includes(j.id)
  )
  // 添加当前页新选中（去重）
  for (const job of rows) {
    if (!batchSelectedJobs.value.find(j => j.id === job.id)) {
      batchSelectedJobs.value.push(job)
    }
  }
  persistBatchSelection()
}

const removeSelectedJob = (job) => {
  batchSelectedJobs.value = batchSelectedJobs.value.filter(j => j.id !== job.id)
  batchTableRef.value?.toggleRowSelection(job, false)
  persistBatchSelection()
}

const clearBatchSelection = () => {
  batchSelectedJobs.value = []
  batchTableRef.value?.clearSelection()
  persistBatchSelection()
}

// 构建单张海报用的 formData-like 对象（从 job 详情映射）
const buildFormDataFromJob = (job) => ({
  jobId: job.id,
  title: `${job.jobName || ''} - ${job.company || ''}`,
  jobTitle: job.jobName || '',
  company: job.company || '',
  salary: formatSalary(job.salaryMin, job.salaryMax),
  location: job.workAddress || '',
  education: job.education || '',
  experience: job.experience || '',
  recruitCount: job.recruitCount || '',
  jobInfo: job.jobInfo ?? '',
  welfare: job.welfare ?? '',
  contactName: job.contactName || '',
  contactPhone: job.contactPhone || ''
})

const getSvgForJob = (jobFormData) => {
  // multi_01 模板有自己独立的渲染逻辑（多岗位）
  if (selectedTemplate.value.id === 'multi_01') {
    return renderTemplate('multi_01', jobFormData)
  }
  const colorScheme = selectedTemplate.value.colorScheme || 'BLUE'
  if (colorScheme === 'BLUE' || colorScheme === 'GREEN') {
    const templatePath = selectedTemplate.value.templatePath || ''
    let templateId = 'tech_01'
    if (templatePath.includes('admin')) templateId = 'admin_01'
    else if (templatePath.includes('tech_02') || colorScheme === 'GREEN') templateId = 'tech_02'
    return renderTemplate(templateId, jobFormData)
  }
  // ORANGE 内联 SVG（复用同一函数，临时替换 formData）
  const saved = { ...formData }
  Object.assign(formData, jobFormData)
  const svg = getSvgTemplateByColorScheme(colorScheme)
  Object.assign(formData, saved)
  return svg
}

// 构建多岗位海报数据
const buildMultiJobData = (jobs) => {
  // 公司名称：取第一个岗位的公司名称
  const company = jobs[0]?.company || '公司名称'
  // 统计信息
  const jobCount = jobs.length
  const totalCount = jobs.reduce((sum, j) => sum + (parseInt(j.recruitCount) || 0), 0)

  // 构建 jobs 数组供模板使用（动态长度，不填充空位）
  const jobsArray = jobs.map(job => ({
    jobTitle: job.jobName || '',
    salary: formatSalary(job.salaryMin, job.salaryMax),
    location: job.workAddress || '不限',
    education: job.education || '不限',
    experience: job.experience || '不限',
    recruitCount: job.recruitCount ? `${job.recruitCount}人` : '若干',
    welfare: job.welfare || '',
    jobInfo: job.jobInfo || '',
    contactName: job.contactName || '',
    contactPhone: job.contactPhone || ''
  }))

  return {
    company,
    contactName: jobs[0]?.contactName || '',
    contactPhone: jobs[0]?.contactPhone || '',
    jobCount,
    totalCount,
    welfare: jobs[0]?.welfare || '',
    jobs: jobsArray,
    bottomText: customBottomText.value || ''
  }
}

// 多岗位海报 SVG 生成
const getSvgForMultiJob = (jobs) => {
  const multiData = buildMultiJobData(jobs)
  return renderTemplate('multi_01', multiData)
}

const handleBatchGenerate = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择海报模板')
    return
  }
  if (batchSelectedJobs.value.length === 0) {
    ElMessage.warning('请勾选至少一个职位')
    return
  }

  const isMultiTemplate = selectedTemplate.value?.id === 'multi_01'

  // 多岗位模板校验：必须同一家公司
  if (isMultiTemplate) {
    const companies = [...new Set(batchSelectedJobs.value.map(j => j.company))]
    if (companies.length > 1) {
      ElMessage.warning('多岗位海报只能选择同一家公司的职位，请重新选择')
      return
    }
  }

  // 多岗位模板：每4个岗位生成一张海报
  if (isMultiTemplate) {
    const chunkSize = 4
    const chunks = []
    for (let i = 0; i < batchSelectedJobs.value.length; i += chunkSize) {
      chunks.push(batchSelectedJobs.value.slice(i, i + chunkSize))
    }
    batchProgressList.value = chunks.map((chunk, idx) => ({
      jobId: `multi-${idx}`,
      jobName: `多岗位海报（第${idx + 1}张）`,
      status: 'pending',
      errorMsg: ''
    }))
    batchDone.value = false
    batchGenerating.value = true
    batchProgressVisible.value = true

    let successCount = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      batchProgressList.value[i].status = 'loading'
      try {
        const jobDetails = await Promise.all(chunk.map(job => getJobDetail(job.id)))
        const jobs = jobDetails.map(res => res.data)
        const svgContent = getSvgForMultiJob(jobs)

        await batchCreatePoster({
          templateId: selectedTemplate.value.id,
          jobIds: chunk.map(j => j.id),
          posterName: `${batchSelectedJobs.value[0]?.company || '公司名称'}-多岗位招聘（第${i + 1}张）`,
          svgContent
        })
        batchProgressList.value[i].status = 'success'
        successCount++
      } catch (error) {
        batchProgressList.value[i].status = 'error'
        batchProgressList.value[i].errorMsg = error?.message || '生成失败'
        console.error(`多岗位海报（第${i + 1}张）生成失败:`, error)
      }
    }
    batchDone.value = true
    batchGenerating.value = false
    ElMessage.success(`多岗位海报生成完成：成功 ${successCount} 张，失败 ${chunks.length - successCount} 张`)
    return
  }

  // 普通模板：逐个生成单岗位海报
  batchProgressList.value = batchSelectedJobs.value.map(job => ({
    jobId: job.id,
    jobName: job.jobName,
    status: 'pending',
    errorMsg: ''
  }))
  batchDone.value = false
  batchGenerating.value = true
  batchProgressVisible.value = true

  for (let i = 0; i < batchSelectedJobs.value.length; i++) {
    const job = batchSelectedJobs.value[i]
    batchProgressList.value[i].status = 'loading'

    try {
      const detailRes = await getJobDetail(job.id)
      const jobDetail = detailRes.data
      const jobFormData = buildFormDataFromJob(jobDetail)
      const svgContent = getSvgForJob(jobFormData)

      await generatePoster({
        templateId: selectedTemplate.value.id,
        jobId: job.id,
        posterName: jobFormData.title,
        svgContent
      })
      batchProgressList.value[i].status = 'success'
    } catch (error) {
      batchProgressList.value[i].status = 'error'
      batchProgressList.value[i].errorMsg = error?.message || '生成失败'
      console.error(`职位 ${job.jobName} 生成失败:`, error)
    }
  }

  batchDone.value = true
  batchGenerating.value = false
  ElMessage.success(`批量生成完成：成功 ${batchSuccessCount.value} 张，失败 ${batchErrorCount.value} 张`)
}

const goToPosterList = () => {
  // 先清空勾选，再关闭弹窗（避免 dialog 先关闭导致 batchTableRef 失效）
  batchSelectedJobs.value = []
  batchTableRef.value?.clearSelection()
  batchJobQuery.pageNum = 1
  batchJobQuery.keyword = ''
  batchJobQuery.status = null
  batchDone.value = false
  batchProgressVisible.value = false
  sessionStorage.removeItem('batchSelectedJobs')
  router.push('/poster/list')
}

// ─── 初始化 ───────────────────────────────────────────────────
onMounted(() => {
  fetchTemplateList()
  fetchJobList()
  fetchBatchJobList()
})

// 组件从 keep-alive 缓存激活时：恢复勾选状态
onActivated(() => {
  const saved = JSON.parse(sessionStorage.getItem('batchSelectedJobs') || '[]')
  batchSelectedJobs.value = saved
  // 等待表格 DOM 就绪后恢复勾选
  nextTick(() => {
    if (batchTableRef.value && saved.length > 0) {
      batchJobList.value.forEach(job => {
        if (saved.find(j => j.id === job.id)) {
          batchTableRef.value?.toggleRowSelection(job, true)
        }
      })
    }
  })
})

// 进度弹窗关闭时重置勾选状态（无论是点"关闭"还是"前往海报列表"）
watch(batchProgressVisible, (val) => {
  if (!val) {
    batchSelectedJobs.value = []
    batchTableRef.value?.clearSelection()
    batchDone.value = false
    sessionStorage.removeItem('batchSelectedJobs')
  }
})

// 监听模式切换到批量模式时，恢复表格勾选状态
watch(mode, (newMode) => {
  if (newMode === 'batch') {
    // 重置页码和搜索条件，确保加载第一页数据
    batchJobQuery.pageNum = 1
    batchJobQuery.keyword = ''
    batchJobQuery.status = null
    fetchBatchJobList()
  }
})

// 数据加载完成后恢复表格勾选状态
watch(batchJobList, () => {
  if (mode.value !== 'batch' || !batchTableRef.value) return
  nextTick(() => {
    if (!batchTableRef.value) return
    batchSelectedJobs.value.forEach(job => {
      const row = batchJobList.value.find(j => j.id === job.id)
      if (row) {
        batchTableRef.value?.toggleRowSelection(row, true)
      }
    })
  })
})
</script>

<style lang="scss" scoped>
.poster-generate-container {
  .mode-tabs {
    margin-bottom: 16px;
  }

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

  // 模板网格
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

      .template-placeholder {
        width: 100%;
        height: 80px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;

        .placeholder-text {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
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

  // 单张模式预览
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

  // ─── 批量模式：步骤条 ─────────────────────────────────────────
  .batch-steps-bar {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 14px;
    padding: 20px 32px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);

    .bs-step {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .bs-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f0f2f5;
        color: #c0c4cc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 700;
        flex-shrink: 0;
        transition: all 0.3s;
      }

      .bs-text {
        .bs-title {
          font-size: 14px;
          font-weight: 600;
          color: #c0c4cc;
          transition: color 0.3s;
        }
        .bs-desc {
          font-size: 12px;
          color: #dcdfe6;
          margin-top: 2px;
          transition: color 0.3s;
        }
      }

      &.active {
        .bs-circle {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .bs-text .bs-title { color: #303133; }
        .bs-text .bs-desc { color: #909399; }
      }

      &.done {
        .bs-circle {
          background: linear-gradient(135deg, #67c23a 0%, #4caf50 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
        }
        .bs-text .bs-title { color: #303133; }
        .bs-text .bs-desc { color: #67c23a; font-weight: 500; }
      }
    }

    .bs-line {
      flex: 0 0 60px;
      height: 2px;
      background: #f0f2f5;
      border-radius: 2px;
      margin: 0 8px;
      transition: background 0.3s;

      &.active { background: linear-gradient(90deg, #67c23a, #409eff); }
    }
  }

  // ─── 批量模式：通用卡片头 ─────────────────────────────────────
  .batch-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    .batch-step-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 2px 8px;
      border-radius: 4px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;

      &.step2 { background: linear-gradient(135deg, #409eff 0%, #36cfc9 100%); }
      &.step3 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.step4 { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }

    .step4-card {
      margin-top: 12px;
    }
    }

    .batch-card-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      flex: 1;
    }

    .batch-selected-badge {
      font-size: 12px;
      background: #ecf5ff;
      color: #409eff;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 500;
    }

    .batch-job-toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: auto;
    }
  }

  // ─── 批量模式：模板选择 ───────────────────────────────────────
  .batch-layout {
    .batch-template-card { margin-bottom: 16px; }

    .batch-template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;

      .batch-tpl-item {
        cursor: pointer;
        border-radius: 10px;
        border: 2px solid #ebeef5;
        overflow: hidden;
        transition: all 0.25s;

        &:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.15);

          .batch-tpl-hover-mask { opacity: 1; }
        }

        &.active {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .batch-tpl-img-wrap {
          position: relative;
          overflow: hidden;

          img {
            width: 100%;
            height: 90px;
            object-fit: cover;
            display: block;
            transition: transform 0.25s;
          }

          .batch-tpl-placeholder {
            width: 100%;
            height: 90px;
            display: flex;
            align-items: center;
            justify-content: center;

            .placeholder-text {
              font-size: 14px;
              font-weight: 600;
              color: #fff;
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
          }

          .batch-tpl-check {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #667eea;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }

          .batch-tpl-hover-mask {
            position: absolute;
            inset: 0;
            background: rgba(102, 126, 234, 0.6);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
          }
        }

        .batch-tpl-name {
          padding: 8px 10px;
          font-size: 12px;
          color: #606266;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    // 表格美化
    .batch-job-card {
      :deep(.selected-row) {
        background: linear-gradient(90deg, #f0f4ff, #fff);
      }

      :deep(.el-table__row:hover td) {
        background: #f8f9ff !important;
      }

      .job-name-cell { font-weight: 500; color: #303133; }
      .salary-cell { color: #f5880a; font-weight: 500; }

      .bottom-text-preview {
        margin-top: 12px;
        padding: 10px 12px;
        background: #f8f9ff;
        border-radius: 6px;
        border: 1px solid #e2e8f0;

        .preview-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }

        .preview-bar {
          font-size: 14px;
          color: #1a365d;
          font-weight: 600;
          text-align: center;
          background: #1a365d;
          color: #fff;
          padding: 8px 12px;
          border-radius: 4px;
        }
      }
    }

    .batch-table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;

      .selected-tip {
        font-size: 13px;
        color: #909399;
        .accent { color: #409eff; font-weight: 700; }
      }
    }

    // ─── 右侧确认面板 ─────────────────────────────────────────
    .batch-summary-wrap {
      position: sticky;
      top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .batch-confirm-card {
      .confirm-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 0;
        border-bottom: 1px dashed #f0f0f0;

        &:last-child { border-bottom: none; }

        .confirm-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #f5f7fa;
          color: #c0c4cc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.3s;

          &.done {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
          }
        }

        .confirm-content {
          flex: 1;
          min-width: 0;

          .confirm-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;

            .confirm-count {
              background: #ecf5ff;
              color: #409eff;
              padding: 0 6px;
              border-radius: 10px;
              font-size: 11px;
            }
          }

          .confirm-value {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: #303133;

            .confirm-tpl-thumb {
              width: 48px;
              height: 30px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #ebeef5;
            }
          }

          .confirm-empty {
            font-size: 12px;
            color: #dcdfe6;
            font-style: italic;
          }

          .confirm-job-list {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .confirm-job-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              color: #606266;

              .cj-dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: #667eea;
                flex-shrink: 0;
              }

              .cj-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .cj-remove {
                color: #dcdfe6;
                cursor: pointer;
                font-size: 13px;
                flex-shrink: 0;
                transition: color 0.2s;
                &:hover { color: #f56c6c; }
              }
            }

            .confirm-job-more {
              font-size: 12px;
              color: #909399;
              padding-left: 11px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
          }
        }

        .confirm-check {
          color: #67c23a;
          font-size: 18px;
          flex-shrink: 0;
        }
      }
    }

    // CTA 区域
    .batch-cta-wrap {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 14px;
      padding: 20px;

      .batch-cta-stat {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 16px;

        .cta-stat-item {
          text-align: center;

          .cta-stat-num {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            line-height: 1;
          }

          .cta-stat-label {
            font-size: 11px;
            color: rgba(255,255,255,0.7);
            margin-top: 4px;
            display: block;
          }
        }

        .cta-stat-divider {
          width: 1px;
          height: 36px;
          background: rgba(255,255,255,0.25);
        }
      }

      .batch-generate-btn {
        width: 100%;
        height: 48px;
        border-radius: 10px;
        border: none;
        background: rgba(255,255,255,0.95);
        color: #667eea;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
        letter-spacing: 0.5px;

        &:hover:not(.disabled) {
          background: #fff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }

        &.disabled {
          background: rgba(255,255,255,0.35);
          color: rgba(255,255,255,0.6);
          cursor: not-allowed;
        }

        &.loading {
          background: rgba(255,255,255,0.8);
          color: #667eea;
        }

        .btn-loading-icon {
          animation: spin 1s linear infinite;
        }
      }

      .batch-cta-tip {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
        font-size: 11px;
        color: rgba(255,255,255,0.65);
        justify-content: center;
      }
    }
  }
}

// ─── 进度弹窗 ─────────────────────────────────────────────────
.progress-dialog {
  :deep(.el-dialog__header) { display: none; }
  :deep(.el-dialog__body) { padding: 0; }
  :deep(.el-dialog__footer) { padding: 0 24px 20px; }
}

.progress-container {
  .progress-top {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 28px 28px 20px;
    background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
    border-bottom: 1px solid #f0f0f0;

    .progress-top-text {
      .ptt-count {
        font-size: 36px;
        font-weight: 700;
        color: #303133;
        line-height: 1;

        span { font-size: 18px; color: #c0c4cc; font-weight: 400; }
      }

      .ptt-label {
        font-size: 13px;
        margin-top: 6px;

        &.running { color: #409eff; }
        &.done { color: #67c23a; font-weight: 600; }
      }
    }
  }

  .progress-list {
    max-height: 320px;
    overflow-y: auto;
    padding: 12px 20px;

    .progress-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 6px;
      transition: all 0.3s;

      .pi-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background: #dcdfe6;
      }

      .pi-name {
        flex: 1;
        font-size: 13px;
        color: #606266;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pi-right {
        flex-shrink: 0;

        .pi-status-text {
          font-size: 12px;
          color: #909399;
        }
      }

      &.success {
        background: #f0f9eb;
        .pi-status-dot { background: #67c23a; }
        .pi-name { color: #303133; font-weight: 500; }
        .pi-status-text { color: #67c23a; font-weight: 500; }
      }

      &.error {
        background: #fef0f0;
        .pi-status-dot { background: #f56c6c; }
        .pi-name { color: #303133; }
        .pi-status-text { color: #f56c6c; }
      }

      &.loading {
        background: #ecf5ff;
        .pi-status-dot {
          background: #409eff;
          animation: pulse 1s ease-in-out infinite;
        }
        .pi-name { color: #303133; }
        .pi-status-text { color: #409eff; }
      }

      &.pending {
        opacity: 0.45;
      }
    }
  }

  .progress-summary {
    display: flex;
    gap: 12px;
    padding: 14px 20px;
    border-top: 1px solid #f0f0f0;

    .ps-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 8px;

      &.success {
        background: #f0f9eb;
        color: #67c23a;
        b { color: #529b2e; }
      }

      &.error {
        background: #fef0f0;
        color: #f56c6c;
        b { color: #c45656; }
      }
    }
  }
}

.progress-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// ─── 动画 ─────────────────────────────────────────────────────
.progress-fade-enter-active { transition: all 0.3s ease; }
.progress-fade-enter-from { opacity: 0; transform: translateX(-10px); }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

// 单张结果弹窗
.result-container {
  text-align: center;
  .result-image { max-width: 100%; border-radius: 8px; }
}
</style>
