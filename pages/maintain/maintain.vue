<template>
	<view class="process-container">
		<Radiobox 
			v-model="workshop" 
			:options="workshopOptions" 
			title="车间" 
			v-model:visible="showWorkshopModal"
			@confirm="handleWorkshopConfirm" 
		/>
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
				<view class="picker-box" @click="showWorkshopModal = true">
					<text class="picker-selected">{{ workshop }}</text>
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
	ref
} from 'vue'
import Radiobox from '../../component/radiobox/radiobox.vue'
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

// 车间单选框
const workshop = ref('全部')
const workshopOptions = ref(['全部', '拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const handleWorkshopConfirm = (value) => {
	workshop.value = value
	showWorkshopModal.value = false
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

<style scoped lang="scss">
.process-container {
	height: 100vh;
	width: 100vw;

	/* 导航栏 */
	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;

		image {
			margin: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		::v-deep .workshop picker {
			width: 100%;
		}

		::v-deep .uni-picker-container {
			display: flex !important;
			justify-content: center;
		}

		::v-deep .uni-picker-container .uni-picker {
			width: min(#{px2vw(650px)}, 90vw) !important;
			left: 50% !important;
			transform: translateX(-50%) !important;
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
				height: px2vw(90px);
				width: px2vw(170px);
				display: flex;
				align-items: center;
				background-color: white;
				margin: px2vw(20px);
				border-radius: px2vw(20px);

				image {
					height: px2vw(50px);
					width: px2vw(50px);
					margin-right: px2vw(20px);
				}
			}
		}
	}

	/* 按钮栏 */
	.btn-list {
		height: px2vw(150px);
		width: 100%;
		display: flex;
		align-items: center;

		.btn-item {
			height: px2vw(80px);
			margin: px2vw(10px);
			padding: px2vw(16px) px2vw(25px);
			border-radius: px2vw(18px);
			color: #5884f1;
			display: flex;
			align-items: center;
			border: px2vw(3px) solid #5884f1;

			image {
				height: px2vw(45px);
				width: px2vw(45px);
				margin-right: px2vw(28px);
			}
		}
	}

	/* 搜索区域 */
	.search-box {
		display: flex;
		flex-wrap: wrap;
		width: 100%;

		.workshop {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(500px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(35px);
				font-size: px2vw(30px);
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
		}

		.device {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.device-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(400px);
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

		.scan {
			display: flex;
			align-items: center;

			image {
				width: px2vw(80px);
				height: px2vw(80px);
			}
		}
	}

	/* 表格区域 */
	.table {
		margin-top: px2vw(10px);

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
			font-size: px2vw(35px);
		}

		::v-deep .table-header-row .table-header-cell {
			padding: px2vw(30px) px2vw(15px);
			letter-spacing: px2vw(5px);
			font-weight: 600;
		}

		::v-deep .table-body-row {
			min-height: px2vw(100px);
			align-items: center;
		}

		::v-deep .table-body-row .uni-table-td {
			padding: px2vw(40px) px2vw(15px);
		}

		::v-deep .table-header-gap {
			height: px2vw(10px);
			background-color: #f2f2f2;
			grid-column: 1 / -1;
		}
	}
}
</style>