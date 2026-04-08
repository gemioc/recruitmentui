<template>
  <div class="statistics-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <h2 class="page-title">数据统计</h2>
        <div class="filter-group">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            style="width: 260px"
            @change="handleDateRangeChange"
          />
          <el-radio-group v-model="timeDimension" size="default" @change="handleTimeDimensionChange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
      <div class="filter-right">
        <el-dropdown trigger="click" @command="handleExportCommand">
          <el-button type="primary">
            <el-icon><Download /></el-icon>
            导出报表
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="records">导出推送记录</el-dropdown-item>
              <el-dropdown-item command="report">导出统计报表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 核心指标卡片 - 实时数据，不受筛选影响 -->
    <div class="metrics-section">
      <div class="metric-card clickable" @click="goToPushRecords()">
        <div class="metric-icon primary">
          <el-icon :size="24"><Promotion /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ statistics.totalPush || 0 }}</div>
          <div class="metric-label">推送总次数</div>
        </div>
      </div>

      <div class="metric-card clickable" @click="goToPushRecords(1)">
        <div class="metric-icon success">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ statistics.successPush || 0 }}</div>
          <div class="metric-label">推送成功</div>
        </div>
        <div class="metric-footer">
          <el-progress
            :percentage="statistics.successRate || 0"
            :stroke-width="4"
            :show-text="false"
            color="#52c41a"
          />
          <span class="metric-percent">{{ statistics.successRate || 0 }}%</span>
        </div>
      </div>

      <div class="metric-card clickable" @click="goToPushRecords(2)">
        <div class="metric-icon danger">
          <el-icon :size="24"><CircleClose /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ statistics.failPush || 0 }}</div>
          <div class="metric-label">推送失败</div>
        </div>
        <div class="metric-footer" v-if="statistics.failPush > 0">
          <el-tag type="danger" size="small" effect="plain">需关注</el-tag>
        </div>
      </div>

      <div class="metric-card clickable" @click="goToDevices">
        <div class="metric-icon info">
          <el-icon :size="24"><Monitor /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-value">
            {{ deviceStats.onlineCount || 0 }}
            <span class="unit">/{{ deviceStats.totalDevices || 0 }}</span>
          </div>
          <div class="metric-label">在线设备</div>
        </div>
        <div class="metric-footer">
          <span class="online-indicator"></span>
          <span class="online-text">实时在线</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧图表区 -->
      <div class="charts-area">
        <!-- 推送趋势 -->
        <el-card shadow="hover" class="chart-card trend-card">
          <template #header>
            <span class="card-title">
              <el-icon><TrendCharts /></el-icon>
              推送趋势
            </span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
          <div class="chart-empty" style="display: none;">
            <el-icon><DataAnalysis /></el-icon>
            <span>暂无数据</span>
          </div>
        </el-card>

        <!-- 内容分布 & 时段分布 -->
        <div class="charts-row">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <span class="card-title">
                <el-icon><PieChart /></el-icon>
                内容类型分布
              </span>
            </template>
            <div ref="typeChartRef" class="chart-container small"></div>
            <div class="chart-empty" style="display: none;">
              <el-icon><DataAnalysis /></el-icon>
              <span>暂无数据</span>
            </div>
          </el-card>

          <el-card shadow="hover" class="chart-card">
            <template #header>
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                时段分布
              </span>
            </template>
            <div ref="hourChartRef" class="chart-container small"></div>
            <div class="chart-empty" style="display: none;">
              <el-icon><DataAnalysis /></el-icon>
              <span>暂无数据</span>
            </div>
          </el-card>
        </div>

        <!-- 设备推送排行 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><Histogram /></el-icon>
              设备推送排行 TOP 10
            </span>
          </template>
          <div ref="deviceRankChartRef" class="chart-container rank"></div>
          <div class="chart-empty" style="display: none;">
            <el-icon><DataAnalysis /></el-icon>
            <span>暂无数据</span>
          </div>
        </el-card>
      </div>

      <!-- 右侧设备状态面板 -->
      <div class="device-panel">
        <el-card shadow="hover" class="device-card">
          <template #header>
            <span class="card-title">
              <el-icon><Monitor /></el-icon>
              设备状态
            </span>
          </template>

          <div class="device-summary">
            <div class="summary-item online">
              <span class="summary-dot"></span>
              <span class="summary-label">在线</span>
              <span class="summary-value">{{ deviceStats.onlineCount || 0 }}</span>
            </div>
            <div class="summary-item offline">
              <span class="summary-dot"></span>
              <span class="summary-label">离线</span>
              <span class="summary-value">{{ deviceStats.offlineCount || 0 }}</span>
            </div>
          </div>

          <div class="device-list">
            <el-scrollbar height="calc(100vh - 520px)">
              <div
                v-for="device in deviceStats.deviceStatusList"
                :key="device.id"
                class="device-item"
              >
                <div class="device-header">
                  <span class="device-name">{{ device.name }}</span>
                  <el-tag
                    :type="device.onlineStatus === 1 ? 'success' : 'danger'"
                    size="small"
                    effect="dark"
                  >
                    {{ device.onlineStatusText }}
                  </el-tag>
                </div>
                <div class="device-info">
                  <span class="device-code">{{ device.deviceCode }}</span>
                  <span class="push-count">{{ device.pushCount || '-' }}</span>
                </div>
                <div class="device-duration" v-if="device.totalOnlineDurationText">
                  在线时长: {{ device.totalOnlineDurationText }}
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  getPushStatistics,
  getDeviceStatusStatistics,
  exportPushRecords,
  exportStatistics
} from '@/api/statistics'

const router = useRouter()

// 时间范围
const dateRange = ref([])
const timeDimension = ref('week')
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

// 查询参数 - 只影响图表
const queryParams = reactive({
})

// 实时统计数据 - 卡片使用，不受筛选影响
const statistics = ref({
  totalPush: 0,
  successPush: 0,
  failPush: 0,
  successRate: 0
})

// 设备状态统计 - 实时数据
const deviceStats = ref({})

// 图表引用
const trendChartRef = ref(null)
const typeChartRef = ref(null)
const deviceRankChartRef = ref(null)
const hourChartRef = ref(null)

let trendChart = null
let typeChart = null
let deviceRankChart = null
let hourChart = null

// 定时刷新定时器
let refreshTimer = null

// 初始化图表
const initCharts = () => {
  // 推送趋势图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: { color: '#606266' }
      },
      legend: {
        data: ['推送次数', '成功次数', '失败次数'],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisLabel: { color: '#909399' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#909399' }
      },
      series: [
        {
          name: '推送次数',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#409eff' },
          itemStyle: { color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' }
            ])
          }
        },
        {
          name: '成功次数',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#67c23a' },
          itemStyle: { color: '#67c23a' }
        },
        {
          name: '失败次数',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#f56c6c' },
          itemStyle: { color: '#f56c6c' }
        }
      ]
    })
  }

  // 内容类型分布图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    typeChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: { color: '#606266' },
        confine: true,
        extraCssText: 'max-width: 200px; white-space: normal;'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
          formatter: '{b}\n{c} ({d}%)'
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#303133' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.1)' }
        },
        data: [],
        color: ['#409eff', '#67c23a']
      }]
    })
  }

  // 设备推送排行图
  if (deviceRankChartRef.value) {
    deviceRankChart = echarts.init(deviceRankChartRef.value)
    deviceRankChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: { color: '#606266' }
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#909399' }
      },
      yAxis: {
        type: 'category',
        data: [],
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisTick: { show: false },
        axisLabel: { color: '#606266' }
      },
      series: [{
        type: 'bar',
        data: [],
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      }]
    })
  }

  // 时段分布图
  if (hourChartRef.value) {
    hourChart = echarts.init(hourChartRef.value)
    hourChart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: { color: '#606266' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}时`),
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisLabel: { color: '#909399', interval: 3 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#909399' }
      },
      series: [{
        type: 'bar',
        data: [],
        barWidth: 12,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4facfe' },
            { offset: 1, color: '#00f2fe' }
          ])
        }
      }]
    })
  }
}

// 更新图表
const updateCharts = (data) => {
  if (trendChart && data.trend) {
    const hasData = data.trend && data.trend.length > 0 && data.trend.some(item => item.total > 0 || item.success > 0 || item.fail > 0)
    trendChart.setOption({
      xAxis: { data: data.trend.map(item => item.date) },
      series: [
        { data: data.trend.map(item => item.total) },
        { data: data.trend.map(item => item.success) },
        { data: data.trend.map(item => item.fail) }
      ]
    })
    trendChartRef.value.style.display = hasData ? 'block' : 'none'
    trendChartRef.value.nextElementSibling.style.display = hasData ? 'none' : 'flex'
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
    const hasData = data.deviceRank && data.deviceRank.length > 0
    deviceRankChart.setOption({
      yAxis: { data: data.deviceRank.map(item => item.name).reverse() },
      series: [{ data: data.deviceRank.map(item => item.count).reverse() }]
    })
    deviceRankChartRef.value.style.display = hasData ? 'block' : 'none'
    deviceRankChartRef.value.nextElementSibling.style.display = hasData ? 'none' : 'flex'
  }

  if (hourChart && data.hourDistribution) {
    const hasHourData = data.hourDistribution && data.hourDistribution.some(v => v > 0)
    hourChart.setOption({
      series: [{ data: data.hourDistribution }]
    })
    hourChartRef.value.style.display = hasHourData ? 'block' : 'none'
    hourChartRef.value.nextElementSibling.style.display = hasHourData ? 'none' : 'flex'
  }
}

// 获取实时统计 - 用于卡片，不受筛选影响
const fetchRealTimeStatistics = async () => {
  try {
    // 获取全量统计数据
    const res = await getPushStatistics({ type: 'all' })
    if (res.data) {
      statistics.value = {
        totalPush: res.data.total || 0,
        successPush: res.data.success || 0,
        failPush: res.data.fail || 0,
        successRate: res.data.total > 0
          ? Math.round((res.data.success / res.data.total) * 100)
          : 0
      }
    }
  } catch (error) {
    console.error('获取实时统计失败:', error)
  }
}

// 获取图表统计数据 - 受筛选条件影响
const fetchChartStatistics = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.type = 'range'
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    } else {
      params.type = timeDimension.value
    }

    const res = await getPushStatistics(params)
    if (res.data) {
      updateCharts(res.data)
    }
  } catch (error) {
    console.error('获取图表统计失败:', error)
  }
}

// 获取设备状态统计 - 实时数据，不受筛选影响
const fetchDeviceStats = async () => {
  try {
    const res = await getDeviceStatusStatistics({})
    deviceStats.value = res.data || {}
  } catch (error) {
    console.error('获取设备状态统计失败:', error)
  }
}

// 跳转到推送记录
const goToPushRecords = (status) => {
  const query = {}
  if (status !== undefined) {
    query.status = status
  }
  router.push({ path: '/push/record', query })
}

// 跳转到设备管理
const goToDevices = () => {
  router.push('/device/list')
}

// 切换时间维度，清空日期区间
const handleTimeDimensionChange = () => {
  dateRange.value = []
  fetchChartStatistics()
}

// 选择日期区间，清空时间维度
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    timeDimension.value = ''
  }
  fetchChartStatistics()
}

// 重置
const handleReset = () => {
  dateRange.value = []
  timeDimension.value = 'week'
  fetchChartStatistics()
}

// 导出命令处理
const handleExportCommand = (command) => {
  if (command === 'records') {
    handleExportRecords()
  } else if (command === 'report') {
    handleExportReport()
  }
}

// 导出推送记录
const handleExportRecords = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await exportPushRecords(params)
    downloadFile(res.data, '推送记录.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 导出统计报表
const handleExportReport = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await exportStatistics(params)
    downloadFile(res.data, '统计报表.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 下载文件
const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
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
  // 卡片数据 - 实时统计（不受推送趋势筛选影响，每30秒刷新）
  fetchRealTimeStatistics()
  fetchDeviceStats()
  refreshTimer = setInterval(() => {
    fetchRealTimeStatistics()
    fetchDeviceStats()
  }, 30000)
  // 图表数据 - 受筛选影响
  fetchChartStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  trendChart?.dispose()
  typeChart?.dispose()
  deviceRankChart?.dispose()
  hourChart?.dispose()
})

// 页面激活时刷新数据
onActivated(() => {
  fetchRealTimeStatistics()
  fetchDeviceStats()
  fetchChartStatistics()
})
</script>

<style lang="scss" scoped>
.statistics-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

// 顶部筛选栏
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

// 核心指标卡片
.metrics-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &.clickable {
    cursor: pointer;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    &.primary { background: linear-gradient(135deg, #409eff, #66b1ff); color: #fff; }
    &.success { background: linear-gradient(135deg, #67c23a, #85ce61); color: #fff; }
    &.danger { background: linear-gradient(135deg, #f56c6c, #f89898); color: #fff; }
    &.info { background: linear-gradient(135deg, #909399, #b4b4b4); color: #fff; }
  }

  .metric-body {
    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;

      .unit {
        font-size: 16px;
        font-weight: 400;
        color: #909399;
      }
    }

    .metric-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .metric-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;

    .el-progress {
      flex: 1;
    }

    .metric-percent {
      font-size: 14px;
      font-weight: 600;
      color: #52c41a;
    }

    .metric-time {
      font-size: 12px;
      color: #909399;
    }

    .online-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #52c41a;
      animation: pulse 2s infinite;
    }

    .online-text {
      font-size: 12px;
      color: #52c41a;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 主内容区
.main-content {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
}

// 图表区域
.charts-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;

    .el-icon {
      color: #409eff;
    }
  }

  .card-tip {
    font-size: 12px;
    color: #909399;
    background: #f5f7fa;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .chart-container {
    height: 280px;

    &.small {
      height: 200px;
    }

    &.rank {
      height: 260px;
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

// 设备面板
.device-panel {
  .device-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    height: 100%;

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .device-summary {
    display: flex;
    padding: 16px 20px;
    gap: 32px;
    border-bottom: 1px solid #f0f0f0;

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .summary-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      &.online .summary-dot { background: #52c41a; }
      &.offline .summary-dot { background: #f5222d; }

      .summary-label {
        font-size: 13px;
        color: #909399;
      }

      .summary-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .device-list {
    .device-item {
      padding: 12px 20px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f7fa;
      }

      &.active {
        background: #ecf5ff;
        border-left: 3px solid #409eff;
      }

      .device-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .device-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
      }

      .device-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .device-code {
          font-size: 12px;
          color: #909399;
        }

        .push-count {
          font-size: 12px;
          color: #909399;
        }
      }

      .device-duration {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}
</style>