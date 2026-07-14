import http from './request'
import config from './config'
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

export default {
  callWorkflowAPI,
  callWorkflowListAPI,
  callWorkflowListAPIPaged,
}
