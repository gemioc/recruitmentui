<template>
  <div class="image-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon image">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">图片总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon image">
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
          <div class="stat-icon image">
            <el-icon><Top /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ topCount }}</div>
            <div class="stat-label">置顶图片</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon image">
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
            v-model="queryParams.imageName"
            placeholder="搜索图片名称..."
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
            上传图片
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>图片列表</span>
        </div>
      </template>

      <el-table :data="imageList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="imageName" label="图片名称" min-width="180" />
        <el-table-column label="缩略图" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.filePath"
              :src="getImageUrl(row)"
              fit="cover"
              style="width: 60px; height: 40px; border-radius: 4px;"
              :preview-src-list="[getImageUrl(row)]"
              :hide-on-click-modal="true"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="尺寸" width="100">
          <template #default="{ row }">
            {{ row.width && row.height ? `${row.width}x${row.height}` : '-' }}
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
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
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
        @size-change="fetchImageList"
        @current-change="fetchImageList"
      />
    </el-card>

    <!-- 上传弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传图片"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="图片名称" prop="imageName">
          <el-input v-model="formData.imageName" placeholder="请输入图片名称" />
        </el-form-item>
        <el-form-item label="图片文件" prop="file">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :limit="1"
            accept="image/*"
          >
            <template #trigger>
              <el-button type="primary">选择图片</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持JPG、PNG、GIF、WebP格式，大小不超过10MB
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

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" title="图片预览" width="800px">
      <div class="image-preview" v-if="previewImage">
        <el-image
          :src="getImageUrl(previewImage)"
          fit="contain"
          style="width: 100%; max-height: 500px;"
          :preview-src-list="[getImageUrl(previewImage)]"
          :hide-on-click-modal="true"
        />
        <div class="image-info">
          <p><strong>图片名称：</strong>{{ previewImage.imageName }}</p>
          <p><strong>文件大小：</strong>{{ formatFileSize(previewImage.fileSize) }}</p>
          <p v-if="previewImage.width && previewImage.height"><strong>尺寸：</strong>{{ previewImage.width }}x{{ previewImage.height }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 推送弹窗 -->
    <el-dialog v-model="pushDialogVisible" title="推送图片到设备" width="500px">
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
import { Picture, Folder, Top, Calendar, Search, Plus, Refresh } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { getImageList, createImage, deleteImage, setImageTop } from '@/api/image'
import { getDeviceList } from '@/api/device'
import { pushMultiple } from '@/api/push'
import { formatDate, formatFileSize } from '@/utils/format'

// 统计数据
const totalSize = computed(() => imageList.value.reduce((sum, v) => sum + (v.fileSize || 0), 0))
const topCount = computed(() => imageList.value.filter(v => v.isTop === 1).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return imageList.value.filter(v => v.createTime && new Date(v.createTime).toDateString() === today).length
})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  imageName: ''
})

const imageList = ref([])
const total = ref(0)
const loading = ref(false)

const uploadDialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)

const uploadUrl = '/api/images/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

const formData = reactive({
  imageName: '',
  filePath: '',
  fileSize: 0
})

const formRules = {
  imageName: [{ required: true, message: '请输入图片名称', trigger: 'blur' }]
}

const previewDialogVisible = ref(false)
const previewImage = ref(null)

const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const deviceList = ref([])
const pushForm = reactive({
  imageId: null,
  deviceIds: []
})

const getImageUrl = (row) => {
  if (!row || !row.filePath) return ''
  // filePath 是 /images/xxx，需要拼接成 /files/images/xxx
  const path = row.filePath.replace(/^\/images\//, '/files/images/')
  return path
}

const fetchImageList = async () => {
  loading.value = true
  try {
    const res = await getImageList(queryParams)
    imageList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取图片列表失败:', error)
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
  fetchImageList()
}

const handleReset = () => {
  queryParams.imageName = ''
  handleSearch()
}

const handleAdd = () => {
  Object.assign(formData, {
    imageName: '',
    filePath: '',
    fileSize: 0
  })
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  uploadDialogVisible.value = true
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    formData.filePath = response.data.filePath
    formData.fileSize = response.data.fileSize || 0
    if (!formData.imageName) {
      formData.imageName = response.data.imageName
    }
    ElMessage.success('图片上传成功')
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
    ElMessage.warning('请上传图片文件')
    return
  }

  submitLoading.value = true
  try {
    await createImage(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchImageList()
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleTopChange = async (row) => {
  try {
    await setImageTop(row.id, row.isTop)
    ElMessage.success(row.isTop === 1 ? '置顶成功' : '取消置顶成功')
    fetchImageList()
  } catch (error) {
    row.isTop = row.isTop === 1 ? 0 : 1
    console.error('置顶更新失败:', error)
  }
}

const handlePreview = (row) => {
  previewImage.value = row
  previewDialogVisible.value = true
}

const handlePush = async (row) => {
  await fetchDeviceList()
  pushForm.imageId = row.id
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
      contentType: 'image',
      contentIds: [pushForm.imageId],
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
    await ElMessageBox.confirm('确定要删除该图片吗？', '提示', {
      type: 'warning'
    })
    await deleteImage(row.id)
    ElMessage.success('删除成功')
    fetchImageList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  fetchImageList()
})

onActivated(() => {
  fetchImageList()
})
</script>

<style lang="scss" scoped>
.image-container {
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

.image-preview {
  .image-info {
    margin-top: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
    p { margin: 8px 0; }
  }
}
</style>
