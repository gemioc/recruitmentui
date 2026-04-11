<template>
  <div class="login-container">
    <div class="login-box">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo" v-if="!systemLogo">
          <el-icon :size="40"><Monitor /></el-icon>
        </div>
        <img v-else :src="getFileUrl(systemLogo)" class="logo-img" />
        <h2>{{ systemName }}</h2>
        <p class="subtitle">后台管理系统</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部信息 -->
      <div class="login-footer">
        <p>© 2024 {{ systemName }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { getSystemConfig } from '@/api/config'
import { getFileUrl } from '@/utils/file'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 系统配置
const systemName = ref(localStorage.getItem('systemName') || '电视招聘展示系统')
const systemLogo = ref(localStorage.getItem('systemLogo') || '')

// 表单引用
const formRef = ref(null)
// 加载状态
const loading = ref(false)
// 记住密码
const rememberMe = ref(false)

// 表单数据
const form = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

/**
 * 登录处理
 */
const handleLogin = async () => {
  // 表单验证
  await formRef.value.validate()

  loading.value = true
  try {
    // 调用登录接口
    await userStore.login(form)

    // 记住密码
    if (rememberMe.value) {
      localStorage.setItem('remember_username', form.username)
      localStorage.setItem('remember_password', btoa(form.password))
    } else {
      localStorage.removeItem('remember_username')
      localStorage.removeItem('remember_password')
    }

    ElMessage.success('登录成功')

    // 跳转到目标页面或首页
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取系统配置
const fetchSystemConfig = async () => {
  try {
    const res = await getSystemConfig()
    if (res.data) {
      const data = res.data
      const name = data.system_name || '电视招聘展示系统'
      const logo = data.company_logo || ''
      localStorage.setItem('systemName', name)
      localStorage.setItem('systemLogo', logo)
      systemName.value = name
      systemLogo.value = logo
    }
  } catch (error) {
    console.error('获取系统配置失败:', error)
  }
}

// 初始化
onMounted(() => {
  // 读取记住的账号密码
  const username = localStorage.getItem('remember_username')
  const password = localStorage.getItem('remember_password')
  if (username && password) {
    form.username = username
    form.password = atob(password)
    rememberMe.value = true
  }
  // 获取系统配置
  fetchSystemConfig()
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .logo {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    color: #fff;
    margin-bottom: 15px;
  }

  .logo-img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    margin-bottom: 15px;
    object-fit: contain;
  }

  h2 {
    color: #303133;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #909399;
    font-size: 14px;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
  }
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  color: #909399;
  font-size: 12px;
}
</style>
