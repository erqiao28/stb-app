/**
 * 从规格型号文本中提取某标签后的值：标签后第一个冒号（: / ：）到第一个分号（; / ；）之间，标签匹配不区分大小写。
 * @param {string} models 规格型号原文
 * @param {string} keyword 标签名，如「锅口」「工艺」「抛光」
 * @returns {string}
 */
export function extractSpecFromModels(models, keyword) {
  const str = models == null ? '' : String(models).trim()
  const kw = keyword == null ? '' : String(keyword).trim()
  if (!str || !kw) return ''

  const lower = str.toLowerCase()
  const kwLower = kw.toLowerCase()
  const idx = lower.indexOf(kwLower)
  if (idx < 0) return ''

  const afterKw = str.slice(idx + kw.length)
  const colonMatch = afterKw.match(/[:：]/)
  if (!colonMatch || colonMatch.index == null) return ''

  const valueStart = colonMatch.index + colonMatch[0].length
  const rest = afterKw.slice(valueStart)
  const semiMatch = rest.match(/[;；]/)
  const value = semiMatch ? rest.slice(0, semiMatch.index) : rest
  return value.trim()
}
