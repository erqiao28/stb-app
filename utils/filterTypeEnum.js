/**
 * FilterTypeEnum - 工作流API过滤类型枚举
 * 来源：HAP平台FilterTypeEnum定义
 * 使用方式：在callWorkflowListAPIPaged的filters参数中指定filterType
 */

export const FilterTypeEnum = {
  /** 0 - Default - 默认 */
  Default: 0,
  /** 1 - Like - 包含 */
  Like: 1,
  /** 2 - Eq - 是（等于） */
  Eq: 2,
  /** 3 - Start - 开头为 */
  Start: 3,
  /** 4 - End - 结尾为 */
  End: 4,
  /** 5 - NContain - 不包含 */
  NContain: 5,
  /** 6 - Ne - 不是（不等于） */
  Ne: 6,
  /** 7 - IsNull - 为空 */
  IsNull: 7,
  /** 8 - HasValue - 不为空 */
  HasValue: 8,
  /** 11 - Between - 在范围内 */
  Between: 11,
  /** 12 - NBetween - 不在范围内 */
  NBetween: 12,
  /** 13 - Gt - > */
  Gt: 13,
  /** 14 - Gte - >= */
  Gte: 14,
  /** 15 - Lt - < */
  Lt: 15,
  /** 16 - Lte - <= */
  Lte: 16,
  /** 17 - DateEnum - 日期是 */
  DateEnum: 17,
  /** 18 - NDateEnum - 日期不是 */
  NDateEnum: 18,
  /** 21 - MySelf - 我拥有的 */
  MySelf: 21,
  /** 22 - UnRead - 未读 */
  UnRead: 22,
  /** 23 - Sub - 下属 */
  Sub: 23,
  /** 24 - RCEq - 关联控件是 */
  RCEq: 24,
  /** 25 - RCNe - 关联控件不是 */
  RCNe: 25,
  /** 26 - ArrEq - 数组等于 */
  ArrEq: 26,
  /** 27 - ArrNe - 数组不等于 */
  ArrNe: 27,
  /** 31 - DateBetween - 在范围内（日期） */
  DateBetween: 31,
  /** 32 - DateNBetween - 不在范围内（日期） */
  DateNBetween: 32,
  /** 33 - DateGt - >（日期） */
  DateGt: 33,
  /** 34 - DateGte - >=（日期） */
  DateGte: 34,
  /** 35 - DateLt - <（日期） */
  DateLt: 35,
  /** 36 - DateLte - <=（日期） */
  DateLte: 36,
  /** 41 - NormalUser - 常规用户 */
  NormalUser: 41,
  /** 42 - PortalUser - 外部门户用户 */
  PortalUser: 42
}

/**
 * 过滤类型说明映射（用于调试和日志）
 */
export const FilterTypeDesc = {
  0: 'Default(默认)',
  1: 'Like(包含)',
  2: 'Eq(是/等于)',
  3: 'Start(开头为)',
  4: 'End(结尾为)',
  5: 'NContain(不包含)',
  6: 'Ne(不是/不等于)',
  7: 'IsNull(为空)',
  8: 'HasValue(不为空)',
  11: 'Between(在范围内)',
  12: 'NBetween(不在范围内)',
  13: 'Gt(>)',
  14: 'Gte(>=)',
  15: 'Lt(<)',
  16: 'Lte(<=)',
  17: 'DateEnum(日期是)',
  18: 'NDateEnum(日期不是)',
  21: 'MySelf(我拥有的)',
  22: 'UnRead(未读)',
  23: 'Sub(下属)',
  24: 'RCEq(关联控件是)',
  25: 'RCNe(关联控件不是)',
  26: 'ArrEq(数组等于)',
  27: 'ArrNe(数组不等于)',
  31: 'DateBetween(在范围内-日期)',
  32: 'DateNBetween(不在范围内-日期)',
  33: 'DateGt(>-日期)',
  34: 'DateGte(>=-日期)',
  35: 'DateLt(<-日期)',
  36: 'DateLte(<=-日期)',
  41: 'NormalUser(常规用户)',
  42: 'PortalUser(外部门户用户)'
}

/**
 * 快捷创建filter对象
 * @param {string} controlId - 控件ID
 * @param {number} dataType - 数据类型
 * @param {number} filterType - 过滤类型（FilterTypeEnum值）
 * @param {Array} values - 过滤值数组
 * @param {number} spliceType - 拼接类型（1=AND, 2=OR）
 * @returns {Object}
 */
export function createFilter(controlId, dataType, filterType, values = [], spliceType = 1) {
  return {
    controlId,
    dataType,
    spliceType,
    filterType,
    values: Array.isArray(values) ? values : [values]
  }
}
