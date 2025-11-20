import http from './request'
import config from './config'

/**
 * 获取数据详情
 * 根据 rowid 获取单条数据的详细信息
 * @param {Object} params - 请求参数（必须包含 worksheetId 和 rowid）
 * @param {number} delaySeconds - 延迟调用时间（秒，可选）
 * @returns {Promise} - 返回数据详情对象
 */
export const callWorkflowAPI = async (params = {}, delaySeconds = 0) => {
  try {
    console.log(
      `callWorkflowAPI 被调用 - params:`,
      params,
      `delaySeconds: ${delaySeconds}`
    )

    // 显示加载动画
    uni.showLoading({
      title: '处理中...',
      mask: true,
    })
    console.log('加载动画已显示')

    // 如果指定了延迟时间，先等待
    if (delaySeconds > 0) {
      console.log(`开始等待 ${delaySeconds} 秒...`)
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
      console.log(`等待 ${delaySeconds} 秒完成`)
    }

    // 合并用户信息到参数中
    const requestParams = {
      ...params,
    }

    console.log('开始调用工作流API...')
    const res = await http.post(config.WORKFLOW_API.TRIGGER_URL, requestParams)
    console.log('工作流API调用响应:', res)

    // 隐藏加载动画
    uni.hideLoading()
    console.log('加载动画已隐藏')

    return JSON.parse(res.data)
  } catch (error) {
    // 隐藏加载动画
    uni.hideLoading()
    console.log('加载动画已隐藏（错误处理）')
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

      const res = await http.post(
        'https://www.dachen.vip/api/workflow/hooks2/NjkxMmQzOTI3NDM1ZTE5MjVmMDkyMjM1',
        params
      )

      if (res && res.data) {
        const responseData = JSON.parse(res.data)
        total = responseData.total || 0

        console.log('total值:', total)
        console.log('rows数据:', responseData.rows)

        if (responseData.rows && Array.isArray(responseData.rows)) {
          console.log('添加到allData的数据条数:', responseData.rows.length)
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
 * @param {number} pageSize - 每页数量（可选，默认20）
 * @param {number} pageNum - 页码（可选，默认1）
 * @param {number} delaySeconds - 延迟调用时间（秒，可选）
 * @returns {Promise} - 返回当前页数据
 */
export const callWorkflowListAPIPaged = async (
  queryParams = {},
  pageSize = 20,
  pageNum = 1,
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

    const params = {
      pageSize,
      pageNum: pageNum,
      ...queryParams,
    }

    console.log('分页查询 - 请求参数:', params)

    const res = await http.post(config.WORKFLOW_API.LIST_URL, params)

    if (res && res.data) {
      const responseData = JSON.parse(res.data)
      console.log('响应数据：' + responseData)

      console.log('分页查询 - total值:', responseData.total)
      console.log(
        '分页查询 - rows数据条数:',
        responseData.rows ? responseData.rows.length : 0
      )

      // 隐藏加载动画
      uni.hideLoading()

      return {
        data: responseData.rows || [],
        total: responseData.total || 0,
        pageIndex: pageNum,
        pageSize: pageSize,
      }
    } else {
      // 隐藏加载动画
      uni.hideLoading()
      return {
        data: [],
        total: 0,
        pageNum: pageNum,
        pageSize: pageSize,
      }
    }
  } catch (error) {
    // 隐藏加载动画
    uni.hideLoading()
    console.error('分页工作流列表API调用失败:', error)
    throw error
  }
}

export default {
  callWorkflowAPI,
  callWorkflowListAPI,
  callWorkflowListAPIPaged,
}
