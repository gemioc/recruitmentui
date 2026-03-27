<template>
  <div class="config-container">
    <el-tabs v-model="activeTab">
      <!-- 基础配置 -->
      <el-tab-pane label="基础配置" name="basic">
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
            <el-form-item label="版权信息">
              <el-input v-model="basicConfig.copyright" placeholder="请输入版权信息" />
            </el-form-item>
            <el-form-item label="ICP备案号">
              <el-input v-model="basicConfig.icp" placeholder="请输入ICP备案号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 存储配置 -->
      <el-tab-pane label="存储配置" name="storage">
        <el-card shadow="never">
          <el-form
            :model="storageConfig"
            label-width="120px"
            class="config-form"
          >
            <el-form-item label="存储方式">
              <el-radio-group v-model="storageConfig.storageType">
                <el-radio label="local">本地存储</el-radio>
                <el-radio label="oss">OSS云存储</el-radio>
              </el-radio-group>
            </el-form-item>

            <template v-if="storageConfig.storageType === 'local'">
              <el-form-item label="存储路径">
                <el-input v-model="storageConfig.localPath" placeholder="如: D:/tv-files" />
              </el-form-item>
              <el-form-item label="访问域名">
                <el-input v-model="storageConfig.localDomain" placeholder="如: http://localhost:8080/files" />
              </el-form-item>
            </template>

            <template v-if="storageConfig.storageType === 'oss'">
              <el-form-item label="Endpoint">
                <el-input v-model="storageConfig.ossEndpoint" placeholder="OSS Endpoint" />
              </el-form-item>
              <el-form-item label="Bucket名称">
                <el-input v-model="storageConfig.ossBucket" placeholder="Bucket名称" />
              </el-form-item>
              <el-form-item label="AccessKey">
                <el-input v-model="storageConfig.ossAccessKey" placeholder="AccessKey" />
              </el-form-item>
              <el-form-item label="SecretKey">
                <el-input v-model="storageConfig.ossSecretKey" type="password" placeholder="SecretKey" show-password />
              </el-form-item>
            </template>

            <el-form-item>
              <el-button type="primary" @click="saveStorageConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 推送配置 -->
      <el-tab-pane label="推送配置" name="push">
        <el-card shadow="never">
          <el-form
            :model="pushConfig"
            label-width="120px"
            class="config-form"
          >
            <el-form-item label="默认播放时长">
              <el-input-number v-model="pushConfig.defaultDuration" :min="1" :max="3600" />
              <span class="unit">秒</span>
            </el-form-item>
            <el-form-item label="推送重试次数">
              <el-input-number v-model="pushConfig.retryCount" :min="0" :max="5" />
            </el-form-item>
            <el-form-item label="推送超时时间">
              <el-input-number v-model="pushConfig.timeout" :min="5" :max="60" />
              <span class="unit">秒</span>
            </el-form-item>
            <el-form-item label="离线设备处理">
              <el-select v-model="pushConfig.offlineAction" style="width: 200px">
                <el-option label="跳过离线设备" value="skip" />
                <el-option label="等待设备上线后推送" value="wait" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePushConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 安全配置 -->
      <el-tab-pane label="安全配置" name="security">
        <el-card shadow="never">
          <el-form
            :model="securityConfig"
            label-width="150px"
            class="config-form"
          >
            <el-form-item label="登录验证码">
              <el-switch v-model="securityConfig.captchaEnabled" />
            </el-form-item>
            <el-form-item label="Token有效期">
              <el-input-number v-model="securityConfig.tokenExpire" :min="1" :max="72" />
              <span class="unit">小时</span>
            </el-form-item>
            <el-form-item label="密码最小长度">
              <el-input-number v-model="securityConfig.passwordMinLength" :min="6" :max="20" />
            </el-form-item>
            <el-form-item label="密码复杂度要求">
              <el-checkbox-group v-model="securityConfig.passwordRules">
                <el-checkbox label="number">包含数字</el-checkbox>
                <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                <el-checkbox label="special">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="登录失败锁定次数">
              <el-input-number v-model="securityConfig.loginFailLock" :min="3" :max="10" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecurityConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import { getSystemConfig, updateSystemConfig } from '@/api/config'

const activeTab = ref('basic')

const uploadUrl = '/api/upload/image'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

// 基础配置
const basicConfig = reactive({
  systemName: '电视招聘展示系统',
  logo: '',
  copyright: '',
  icp: ''
})

// 存储配置
const storageConfig = reactive({
  storageType: 'local',
  localPath: '',
  localDomain: '',
  ossEndpoint: '',
  ossBucket: '',
  ossAccessKey: '',
  ossSecretKey: ''
})

// 推送配置
const pushConfig = reactive({
  defaultDuration: 30,
  retryCount: 3,
  timeout: 30,
  offlineAction: 'skip'
})

// 安全配置
const securityConfig = reactive({
  captchaEnabled: true,
  tokenExpire: 24,
  passwordMinLength: 6,
  passwordRules: ['number', 'lowercase'],
  loginFailLock: 5
})

// Logo上传成功
const handleLogoSuccess = (response) => {
  if (response.code === 200) {
    basicConfig.logo = response.data.url
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 获取配置
const fetchConfig = async () => {
  try {
    const res = await getSystemConfig()
    if (res.data) {
      Object.assign(basicConfig, res.data.basic || {})
      Object.assign(storageConfig, res.data.storage || {})
      Object.assign(pushConfig, res.data.push || {})
      Object.assign(securityConfig, res.data.security || {})
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

// 保存基础配置
const saveBasicConfig = async () => {
  try {
    await updateSystemConfig({ type: 'basic', data: basicConfig })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 保存存储配置
const saveStorageConfig = async () => {
  try {
    await updateSystemConfig({ type: 'storage', data: storageConfig })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 保存推送配置
const savePushConfig = async () => {
  try {
    await updateSystemConfig({ type: 'push', data: pushConfig })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 保存安全配置
const saveSecurityConfig = async () => {
  try {
    await updateSystemConfig({ type: 'security', data: securityConfig })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchConfig()
})

// 页面激活时刷新数据
onActivated(() => {
  fetchConfig()
})
</script>

<style lang="scss" scoped>
.config-container {
  .config-form {
    max-width: 600px;

    .unit {
      margin-left: 10px;
      color: #909399;
    }
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