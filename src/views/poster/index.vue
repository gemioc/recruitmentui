<template>
  <div class="poster-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="海报名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入海报名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>海报列表</span>
          <el-button type="primary" @click="router.push('/poster/generate')">
            <el-icon><Plus /></el-icon>
            生成海报
          </el-button>
        </div>
      </template>

      <el-table :data="posterList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="海报名称" min-width="150" />
        <el-table-column prop="thumbnail" label="预览图" width="120">
          <template #default="{ row }">
            <el-image
              :src="row.thumbnail"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              class="poster-thumb"
            />
          </template>
        </el-table-column>
        <el-table-column prop="jobTitle" label="关联职位" min-width="120" />
        <el-table-column prop="templateName" label="使用模板" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
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
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchPosterList"
        @current-change="fetchPosterList"
      />
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="海报预览" width="800px">
      <div class="preview-container" v-if="previewData">
        <img :src="previewData.imageUrl" alt="海报预览" class="preview-image" />
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
              :label="device.name"
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPosterList, getPosterDetail, deletePoster, updatePoster } from '@/api/poster'
import { getDeviceList } from '@/api/device'
import { pushPoster } from '@/api/push'

const router = useRouter()

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  status: null
})

// 列表数据
const posterList = ref([])
const total = ref(0)
const loading = ref(false)

// 预览
const previewVisible = ref(false)
const previewData = ref(null)

// 推送
const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const deviceList = ref([])
const pushForm = reactive({
  posterId: null,
  deviceIds: [],
  duration: 30
})

// 获取海报列表
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

// 获取设备列表
const fetchDeviceList = async () => {
  try {
    const res = await getDeviceList({ page: 1, size: 100, status: 1 })
    deviceList.value = res.data.records || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchPosterList()
}

// 重置
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.status = null
  handleSearch()
}

// 状态切换
const handleStatusChange = async (row) => {
  try {
    await updatePoster({ id: row.id, status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    console.error('状态更新失败:', error)
  }
}

// 预览
const handlePreview = async (row) => {
  try {
    const res = await getPosterDetail(row.id)
    previewData.value = res.data
    previewVisible.value = true
  } catch (error) {
    console.error('获取海报详情失败:', error)
  }
}

// 推送
const handlePush = async (row) => {
  await fetchDeviceList()
  pushForm.posterId = row.id
  pushForm.deviceIds = []
  pushForm.duration = 30
  pushDialogVisible.value = true
}

// 确认推送
const confirmPush = async () => {
  if (pushForm.deviceIds.length === 0) {
    ElMessage.warning('请选择要推送的设备')
    return
  }
  pushLoading.value = true
  try {
    await pushPoster({
      contentId: pushForm.posterId,
      deviceIds: pushForm.deviceIds,
      duration: pushForm.duration
    })
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushLoading.value = false
  }
}

// 下载
const handleDownload = (row) => {
  const link = document.createElement('a')
  link.href = row.imageUrl
  link.download = `${row.title}.png`
  link.click()
  ElMessage.success('开始下载')
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该海报吗？', '提示', {
      type: 'warning'
    })
    await deletePoster(row.id)
    ElMessage.success('删除成功')
    fetchPosterList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 初始化
onMounted(() => {
  fetchPosterList()
})
</script>

<style lang="scss" scoped>
.poster-container {
  .search-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding-bottom: 0;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .poster-thumb {
      width: 80px;
      height: 60px;
      cursor: pointer;
    }

    .el-pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}

.preview-container {
  text-align: center;

  .preview-image {
    max-width: 100%;
    max-height: 600px;
  }
}
</style>