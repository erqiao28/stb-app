// 创建基于 uni.request 的 HTTP 客户端
const http = {
  // 基础配置
  baseConfig: {
    timeout: 10000,
    header: {
      'Content-Type': 'application/json',
    },
  },

  // 请求方法
  async request(options) {
    return new Promise((resolve, reject) => {
      const config = {
        ...this.baseConfig,
        ...options,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(new Error(`网络错误: ${err.errMsg || '未知错误'}`))
        }
      }
      uni.request(config)
    })
  },

  // GET 请求
  async get(url, params = {}) {
    return this.request({
      url,
      method: 'GET',
      data: params
    })
  },

  // POST 请求
  async post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    })
  },

  // PUT 请求
  async put(url, data = {}) {
    return this.request({
      url,
      method: 'PUT',
      data
    })
  },

  // DELETE 请求
  async delete(url, data = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data
    })
  }
}

// 显示提示信息的方法
export const showToast = (message) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

// 预加载方法
http.preload = async (url, data, method = 'POST') => {
  try {
    return await http[method.toLowerCase()](url, data)
  } catch (error) {
    console.log('预加载失败:', error)
    return null
  }
}

// 清除缓存方法
http.clearCache = (worksheetId) => {
  console.log('清除缓存:', worksheetId || 'all')
}

export default http