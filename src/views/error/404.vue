<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.error-content {
  text-align: center;

  h1 {
    font-size: 120px;
    font-weight: 600;
    color: #409EFF;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    color: #303133;
    margin-bottom: 10px;
  }

  p {
    color: #909399;
    margin-bottom: 30px;
  }
}
</style>