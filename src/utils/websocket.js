/**
 * WebSocket封装类
 * 用于与电视终端实时通信
 */
class WebSocketClient {
  constructor() {
    this.ws = null           // WebSocket实例
    this.reconnectTimer = null  // 重连定时器
    this.heartbeatTimer = null  // 心跳定时器
    this.listeners = new Map()   // 事件监听器
    this.url = ''            // 连接地址
    this.isConnecting = false    // 是否正在连接
  }

  /**
   * 建立WebSocket连接
   * @param {string} url - WebSocket地址
   */
  connect(url) {
    // 避免重复连接
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.url = url
    this.isConnecting = true

    try {
      this.ws = new WebSocket(url)

      // 连接成功
      this.ws.onopen = () => {
        console.log('WebSocket连接成功')
        this.isConnecting = false
        this.startHeartbeat()
        this.emit('open')
      }

      // 接收消息
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // 触发消息事件
          this.emit('message', data)
          // 根据消息类型触发对应事件
          if (data.type) {
            this.emit(data.type, data)
          }
        } catch (e) {
          console.error('WebSocket消息解析失败:', e)
        }
      }

      // 连接关闭
      this.ws.onclose = () => {
        console.log('WebSocket连接关闭')
        this.isConnecting = false
        this.stopHeartbeat()
        this.reconnect()
        this.emit('close')
      }

      // 连接错误
      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        this.isConnecting = false
        this.emit('error', error)
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.isConnecting = false
      this.reconnect()
    }
  }

  /**
   * 发送消息
   * @param {object} data - 要发送的数据
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  /**
   * 关闭连接
   */
  close() {
    this.stopHeartbeat()
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 重新连接
   */
  reconnect() {
    // 5秒后重连
    this.reconnectTimer = setTimeout(() => {
      console.log('尝试重连WebSocket...')
      this.connect(this.url)
    }, 5000)
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    // 每30秒发送一次心跳
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'HEARTBEAT', timestamp: Date.now() })
    }, 30000)
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  /**
   * 注册事件监听
   * @param {string} event - 事件名称
   * @param {function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名称
   * @param {function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error('事件回调执行错误:', e)
        }
      })
    }
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 导出单例实例
export default new WebSocketClient()