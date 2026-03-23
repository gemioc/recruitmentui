import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 侧边栏是否折叠
    sidebarCollapsed: false,
    // 设备类型
    device: 'desktop',
    // 页面加载状态
    loading: false
  }),

  getters: {
    isCollapsed: (state) => state.sidebarCollapsed,
    isLoading: (state) => state.loading
  },

  actions: {
    /**
     * 切换侧边栏折叠状态
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    /**
     * 设置侧边栏状态
     */
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed
    },

    /**
     * 设置加载状态
     */
    setLoading(loading) {
      this.loading = loading
    },

    /**
     * 设置设备类型
     */
    setDevice(device) {
      this.device = device
    }
  }
})