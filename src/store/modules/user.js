import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: null,
    role: localStorage.getItem('role') || ''
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,
    // 是否是管理员
    isAdmin: (state) => state.role === 'admin',
    // 用户名
    username: (state) => state.userInfo?.username || '',
    // 真实姓名
    realName: (state) => state.userInfo?.realName || ''
  },

  actions: {
    /**
     * 登录
     */
    async login(loginForm) {
      try {
        const res = await login(loginForm)
        const { token, userInfo } = res.data

        // 保存token
        this.token = token
        setToken(token)

        // 保存用户信息
        this.userInfo = userInfo
        this.role = userInfo.role === 1 ? 'admin' : 'operator'
        localStorage.setItem('role', this.role)

        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        this.userInfo = res.data
        this.role = res.data.role === 1 ? 'admin' : 'operator'
        localStorage.setItem('role', this.role)
        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        await logout()
      } finally {
        this.resetState()
      }
    },

    /**
     * 重置状态
     */
    resetState() {
      this.token = ''
      this.userInfo = null
      this.role = ''
      removeToken()
      localStorage.removeItem('role')
    }
  }
})