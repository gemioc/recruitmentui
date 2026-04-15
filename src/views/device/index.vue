<template>
  <div class="device-container">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon device">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
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
            <div class="stat-value">{{ onlineCount }}</div>
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
            <div class="stat-value">{{ total - onlineCount }}</div>
            <div class="stat-label">离线设备</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon group">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ groupCount }}</div>
            <div class="stat-label">分组数量</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作栏 -->
    <el-card shadow="never" class="search-card">
      <div class="search-bar">
        <div class="search-filters">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="搜索设备名称/编号..."
            :prefix-icon="Search"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="queryParams.groupId" placeholder="全部分组" clearable style="width: 150px">
            <el-option v-for="g in groupList" :key="g.id" :label="g.groupName" :value="g.id" />
          </el-select>
          <el-select v-model="queryParams.onlineStatus" placeholder="全部状态" clearable style="width: 100px">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div class="search-actions">
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增设备
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 设备列表 -->
    <el-card shadow="never" class="table-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
        </div>
      </template>

      <el-table :data="deviceList" stripe>
        <el-table-column prop="deviceName" label="设备名称" min-width="120" />
        <el-table-column prop="deviceCode" label="设备编号" min-width="180" show-overflow-tooltip />
        <el-table-column label="在线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.onlineStatus === 1 ? 'success' : 'danger'" size="small">
              {{ row.onlineStatus === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" min-width="120" />
        <el-table-column prop="groupName" label="所属分组" width="120" />
        <el-table-column prop="resolution" label="分辨率" width="120" />
        <el-table-column label="最后在线" width="170">
          <template #default="{ row }">
            {{ formatDate(row.lastHeartbeat) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button type="primary" link @click="handleRestart(row)">重启</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchDeviceList"
        @current-change="fetchDeviceList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="设备编号" prop="deviceCode">
          <el-select v-if="!isEdit" v-model="formData.deviceCode" filterable allow-create default-first-option placeholder="请选择或输入设备编号" style="width: 100%" @focus="fetchPendingDevices">
            <el-option v-for="d in pendingDevices" :key="d.deviceCode" :label="d.deviceCode" :value="d.deviceCode">
              <div class="device-code-option">
                <span class="code">{{ d.deviceCode }}</span>
              </div>
            </el-option>
          </el-select>
          <el-input v-else v-model="formData.deviceCode" disabled />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备分组" prop="groupId">
          <el-select v-model="formData.groupId" placeholder="请选择设备分组" style="width: 100%">
            <el-option v-for="g in groupList" :key="g.id" :label="g.groupName" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="分辨率" prop="resolution">
          <el-select v-model="formData.resolution" placeholder="请选择分辨率" style="width: 100%">
            <el-option label="1920x1080 (Full HD)" value="1920x1080" />
            <el-option label="3840x2160 (4K)" value="3840x2160" />
            <el-option label="1280x720 (HD)" value="1280x720" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入设备备注" />
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
        <el-descriptions-item label="所属分组">{{ detailData.groupName || '未分组' }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ detailData.location }}</el-descriptions-item>
        <el-descriptions-item label="分辨率">{{ detailData.resolution }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="detailData.onlineStatus === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.onlineStatus === 1 ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ formatDate(detailData.lastHeartbeat) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(detailData.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="当前播放内容" :span="2">{{ detailData.currentContent || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="设备备注" :span="2">{{ detailData.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh, Monitor, CircleCheckFilled, CircleCloseFilled, Folder } from '@element-plus/icons-vue'
import { getDeviceList, getDeviceDetail, createDevice, updateDevice, deleteDevice, restartDevice, getDeviceGroups, getPendingDevices } from '@/api/device'
import { formatDate } from '@/utils/format'

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  deviceName: '',
  groupId: null,
  onlineStatus: null
})

const deviceList = ref([])
const total = ref(0)
const loading = ref(false)
const groupList = ref([])
const onlineCount = ref(0)

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑设备' : '新增设备')

const formData = reactive({
  id: null, deviceCode: '', deviceName: '', groupId: null, location: '', resolution: '1920x1080', remark: ''
})

const formRules = {
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入安装位置', trigger: 'blur' }]
}

const detailVisible = ref(false)
const detailData = ref(null)
const pendingDevices = ref([])

const groupCount = computed(() => groupList.value.length)

const fetchGroupList = async () => {
  try {
    const res = await getDeviceGroups()
    groupList.value = res.data || []
  } catch (error) { console.error('获取分组失败:', error) }
}

const fetchDeviceList = async () => {
  loading.value = true
  try {
    const res = await getDeviceList(queryParams)
    deviceList.value = res.data.records || []
    total.value = res.data.total || 0
    onlineCount.value = deviceList.value.filter(d => d.onlineStatus === 1).length
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryParams.pageNum = 1; fetchDeviceList() }
const handleReset = () => { queryParams.deviceName = ''; queryParams.groupId = null; queryParams.onlineStatus = null; handleSearch() }
const handleRefresh = () => { fetchDeviceList(); ElMessage.success('刷新成功') }

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, { id: null, deviceCode: '', deviceName: '', groupId: null, location: '', resolution: '1920x1080', remark: '' })
  fetchPendingDevices()
  dialogVisible.value = true
}

const fetchPendingDevices = async () => {
  try { const res = await getPendingDevices(); pendingDevices.value = res.data || [] } catch (error) { console.error('获取待注册设备失败:', error) }
}

const handleEdit = async (row) => {
  isEdit.value = true
  try { const res = await getDeviceDetail(row.id); Object.assign(formData, res.data); dialogVisible.value = true } catch (error) { console.error('获取详情失败:', error) }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) { await updateDevice(formData.id, formData); ElMessage.success('修改成功') }
    else { await createDevice(formData); ElMessage.success('新增成功') }
    dialogVisible.value = false
    fetchDeviceList()
  } catch (error) { console.error('保存失败:', error) } finally { submitLoading.value = false }
}

const handleDetail = async (row) => {
  try { const res = await getDeviceDetail(row.id); detailData.value = res.data; detailVisible.value = true } catch (error) { console.error('获取详情失败:', error) }
}

const handleRestart = async (row) => {
  try { await ElMessageBox.confirm(`确定要重启设备【${row.deviceName}】吗？`, '提示', { type: 'warning' }); await restartDevice(row.id); ElMessage.success('重启指令已发送') } catch (error) { if (error !== 'cancel') console.error('重启失败:', error) }
}

const handleDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定要删除设备【${row.deviceName}】吗？`, '提示', { type: 'warning' }); await deleteDevice(row.id); ElMessage.success('删除成功'); fetchDeviceList() } catch (error) { if (error !== 'cancel') console.error('删除失败:', error) }
}

onMounted(() => { fetchGroupList(); fetchDeviceList() })
onActivated(() => fetchDeviceList())
</script>

<style lang="scss" scoped>
.device-container {
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
  }
  .search-card {
    border-radius: 12px; margin-bottom: 20px;
    .search-bar {
      display: flex; justify-content: space-between; align-items: center;
      .search-filters { display: flex; gap: 12px; align-items: center; }
      .search-actions { display: flex; gap: 10px; }
    }
  }
  .table-card {
    border-radius: 12px;
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
    }
    .el-pagination {
      margin-top: 20px; display: flex; justify-content: flex-end;
    }
  }
}
.device-code-option { display: flex; justify-content: space-between; align-items: center; width: 100%; .code { font-weight: 500; } .info { display: flex; gap: 8px; } }
</style>
