<template>
  <div class="log-container">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入操作人"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="queryParams.operationType" placeholder="全部" clearable style="width: 120px">
            <el-option label="新增" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="推送" value="PUSH" />
            <el-option label="登录" value="LOGIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
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
          <span>操作日志</span>
          <el-button type="danger" @click="handleClear">
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </template>

      <el-table :data="logList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="操作人" width="100" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeTag(row.operationType)" size="small">
              {{ getOperationTypeLabel(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationDesc" label="操作描述" min-width="200" />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="executionTime" label="耗时(ms)" width="100" />
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.operationTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
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
        @size-change="fetchLogList"
        @current-change="fetchLogList"
      />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="日志ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeTag(detailData.operationType)" size="small">
            {{ getOperationTypeLabel(detailData.operationType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述">{{ detailData.operationDesc }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ detailData.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="请求URL">{{ detailData.requestUrl }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre class="code-block">{{ formatJson(detailData.requestParams) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果">
          <pre class="code-block">{{ formatJson(detailData.responseResult) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="执行耗时">{{ detailData.executionTime }}ms</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDateTime(detailData.operationTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOperationLogs, clearOperationLogs } from '@/api/log'
import { formatDate } from '@/utils/format'

// 格式化日期时间
const formatDateTime = (date) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  operationType: null,
  dateRange: null
})

// 列表数据
const logList = ref([])
const total = ref(0)
const loading = ref(false)

// 详情
const detailVisible = ref(false)
const detailData = ref(null)

// 操作类型标签
const getOperationTypeTag = (type) => {
  const map = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    PUSH: 'primary',
    LOGIN: 'info'
  }
  return map[type] || 'info'
}

// 操作类型标签文字
const getOperationTypeLabel = (type) => {
  const map = {
    CREATE: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    PUSH: '推送',
    LOGIN: '登录'
  }
  return map[type] || type
}

// 格式化JSON
const formatJson = (str) => {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// 获取日志列表
const fetchLogList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange

    const res = await getOperationLogs(params)
    logList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取日志列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchLogList()
}

// 重置
const handleReset = () => {
  queryParams.userName = ''
  queryParams.operationType = null
  queryParams.dateRange = null
  handleSearch()
}

// 详情
const handleDetail = (row) => {
  detailData.value = row
  detailVisible.value = true
}

// 清空日志
const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有操作日志吗？此操作不可恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定清空',
      cancelButtonText: '取消'
    })
    await clearOperationLogs()
    ElMessage.success('清空成功')
    fetchLogList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空日志失败:', error)
    }
  }
}

// 初始化
onMounted(() => {
  fetchLogList()
})

// 页面激活时刷新数据
onActivated(() => {
  fetchLogList()
})
</script>

<style lang="scss" scoped>
.log-container {
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

    .el-pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}

.code-block {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;

  &.error {
    color: #f56c6c;
    background: #fef0f0;
  }
}
</style>