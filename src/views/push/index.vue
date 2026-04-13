<template>
  <div class="push-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon poster">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalPosters }}</div>
            <div class="stat-label">海报总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon video">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalVideos }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon device">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalDevices }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon online">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalOnline }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：内容选择 -->
      <el-col :span="10" class="content-panel">
        <el-card shadow="never" class="content-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">选择内容</span>
              <el-radio-group v-model="contentType" size="small">
                <el-radio-button label="poster">海报</el-radio-button>
                <el-radio-button label="video">视频</el-radio-button>
                <el-radio-button label="image">图片</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input
              v-model="contentQuery.keyword"
              :placeholder="contentType === 'poster' ? '搜索海报名称' : '搜索视频名称'"
              clearable
              size="small"
              style="width: 180px"
              @keyup.enter="handleContentSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" size="small" @click="handleContentSearch">搜索</el-button>
          </div>

          <!-- 内容列表 -->
          <div class="content-list" v-loading="contentLoading">
            <el-empty v-if="contentList.length === 0" description="暂无内容" :image-size="60" />

            <div
              v-for="item in contentList"
              :key="item.id"
              class="content-item"
              :class="{ selected: selectedContentIds.includes(item.id) }"
              @click="toggleContentSelection(item)"
            >
              <div class="content-checkbox" @click.stop="() => toggleContentSelection(item)">
                <el-checkbox
                  :model-value="selectedContentIds.includes(item.id)"
                />
              </div>
              <div class="content-thumb">
                <el-image
                  v-if="contentType === 'poster'"
                  :src="getFileUrl(item.filePath)"
                  fit="cover"
                  class="thumb-image"
                >
                  <template #error>
                    <div class="thumb-placeholder"><el-icon><Picture /></el-icon></div>
                  </template>
                </el-image>
                <video
                  v-else
                  :src="getFileUrl(item.filePath)"
                  class="thumb-video"
                />
              </div>
              <div class="content-info">
                <div class="content-name">
                  {{ contentType === 'poster' ? item.posterName : (contentType === 'video' ? item.videoName : item.imageName) }}
                </div>
                <div class="content-meta">
                  <el-tag v-if="contentType === 'poster'" size="small" type="info">海报</el-tag>
                  <el-tag v-else-if="contentType === 'video'" size="small" type="warning">视频</el-tag>
                  <el-tag v-else size="small" type="success">图片</el-tag>
                  <span class="content-time">{{ formatDate(item.createTime) }}</span>
                </div>
              </div>
              <div class="content-actions">
                <el-button type="primary" link size="small" @click.stop="handlePreview(item)">
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </div>

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
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：推送目标 -->
      <el-col :span="14" class="target-panel">
        <el-card shadow="never" class="target-card">
          <template #header>
            <div class="panel-header">
              <div class="panel-title">
                选择推送目标
                <el-tag v-if="pushMode === 'group'" size="small" type="success">
                  {{ selectedGroupIds.length }} 个分组
                </el-tag>
                <el-tag v-else size="small" type="warning">
                  {{ selectedDeviceIds.length }} 台设备
                </el-tag>
              </div>
              <el-radio-group v-model="pushMode" size="small">
                <el-radio-button label="group">按分组</el-radio-button>
                <el-radio-button label="device">按设备</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <!-- 分组模式 -->
          <div v-if="pushMode === 'group'" class="group-mode">
            <div class="group-list">
              <div
                v-for="group in groupList"
                :key="group.id"
                class="group-item"
                :class="{ selected: selectedGroupIds.includes(group.id), 'no-online': group.onlineCount === 0 }"
                @click="toggleGroupSelection(group)"
              >
                <div class="group-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="group-info">
                  <div class="group-name">{{ group.groupName }}</div>
                  <div class="group-meta">
                    <span class="device-count">
                      <el-icon><Monitor /></el-icon>
                      {{ group.deviceCount || 0 }}台
                    </span>
                    <span class="online-count" :class="{ 'has-online': group.onlineCount > 0 }">
                      <span class="online-dot"></span>
                      {{ group.onlineCount || 0 }}在线
                    </span>
                  </div>
                </div>
                <div class="group-checkbox" @click.stop="() => toggleGroupSelection(group)">
                  <el-checkbox
                    :model-value="selectedGroupIds.includes(group.id)"
                  />
                </div>
              </div>

              <el-empty v-if="groupList.length === 0" description="暂无分组" :image-size="60" />
            </div>

            <div class="selection-summary" v-if="selectedGroupIds.length > 0">
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
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select
                v-model="deviceQuery.groupId"
                placeholder="筛选分组"
                clearable
                size="small"
                style="width: 150px"
              >
                <el-option
                  v-for="group in groupList"
                  :key="group.id"
                  :label="group.groupName"
                  :value="group.id"
                />
              </el-select>
              <el-button type="primary" size="small" @click="fetchDeviceList">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>

            <div class="device-grid">
              <div
                v-for="device in deviceList"
                :key="device.id"
                class="device-item"
                :class="{ selected: selectedDeviceIds.includes(device.id), offline: device.onlineStatus !== 1 }"
                @click="toggleDeviceSelection(device)"
              >
                <div class="device-status-bar" :class="device.onlineStatus === 1 ? 'online' : 'offline'"></div>
                <div class="device-content">
                  <div class="device-header">
                    <div class="device-avatar">
                      <el-icon><Monitor /></el-icon>
                    </div>
                    <div class="device-checkbox" @click.stop="() => toggleDeviceSelection(device)">
                      <el-checkbox
                        :model-value="selectedDeviceIds.includes(device.id)"
                      />
                    </div>
                  </div>
                  <div class="device-info">
                    <div class="device-name">{{ device.deviceName || '未命名设备' }}</div>
                    <div class="device-location">
                      <el-icon><Location /></el-icon>
                      {{ device.location || '未设置位置' }}
                    </div>
                  </div>
                </div>
              </div>

              <el-empty v-if="deviceList.length === 0" description="暂无设备" :image-size="60" />
            </div>

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
          <el-switch v-model="pushConfig.loop" size="default" />
        </el-form-item>
        <el-form-item label="音量" v-if="contentType === 'video'">
          <el-slider v-model="pushConfig.volume" :min="0" :max="100" size="default" style="width: 100px" />
          <span class="unit">{{ pushConfig.volume }}%</span>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!canPush || pushCooldown"
            :loading="pushing"
            size="default"
            @click="handlePush"
          >
            <el-icon v-if="!pushCooldown"><Promotion /></el-icon>
            {{ pushCooldown ? '推送中...' : '立即推送' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="800px">
      <div class="preview-content">
        <el-image
          v-if="previewType === 'poster' || previewType === 'image'"
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture,
  VideoCamera,
  Promotion,
  InfoFilled,
  Search,
  View,
  Folder,
  Monitor,
  CircleCheckFilled,
  Location
} from '@element-plus/icons-vue'
import { getPosterList } from '@/api/poster'
import { getVideoList } from '@/api/video'
import { getImageList } from '@/api/image'
import { getDeviceList, getDeviceGroups } from '@/api/device'
import { pushMultiple, getPushGroups } from '@/api/push'
import { getFileUrl as getFileUrlUtil } from '@/utils/file'
import { formatDate } from '@/utils/format'

// 内容类型
const contentType = ref('poster')

// 推送模式
const pushMode = ref('group')

// 内容列表
const contentList = ref([])
const contentTotal = ref(0)
const contentLoading = ref(false)
const contentQuery = reactive({
  pageNum: 1,
  pageSize: 20,
  keyword: ''
})

// 分组列表
const groupList = ref([])

// 设备列表
const deviceList = ref([])
const deviceTotal = ref(0)
const deviceQuery = reactive({
  pageNum: 1,
  pageSize: 20,
  groupId: null,
  deviceName: '',
  onlineStatus: 1
})

// 选中项
const selectedContentIds = ref([])
const selectedDeviceIds = ref([])
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

// 统计数据
const totalPosters = ref(0)
const totalVideos = ref(0)
const totalDevices = computed(() => {
  return groupList.value.reduce((sum, g) => sum + (g.deviceCount || 0), 0)
})
const totalOnline = computed(() => {
  return groupList.value.reduce((sum, g) => sum + (g.onlineCount || 0), 0)
})

// 计算属性
const totalDeviceCount = computed(() => {
  return groupList.value
    .filter(g => selectedGroupIds.value.includes(g.id))
    .reduce((sum, g) => sum + (g.deviceCount || 0), 0)
})

const totalOnlineCount = computed(() => {
  return groupList.value
    .filter(g => selectedGroupIds.value.includes(g.id))
    .reduce((sum, g) => sum + (g.onlineCount || 0), 0)
})

const canPush = computed(() => {
  if (selectedContentIds.value.length === 0) return false
  if (pushMode.value === 'group') {
    return selectedGroupIds.value.length > 0
  } else {
    return selectedDeviceIds.value.length > 0
  }
})

// 获取文件URL
const getFileUrl = (filePath) => {
  if (!filePath) return ''
  return getFileUrlUtil(filePath)
}

// 预览
const handlePreview = (row) => {
  previewTitle.value = contentType.value === 'poster' ? row.posterName : row.videoName
  previewType.value = contentType.value
  previewUrl.value = getFileUrl(row.filePath)
  previewVisible.value = true
}

// 内容搜索
const handleContentSearch = () => {
  contentQuery.pageNum = 1
  fetchContentList()
}

// 获取内容列表
const fetchContentList = async () => {
  contentLoading.value = true
  try {
    let api, params
    if (contentType.value === 'poster') {
      api = getPosterList
      params = { pageNum: contentQuery.pageNum, pageSize: contentQuery.pageSize, posterName: contentQuery.keyword }
    } else if (contentType.value === 'video') {
      api = getVideoList
      params = { pageNum: contentQuery.pageNum, pageSize: contentQuery.pageSize, videoName: contentQuery.keyword }
    } else {
      api = getImageList
      params = { pageNum: contentQuery.pageNum, pageSize: contentQuery.pageSize, imageName: contentQuery.keyword }
    }
    const res = await api(params)
    contentList.value = res.data.records || []
    contentTotal.value = res.data.total || 0

    // 更新统计
    if (contentType.value === 'poster') {
      totalPosters.value = contentTotal.value
    } else if (contentType.value === 'video') {
      totalVideos.value = contentTotal.value
    }
  } catch (error) {
    console.error('获取内容列表失败:', error)
  } finally {
    contentLoading.value = false
  }
}

// 获取分组列表
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
  try {
    const res = await getDeviceList(deviceQuery)
    deviceList.value = res.data.records || []
    deviceTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

// 内容选择
const toggleContentSelection = (item) => {
  const id = item.id
  const index = selectedContentIds.value.indexOf(id)
  if (index > -1) {
    selectedContentIds.value.splice(index, 1)
  } else {
    selectedContentIds.value.push(id)
  }
}

// 分组选择
const toggleGroupSelection = (group) => {
  const id = group.id
  const index = selectedGroupIds.value.indexOf(id)
  if (index > -1) {
    selectedGroupIds.value.splice(index, 1)
  } else {
    selectedGroupIds.value.push(id)
  }
}

// 设备选择
const toggleDeviceSelection = (device) => {
  const id = device.id
  const index = selectedDeviceIds.value.indexOf(id)
  if (index > -1) {
    selectedDeviceIds.value.splice(index, 1)
  } else {
    selectedDeviceIds.value.push(id)
  }
}

// 推送
const handlePush = async () => {
  if (selectedContentIds.value.length === 0) {
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
    if (selectedDeviceIds.value.length === 0) {
      ElMessage.warning('请选择要推送的设备')
      return
    }
    targetIds = selectedDeviceIds.value
  }

  const confirmText = pushMode.value === 'group'
    ? `确定要将 ${selectedContentIds.value.length} 个内容推送到 ${selectedGroupIds.value.length} 个分组（共 ${totalDeviceCount.value} 台设备）吗？`
    : `确定要将 ${selectedContentIds.value.length} 个内容推送到 ${targetIds.length} 台设备吗？`

  try {
    await ElMessageBox.confirm(confirmText, '确认推送', { type: 'info' })
  } catch {
    return
  }

  pushing.value = true
  try {
    await pushMultiple({
      contentType: contentType.value,
      contentIds: selectedContentIds.value,
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
  selectedContentIds.value = []
  contentQuery.keyword = ''
  contentQuery.pageNum = 1
  fetchContentList()
})

onMounted(() => {
  fetchContentList()
  fetchGroupList()
  fetchDeviceList()
})
</script>

<style lang="scss" scoped>
.push-container {
  padding: 0;
}

// 统计卡片行
.stats-row {
  margin-bottom: 16px;

  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    color: #fff;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-right: 14px;
      background: rgba(255, 255, 255, 0.2);

      &.poster { background: rgba(255, 255, 255, 0.2); }
      &.video { background: rgba(255, 255, 255, 0.2); }
      &.device { background: rgba(255, 255, 255, 0.2); }
      &.online { background: rgba(16, 185, 129, 0.5); }
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .stat-label {
        font-size: 12px;
        opacity: 0.85;
        margin-top: 2px;
      }
    }
  }
}

// 主内容区
.main-content {
  margin-bottom: 0;

  .content-panel {
    .content-card {
      border-radius: 12px;
      height: calc(100vh - 240px);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      :deep(.el-card__header) {
        padding: 14px 20px;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }

      :deep(.el-card__body) {
        padding: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    }
  }

  .target-panel {
    .target-card {
      border-radius: 12px;
      height: calc(100vh - 240px);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      :deep(.el-card__header) {
        padding: 14px 20px;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }

      :deep(.el-card__body) {
        padding: 12px 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow-y: auto;
      }
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 搜索栏
.search-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

// 内容列表
.content-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .content-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;
    border: 1px solid transparent;

    &:hover {
      background: #f5f7fa;
    }

    &.selected {
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
      border-color: #667eea40;
    }

    .content-checkbox {
      margin-right: 12px;
    }

    .content-thumb {
      width: 60px;
      height: 45px;
      border-radius: 6px;
      overflow: hidden;
      margin-right: 12px;
      background: #f5f7fa;

      .thumb-image,
      .thumb-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #909399;
      }
    }

    .content-info {
      flex: 1;
      min-width: 0;

      .content-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .content-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #909399;

        .content-time {
          color: #c0c4cc;
        }
      }
    }

    .content-actions {
      margin-left: 8px;
    }
  }
}

// 分组模式
.group-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .group-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .group-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;

    &:hover {
      background: #f5f7fa;
    }

    &.selected {
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
      border: 1px solid #667eea40;
    }

    &.no-online {
      opacity: 0.6;
    }

    .group-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 18px;
      margin-right: 12px;
    }

    .group-info {
      flex: 1;
      min-width: 0;

      .group-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .group-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: #909399;

        .device-count {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .online-count {
          display: flex;
          align-items: center;
          gap: 4px;

          .online-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #909399;
          }

          &.has-online .online-dot {
            background: #10b981;
          }
        }
      }
    }

    .group-checkbox {
      margin-left: 12px;
    }
  }

  .selection-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
    flex-shrink: 0;

    .el-icon {
      color: #409eff;
    }

    b {
      color: #409eff;
    }
  }
}

// 设备模式
.device-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .device-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .device-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    overflow-y: auto;
    min-height: 0;
    align-content: flex-start;
  }

  .device-item {
    background: #fff;
    border-radius: 10px;
    border: 1px solid #ebeef5;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    }

    &.selected {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
    }

    &.offline {
      opacity: 0.75;
    }

    .device-status-bar {
      height: 3px;

      &.online {
        background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
      }

      &.offline {
        background: linear-gradient(90deg, #909399 0%, #dcdfe6 100%);
      }
    }

    .device-content {
      padding: 12px;

      .device-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .device-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
        }
      }

      .device-info {
        .device-name {
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .device-location {
          font-size: 11px;
          color: #c0c4cc;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

// 推送配置卡片
.push-config-card {
  margin-top: 12px;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 12px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 12px 20px;
  }

  .unit {
    margin-left: 10px;
    color: #909399;
    font-size: 13px;
  }
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

// 分页器 - 统一在底部
.content-list {
  :deep(.el-pagination) {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }
}

.group-mode {
  :deep(.el-pagination) {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }
}

.device-mode {
  :deep(.el-pagination) {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }
}
</style>
