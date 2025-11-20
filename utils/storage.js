// utils/storage.js
import config from './config'

class StorageUtil {
    // 项目前缀（从配置文件读取）
    static PREFIX = config.PROJECT_PREFIX
    
    // 添加前缀到key
    static addPrefix(key) {
      // 如果key已经包含前缀，则不再添加
      if (key.startsWith(this.PREFIX)) {
        return key
      }
      return this.PREFIX + key
    }
    
    // 设置存储
    static set(key, value) {
      try {
        const prefixedKey = this.addPrefix(key)
        const data = JSON.stringify(value)
        uni.setStorageSync(prefixedKey, data)
        return true
      } catch (error) {
        console.error('存储失败:', error)
        return false
      }
    }
  
    // 获取存储
    static get(key, defaultValue = null) {
      try {
        const prefixedKey = this.addPrefix(key)
        const data = uni.getStorageSync(prefixedKey)
        if (data) {
          return JSON.parse(data)
        }
        return defaultValue
      } catch (error) {
        console.error('读取存储失败:', error)
        return defaultValue
      }
    }
  
    // 删除存储
    static remove(key) {
      try {
        const prefixedKey = this.addPrefix(key)
        uni.removeStorageSync(prefixedKey)
        return true
      } catch (error) {
        console.error('删除存储失败:', error)
        return false
      }
    }
  
    // 清空所有存储（只清空本项目的前缀存储）
    static clear() {
      try {
        // 获取所有存储的key
        const res = uni.getStorageInfoSync()
        if (res && res.keys) {
          // 只删除本项目前缀的key
          res.keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
              uni.removeStorageSync(key)
            }
          })
        }
        return true
      } catch (error) {
        console.error('清空存储失败:', error)
        return false
      }
    }
  
    // 检查是否存在
    static has(key) {
      try {
        const prefixedKey = this.addPrefix(key)
        const data = uni.getStorageSync(prefixedKey)
        return data !== ''
      } catch (error) {
        return false
      }
    }
  }
  
  export default StorageUtil