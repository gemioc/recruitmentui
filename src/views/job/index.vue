<template>
  <div class="job-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon job">
            <el-icon><Briefcase /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">职位总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon recruiting">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ recruitingCount }}</div>
            <div class="stat-label">招聘中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon expired">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total - recruitingCount }}</div>
            <div class="stat-label">已截止</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon today">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ todayCount }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作栏 -->
    <el-card shadow="never" class="search-card">
      <div class="search-bar">
        <div class="search-filters">
          <el-input
            v-model="queryParams.jobName"
            placeholder="搜索职位名称..."
            :prefix-icon="Search"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryParams.workAddress"
            placeholder="搜索工作地点..."
            :prefix-icon="Location"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="招聘中" :value="1" />
            <el-option label="已截止" :value="0" />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div class="search-actions">
          <el-button type="success" @click="handleImport">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            模板下载
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增职位
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 职位列表 -->
    <el-card shadow="never" class="table-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>职位列表</span>
        </div>
      </template>

      <el-table :data="jobList" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="jobName" label="职位名称" min-width="150" />
        <el-table-column prop="company" label="公司名称" min-width="150" />
        <el-table-column label="薪资范围" width="150">
          <template #default="{ row }">
            {{ row.salaryMin }}-{{ row.salaryMax }}
          </template>
        </el-table-column>
        <el-table-column prop="workAddress" label="工作地点" min-width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchJobList"
        @current-change="fetchJobList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位名称" prop="jobName">
              <el-input v-model="formData.jobName" placeholder="请输入职位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company">
              <el-input v-model="formData.company" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="薪资下限" prop="salaryMin">
              <el-input-number v-model="formData.salaryMin" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资上限" prop="salaryMax">
              <el-input-number v-model="formData.salaryMax" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工作地点" prop="workAddress">
              <el-input v-model="formData.workAddress" placeholder="请输入工作地点" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学历要求" prop="education">
              <el-select v-model="formData.education" placeholder="请选择学历要求">
                <el-option label="不限" value="不限" />
                <el-option label="初中" value="初中" />
                <el-option label="高中" value="高中" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作经验" prop="experience">
              <el-select v-model="formData.experience" placeholder="请选择工作经验">
                <el-option label="不限" value="不限" />
                <el-option label="应届生" value="应届生" />
                <el-option label="1-3年" value="1-3年" />
                <el-option label="3-5年" value="3-5年" />
                <el-option label="5-10年" value="5-10年" />
                <el-option label="10年以上" value="10年以上" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="招聘人数" prop="recruitCount">
              <el-input-number v-model="formData.recruitCount" :min="1" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="职位信息" prop="jobInfo">
          <el-input v-model="formData.jobInfo" type="textarea" :rows="6" placeholder="请输入职位信息（包括岗位职责和任职要求）" />
        </el-form-item>
        <el-form-item label="福利待遇" prop="welfare">
          <el-input v-model="formData.welfare" type="textarea" :rows="4" placeholder="请输入福利待遇，多条用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="职位预览" width="600px">
      <div class="job-preview" v-if="previewData">
        <h2 class="title">{{ previewData.jobName }}</h2>
        <div class="company">{{ previewData.company }}</div>
        <div class="info-row">
          <span class="salary">{{ previewData.salaryMin }}-{{ previewData.salaryMax }}元/月</span>
          <span class="location">{{ previewData.workAddress }}</span>
        </div>
        <el-divider />
        <div class="detail-item"><label>学历要求：</label><span>{{ previewData.education }}</span></div>
        <div class="detail-item"><label>工作经验：</label><span>{{ previewData.experience }}</span></div>
        <div class="detail-item"><label>招聘人数：</label><span>{{ previewData.recruitCount }}人</span></div>
        <el-divider />
        <div class="section" v-if="previewData.jobInfo">
          <h3>职位信息</h3>
          <p>{{ previewData.jobInfo }}</p>
        </div>
        <div class="section" v-if="previewData.welfare">
          <h3>福利待遇</h3>
          <p>{{ previewData.welfare }}</p>
        </div>
        <el-divider />
        <div class="contact">
          <h3>联系方式</h3>
          <p><label>联系人：</label>{{ previewData.contactName }}</p>
          <p><label>电话：</label>{{ previewData.contactPhone }}</p>
          <p v-if="previewData.contactEmail"><label>邮箱：</label>{{ previewData.contactEmail }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importVisible" title="批量导入职位" width="500px">
      <div class="import-dialog">
        <el-upload ref="uploadRef" class="upload-demo" drag :auto-upload="false" :limit="1" accept=".xlsx,.xls" :on-change="handleFileChange" :on-remove="handleFileRemove">
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将Excel文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">只能上传 xlsx/xls 文件，请先<el-button type="primary" link @click="handleDownloadTemplate">下载模板</el-button></div>
          </template>
        </el-upload>
        <div v-if="importResult" class="import-result">
          <el-alert :title="`导入完成：成功 ${importResult.success} 条，失败 ${importResult.fail} 条`" :type="importResult.fail > 0 ? 'warning' : 'success'" :closable="false" />
          <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
            <el-scrollbar height="150px">
              <p v-for="(error, index) in importResult.errors.slice(0, 10)" :key="index" class="error-item">{{ error }}</p>
            </el-scrollbar>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport" :loading="importLoading">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Briefcase, CircleCheckFilled, CircleCloseFilled, Calendar, Search, Location, Upload, Download, Plus, User, Medal, Edit, View, Delete, UploadFilled } from '@element-plus/icons-vue'
import { getJobList, getJobDetail, createJob, updateJob, deleteJob, updateJobStatus, downloadJobTemplate, importJobs } from '@/api/job'
import { formatDate } from '@/utils/format'

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobName: '',
  workAddress: '',
  status: null
})

const jobList = ref([])
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑职位' : '新增职位')

const formData = reactive({
  id: null, jobName: '', company: '', salaryMin: 0, salaryMax: 0, workAddress: '',
  education: '不限', experience: '不限', recruitCount: 1,
  jobInfo: '', welfare: '',
  contactName: '', contactPhone: '', contactEmail: ''
})

const formRules = {
  jobName: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  company: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  workAddress: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}

const previewVisible = ref(false)
const previewData = ref(null)

const importVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref(null)
const importFile = ref(null)
const importResult = ref(null)

// 统计数据
const recruitingCount = computed(() => jobList.value.filter(j => j.status === 1).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return jobList.value.filter(j => j.createTime && new Date(j.createTime).toDateString() === today).length
})

const fetchJobList = async () => {
  loading.value = true
  try {
    const res = await getJobList(queryParams)
    jobList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取职位列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryParams.pageNum = 1; fetchJobList() }
const handleReset = () => { queryParams.jobName = ''; queryParams.workAddress = ''; queryParams.status = null; handleSearch() }

const handleAdd = () => { isEdit.value = false; resetForm(); dialogVisible.value = true }

const handleEdit = async (row) => {
  isEdit.value = true
  try { const res = await getJobDetail(row.id); Object.assign(formData, res.data); dialogVisible.value = true } catch (error) { console.error('获取详情失败:', error) }
}

const resetForm = () => {
  Object.assign(formData, { id: null, jobName: '', company: '', salaryMin: 0, salaryMax: 0, workAddress: '', education: '不限', experience: '不限', recruitCount: 1, jobInfo: '', welfare: '', contactName: '', contactPhone: '', contactEmail: '' })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) { await updateJob(formData.id, formData); ElMessage.success('修改成功') }
    else { await createJob(formData); ElMessage.success('新增成功') }
    dialogVisible.value = false
    fetchJobList()
  } catch (error) { console.error('保存失败:', error) } finally { submitLoading.value = false }
}

const handleStatusChange = async (row) => {
  try { await updateJobStatus(row.id, row.status); ElMessage.success(row.status === 1 ? '已开启招聘' : '已截止招聘') } catch (error) { row.status = row.status === 1 ? 0 : 1; console.error('状态更新失败:', error) }
}

const handlePreview = async (row) => { try { const res = await getJobDetail(row.id); previewData.value = res.data; previewVisible.value = true } catch (error) { console.error('获取详情失败:', error) } }

const handleDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定要删除职位【${row.jobName}】吗？`, '提示', { type: 'warning' }); await deleteJob(row.id); ElMessage.success('删除成功'); fetchJobList() } catch (error) { if (error !== 'cancel') console.error('删除失败:', error) }
}

const handleDownloadTemplate = async () => {
  try { const res = await downloadJobTemplate(); const url = window.URL.createObjectURL(new Blob([res.data])); const link = document.createElement('a'); link.href = url; link.download = '职位导入模板.xlsx'; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url); ElMessage.success('模板下载成功') } catch (error) { console.error('模板下载失败:', error); ElMessage.error('模板下载失败') }
}

const handleImport = () => { importFile.value = null; importResult.value = null; uploadRef.value?.clearFiles(); importVisible.value = true }
const handleFileChange = (file) => { importFile.value = file.raw }
const handleFileRemove = () => { importFile.value = null }

const handleConfirmImport = async () => {
  if (!importFile.value) { ElMessage.warning('请选择要导入的文件'); return }
  importLoading.value = true
  try {
    const res = await importJobs(importFile.value)
    if (res.code === 200) {
      importResult.value = res.data
      const { success, fail } = res.data
      if (fail > 0) ElMessage.warning(`导入完成：成功 ${success} 条，失败 ${fail} 条`)
      else { ElMessage.success(`导入成功：${success} 条`); importVisible.value = false; importFile.value = null; uploadRef.value?.clearFiles(); fetchJobList() }
    } else { ElMessage.error(res.message || '导入失败') }
  } catch (error) { console.error('导入失败:', error); ElMessage.error('导入失败') } finally { importLoading.value = false }
}

onMounted(() => { fetchJobList() })
onActivated(() => fetchJobList())
</script>

<style lang="scss" scoped>
.job-container {
  .stats-row {
    margin-bottom: 20px;
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px; padding: 20px;
      display: flex; align-items: center; color: #fff;
      .stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-right: 16px; background: rgba(255,255,255,0.2); }
      .stat-info { .stat-value { font-size: 28px; font-weight: 700; } .stat-label { font-size: 13px; opacity: 0.85; margin-top: 4px; } }
    }
    .stat-card:nth-child(2) { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .stat-card:nth-child(3) { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .stat-card:nth-child(4) { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  }
  .search-card {
    border-radius: 12px; margin-bottom: 20px;
    .search-bar { display: flex; justify-content: space-between; align-items: center; }
    .search-filters { display: flex; gap: 12px; align-items: center; }
    .search-actions { display: flex; gap: 10px; }
  }
  .table-card {
    border-radius: 12px;
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .el-pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
  }
}
.job-preview {
  .title { font-size: 22px; margin-bottom: 10px; }
  .company { font-size: 16px; color: #666; margin-bottom: 10px; }
  .info-row { .salary { font-size: 18px; color: #f56c6c; margin-right: 20px; } .location { color: #666; } }
  .detail-item { margin-bottom: 10px; label { color: #666; } }
  .section { margin-bottom: 20px; h3 { font-size: 16px; margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #409eff; } p { color: #666; line-height: 1.8; white-space: pre-wrap; } }
  .contact { h3 { font-size: 16px; margin-bottom: 10px; } p { color: #666; margin-bottom: 5px; label { color: #333; } } }
}
.import-dialog {
  .upload-demo { text-align: center; }
  .import-result { margin-top: 20px; .error-list { margin-top: 10px; padding: 10px; background: #fef0f0; border-radius: 4px; .error-item { color: #f56c6c; font-size: 12px; margin: 5px 0; } } }
}
</style>
