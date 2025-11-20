// utils/device.js
import config from './config'

export function getDeviceId() {
  try {
    // 检查是否在App环境中（支持plus API）
    if (typeof plus !== 'undefined' && plus.storage && plus.device) {
      // 本地先读
      let did = plus.storage.getItem('_did');
      if (did && did !== 'null' && did !== 'undefined' && did.trim() !== '') {
        return did;
      }

      // 没有就生成
      did = plus.device.uuid;          // 原生层 UUID
      
      // 确保 device.uuid 有效
      if (!did || did === 'null' || did === 'undefined' || did.trim() === '') {
        // 如果 device.uuid 无效，生成一个基于时间戳的临时ID
        did = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      plus.storage.setItem('_did', did);
      return did;
    } else {
      // 小程序环境或其他不支持plus的环境
      // 先尝试从uni.storage读取
      const storageKey = config.PROJECT_PREFIX + '_did'
      let did = uni.getStorageSync(storageKey);
      if (did && did !== 'null' && did !== 'undefined' && did.trim() !== '') {
        return did;
      }

      // 生成基于时间戳和随机数的设备ID
      did = 'mini_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 存储到uni.storage
      uni.setStorageSync(storageKey, did);
      return did;
    }
  } catch (error) {
    console.error('获取设备ID失败:', error);
    // 如果所有方法都失败，返回一个临时ID
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}