<template>
  <div class="push-container">
    <el-row :gutter="20">
      <!-- 左侧：内容列表 -->
      <el-col :span="10">
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
            <el-table-column label="名称" min-width="120">
              <template #default="{ row }">
                {{ row.posterName || row.videoName }}
              </template>
            </el-table-column>
            <el-table-column label="预览" width="80">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handlePreview(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="contentQuery.pageNum"
            v-model:page-size="contentQuery.pageSize"
            :total="contentTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, prev, pager, next"
            small
            @size-change="fetchContentList"
            @current-change="fetchContentList"
          />
        </el-card>
      </el-col>

      <!-- 右侧：目标选择 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>推送目标</span>
              <el-radio-group v-model="pushMode" size="small">
                <el-radio-button label="group">按分组</el-radio-button>
                <el-radio-button label="device">按设备</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <!-- 分组模式 -->
          <div v-if="pushMode === 'group'" class="group-mode">
            <div class="group-list">
              <el-checkbox-group v-model="selectedGroupIds">
                <div
                  v-for="group in groupList"
                  :key="group.id"
                  class="group-item"
                  :class="{ selected: selectedGroupIds.includes(group.id) }"
                >
                  <el-checkbox :label="group.id">
                    <div class="group-info">
                      <span class="group-name">{{ group.groupName }}</span>
                      <span class="group-count">
                        <el-tag type="success" size="small">{{ group.onlineCount }}</el-tag>
                        <el-tag type="info" size="small">{{ group.deviceCount }}台</el-tag>
                      </span>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
            <div class="group-summary">
              已选择 <b>{{ selectedGroupIds.length }}</b> 个分组，
              共 <b>{{ totalDeviceCount }}</b> 台设备
              （<el-tag type="success" size="small">{{ totalOnlineCount }} 在线</el-tag>）
            </div>
          </div>

          <!-- 设备模式 -->
          <div v-else class="device-mode">
            <div class="device-filter">
              <el-select
                v-model="deviceQuery.groupId"
                placeholder="按分组筛选"
                clearable
                size="small"
                style="width: 150px"
                @change="fetchDeviceList"
              >
                <el-option
                  v-for="group in groupList"
                  :key="group.id"
                  :label="group.groupName"
                  :value="group.id"
                />
              </el-select>
              <el-button type="primary" size="small" @click="handleSelectAllDevices">
                全选当前页
              </el-button>
            </div>

            <el-table
              ref="deviceTableRef"
              :data="deviceList"
              v-loading="deviceLoading"
              stripe
              max-height="400"
              @selection-change="handleDeviceSelection"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="deviceName" label="设备名称" min-width="120" />
              <el-table-column prop="groupName" label="分组" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.groupName" size="small" type="info">{{ row.groupName }}</el-tag>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.onlineStatus === 1 ? 'success' : 'danger'" size="small">
                    {{ row.onlineStatus === 1 ? '在线' : '离线' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="deviceQuery.pageNum"
              v-model:page-size="deviceQuery.pageSize"
              :total="deviceTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, prev, pager, next"
              small
              @size-change="fetchDeviceList"
              @current-change="fetchDeviceList"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 推送配置 -->
    <el-card shadow="never" class="push-config-card">
      <template #header>
        <span>推送配置</span>
      </template>

      <el-form :model="pushConfig" inline>
        <el-form-item label="播放时长" v-if="contentType === 'poster'">
          <el-input-number v-model="pushConfig.duration" :min="1" :max="3600" />
          <span class="unit">秒</span>
        </el-form-item>
        <el-form-item label="循环播放">
          <el-switch v-model="pushConfig.loop" />
        </el-form-item>
        <el-form-item label="音量" v-if="contentType === 'video'">
          <el-slider v-model="pushConfig.volume" :min="0" :max="100" style="width: 100px" />
          <span class="unit">{{ pushConfig.volume }}%</span>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!canPush"
            :loading="pushing"
            @click="handlePush"
          >
            <el-icon><Promotion /></el-icon>
            立即推送
          </el-button>
        </el-form-item>
      </el-form>

      <div class="selection-info">
        <el-tag type="info" size="small">
          已选择 {{ selectedContents.length }} 个内容
        </el-tag>
        <el-tag :type="pushMode === 'group' ? 'success' : 'warning'" size="small">
          {{ pushMode === 'group' ? `分组模式: ${selectedGroupIds.length} 个分组` : `设备模式: ${selectedDevices.length} 台设备` }}
        </el-tag>
      </div>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="800px">
      <div class="preview-content">
        <el-image
          v-if="previewType === 'poster'"
          :src="previewUrl"
          fit="contain"
          style="max-width: 100%; max-height: 500px;"
        />
        <video
          v-else
          :src="previewUrl"
          controls
          style="max-width: 100%; max-height: 500px;"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPosterList } from '@/api/poster'
import { getVideoList } from '@/api/video'
import { getDeviceList, getDeviceGroups } from '@/api/device'
import { pushMultiple, getPushGroups } from '@/api/push'

// 内容类型
const contentType = ref('poster')

// 推送模式：group-按分组 device-按设备
const pushMode = ref('group')

// 内容列表
const contentList = ref([])
const contentTotal = ref(0)
const contentLoading = ref(false)
const contentQuery = reactive({
  pageNum: 1,
  pageSize: 10
})

// 分组列表
const groupList = ref([])

// 设备列表
const deviceList = ref([])
const deviceTotal = ref(0)
const deviceLoading = ref(false)
const deviceQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  groupId: null
})

// 选中项
const selectedContents = ref([])
const selectedDevices = ref([])
const selectedGroupIds = ref([])

// 推送配置
const pushConfig = reactive({
  duration: 10,
  loop: true,
  volume: 80
})

// 推送状态
const pushing = ref(false)

// 预览
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('poster')

// 表格ref
const deviceTableRef = ref(null)

// 计算属性：选中分组的设备统计
const totalDeviceCount = computed(() => {
  if (pushMode.value !== 'group') return 0
  return groupList.value
    .filter(g => selectedGroupIds.value.includes(g.id))
    .reduce((sum, g) => sum + (g.deviceCount || 0), 0)
})

const totalOnlineCount = computed(() => {
  if (pushMode.value !== 'group') return 0
  return groupList.value
    .filter(g => selectedGroupIds.value.includes(g.id))
    .reduce((sum, g) => sum + (g.onlineCount || 0), 0)
})

// 是否可以推送
const canPush = computed(() => {
  if (selectedContents.value.length === 0) return false
  if (pushMode.value === 'group') {
    return selectedGroupIds.value.length > 0
  } else {
    return selectedDevices.value.length > 0
  }
})

// 获取文件URL
const getFileUrl = (filePath) => {
  if (!filePath) return ''
  const path = filePath.startsWith('/') ? filePath.slice(1) : filePath
  return `/api/files/${path}`
}

// 预览
const handlePreview = (row) => {
  previewTitle.value = row.posterName || row.videoName
  if (contentType.value === 'poster') {
    previewType.value = 'poster'
    previewUrl.value = getFileUrl(row.filePath)
  } else {
    previewType.value = 'video'
    previewUrl.value = getFileUrl(row.filePath)
  }
  previewVisible.value = true
}

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

// 获取分组列表（带设备统计）
const fetchGroupList = async () => {
  try {
    const res = await getPushGroups()
    groupList.value = res.data || []
  } catch (error) {
    console.error('获取分组列表失败:', error)
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
  if (deviceTableRef.value) {
    deviceTableRef.value.toggleAllSelection()
  }
}

// 推送
const handlePush = async () => {
  if (selectedContents.value.length === 0) {
    ElMessage.warning('请选择要推送的内容')
    return
  }

  let targetIds = []
  let groupId = null

  if (pushMode.value === 'group') {
    if (selectedGroupIds.value.length === 0) {
      ElMessage.warning('请选择要推送的分组')
      return
    }
    // 分组模式：取第一个分组ID（或合并多个分组的设备）
    if (selectedGroupIds.value.length === 1) {
      groupId = selectedGroupIds.value[0]
    } else {
      // 多个分组，获取所有分组下的设备
      for (const gId of selectedGroupIds.value) {
        const devices = deviceList.value.filter(d => d.groupId === gId)
        targetIds.push(...devices.map(d => d.id))
      }
      // 去重
      targetIds = [...new Set(targetIds)]
    }
  } else {
    if (selectedDevices.value.length === 0) {
      ElMessage.warning('请选择要推送的设备')
      return
    }
    targetIds = selectedDevices.value.map(item => item.id)
  }

  const confirmText = pushMode.value === 'group'
    ? `确定要将内容推送到 ${selectedGroupIds.value.length} 个分组（共 ${totalDeviceCount.value} 台设备）吗？`
    : `确定要将内容推送到 ${targetIds.length} 台设备吗？`

  try {
    await ElMessageBox.confirm(confirmText, '确认推送', { type: 'info' })
  } catch {
    return
  }

  pushing.value = true
  try {
    await pushMultiple({
      contentType: contentType.value,
      contentIds: selectedContents.value.map(item => item.id),
      targetIds: targetIds.length > 0 ? targetIds : undefined,
      groupId: groupId,
      playRule: pushConfig
    })
    ElMessage.success('推送成功')
    // 清空选择
    selectedContents.value = []
    selectedDevices.value = []
    selectedGroupIds.value = []
  } catch (error) {
    console.error('推送失败:', error)
    ElMessage.error('推送失败')
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
  fetchGroupList()
  fetchDeviceList()
})

// 页面激活时刷新数据
onActivated(() => {
  fetchContentList()
})
</script>

<style lang="scss" scoped>
.push-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-pagination {
    margin-top: 15px;
    justify-content: flex-end;
  }

  // 分组模式样式
  .group-mode {
    .group-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .group-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        background: #f5f7fa;
      }

      &.selected {
        border-color: #409eff;
        background: #ecf5ff;
      }

      :deep(.el-checkbox) {
        width: 100%;

        .el-checkbox__label {
          flex: 1;
        }
      }

      .group-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .group-name {
          font-weight: 500;
        }

        .group-count {
          display: flex;
          gap: 8px;
        }
      }
    }

    .group-summary {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 14px;
      color: #606266;

      b {
        color: #409eff;
      }
    }
  }

  // 设备模式样式
  .device-mode {
    .device-filter {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
  }

  .push-config-card {
    margin-top: 20px;

    .unit {
      margin-left: 10px;
      color: #909399;
    }

    .selection-info {
      margin-top: 10px;
      display: flex;
      gap: 12px;
    }
  }

  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .text-muted {
    color: #c0c4cc;
  }
}
</style>