/**
 * 根据登录权限得到页面默认车间（与权限一致，不做喷涂/组装等映射）。
 * @param {string|null|undefined} loginLimits
 * @returns {string} trim 后的车间名；入参为空则返回 ''
 */
export function defaultWorkshopFromLoginLimits(loginLimits) {
  const w = typeof loginLimits === 'string' ? loginLimits.trim() : ''
  return w
}
