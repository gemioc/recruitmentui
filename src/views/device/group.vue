<template>
  <div class="device-group-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon group">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ groupList.length }}</div>
            <div class="stat-label">分组数量</div>
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
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon offline">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalDevices - totalOnline }}</div>
            <div class="stat-label">离线设备</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧分组列表 -->
      <el-col :span="6" class="group-panel">
        <el-card shadow="never" class="group-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">设备分组</span>
              <el-button type="primary" size="small" @click="handleAddGroup">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </div>
          </template>

          <!-- 分组列表 -->
          <div class="group-list">
            <div
              v-for="group in groupList"
              :key="group.id"
              class="group-item"
              :class="{ active: currentGroup?.id === group.id }"
              @click="handleGroupSelect(group)"
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
              <div class="group-actions">
                <el-dropdown trigger="click" @command="(cmd) => handleGroupCommand(cmd, group)">
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <el-empty v-if="groupList.length === 0" description="暂无分组" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧设备列表 -->
      <el-col :span="18" class="device-panel">
        <el-card shadow="never" class="device-card">
          <template #header>
            <div class="panel-header">
              <div class="panel-title">
                {{ currentGroup ? currentGroup.groupName : '全部设备' }}
                <el-tag v-if="currentGroup" size="small" type="info">
                  {{ deviceList.length }}台
                </el-tag>
              </div>
              <div class="panel-actions">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索设备..."
                  :prefix-icon="Search"
                  clearable
                  size="small"
                  style="width: 200px; margin-right: 12px"
                />
                <el-button type="primary" size="small" @click="handleBatchAdd">
                  <el-icon><Plus /></el-icon>
                  添加设备
                </el-button>
              </div>
            </div>
          </template>

          <!-- 设备网格 -->
          <div class="device-grid" v-loading="loading">
            <el-empty v-if="filteredDevices.length === 0" description="暂无设备" :image-size="80" />

            <div
              v-for="device in filteredDevices"
              :key="device.id"
              class="device-item"
              :class="{ offline: device.onlineStatus !== 1 }"
            >
              <div class="device-status-bar" :class="device.onlineStatus === 1 ? 'online' : 'offline'">
              </div>
              <div class="device-content">
                <div class="device-header">
                  <div class="device-avatar">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  <div class="device-status-badge">
                    <span class="status-dot" :class="device.onlineStatus === 1 ? 'online' : 'offline'"></span>
                    {{ device.onlineStatus === 1 ? '在线' : '离线' }}
                  </div>
                </div>
                <div class="device-info">
                  <div class="device-name">{{ device.deviceName || '未命名设备' }}</div>
                  <div class="device-code">{{ device.deviceCode }}</div>
                  <div class="device-location">
                    <el-icon><Location /></el-icon>
                    {{ device.location || '未设置位置' }}
                  </div>
                </div>
                <div class="device-footer">
                  <el-tag size="small" type="info">{{ device.resolution || '1920x1080' }}</el-tag>
                  <div class="device-actions">
                    <el-button type="primary" link size="small" @click="handleEditDevice(device)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-dropdown trigger="click" @command="(cmd) => handleDeviceCommand(cmd, device)">
                      <el-icon class="more-icon"><MoreFilled /></el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="move">
                            <el-icon><Rank /></el-icon>
                            移动分组
                          </el-dropdown-item>
                          <el-dropdown-item command="remove" divided>
                            <el-icon><Remove /></el-icon>
                            移出分组
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑分组弹窗 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogTitle"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="groupFormRef" :model="groupFormData" :rules="groupFormRules" label-width="80px">
        <el-form-item label="分组名称" prop="groupName">
          <el-input v-model="groupFormData.groupName" placeholder="请输入分组名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分组描述" prop="description">
          <el-input v-model="groupFormData.description" type="textarea" :rows="3" placeholder="请输入分组描述" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGroupSubmit" :loading="groupSubmitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加设备弹窗 -->
    <el-dialog v-model="addDeviceDialogVisible" title="添加设备到分组" width="650px">
      <div class="transfer-header">
        <el-input v-model="transferSearch" placeholder="搜索设备编号或名称" :prefix-icon="Search" clearable />
      </div>
      <el-transfer
        v-model="selectedDeviceIds"
        :data="filteredAllDevices"
        :titles="['待选设备', '已选设备']"
        :props="{
          key: 'id',
          label: 'deviceName'
        }"
        filterable
        @change="handleTransferChange"
      />
      <template #footer>
        <el-button @click="addDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDevices" :loading="addDeviceLoading">
          确定添加 ({{ selectedDeviceIds.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动设备弹窗 -->
    <el-dialog v-model="moveDeviceDialogVisible" title="移动设备到其他分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标分组">
          <el-select v-model="targetGroupId" placeholder="请选择目标分组" style="width: 100%">
            <el-option
              v-for="group in availableGroups"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveDevice" :loading="moveDeviceLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑设备弹窗 -->
    <el-dialog v-model="editDeviceDialogVisible" title="编辑设备" width="500px" :close-on-click-modal="false">
      <el-form ref="deviceFormRef" :model="deviceFormData" :rules="deviceFormRules" label-width="90px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="deviceFormData.deviceName" placeholder="请输入设备名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="设备编号">
          <el-input :value="deviceFormData.deviceCode" disabled />
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="deviceFormData.location" placeholder="请输入安装位置" maxlength="100" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-input v-model="deviceFormData.resolution" placeholder="如 1920x1080" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditDevice" :loading="editDeviceLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled, Edit, Delete, Folder, Monitor, CircleCheckFilled, CircleCloseFilled, Location, Rank, Remove, Plus } from '@element-plus/icons-vue'
import {
  getDeviceGroups,
  createDeviceGroup,
  updateDeviceGroup,
  deleteDeviceGroup,
  getDeviceList,
  updateDevice
} from '@/api/device'

// 分组列表
const groupList = ref([])
const currentGroup = ref(null)
const groupDialogVisible = ref(false)
const groupSubmitLoading = ref(false)
const groupFormRef = ref(null)
const isEditGroup = ref(false)
const groupDialogTitle = computed(() => isEditGroup.value ? '编辑分组' : '新增分组')
const groupFormData = reactive({
  id: null,
  groupName: '',
  description: ''
})
const groupFormRules = {
  groupName: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}

// 设备列表
const deviceList = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 添加设备
const addDeviceDialogVisible = ref(false)
const addDeviceLoading = ref(false)
const allDevices = ref([])
const selectedDeviceIds = ref([])
const transferSearch = ref('')

const filteredAllDevices = computed(() => {
  if (!transferSearch.value) return allDevices.value
  const kw = transferSearch.value.toLowerCase()
  return allDevices.value.filter(d =>
    d.deviceName?.toLowerCase().includes(kw) ||
    d.deviceCode?.toLowerCase().includes(kw)
  )
})

// 移动设备
const moveDeviceDialogVisible = ref(false)
const moveDeviceLoading = ref(false)
const moveDeviceData = ref(null)
const targetGroupId = ref(null)

// 编辑设备
const editDeviceDialogVisible = ref(false)
const editDeviceLoading = ref(false)
const deviceFormRef = ref(null)
const deviceFormData = reactive({
  id: null,
  deviceCode: '',
  deviceName: '',
  location: '',
  resolution: ''
})
const deviceFormRules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }]
}

const availableGroups = computed(() => {
  return groupList.value.filter(g => g.id !== currentGroup.value?.id)
})

// 统计数据
const totalDevices = computed(() => {
  return groupList.value.reduce((sum, g) => sum + (g.deviceCount || 0), 0)
})

const totalOnline = computed(() => {
  return groupList.value.reduce((sum, g) => sum + (g.onlineCount || 0), 0)
})

const filteredDevices = computed(() => {
  if (!searchKeyword.value) return deviceList.value
  const kw = searchKeyword.value.toLowerCase()
  return deviceList.value.filter(d =>
    d.deviceName?.toLowerCase().includes(kw) ||
    d.deviceCode?.toLowerCase().includes(kw) ||
    d.location?.toLowerCase().includes(kw)
  )
})

// 获取分组列表
const fetchGroupList = async () => {
  try {
    const res = await getDeviceGroups()
    groupList.value = res.data || []
  } catch (error) {
    console.error('获取分组列表失败:', error)
  }
}

// 获取分组设备
const fetchGroupDevices = async (groupId) => {
  loading.value = true
  try {
    const params = { page: 1, size: 500 }
    if (groupId) params.groupId = groupId
    const res = await getDeviceList(params)
    deviceList.value = res.data.records || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 选择分组
const handleGroupSelect = (group) => {
  currentGroup.value = group
  fetchGroupDevices(group.id)
}

// 新增分组
const handleAddGroup = () => {
  isEditGroup.value = false
  Object.assign(groupFormData, { id: null, groupName: '', description: '' })
  groupDialogVisible.value = true
}

// 编辑分组
const handleEditGroup = (group) => {
  isEditGroup.value = true
  Object.assign(groupFormData, {
    id: group.id,
    groupName: group.groupName,
    description: group.description
  })
  groupDialogVisible.value = true
}

// 删除分组
const handleDeleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组【${group.groupName}】吗？分组内的设备将移至未分组。`,
      '提示',
      { type: 'warning' }
    )
    await deleteDeviceGroup(group.id)
    ElMessage.success('删除成功')
    if (currentGroup.value?.id === group.id) {
      currentGroup.value = null
      fetchGroupDevices(null)
    }
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') console.error('删除失败:', error)
  }
}

// 分组操作
const handleGroupCommand = (command, group) => {
  if (command === 'edit') handleEditGroup(group)
  if (command === 'delete') handleDeleteGroup(group)
}

// 提交分组
const handleGroupSubmit = async () => {
  await groupFormRef.value.validate()
  groupSubmitLoading.value = true
  try {
    if (isEditGroup.value) {
      await updateDeviceGroup(groupFormData)
      ElMessage.success('修改成功')
    } else {
      await createDeviceGroup(groupFormData)
      ElMessage.success('新增成功')
    }
    groupDialogVisible.value = false
    fetchGroupList()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    groupSubmitLoading.value = false
  }
}

// 批量添加设备
const handleBatchAdd = async () => {
  try {
    const res = await getDeviceList({ page: 1, size: 1000 })
    // 只显示未分配任何分组的设备
    allDevices.value = (res.data.records || []).filter(item => !item.groupId)
    selectedDeviceIds.value = []
    transferSearch.value = ''
    addDeviceDialogVisible.value = true
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

const handleTransferChange = (value) => {
  selectedDeviceIds.value = value
}

// 确认添加设备
const confirmAddDevices = async () => {
  if (selectedDeviceIds.value.length === 0) {
    ElMessage.warning('请选择要添加的设备')
    return
  }
  addDeviceLoading.value = true
  try {
    const groupId = currentGroup.value?.id || null
    await Promise.all(
      selectedDeviceIds.value.map(deviceId =>
        updateDevice(deviceId, { groupId })
      )
    )
    ElMessage.success(`成功添加 ${selectedDeviceIds.value.length} 台设备`)
    addDeviceDialogVisible.value = false
    fetchGroupDevices(currentGroup.value?.id)
    fetchGroupList()
  } catch (error) {
    console.error('添加失败:', error)
  } finally {
    addDeviceLoading.value = false
  }
}

// 设备操作
const handleEditDevice = async (device) => {
  Object.assign(deviceFormData, {
    id: device.id,
    deviceCode: device.deviceCode || '',
    deviceName: device.deviceName || '',
    location: device.location || '',
    resolution: device.resolution || ''
  })
  editDeviceDialogVisible.value = true
}

const confirmEditDevice = async () => {
  await deviceFormRef.value.validate()
  editDeviceLoading.value = true
  try {
    await updateDevice(deviceFormData.id, {
      deviceName: deviceFormData.deviceName,
      location: deviceFormData.location,
      resolution: deviceFormData.resolution
    })
    ElMessage.success('修改成功')
    editDeviceDialogVisible.value = false
    fetchGroupDevices(currentGroup.value?.id)
  } catch (error) {
    console.error('修改失败:', error)
  } finally {
    editDeviceLoading.value = false
  }
}

const handleDeviceCommand = (command, device) => {
  if (command === 'move') {
    moveDeviceData.value = device
    targetGroupId.value = null
    moveDeviceDialogVisible.value = true
  }
  if (command === 'remove') {
    handleRemoveDevice(device)
  }
}

// 移动设备
const confirmMoveDevice = async () => {
  if (!targetGroupId.value) {
    ElMessage.warning('请选择目标分组')
    return
  }
  moveDeviceLoading.value = true
  try {
    await updateDevice(moveDeviceData.value.id, { groupId: targetGroupId.value })
    ElMessage.success('移动成功')
    moveDeviceDialogVisible.value = false
    fetchGroupDevices(currentGroup.value?.id)
    fetchGroupList()
  } catch (error) {
    console.error('移动失败:', error)
  } finally {
    moveDeviceLoading.value = false
  }
}

// 移除设备
const handleRemoveDevice = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要将设备【${device.deviceName}】移出当前分组吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateDevice(device.id, { groupId: null })
    ElMessage.success('移除成功')
    fetchGroupDevices(currentGroup.value?.id)
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') console.error('移除失败:', error)
  }
}

onMounted(() => {
  fetchGroupList()
  fetchGroupDevices(null)
})
</script>

<style lang="scss" scoped>
.device-group-container {
  padding: 0;
}

// 统计卡片行
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
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-right: 16px;
      background: rgba(255, 255, 255, 0.2);

      &.group { background: rgba(255, 255, 255, 0.2); }
      &.device { background: rgba(255, 255, 255, 0.2); }
      &.online { background: rgba(16, 185, 129, 0.5); }
      &.offline { background: rgba(239, 68, 68, 0.5); }
    }

    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
      }
      .stat-label {
        font-size: 13px;
        opacity: 0.85;
        margin-top: 4px;
      }
    }
  }
}

// 主内容区
.main-content {
  .group-panel {
    .group-card {
      border-radius: 12px;
      height: calc(100vh - 220px);
      overflow: hidden;

      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      :deep(.el-card__body) {
        padding: 0;
        height: calc(100% - 57px);
        overflow-y: auto;
      }
    }
  }

  .device-panel {
    .device-card {
      border-radius: 12px;
      height: calc(100vh - 220px);
      overflow: hidden;

      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      :deep(.el-card__body) {
        padding: 16px 20px;
        height: calc(100% - 57px);
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

  .panel-actions {
    display: flex;
    align-items: center;
  }
}

// 分组列表
.group-list {
  padding: 8px;

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

    &.active {
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
      border: 1px solid #667eea40;
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

    .group-actions {
      .more-icon {
        padding: 4px;
        cursor: pointer;
        color: #909399;
        font-size: 16px;
        border-radius: 4px;

        &:hover {
          background: #f0f0f0;
          color: #303133;
        }
      }
    }
  }
}

// 设备网格
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;

  .device-item {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #ebeef5;
    overflow: hidden;
    transition: all 0.3s;
    position: relative;

    &:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    &.offline {
      opacity: 0.75;

      .device-status-bar.offline {
        background: linear-gradient(90deg, #909399 0%, #dcdfe6 100%);
      }
    }

    .device-status-bar {
      height: 4px;
      background: linear-gradient(90deg, #10b981 0%, #34d399 100%);

      &.offline {
        background: linear-gradient(90deg, #909399 0%, #dcdfe6 100%);
      }
    }

    .device-content {
      padding: 16px;

      .device-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .device-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
        }

        .device-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #909399;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;

            &.online {
              background: #10b981;
              box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
            }

            &.offline {
              background: #dcdfe6;
            }
          }
        }
      }

      .device-info {
        .device-name {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .device-code {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
          font-family: monospace;
        }

        .device-location {
          font-size: 12px;
          color: #c0c4cc;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .device-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;

        .device-actions {
          display: flex;
          gap: 4px;

          .more-icon {
            padding: 4px;
            cursor: pointer;
            color: #909399;
            font-size: 14px;

            &:hover {
              color: #667eea;
            }
          }
        }
      }
    }
  }
}

// 穿梭框头部
.transfer-header {
  margin-bottom: 16px;
}
</style>
