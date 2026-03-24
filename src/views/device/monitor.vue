<template>
  <div class="device-monitor-container">
    <!-- 顶部操作栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="设备分组">
          <el-select v-model="filterGroupId" placeholder="全部" clearable style="width: 160px" @change="handleFilter">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select v-model="filterStatus" placeholder="全部" clearable style="width: 120px" @change="handleFilter">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-item total">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item online">
          <div class="stat-value">{{ statistics.online }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item offline">
          <div class="stat-value">{{ statistics.offline }}</div>
          <div class="stat-label">离线设备</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item playing">
          <div class="stat-value">{{ statistics.playing }}</div>
          <div class="stat-label">播放中</div>
        </div>
      </el-col>
    </el-row>

    <!-- 设备监控网格 -->
    <div class="monitor-grid" v-loading="loading">
      <div
        v-for="device in deviceList"
        :key="device.id"
        class="monitor-card"
        :class="{ offline: device.onlineStatus === 0 }"
        @click="handleDeviceClick(device)"
      >
        <div class="card-header">
          <div class="device-info">
            <el-tag :type="device.onlineStatus === 1 ? 'success' : 'danger'" size="small">
              {{ device.onlineStatus === 1 ? '在线' : '离线' }}
            </el-tag>
            <span class="device-name">{{ device.deviceName }}</span>
          </div>
          <el-dropdown @command="(cmd) => handleCommand(cmd, device)" trigger="click">
            <el-button type="primary" link>
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh">刷新状态</el-dropdown-item>
                <el-dropdown-item command="screenshot">截屏</el-dropdown-item>
                <el-dropdown-item command="restart">重启设备</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="card-content">
          <!-- 设备屏幕预览 -->
          <div class="screen-preview">
            <img v-if="device.screenshot" :src="device.screenshot" alt="屏幕预览" />
            <div v-else class="no-preview">
              <el-icon :size="40"><Monitor /></el-icon>
              <span>暂无预览</span>
            </div>
          </div>

          <!-- 当前播放 -->
          <div class="current-content">
            <el-icon><VideoPlay /></el-icon>
            <span>{{ device.currentContent || '无播放内容' }}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-item">
            <el-icon><Location /></el-icon>
            <span>{{ device.location || '未知位置' }}</span>
          </div>
          <div class="footer-item">
            <el-icon><Clock /></el-icon>
            <span>{{ device.lastHeartbeat || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="设备详情" size="500px">
      <div v-if="currentDevice" class="device-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="设备编号">
              {{ currentDevice.deviceCode }}
            </el-descriptions-item>
            <el-descriptions-item label="设备名称">
              {{ currentDevice.deviceName }}
            </el-descriptions-item>
            <el-descriptions-item label="所属分组">
              {{ currentDevice.groupName || '未分组' }}
            </el-descriptions-item>
            <el-descriptions-item label="安装位置">
              {{ currentDevice.location || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="分辨率">
              {{ currentDevice.resolution }}
            </el-descriptions-item>
            <el-descriptions-item label="在线状态">
              <el-tag :type="currentDevice.onlineStatus === 1 ? 'success' : 'danger'" size="small">
                {{ currentDevice.onlineStatus === 1 ? '在线' : '离线' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h3>播放信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前播放">
              {{ currentDevice.currentContent || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="播放状态">
              <el-tag type="success" size="small" v-if="currentDevice.isPlaying">播放中</el-tag>
              <el-tag type="info" size="small" v-else>已暂停</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="音量">
              {{ currentDevice.volume || 0 }}%
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h3>设备控制</h3>
          <div class="control-buttons">
            <el-button type="primary" @click="handleControl('play')">
              <el-icon><VideoPlay /></el-icon>
              播放
            </el-button>
            <el-button type="warning" @click="handleControl('pause')">
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
            <el-button type="danger" @click="handleControl('restart')">
              <el-icon><RefreshRight /></el-icon>
              重启
            </el-button>
          </div>

          <div class="volume-control">
            <span>音量调节：</span>
            <el-slider v-model="volumeValue" :max="100" @change="handleVolumeChange" />
          </div>
        </div>

        <div class="detail-section">
          <h3>推送内容</h3>
          <el-button type="primary" @click="handlePushContent">
            <el-icon><Promotion /></el-icon>
            推送内容
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 推送内容弹窗 -->
    <el-dialog v-model="pushDialogVisible" title="推送内容" width="500px">
      <el-form :model="pushForm" label-width="80px">
        <el-form-item label="推送类型">
          <el-radio-group v-model="pushForm.contentType">
            <el-radio label="poster">海报</el-radio>
            <el-radio label="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择内容">
          <el-select v-model="pushForm.contentId" placeholder="请选择内容" style="width: 100%">
            <el-option
              v-for="item in contentList"
              :key="item.id"
              :label="item.posterName || item.videoName"
              :value="item.id"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDeviceList,
  getDeviceDetail,
  restartDevice,
  getDeviceGroups
} from '@/api/device'
import { pushPoster, pushVideo, controlDevice } from '@/api/push'
import { getPosterList } from '@/api/poster'
import { getVideoList } from '@/api/video'

// 筛选条件
const filterGroupId = ref(null)
const filterStatus = ref(null)
const groupList = ref([])

// 统计信息
const statistics = computed(() => {
  const total = deviceList.value.length
  const online = deviceList.value.filter(d => d.onlineStatus === 1).length
  const offline = total - online
  const playing = deviceList.value.filter(d => d.playStatus === 1).length
  return { total, online, offline, playing }
})

// 设备列表
const deviceList = ref([])
const loading = ref(false)

// 详情抽屉
const drawerVisible = ref(false)
const currentDevice = ref(null)
const volumeValue = ref(50)

// 推送弹窗
const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const pushForm = reactive({
  contentType: 'poster',
  contentId: null
})
const contentList = ref([])

// 定时刷新
let refreshTimer = null

// 获取分组列表
const fetchGroupList = async () => {
  try {
    const res = await getDeviceGroups()
    groupList.value = res.data || []
  } catch (error) {
    console.error('获取分组列表失败:', error)
  }
}

// 获取设备列表
const fetchDeviceList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: 1,
      pageSize: 100
    }
    if (filterGroupId.value) params.groupId = filterGroupId.value
    if (filterStatus.value !== null) params.onlineStatus = filterStatus.value

    const res = await getDeviceList(params)
    deviceList.value = res.data.records || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 筛选
const handleFilter = () => {
  fetchDeviceList()
}

// 设备点击
const handleDeviceClick = async (device) => {
  try {
    const res = await getDeviceDetail(device.id)
    currentDevice.value = res.data
    volumeValue.value = res.data.volume || 50
    drawerVisible.value = true
  } catch (error) {
    console.error('获取设备详情失败:', error)
  }
}

// 下拉命令
const handleCommand = async (command, device) => {
  switch (command) {
    case 'refresh':
      ElMessage.success('刷新状态...')
      fetchDeviceList()
      break
    case 'screenshot':
      ElMessage.info('截屏功能开发中')
      break
    case 'restart':
      try {
        await restartDevice(device.id)
        ElMessage.success('重启指令已发送')
      } catch (error) {
        console.error('重启失败:', error)
      }
      break
  }
}

// 设备控制
const handleControl = async (action) => {
  if (!currentDevice.value) return
  try {
    await controlDevice({
      deviceIds: [currentDevice.value.id],
      action
    })
    ElMessage.success('控制指令已发送')
  } catch (error) {
    console.error('控制失败:', error)
  }
}

// 音量变化
const handleVolumeChange = async (value) => {
  if (!currentDevice.value) return
  try {
    await controlDevice({
      deviceIds: [currentDevice.value.id],
      action: 'volume',
      params: { volume: value }
    })
    ElMessage.success('音量已调整')
  } catch (error) {
    console.error('调整音量失败:', error)
  }
}

// 推送内容
const handlePushContent = async () => {
  try {
    let res
    if (pushForm.contentType === 'poster') {
      res = await getPosterList({ page: 1, size: 100, status: 1 })
    } else {
      res = await getVideoList({ page: 1, size: 100, status: 1 })
    }
    contentList.value = res.data.records || []
    pushForm.contentId = null
    pushDialogVisible.value = true
  } catch (error) {
    console.error('获取内容列表失败:', error)
  }
}

// 确认推送
const confirmPush = async () => {
  if (!pushForm.contentId) {
    ElMessage.warning('请选择要推送的内容')
    return
  }
  pushLoading.value = true
  try {
    const data = {
      targetIds: [currentDevice.value.id]
    }
    if (pushForm.contentType === 'poster') {
      data.posterId = pushForm.contentId
      await pushPoster(data)
    } else {
      data.videoId = pushForm.contentId
      await pushVideo(data)
    }
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
  } catch (error) {
    console.error('推送失败:', error)
  } finally {
    pushLoading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchGroupList()
  fetchDeviceList()
  // 每30秒刷新一次
  refreshTimer = setInterval(fetchDeviceList, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.device-monitor-container {
  .filter-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding-bottom: 0;
    }
  }

  .stat-row {
    margin-bottom: 20px;

    .stat-item {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      .stat-value {
        font-size: 32px;
        font-weight: bold;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 5px;
      }

      &.total .stat-value {
        color: #409eff;
      }

      &.online .stat-value {
        color: #67c23a;
      }

      &.offline .stat-value {
        color: #f56c6c;
      }

      &.playing .stat-value {
        color: #e6a23c;
      }
    }
  }

  .monitor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;

    .monitor-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      &.offline {
        opacity: 0.7;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #f5f7fa;

        .device-info {
          display: flex;
          align-items: center;

          .device-name {
            margin-left: 8px;
            font-weight: 500;
          }
        }
      }

      .card-content {
        padding: 15px;

        .screen-preview {
          width: 100%;
          height: 120px;
          background: #000;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .no-preview {
            text-align: center;
            color: #666;

            span {
              display: block;
              margin-top: 5px;
              font-size: 12px;
            }
          }
        }

        .current-content {
          display: flex;
          align-items: center;
          margin-top: 10px;
          color: #606266;
          font-size: 13px;

          .el-icon {
            margin-right: 5px;
          }
        }
      }

      .card-footer {
        padding: 10px 15px;
        background: #f5f7fa;
        font-size: 12px;
        color: #909399;

        .footer-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;

          &:last-child {
            margin-bottom: 0;
          }

          .el-icon {
            margin-right: 5px;
          }
        }
      }
    }
  }
}

.device-detail {
  .detail-section {
    margin-bottom: 25px;

    h3 {
      font-size: 16px;
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 3px solid #409eff;
    }
  }

  .control-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .volume-control {
    display: flex;
    align-items: center;

    span {
      width: 80px;
    }

    .el-slider {
      flex: 1;
    }
  }
}
</style>