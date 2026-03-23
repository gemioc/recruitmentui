<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon device">
              <el-icon :size="32"><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.deviceCount || 0 }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="online">在线: {{ statistics.onlineCount || 0 }}</span>
            <span class="offline">离线: {{ statistics.offlineCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon job">
              <el-icon :size="32"><Briefcase /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.jobCount || 0 }}</div>
              <div class="stat-label">职位总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日新增: {{ statistics.todayJobCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon poster">
              <el-icon :size="32"><Picture /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.posterCount || 0 }}</div>
              <div class="stat-label">海报总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日生成: {{ statistics.todayPosterCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon push">
              <el-icon :size="32"><Promotion /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pushCount || 0 }}</div>
              <div class="stat-label">推送次数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日推送: {{ statistics.todayPushCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>推送趋势</span>
              <el-radio-group v-model="pushChartType" size="small">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="pushChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div ref="deviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <span>内容类型分布</span>
          </template>
          <div ref="contentChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近推送记录</span>
              <el-button type="primary" link @click="router.push('/push/record')">
                查看更多
              </el-button>
            </div>
          </template>
          <el-table :data="recentPushRecords" style="width: 100%">
            <el-table-column prop="contentTitle" label="内容" min-width="120" />
            <el-table-column prop="deviceNames" label="目标设备" min-width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getPushStatistics, getDeviceStatistics, getContentStatistics } from '@/api/statistics'
import { getPushRecords } from '@/api/push'

const router = useRouter()

// 统计数据
const statistics = ref({
  deviceCount: 0,
  onlineCount: 0,
  offlineCount: 0,
  jobCount: 0,
  todayJobCount: 0,
  posterCount: 0,
  todayPosterCount: 0,
  pushCount: 0,
  todayPushCount: 0
})

// 最近推送记录
const recentPushRecords = ref([])

// 图表
const pushChartRef = ref(null)
const deviceChartRef = ref(null)
const contentChartRef = ref(null)
let pushChart = null
let deviceChart = null
let contentChart = null

const pushChartType = ref('week')

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const [pushRes, deviceRes, contentRes] = await Promise.all([
      getPushStatistics({ type: pushChartType.value }),
      getDeviceStatistics(),
      getContentStatistics()
    ])

    // 更新统计卡片数据
    if (deviceRes.data) {
      statistics.value.deviceCount = deviceRes.data.total || 0
      statistics.value.onlineCount = deviceRes.data.online || 0
      statistics.value.offlineCount = deviceRes.data.offline || 0
    }

    if (pushRes.data) {
      statistics.value.pushCount = pushRes.data.total || 0
      statistics.value.todayPushCount = pushRes.data.today || 0
      updatePushChart(pushRes.data.trend || [])
    }

    if (contentRes.data) {
      statistics.value.jobCount = contentRes.data.jobCount || 0
      statistics.value.todayJobCount = contentRes.data.todayJobCount || 0
      statistics.value.posterCount = contentRes.data.posterCount || 0
      statistics.value.todayPosterCount = contentRes.data.todayPosterCount || 0
      updateContentChart(contentRes.data.typeDistribution || [])
    }

    // 更新设备图表
    updateDeviceChart(deviceRes.data?.statusDistribution || [])
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取最近推送记录
const fetchRecentPushRecords = async () => {
  try {
    const res = await getPushRecords({ page: 1, size: 5 })
    recentPushRecords.value = res.data.records || []
  } catch (error) {
    console.error('获取推送记录失败:', error)
  }
}

// 初始化推送趋势图表
const initPushChart = () => {
  if (!pushChartRef.value) return
  pushChart = echarts.init(pushChartRef.value)
  pushChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['海报推送', '视频推送']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '海报推送',
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        data: []
      },
      {
        name: '视频推送',
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        data: []
      }
    ]
  })
}

// 初始化设备状态图表
const initDeviceChart = () => {
  if (!deviceChartRef.value) return
  deviceChart = echarts.init(deviceChartRef.value)
  deviceChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: []
      }
    ]
  })
}

// 初始化内容类型图表
const initContentChart = () => {
  if (!contentChartRef.value) return
  contentChart = echarts.init(contentChartRef.value)
  contentChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['职位', '海报', '视频']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        barWidth: '40%',
        data: [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  })
}

// 更新推送趋势图表
const updatePushChart = (data) => {
  if (!pushChart) return
  const dates = data.map(item => item.date)
  const posterData = data.map(item => item.posterCount)
  const videoData = data.map(item => item.videoCount)
  pushChart.setOption({
    xAxis: { data: dates },
    series: [
      { data: posterData },
      { data: videoData }
    ]
  })
}

// 更新设备状态图表
const updateDeviceChart = (data) => {
  if (!deviceChart) return
  const chartData = data.map(item => ({
    value: item.count,
    name: item.name
  }))
  deviceChart.setOption({
    series: [{ data: chartData }]
  })
}

// 更新内容类型图表
const updateContentChart = (data) => {
  if (!contentChart) return
  contentChart.setOption({
    series: [{
      data: [
        data.find(item => item.type === 'job')?.count || 0,
        data.find(item => item.type === 'poster')?.count || 0,
        data.find(item => item.type === 'video')?.count || 0
      ]
    }]
  })
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  pushChart?.resize()
  deviceChart?.resize()
  contentChart?.resize()
}

// 监听图表类型变化
watch(pushChartType, () => {
  fetchStatistics()
})

onMounted(() => {
  initPushChart()
  initDeviceChart()
  initContentChart()
  fetchStatistics()
  fetchRecentPushRecords()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pushChart?.dispose()
  deviceChart?.dispose()
  contentChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
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

        &.device {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.job {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.poster {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.push {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-info {
        flex: 1;

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

    .stat-footer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #ebeef5;
      font-size: 13px;
      color: #909399;

      span {
        margin-right: 15px;

        &.online {
          color: #67c23a;
        }

        &.offline {
          color: #f56c6c;
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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>