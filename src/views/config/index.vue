<template>
  <div class="config-container">
    <el-card shadow="never">
      <el-form
        ref="basicFormRef"
        :model="basicConfig"
        label-width="120px"
        class="config-form"
      >
        <el-form-item label="系统名称">
          <el-input v-model="basicConfig.systemName" placeholder="请输入系统名称" />
        </el-form-item>
        <el-form-item label="系统Logo">
          <el-upload
            class="logo-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            accept="image/*"
          >
            <img v-if="basicConfig.logo" :src="basicConfig.logo" class="logo-image" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveBasicConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import { getSystemConfig, updateSystemConfig } from '@/api/config'

const uploadUrl = '/api/config/logo'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

// 基础配置
const basicConfig = reactive({
  systemName: '电视招聘展示系统',
  logo: ''
})

// Logo上传成功
const handleLogoSuccess = (response) => {
  if (response.code === 200) {
    basicConfig.logo = response.data
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 获取配置
const fetchConfig = async () => {
  try {
    const res = await getSystemConfig()
    if (res.data) {
      const data = res.data
      basicConfig.systemName = data.system_name || '电视招聘展示系统'
      basicConfig.logo = data.company_logo || ''
      localStorage.setItem('systemName', basicConfig.systemName)
      localStorage.setItem('systemLogo', basicConfig.logo)
      document.title = basicConfig.systemName
      updateFavicon(basicConfig.logo)
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

// 更新favicon
const updateFavicon = (logoUrl) => {
  if (logoUrl) {
    const favicon = document.getElementById('favicon-link')
    if (favicon) {
      favicon.href = logoUrl
    }
  }
}

// 保存基础配置
const saveBasicConfig = async () => {
  try {
    await updateSystemConfig({
      system_name: basicConfig.systemName,
      company_logo: basicConfig.logo
    })
    localStorage.setItem('systemName', basicConfig.systemName)
    localStorage.setItem('systemLogo', basicConfig.logo)
    document.title = basicConfig.systemName
    updateFavicon(basicConfig.logo)
    window.dispatchEvent(new CustomEvent('systemNameChange', { detail: basicConfig.systemName }))
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchConfig()
})
</script>

<style lang="scss" scoped>
.config-container {
  .config-form {
    max-width: 600px;
  }

  .logo-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }

    .logo-image {
      width: 120px;
      height: 60px;
      display: block;
      object-fit: contain;
    }

    .logo-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 120px;
      height: 60px;
      text-align: center;
      line-height: 60px;
    }
  }
}
</style>
