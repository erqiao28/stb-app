<template>
	<view class="process-container">
		<Radiobox 
			v-model="conserve" 
			:options="conserveOptions" 
			title="养护类型" 
			v-model:visible="showConserveModal"
			@confirm="handleConserveConfirm" 
		/>
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
				设备( {{ userStore.loginName }} )
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
			<view v-for="item in btnlist" :key="item.btnId">
				<view class="btn-item" @click="handleButtonClick(item)">
					<image :src="item.btnicon"></image>
					<view class="btn-text">
						{{ item.btnname }}
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
			<view class="workshop">
				<text class="label">车间</text>
				<view class="picker-box" @click="showWorkshopModal = true">
					<text class="picker-selected">{{ workshop }}</text>
				</view>
			</view>

			<view class="device">
				<text class="device-text">设备</text>
				<view class="input-box">
					<input type="text" v-model="device" @input="searchDeviceList" />
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
					<uni-th align="center" class="table-header-cell">设备编码</uni-th>
					<uni-th align="center" class="table-header-cell">已检否</uni-th>
					<uni-th align="center" class="table-header-cell">最近检测时间</uni-th>
					<uni-th align="center" class="table-header-cell">设备名称</uni-th>
					<uni-th align="center" class="table-header-cell">规格型号</uni-th>
					<uni-th align="center" class="table-header-cell">所属车间</uni-th>
					<uni-th align="center" class="table-header-cell">设备类型</uni-th>
					<uni-th align="center" class="table-header-cell">养护类型</uni-th>
				</uni-tr>
				<view class="table-header-gap"></view>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.deviceCode }}</uni-td>
					<uni-td align="center">{{ item.isChecked }}</uni-td>
					<uni-td align="center">{{ item.lastCheckDate }}</uni-td>
					<uni-td align="center">{{ item.deviceName }}</uni-td>
					<uni-td align="center">{{ item.model }}</uni-td>
					<uni-td align="center">{{ item.workshop }}</uni-td>
					<uni-td align="center">{{ item.deviceType }}</uni-td>
					<uni-td align="center">{{ item.conserveType }}</uni-td>
				</uni-tr>
			</uni-table>
		</view>
	</view>
</template>

<script setup>
import {
	ref,
	onMounted
} from 'vue'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import Radiobox from '../../component/radiobox/radiobox.vue'
import { useUserStore } from '../../store/user.store'
const userStore = useUserStore()

// 按钮功能映射
const buttonFunctions = {
	refresh: () => {
		searchDeviceList()
	},
	check: (btnId) => {
		// TODO: 实现点检功能
		uni.showToast({ title: '点检功能待实现', icon: 'none' })
	},
	history: (btnId) => {
		// TODO: 实现养护历史功能
		uni.showToast({ title: '养护历史功能待实现', icon: 'none' })
	}
}

// 处理按钮点击
const handleButtonClick = (item) => {
	const func = buttonFunctions[item.functionName]
	if (func) {
		func(item.btnId)
	} else {
		console.warn('未找到按钮功能:', item.functionName)
	}
}

// 按钮信息
const btnlist = ref([{
	btnId: 1,
	btnname: '点检',
	btnicon: '/static/checkout.svg',
	functionName: 'check'
},
{
	btnId: 2,
	btnname: '养护历史',
	btnicon: '/static/time.svg',
	functionName: 'history'
},
{
	btnId: 3,
	btnname: '刷新',
	btnicon: '/static/reflash.svg',
	functionName: 'refresh'
}
])


// 养护类型单选框
const conserve = ref('全部')
const conserveOptions = ref(['全部', '开机', '关机', '日检', '月检', '年检'])
const showConserveModal = ref(false)
const handleConserveConfirm = (value) => {
	conserve.value = value
	showConserveModal.value = false
	searchDeviceList() // 选择后自动搜索
}

// 车间单选框
const workshop = ref('全部')
const workshopOptions = ref(['全部', '拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const handleWorkshopConfirm = (value) => {
	workshop.value = value
	showWorkshopModal.value = false
	searchDeviceList() // 选择后自动搜索
}

// 设备编码
const device = ref('')

// 表格数据
const tableData = ref([{
	deviceCode: 20040228,
	isChecked: '是',
	lastCheckDate: '2025-01-01',
	deviceName: '设备',
	model: 'yi',
	workshop: '拉伸车间',
	deviceType: '全部',
	conserveType: '日检'
}])

// 获取设备列表数据
const getDeviceList = async () => {
	const filters = []
	
	// 如果养护类型不是"全部"，添加过滤条件
	if (conserve.value && conserve.value !== '全部') {
		filters.push({
			"controlId": "691ffecf0c1b215c94b51e01",
			"dataType": 30,
			"spliceType": 1,
			"filterType": 2,
			"values": [conserve.value]
		})
	}
	
	// 如果车间不是"全部"，添加过滤条件
	if (workshop.value && workshop.value !== '全部') {
		filters.push({
			"controlId": "67ac0a87d6566fd9d09a2340",
			"dataType": 30,
			"spliceType": 1,
			"filterType": 2,
			"values": [workshop.value]
		})
	}
	
	// 如果设备编码输入框有值，添加过滤条件
	if (device.value && device.value.trim() !== '') {
		filters.push({
			"controlId": "63db6b67e134b5cd4f9f96bc",
			"dataType": 30,
			"spliceType": 1,
			"filterType": 2,
			"values": [device.value.trim()]
		})
	}
	
	const res = await callWorkflowListAPIPaged({
		worksheetId: 'shebeidangan',
		filters: filters
	})
	return res
}

// 搜索设备列表
const searchDeviceList = async () => {
	try {
		const res = await getDeviceList()
		if (res && res.data) {
			// 映射数据到表格格式
			tableData.value = res.data.map(item => ({
				deviceCode: item['63db6b67e134b5cd4f9f96bb'] || '', // 设备编码
				isChecked: item['691fff0a0c1b215c94b51e11'] || '否', // 已检否，需要替换为实际字段ID
				lastCheckDate: item['691fff180c1b215c94b51e15'] || '', // 最近检测时间，需要替换为实际字段ID
				deviceName: item['63db6b67e134b5cd4f9f96bc'] || '', // 设备名称
				model: item['63db6b67e134b5cd4f9f96be'] || '', // 规格型号，需要替换为实际字段ID
				workshop: item['67ac0a87d6566fd9d09a2340'] || '', // 所属车间
				deviceType: item['63db6b67e134b5cd4f9f96bd'] || '', // 设备类别，需要替换为实际字段ID
				conserveType: item['691ffecf0c1b215c94b51e01'] || '' // 养护类型
			}))
		}
	} catch (error) {
		console.error('获取设备列表失败:', error)
		uni.showToast({ title: '获取设备列表失败', icon: 'none' })
	}
}


// 页面加载时获取数据
onMounted(() => {
	searchDeviceList()
})

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

	/* 按钮栏 */
	.btn-list {
		height: px2vw(100px);
		width: 100%;
		display: flex;
		align-items: center;
		padding: px2vw(10px) 0;
		margin-top: px2vw(10px);

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
		margin-top: px2vw(10px);

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
			grid-template-columns: repeat(8, minmax(px2vw(150px), 1fr));
			width: 100%;
			background: white;
		}

		::v-deep .table-header-row .table-header-cell,
		::v-deep .table-body-row .uni-table-td {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: px2vw(30px);
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