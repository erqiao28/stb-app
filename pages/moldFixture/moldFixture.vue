<template>
	<view class="process-container">
		<Radiobox 
			v-model="conserve" 
			:options="conserveOptions" 
			title="养护类型" 
			v-model:visible="showConserveModal"
			@confirm="handleConserveConfirm" 
		/>
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
				<view class="picker-box" @click="showConserveModal = true">
					<text class="picker-selected">{{ conserve }}</text>
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
		ref
	} from 'vue'
	import Radiobox from '../../component/radiobox/radiobox.vue'
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

	// 养护类型单选框
	const conserve = ref('全部')
	const conserveOptions = ref(['全部', '养护类型一', '养护类型二', '养护类型三', '养护类型四'])
	const showConserveModal = ref(false)
	const handleConserveConfirm = (value) => {
		conserve.value = value
		showConserveModal.value = false
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

<style scoped lang="scss">
.process-container {
	height: 100vh;
	width: 100vw;

/* 导航栏 */
.header {
	height: px2vw(100px);
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
		border-radius: px2vw(20px);
		font-size: px2vw(25px);

		image {
			height: px2vw(50px);
			width: px2vw(50px);
			margin-right: px2vw(20px);
		}
	}
}

/* 按钮栏 */
.btn-list {
	height: px2vw(100px);
	width: 100%;
	display: flex;
	align-items: center;

	.btn-item {
		margin: px2vw(10px);
		padding: px2vw(16px) px2vw(25px);
		border-radius: px2vw(18px);
		color: #5884f1;
		display: flex;
		align-items: center;
		border: px2vw(3px) solid #5884f1;
		font-size: px2vw(25px);

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

	.conserve {
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

	.type {
		display: flex;
		margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
		align-items: center;
	
		.type-text {
			font-size: px2vw(30px);
		}
	
		.input-box {
			width: px2vw(430px);
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

	.device {
		display: flex;
		margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
		align-items: center;

		.device-text {
			font-size: px2vw(30px);
		}

		.input-box {
			width: px2vw(520px);
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
		grid-template-columns: repeat(4, minmax(px2vw(200px), 1fr));
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