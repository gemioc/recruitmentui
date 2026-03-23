<template>
  <div class="error-page">
    <div class="error-content">
      <h1>403</h1>
      <h2>无访问权限</h2>
      <p>抱歉，您没有权限访问此页面</p>
      <el-button type="primary" @click="goBack">返回上一页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
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
    color: #F56C6C;
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