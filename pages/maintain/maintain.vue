<template>
	<view class="process-container" @click="closeWorkshopOptions">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				设备维修( {{ userStore.loginName }} )
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

			<view class="device">
				<text class="device-text">设备</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="scan">
				<image src="/static/scan.svg"></image>
			</view>


		</view>
		<!-- 表格区域 -->
		<view class="table">
			<uni-table stripe style="width: 100%;">
				<uni-tr class="table-header-row">
					<uni-th align="center" class="table-header-cell">单据编码</uni-th>
					<uni-th align="center" class="table-header-cell">设备名称</uni-th>
					<uni-th align="center" class="table-header-cell">规格型号</uni-th>
					<uni-th align="center" class="table-header-cell">申请人</uni-th>
					<uni-th align="center" class="table-header-cell">申请时间</uni-th>
					<uni-th align="center" class="table-header-cell">故障描述</uni-th>
				</uni-tr>
				<view class="table-header-gap"></view>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.code }}</uni-td>
					<uni-td align="center">{{ item.name }}</uni-td>
					<uni-td align="center">{{ item.model }}</uni-td>
					<uni-td align="center">{{ item.person }}</uni-td>
					<uni-td align="center">{{ item.time }}</uni-td>
					<uni-td align="center">{{ item.intro }}</uni-td>

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
		btnname: '新增',
		btnicon: '/static/add.svg'
	},
	{
		btnname: '修改',
		btnicon: '/static/edit.svg'
	},
	{
		btnname: '开工',
		btnicon: '/static/working.svg'
	}
	, {
		btnname: '完工',
		btnicon: '/static/checkout.svg'
	},
	{
		btnname: '刷新',
		btnicon: '/static/reflash.svg'
	}
])

// 车间选择
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
const selectedWorkshop = ref(workshopOptions.value[0])
const isWorkshopOpen = ref(false)

const selectedWorkshopLabel = computed(() => selectedWorkshop.value?.text || '请选择车间')

const toggleWorkshopOptions = () => {
	isWorkshopOpen.value = !isWorkshopOpen.value
}

const selectWorkshop = (option) => {
	selectedWorkshop.value = option
	isWorkshopOpen.value = false
	console.log('选中:', option.text)
}

const closeWorkshopOptions = () => {
	isWorkshopOpen.value = false
}

// 表格数据
const tableData = ref([{
	code: 20040228,
	name: '设备',
	model: 'yi',
	person: '江桥',
	time: '2025-02-28',
	intro: '这是一个介绍'
}])

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
			margin-left: 25rpx;
			height: 60rpx;
			width: 60rpx;
		}

		::v-deep .workshop picker {
			width: 100%;
		}

		::v-deep .uni-picker-container {
			display: flex !important;
			justify-content: center;
		}

		::v-deep .uni-picker-container .uni-picker {
			width: min(650rpx, 90vw) !important;
			left: 50% !important;
			transform: translateX(-50%) !important;
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
				border-radius: 20rpx;

				image {
					height: 60rpx;
					width: 60rpx;
					margin-right: 20rpx;
				}
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
			padding: 40rpx 80rpx;
			border-radius: 20rpx;
			color: #5884f1;
			display: flex;
			align-items: center;
			border: 5rpx solid #5884f1;

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
				width: 800rpx;
				height: 100rpx;
				border: 5rpx solid #5884f1;
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
				border: 5rpx solid #5884f1;
				border-radius: 20rpx;
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

		.device {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.device-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 700rpx;
				height: 100rpx;
				border: 5rpx solid #5884f1;
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
			grid-template-columns: repeat(6, 1fr);
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
			letter-spacing: 5rpx;
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