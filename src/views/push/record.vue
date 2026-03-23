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
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
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
        <el-table-column prop="contentType" label="内容类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.contentType === 'poster' ? 'primary' : 'warning'" size="small">
              {{ row.contentType === 'poster' ? '海报' : '视频' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contentTitle" label="内容名称" min-width="150" />
        <el-table-column prop="deviceNames" label="目标设备" min-width="150" />
        <el-table-column prop="deviceCount" label="设备数量" width="100" />
        <el-table-column prop="successCount" label="成功数量" width="100">
          <template #default="{ row }">
            <span class="success">{{ row.successCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failCount" label="失败数量" width="100">
          <template #default="{ row }">
            <span :class="{ error: row.failCount > 0 }">{{ row.failCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="推送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="createTime" label="推送时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.size"
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
        <el-descriptions-item label="内容名称" :span="2">{{ detailData.contentTitle }}</el-descriptions-item>
        <el-descriptions-item label="设备总数">{{ detailData.deviceCount }}</el-descriptions-item>
        <el-descriptions-item label="成功数量">
          <span class="success">{{ detailData.successCount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="失败数量">
          <span :class="{ error: detailData.failCount > 0 }">{{ detailData.failCount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="推送状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="推送时间">{{ detailData.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">设备推送结果</el-divider>

      <el-table :data="detailData.deviceResults" max-height="300">
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPushRecords, getPushDetail } from '@/api/push'

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
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
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange

    const res = await getPushRecords(params)
    recordList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取推送记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
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
const handleExport = () => {
  ElMessage.info('导出功能开发中')
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

// 初始化
onMounted(() => {
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