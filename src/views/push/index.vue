<template>
  <div class="push-container">
    <el-row :gutter="20" align="stretch">
      <!-- 左侧：内容列表 -->
      <el-col :span="10" class="equal-height-col">
        <el-card shadow="never" class="equal-height-card">
          <template #header>
            <div class="card-header">
              <span>内容列表</span>
              <el-radio-group v-model="contentType" size="small">
                <el-radio-button label="poster">海报</el-radio-button>
                <el-radio-button label="video">视频</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input
              v-if="contentType === 'poster'"
              v-model="contentQuery.posterName"
              placeholder="搜索海报名称"
              clearable
              size="small"
              style="width: 200px"
              @keyup.enter="handleContentSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-input
              v-else
              v-model="contentQuery.videoName"
              placeholder="搜索视频名称"
              clearable
              size="small"
              style="width: 200px"
              @keyup.enter="handleContentSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" size="small" @click="handleContentSearch">搜索</el-button>
          </div>

          <el-table
            :data="contentList"
            v-loading="contentLoading"
            stripe
            highlight-current-row
            @selection-change="handleContentSelection"
            class="content-table"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="名称" min-width="120">
              <template #default="{ row }">
                <div class="content-name-cell">
                  <el-icon v-if="contentType === 'poster'" class="content-icon"><Picture /></el-icon>
                  <el-icon v-else class="content-icon"><VideoCamera /></el-icon>
                  <span>{{ row.posterName || row.videoName }}</span>
                </div>
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
      <el-col :span="14" class="equal-height-col">
        <el-card shadow="never" class="equal-height-card">
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
                  v-for="group in onlineGroupList"
                  :key="group.id"
                  class="group-item"
                  :class="{ selected: selectedGroupIds.includes(group.id) }"
                >
                  <el-checkbox :label="group.id">
                    <div class="group-info">
                      <span class="group-name">{{ group.groupName }}</span>
                      <span class="group-count">
                        <el-tag type="success" size="small">{{ group.onlineCount }} 在线</el-tag>
                        <el-tag type="info" size="small">{{ group.deviceCount }} 台</el-tag>
                      </span>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
            <div class="group-summary" v-if="selectedGroupIds.length > 0">
              <el-icon><InfoFilled /></el-icon>
              已选择 <b>{{ selectedGroupIds.length }}</b> 个分组，共
              <b>{{ totalDeviceCount }}</b> 台设备
              （<el-tag type="success" size="small">{{ totalOnlineCount }} 台在线</el-tag>）
            </div>
          </div>

          <!-- 设备模式 -->
          <div v-else class="device-mode">
            <div class="device-toolbar">
              <el-input
                v-model="deviceQuery.deviceName"
                placeholder="搜索设备名称"
                clearable
                size="small"
                style="width: 150px"
                @keyup.enter="handleDeviceSearch"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select
                v-model="deviceQuery.groupId"
                placeholder="筛选分组"
                clearable
                size="small"
                style="width: 150px"
                @change="handleDeviceSearch"
              >
                <el-option
                  v-for="group in groupList"
                  :key="group.id"
                  :label="group.groupName"
                  :value="group.id"
                />
              </el-select>
              <el-button type="primary" size="small" @click="handleDeviceSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>

            <el-table
              ref="deviceTableRef"
              :data="deviceList"
              v-loading="deviceLoading"
              stripe
              max-height="300"
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
              <el-table-column prop="location" label="安装位置" min-width="120" />
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
          <el-tooltip content="海报轮播间隔，实际切换时间 ≈ 设置时长 + 图片加载时间（受网络影响）" placement="top">
            <el-input-number v-model="pushConfig.duration" :min="1" :max="3600" size="default" />
          </el-tooltip>
          <span class="unit">秒</span>
        </el-form-item>
        <el-form-item label="循环播放">
          <el-switch v-model="pushConfig.loop" size="default" />        </el-form-item>
        <el-form-item label="音量" v-if="contentType === 'video'">
          <el-slider v-model="pushConfig.volume" :min="0" :max="100" size="default" style="width: 100px" />
          <span class="unit">{{ pushConfig.volume }}%</span>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!canPush || pushCooldown"
            :loading="pushing"
            @click="handlePush"
          >
            <el-icon v-if="!pushCooldown"><Promotion /></el-icon>
            {{ pushCooldown ? '推送中...' : '立即推送' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="selection-info">
        <el-tag type="info" size="small">
          已选择 {{ selectedContents.length }} 个{{ contentType === 'poster' ? '海报' : '视频' }}
        </el-tag>
        <el-tag :type="pushMode === 'group' ? 'success' : 'warning'" size="small">
          <template v-if="pushMode === 'group'">
            {{ selectedGroupIds.length }} 个分组（共 {{ totalDeviceCount }} 台设备）
          </template>
          <template v-else>
            {{ selectedDevices.length }} 台设备
          </template>
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
import {
  Picture,
  VideoCamera,
  Promotion,
  InfoFilled,
  Search
} from '@element-plus/icons-vue'
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
  pageSize: 10,
  posterName: '',
  videoName: ''
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
  groupId: null,
  deviceName: '',
  onlineStatus: 1 // 只显示在线设备
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
const pushCooldown = ref(false)

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

// 只显示有在线设备的分组
const onlineGroupList = computed(() => {
  return groupList.value.filter(g => g.onlineCount > 0)
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

// 内容搜索
const handleContentSearch = () => {
  contentQuery.pageNum = 1
  fetchContentList()
}

// 设备搜索
const handleDeviceSearch = () => {
  deviceQuery.pageNum = 1
  fetchDeviceList()
}

// 获取内容列表
const fetchContentList = async () => {
  contentLoading.value = true
  try {
    const api = contentType.value === 'poster' ? getPosterList : getVideoList
    const params = contentType.value === 'poster'
      ? { pageNum: contentQuery.pageNum, pageSize: contentQuery.pageSize, posterName: contentQuery.posterName }
      : { pageNum: contentQuery.pageNum, pageSize: contentQuery.pageSize, videoName: contentQuery.videoName }
    const res = await api(params)
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
    if (selectedGroupIds.value.length === 1) {
      groupId = selectedGroupIds.value[0]
    } else {
      for (const gId of selectedGroupIds.value) {
        const devices = deviceList.value.filter(d => d.groupId === gId)
        targetIds.push(...devices.map(d => d.id))
      }
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
    pushCooldown.value = true
    setTimeout(() => {
      pushCooldown.value = false
    }, 2000)
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
  contentQuery.posterName = ''
  contentQuery.videoName = ''
  contentQuery.pageNum = 1
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
  // 等高布局
  :deep(.el-row) {
    display: flex;
    flex-wrap: wrap;
  }

  .equal-height-col {
    display: flex;
    flex-direction: column;
  }

  .equal-height-card {
    flex: 1;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 搜索栏
  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .el-pagination {
    margin-top: 15px;
    justify-content: flex-end;
  }

  // 内容名称单元格
  .content-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .content-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  // 分组模式样式
  .group-mode {
    flex: 1;
    display: flex;
    flex-direction: column;

    .group-list {
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
    }

    .group-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.3s;
      cursor: pointer;

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
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 14px;
      color: #606266;

      .el-icon {
        color: #409eff;
      }

      b {
        color: #409eff;
      }
    }
  }

  // 设备模式样式
  .device-mode {
    flex: 1;
    display: flex;
    flex-direction: column;

    .device-toolbar {
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
      font-size: 13px;
    }

    .selection-info {
      margin-top: 15px;
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
