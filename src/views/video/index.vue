<template>
  <div class="video-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="视频名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入视频名称"
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
          <span>视频列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            上传视频
          </el-button>
        </div>
      </template>

      <el-table :data="videoList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="视频名称" min-width="150" />
        <el-table-column prop="thumbnail" label="封面" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.thumbnail"
              :src="row.thumbnail"
              fit="cover"
              class="video-thumb"
            />
            <div v-else class="video-thumb placeholder">
              <el-icon :size="24"><VideoCamera /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
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
        <el-table-column prop="createTime" label="上传时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePlay(row)">播放</el-button>
            <el-button type="primary" link @click="handlePush(row)">推送</el-button>
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
        <el-form-item label="视频名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入视频名称" />
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
            :auto-upload="false"
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
        <el-form-item label="视频封面">
          <el-upload
            class="cover-uploader"
            :action="coverUploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            accept="image/*"
          >
            <img v-if="formData.thumbnail" :src="formData.thumbnail" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入视频描述"
          />
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
          ref="videoRef"
          :src="playVideo.videoUrl"
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
              :label="device.name"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from '@/utils/auth'
import { getVideoList, createVideo, deleteVideo, updateVideo } from '@/api/video'
import { getDeviceList } from '@/api/device'
import { pushVideo } from '@/api/push'

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  status: null
})

// 列表数据
const videoList = ref([])
const total = ref(0)
const loading = ref(false)

// 上传
const uploadDialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)

const uploadUrl = '/api/video/upload'
const coverUploadUrl = '/api/upload/image'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

const formData = reactive({
  title: '',
  videoUrl: '',
  thumbnail: '',
  duration: 0,
  fileSize: 0,
  description: ''
})

const formRules = {
  title: [{ required: true, message: '请输入视频名称', trigger: 'blur' }]
}

// 播放
const playDialogVisible = ref(false)
const playVideo = ref(null)
const videoRef = ref(null)

// 推送
const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const deviceList = ref([])
const pushForm = reactive({
  videoId: null,
  deviceIds: []
})

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

// 获取视频列表
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
  fetchVideoList()
}

// 重置
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.status = null
  handleSearch()
}

// 新增
const handleAdd = () => {
  Object.assign(formData, {
    title: '',
    videoUrl: '',
    thumbnail: '',
    duration: 0,
    fileSize: 0,
    description: ''
  })
  uploadDialogVisible.value = true
}

// 上传前检查
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

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    formData.videoUrl = response.data.url
    formData.duration = response.data.duration || 0
    formData.fileSize = response.data.size || 0
    if (!formData.thumbnail && response.data.thumbnail) {
      formData.thumbnail = response.data.thumbnail
    }
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

// 封面上传成功
const handleCoverSuccess = (response) => {
  if (response.code === 200) {
    formData.thumbnail = response.data.url
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 提交
const handleSubmit = async () => {
  await formRef.value.validate()
  if (!formData.videoUrl) {
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

// 状态切换
const handleStatusChange = async (row) => {
  try {
    await updateVideo({ id: row.id, status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    console.error('状态更新失败:', error)
  }
}

// 播放
const handlePlay = (row) => {
  playVideo.value = row
  playDialogVisible.value = true
}

// 推送
const handlePush = async (row) => {
  await fetchDeviceList()
  pushForm.videoId = row.id
  pushForm.deviceIds = []
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
    await pushVideo({
      contentId: pushForm.videoId,
      deviceIds: pushForm.deviceIds
    })
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushLoading.value = false
  }
}

// 删除
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

// 初始化
onMounted(() => {
  fetchVideoList()
})
</script>

<style lang="scss" scoped>
.video-container {
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

    .video-thumb {
      width: 80px;
      height: 50px;
      border-radius: 4px;

      &.placeholder {
        background: #f0f2f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #909399;
      }
    }

    .el-pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}

.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }

  .cover-image {
    width: 148px;
    height: 100px;
    display: block;
    object-fit: cover;
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 148px;
    height: 100px;
    text-align: center;
    line-height: 100px;
  }
}

.video-player {
  .video-element {
    width: 100%;
    max-height: 450px;
  }
}
</style>