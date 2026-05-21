<template>
	<view class="selectBills-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				选择订单
			</view>
			<view></view>
		</view>
		<!-- 顶部功能按钮栏：派工查询、员工工作量查询、多对多派工查询、记时派工 -->
		<view class="btn-list" v-show="false">
			<view class="btn-item" @click="goTimeWork">记时派工</view>
			<view class="btn-item" @click="goDispatchInquiry">派工查询</view>
			<view class="btn-item" @click="goWorkload">员工工作量查询</view>
			<view class="btn-item" v-if="workshop === '组装车间' || workshop === '喷涂车间'" @click="goDispatchInquiryMore">多对多派工查询</view>
		</view>

		<!-- 搜索区域：销售订单 + 查询（排产类型由入口参数/缓存固定，不再提供切换按钮） -->
		<view class="search-box">
			<view class="salesOrder">
				<text class="salesOrder-text">销售订单</text>
				<view class="input-box">
					<input type="text" v-model="searchForm.salesOrder" placeholder="请输入销售订单" />
				</view>
			</view>
			<view class="btn-item search-btn" @click="search">查询</view>
		</view>

		<!-- 订单列表：订单编号、出货时间、客户名称、产品数量（返工排产时显示为返工产品数量）；上拉加载更多 -->
		<scroll-view
			class="orderList"
			scroll-y
			:lower-threshold="100"
			@scrolltolower="onScrollToLower"
		>
			<view class="orderItem" v-for="item in billsList" :key="item.orderCode" @click="selectOrder(item)">
				<view class="goodsInfo row-single">
					<view class="col col-left">
						<text class="label">订单编号：</text>
						<text class="value">{{ item.orderCode }}</text>
					</view>
					<view class="col col-delivery">
						<text class="label">出货时间：</text>
						<text class="value delivery-time-value">{{ item.deliveryTime || '-' }}</text>
					</view>
					<view class="col col-center">
						<text class="label">客户名称：</text>
						<text class="value">{{ item.customerName || '-' }}</text>
					</view>
					<view class="col col-right">
						<text class="label">{{ billTypeIndex === 1 ? '返工产品数量' : '产品数量' }}：</text>
						<text class="value product-count-value">{{ item.productCount }}</text>
					</view>
				</view>
			</view>
			<view v-if="loadingMore" class="list-footer">加载中...</view>
			<view v-else-if="!hasMore && billsList.length" class="list-footer">没有更多了</view>
			<view v-else-if="hasMore && billsList.length" class="list-footer hint">上拉加载更多</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { ref, watch } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import { defaultWorkshopFromLoginLimits } from '../../utils/workshop'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const STORAGE_KEY = 'selectBillsSearch'

// 车间：与派工页面一致，根据登录账号固定（loginLimits）
const workshop = ref('拉伸车间')
// 排产类型：与接口字段 694a3954687045435008a7c3 一致（正常排产 / 返工排产）
const billTypeOptions = ['正常排产', '返工排产']
const billTypeIndex = ref(0)
const isBillTypeReadonly = ref(false)

const billsList = ref([])
const searchForm = ref({ salesOrder: '' })

/** 每页条数（与接口分页一致，避免单次请求过大） */
const LIST_PAGE_SIZE = 100
const listPageNum = ref(1)
const hasMore = ref(true)
const accumulatedRawRows = ref([])
const loadingMore = ref(false)
const listLoading = ref(false)

onLoad((options) => {
	let hasExplicitBillType = false
	// 优先从登录权限取车间（与权限一致）
	if (userStore.loginLimits && userStore.loginLimits.trim()) {
		workshop.value = defaultWorkshopFromLoginLimits(userStore.loginLimits.trim())
	} else if (options && options.workshop) {
		const ow = decodeURIComponent(String(options.workshop)).trim()
		workshop.value = defaultWorkshopFromLoginLimits(ow) || ow
	}
	// 通过入口参数指定默认排产类型（优先使用数字索引，其次中文值）
	const routeBillTypeIdxRaw = options?.billTypeIndex
	const routeBillTypeIdx = Number(routeBillTypeIdxRaw)
	if (
		routeBillTypeIdxRaw !== undefined &&
		routeBillTypeIdxRaw !== '' &&
		Number.isFinite(routeBillTypeIdx) &&
		routeBillTypeIdx >= 0 &&
		routeBillTypeIdx < billTypeOptions.length
	) {
		billTypeIndex.value = routeBillTypeIdx
		hasExplicitBillType = true
	}
	// 兼容中文参数
	const routeBillTypeRaw = options?.billType || options?.type
	const routeBillType = routeBillTypeRaw ? decodeURIComponent(routeBillTypeRaw).trim() : ''
	if (routeBillType && !hasExplicitBillType) {
		const idx = billTypeOptions.indexOf(routeBillType)
		if (idx >= 0) {
			billTypeIndex.value = idx
			hasExplicitBillType = true
		}
	}
	// 入口要求：向选择产品/派工传递 billTypeReadonly（排产类型已固定，无页面内切换）
	const readonlyFlag = String(options?.billTypeReadonly || '')
	isBillTypeReadonly.value = readonlyFlag === '1' || readonlyFlag.toLowerCase() === 'true'
	// 恢复持久化的销售订单、排产类型
	try {
		const saved = uni.getStorageSync(STORAGE_KEY)
		if (saved && typeof saved === 'object') {
			if (saved.salesOrder !== undefined) {
				searchForm.value.salesOrder = saved.salesOrder || ''
			}
			// 若入口明确指定了排产类型，则不使用本地持久化覆盖
			if (!hasExplicitBillType) {
				const idx = saved.billTypeIndex
				if (
					typeof idx === 'number' &&
					idx >= 0 &&
					idx < billTypeOptions.length
				) {
					billTypeIndex.value = idx
				}
			}
		}
	} catch (e) {
		// ignore
	}
	search()
})

// 销售订单、排产类型变化时持久化
watch(
	() => [searchForm.value.salesOrder, billTypeIndex.value],
	([salesOrder, idx]) => {
		try {
			uni.setStorageSync(STORAGE_KEY, {
				salesOrder: salesOrder || '',
				billTypeIndex: idx
			})
		} catch (e) {
			// ignore
		}
	}
)

onShow(() => {
	if (userStore.loginLimits && userStore.loginLimits.trim()) {
		workshop.value = defaultWorkshopFromLoginLimits(userStore.loginLimits.trim())
	}
})

const buildQueryPayload = (extra = {}) => ({
	worksheetId: 'paichanjihua',
	filters: [
		{
			controlId: '67de26c9c5377d50a523c735',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: [workshop.value]
		},
		{
			controlId: '694a3954687045435008a7c3',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: [billTypeOptions[billTypeIndex.value]]
		},
		{
			controlId: '655b875ffc44a9469a3aa225',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: ['已排产', '部分排产']
		},
		{
			controlId: '69db0017665ab27f3913c455',
			dataType: 30,
			spliceType: 1,
			filterType: 6,
			values: ['准时交货']
		},
		{
			controlId: '66974cda2503723eec1af600',
			dataType: 30,
			spliceType: 1,
			filterType: 8
		}
	],
	...extra
})

/** 请求一页；loadMore 时 silent 避免重复全屏 loading */
const fetchBillsPage = async (pageNum, silent = false) => {
	return await callWorkflowListAPIPaged(
		buildQueryPayload(silent ? { silent: true } : {}),
		LIST_PAGE_SIZE,
		pageNum
	)
}

/** 本页是否还可能存在下一页 */
const updateHasMoreFromResponse = (res, pageNum) => {
	const rows = res?.data || []
	if (!rows.length || rows.length < LIST_PAGE_SIZE) return false
	const total = Number(res?.total) || 0
	if (total > 0 && pageNum * LIST_PAGE_SIZE >= total) return false
	return true
}

/**
 * 将已累积的原始行过滤、按订单汇总、关键字与排序（与原先单次拉取逻辑一致）
 */
const buildDisplayListFromRawRows = (rawRows) => {
	if (!rawRows || rawRows.length === 0) {
		return []
	}

	// 正常排产：69a8e4563b5e707f84d33c0c（未完成工序数量）需大于 0
	// 返工排产：不用数量>0；按 69ccb3e7665ab27f39105da2 返工进度，排除「已完成」
	const FIELD_REWORK_PROGRESS = '69ccb3e7665ab27f39105da2'
	const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
	const isReworkProgressCompleted = (item) => {
		const raw = item[FIELD_REWORK_PROGRESS]
		const p = raw == null ? '' : String(raw).trim()
		return p === '已完成'
	}
	const filteredData = rawRows.filter(item => {
		if (billTypeOptions[billTypeIndex.value] === '返工排产') {
			return !isReworkProgressCompleted(item)
		}
		const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
		return !Number.isNaN(num) && num > 0
	})
	if (!filteredData.length) {
		return []
	}

	const orderMap = {}
	filteredData.forEach(item => {
		const orderCode = item['655e1cbbbd2094b316347f92'] || ''
		if (!orderMap[orderCode]) {
			orderMap[orderCode] = {
				count: 0,
				customerName: item['69a8ed3c3b5e707f84d33f8b'] || '',
				deliveryTime: item['69ad33ee3b5e707f84d43b09'] || ''
			}
		}
		orderMap[orderCode].count += 1
	})

	let list = Object.keys(orderMap).map(orderCode => ({
		orderCode,
		customerName: orderMap[orderCode].customerName,
		deliveryTime: orderMap[orderCode].deliveryTime,
		productCount: orderMap[orderCode].count
	}))

	const keyword = (searchForm.value.salesOrder || '').trim().toLowerCase()
	if (keyword) {
		list = list.filter(item =>
			(item.orderCode || '').toString().toLowerCase().includes(keyword)
		)
	}

	list.sort((a, b) => {
		const ta = (a.deliveryTime || '').toString().trim()
		const tb = (b.deliveryTime || '').toString().trim()
		if (!ta && !tb) return 0
		if (!ta) return 1
		if (!tb) return -1
		return ta.localeCompare(tb)
	})

	return list
}

const search = async () => {
	listLoading.value = true
	listPageNum.value = 1
	accumulatedRawRows.value = []
	hasMore.value = true
	try {
		const billsRes = await fetchBillsPage(1, false)
		console.log('[选择订单] 接口完整返回 billsRes:', billsRes)
		console.log(
			'[选择订单] 接口原始 data（条数:',
			billsRes?.data?.length ?? 0,
			'）:',
			billsRes?.data
		)
		const rows = billsRes?.data || []
		accumulatedRawRows.value = rows
		hasMore.value = updateHasMoreFromResponse(billsRes, 1)

		const list = buildDisplayListFromRawRows(accumulatedRawRows.value)
		console.log('[选择订单] 汇总并排序后的页面列表 billsList:', list)
		billsList.value = list
	} finally {
		listLoading.value = false
	}
}

const loadMore = async () => {
	if (!hasMore.value || loadingMore.value || listLoading.value) return
	const nextPage = listPageNum.value + 1
	loadingMore.value = true
	try {
		const billsRes = await fetchBillsPage(nextPage, true)
		const rows = billsRes?.data || []
		console.log(
			`[选择订单] 加载更多 第${nextPage}页，条数:`,
			rows.length,
			'total:',
			billsRes?.total
		)
		accumulatedRawRows.value = accumulatedRawRows.value.concat(rows)
		listPageNum.value = nextPage
		hasMore.value = updateHasMoreFromResponse(billsRes, nextPage)
		billsList.value = buildDisplayListFromRawRows(accumulatedRawRows.value)
	} finally {
		loadingMore.value = false
	}
}

const onScrollToLower = () => {
	loadMore()
}

// 左箭头固定返回到 index 页面
const quit = () => {
	uni.redirectTo({
		url: '/pages/main/main'
	})
}

const selectOrder = (item) => {
	// 进入选择产品页面：车间、订单编号、排产类型（与列表筛选一致）
	const billType = billTypeOptions[billTypeIndex.value] || '正常排产'
	const readonlyPart = isBillTypeReadonly.value ? '&billTypeReadonly=1' : ''
	uni.navigateTo({
		url: `/pages/selectProduct/selectProduct?workshop=${encodeURIComponent(
			workshop.value
		)}&orderCode=${encodeURIComponent(item.orderCode || '')}&billTypeIndex=${billTypeIndex.value}&billType=${encodeURIComponent(billType)}&dispatchMode=order${readonlyPart}`
	})
}

// 派工查询：跳转到派工查询页面，带上当前车间（与派工页面保持一致）
const goDispatchInquiry = () => {
	uni.navigateTo({
		url: `/pages/dispatchInquiry/dispatchInquiry?workshop=${encodeURIComponent(workshop.value)}`
	})
}

// 员工工作量查询：跳转到员工工作量查询页面（与派工页面保持一致）
const goWorkload = () => {
	uni.navigateTo({
		url: '/pages/workload/workload'
	})
}

// 多对多派工查询：跳转到多对多派工查询页面
const goDispatchInquiryMore = () => {
	uni.navigateTo({
		url: `/pages/dispatchInquiryMore/dispatchInquiryMore?workshop=${encodeURIComponent(workshop.value)}`
	})
}

// 记时派工：跳转到记时派工页面
const goTimeWork = () => {
	uni.navigateTo({
		url: `/pages/timeWork/timeWork?workshop=${encodeURIComponent(workshop.value)}`
	})
}
</script>

<style scoped lang="scss">
.selectBills-container {
	height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;
	display: flex;
	flex-direction: column;

	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(35px);
			color: white;
			font-weight: bold;
		}
	}

	/* 顶部功能按钮栏；与搜索区查询按钮共用同一套外观 */
	.btn-list {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		align-items: center;

		.btn-item {
			flex: 1;
			margin: px2vw(10px);
		}
	}

	.btn-list .btn-item,
	.search-box .search-btn {
		height: px2vw(80px);
		padding: px2vw(16px) px2vw(25px);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: px2vw(18px);
		color: #fff;
		background-color: #2755f1;
		font-size: px2vw(25px);
		box-sizing: border-box;
	}

	.search-box {
		$search-row-btn-w: px2vw(340px);

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		width: 100%;
		background-color: #fff;
		min-height: px2vw(120px);
		padding: px2vw(10px) px2vw(10px);
		margin: px2vw(10px) px2vw(5px);
		border-radius: px2vw(18px);
		box-sizing: border-box;
		gap: px2vw(10px);

		.salesOrder {
			display: flex;
			align-items: center;
			flex: 1;
			min-width: 0;

			.salesOrder-text {
				font-size: px2vw(25px);
				margin-right: px2vw(10px);
				white-space: nowrap;
			}

			.input-box {
				flex: 1;
				min-width: 0;
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(24px);

				input {
					font-size: px2vw(25px);
					width: 100%;
				}
			}
		}

		.search-btn {
			flex: 0 0 $search-row-btn-w;
			width: $search-row-btn-w;
			box-sizing: border-box;
		}
	}

	.orderList {
		flex: 1;
		min-height: 0;
		height: 0;

		.list-footer {
			padding: px2vw(24px);
			text-align: center;
			font-size: px2vw(22px);
			color: #999;

			&.hint {
				color: #bbb;
			}
		}

		.orderItem {
			width: 98%;
			background-color: #fff;
			border-radius: px2vw(18px);
			margin: px2vw(15px);
			padding: px2vw(15px);

			.goodsInfo {
				&.row-single {
					display: flex;
					align-items: stretch;
					justify-content: space-between;
					font-size: px2vw(25px);
					gap: px2vw(20px);

					.col {
						display: flex;
						align-items: center;
						min-width: 0;

						.label {
							color: #666;
							margin-right: px2vw(6px);
							white-space: nowrap;
							flex-shrink: 0;
						}

						.value {
							color: #333;
							word-break: break-all;
							white-space: normal;
						}

						.value.delivery-time-value {
							color: #ff4d4f;
						}

						.value.product-count-value {
							color: #2755f1;
						}
					}

					.col-left,
					.col-delivery {
						flex: 0 0 auto;
						justify-content: flex-start;
					}

					.col-center {
						flex: 1;
						justify-content: flex-start;
						padding: 0 px2vw(10px);
					}

					.col-right {
						flex: 0 0 auto;
						justify-content: flex-end;
					}
				}
			}
		}
	}
}
</style>
