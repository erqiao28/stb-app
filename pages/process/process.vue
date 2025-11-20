<template>
	<view class="process-container">
		<Radiobox 
			v-model="checkout" 
			:options="checkoutOptions" 
			title="需检验" 
			v-model:visible="showCheckoutModal"
			@confirm="handleCheckoutConfirm" 
		/>
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title"> 待完成任务单( {{ userStore.loginName }} ) </view>

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
		<!-- 按钮栏 -->
		<view class="btn-list">
			<view v-for="item in btnlist">
				<view class="btn-item">
					<image :src="item.btnicon" mode=""></image>
					<view class="btn-text">
						{{ item.btnname }}
					</view>
				</view>
			</view>
		</view>
		<!-- 搜索区域 -->
		<view class="search-box">
			<view class="name">
				<text class="name-text">物品名称</text>
				<view class="input-box">
					<input type="text" placeholder="请输入名称" />
				</view>
			</view>

			<view class="checkout">
				<text class="checkout-text">需检验</text>
				<view class="checkout-box" @click="showCheckoutModal = true">
					{{ checkout }}
				</view>
			</view>


			<view class="worker">
				<text class="worker-text">加工人</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="code">
				<text class="code-text">派工条码</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="scan">
				<image src="/static/scan.svg"></image>
			</view>

		</view>
			<!-- 表格区域 -->
			<scroll-view scroll-x="true" show-scrollbar="false" class="table">
				<uni-table stripe style="width: max-content; min-width: 1800px;">
					<uni-tr class="table-header-row">
						<uni-th align="center" class="table-header-cell">检验状态</uni-th>
						<uni-th align="center" class="table-header-cell">订单物品</uni-th>
						<uni-th align="center" class="table-header-cell">派工条码</uni-th>
						<uni-th align="center" class="table-header-cell">物品名称</uni-th>
						<uni-th align="center" class="table-header-cell">工序名称</uni-th>
						<uni-th align="center" class="table-header-cell">规格型号</uni-th>
						<uni-th align="center" class="table-header-cell">工序序号</uni-th>
						<uni-th align="center" class="table-header-cell">工序名称</uni-th>
						<uni-th align="center" class="table-header-cell">派工数量</uni-th>
						<uni-th align="center" class="table-header-cell">已申请数量</uni-th>
						<uni-th align="center" class="table-header-cell">已完成数量</uni-th>
						<uni-th align="center" class="table-header-cell">加工人</uni-th>
						<uni-th align="center" class="table-header-cell">开工否</uni-th>
						<uni-th align="center" class="table-header-cell">计划完工时间</uni-th>
						<uni-th align="center" class="table-header-cell">实际开始时间</uni-th>
						<uni-th align="center" class="table-header-cell">实际完工时间</uni-th>
						<uni-th align="center" class="table-header-cell">生产执行单</uni-th>
						<uni-th align="center" class="table-header-cell">销售订单</uni-th>
						<uni-th align="center" class="table-header-cell">生产备注</uni-th>
					</uni-tr>
					<uni-tr class="table-gap-row">
						<uni-td colspan="19" class="table-gap-cell"></uni-td>
					</uni-tr>
					<uni-tr v-for="item in tableData" class="table-body-row">
						<uni-td align="center">{{ item.checkoutStatus }}</uni-td>
						<uni-td align="center">{{ item.orderGood }}</uni-td>
						<uni-td align="center">{{ item.dispatchCode }}</uni-td>
						<uni-td align="center">{{ item.goodsName }}</uni-td>
						<uni-td align="center">{{ item.processName }}</uni-td>
						<uni-td align="center">{{ item.model }}</uni-td>
						<uni-td align="center">{{ item.processNumber }}</uni-td>
						<uni-td align="center">{{ item.processName }}</uni-td>
						<uni-td align="center">{{ item.dispatchCount }}</uni-td>
						<uni-td align="center">{{ item.appliedCount }}</uni-td>
						<uni-td align="center">{{ item.completedCount }}</uni-td>
						<uni-td align="center">{{ item.worker }}</uni-td>
						<uni-td align="center">{{ item.startStatus }}</uni-td>
						<uni-td align="center">{{ item.planFinishTime }}</uni-td>
						<uni-td align="center">{{ item.actualStartTime }}</uni-td>
						<uni-td align="center">{{ item.actualEndTime }}</uni-td>
						<uni-td align="center">{{ item.productionOrder }}</uni-td>
						<uni-td align="center">{{ item.salesOrder }}</uni-td>
						<uni-td align="center">{{ item.productionRemark }}</uni-td>
					</uni-tr>
				</uni-table>
			</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed } from "vue";
import Radiobox from "../../component/radiobox/radiobox.vue";

import { useUserStore } from "../../store/user.store";
const userStore = useUserStore();

const btnlist = ref([
	{
		btnname: "开工",
		btnicon: "/static/working.svg",
	},
	{
		btnname: "暂停",
		btnicon: "/static/suspend.svg",
	},
	{
		btnname: "检验",
		btnicon: "/static/checkout.svg",
	},
	{
		btnname: "加工工艺",
		btnicon: "/static/craft.svg",
	},
	{
		btnname: "工序领料",
		btnicon: "/static/get.svg",
	},
	{
		btnname: "意见反馈",
		btnicon: "/static/idea.svg",
	},
	{
		btnname: "检验查询",
		btnicon: "/static/inquire.svg",
	},
	{
		btnname: "查看图片",
		btnicon: "/static/inquire.svg",
	},
	{
		btnname: '刷新',
		btnicon: '/static/reflash.svg'
	}
]);

// 需检验单选框
const checkout = ref('全部')
const checkoutOptions = ref(['全部', '需要', '不需要'])
const showCheckoutModal = ref(false)
const handleCheckoutConfirm = (value) => {
  checkout.value = value
  showCheckoutModal.value = false
}

// 退出
const quit = () => {
	uni.navigateBack();
};

// 表格数据
const tableData = ref([
	{ checkoutStatus: '一', orderGood: '一', dispatchCode: '一', goodsName: '一', processName: '拉伸', model: 'yi', processNumber: 1, dispatchCount: 10, appliedCount: 10, completedCount: 10, worker: '江桥', startStatus: '是', planFinishTime: '2025-01-01', actualStartTime: '2025-01-01', actualEndTime: '2025-01-01', productionOrder: '一', salesOrder: '一', productionRemark: '一' }
])
</script>

<style scoped>
.process-container {
	height: 100vh;
	width: 100vw;

/* 导航栏 */
.header {
	height: 150rpx;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #5884f1;

	image {
		margin-left: 42.5rpx;
		height: 65rpx;
		width: 65rpx;
	}

	.title {
		margin-left: 318.75rpx;
		font-size: 42.5rpx;
		color: white;
	}

	.btn-box {
		display: flex;
		align-items: center;

		.btn-one {
			height: 112.5rpx;
			width: 225rpx;
			display: flex;
			align-items: center;
			background-color: white;
			margin: 21.25rpx;
			border-radius: 21.25rpx;

			image {
				height: 65rpx;
				width: 65rpx;
				margin-right: 21.25rpx;
			}
		}
	}
}

/* 按钮栏 */
.btn-list {
	height: 162.5rpx;
	width: 100%;
	display: flex;
	align-items: center;

	.btn-item {
		height: 125rpx;
		margin: 21.25rpx;
		padding: 21.25rpx 42.5rpx;
		border-radius: 21.25rpx;
		color: #5884f1;
		display: flex;
		align-items: center;
		border: 2.5rpx solid #5884f1;

		image {
			height: 65rpx;
			width: 65rpx;
			margin-right: 32.5rpx;
		}
	}
}

/* 搜索区域 */
.search-box {
	display: flex;
	flex-wrap: wrap;
	width: 100%;

	.name {
		display: flex;
		margin: 21.25rpx;
		align-items: center;

		.name-text {
			font-size: 42.5rpx;
		}

		.input-box {
			width: 500rpx;
			height: 106.25rpx;
			border: 2.5rpx solid #5884f1;
			border-radius: 21.25rpx;
			display: flex;
			align-items: center;
			padding: 0 42.5rpx;
			margin-left: 21.25rpx;

			input {
				font-size: 42.5rpx;
			}
		}
	}

	.checkout {
		display: flex;
		margin: 21.25rpx;
		align-items: center;

		.checkout-text {
			font-size: 42.5rpx;
		}

		.checkout-box {
			width: 400rpx;
			height: 106.25rpx;
			border: 2.5rpx solid #5884f1;
			border-radius: 21.25rpx;
			display: flex;
			align-items: center;
			padding: 0 42.5rpx;
			margin-left: 21.25rpx;
			font-size: 42.5rpx;
		}
	}

	.worker {
		display: flex;
		margin: 21.25rpx;
		align-items: center;

		.worker-text {
			font-size: 42.5rpx;
		}

		.input-box {
			width: 400rpx;
			height: 106.25rpx;
			border: 2.5rpx solid #5884f1;
			border-radius: 21.25rpx;
			display: flex;
			align-items: center;
			padding: 0 42.5rpx;
			margin-left: 21.25rpx;

			input {
				font-size: 42.5rpx;
			}
		}
	}

	.code {
		display: flex;
		margin: 21.25rpx;
		align-items: center;

		.code-text {
			font-size: 42.5rpx;
		}

		.input-box {
			width: 750rpx;
			height: 106.25rpx;
			border: 2.5rpx solid #5884f1;
			border-radius: 21.25rpx;
			display: flex;
			align-items: center;
			padding: 0 42.5rpx;
			margin-left: 21.25rpx;

			input {
				font-size: 42.5rpx;
			}
		}
	}

	.scan {
		display: flex;
		align-items: center;

		image {
			width: 125rpx;
			height: 125rpx;
		}
	}
	
}
	/* 表格区域 */
	.table {
			margin-top: 16.25rpx;
			width: 100%;
			/* 移除 overflow-x 等属性，由 scroll-view 处理 */

			/* H5 平台隐藏滚动条 */
			::v-deep .table::-webkit-scrollbar {
				display: none;
			}

			::v-deep .table {
				-ms-overflow-style: none;
				/* IE and Edge */
				scrollbar-width: none;
				/* Firefox */
				-webkit-overflow-scrolling: touch;
			}

			::v-deep .uni-table {
				display: flex !important;
				flex-direction: column !important;
				width: max-content !important;
				min-width: 6375rpx !important;
				/* 总宽度: 13*150 + 3*200 + 3*150 = 3000px 调整为 rpx 并增大 */
			}

			::v-deep .table-header-row,
			::v-deep .table-body-row,
			::v-deep .table-gap-row {
				display: grid !important;
				grid-template-columns: repeat(13, 318.75rpx) 425rpx 425rpx 425rpx repeat(3, 318.75rpx) !important;
				width: 6375rpx !important;
				box-sizing: border-box !important;
			}

			/* 为时间列设置更大 min-width 以匹配 */
			::v-deep .table-header-row .table-header-cell:nth-child(n+14):nth-child(-n+16),
			::v-deep .table-body-row .uni-table-td:nth-child(n+14):nth-child(-n+16) {
				min-width: 425rpx !important;
			}

			::v-deep .table-header-row .table-header-cell,
			::v-deep .table-body-row .uni-table-td {
				min-width: 318.75rpx !important;
				width: auto !important;
				/* 让 grid 轨道控制宽度 */
				box-sizing: border-box !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				font-size: 45rpx !important;
				white-space: nowrap !important;
				/* 防止文本换行 */
			}

			::v-deep .table-header-row .table-header-cell {
				padding: 37.5rpx 25rpx !important;
				letter-spacing: 8.75rpx !important;
				font-weight: 600 !important;
				word-wrap: break-word !important;
				white-space: nowrap !important;
				/* 标题不换行 */
				font-size: 55rpx !important;
				/* 减小标题字体 */
			}

			::v-deep .table-body-row {
				min-height: 162.5rpx !important;
				/* 进一步减小内容行高度 */
				align-items: center !important;
			}

			::v-deep .table-body-row .uni-table-td {
				padding: 53.75rpx 11.25rpx !important;
				/* 进一步减小垂直 padding 以匹配高度 */
				white-space: nowrap !important;
				/* 内容不换行 */
				font-size: 45rpx !important;
				/* 内容字体保持原样 */
			}
		}
}
</style>
