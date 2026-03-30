/**
 * 从文本中提取所有数值（整数、小数），按出现顺序用 `*` 拼接。
 *
 * @param {string|number|null|undefined} text 原始文本
 * @returns {string} 拼接结果；无数字时返回空字符串
 *
 * @example
 * extractNumbersJoinedByStar('365*/*2.5/') // '365*2.5'
 * extractNumbersJoinedByStar('  10 / 20.5  ') // '10*20.5'
 */
export function extractNumbersJoinedByStar(text) {
  if (text == null || text === '') return ''
  const matches = String(text).match(/\d+(?:\.\d+)?/g)
  if (!matches || matches.length === 0) return ''
  return matches.join('*')
}
