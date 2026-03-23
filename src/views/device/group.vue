<template>
  <div class="device-group-container">
    <el-row :gutter="20">
      <!-- 分组列表 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>设备分组</span>
              <el-button type="primary" size="small" @click="handleAddGroup">
                <el-icon><Plus /></el-icon>
                新增分组
              </el-button>
            </div>
          </template>

          <el-tree
            ref="treeRef"
            :data="groupTree"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-label">
                  <el-icon><Folder /></el-icon>
                  {{ node.label }}
                </span>
                <span class="node-count">({{ data.deviceCount || 0 }})</span>
                <span class="node-actions">
                  <el-button type="primary" link size="small" @click.stop="handleEditGroup(data)">
                    编辑
                  </el-button>
                  <el-button type="danger" link size="small" @click.stop="handleDeleteGroup(data)">
                    删除
                  </el-button>
                </span>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 分组设备 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ currentGroup ? `${currentGroup.name} - 设备列表` : '全部设备' }}</span>
              <el-button
                type="primary"
                size="small"
                :disabled="!currentGroup"
                @click="handleAddDevice"
              >
                添加设备
              </el-button>
            </div>
          </template>

          <el-table :data="deviceList" v-loading="loading" stripe>
            <el-table-column prop="deviceCode" label="设备编号" width="120" />
            <el-table-column prop="name" label="设备名称" min-width="150" />
            <el-table-column prop="location" label="安装位置" min-width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleMoveDevice(row)">移动</el-button>
                <el-button type="danger" link @click="handleRemoveDevice(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑分组弹窗 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogTitle"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="groupFormRef"
        :model="groupFormData"
        :rules="groupFormRules"
        label-width="80px"
      >
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupFormData.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组描述" prop="description">
          <el-input
            v-model="groupFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分组描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGroupSubmit" :loading="groupSubmitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加设备到分组弹窗 -->
    <el-dialog v-model="addDeviceDialogVisible" title="添加设备到分组" width="600px">
      <el-transfer
        v-model="selectedDeviceIds"
        :data="allDevices"
        :titles="['待选设备', '已选设备']"
        :props="{
          key: 'id',
          label: 'name'
        }"
        filterable
        filter-placeholder="搜索设备"
      />
      <template #footer>
        <el-button @click="addDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDevices" :loading="addDeviceLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动设备弹窗 -->
    <el-dialog v-model="moveDeviceDialogVisible" title="移动设备到其他分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标分组">
          <el-select v-model="targetGroupId" placeholder="请选择目标分组" style="width: 100%">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveDevice" :loading="moveDeviceLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDeviceGroups,
  createDeviceGroup,
  updateDeviceGroup,
  deleteDeviceGroup,
  getDeviceList,
  updateDevice
} from '@/api/device'

// 分组树
const treeRef = ref(null)
const groupList = ref([])
const groupTree = computed(() => {
  return groupList.value.map(item => ({
    ...item,
    label: item.name
  }))
})
const treeProps = {
  children: 'children',
  label: 'label'
}

// 当前选中分组
const currentGroup = ref(null)

// 设备列表
const deviceList = ref([])
const loading = ref(false)

// 分组弹窗
const groupDialogVisible = ref(false)
const groupSubmitLoading = ref(false)
const groupFormRef = ref(null)
const isEditGroup = ref(false)
const groupDialogTitle = computed(() => isEditGroup.value ? '编辑分组' : '新增分组')
const groupFormData = reactive({
  id: null,
  name: '',
  description: ''
})
const groupFormRules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}

// 添加设备
const addDeviceDialogVisible = ref(false)
const addDeviceLoading = ref(false)
const allDevices = ref([])
const selectedDeviceIds = ref([])

// 移动设备
const moveDeviceDialogVisible = ref(false)
const moveDeviceLoading = ref(false)
const moveDeviceData = ref(null)
const targetGroupId = ref(null)

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
  if (!groupId) {
    deviceList.value = []
    return
  }
  loading.value = true
  try {
    const res = await getDeviceList({ groupId, page: 1, size: 100 })
    deviceList.value = res.data.records || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 树节点点击
const handleNodeClick = (data) => {
  currentGroup.value = data
  fetchGroupDevices(data.id)
}

// 新增分组
const handleAddGroup = () => {
  isEditGroup.value = false
  Object.assign(groupFormData, {
    id: null,
    name: '',
    description: ''
  })
  groupDialogVisible.value = true
}

// 编辑分组
const handleEditGroup = (data) => {
  isEditGroup.value = true
  Object.assign(groupFormData, {
    id: data.id,
    name: data.name,
    description: data.description
  })
  groupDialogVisible.value = true
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

// 删除分组
const handleDeleteGroup = async (data) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组【${data.name}】吗？分组内的设备将移至默认分组。`,
      '提示',
      { type: 'warning' }
    )
    await deleteDeviceGroup(data.id)
    ElMessage.success('删除成功')
    if (currentGroup.value?.id === data.id) {
      currentGroup.value = null
      deviceList.value = []
    }
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 添加设备到分组
const handleAddDevice = async () => {
  if (!currentGroup.value) return

  try {
    // 获取未分组的设备
    const res = await getDeviceList({ page: 1, size: 1000 })
    allDevices.value = (res.data.records || []).filter(
      item => item.groupId !== currentGroup.value.id
    )
    selectedDeviceIds.value = []
    addDeviceDialogVisible.value = true
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

// 确认添加设备
const confirmAddDevices = async () => {
  if (selectedDeviceIds.value.length === 0) {
    ElMessage.warning('请选择要添加的设备')
    return
  }
  addDeviceLoading.value = true
  try {
    // 批量更新设备分组
    await Promise.all(
      selectedDeviceIds.value.map(deviceId =>
        updateDevice({ id: deviceId, groupId: currentGroup.value.id })
      )
    )
    ElMessage.success('添加成功')
    addDeviceDialogVisible.value = false
    fetchGroupDevices(currentGroup.value.id)
    fetchGroupList()
  } catch (error) {
    console.error('添加失败:', error)
  } finally {
    addDeviceLoading.value = false
  }
}

// 移动设备
const handleMoveDevice = (row) => {
  moveDeviceData.value = row
  targetGroupId.value = null
  moveDeviceDialogVisible.value = true
}

// 确认移动设备
const confirmMoveDevice = async () => {
  if (!targetGroupId.value) {
    ElMessage.warning('请选择目标分组')
    return
  }
  moveDeviceLoading.value = true
  try {
    await updateDevice({
      id: moveDeviceData.value.id,
      groupId: targetGroupId.value
    })
    ElMessage.success('移动成功')
    moveDeviceDialogVisible.value = false
    fetchGroupDevices(currentGroup.value.id)
    fetchGroupList()
  } catch (error) {
    console.error('移动失败:', error)
  } finally {
    moveDeviceLoading.value = false
  }
}

// 移除设备
const handleRemoveDevice = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要将设备【${row.name}】移出当前分组吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateDevice({ id: row.id, groupId: null })
    ElMessage.success('移除成功')
    fetchGroupDevices(currentGroup.value.id)
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除失败:', error)
    }
  }
}

// 初始化
onMounted(() => {
  fetchGroupList()
})
</script>

<style lang="scss" scoped>
.device-group-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tree-node {
    flex: 1;
    display: flex;
    align-items: center;

    .node-label {
      display: flex;
      align-items: center;

      .el-icon {
        margin-right: 5px;
      }
    }

    .node-count {
      margin-left: 5px;
      color: #909399;
      font-size: 12px;
    }

    .node-actions {
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }
}
</style>