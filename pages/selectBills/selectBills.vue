<template>
	<view class="selectBills-container">
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
					<input type="text" v-model="searchValue.salesOrder" placeholder="请输入销售订单" />
				</view>
			</view>

			<view class="batch">
				<text class="batch-text">成品批次</text>
				<view class="input-box">
					<input type="text" v-model="searchValue.batch" placeholder="请输入成品批次" />
				</view>
			</view>

			<view class="productionOrder">
				<text class="productionOrder-text">生产执行单</text>
				<view class="input-box">
					<input type="text" v-model="searchValue.productionOrder" placeholder="请输入生产执行单" />
				</view>
			</view>

			<view class="orderItem">
				<text class="orderItem-text">订单物品</text>
				<view class="input-box">
					<input type="text" v-model="searchValue.orderItem" placeholder="请输入订单物品" />
				</view>
			</view>

			<button class="searchbtn" @click="search">查询</button>
		</view>

		<!-- 订单列表 -->
		<view class="orderList">
			<view class="orderItem" v-for="item in billsList" @click="selectOrder(item.orderCode)">
				<view class="goodsInfo">
					<view class="goodsInfo-up">
						<view class="orderGoods">
							<view>订单物品：</view>
							<view>{{ item.orderGoods }}</view>
						</view>
						<view class="orderCount">
							<view>订单数量：</view>
							<view>{{ item.orderCount }}</view>
						</view>
						<view class="name">
							<view>名称：</view>
							<view>{{ item.name }}</view>
						</view>
					</view>
					<view class="goodsInfo-down">
						<view class="model">
							<view class="model-text">规格型号：</view>
							<view class="model-value">{{ item.model }}</view>
						</view>
						<view class="completedProcess">
							<view>已完成工序：</view>
							<view>{{ item.completedProcess }}</view>
						</view>
					</view>
					<view class="processes-section" v-if="item.processes && item.processes.length > 0">
						<view class="processes-container">
							<view v-for="(process, index) in item.processes" :key="index" class="process-wrapper">
								<view class="process-item">
									<view class="progress-circle"
										:style="{ '--percent': Math.round((process.finishCount / process.needCount) * 100) + '%' }">
										<view class="progress-inner">
											<view class="progress-text">{{ process.finishCount }}/{{ process.needCount
												}}</view>
										</view>
									</view>
									<text class="process-name">{{ process.processName }}</text>
								</view>
								<view v-if="index < item.processes.length - 1" class="connector"></view>
							</view>
						</view>
					</view>
				</view>
				<view class="goodsProcess">
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import http from '../../utils/request'
import { ref } from 'vue'
const workshop = ref('')
const billsList = ref([])  // 单据列表
const processList = ref([])  // 工序列表
const searchValue = ref({
	salesOrder: '',
	batch: '',
	productionOrder: '',
	orderItem: ''
})  // 搜索输入值
const getProcessRaw = async () => {
	const filters = [{
		"controlId": "669a6cae2503723eec1b49bb",
		"dataType": 30,
		"spliceType": 1,
		"filterType": 2,
		"values": [workshop.value]
	}]
	// 添加订单物品过滤 (假设 orderItem 对应 processOrder)
	if (searchValue.value.orderItem) {
		filters.push({
			"controlId": "6593b07ae97eb866a50eeba1",
			"dataType": 30,
			"spliceType": 1,
			"filterType": 2,
			"values": [searchValue.value.orderItem]
		})
	}
	const res = await callWorkflowListAPIPaged({
		worksheetId: 'paigongdan',
		filters
	})
	return res
}

onLoad((options) => {
	if (options.workshop) {
		workshop.value = options.workshop
	}
	search()  // 默认加载时搜索
})

const getBillsListRaw = async () => {
	const filters = [{
		"controlId": "67de26c9c5377d50a523c735",
		"dataType": 30,
		"spliceType": 1,
		"filterType": 2,
		"values": [workshop.value]
	}]
	// 添加搜索过滤 (假设 salesOrder 对应订单编号 '655e1cbbbd2094b316347f92')
	if (searchValue.value.salesOrder) {
		filters.push({
			"controlId": "655e1cbbbd2094b316347f92",
			"dataType": 30,
			"spliceType": 1,
			"filterType": 2,
			"values": [searchValue.value.salesOrder]
		})
	}
	// 其他字段过滤可添加类似
	const res = await callWorkflowListAPIPaged({
		worksheetId: 'paichanjihua',
		filters
	})
	return res
}

const search = async () => {
	Promise.all([getBillsListRaw(), getProcessRaw()]).then(([billsRes, processRes]) => {
		processList.value = processRes.data.map(item => {
			return {
				processName: item['656ffd1bba5ef3863bf3ec1e'],
				needCount: item['68099ac75d6fc47331574e82'],
				finishCount: item['669b71152503723eec1b52d7'],
				processOrder: item['6593b07ae97eb866a50eeba1']
			}
		})
		console.log(processList.value)
		billsList.value = billsRes.data.map(item => {
			const orderGoods = item['691c47ee1c02c451c72a81c5']  // 新订单物品 ID
			const orderCode = item['655e1cbbbd2094b316347f92']  // 旧订单编码 ID
			const processes = processList.value.filter(p => p.processOrder === orderCode)  // 关联基于 orderCode
			return {
				orderGoods,
				orderCode,
				orderCount: item['681b0b53b139204fd264c5fd'],
				name: item['691c247e1c02c451c72a6169'],
				model: item['691c24f11c02c451c72a61ba'],
				productCode: item['691d6336535b29cbd5c6c0ca'],
				completedProcess: '0',
				processes
			}
		})
	})
}

// 退出
const quit = () => {
	uni.navigateBack()
}

const selectOrder = (orderCode) => {
	uni.$emit('selectOrder', orderCode)
	uni.navigateBack()
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
		padding: px2vw(15px);
		margin: px2vw(10px) px2vw(10px);	
		border-radius: px2vw(18px);

		.salesOrder {
			display: flex;
			margin: px2vw(15px);
			align-items: center;

			.salesOrder-text {
				font-size: px2vw(25px);
			}

			.input-box {
				width: px2vw(280px);
				height: px2vw(80px);
				border: px2vw(2px) solid #5884f1;
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

		.batch {
			display: flex;
			margin: px2vw(15px);
			align-items: center;

			.batch-text {
				font-size: px2vw(25px);
			}

			.input-box {
				width: px2vw(300px);
				height: px2vw(80px);
				border: px2vw(2px) solid #5884f1;
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

		.productionOrder {
			display: flex;
			margin: px2vw(15px);
			align-items: center;

			.productionOrder-text {
				font-size: px2vw(25px);
			}

			.input-box {
				width: px2vw(300px);
				height: px2vw(80px);
				border: px2vw(2px) solid #5884f1;
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
			margin: px2vw(15px);
			align-items: center;

			.orderItem-text {
				font-size: px2vw(25px);
			}

			.input-box {
				width: px2vw(300px);
				height: px2vw(80px);
				border: px2vw(2px) solid #5884f1;
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

		.searchbtn {
			width: px2vw(120px);
			height: px2vw(60px);
			background-color: #5884f1;
			color: white;
			border-radius: px2vw(18px);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: px2vw(25px);
		}
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

			.goodsInfo {
				width: 100%;
				display: flex;
				flex-wrap: wrap;

				.goodsInfo-up {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;

					.orderGoods {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}

					.orderCount {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}

					.name {
						display: flex;
						margin: 0 px2vw(30px);
						font-size: px2vw(25px);
					}
				}

				.goodsInfo-down {
					display: flex;
					width: 100%;
					justify-content: space-between;

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

					.completedProcess {
						display: flex;
						margin: px2vw(30px);
						font-size: px2vw(25px);
					}
				}

				.processes-section {
					width: 100%;
					display: flex;
					justify-content: center;
					margin-top: px2vw(20px);
					padding: 0 px2vw(20px);
				}

				/* 更新进程相关CSS样式，使排列更紧凑 */

				.processes-container {
					display: flex;
					align-items: flex-start;
					justify-content: flex-start;
					/* 从左往右紧凑排列 */
					width: 100%;
					flex-wrap: wrap;
					gap: px2vw(10px);
					/* 使用gap控制间距 */
				}

				.process-wrapper {
					display: flex;
					align-items: center;
					margin: 0;
					/* 移除原有margin */
				}

				.process-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin-right: 0;
					/* 移除margin-right，由gap控制 */
				}

				/* 更新进程CSS：增大圆圈并调整横线位置 */

				.progress-circle {
					width: px2vw(120px);
					height: px2vw(120px);
					border-radius: 50%;
					background: conic-gradient(#4CAF50 0%, #4CAF50 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
				}

				.progress-inner {
					position: absolute;
					width: 80%;
					height: 80%;
					border-radius: 50%;
					background: white;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: px2vw(20px);
					/* 增大字体适应大圆 */
					top: 10%;
					left: 10%;
				}

				.progress-text {
					font-size: px2vw(20px);
					/* 增大文本 */
					font-weight: bold;
					color: #333;
					text-align: center;
				}

				.process-name {
					margin-top: px2vw(10px);
					/* 略增名称间距适应大圆 */
					font-size: px2vw(24px);
					color: #555;
					text-align: center;
					max-width: px2vw(150px);
					word-break: break-word;
				}

				.connector {
					width: px2vw(30px);
					height: px2vw(3px);
					background-color: #ccc;
					margin: 0 px2vw(8px) 0 px2vw(10px);
					position: relative;
					top: px2vw(-10px);
					/* 往上移20px，靠近圆圈底部 */
				}
			}
		}
	}
}
</style>
