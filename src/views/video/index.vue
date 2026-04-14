<template>
  <div class="video-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon video">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon video">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatFileSize(totalSize) }}</div>
            <div class="stat-label">总大小</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon video">
            <el-icon><Top /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ topCount }}</div>
            <div class="stat-label">置顶视频</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon video">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ todayCount }}</div>
            <div class="stat-label">今日上传</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作栏 -->
    <el-card shadow="never" class="search-card">
      <div class="search-bar">
        <div class="search-filters">
          <el-input
            v-model="queryParams.videoName"
            placeholder="搜索视频名称..."
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
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            上传视频
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>视频列表</span>
        </div>
      </template>

      <el-table :data="videoList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="videoName" label="视频名称" min-width="180" />
        <el-table-column prop="fileSize" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="置顶" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isTop"
              :active-value="1"
              :inactive-value="0"
              @change="handleTopChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePlay(row)">播放</el-button>
            <el-button type="primary" link @click="handlePush(row)">推送</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchVideoList"
        @current-change="fetchVideoList"
      />
    </el-card>

    <!-- 上传弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传视频"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="视频名称" prop="videoName">
          <el-input v-model="formData.videoName" placeholder="请输入视频名称" />
        </el-form-item>
        <el-form-item label="视频文件" prop="file">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :limit="1"
            accept="video/*"
          >
            <template #trigger>
              <el-button type="primary">选择视频</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持MP4、AVI、MOV格式，大小不超过500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 播放弹窗 -->
    <el-dialog v-model="playDialogVisible" title="视频播放" width="800px">
      <div class="video-player" v-if="playVideo">
        <video
          :src="videoPlayUrl"
          controls
          class="video-element"
        />
      </div>
    </el-dialog>

    <!-- 推送弹窗 -->
    <el-dialog v-model="pushDialogVisible" title="推送视频到设备" width="500px">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Folder, Top, Calendar, Search, Plus, Refresh } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { getVideoList, createVideo, deleteVideo, setVideoTop } from '@/api/video'
import { getDeviceList } from '@/api/device'
import { pushMultiple } from '@/api/push'
import { formatDate, formatFileSize } from '@/utils/format'

// 统计数据
const totalSize = computed(() => videoList.value.reduce((sum, v) => sum + (v.fileSize || 0), 0))
const topCount = computed(() => videoList.value.filter(v => v.isTop === 1).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return videoList.value.filter(v => v.createTime && new Date(v.createTime).toDateString() === today).length
})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  videoName: ''
})

const videoList = ref([])
const total = ref(0)
const loading = ref(false)

const uploadDialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)

const uploadUrl = '/api/videos/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

const formData = reactive({
  videoName: '',
  filePath: '',
  fileSize: 0
})

const formRules = {
  videoName: [{ required: true, message: '请输入视频名称', trigger: 'blur' }]
}

const playDialogVisible = ref(false)
const playVideo = ref(null)
const videoPlayUrl = computed(() => {
  if (!playVideo.value || !playVideo.value.filePath) return ''
  const path = playVideo.value.filePath.startsWith('/')
    ? playVideo.value.filePath.slice(1)
    : playVideo.value.filePath
  return `/api/files/${path}`
})

const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const deviceList = ref([])
const pushForm = reactive({
  videoId: null,
  deviceIds: []
})

const fetchVideoList = async () => {
  loading.value = true
  try {
    const res = await getVideoList(queryParams)
    videoList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取视频列表失败:', error)
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

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchVideoList()
}

const handleReset = () => {
  queryParams.videoName = ''
  handleSearch()
}

const handleAdd = () => {
  Object.assign(formData, {
    videoName: '',
    filePath: '',
    fileSize: 0
  })
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  uploadDialogVisible.value = true
}

const beforeUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt500M) {
    ElMessage.error('视频大小不能超过500MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    formData.filePath = response.data.filePath
    formData.fileSize = response.data.fileSize || 0
    if (!formData.videoName) {
      formData.videoName = response.data.videoName
    }
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (!formData.filePath) {
    ElMessage.warning('请上传视频文件')
    return
  }

  submitLoading.value = true
  try {
    await createVideo(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchVideoList()
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleTopChange = async (row) => {
  try {
    await setVideoTop(row.id, row.isTop)
    ElMessage.success(row.isTop === 1 ? '置顶成功' : '取消置顶成功')
  } catch (error) {
    row.isTop = row.isTop === 1 ? 0 : 1
    console.error('置顶更新失败:', error)
  }
}

const handlePlay = (row) => {
  playVideo.value = row
  playDialogVisible.value = true
}

const handlePush = async (row) => {
  await fetchDeviceList()
  pushForm.videoId = row.id
  pushForm.deviceIds = []
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
      contentType: 'video',
      contentIds: [pushForm.videoId],
      targetIds: pushForm.deviceIds
    })
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该视频吗？', '提示', {
      type: 'warning'
    })
    await deleteVideo(row.id)
    ElMessage.success('删除成功')
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  fetchVideoList()
})

onActivated(() => {
  fetchVideoList()
})
</script>

<style lang="scss" scoped>
.video-container {
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

.video-player {
  .video-element {
    width: 100%;
    max-height: 450px;
  }
}
</style>
