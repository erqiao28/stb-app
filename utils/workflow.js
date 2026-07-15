import http from './request'
import config from './config'
import { API_BASE } from './api'
import { useUserStore } from '../store/user.store'

/**
 * 获取数据详情
 * 根据 rowid 获取单条数据的详细信息
 * @param {Object} params - 请求参数（必须包含 worksheetId 和 rowid）
 * @param {number} delaySeconds - 延迟调用时间（秒，可选）
 * @returns {Promise} - 返回数据详情对象
 */
export const callWorkflowAPI = async (params = {}, delaySeconds = 0) => {
  try {
    // 显示加载动画
    uni.showLoading({
      title: '处理中...',
      mask: true,
    })

    // 如果指定了延迟时间，先等待
    if (delaySeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
    }

    // 合并用户信息到参数中
    const requestParams = {
      ...params,
    }

    const res = await http.post(config.WORKFLOW_API.TRIGGER_URL, requestParams)

    // 隐藏加载动画
    uni.hideLoading()

    return JSON.parse(res.data)
  } catch (error) {
    // 隐藏加载动画
    uni.hideLoading()
    console.error('工作流API调用失败:', error)
    throw error
  }
}

/**
 * 数据列表查询API调用方法 - 获取全部数据
 * @param {string} worksheetId - 工作表ID
 * @param {Array} filters - 筛选条件（可选）
 * @param {number} pageSize - 每页数量（可选，默认100）
 * @param {number} delaySeconds - 延迟调用时间（秒，可选）
 * @returns {Promise} - 返回全部数据数组
 */
export const callWorkflowListAPI = async (
  worksheetId,
  filters = [],
  pageSize = 100,
  delaySeconds = 0
) => {
  try {
    // 显示加载动画
    uni.showLoading({
      title: '加载中...',
      mask: true,
    })

    // 如果指定了延迟时间，先等待
    if (delaySeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
    }

    const userStore = useUserStore()
    let allData = []
    let pageNum = 1
    let total = 0

    do {
      const params = {
        worksheetId,
        pageSize,
        pageNum,
        filters,
      }

      const res = await http.post(config.WORKFLOW_API.LIST_URL, params)

      if (res && res.data) {
        const responseData = JSON.parse(res.data)
        total = responseData.total || 0

        if (responseData.rows && Array.isArray(responseData.rows)) {
          allData = allData.concat(responseData.rows)
        }

        // 计算是否还有下一页
        const totalPages = Math.ceil(total / pageSize)
        pageNum++

        // 如果已经获取到所有数据或者当前页是最后一页，就退出循环
        if (pageNum > totalPages || allData.length >= total) {
          break
        }
      } else {
        break
      }
    } while (true)

    // 隐藏加载动画
    uni.hideLoading()

    return {
      data: allData,
      total: total,
    }
  } catch (error) {
    // 隐藏加载动画
    uni.hideLoading()
    console.error('工作流列表API调用失败:', error)
    throw error
  }
}

/**
 * 数据列表查询API调用方法 - 支持真正分页
 * @param {Object} queryParams - 查询参数对象（必须包含 worksheetId）
 * @param {number} pageSize - 每页数量（可选，默认999）
 * @param {number} pageNum - 页码（可选，默认1）
 * @param {number} delaySeconds - 延迟调用时间（秒，可选）
 * @returns {Promise} - 返回当前页数据
 */
export const callWorkflowListAPIPaged = async (
  queryParams = {},
  pageSize = 100,
  pageNum = 1,
  delaySeconds = 0
) => {
  try {
    const silent = queryParams.silent === true

    // 如果指定了延迟时间，先等待
    if (delaySeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
    }

    const params = {
      pageSize,
      pageNum: pageNum,
      ...queryParams,
    }
    delete params.silent

    // 上拉加载等场景可传 silent: true，不弹全屏 loading
    if (!silent) {
      uni.showLoading({
        title: '加载中...',
        mask: true,
      })
    }

    const res = await http.post(config.WORKFLOW_API.LIST_URL, params)

    if (res && res.data != null) {
      // 兼容两种返回格式：
      // 1）res.data 为 JSON 字符串
      // 2）res.data 已经是对象（某些账号 / 接口会这样返回）
      let responseData
      if (typeof res.data === 'string') {
        responseData = JSON.parse(res.data)
      } else if (typeof res.data === 'object') {
        responseData = res.data
      } else {
        throw new Error('未知的返回数据格式：' + String(res.data))
      }

      // 检测 HAP 后端是否把异常信息包装在 data/msg 中返回（此时通常没有 rows）
      if (responseData.msg && !responseData.rows) {
        console.warn('[callWorkflowListAPIPaged] 接口返回异常信息:', responseData.msg, responseData)
      }

      if (!silent) {
        uni.hideLoading()
      }

      return {
        data: responseData.rows || [],
        total: responseData.total || 0,
        pageIndex: params.pageNum ?? pageNum,
        pageSize: params.pageSize ?? pageSize,
      }
    } else {
      if (!silent) {
        uni.hideLoading()
      }
      return {
        data: [],
        total: 0,
        pageNum: pageNum,
        pageSize: pageSize,
      }
    }
  } catch (error) {
    if (!queryParams.silent) {
      uni.hideLoading()
    }
    console.error('分页工作流列表API调用失败:', error)
    throw error
  }
}

/**
 * 获取工作表结构（字段定义）
 * @param {string} worksheetId - 工作表ID
 * @returns {Promise} - 返回工作表结构对象
 */
export const getWorksheetStructure = async (worksheetId) => {
  try {
    console.log('调用 getWorksheetStructure, worksheetId:', worksheetId)
    const url = `${API_BASE}/api/worksheets/${worksheetId}`
    console.log('请求URL:', url)
    const res = await http.get(url)
    console.log('getWorksheetStructure 返回原始:', res)
    if (res) {
      // 检查返回结构
      if (res.data) {
        console.log('res.data 存在:', typeof res.data === 'object' ? res.data : '字符串需要解析')
        return typeof res.data === 'object' ? res.data : JSON.parse(res.data)
      }
      return res
    }
    return null
  } catch (error) {
    console.error('获取工作表结构失败:', error)
    return null
  }
}

/**
 * 根据 sid 数组和字段 key 获取标签名称数组
 * @param {string} worksheetId - 工作表ID
 * @param {string} fieldKey - 字段key（如 6a276ffc6d70ffabc66285f9）
 * @param {string[]} sids - sid 数组
 * @returns {Promise<string[]>} - 标签名称数组
 */
export const getLabelsBySids = async (worksheetId, fieldKey, sids) => {
  if (!sids || sids.length === 0) return []
  
  try {
    const structure = await getWorksheetStructure(worksheetId)
    console.log('getLabelsBySids - structure:', structure)
    if (!structure || !structure.fields) {
      console.log('structure 或 fields 不存在')
      return []
    }
    
    const field = structure.fields.find(f => f.id === fieldKey)
    console.log('getLabelsBySids - field:', field)
    if (!field || !field.options) {
      console.log('field 或 options 不存在')
      return []
    }
    
    console.log('getLabelsBySids - options:', field.options)
    const optionMap = new Map()
    field.options.forEach(opt => {
      optionMap.set(opt.key, opt.value)
    })
    
    return sids.map(sid => optionMap.get(sid) || '').filter(Boolean)
  } catch (error) {
    console.error('获取标签名称失败:', error)
    return []
  }
}

export default {
  callWorkflowAPI,
  callWorkflowListAPI,
  callWorkflowListAPIPaged,
  getWorksheetStructure,
  getLabelsBySids,
}
