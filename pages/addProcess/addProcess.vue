<template>
	<view class="addProcess-container">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				添加工序
			</view>
			<view class="save" @click="addProcess">
				保存
			</view>
		</view>

		<!-- 搜索区域 -->
		<view class="search-box">
			<input type="text" placeholder="请输入工序名称" v-model="searchValue" @input="handleSearch" />
			<image src="/static/scan.svg"></image>
		</view>

		<!-- 表格区域 -->
		<view class="table">
			<scroll-view scroll-y class="table-content" @scrolltolower="loadMore" lower-threshold="50">
				<view class="table">
					<view class="table-header-row">
						<view class="table-header-cell">工序序号</view>
						<view class="table-header-cell">工序名称</view>
					</view>
					<view v-for="item in tableData" :key="item.processNumber" class="table-body-row" :class="{ selected: selectedProcess === item.processName }" @click="selectProcess(item)">
						<view class="uni-table-td">{{ item.processNumber }}</view>
						<view class="uni-table-td">{{ item.processName }}</view>
					</view>
					<!-- 加载更多提示 -->
					<view v-if="loading && tableData.length > 0" class="loading-row">
						<view style="text-align: center; grid-column: 1 / -1; font-size: 28rpx; color: #999999; padding: 20rpx 0; font-weight: 400;">加载中...</view>
					</view>
					<view v-if="!hasMore && tableData.length > 0" class="no-more-row">
						<view style="text-align: center; grid-column: 1 / -1; font-size: 28rpx; color: #999999; padding: 20rpx 0; font-weight: 400;">没有更多数据了</view>
					</view>
				</view>
			</scroll-view>
		</view> 
	</view>
</template>

<script setup>
import { ref } from 'vue';
import {
	onLoad,
	onPullDownRefresh,
	onReachBottom
} from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user.store';
import { callWorkflowListAPIPaged } from '../../utils/workflow';
import http from '../../utils/request.js'
import { showToast } from '../../utils/request.js'
// 移除 uni-ui 导入，避免依赖错误
// import { UniTable, UniTr, UniTh, UniTd } from '@dcloudio/uni-ui'
const userStore = useUserStore()

const orderData = ref({
	ordercode: '',
	productcode: '',
	workshop: '',
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)

// 选中的工序
const selectedProcess = ref('')

// 搜索输入值
const searchValue = ref('')

// 防抖搜索（移除延迟，实现实时）
const handleSearch = () => {
  getProcessList(1, true)
}

onLoad((options) => {
	orderData.value.ordercode = decodeURIComponent(options.orderCode || '');
	orderData.value.productcode = decodeURIComponent(options.productCode || '');
	orderData.value.workshop = options.workshop || '';
	getProcessList(1, true)  // 初次加载全部
})

onPullDownRefresh(() => {
	getProcessList(1, true)
	uni.stopPullDownRefresh()
})

onReachBottom(() => {
	loadMore()
})

const loadMore = () => {
	if (!hasMore.value || loading.value) return;
	getProcessList(currentPage.value + 1, false)
	currentPage.value++
}

// 获取工序列表
const getProcessList = async (pageNum, isRefresh = false) => {
	if (loading.value) return;
	loading.value = true;
	console.log('workshop:', orderData.value.workshop)
	const baseFilters = [
		{
			controlId: '6614d7ed1f7f1264f3a332c3',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: ['工序']
		},
		{
			controlId: '66b07c4a965ba588586ec783',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: ['三级']
		},
		{
			controlId: '691e8522d50c894e2e798d03',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: [orderData.value.workshop]
		}
	]

	// 动态添加搜索 filter
	let filters = [...baseFilters]
	if (searchValue.value.trim()) {
		filters.push({
			controlId: '6614b6721103c1d5d3a08122',
			dataType: 30,
			spliceType: 1,
			filterType: 1,  // 模糊匹配
			values: [searchValue.value.trim()]
		})
		console.log('搜索 filters:', filters)  // 日志确认搜索条件
	}

	const params = {
		worksheetId: 'shujuzidian',
		filters
	}

	const res = await callWorkflowListAPIPaged(params, pageSize.value, pageNum)
	console.log('API res total:', res.total, 'data length:', res.data.length)
	console.log('API res data:', res.data)  // 日志确认数据
	const mappedData = res.data.map(item => {
		return {
			processNumber: item['66a119a51a67c46242038254'],
			processName: item['Name'],
		}
	})
	console.log(mappedData)

	if (isRefresh) {
		tableData.value = mappedData
	} 
	currentPage.value = pageNum  // 总是设置当前页

	if (!isRefresh) {
		tableData.value.push(...mappedData)
	}

	// 判断是否还有更多数据
	hasMore.value = mappedData.length === pageSize.value && res.total > tableData.value.length
	loading.value = false
}

// 添加工序
const addProcess = async () => {
	if (!selectedProcess.value) {
		showToast('请选择工序')
		return
	}
	const res = await http.post('/api/workflow/hooks/NjkxYzU0ODlkMjYxYWY3YTM3ZjA3M2Nm', {
		ordercode: orderData.value.ordercode,
		productcode: orderData.value.productcode,
		workshop: orderData.value.workshop,
		processName: selectedProcess.value,
		processOrder: orderData.value.ordercode  // 关联订单
	})
	console.log('保存响应:', res)
	showToast('添加成功')
	// 移到 navigateBack success 中
	uni.navigateBack({
		success: () => {
			uni.$emit('processAdded', {
				orderCode: orderData.value.ordercode,
				processName: selectedProcess.value
			})
		}
	})
}

// 选中工序
const selectProcess = (item) => {
	selectedProcess.value = item.processName
	// selectedProcessId.value = item.processNumber
}

// 返回
const quit = () => {
	uni.navigateBack()
}
</script>

<style>
.addProcess-container {
	width: 100vw;
	height: 100vh;
	background-color: #f0f0f0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.header {
	height: 150rpx;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #5884f1;
	flex-shrink: 0;

	image {
		margin-left: 42.5rpx;
		height: 65rpx;
		width: 65rpx;
	}

	.title {
		font-size: 40rpx;
		color: white;
	}

	.save {
		font-size: 40rpx;
		color: white;
		margin-right: 60rpx;
	}
}

.search-box {
	display: flex;
	align-items: center;
	margin: 20rpx;
	background-color: #fff;
	border-radius: 20rpx;
	padding: 0 20rpx;
	height: 80rpx;
	flex-shrink: 0;

	input {
		width: 100%;
		height: 80rpx;
		border: none;
		outline: none;
		font-size: 40rpx;
	}

	image {
		width: 80rpx;
		height: 80rpx;
	}
}

.table {
	margin: 20rpx;
	margin-top: 10rpx;
	flex: 1;
	overflow: hidden;
}

.table-content {
	height: 100%;
}

::v-deep .uni-table {
	display: flex;
	flex-direction: column;
	width: 100%;
	min-height: 100%;
}

::v-deep .table-header-row,
::v-deep .table-body-row {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	width: 100%;
}

::v-deep .table-header-row .table-header-cell,
::v-deep .table-body-row .uni-table-td {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 36rpx 24rpx;
}

::v-deep .table-header-row {
	min-height: 120rpx;
	align-items: center;
	background-color: #b0b0b0 !important;
}

::v-deep .table-body-row {
	min-height: 120rpx;
	align-items: center;
}

::v-deep .table-body-row:nth-of-type(odd) {
	background-color: #b0b0b0 !important;
}

::v-deep .table-body-row:nth-of-type(even) {
	background-color: white !important;
}

::v-deep .loading-row,
::v-deep .no-more-row {
	background-color: #f5f5f5 !important;
	min-height: 80rpx;
}

::v-deep .table-body-row.selected {
  background-color: #007AFF !important;
}

::v-deep .table-body-row.selected .uni-table-td {
  color: white !important;
}

.selected-row {
	background-color: #e0e0e0 !important; /* 选中时的背景色 */
}
</style>
