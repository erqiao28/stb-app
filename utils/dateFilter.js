/**
 * 日期接口筛选构造器（明道云 / HAP 工作表查询接口通用）
 *
 * 背景：日期控件不适合在前端筛选——需要先把全量数据拉回再本地过滤，数据量大时既慢又浪费流量。
 * 接口层日期筛选已实测验证（见登录页「日期接口测试」），结论如下：
 *   - filterType 2 (Eq) + values=[日期]：对日期控件不生效，会把当天数据全部筛空 → 不可用；
 *   - filterType 17 (DateEnum「日期是」) + dateRange=18/dateRangeType=1 自定义日期
 *     + value=yyyy-MM-dd → 生效（推荐，本文件默认写法）；
 *   - filterType 31 (DateBetween) + minValue/maxValue 整天区间 → 同样生效（备用写法）。
 *
 * 用法：把返回值 push 进 callWorkflowListAPIPaged / callWorkflowListAll 的 filters 数组，
 * 与其它筛选条件（车间、状态等）并列即可，接口按 AND 拼接全部条件。
 */

/** 日期控件在 HAP 中的数据类型标识（15 = 日期 yyyy-MM-dd） */
export const DATE_FIELD_DATA_TYPE = 15

/**
 * 生成 DateEnum(17)「日期是」整日筛选条件（推荐写法，按 yyyy-MM-dd 精确匹配一天）
 * @param {Object} opts 构造参数
 * @param {string} opts.controlId - 日期控件 ID（工作表结构中的字段 ID）
 * @param {string} [opts.date] - 目标日期 yyyy-MM-dd；为空返回 null（调用方可直接跳过）
 * @param {number} [opts.dataType=DATE_FIELD_DATA_TYPE] - 控件数据类型，日期控件固定 15
 * @returns {Object|null} 可直接 push 进 filters 的筛选条件；controlId 或 date 缺失时返回 null
 */
export const buildDateEnumFilter = ({ controlId, date, dataType = DATE_FIELD_DATA_TYPE } = {}) => {
	if (!controlId || !date) return null
	return {
		controlId,
		dataType,
		spliceType: 1, // AND 拼接
		filterType: 17, // DateEnum「日期是」
		dateRange: 18, // 自定义日期
		dateRangeType: 1,
		value: date, // yyyy-MM-dd
		values: []
	}
}

/**
 * 生成 DateBetween(31) 整天区间筛选条件（备用写法，效果同 DateEnum 整日匹配）
 * @param {Object} opts 同 buildDateEnumFilter
 * @returns {Object|null}
 */
export const buildDateBetweenFilter = ({ controlId, date, dataType = DATE_FIELD_DATA_TYPE } = {}) => {
	if (!controlId || !date) return null
	return {
		controlId,
		dataType,
		spliceType: 1, // AND 拼接
		filterType: 31, // DateBetween「在范围内（日期）」
		dateRange: 18, // 自定义日期
		dateRangeType: 1,
		minValue: `${date} 00:00:00`,
		maxValue: `${date} 23:59:59`,
		values: []
	}
}

export default {
	DATE_FIELD_DATA_TYPE,
	buildDateEnumFilter,
	buildDateBetweenFilter
}
