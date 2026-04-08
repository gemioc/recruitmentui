<template>
  <div class="push-record-container">
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
        <el-form-item label="推送状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="推送中" :value="0" />
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="推送时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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

    <!-- 列表区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>推送记录</span>
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出记录
          </el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="contentTitle" label="内容名称" min-width="150" />
        <el-table-column prop="contentType" label="内容类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.contentType === 'poster' ? 'primary' : 'warning'" size="small">
              {{ row.contentType === 'poster' ? '海报' : '视频' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceNames" label="目标设备" min-width="150" />
        <el-table-column prop="deviceCount" label="设备数量" width="100" />
        <el-table-column prop="successCount" label="成功数量" width="100">
          <template #default="{ row }">
            <span class="success">{{ row.successCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failCount" label="失败数量" width="100">
          <template #default="{ row }">
            <span :class="{ error: row.failCount > 0 }">{{ row.failCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="推送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
              {{ row.status === 1 ? '成功' : row.status === 2 ? '失败' : '推送中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column label="推送时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchRecordList"
        @current-change="fetchRecordList"
      />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="推送详情" width="700px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="推送ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="内容类型">
          {{ detailData.contentType === 'poster' ? '海报' : '视频' }}
        </el-descriptions-item>
        <el-descriptions-item label="内容名称" :span="2">{{ detailData.contentTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标设备" :span="2">{{ detailData.deviceNames || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备总数">{{ detailData.deviceCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="成功数量">
          <span class="success">{{ detailData.successCount || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="失败数量">
          <span :class="{ error: detailData.failCount > 0 }">{{ detailData.failCount || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="推送状态">
          <el-tag :type="detailData.status === 1 ? 'success' : detailData.status === 2 ? 'danger' : 'warning'" size="small">
            {{ detailData.status === 1 ? '成功' : detailData.status === 2 ? '失败' : '推送中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推送时间">{{ formatDate(detailData.createTime) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left" v-if="detailData.deviceResults && detailData.deviceResults.length">设备推送结果</el-divider>

      <el-table :data="detailData.deviceResults" max-height="300" v-if="detailData.deviceResults && detailData.deviceResults.length">
        <el-table-column prop="deviceName" label="设备名称" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="结果信息" min-width="150" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPushRecords, getPushDetail, exportPushRecords } from '@/api/push'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  deviceName: '',
  status: null,
  dateRange: null
})

// 列表数据
const recordList = ref([])
const total = ref(0)
const loading = ref(false)

// 详情
const detailVisible = ref(false)
const detailData = ref(null)

// 获取推送记录
const fetchRecordList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    }
    if (queryParams.status !== null) {
      params.pushStatus = queryParams.status
    }
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      params.startDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }
    if (queryParams.deviceName) {
      params.deviceName = queryParams.deviceName
    }

    const res = await getPushRecords(params)
    recordList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取推送记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化
watch(
  () => route.query,
  (query) => {
    if (query.status !== undefined) {
      queryParams.status = Number(query.status)
    } else {
      queryParams.status = null
    }
    if (query.startDate && query.endDate) {
      queryParams.dateRange = [query.startDate, query.endDate]
    } else {
      queryParams.dateRange = null
    }
    fetchRecordList()
  }
)

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  fetchRecordList()
}

// 重置
const handleReset = () => {
  queryParams.deviceName = ''
  queryParams.status = null
  queryParams.dateRange = null
  handleSearch()
}

// 导出
const handleExport = async () => {
  try {
    const params = {}
    if (queryParams.status !== null) {
      params.pushStatus = queryParams.status
    }
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      params.startDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }
    if (queryParams.deviceName) {
      params.deviceName = queryParams.deviceName
    }

    const res = await exportPushRecords(params)
    // axios返回的blob在res.data中
    const blob = new Blob([res.data], { type: 'text/csv;charset=UTF-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `推送记录_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 详情
const handleDetail = async (row) => {
  try {
    const res = await getPushDetail(row.id)
    detailData.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取推送详情失败:', error)
  }
}

// 页面激活时刷新数据
onActivated(() => {
  fetchRecordList()
})

// 初始化
onMounted(() => {
  if (route.query.status !== undefined) {
    queryParams.status = Number(route.query.status)
  }
  if (route.query.startDate && route.query.endDate) {
    queryParams.dateRange = [route.query.startDate, route.query.endDate]
  }
  fetchRecordList()
})
</script>

<style lang="scss" scoped>
.push-record-container {
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

    .success {
      color: #67c23a;
    }

    .error {
      color: #f56c6c;
    }

    .el-pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>