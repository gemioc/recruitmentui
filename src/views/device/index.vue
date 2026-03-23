<template>
  <div class="device-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="设备名称">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="设备分组">
          <el-select v-model="queryParams.groupId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select v-model="queryParams.onlineStatus" placeholder="全部" clearable style="width: 100px">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
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

    <!-- 操作区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <div class="header-actions">
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新状态
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增设备
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="deviceList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="deviceCode" label="设备编号" width="120" />
        <el-table-column prop="deviceName" label="设备名称" min-width="150" />
        <el-table-column prop="groupName" label="所属分组" width="120" />
        <el-table-column prop="location" label="安装位置" min-width="150" />
        <el-table-column prop="onlineStatus" label="在线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.onlineStatus === 1 ? 'success' : 'danger'" size="small">
              {{ row.onlineStatus === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后在线时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" link @click="handleRestart(row)">重启</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedDevices.length === 0"
            @click="handleBatchPush"
          >
            批量推送
          </el-button>
          <el-button
            type="warning"
            :disabled="selectedDevices.length === 0"
            @click="handleBatchRestart"
          >
            批量重启
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchDeviceList"
          @current-change="fetchDeviceList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="设备编号" prop="deviceCode">
          <el-input v-model="formData.deviceCode" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备分组" prop="groupId">
          <el-select v-model="formData.groupId" placeholder="请选择设备分组">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="分辨率" prop="resolution">
          <el-select v-model="formData.resolution" placeholder="请选择分辨率">
            <el-option label="1920x1080 (Full HD)" value="1920x1080" />
            <el-option label="3840x2160 (4K)" value="3840x2160" />
            <el-option label="1280x720 (HD)" value="1280x720" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入设备备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="设备详情" width="700px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="设备编号">{{ detailData.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detailData.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="所属分组">{{ detailData.groupName }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ detailData.location }}</el-descriptions-item>
        <el-descriptions-item label="分辨率">{{ detailData.resolution }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="detailData.onlineStatus === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.onlineStatus === 1 ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ detailData.lastHeartbeat }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="当前播放内容" :span="2">
          {{ detailData.currentContent || '暂无' }}
        </el-descriptions-item>
        <el-descriptions-item label="设备备注" :span="2">
          {{ detailData.remark || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 批量推送弹窗 -->
    <el-dialog v-model="pushDialogVisible" title="批量推送内容" width="500px">
      <el-form :model="pushForm" label-width="80px">
        <el-form-item label="推送类型">
          <el-radio-group v-model="pushForm.contentType">
            <el-radio label="poster">海报</el-radio>
            <el-radio label="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择内容">
          <el-select v-model="pushForm.contentId" placeholder="请选择要推送的内容" style="width: 100%">
            <el-option
              v-for="item in contentList"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchPush" :loading="pushLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDeviceList,
  getDeviceDetail,
  createDevice,
  updateDevice,
  deleteDevice,
  restartDevice,
  getDeviceGroups
} from '@/api/device'
import { pushPoster, pushVideo, controlDevice } from '@/api/push'
import { getPosterList } from '@/api/poster'
import { getVideoList } from '@/api/video'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  deviceName: '',
  deviceCode: '',
  groupId: null,
  onlineStatus: null
})

// 列表数据
const deviceList = ref([])
const total = ref(0)
const loading = ref(false)
const selectedDevices = ref([])
const groupList = ref([])

// 弹窗
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const isEdit = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑设备' : '新增设备')

// 表单数据
const formData = reactive({
  id: null,
  deviceCode: '',
  deviceName: '',
  groupId: null,
  location: '',
  resolution: '1920x1080',
  remark: ''
})

// 表单验证规则
const formRules = {
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入安装位置', trigger: 'blur' }]
}

// 详情
const detailVisible = ref(false)
const detailData = ref(null)

// 批量推送
const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const pushForm = reactive({
  contentType: 'poster',
  contentId: null
})
const contentList = ref([])

// 获取设备分组列表
const fetchGroupList = async () => {
  try {
    const res = await getDeviceGroups()
    groupList.value = res.data || []
  } catch (error) {
    console.error('获取设备分组失败:', error)
  }
}

// 获取设备列表
const fetchDeviceList = async () => {
  loading.value = true
  try {
    const res = await getDeviceList(queryParams)
    deviceList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchDeviceList()
}

// 重置
const handleReset = () => {
  queryParams.deviceName = ''
  queryParams.deviceCode = ''
  queryParams.groupId = null
  queryParams.onlineStatus = null
  handleSearch()
}

// 刷新状态
const handleRefresh = () => {
  fetchDeviceList()
  ElMessage.success('刷新成功')
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedDevices.value = selection
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  isEdit.value = true
  try {
    const res = await getDeviceDetail(row.id)
    Object.assign(formData, res.data)
    dialogVisible.value = true
  } catch (error) {
    console.error('获取设备详情失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    deviceCode: '',
    deviceName: '',
    groupId: null,
    location: '',
    resolution: '1920x1080',
    remark: ''
  })
  formRef.value?.resetFields()
}

// 提交
const handleSubmit = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateDevice(formData.id, formData)
      ElMessage.success('修改成功')
    } else {
      await createDevice(formData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchDeviceList()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 详情
const handleDetail = async (row) => {
  try {
    const res = await getDeviceDetail(row.id)
    detailData.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取设备详情失败:', error)
  }
}

// 重启
const handleRestart = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重启设备【${row.deviceName}】吗？`, '提示', {
      type: 'warning'
    })
    await restartDevice(row.id)
    ElMessage.success('重启指令已发送')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重启失败:', error)
    }
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除设备【${row.deviceName}】吗？`, '提示', {
      type: 'warning'
    })
    await deleteDevice(row.id)
    ElMessage.success('删除成功')
    fetchDeviceList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 批量推送
const handleBatchPush = async () => {
  // 获取内容列表
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

// 确认批量推送
const confirmBatchPush = async () => {
  if (!pushForm.contentId) {
    ElMessage.warning('请选择要推送的内容')
    return
  }
  pushLoading.value = true
  try {
    const deviceIds = selectedDevices.value.map(item => item.id)
    const data = {
      deviceIds,
      contentId: pushForm.contentId
    }
    if (pushForm.contentType === 'poster') {
      await pushPoster(data)
    } else {
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

// 批量重启
const handleBatchRestart = async () => {
  try {
    await ElMessageBox.confirm(`确定要重启选中的 ${selectedDevices.value.length} 台设备吗？`, '提示', {
      type: 'warning'
    })
    const deviceIds = selectedDevices.value.map(item => item.id)
    await controlDevice({ deviceIds, action: 'restart' })
    ElMessage.success('重启指令已发送')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量重启失败:', error)
    }
  }
}

// 初始化
onMounted(() => {
  fetchGroupList()
  fetchDeviceList()
})
</script>

<style lang="scss" scoped>
.device-container {
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

    .table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;

      .el-pagination {
        flex: 1;
        justify-content: flex-end;
      }
    }
  }
}
</style>