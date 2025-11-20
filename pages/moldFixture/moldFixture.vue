<template>
	<view class="process-container" @click="closeDropdowns">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				模夹具点检( {{userStore.loginName}} )
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
						{{item.btnname}}
					</view>
				</view>
			</view>
		</view>
		<!-- 搜索区域 -->
		<view class="search-box">
			<view class="conserve">
				<text class="label">养护类型</text>
				<view class="picker-box" @click.stop="toggleConserveOptions">
					<text class="picker-selected">{{ selectedConserveLabel }}</text>
					<view class="picker-arrow"></view>
					<view v-if="isConserveOpen" class="picker-options">
						<view v-for="option in conserveOptions" :key="option.value" class="picker-option"
							@click.stop="selectConserve(option)">
							{{ option.text }}
						</view>
					</view>
				</view>
			</view>
			<view class="type">
				<text class="type-text">类别</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="device">
				<text class="device-text">模夹具</text>
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
					<uni-th align="center" class="table-header-cell">模夹具编码</uni-th>
					<uni-th align="center" class="table-header-cell">名称</uni-th>
					<uni-th align="center" class="table-header-cell">状态</uni-th>
					<uni-th align="center" class="table-header-cell">类别</uni-th>
				</uni-tr>
				<view class="table-header-gap"></view>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.code }}</uni-td>
					<uni-td align="center">{{ item.name }}</uni-td>
					<uni-td align="center">{{ item.statu }}</uni-td>
					<uni-td align="center">{{ item.type }}</uni-td>

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

	const btnlist = ref([{
			btnname: '点检',
			btnicon: '/static/checkout.svg'
		},
		{
			btnname: '养护历史',
			btnicon: '/static/time.svg'
		},
		{
			btnname: '刷新',
			btnicon: '/static/reflash.svg'
		}
	])

	// 检验选择
	const conserveOptions = ref([{
		text: '全部',
		value: 'all'
	}, {
		text: '养护类型一',
		value: 'type1'
	}, {
		text: '养护类型二',
		value: 'type2'
	}, {
		text: '养护类型三',
		value: 'type3'
	}, {
		text: '养护类型四',
		value: 'type4'
	}])
	const selectedConserve = ref(conserveOptions.value[0])
	const isConserveOpen = ref(false)

	const selectedConserveLabel = computed(() => selectedConserve.value?.text || '请选择养护类型')

	const toggleConserveOptions = () => {
		isConserveOpen.value = !isConserveOpen.value
	}

	const selectConserve = (option) => {
		selectedConserve.value = option
		isConserveOpen.value = false
		console.log('选中:', option.text)
	}

	const closeDropdowns = () => {
		isConserveOpen.value = false
	}

	// 表格数据
	const tableData = ref([{
		code: 20040228,
		name: '设备',
		statu: '正常',
		type: '全部'
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
	height: 150rpx;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #5884f1;

	image {
		margin-left: 50rpx;
		height: 70rpx;
		width: 75rpx;
	}
}

.title {
	margin-left: 375rpx;
	font-size: 50rpx;
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

/* 按钮栏 */
.btn-list {
	height: 200rpx;
	width: 100%;
	display: flex;
	align-items: center;

	.btn-item {
		height: 140rpx;
		margin: 25rpx;
		padding: 25rpx 50rpx;
		border-radius: 25rpx;
		color: #5884f1;
		display: flex;
		align-items: center;
		border: 5rpx solid #5884f1;

		image {
			height: 75rpx;
			width: 75rpx;
			margin-right: 37.5rpx;
		}
	}
}

/* 搜索区域 */
.search-box {
	display: flex;
	flex-wrap: wrap;
	width: 100%;

	.conserve {
		margin: 25rpx;
		display: flex;
		align-items: center;

		.label {
			margin-right: 25rpx;
			font-size: 50rpx;
		}

		.picker-box {
			width: 800rpx;
			height: 125rpx;
			border: 5rpx solid #5884f1;
			border-radius: 25rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 50rpx;
			font-size: 50rpx;
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
			border-left: 20rpx solid transparent;
			border-right: 20rpx solid transparent;
			border-top: 25rpx solid #5884f1;
			margin-left: 30rpx;
		}

		.picker-options {
			position: absolute;
			top: calc(100% + 20rpx);
			left: 0;
			width: 100%;
			background-color: #fff;
			border: 5rpx solid #5884f1;
			border-radius: 25rpx;
			box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.12);
			max-height: 800rpx;
			overflow-y: auto;
			z-index: 10;
		}

		.picker-option {
			padding: 35rpx 50rpx;
			font-size: 50rpx;
			text-align: center;
			color: #333;
		}

		.picker-option:not(:last-child) {
			border-bottom: 2.5rpx solid #f0f0f0;
		}

		.picker-option:active {
			background-color: #eef4ff;
		}
	}

	.type {
		display: flex;
		margin: 25rpx;
		align-items: center;
	
		.type-text {
			font-size: 50rpx;
		}
	
		.input-box {
			width: 700rpx;
			height: 125rpx;
			border: 5rpx solid #5884f1;
			border-radius: 25rpx;
			display: flex;
			align-items: center;
			padding: 0 50rpx;
			margin-left: 25rpx;
	
			input {
				font-size: 50rpx;
			}
		}
	}

	.device {
		display: flex;
		margin: 25rpx;
		align-items: center;

		.device-text {
			font-size: 50rpx;
		}

		.input-box {
			width: 700rpx;
			height: 125rpx;
			border: 5rpx solid #5884f1;
			border-radius: 25rpx;
			display: flex;
			align-items: center;
			padding: 0 50rpx;
			margin-left: 25rpx;

			input {
				font-size: 50rpx;
			}
		}
	}

	.scan {
		display: flex;
		align-items: center;

		image {
			width: 150rpx;
			height: 150rpx;
		}
	}
}

/* 表格区域 */
.table {
	margin-top: 20rpx;

	::v-deep .uni-table {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	::v-deep .table-header-row,
	::v-deep .table-body-row {
		display: grid;
		grid-template-columns: repeat(4, minmax(750rpx, 1fr));
		width: 100%;
		background: white;
	}

	::v-deep .table-header-row .table-header-cell,
	::v-deep .table-body-row .uni-table-td {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 60rpx;
	}

	::v-deep .table-header-row .table-header-cell {
		padding: 50rpx 100rpx;
		letter-spacing: 10rpx;
		font-weight: 600;
	}

	::v-deep .table-body-row {
		min-height: 205rpx;
		align-items: center;
	}

	::v-deep .table-body-row .uni-table-td {
		padding: 80rpx 100rpx;
	}

		::v-deep .table-header-gap {
			height: 30rpx;
			background-color: #f2f2f2;
			grid-column: 1 / -1;
		}
	}
}
</style>