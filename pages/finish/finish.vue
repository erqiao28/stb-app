<template>
	<view class="process-container">
		<Radiobox v-model="workshop" :options="workshopOptions" title="车间" v-model:visible="showWorkshopModal"
			@confirm="handleWorkshopConfirm" />
		<Radiobox v-model="checkout" :options="checkoutOptions" title="需检验" v-model:visible="showCheckoutModal"
			@confirm="handleCheckoutConfirm" />
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
				<view class="picker-box" @click="showWorkshopModal = true">
					<text class="picker-selected">{{ workshop }}</text>
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
				<view class="picker-box" @click="showCheckoutModal = true">
					<text class="picker-selected">{{ checkout }}</text>
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
	ref
} from 'vue'
import Radiobox from '../../component/radiobox/radiobox.vue'
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

// 车间单选框
const workshop = ref('全部')
const workshopOptions = ref(['全部', '拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const handleWorkshopConfirm = (value) => {
	workshop.value = value
	showWorkshopModal.value = false
}

// 需检验单选框
const checkout = ref('全部')
const checkoutOptions = ref(['全部', '需要', '不需要'])
const showCheckoutModal = ref(false)
const handleCheckoutConfirm = (value) => {
	checkout.value = value
	showCheckoutModal.value = false
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
		height: px2vw(180px);
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

		.worker {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.worker-text {
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

		.code {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.code-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(560px);
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

		.name {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.name-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(790px);
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

		.checkout {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(790px);
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
			grid-template-columns: repeat(7, 1fr);
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