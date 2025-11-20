// utils/config.js
/**
 * 项目全局配置文件
 * 使用前请根据实际项目修改以下配置
 */

export default {
  /**
   * 项目标识前缀
   * 用于本地存储、设备ID等标识，避免与其他项目冲突
   * 建议使用：公司简称_项目名称_
   * 示例：cdx_merchant_ / mycompany_app_
   */
  PROJECT_PREFIX: 'YOU_PROJECT_PREFIX',

  /**
   * 工作流API配置
   */
  WORKFLOW_API: {
    // 数据详情查询端点
    TRIGGER_URL: '/api/workflow/hooks/NjkxMmRkZjQ3NDM1ZTE5MjVmMGEwYzcz',

    // 数据列表查询端点
    LIST_URL: '/api/workflow/hooks2/NjkxMmQzOTI3NDM1ZTE5MjVmMDkyMjM1',
  },
}
