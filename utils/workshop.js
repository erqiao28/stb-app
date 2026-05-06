/**
 * 根据登录权限车间得到页面默认车间。
 * 喷涂车间权限（邓晋波等）在派工/查询等业务中默认按组装车间处理。
 * @param {string|null|undefined} loginLimits
 * @returns {string} 映射后的车间名；入参为空则返回 ''
 */
export function defaultWorkshopFromLoginLimits(loginLimits) {
  const w = typeof loginLimits === 'string' ? loginLimits.trim() : ''
  if (!w) return ''
  return w === '喷涂车间' ? '组装车间' : w
}
