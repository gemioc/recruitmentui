<template>
  <div class="profile-container">
    <el-card shadow="never">
      <template #header>
        <span class="card-title">个人信息</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userInfo.username }}
        </el-descriptions-item>
        <el-descriptions-item label="真实姓名">
          {{ userInfo.realName }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ userInfo.roleName }}
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">
          {{ formatDate(userInfo.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <template #header>
        <span class="card-title">账号安全</span>
      </template>

      <div class="security-item">
        <div class="security-info">
          <div class="security-label">登录密码</div>
          <div class="security-desc">定期修改密码可以提高账号安全性</div>
        </div>
        <el-button type="primary" link @click="showPasswordDialog = true">修改</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <template #header>
        <span class="card-title">系统信息</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">
          v1.0.0
        </el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          {{ formatDate(userInfo.lastLoginTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserInfo, updatePassword } from '@/api/auth'
import { formatDate } from '@/utils/format'

const userInfo = ref({})
const showPasswordDialog = ref(false)
const loading = ref(false)
const passwordFormRef = ref(null)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    userInfo.value = res.data || {}
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const handleChangePassword = async () => {
  await passwordFormRef.value.validate()
  loading.value = true
  try {
    await updatePassword({
      oldPassword: btoa(passwordForm.oldPassword),
      newPassword: btoa(passwordForm.newPassword)
    })
    ElMessage.success('密码修改成功')
    showPasswordDialog.value = false
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: calc(100vh - 60px);
  background: #f0f2f5;
  padding: 20px;

  .card-title {
    font-weight: 600;
  }

  .mt-20 {
    margin-top: 20px;
  }

  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;

    .security-info {
      .security-label {
        font-size: 14px;
        color: #303133;
      }

      .security-desc {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}
</style>
