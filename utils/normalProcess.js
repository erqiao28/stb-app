
/**
 * 正常工序排产明细的共享读取工具。
 *
 * “合并工序”和返工模式下的“工艺调整 -> 从正常工序中挑选”都需要读取同一份
 * 工序排产明细数据，因此把工作表、字段 ID、关联字段解析收敛到这里，避免两处口径漂移。
 */
import { callWorkflowListAll } from './workflow'

export const NORMAL_PROCESS_WORKSHEET_ID = 'paigongdan'

export const NORMAL_PROCESS_FIELD_MAP = {
  productionCode: '691d6160535b29cbd5c6c0a9',
  workshop: '669a6cae2503723eec1b49bb',
  dispatchType: '6954ad997a59e0522d85df35',
  sequence: '693a62040f64427fac25ae80',
  processName: '656ffd1bba5ef3863bf3ec1e'
}

/** 关联字段可能返回 JSON 字符串、数组或对象，这里统一提取展示名称 */
export const extractRelationNames = (value) => {
  if (!value) return []
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('[')) {
      try {
        return extractRelationNames(JSON.parse(text))
      } catch {
        return []
      }
    }
    return []
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === 'object')
      .map((item) => item.name || item.text || item.title || item.fullname || '')
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    return [value.name || value.text || value.title || value.fullname || ''].filter(Boolean)
  }
  return []
}

/** 关联字段可能返回 JSON 字符串、数组或对象，这里统一提取关联记录 rowid */
export const extractRelationRowids = (value) => {
  if (value == null || value === '') return []
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('[')) {
      try {
        return extractRelationRowids(JSON.parse(text))
      } catch {
        return []
      }
    }
    return text.split(',').map((item) => item.trim()).filter(Boolean)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') return item.sid || item.rowid || item.id || ''
        return ''
      })
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    const rowid = value.sid || value.rowid || value.id || ''
    return rowid ? [String(rowid).trim()] : []
  }
  return []
}

/** 工序名称展示：优先使用关联记录名称，异常结构时保持原有的字符串兜底 */
export const formatNormalProcessName = (value) => {
  const names = extractRelationNames(value)
  return names.length > 0 ? names.join('、') : String(value ?? '').trim()
}

/**
 * 按生产编号 + 车间读取当前产品的正常派工工序排产明细。
 *
 * 返回值同时保留：
 * - rowid：工序排产明细 rowid（合并工序等操作使用）
 * - processDictRowid：工序名称关联字段里的工序字典 rowid（工艺调整接口必须传这个，不能传明细 rowid）
 */
export const fetchNormalProcessDetails = async ({ productionCode, workshop }) => {
  const code = String(productionCode || '').trim()
  const room = String(workshop || '').trim()
  if (!room) throw new Error('未选择车间')
  if (!code) throw new Error('缺少生产编号')

  const filters = [
    {
      controlId: NORMAL_PROCESS_FIELD_MAP.productionCode,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [code]
    },
    {
      controlId: NORMAL_PROCESS_FIELD_MAP.workshop,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [room]
    },
    {
      controlId: NORMAL_PROCESS_FIELD_MAP.dispatchType,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: ['正常派工']
    }
  ]

  const res = await callWorkflowListAll({
    worksheetId: NORMAL_PROCESS_WORKSHEET_ID,
    filters,
    silent: true
  }, 100)

  const rows = (Array.isArray(res?.data) ? res.data : []).map((item) => {
    const names = extractRelationNames(item[NORMAL_PROCESS_FIELD_MAP.processName])
    const rowids = extractRelationRowids(item[NORMAL_PROCESS_FIELD_MAP.processName])
    return {
      rowid: item.rowid || '',
      sequence: String(item[NORMAL_PROCESS_FIELD_MAP.sequence] ?? '').trim(),
      processName: formatNormalProcessName(item[NORMAL_PROCESS_FIELD_MAP.processName]),
      // 工艺调整接口需要工序字典 rowid；无法从关联字段取到时保持为空，由调用方拦截提交
      processDictRowid: rowids[0] || ''
    }
  })
  rows.sort((a, b) => (parseFloat(a.sequence) || 0) - (parseFloat(b.sequence) || 0))
  return rows
}



