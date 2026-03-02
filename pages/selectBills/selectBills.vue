<template>
	<view class="selectBills-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				选择单据
			</view>
			<view></view>
		</view>
		<!-- 搜索区域 -->
		<view class="search-box">
			<view class="salesOrder">
				<text class="salesOrder-text">销售订单</text>
				<view class="input-box">
					<input type="text" v-model="searchValue.salesOrder" placeholder="请输入销售订单" @input="search" />
				</view>
			</view>

			<view class="orderItem">
				<text class="orderItem-text">订单物品</text>
				<view class="input-box">
					<input type="text" v-model="searchValue.orderItem" placeholder="请输入订单物品" @input="search" />
				</view>
			</view>
		</view>

		<!-- 订单列表 -->
		<view class="orderList">
			<view class="orderItem" v-for="item in billsList" @click="selectOrder(item)">
				<view class="goodsInfo">
					<view class="goodsInfo-up">
						<view class="orderCode">
							<view>订单编号：</view>
							<view>{{ item.orderCode }}</view>
						</view>
						<view class="productCode">
							<view>生产执行单：</view>
							<view>{{ item.productionCode }}</view>
						</view>

						<view class="orderCount">
							<view>订单数量：</view>
							<view>{{ item.orderCount }}</view>
						</view>
					</view>
					<view class="goodsInfo-down">
						<view class="name">
							<view>产品名称：</view>
							<view>{{ item.name }}</view>
						</view>
						<view class="model">
							<view class="model-text">规格型号：</view>
							<view class="model-value">{{ item.model }}</view>
						</view>
						<view class="problemDescription"
							v-if="item.problemDescription && item.problemDescription.trim()">
							<view>问题描述：</view>
							<view>{{ item.problemDescription }}</view>
						</view>
					</view>
				</view>
				<view class="goodsProcess">
					<view class="bill-type-badge"
						:class="{ 'badge-normal': item.billType === '正常排产', 'badge-rework': item.billType === '返工排产' }"
						v-if="item.billType">{{ item.billType }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import http from '../../utils/request'
import { ref, watch } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
const { statusBarHeight } = useStatusBar()
const STORAGE_KEY = 'selectBillsSearch'
const workshop = ref('')
const billTypeFilter = ref('正常排产')  // 单据类型过滤参数：正常排产、返工排产（用于获取单据）
const billsList = ref([])  // 单据列表
const searchValue = ref({
	salesOrder: '',
	orderItem: ''
})  // 搜索输入值

onLoad((options) => {
	if (options.workshop) {
		workshop.value = options.workshop
	}
	if (options.type) {
		const type = decodeURIComponent(options.type)  // 接收单据类型参数：正常排产 或 返工排产
		billTypeFilter.value = type
	}
	// 读取本地保存的搜索条件
	try {
		const saved = uni.getStorageSync(STORAGE_KEY)
		if (saved && typeof saved === 'object') {
			searchValue.value.salesOrder = saved.salesOrder || ''
			searchValue.value.orderItem = saved.orderItem || ''
		}
	} catch (e) {
		// ignore
	}
	search()  // 默认加载时搜索
})

// 监听搜索条件变化，持久化到本地，避免页面跳转或刷新后被清空
watch(
	() => searchValue.value,
	(val) => {
		try {
			uni.setStorageSync(STORAGE_KEY, {
				salesOrder: val.salesOrder || '',
				orderItem: val.orderItem || ''
			})
		} catch (e) {
			// ignore
		}
	},
	{ deep: true }
)

const getBillsListRaw = async () => {
	const filters = [{
		"controlId": "67de26c9c5377d50a523c735",
		"dataType": 30,
		"spliceType": 1,
		"filterType": 2,
		"values": [workshop.value]
	},
	{
		"controlId": "694a3954687045435008a7c3",
		"dataType": 30,
		"spliceType": 1,
		"filterType": 2,
		"values": [billTypeFilter.value]
	}
	]
	// 其他字段过滤可添加类似
	const res = await callWorkflowListAPIPaged({
		worksheetId: 'paichanjihua',
		filters
	})
	return res
}

const search = async () => {
	// 先获取单据列表（按车间和单据类型从后端筛选）
	const billsRes = await getBillsListRaw()

	if (!billsRes.data || billsRes.data.length === 0) {
		billsList.value = []
		return
	}

	// 基础映射
	let mappedList = billsRes.data.map(item => {
		const orderCode = item['655e1cbbbd2094b316347f92']  // 旧订单编码 ID
		const billType = item['694a3954687045435008a7c3'] || '正常排产'

		return {
			orderCode,
			orderCount: item['681b0b53b139204fd264c5fd'],
			name: item['6937d255ff2b019b3cb34be3'],
			model: item['6937d255ff2b019b3cb34be4'],
			productionCode: item['698438933b5e707f84cf51fd'],
			billType: billType,
			problemDescription: item['694ba108dc025d98887fd782'] || '' // 问题描述字段
		}
	})

	// 前端模糊过滤：销售订单 -> orderCode，订单物品 -> name
	const salesOrderKeyword = (searchValue.value.salesOrder || '').trim().toLowerCase()
	const orderItemKeyword = (searchValue.value.orderItem || '').trim().toLowerCase()

	if (salesOrderKeyword || orderItemKeyword) {
		mappedList = mappedList.filter(item => {
			const orderCodeStr = (item.orderCode || '').toString().toLowerCase()
			const nameStr = (item.name || '').toString().toLowerCase()

			const matchSalesOrder = !salesOrderKeyword || orderCodeStr.includes(salesOrderKeyword)
			const matchOrderItem = !orderItemKeyword || nameStr.includes(orderItemKeyword)

			return matchSalesOrder && matchOrderItem
		})
	}

	billsList.value = mappedList
}

// 退出
const quit = () => {
	// 返回派工页面时，带上当前的单据类型（正常排产 / 返工排产），方便派工页继续按同类型处理
	uni.redirectTo({
		url: `/pages/dispatchWork/dispatchWork?type=${encodeURIComponent(billTypeFilter.value)}&workshop=${encodeURIComponent(workshop.value)}`
	})
}

const selectOrder = (item) => {
	// 直接跳转到派工页面，并通过参数传递订单号、生产单号和当前类型/车间
	const orderCode = item.orderCode || ''
	const productionCode = item.productionCode || ''
	uni.navigateTo({
		url: `/pages/dispatchWork/dispatchWork?type=${encodeURIComponent(billTypeFilter.value)}&workshop=${encodeURIComponent(workshop.value)}&orderCode=${encodeURIComponent(orderCode)}&productionCode=${encodeURIComponent(productionCode)}`
	})
}

</script>

<style scoped lang="scss">
/* 更新容器和列表样式，实现内部滚动 */

.selectBills-container {
	height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;
	display: flex;
	flex-direction: column;
	/* 垂直布局 */


	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;
		/* 防止压缩 */

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

	.search-box {
		display: flex;
		align-items: center;
		width: 100%;
		background-color: #fff;
		height: px2vw(100px);
			padding: px2vw(15px) px2vw(20px);
			margin: px2vw(10px) px2vw(10px);
		border-radius: px2vw(18px);
		justify-content: flex-start;

		.salesOrder {
			display: flex;
			align-items: center;
			flex: 0 0 30%;
			max-width: 30%;
			margin: 0 px2vw(10px) 0 0;

			.salesOrder-text {
				font-size: px2vw(25px);
				margin-right: px2vw(10px);
				white-space: nowrap;
			}

			.input-box {
				flex: 1;
				min-width: 0;
				width: auto;
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(30px);
				margin-left: px2vw(10px);

				input {
					font-size: px2vw(25px);
				}
			}
		}

		.orderItem {
			display: flex;
			align-items: center;
			flex: 0 0 30%;
			max-width: 30%;
			margin: 0 px2vw(10px);

			.orderItem-text {
				font-size: px2vw(25px);
				margin-right: px2vw(10px);
				white-space: nowrap;
			}

			.input-box {
				flex: 1;
				min-width: 0;
				width: auto;
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(30px);
				margin-left: px2vw(10px);

				input {
					font-size: px2vw(25px);
				}
			}
		}

		/* 查询按钮已移除，实时输入筛选 */
	}

	/* 订单列表 */
	.orderList {
		flex: 1;
		/* 填充剩余高度 */
		overflow-y: auto;
		/* 垂直滚动 */
		-webkit-overflow-scrolling: touch;
		/* iOS 流畅滚动 */

		.orderItem {
			width: 98%;
			background-color: #fff;
			border-radius: px2vw(18px);
			margin: px2vw(15px);
			padding: px2vw(15px);
			display: flex;
			position: relative;

			.goodsInfo {
				flex: 1;
				display: flex;
				flex-wrap: wrap;
				position: relative;
				z-index: 1;

				.goodsInfo-up {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;

					.orderCode {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}

					.productCode {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}

					.orderCount {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}
				}

				.goodsInfo-down {
					display: flex;
					width: 100%;
					justify-content: space-between;

					.name {
						display: flex;
						margin: px2vw(30px);
						font-size: px2vw(25px);
					}

					.model {
						width: px2vw(800px);
						display: flex;
						margin: px2vw(30px);
						font-size: px2vw(25px);

						.model-text {
							width: px2vw(120px);
							white-space: nowrap;
						}

						.model-value {
							flex: 1;
						}
					}

					.problemDescription {
						width: px2vw(600px);
						display: flex;
						margin: px2vw(30px);
						font-size: px2vw(25px);
						color: #f44336;

						view:first-child {
							font-weight: bold;
							margin-right: px2vw(10px);
							white-space: nowrap;
						}

						view:last-child {
							flex: 1;
							word-break: break-word;
						}
					}
				}
			}

			.goodsProcess {
				position: absolute;
				bottom: px2vw(10px);
				right: px2vw(10px);
				flex-shrink: 0;
				z-index: 100;
				pointer-events: none;

				.bill-type-badge {
					color: white;
					padding: px2vw(8px) px2vw(16px);
					border-radius: px2vw(8px);
					font-size: px2vw(22px);
					font-weight: bold;
					white-space: nowrap;
					z-index: 100;
					box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.2);

					&.badge-normal {
						background-color: #4CAF50; // 绿色 - 正常排产
					}

					&.badge-rework {
						background-color: #FFC107; // 黄色 - 返工排产
						color: white; // 白色文字
					}
				}
			}
		}
	}
}
</style>
