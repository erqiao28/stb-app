import http from './request'
import config from './config'

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
 * 循环获取工作流列表所有数据（pageSize 为 100，循环获取直到没有更多数据）
 * @param {Object} queryParams - 查询参数
 * @param {number} pageSize - 每页大小，默认 100
 * @returns {Promise<{data: Array, total: number}>}
 */
export const callWorkflowListAll = async (queryParams = {}, pageSize = 100) => {
  const silent = queryParams.silent === true
  let allRows = []
  let pageNum = 1
  let hasMore = true
  // 安全上限，防止后端异常一直返回满页数据导致死循环
  const MAX_PAGES = 500

  while (hasMore && pageNum <= MAX_PAGES) {
    const result = await callWorkflowListAPIPaged(queryParams, pageSize, pageNum, 0)
    const rows = Array.isArray(result?.data) ? result.data : []
    allRows.push(...rows)

    // 返回空数据或不足一页时终止循环
    if (rows.length === 0 || rows.length < pageSize) {
      hasMore = false
    } else {
      pageNum++
    }
  }

  return {
    data: allRows,
    total: allRows.length
  }
}

