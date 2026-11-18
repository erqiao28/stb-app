/**
 * 可用返工排产计划的共享读取工具。
 *
 * 预派工页的“返工快捷入口”与正式派工页的同类入口必须使用同一查询口径，
 * 因此把排产计划字段、过滤条件、行映射收敛在这里，避免页面各自复制导致规则漂移。
 */


export const SCHEDULE_PLAN_WORKSHEET_ID = 'paichanjihua'

export const SCHEDULE_PLAN_FIELD_MAP = {
  workshop: '67de26c9c5377d50a523c735',
  scheduleType: '694a3954687045435008a7c3',
  scheduleCode: '69cb5ea03b5e707f84ddefa0',
  productionCode: '698438933b5e707f84cf51fd',
  orderCode: '655e1cbbbd2094b316347f92',
  productName: '6937d255ff2b019b3cb34be3',
  // 返工数量：排产计划生产数量
  productionCount: '67de8eb5c5377d50a523ef9b',
  problemDescription: '694ba108dc025d98887fd782',
  // 是否合并：0=未合并，1=已合并
  reworkMergeFlag: '69ccaf64665ab27f39105bed',
  scheduleStatus: '655b875ffc44a9469a3aa225',
  deliveryType: '69db0017665ab27f3913c455',
  // 添加产品口径中的基础限制字段（filterType 8）
  addProductScope: '66974cda2503723eec1af600',
  // 工序排产明细关联字段：与未完成数量分支共同还原添加产品可用口径
  processDetail: '688c366082289045da815f97',
  // 返工进度：快捷入口与合并工序均需排除“已完成/不可返工”
  reworkProgress: '69ccb3e7665ab27f39105da2',
  // 未完成工序数量：正常排产与可用返工排产都必须还有可操作工序
  incompleteProcessQty: '69a8e4563b5e707f84d33c0c'
}

export const BLOCKED_REWORK_PROGRESS = ['已完成', '不可返工']

export const isReworkProgressOperable = (progress) =>
  !BLOCKED_REWORK_PROGRESS.includes(String(progress || '').trim())

/** 关联/选择字段可能返回 JSON、数组或对象，统一提取展示值 */
const formatPlanFieldValue = (value) => {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const text = value.trim()
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        return formatPlanFieldValue(JSON.parse(text))
      } catch {
        return text
      }
    }
    return text
  }
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object') {
      return String(first.name || first.text || first.value || first.fullname || '').trim()
    }
    return value.filter(Boolean).map(item => (typeof item === 'string' ? item : '')).join('、').trim()
  }
  if (typeof value === 'object') {
    return String(value.name || value.text || value.value || value.label || value.title || '').trim()
  }
  return String(value).trim()
}

export const formatReworkMergeFlag = (value) => {
  if (value === 0 || value === '0') return '否'
  if (value === 1 || value === '1') return '是'
  return formatPlanFieldValue(value) || '-'
}

/** 原始排产计划行 -> 生产编号分组的选择器数据；调用方无需理解 HAP 字段 ID */
export const mapAvailableReworkPlans = (rows = []) => {
  const planMap = {}
  rows.forEach(item => {
    const productionCode = formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productionCode])
    const reworkProgress = formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.reworkProgress])
    if (!item.rowid || !productionCode || !isReworkProgressOperable(reworkProgress)) return
    if (!Array.isArray(planMap[productionCode])) planMap[productionCode] = []
    planMap[productionCode].push({
      rowid: item.rowid,
      scheduleCode: formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.scheduleCode]) || '',
      orderCode: formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.orderCode]) || '-',
      productName: formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productName]) || '-',
      productionCode,
      reworkQty: formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productionCount]) || '0',
      problemDescription: formatPlanFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.problemDescription]) || '-',
      reworkProgress: reworkProgress || '-',
      reworkMergeFlag: formatReworkMergeFlag(item[SCHEDULE_PLAN_FIELD_MAP.reworkMergeFlag])
    })
  })
  return planMap
}

/** 按筛选条件分页拉取排产计划，最多 500 页防止接口异常导致死循环 */
const fetchReworkPlanRows = async (filters) => {
  const pageSize = 100
  const MAX_PAGES = 500
  const rows = []
  const { callWorkflowListAPIPaged } = await import('./workflow')
  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const res = await callWorkflowListAPIPaged({
      worksheetId: SCHEDULE_PLAN_WORKSHEET_ID,
      filters,
      pageSize,
      pageNum,
      silent: true
    })
    const pageRows = Array.isArray(res?.data) ? res.data : []
    if (pageRows.length === 0) break
    rows.push(...pageRows)
    if (pageRows.length < pageSize) break
  }
  return rows
}

/**
 * 查询多个生产编号在当前车间下可进入返工派工的排产计划。
 *
 * 可用口径与预派工“添加产品”一致：已排产/部分排产、准时交货、允许添加范围，
 * 且“未完成工序数量 > 0”或“工序排产明细为空”二者满足其一。
 */
export const buildAvailableReworkPlanFilterGroups = ({ productionCodes = [], workshop = '' }) => {
  const room = String(workshop || '').trim()
  if (!room) return []

  const codes = [...new Set(
    (productionCodes || [])
      .map(code => String(code || '').trim())
      .filter(Boolean)
  )]
  const baseFilters = [
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.workshop,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [room]
    },
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.scheduleType,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: ['返工排产']
    }
  ]
  if (codes.length > 0) {
    baseFilters.push({
      controlId: SCHEDULE_PLAN_FIELD_MAP.productionCode,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: codes
    })
  }
  baseFilters.push(
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.scheduleStatus,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: ['已排产', '部分排产']
    },
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.deliveryType,
      dataType: 30,
      spliceType: 1,
      filterType: 6,
      values: ['准时交货']
    },
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.addProductScope,
      dataType: 30,
      spliceType: 1,
      filterType: 8
    },
    {
      controlId: SCHEDULE_PLAN_FIELD_MAP.reworkProgress,
      dataType: 30,
      spliceType: 1,
      filterType: 6,
      values: BLOCKED_REWORK_PROGRESS
    }
  )

  return [
    baseFilters.concat({
      controlId: SCHEDULE_PLAN_FIELD_MAP.incompleteProcessQty,
      dataType: 30,
      spliceType: 1,
      filterType: 13,
      minValue: '0',
      values: []
    }),
    baseFilters.concat({
      controlId: SCHEDULE_PLAN_FIELD_MAP.processDetail,
      dataType: 30,
      spliceType: 1,
      filterType: 7,
      values: []
    })
  ]
}

/**
 * 查询当前车间下可进入返工派工的排产计划。
 *
 * productionCodes 为空时查询当前车间全部计划，供主页面数量角标使用；
 * 传入生产编号时保持派工页/预派工页的原有精确范围。
 */
export const fetchAvailableReworkPlans = async ({ productionCodes = [], workshop = '' }) => {
  const filterGroups = buildAvailableReworkPlanFilterGroups({ productionCodes, workshop })
  if (filterGroups.length === 0) return {}

  const rowGroups = await Promise.all(filterGroups.map(filters => fetchReworkPlanRows(filters)))
  const rowMap = new Map()
  rowGroups.flat().forEach(row => {
    if (row?.rowid) rowMap.set(row.rowid, row)
  })
  return mapAvailableReworkPlans([...rowMap.values()])
}
