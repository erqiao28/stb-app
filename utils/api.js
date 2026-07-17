/**
 * 后端接口地址集中配置（明道云工作流 Webhook）。
 *
 * 环境策略：
 * - H5（浏览器 / 测试）：请求使用相对路径 `/api/...`（不拼接 API_BASE），请在本机 devServer
 *   将 `/api` 代理到 API_BASE，以免跨域。
 * - App（含 APK 真机包）、小程序等：请求拼接完整 `https://...`（API_BASE）。
 *
 * 修改线上域名时改 API_BASE；各 Hook 路径哈希对应云端工作流。
 */

/** 线上服务根域名（App 端完整 URL；解析附件/SOP 等返回的绝对地址、剥域名时也用此常量） */
export const API_BASE = 'https://www.dachen.vip'

/**
 * 当前运行平台下，uni.request 应使用的前缀。
 * @returns {'' | string} H5 返回空字符串（相对路径）；App 等返回 API_BASE
 */
export function getApiRequestBase() {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.UNI_PLATFORM === 'h5') {
      return ''
    }
  } catch (_) {
    /* ignore */
  }
  return API_BASE
}

/** 是否为 H5（与 getApiRequestBase() === '' 一致，便于模板或调试） */
export function isH5ApiRelativeMode() {
  return getApiRequestBase() === ''
}

/** 构建阶段随产物固定，模块内只算一次 */
const _requestBase = getApiRequestBase()

/**
 * @param {string} path 以 `/api` 开头的路径，如 `/api/workflow/hooks/xxx`
 */
function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return _requestBase ? `${_requestBase}${p}` : p
}

/**
 * 工作流通用入口（与历史 utils/config 中 WORKFLOW_API 字段一致）
 * - TRIGGER_URL：单条触发 / 详情类（callWorkflowAPI）
 * - LIST_URL：列表分页查询 hooks2（callWorkflowListAPIPaged 等）
 */
export const WORKFLOW_API = {
  /** 单条数据详情、通用工作流触发（utils/workflow.callWorkflowAPI） */
  TRIGGER_URL: apiUrl('/api/workflow/hooks/NjkxNTc3NDc4YTVhMDAzMjI2M2I1ZGJi'),
  /** 工作表列表分页查询（hooks2） */
  LIST_URL: apiUrl('/api/workflow/hooks2/NjkxMmQzOTI3NDM1ZTE5MjVmMDkyMjM1'),
}

/** 登录页：账号密码校验（与 WORKFLOW_API.TRIGGER_URL 同一端点） */
export const LOGIN_URL = WORKFLOW_API.TRIGGER_URL

/** 修改密码页：提交新旧密码 */
export const CHANGE_PASSWORD_URL = apiUrl('/api/workflow/hooks/NjkxYTdlNjg5ZDQzNzY1NDk1YmYyOGQy')

/** 记时派工：提交工时、员工、车间等 */
export const TIME_WORK_DISPATCH_URL = apiUrl('/api/workflow/hooks/NjlhZTZiOTIwZjBkMGFkODBmZDQ3MWEz')

/** 记时派工（jspg）：按单据 rowid 修改时薪；请求体 `{ rowid, hourlyRate }` */
export const TIME_WORK_UPDATE_HOURLY_URL = apiUrl('/api/workflow/hooks/NjlmZDU3ZjM4MWZiNGY2MDZmOGY4MTU4')

/** 添加工序：订单/产品工序保存 */
export const ADD_PROCESS_URL = apiUrl('/api/workflow/hooks/NjkxYzU0ODlkMjYxYWY3YTM3ZjA3M2Nm')

/** 派工查询页：删除「待报工」派工单据 */
export const DISPATCH_INQUIRY_DELETE_URL = apiUrl('/api/workflow/hooks/NjliOTIzMTIwZjBkMGFkODBmNTQ5Mzhh')

/** 派工查询（更多）：删除多对多场景下的派工单据 */
export const DISPATCH_INQUIRY_MORE_DELETE_URL = apiUrl('/api/workflow/hooks/NjliZDAwNWIwZjBkMGFkODBmODJkZTQx')

/** 派工查询 / 派工查询更多：员工转派（两页共用） */
export const DISPATCH_TRANSFER_URL = apiUrl('/api/workflow/hooks/Njk1Y2E1ZDIwODY3ZmI3ZDc1Njc2ZDUx')

/** 派工查询 / 多对多派工查询：修改派工数量（需原因） */
export const DISPATCH_QTY_UPDATE_URL = apiUrl('/api/workflow/hooks/NmEwMmU1Mzg4MWZiNGY2MDZmYzhhODJi')

// ---------- 派工页 dispatchWork ----------

/** 抛光车间一对多派工（多工序、单员工 batch） */
export const DISPATCH_ONE_TO_MANY_URL = apiUrl('/api/workflow/hooks/NjljMGRhMjAwZjBkMGFkODBmYTQyZGNj')

/** 订单派工 / 产品派工：主派工提交（含合并并发请求） */
export const DISPATCH_PROCESS_URL = apiUrl('/api/workflow/hooks/NjkyMTJlNzdhOWE4ZGM2YmMxZjczYzlk')

/** 返工完成回调 */
export const REWORK_COMPLETE_URL = apiUrl('/api/workflow/hooks/NjljY2I3ZTEzMzBiMjAyNjg5ODQ1YTYx')

/** 合并工序 / 返工开始 */
export const REWORK_START_URL = apiUrl('/api/workflow/hooks/NjljY2MzYjEzMzBiMjAyNjg5ODY0NDg4')

/** 首检提醒推送 */
export const FIRST_CHECK_REMIND_URL = apiUrl('/api/workflow/hooks/NjllMDdhZWIzMzBiMjAyNjg5NDVmOTE5')

/** 终止工序：提交工序 rowid 与终止原因 */
export const TERMINATE_PROCESS_URL = apiUrl('/api/workflow/hooks/Njk0NGRjYTI0NDUzNWFkMTg3ZWFiZmFj')

/** 组装 / 抛光 / 喷涂：多对多派工（多工序 × 多员工） */
export const DISPATCH_MULTI_URL = apiUrl('/api/workflow/hooks/Njk4MmRkMTUwZjBkMGFkODBmZTM1YjAy')

/** 使用正常工序（撤销异常工序回到正常） */
export const USE_NORMAL_PROCESS_URL = apiUrl('/api/workflow/hooks/Njk3MWMwODkwZjBkMGFkODBmMjhjOGU1')

/** 删除工序 */
export const DELETE_PROCESS_URL = apiUrl('/api/workflow/hooks/Njk3MWNkY2UwZjBkMGFkODBmMmE3NGM3')

/** 批量派工 */
export const BATCH_DISPATCH_URL = apiUrl('/api/workflow/hooks/NmEwZWM2YmU4MWZiNGY2MDZmM2M1ZmZh')

/** 操作工序（产品详情页模态框） */
export const OPERATE_PROCESS_URL = apiUrl('/api/workflow/hooks/NmEwYmQyNmI4MWZiNGY2MDZmMWQxMzY4')

/** 操作工序后同步预派工关联工序 */
export const OPERATE_PROCESS_SYNC_URL = apiUrl('/api/workflow/hooks/NmE1OWUzYjMzN2MwOTg0NTBhOTI0MjYz')

/** 员工出勤同步预派工关联工序 */
export const ATTENDANCE_SYNC_URL = apiUrl('/api/workflow/hooks/NmE1OWU1OGMzN2MwOTg0NTBhOTJiMGE2')

/** 预派工作废 */
export const PRE_DISPATCH_VOID_URL = apiUrl('/api/workflow/hooks/NmEyYTEzMGMzN2MwOTg0NTBhMDFlMzQ2')

/** 预派工调整：修改预派工数据（派工日期、数量、员工） */
export const PRE_DISPATCH_UPDATE_URL = apiUrl('/api/workflow/hooks/NmEzYjc5NzIzN2MwOTg0NTBhOTIzMjYw')

/** 预派工新增：添加预派工记录（工序rowid数组、员工编号数组、派工日期、派工数量） */
export const PRE_DISPATCH_ADD_URL = apiUrl('/api/workflow/hooks/NmEzYzkxMTYzN2MwOTg0NTBhYTM3MGJl')

/** 预派工新增（产品选择后添加到预派工） */
export const PRE_DISPATCH_PRODUCT_ADD_URL = apiUrl('/api/workflow/hooks/NmE1NzRhN2YzN2MwOTg0NTBhN2IzOTg3')

/** 确认派工：将预派工转为正式派工（预派工rowid数组） */
export const PRE_DISPATCH_CONFIRM_URL = apiUrl('/api/workflow/hooks/NmEzY2I3OTEzN2MwOTg0NTBhYWE3ZWEw')

/** 工序列表确定：已关联预派工与未关联预派工的工序rowid */
export const PRE_DISPATCH_PROCESS_CONFIRM_URL = apiUrl('/api/workflow/hooks/NmE1ODdkYzczN2MwOTg0NTBhODZhNjI3')

/** 员工出勤到/缺提交 */
export const ATTENDANCE_SUBMIT_URL = apiUrl('/api/workflow/hooks/NmE1NGE1MzkzN2MwOTg0NTBhNjE2N2Jm')

/** 岗位工序：员工选择工序提交 */
export const POSITION_PROCESS_SELECT_URL = apiUrl('/api/workflow/hooks/NmE1NWEzYjgzN2MwOTg0NTBhNjY4ODA5')

/** 岗位工序：删除员工所属工序 */
export const POSITION_PROCESS_DELETE_URL = apiUrl('/api/workflow/hooks/NmE1NWRlNjYzN2MwOTg0NTBhNjlkMWI1')

/** 喷涂工序员工 */
export const SPRAY_PROCESS_EMPLOYEE_URL = apiUrl('/api/workflow/hooks/NmE1NWYwOGYzN2MwOTg0NTBhNmI1ZjZl')

/** 工艺配置：保存产品选中工序（产品rowid + 选中工序顺序数组） */
export const PROCESS_CONFIG_COMPLETE_URL = apiUrl('/api/workflow/hooks/NmE1NzYyOTIzN2MwOTg0NTBhN2Q3ZGE1')
