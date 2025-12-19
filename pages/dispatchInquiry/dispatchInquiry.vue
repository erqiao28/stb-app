<template>
	<view class="dispatchInquiry-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<Radiobox v-model="report" :options="reportOptions" title="报工" v-model:visible="showReportModal"
			@confirm="handleReportConfirm" />
		<Radiobox v-model="isStop" :options="isStopOptions" title="终止否" v-model:visible="showIsStopModal"
			@confirm="handleIsStopConfirm" />
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				派工查询
			</view>

			<view class="btn-box">
				<view class="btn-one" @click="userStore.logout()">
					<image src="/static/Quit.svg"></image>
					<text>切换</text>
				</view>
				<view class="btn-one">
					<image src="/static/Quit.svg"></image>
					<text>退出</text>
				</view>
			</view>
		</view>

		<!-- 搜索区域 -->
		<view class="search-box">
			<view class="startdate">
				<text class="startdate-text">开始日期</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="enddate">
				<text class="enddate-text">结束日期</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="worker">
				<text class="worker-text">加工人</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="report">
				<text class="label">报工</text>
				<view class="picker-box" @click="showReportModal = true">
					<text class="picker-selected">{{ report }}</text>
				</view>
			</view>
			<view class="isStop">
				<text class="label">终止否</text>
				<view class="picker-box" @click="showIsStopModal = true">
					<text class="picker-selected">{{ isStop }}</text>
				</view>
			</view>
		</view>

		<!-- 派工单据列表 -->
		<view class="dispatchInquiry-list">
			<view class="dispatchInquiry-item" v-for="item in dispatchInquiryList" :key="item.id">
				<view class="dispatchInquiry-item-info">
					<view class="dispatchInquiry-item-info-top">
						<text class="productionOrder">生产订单：{{ item.productionOrder }}</text>
						<text class="orderCode">订单编码：{{ item.orderCode }}</text>
						<text class="date">日期：{{ item.date }}</text>
					</view>
					<view class="dispatchInquiry-item-info-bottom">
						<text class="goodsName">产品名称：{{ item.goodsName }}</text>
						<text class="goodsCode">产品编码：{{ item.goodsCode }}</text>
						<text class="processName">工序名称：{{ item.processName }}</text>
						<text class="worker">加工人：{{ item.worker }}</text>
						<text class="dispatchCount">派工数量：{{ item.dispatchCount }}</text>
						<text class="finishCount">完成数量：{{ item.finishCount }}</text>
						<text class="worktime">工时：{{ item.worktime }}</text>
					</view>
				</view>
				<!-- <view class="dispatchInquiry-item-btn">
					<button class="btn-item">终止</button>
					<button class="btn-item">转派</button>
					<button class="btn-item">修改</button>
					<button class="btn-item">删除</button>
				</view> -->
			</view>
		</view>
	</view>
</template>

<script setup>
import { useUserStore } from '../../store/user.store'
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import Radiobox from '../../component/radiobox/radiobox.vue'
import { useStatusBar } from '../../composables/useStatusBar'
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()
onLoad(() => {
	getDispatchInquiryList()
})

// 需检验单选框
const report = ref('全部')
const reportOptions = ref(['全部', '已完成', '未完成'])
const showReportModal = ref(false)
const handleReportConfirm = (value) => {
	report.value = value
	showReportModal.value = false
}

// 终止否单选框
const isStop = ref('全部')
const isStopOptions = ref(['全部', '已终止', '未终止'])
const showIsStopModal = ref(false)
const handleIsStopConfirm = (value) => {
	isStop.value = value
	showIsStopModal.value = false
}

// 派工单据列表
const dispatchInquiryList = ref([
	{
		goodsName: '',
		goodsCode: '',
		processName: '',
		date: '',
		orderCode: '',
		productionOrder: '',
		worker: '',
		dispatchCount: '',
		finishCount: '',
		worktime: '',
	}
])

// 获取派工单据列表
const getDispatchInquiryList = async () => {
	
  const res = await callWorkflowListAPIPaged({
    worksheetId: 'baogongdan',
    filters: [
    ]
  })
  dispatchInquiryList.value = res.data.map(item => ({
    goodsName: item['6944facfdc7b13304885b3ad'],
    goodsCode: item['6921596021066a9f124f6e63'],
    processName: item['6945061adc7b13304885b92a'],
    date: item['690d9ae28d797ee211e7e6a4'],
    orderCode: item['6593b04a666735003d33ba61'],
    productionOrder: item['6921596021066a9f124f6e61'],
    worker: item['6938dcf1da0981f67b352b55'],
    dispatchCount: item['655d9cd8cc4f25a27fb3e858'],
    finishCount: item['693fe07b284b84255a6ebda5'],
    worktime: item['693a7d580f64427fac25d070'],
  }))
}

// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped lang="scss">
.dispatchInquiry-container {
	height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;

	/* 导航栏 */
	.header {
		height: px2vw(100px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;

		image {
			margin-left: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			margin-left: px2vw(300px);
			font-size: px2vw(35px);
			color: white;
		}

		.btn-box {
			display: flex;
			align-items: center;

			.btn-one {
				height: px2vw(80px);
				width: px2vw(170px);
				display: flex;
				align-items: center;
				background-color: white;
				margin: px2vw(20px);
				border-radius: px2vw(18px);
				font-size: px2vw(25px);

				image {
					height: px2vw(50px);
					width: px2vw(50px);
					margin-right: px2vw(20px);
				}
			}
		}
	}

	/* 搜索区域 */
	.search-box {
		background-color: white;
		display: flex;
		height: px2vw(100px);
		flex-wrap: wrap;
		width: 100%;

		.startdate {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.startdate-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.enddate {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.enddate-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.worker {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.worker-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.report {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(35px);
				font-size: px2vw(30px);		
				box-sizing: border-box;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}
		}

		.isStop {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(35px);
				font-size: px2vw(30px);
				box-sizing: border-box;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}
		}

	}

	/* 派工单据列表 */
	.dispatchInquiry-list {
		.dispatchInquiry-item {
			width: 99%;
			margin: px2vw(10px);
			background-color: #fff;
			border-radius: px2vw(18px);
			padding: px2vw(15px);
			display: flex;
			flex-direction: column;

			.dispatchInquiry-item-info {
				width: 100%;
				display: flex;
				flex-direction: column;

				.dispatchInquiry-item-info-top {
					width: 100%;
					display: flex;
					justify-content: flex-start;
					gap: px2vw(50px);
					font-size: px2vw(25px);
					font-weight: bold;
					align-items: center;

					.orderCode {
						font-size: px2vw(25px);
					}
					.productionOrder {
						font-size: px2vw(25px);
					}
					.date {
						font-size: px2vw(25px);
					}
				}
				.dispatchInquiry-item-info-bottom {
					width: 100%;
					display: flex;
					flex-wrap: wrap;
					margin-top: px2vw(10px);

					.goodsName,
					.goodsCode,
					.processName,
					.worker,
					.dispatchCount,
					.finishCount,
					.worktime {
						font-size: px2vw(25px);
						display: flex;
						justify-content: flex-start;
						align-items: center;
						width: px2vw(600px);
					}
				}
			}

			.dispatchInquiry-item-btn {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: px2vw(25px);

				.btn-item {
					width: px2vw(400px);
					height: px2vw(60px);
					font-size: px2vw(25px);
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #fff;
					border: px2vw(3px) solid #ccc;
				}
			}
		}
	}
}
</style>
