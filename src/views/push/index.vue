<template>
  <div class="push-container">
    <el-row :gutter="20">
      <!-- 左侧：内容列表 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>内容列表</span>
              <el-radio-group v-model="contentType" size="small">
                <el-radio-button label="poster">海报</el-radio-button>
                <el-radio-button label="video">视频</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <el-table
            :data="contentList"
            v-loading="contentLoading"
            stripe
            highlight-current-row
            @selection-change="handleContentSelection"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="title" label="名称" min-width="150" />
            <el-table-column label="预览" width="100">
              <template #default="{ row }">
                <el-image
                  v-if="contentType === 'poster'"
                  :src="row.thumbnail || row.imageUrl"
                  fit="cover"
                  class="content-thumb"
                />
                <div v-else class="content-thumb video">
                  <el-icon><VideoCamera /></el-icon>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="contentQuery.page"
            v-model:page-size="contentQuery.size"
            :total="contentTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, prev, pager, next"
            small
            @size-change="fetchContentList"
            @current-change="fetchContentList"
          />
        </el-card>
      </el-col>

      <!-- 右侧：设备列表 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>设备列表</span>
              <el-button type="primary" size="small" @click="handleSelectAllDevices">
                全选
              </el-button>
            </div>
          </template>

          <el-table
            :data="deviceList"
            v-loading="deviceLoading"
            stripe
            @selection-change="handleDeviceSelection"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="设备名称" min-width="120" />
            <el-table-column prop="groupName" label="分组" width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="deviceQuery.page"
            v-model:page-size="deviceQuery.size"
            :total="deviceTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, prev, pager, next"
            small
            @size-change="fetchDeviceList"
            @current-change="fetchDeviceList"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 推送配置 -->
    <el-card shadow="never" class="push-config-card">
      <template #header>
        <span>推送配置</span>
      </template>

      <el-form :model="pushConfig" inline>
        <el-form-item label="播放时长">
          <el-input-number v-model="pushConfig.duration" :min="1" :max="3600" />
          <span class="unit">秒</span>
        </el-form-item>
        <el-form-item label="播放顺序">
          <el-select v-model="pushConfig.order" style="width: 120px">
            <el-option label="顺序播放" value="sequence" />
            <el-option label="随机播放" value="random" />
          </el-select>
        </el-form-item>
        <el-form-item label="推送后操作">
          <el-select v-model="pushConfig.afterAction" style="width: 120px">
            <el-option label="保持最后画面" value="keep" />
            <el-option label="返回默认内容" value="default" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="selectedContents.length === 0 || selectedDevices.length === 0"
            :loading="pushing"
            @click="handlePush"
          >
            <el-icon><Promotion /></el-icon>
            立即推送
          </el-button>
        </el-form-item>
      </el-form>

      <div class="selection-info">
        <span>已选择 {{ selectedContents.length }} 个内容，{{ selectedDevices.length }} 台设备</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPosterList } from '@/api/poster'
import { getVideoList } from '@/api/video'
import { getDeviceList } from '@/api/device'
import { pushMultiple } from '@/api/push'

// 内容类型
const contentType = ref('poster')

// 内容列表
const contentList = ref([])
const contentTotal = ref(0)
const contentLoading = ref(false)
const contentQuery = reactive({
  page: 1,
  size: 10,
  status: 1
})

// 设备列表
const deviceList = ref([])
const deviceTotal = ref(0)
const deviceLoading = ref(false)
const deviceQuery = reactive({
  page: 1,
  size: 10
})

// 选中项
const selectedContents = ref([])
const selectedDevices = ref([])

// 推送配置
const pushConfig = reactive({
  duration: 30,
  order: 'sequence',
  afterAction: 'keep'
})

// 推送状态
const pushing = ref(false)

// 获取内容列表
const fetchContentList = async () => {
  contentLoading.value = true
  try {
    const api = contentType.value === 'poster' ? getPosterList : getVideoList
    const res = await api(contentQuery)
    contentList.value = res.data.records || []
    contentTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取内容列表失败:', error)
  } finally {
    contentLoading.value = false
  }
}

// 获取设备列表
const fetchDeviceList = async () => {
  deviceLoading.value = true
  try {
    const res = await getDeviceList(deviceQuery)
    deviceList.value = res.data.records || []
    deviceTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    deviceLoading.value = false
  }
}

// 内容选择变化
const handleContentSelection = (selection) => {
  selectedContents.value = selection
}

// 设备选择变化
const handleDeviceSelection = (selection) => {
  selectedDevices.value = selection
}

// 全选设备
const handleSelectAllDevices = () => {
  // 这里简化处理，实际应该获取所有设备
  selectedDevices.value = [...deviceList.value]
}

// 推送
const handlePush = async () => {
  if (selectedContents.value.length === 0) {
    ElMessage.warning('请选择要推送的内容')
    return
  }
  if (selectedDevices.value.length === 0) {
    ElMessage.warning('请选择要推送的设备')
    return
  }

  pushing.value = true
  try {
    await pushMultiple({
      contentType: contentType.value,
      contentIds: selectedContents.value.map(item => item.id),
      deviceIds: selectedDevices.value.map(item => item.id),
      config: pushConfig
    })
    ElMessage.success('推送成功')
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushing.value = false
  }
}

// 监听内容类型变化
watch(contentType, () => {
  selectedContents.value = []
  fetchContentList()
})

// 初始化
onMounted(() => {
  fetchContentList()
  fetchDeviceList()
})
</script>

<style lang="scss" scoped>
.push-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .content-thumb {
    width: 60px;
    height: 40px;
    border-radius: 4px;

    &.video {
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
    }
  }

  .el-pagination {
    margin-top: 15px;
    justify-content: flex-end;
  }

  .push-config-card {
    margin-top: 20px;

    .unit {
      margin-left: 10px;
      color: #909399;
    }

    .selection-info {
      margin-top: 10px;
      color: #909399;
      font-size: 13px;
    }
  }
}
</style>