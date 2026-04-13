import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

// 公共路由（无需登录）
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限' }
  }
]

// 动态路由（需登录）
export const asyncRoutes = [
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      },
      {
        path: 'job',
        name: 'Job',
        component: () => import('@/views/job/index.vue'),
        meta: { title: '职位管理', icon: 'Briefcase' }
      },
      {
        path: 'device',
        name: 'Device',
        redirect: '/device/list',
        meta: { title: '设备管理', icon: 'Monitor' },
        children: [
          {
            path: 'list',
            name: 'DeviceList',
            component: () => import('@/views/device/index.vue'),
            meta: { title: '设备列表' }
          },
          {
            path: 'group',
            name: 'DeviceGroup',
            component: () => import('@/views/device/group.vue'),
            meta: { title: '设备分组' }
          },
          {
            path: 'monitor',
            name: 'DeviceMonitor',
            component: () => import('@/views/device/monitor.vue'),
            meta: { title: '实时监控', hidden: true }
          }
        ]
      },
      {
        path: 'poster',
        name: 'Poster',
        redirect: '/poster/list',
        meta: { title: '海报管理', icon: 'Picture' },
        children: [
          {
            path: 'list',
            name: 'PosterList',
            component: () => import('@/views/poster/index.vue'),
            meta: { title: '海报列表' }
          },
          {
            path: 'generate',
            name: 'PosterGenerate',
            component: () => import('@/views/poster/generate.vue'),
            meta: { title: '生成海报' }
          }
        ]
      },
      {
        path: 'video',
        name: 'Video',
        component: () => import('@/views/video/index.vue'),
        meta: { title: '视频管理', icon: 'VideoCamera' }
      },
      {
        path: 'image',
        name: 'Image',
        component: () => import('@/views/image/index.vue'),
        meta: { title: '图片管理', icon: 'PictureFilled' }
      },
      {
        path: 'push',
        name: 'Push',
        redirect: '/push/content',
        meta: { title: '内容推送', icon: 'Promotion' },
        children: [
          {
            path: 'content',
            name: 'PushContent',
            component: () => import('@/views/push/index.vue'),
            meta: { title: '推送内容' }
          },
          {
            path: 'record',
            name: 'PushRecord',
            component: () => import('@/views/push/record.vue'),
            meta: { title: '推送记录' }
          }
        ]
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      },
      {
        path: 'log',
        name: 'Log',
        component: () => import('@/views/log/index.vue'),
        meta: { title: '操作日志', icon: 'Document', roles: ['admin'] }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('@/views/config/index.vue'),
        meta: { title: '系统配置', icon: 'Setting', roles: ['admin'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'User' }
      }
    ]
  },
  // 404页面必须放在最后
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, ...asyncRoutes],
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  const systemName = localStorage.getItem('systemName') || '电视招聘展示系统'
  document.title = to.meta.title
    ? `${to.meta.title} - ${systemName}`
    : systemName

  // 判断是否需要登录
  const token = getToken()
  if (!token) {
    // 未登录
    if (to.path === '/login') {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
    return
  }

  // 已登录访问登录页，跳转首页
  if (to.path === '/login') {
    next({ path: '/' })
    return
  }

  // 权限判断（从localStorage获取角色信息）
  const userRole = localStorage.getItem('role')
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userRole)) {
      next('/403')
      return
    }
  }

  next()
})

export default router