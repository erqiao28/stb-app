<template>
	<view class="process-container" @click="closeDropdowns">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				待完成任务单( {{ userStore.loginName }} )
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
			<view class="workshop">
				<text class="label">车间</text>
				<view class="picker-box" @click.stop="toggleWorkshopOptions">
					<text class="picker-selected">{{ selectedWorkshopLabel }}</text>
					<view class="picker-arrow"></view>
					<view v-if="isWorkshopOpen" class="picker-options">
						<view v-for="option in workshopOptions" :key="option.value" class="picker-option"
							@click.stop="selectWorkshop(option)">
							{{ option.text }}
						</view>
					</view>
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

			<view class="name">
				<text class="name-text">物品名称</text>
				<view class="input-box">
					<input type="text" placeholder="请输入名称" />
				</view>
			</view>

			<view class="checkout">
				<text class="label">需检验</text>
				<view class="picker-box" @click.stop="toggleCheckoutOptions">
					<text class="picker-selected">{{ selectedCheckoutLabel }}</text>
					<view class="picker-arrow"></view>
					<view v-if="isCheckoutOpen" class="picker-options">
						<view v-for="option in checkoutOptions" :key="option.value" class="picker-option"
							@click.stop="selectCheckout(option)">
							{{ option.text }}
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 表格区域 -->
		<view class="table">
			<uni-table stripe style="width: 100%;">
				<uni-tr class="table-header-row">
					<uni-th align="center" class="table-header-cell">订单物品</uni-th>
					<uni-th align="center" class="table-header-cell">物品名称</uni-th>
					<uni-th align="center" class="table-header-cell">规格型号</uni-th>
					<uni-th align="center" class="table-header-cell">工序序号</uni-th>
					<uni-th align="center" class="table-header-cell">工序名称</uni-th>
					<uni-th align="center" class="table-header-cell">加工人</uni-th>
					<uni-th align="center" class="table-header-cell">派工数量</uni-th>
				</uni-tr>
				<view class="table-header-gap"></view>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.good }}</uni-td>
					<uni-td align="center">{{ item.name }}</uni-td>
					<uni-td align="center">{{ item.model }}</uni-td>
					<uni-td align="center">{{ item.number }}</uni-td>
					<uni-td align="center">{{ item.processName }}</uni-td>
					<uni-td align="center">{{ item.workingName }}</uni-td>
					<uni-td align="center">{{ item.count }}</uni-td>

				</uni-tr>
			</uni-table>
		</view>
	</view>
</template>

<script setup>
import {
	ref,
	computed
} from 'vue'
import { useUserStore } from '../../store/user.store'
const userStore = useUserStore()

const btnlist = ref([
	{
		btnname: '完工检',
		btnicon: '/static/checkout.svg'
	},
	{
		btnname: '加工工艺',
		btnicon: '/static/craft.svg'
	},
	{
		btnname: '完工检查询',
		btnicon: '/static/inquire.svg'
	},
	{
		btnname: '记工查询',
		btnicon: '/static/inquire.svg'
	},
	{
		btnname: '记工申请查询',
		btnicon: '/static/inquire.svg'
	},
	{
		btnname: '刷新',
		btnicon: '/static/reflash.svg'
	}
])

const workshopOptions = ref([{
	text: '全部',
	value: 'all'
}, {
	text: '拉伸车间',
	value: 'stretch'
}, {
	text: '喷涂车间',
	value: 'spray'
}, {
	text: '抛光车间',
	value: 'polish'
}, {
	text: '组装车间',
	value: 'assemble'
}])
const checkoutOptions = ref([{
	text: '全部',
	value: 'all'
}, {
	text: '拉伸车间',
	value: 'stretch'
}, {
	text: '喷涂车间',
	value: 'spray'
}, {
	text: '抛光车间',
	value: 'polish'
}, {
	text: '组装车间',
	value: 'assemble'
}])

const selectedWorkshop = ref(workshopOptions.value[0])
const selectedCheckout = ref(checkoutOptions.value[0])
const isWorkshopOpen = ref(false)
const isCheckoutOpen = ref(false)

const selectedWorkshopLabel = computed(() => selectedWorkshop.value?.text || '请选择车间')
const selectedCheckoutLabel = computed(() => selectedCheckout.value?.text || '请选择车间')

const toggleWorkshopOptions = () => {
	isWorkshopOpen.value = !isWorkshopOpen.value
	if (isWorkshopOpen.value) {
		isCheckoutOpen.value = false
	}
}

const toggleCheckoutOptions = () => {
	isCheckoutOpen.value = !isCheckoutOpen.value
	if (isCheckoutOpen.value) {
		isWorkshopOpen.value = false
	}
}

const selectWorkshop = (option) => {
	selectedWorkshop.value = option
	isWorkshopOpen.value = false
	console.log('选中:', option.text)
}

const selectCheckout = (option) => {
	selectedCheckout.value = option
	isCheckoutOpen.value = false
	console.log('选中:', option.text)
}

const closeDropdowns = () => {
	isWorkshopOpen.value = false
	isCheckoutOpen.value = false
}

// 表格数据
const tableData = ref([
	{ good: '一', name: '一', model: 'yi', number: 1, processName: '拉伸', workingName: '江桥', count: 10 }
])

// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped>
.process-container {
	height: 100vh;
	width: 100vw;

	/* 导航栏 */
	.header {
		height: 140rpx;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;

		image {
			margin-left: 40rpx;
			height: 60rpx;
			width: 60rpx;
		}
	}

	.title {
		margin-left: 300rpx;
		font-size: 40rpx;
		color: white;
	}

	.btn-box {
		display: flex;
		align-items: center;

		.btn-one {
			height: 110rpx;
			width: 220rpx;
			display: flex;
			align-items: center;
			background-color: white;
			margin: 20rpx;
			border-radius: 10rpx;

			image {
				height: 60rpx;
				width: 60rpx;
				margin-right: 20rpx;
			}
		}
	}

	/* 按钮栏 */
	.btn-list {
		height: 160rpx;
		width: 100%;
		display: flex;
		align-items: center;

		.btn-item {
			height: 120rpx;
			margin: 20rpx;
			padding: 20rpx 40rpx;
			border-radius: 10rpx;
			color: #5884f1;
			display: flex;
			align-items: center;
			border: 2rpx solid #5884f1;

			image {
				height: 60rpx;
				width: 60rpx;
				margin-right: 30rpx;
			}
		}
	}

	/* 搜索区域 */
	.search-box {
		display: flex;
		flex-wrap: wrap;
		width: 100%;

		.workshop {
			margin: 20rpx;
			display: flex;
			align-items: center;

			.label {
				margin-right: 20rpx;
				font-size: 40rpx;
			}

			.picker-box {
				width: 760rpx;
				height: 100rpx;
				border: 2rpx solid #5884f1;
				border-radius: 10rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 40rpx;
				font-size: 40rpx;
				box-sizing: border-box;
				background-color: #fff;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}

			.picker-arrow {
				width: 0;
				height: 0;
				border-left: 16rpx solid transparent;
				border-right: 16rpx solid transparent;
				border-top: 20rpx solid #5884f1;
				margin-left: 24rpx;
			}

			.picker-options {
				position: absolute;
				top: calc(100% + 16rpx);
				left: 0;
				width: 100%;
				background-color: #fff;
				border: 2rpx solid #5884f1;
				border-radius: 10rpx;
				box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.12);
				max-height: 320rpx;
				overflow-y: auto;
				z-index: 10;
			}

			.picker-option {
				padding: 28rpx 40rpx;
				font-size: 40rpx;
				text-align: center;
				color: #333;
			}

			.picker-option:not(:last-child) {
				border-bottom: 2rpx solid #f0f0f0;
			}

			.picker-option:active {
				background-color: #eef4ff;
			}
		}

		.worker {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.worker-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 800rpx;
				height: 100rpx;
				border: 2rpx solid #5884f1;
				border-radius: 10rpx;
				display: flex;
				align-items: center;
				padding: 0 40rpx;
				margin-left: 10rpx;

				input {
					font-size: 40rpx;
				}
			}
		}

		.code {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.code-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 800rpx;
				height: 100rpx;
				border: 2rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				padding: 0 40rpx;
				margin-left: 10rpx;

				input {
					font-size: 40rpx;
				}
			}
		}

		.scan {
			display: flex;
			align-items: center;

			image {
				width: 120rpx;
				height: 120rpx;
			}
		}

		.name {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.name-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 1300rpx;
				height: 100rpx;
				border: 2rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				padding: 0 40rpx;
				margin-left: 10rpx;

				input {
					font-size: 40rpx;
				}
			}
		}

		.checkout {
			margin: 20rpx;
			display: flex;
			align-items: center;

			.label {
				margin-right: 20rpx;
				font-size: 40rpx;
			}

			.picker-box {
				width: 1340rpx;
				height: 100rpx;
				border: 2rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 40rpx;
				font-size: 40rpx;
				box-sizing: border-box;
				background-color: #fff;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}

			.picker-arrow {
				width: 0;
				height: 0;
				border-left: 16rpx solid transparent;
				border-right: 16rpx solid transparent;
				border-top: 20rpx solid #5884f1;
				margin-left: 24rpx;
			}

			.picker-options {
				position: absolute;
				top: calc(100% + 16rpx);
				left: 0;
				width: 100%;
				background-color: #fff;
				border: 2rpx solid #5884f1;
				border-radius: 10rpx;
				box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.12);
				max-height: 320rpx;
				overflow-y: auto;
				z-index: 10;
			}

			.picker-option {
				padding: 28rpx 40rpx;
				font-size: 40rpx;
				text-align: center;
				color: #333;
			}

			.picker-option:not(:last-child) {
				border-bottom: 2rpx solid #f0f0f0;
			}

			.picker-option:active {
				background-color: #eef4ff;
			}
		}


	}

	/* 表格区域 */
	.table {
		margin-top: 16rpx;

		::v-deep .uni-table {
			display: flex;
			flex-direction: column;
			width: 100%;
		}

		::v-deep .table-header-row,
		::v-deep .table-body-row {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			width: 100%;
			background: white;
		}

		::v-deep .table-header-row .table-header-cell,
		::v-deep .table-body-row .uni-table-td {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 44rpx;
		}

		::v-deep .table-header-row .table-header-cell {
			padding: 36rpx 24rpx;
			letter-spacing: 4rpx;
			font-weight: 600;
		}

		::v-deep .table-body-row {
			min-height: 164rpx;
			align-items: center;
		}

		::v-deep .table-body-row .uni-table-td {
			padding: 52rpx 24rpx;
		}

		::v-deep .table-header-gap {
			height: 24rpx;
			background-color: #f2f2f2;
			grid-column: 1 / -1;
		}
	}
}
</style>