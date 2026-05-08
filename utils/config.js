// utils/config.js
/**
 * 项目全局配置文件
 * 使用前请根据实际项目修改以下配置
 * 接口完整列表见 utils/api.js
 */

import { WORKFLOW_API } from './api'

export default {
  /**
   * 项目标识前缀
   * 用于本地存储、设备ID等标识，避免与其他项目冲突
   * 建议使用：公司简称_项目名称_
   * 示例：cdx_merchant_ / mycompany_app_
   */
  PROJECT_PREFIX: 'YOU_PROJECT_PREFIX',

  /**
   * 工作流 API（基址与各 Hook 详见 utils/api.js）
   */
  WORKFLOW_API,
}
