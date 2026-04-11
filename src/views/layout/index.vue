<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo-container" :class="{ collapsed: isCollapse }">
        <img v-if="systemLogo" :src="getFileUrl(systemLogo)" class="logo-img" />
        <el-icon v-else :size="28"><Monitor /></el-icon>
        <span v-show="!isCollapse" class="title">{{ systemName }}</span>
      </div>

      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <!-- 首页 -->
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <!-- 职位管理 -->
          <el-menu-item index="/job">
            <el-icon><Briefcase /></el-icon>
            <span>职位管理</span>
          </el-menu-item>

          <!-- 设备管理 -->
          <el-sub-menu index="/device">
            <template #title>
              <el-icon><Monitor /></el-icon>
              <span>设备管理</span>
            </template>
            <el-menu-item index="/device/list">设备列表</el-menu-item>
            <el-menu-item index="/device/group">设备分组</el-menu-item>
            <!-- 实时监控已隐藏，可通过 /device/monitor URL 访问 -->
            <!-- <el-menu-item index="/device/monitor">实时监控</el-menu-item> -->
          </el-sub-menu>

          <!-- 海报管理 -->
          <el-sub-menu index="/poster">
            <template #title>
              <el-icon><Picture /></el-icon>
              <span>海报管理</span>
            </template>
            <el-menu-item index="/poster/list">海报列表</el-menu-item>
            <el-menu-item index="/poster/generate">生成海报</el-menu-item>
          </el-sub-menu>

          <!-- 视频管理 -->
          <el-menu-item index="/video">
            <el-icon><VideoCamera /></el-icon>
            <span>视频管理</span>
          </el-menu-item>

          <!-- 内容推送 -->
          <el-sub-menu index="/push">
            <template #title>
              <el-icon><Promotion /></el-icon>
              <span>内容推送</span>
            </template>
            <el-menu-item index="/push/content">推送内容</el-menu-item>
            <el-menu-item index="/push/record">推送记录</el-menu-item>
          </el-sub-menu>

          <!-- 数据统计 -->
          <el-menu-item index="/statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </el-menu-item>

          <!-- 操作日志 - 仅管理员 -->
          <el-menu-item v-if="userStore.isAdmin" index="/log">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>

          <!-- 用户管理 - 仅管理员 -->
          <el-menu-item v-if="userStore.isAdmin" index="/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

          <!-- 系统配置 - 仅管理员 -->
          <el-menu-item v-if="userStore.isAdmin" index="/config">
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="layout-main">
      <!-- 顶部栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" class="avatar">
                {{ userStore.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="name">{{ userStore.realName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
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
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { updatePassword } from '@/api/auth'
import { getFileUrl } from '@/utils/file'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

// 侧边栏折叠状态
const isCollapse = computed(() => appStore.isCollapsed)

// 系统名称和Logo
const systemName = ref(localStorage.getItem('systemName') || '招聘展示系统')
const systemLogo = ref(localStorage.getItem('systemLogo') || '')

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 面包屑
const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta?.title)
})

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}

// 修改密码
const passwordDialogVisible = ref(false)
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

const handleChangePassword = async () => {
  await passwordFormRef.value.validate()
  try {
    // Base64编码密码
    await updatePassword({
      oldPassword: btoa(passwordForm.oldPassword),
      newPassword: btoa(passwordForm.newPassword)
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    // 重置表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败:', error)
  }
}

// 监听系统名称变化事件
const updateSystemName = (e) => {
  systemName.value = localStorage.getItem('systemName') || '招聘展示系统'
  systemLogo.value = localStorage.getItem('systemLogo') || ''
}

onMounted(() => {
  window.addEventListener('systemNameChange', updateSystemName)
})

onUnmounted(() => {
  window.removeEventListener('systemNameChange', updateSystemName)
})
</script>

<style lang="scss" scoped>
.layout-container {
  min-height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;

  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .title {
      margin-left: 10px;
      white-space: nowrap;
    }

    .logo-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    &.collapsed {
      justify-content: center;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.layout-main {
  background-color: #f0f2f5;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 15px;

      &:hover {
        color: #409EFF;
      }
    }
  }

  .header-right {
    .user-dropdown {
      display: flex;
      align-items: center;
      cursor: pointer;

      .avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin-right: 8px;
      }

      .name {
        margin-right: 5px;
      }
    }
  }
}

.layout-content {
  padding: 20px;
  min-height: calc(100vh - 60px);
}
</style>