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
		<view class="btn-list">
			<view class="btn-item" @click="goTimeWork">记时派工</view>
			<view class="btn-item" @click="goDispatchInquiry">派工查询</view>
			<view class="btn-item" @click="goWorkload">员工工作量查询</view>
			<view class="btn-item" v-if="workshop === '组装车间'" @click="goDispatchInquiryMore">多对多派工查询</view>
		</view>

		<!-- 搜索区域：销售订单 + 查询 + 排产类型（右侧） -->
		<view class="search-box">
			<view class="salesOrder">
				<text class="salesOrder-text">销售订单</text>
				<view class="input-box">
					<input type="text" v-model="searchForm.salesOrder" placeholder="请输入销售订单" />
				</view>
			</view>
			<view class="btn-item search-btn" @click="search">查询</view>
			<picker
				mode="selector"
				:range="billTypeOptions"
				:value="billTypeIndex"
				@change="onBillTypeChange"
				class="bill-type-picker"
			>
				<view class="picker-inner">
					<text class="picker-value">{{ billTypeOptions[billTypeIndex] }}</text>
					<text class="picker-arrow">▼</text>
				</view>
			</picker>
		</view>

		<!-- 订单列表：订单编号、出货时间、客户名称、产品数量、返工产品数量 -->
		<view class="orderList">
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
						<text class="label">产品数量：</text>
						<text class="value product-count-value">{{ item.productCount }}</text>
					</view>
					<view class="col col-rework">
						<text class="label">返工产品数量：</text>
						<text class="value rework-count-value">{{ item.reworkProductCount }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { ref, watch } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const STORAGE_KEY = 'selectBillsSearch'
/** 工作表字段：返工数量（用于汇总「返工产品数量」：同订单下该值大于 0 的条数） */
const FIELD_REWORK_QTY = '6971989c3b5e707f84cb78e1'

// 车间：与派工页面一致，根据登录账号固定（loginLimits）
const workshop = ref('拉伸车间')
// 排产类型：与接口字段 694a3954687045435008a7c3 一致（正常排产 / 返工排产）
const billTypeOptions = ['正常排产', '返工排产']
const billTypeIndex = ref(0)

const billsList = ref([])
const searchForm = ref({ salesOrder: '' })

const onBillTypeChange = async (e) => {
	const idx = Number(e.detail.value)
	if (!Number.isNaN(idx) && idx >= 0 && idx < billTypeOptions.length) {
		billTypeIndex.value = idx
		await search()
	}
}

onLoad((options) => {
	// 优先从登录权限取车间
	if (userStore.loginLimits && userStore.loginLimits.trim()) {
		workshop.value = userStore.loginLimits
	} else if (options && options.workshop) {
		workshop.value = options.workshop
	}
	// 恢复持久化的销售订单、排产类型
	try {
		const saved = uni.getStorageSync(STORAGE_KEY)
		if (saved && typeof saved === 'object') {
			if (saved.salesOrder !== undefined) {
				searchForm.value.salesOrder = saved.salesOrder || ''
			}
			const idx = saved.billTypeIndex
			if (
				typeof idx === 'number' &&
				idx >= 0 &&
				idx < billTypeOptions.length
			) {
				billTypeIndex.value = idx
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
		workshop.value = userStore.loginLimits
	}
})

const getBillsListRaw = async () => {
	const res = await callWorkflowListAPIPaged(
		{
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
					values: ['已排产']
				}
			]
		},
		1000,
		1
	)
	return res
}

const search = async () => {
	const billsRes = await getBillsListRaw()
	console.log(
		'[选择订单] 获取的订单编号:',
		(billsRes?.data || []).map(item => item['655e1cbbbd2094b316347f92'] || '')
	)
	if (!billsRes.data || billsRes.data.length === 0) {
		billsList.value = []
		return
	}

	// 先过滤：66974cda2503723eec1af600 不为空；69a8e4563b5e707f84d33c0c 大于 0
	const v = (item) => item['66974cda2503723eec1af600']
	const filteredData = billsRes.data.filter(item => {
		const val = v(item)
		if (val == null || val === '' || String(val).trim() === '' || val === '[]') return false
		const num = Number(item['69a8e4563b5e707f84d33c0c'])
		return !Number.isNaN(num) && num > 0
	})
	if (!filteredData.length) {
		billsList.value = []
		return
	}

	// 调试：打印订单号为 STB260119-004 的原始数据及 66974cda2503723eec1af600 字段
	// 再按订单（655e1cbbbd2094b316347f92）汇总：同一订单只显示一条，产品数量为该订单的条数，客户名称、出货时间取该订单第一条
	const orderMap = {}
	filteredData.forEach(item => {
		const orderCode = item['655e1cbbbd2094b316347f92'] || ''
		if (!orderMap[orderCode]) {
			orderMap[orderCode] = {
				count: 0,
				reworkProductCount: 0,
				customerName: item['69a8ed3c3b5e707f84d33f8b'] || '',
				deliveryTime: item['69ad33ee3b5e707f84d43b09'] || ''
			}
		}
		orderMap[orderCode].count += 1
		const reworkNum = Number(item[FIELD_REWORK_QTY])
		if (!Number.isNaN(reworkNum) && reworkNum > 0) {
			orderMap[orderCode].reworkProductCount += 1
		}
	})

	let list = Object.keys(orderMap).map(orderCode => ({
		orderCode,
		customerName: orderMap[orderCode].customerName,
		deliveryTime: orderMap[orderCode].deliveryTime,
		productCount: orderMap[orderCode].count,
		reworkProductCount: orderMap[orderCode].reworkProductCount
	}))

	// 按销售订单关键字模糊过滤
	const keyword = (searchForm.value.salesOrder || '').trim().toLowerCase()
	if (keyword) {
		list = list.filter(item =>
			(item.orderCode || '').toString().toLowerCase().includes(keyword)
		)
	}

	// 按出货时间升序排列，时间越久的在越下方（无出货时间的排到最后）
	list.sort((a, b) => {
		const ta = (a.deliveryTime || '').toString().trim()
		const tb = (b.deliveryTime || '').toString().trim()
		if (!ta && !tb) return 0
		if (!ta) return 1
		if (!tb) return -1
		return ta.localeCompare(tb)
	})

	billsList.value = list
}

// 左箭头固定返回到 index 页面
const quit = () => {
	uni.redirectTo({
		url: '/pages/index/index'
	})
}

const selectOrder = (item) => {
	// 进入选择产品页面：车间、订单编号、排产类型（与列表筛选一致）
	const billType = billTypeOptions[billTypeIndex.value] || '正常排产'
	uni.navigateTo({
		url: `/pages/selectProduct/selectProduct?workshop=${encodeURIComponent(
			workshop.value
		)}&orderCode=${encodeURIComponent(item.orderCode || '')}&billType=${encodeURIComponent(billType)}`
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
		}
	}

	/* 顶部功能按钮栏；与搜索区排产下拉、查询按钮共用同一套外观 */
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
	.search-box .bill-type-picker .picker-inner,
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

	.search-box .bill-type-picker .picker-inner {
		position: relative;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding-left: px2vw(40px);
		padding-right: px2vw(40px);
		box-sizing: border-box;
	}

	.search-box .bill-type-picker .picker-value {
		width: 100%;
		text-align: center;
		color: #fff;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		box-sizing: border-box;
	}

	.search-box .bill-type-picker .picker-arrow {
		position: absolute;
		right: px2vw(22px);
		top: 50%;
		transform: translateY(-50%);
		font-size: px2vw(20px);
		color: #fff;
		opacity: 0.95;
		pointer-events: none;
	}

	.search-box {
		/* 排产下拉与查询按钮同宽 */
		$search-row-btn-w: px2vw(340px);

		display: flex;
		align-items: center;
		width: 100%;
		background-color: #fff;
		min-height: px2vw(120px);
		padding: px2vw(10px) px2vw(10px);
		margin: px2vw(10px) px2vw(5px);
		border-radius: px2vw(18px);
		box-sizing: border-box;
		gap: px2vw(10px);

		.bill-type-picker {
			flex: 0 0 $search-row-btn-w;
			width: $search-row-btn-w;
			box-sizing: border-box;
		}

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
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;

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

						.value.rework-count-value {
							color: #d46b08;
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

					.col-right,
					.col-rework {
						flex: 0 0 auto;
						justify-content: flex-end;
					}
				}
			}
		}
	}
}
</style>
