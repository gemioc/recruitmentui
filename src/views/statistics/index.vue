<template>
  <div class="statistics-container">
    <!-- 筛选条件 -->
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon push">
              <el-icon :size="32"><Promotion /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalPush || 0 }}</div>
              <div class="stat-label">推送总次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.successPush || 0 }}</div>
              <div class="stat-label">推送成功</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon fail">
              <el-icon :size="32"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.failPush || 0 }}</div>
              <div class="stat-label">推送失败</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rate">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.successRate || 0 }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>推送趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>内容类型分布</span>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>设备推送排行</span>
          </template>
          <div ref="deviceRankChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>时段分布</span>
          </template>
          <div ref="hourChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getPushStatistics, getDeviceStatistics } from '@/api/statistics'
import { ElMessage } from 'element-plus'

// 时间范围
const dateRange = ref([])
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  }
]

// 统计数据
const statistics = ref({
  totalPush: 0,
  successPush: 0,
  failPush: 0,
  successRate: 0
})

// 图表引用
const trendChartRef = ref(null)
const typeChartRef = ref(null)
const deviceRankChartRef = ref(null)
const hourChartRef = ref(null)

let trendChart = null
let typeChart = null
let deviceRankChart = null
let hourChart = null

// 初始化图表
const initCharts = () => {
  // 推送趋势图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['推送次数', '成功次数'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name: '推送次数', type: 'line', smooth: true, data: [] },
        { name: '成功次数', type: 'line', smooth: true, data: [] }
      ]
    })
  }

  // 内容类型分布图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    typeChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: []
      }]
    })
  }

  // 设备推送排行图
  if (deviceRankChartRef.value) {
    deviceRankChart = echarts.init(deviceRankChartRef.value)
    deviceRankChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: [] },
      series: [{ type: 'bar', data: [] }]
    })
  }

  // 时段分布图
  if (hourChartRef.value) {
    hourChart = echarts.init(hourChartRef.value)
    hourChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [] }]
    })
  }
}

// 更新图表
const updateCharts = (data) => {
  if (trendChart && data.trend) {
    trendChart.setOption({
      xAxis: { data: data.trend.map(item => item.date) },
      series: [
        { data: data.trend.map(item => item.total) },
        { data: data.trend.map(item => item.success) }
      ]
    })
  }

  if (typeChart && data.typeDistribution) {
    typeChart.setOption({
      series: [{
        data: data.typeDistribution.map(item => ({
          value: item.count,
          name: item.type === 'poster' ? '海报' : '视频'
        }))
      }]
    })
  }

  if (deviceRankChart && data.deviceRank) {
    deviceRankChart.setOption({
      yAxis: { data: data.deviceRank.map(item => item.name).reverse() },
      series: [{ data: data.deviceRank.map(item => item.count).reverse() }]
    })
  }

  if (hourChart && data.hourDistribution) {
    hourChart.setOption({
      series: [{ data: data.hourDistribution }]
    })
  }
}

// 获取数据
const fetchData = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getPushStatistics(params)
    if (res.data) {
      statistics.value = {
        totalPush: res.data.total || 0,
        successPush: res.data.success || 0,
        failPush: res.data.fail || 0,
        successRate: res.data.total > 0
          ? Math.round((res.data.success / res.data.total) * 100)
          : 0
      }
      updateCharts(res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 窗口大小变化
const handleResize = () => {
  trendChart?.resize()
  typeChart?.resize()
  deviceRankChart?.resize()
  hourChart?.resize()
}

onMounted(() => {
  initCharts()
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  typeChart?.dispose()
  deviceRankChart?.dispose()
  hourChart?.dispose()
})
</script>

<style lang="scss" scoped>
.statistics-container {
  .filter-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding-bottom: 0;
    }
  }

  .stat-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        margin-right: 15px;

        &.push {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.success {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        &.fail {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.rate {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 20px;
  }

  .chart-container {
    height: 300px;
  }
}
</style>