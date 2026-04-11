<template>
  <div class="poster-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon poster">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">海报总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon poster">
            <el-icon><Briefcase /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ jobCount }}</div>
            <div class="stat-label">关联职位</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon poster">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ templateCount }}</div>
            <div class="stat-label">使用模板</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon poster">
            <el-icon><Clock /></el-icon>
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
            v-model="queryParams.posterName"
            placeholder="搜索海报名称..."
            :prefix-icon="Search"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div class="search-actions">
          <el-button type="primary" @click="router.push('/poster/generate')">
            <el-icon><Plus /></el-icon>
            生成海报
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 海报列表 -->
    <el-card shadow="never" class="table-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>海报列表</span>
        </div>
      </template>

      <el-table :data="posterList" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="posterName" label="海报名称" min-width="150" />
        <el-table-column label="预览图" width="120">
          <template #default="{ row }">
            <el-image
              :src="getPosterUrl(row.filePath)"
              :preview-src-list="[getPosterUrl(row.filePath)]"
              fit="cover"
              class="poster-thumb"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="jobName" label="关联职位" min-width="120" />
        <el-table-column prop="templateName" label="使用模板" width="120" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
            <el-button type="primary" link @click="handlePush(row)">推送</el-button>
            <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchPosterList"
        @current-change="fetchPosterList"
      />
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="海报预览" width="800px">
      <div class="preview-container" v-if="previewData">
        <img :src="getPosterUrl(previewData.filePath)" alt="海报预览" class="preview-image" />
      </div>
    </el-dialog>

    <!-- 推送弹窗 -->
    <el-dialog v-model="pushDialogVisible" title="推送海报到设备" width="500px">
      <el-form :model="pushForm" label-width="80px">
        <el-form-item label="选择设备">
          <el-select
            v-model="pushForm.deviceIds"
            multiple
            placeholder="请选择要推送的设备"
            style="width: 100%"
          >
            <el-option
              v-for="device in deviceList"
              :key="device.id"
              :label="device.deviceName"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="播放时长">
          <el-input-number v-model="pushForm.duration" :min="1" :max="3600" />
          <span style="margin-left: 10px">秒</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPush" :loading="pushLoading">推送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Search, Plus, Refresh, Briefcase, Document, Clock } from '@element-plus/icons-vue'
import { getPosterList, getPosterDetail, deletePoster } from '@/api/poster'
import { getDeviceList } from '@/api/device'
import { pushMultiple } from '@/api/push'
import { formatDate } from '@/utils/format'
import { getFileUrl } from '@/utils/file'

const router = useRouter()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 24,
  posterName: ''
})

const posterList = ref([])
const total = ref(0)
const loading = ref(false)

const previewVisible = ref(false)
const previewData = ref(null)

const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const deviceList = ref([])
const pushForm = reactive({
  posterId: null,
  deviceIds: [],
  duration: 30
})

const jobCount = computed(() => {
  const jobs = new Set(posterList.value.filter(p => p.jobName).map(p => p.jobName))
  return jobs.size
})

const templateCount = computed(() => {
  const templates = new Set(posterList.value.filter(p => p.templateName).map(p => p.templateName))
  return templates.size || 1
})

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return posterList.value.filter(p => p.createTime && new Date(p.createTime).toDateString() === today).length
})

const getPosterUrl = (filePath) => {
  return getFileUrl(filePath)
}

const fetchPosterList = async () => {
  loading.value = true
  try {
    const res = await getPosterList(queryParams)
    posterList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取海报列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchDeviceList = async () => {
  try {
    const res = await getDeviceList({ pageNum: 1, pageSize: 100 })
    deviceList.value = res.data.records || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

const handleSearch = () => { queryParams.pageNum = 1; fetchPosterList() }
const handleReset = () => { queryParams.posterName = ''; handleSearch() }

const handlePreview = async (row) => {
  try {
    const res = await getPosterDetail(row.id)
    previewData.value = res.data
    previewVisible.value = true
  } catch (error) {
    console.error('获取海报详情失败:', error)
  }
}

const handlePush = async (row) => {
  await fetchDeviceList()
  pushForm.posterId = row.id
  pushForm.deviceIds = []
  pushForm.duration = 30
  pushDialogVisible.value = true
}

const confirmPush = async () => {
  if (pushForm.deviceIds.length === 0) {
    ElMessage.warning('请选择要推送的设备')
    return
  }
  pushLoading.value = true
  try {
    await pushMultiple({
      contentType: 'poster',
      contentIds: [pushForm.posterId],
      targetIds: pushForm.deviceIds,
      playRule: { duration: pushForm.duration }
    })
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushLoading.value = false
  }
}

const handleDownload = (row) => {
  if (!row.filePath) {
    ElMessage.warning('海报文件不存在')
    return
  }
  const url = getPosterUrl(row.filePath)
  const link = document.createElement('a')
  link.href = url
  link.download = `${row.posterName || 'poster'}.png`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('开始下载')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该海报吗？', '提示', { type: 'warning' })
    await deletePoster(row.id)
    ElMessage.success('删除成功')
    fetchPosterList()
  } catch (error) {
    if (error !== 'cancel') console.error('删除失败:', error)
  }
}

onMounted(() => { fetchPosterList() })
onActivated(() => fetchPosterList())
</script>

<style lang="scss" scoped>
.poster-container {
  .stats-row {
    margin-bottom: 20px;
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      color: #fff;
      .stat-icon {
        width: 56px; height: 56px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; margin-right: 16px;
        background: rgba(255,255,255,0.2);
      }
      .stat-info {
        .stat-value { font-size: 28px; font-weight: 700; }
        .stat-label { font-size: 13px; opacity: 0.85; margin-top: 4px; }
      }
    }
    .stat-card:nth-child(2) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-card:nth-child(3) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-card:nth-child(4) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  }
  .search-card {
    border-radius: 12px; margin-bottom: 20px;
    .search-bar {
      display: flex; justify-content: space-between; align-items: center;
      .search-filters { display: flex; gap: 12px; align-items: center; }
      .search-actions { display: flex; gap: 10px; }
    }
  }
  .table-card {
    border-radius: 12px;
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
    }
    .poster-thumb {
      width: 80px; height: 60px; cursor: pointer;
      .image-placeholder {
        width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
        background: #f5f7fa; color: #909399;
      }
    }
    .el-pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
  }
}
.preview-container {
  text-align: center;
  .preview-image { max-width: 100%; max-height: 600px; }
}
</style>
