/**
 * 派工「添加员工」：按车间与当前所选工序名，推导员工岗位字段（含关键字即匹配）用于排序与预选。
 * 岗位字段来自员工档案 controlId，由页面映射为 option.position。
 */

/**
 * @param {string} workshop 页面当前车间
 * @param {string[]} processNames 当前涉及的工序名称列表（单选/多选/一对多工序行）
 * @returns {string[]} 用于匹配岗位包含关系的关键字（去重）
 */
export function getPositionKeywordsForDispatch(workshop, processNames) {
  const names = (processNames || []).map((n) => String(n || '').trim()).filter(Boolean)
  if (!names.length) return []

  const keywords = new Set()

  // 喷涂车间：优先区始终包含岗位含「喷涂」的员工；若所选工序含「高温过炉」则仅此关键字；否则另加工序名称（去重）一并匹配
  if (workshop === '喷涂车间') {
    if (names.some((n) => String(n).includes('高温过炉'))) {
      return ['喷涂']
    }
    const seen = new Set()
    const out = []
    seen.add('喷涂')
    out.push('喷涂')
    for (const n of names) {
      const s = String(n || '').trim()
      if (!s || seen.has(s)) continue
      seen.add(s)
      out.push(s)
    }
    return out
  }

  if (workshop === '拉伸车间') {
    for (const n of names) {
      if (n.includes('整口')) keywords.add('整口')
      if (n.includes('冲边')) keywords.add('冲边')
      if (n.includes('车边')) keywords.add('车边')
      if (n.includes('包边')) keywords.add('包边')
      if (n.includes('拉伸')) keywords.add('拉伸')
    }
    return Array.from(keywords)
  }

  // 抛光车间：工序名中出现的片段与岗位包含匹配；同时保留完整工序名便于「工序↔岗位」直接对应
  if (workshop === '抛光车间') {
    const commonParts = ['磨口边', '刷内底', '刷漆', '刷底', '收货', '哑光']
    for (const n of names) {
      const s = String(n || '').trim()
      if (!s) continue
      for (const t of commonParts) {
        if (s.includes(t)) keywords.add(t)
      }
      keywords.add(s)
    }
    return Array.from(keywords)
  }

  if (workshop === '组装车间') {
    for (const n of names) {
      if (n.includes('去油')) keywords.add('去油')
      if (n.includes('超声波')) keywords.add('超声波')
      if (n.includes('点焊')) keywords.add('点焊')
      if (n.includes('喷砂收锅')) keywords.add('喷砂收锅')
      else if (n.includes('喷砂')) keywords.add('喷砂')
      if (n.includes('包装')) keywords.add('组装')
      // 工序如「组装-点焊」「组装-喷砂」：已按专名匹配岗位，不再因含「组装」落到泛化组装
      if (
        n.includes('组装') &&
        !n.includes('去油') &&
        !n.includes('超声波') &&
        !n.includes('点焊') &&
        !n.includes('喷砂')
      ) {
        keywords.add('组装')
      }
    }
  }

  // 其他车间：按需在此处补充 工序→岗位关键字

  return Array.from(keywords)
}

/**
 * @param {Array<{ value: any, position?: string }>} options
 * @param {string[]} keywords
 * @param {number} maxSelection AddWorkerRadiobox 的 maxSelection，0 表示不限制
 */
export function pickAutoSelectEmployeeIds(options, keywords, maxSelection) {
  if (!keywords?.length || !options?.length) return []

  const matched = []
  for (const opt of options) {
    const pos = String(opt.position || '')
    if (keywords.some((kw) => pos.includes(kw))) {
      matched.push(opt.value)
    }
  }

  if (maxSelection === 1) {
    return matched.length ? [matched[0]] : []
  }
  if (maxSelection > 0) {
    return matched.slice(0, maxSelection)
  }
  return matched
}

/**
 * 从工序名片段推导岗位匹配的候选关键字（越多越好匹配档案里的简称）
 */
function variantsFromProcessSegment(segment) {
  const raw = String(segment || '').trim()
  if (!raw) return []
  const seen = new Set()
  const out = []
  const push = (x) => {
    const t = String(x || '').trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }
  push(raw)
  // 拉锅+计数 ↔ 拉锅计数
  push(raw.replace(/\+/g, ''))
  // 去掉圈号（岗位常写「质检」「收锅」不配「质检①」「收锅②」）
  const noCircle = raw.replace(/[①②③④⑤⑥⑦⑧⑨⑩⓪]/g, '').trim()
  if (noCircle && noCircle !== raw) {
    push(noCircle)
    push(noCircle.replace(/\+/g, ''))
  }
  return out
}

/**
 * 工序名拆成若干匹配片段：整段优先，再按「-」「/」分段；末段优先（如「新底漆-喷枪手」先尝试整名，再「喷枪手」），以便岗位只写工种时对上。
 */
function variantsFromSprayProcessName(processName) {
  const s = String(processName || '').trim()
  if (!s) return []
  const seen = new Set()
  const out = []
  const push = (x) => {
    const t = String(x || '').trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }
  push(s)
  for (const v of variantsFromProcessSegment(s)) {
    if (v !== s) push(v)
  }
  const parts = s.split(/[-－\/]/).map((x) => x.trim()).filter(Boolean)
  for (let i = parts.length - 1; i >= 0; i--) {
    for (const v of variantsFromProcessSegment(parts[i])) {
      push(v)
    }
  }
  for (const p of parts) {
    for (const v of variantsFromProcessSegment(p)) {
      push(v)
    }
  }
  return out
}

/**
 * 喷涂车间派工表：按工序生产顺序（orderedProcessNames，与箭头 sequence 一致）依次用工序名匹配岗位；
 * 岗位多为工种片段（如含「喷枪手」），与完整工序名「新底漆-喷枪手」分段匹配；
 * 该道工序仍匹配不上时再尝试岗位含「喷涂」；每名员工至多占一道工序槽；其余员工保持原相对顺序接在后面。
 * @param {Array<{ id: any, position?: string }>} employees
 * @param {string[]} orderedProcessNames
 */
export function reorderEmployeesBySprayProcessSequence(employees, orderedProcessNames) {
  const list = Array.isArray(employees) ? [...employees] : []
  const names = (orderedProcessNames || []).map((n) => String(n || '').trim()).filter(Boolean)
  if (!list.length || !names.length) return list

  const sprayKw = '喷涂'
  const used = new Set()
  const result = []
  const nid = (e) => String(e?.id ?? '')

  const takeOne = (keyword) =>
    list.find((e) => {
      if (used.has(nid(e))) return false
      return String(e.position || '').includes(keyword)
    })

  const takeOneForProcess = (processName) => {
    for (const variant of variantsFromSprayProcessName(processName)) {
      const found = list.find((e) => {
        if (used.has(nid(e))) return false
        return String(e.position || '').includes(variant)
      })
      if (found) return found
    }
    return null
  }

  for (const kw of names) {
    let e = takeOneForProcess(kw)
    if (!e && kw !== sprayKw) {
      e = takeOne(sprayKw)
    }
    if (e) {
      used.add(nid(e))
      result.push(e)
    }
  }

  for (const e of list) {
    if (!used.has(nid(e))) result.push(e)
  }
  return result
}

/** 抛光车间：主匹配未命中岗位时，岗位含「机抛」「抛光」的员工次优先展示 */
export const POLISH_FALLBACK_POSITION_KEYWORDS = ['机抛', '抛光']

/**
 * 添加员工弹窗：喷涂与组装车间共用的岗位筛选（按钮文案与岗位包含匹配用的关键字，可多关键字 OR）
 */
export const ADD_EMPLOYEE_MODAL_FILTERS_SPRAY_ASSEMBLY_SHARED = [
  { label: '喷涂', keywords: ['喷涂'] },
  { label: '去油', keywords: ['去油'] },
  { label: '超声波', keywords: ['超声波'] },
  { label: '喷砂', keywords: ['喷砂'] },
  { label: '点焊', keywords: ['点焊', '电焊'] },
  { label: '组装', keywords: ['组装'] }
]

/**
 * 添加员工弹窗：抛光车间独立配置（后续可与喷涂/组装分叉，不必改组件）
 */
export const ADD_EMPLOYEE_MODAL_FILTERS_POLISH_WORKSHOP = [
  ...ADD_EMPLOYEE_MODAL_FILTERS_SPRAY_ASSEMBLY_SHARED
]

/**
 * @param {string} workshop 弹窗当前所选车间（与 AddWorkerRadiobox 的 workshop 一致）
 * @returns {Array<{ label: string, keywords: string[] }>}
 */
export function getAddEmployeeModalPositionFilters(workshop) {
  const w = String(workshop || '').trim()
  if (w === '喷涂车间' || w === '组装车间') {
    return [...ADD_EMPLOYEE_MODAL_FILTERS_SPRAY_ASSEMBLY_SHARED]
  }
  if (w === '抛光车间') {
    return [...ADD_EMPLOYEE_MODAL_FILTERS_POLISH_WORKSHOP]
  }
  return []
}

/**
 * 岗位字符串是否命中该筛选项（任一 keyword 包含即算命中）
 */
export function employeePositionMatchesFilter(positionText, filterItem) {
  if (!filterItem?.keywords?.length) return true
  const pos = String(positionText || '')
  return filterItem.keywords.some((kw) => pos.includes(String(kw)))
}
