<template>
	<view class="addProcess-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				添加工序
			</view>
			<view>
			</view>
		</view>

		<!-- 搜索和车间筛选区域 -->
		<view class="filter-bar">
			<view class="search-box">
				<input type="text" placeholder="请输入工序名称" v-model="searchValue" @input="handleSearch" />
			</view>
			<view class="workshop-picker">
				<picker mode="selector" :range="workshopOptions" :value="selectedWorkshopIndex" @change="onWorkshopChange">
					<view class="picker-value">{{ workshopOptions[selectedWorkshopIndex] }}</view>
				</picker>
			</view>
		</view>

		<!-- 主要内容区域：左侧表格，右侧输入框和按钮 -->
		<view class="main-content">
			<!-- 左侧：表格区域 -->
			<view class="table-section">
				<scroll-view scroll-y class="table-content" @scrolltolower="loadMore" lower-threshold="50">
					<view class="table">
						<view class="table-header-row">
							<view class="table-header-cell">工序名称</view>
						</view>
						<view v-for="item in tableData" :key="item.rowid || item.processName" class="table-body-row" :class="{ selected: selectedProcess?.rowid === item.rowid }" @click="selectProcess(item)">
							<view class="uni-table-td">{{ item.processName }}</view>
						</view>
						<!-- 加载更多提示 -->
						<view v-if="loading && tableData.length > 0" class="loading-row">
							<view class="loading-text">加载中...</view>
						</view>
						<view v-if="!hasMore && tableData.length > 0" class="no-more-row">
							<view class="loading-text">没有更多数据了</view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 右侧：输入框和按钮区域 -->
			<view class="input-section">
				<view class="input-group">
					<view class="input-label">生产顺序</view>
					<input 
						type="number" 
						class="process-input" 
						placeholder="请输入生产顺序" 
						v-model="productionSequence"
						step="0.01"
						disabled />
				</view>
				<view class="input-group">
					<view class="input-label">修改方式</view>
					<picker mode="selector" :range="modifyModeOptions" :value="modifyModeIndex" @change="onModifyModeChange" class="picker-wrapper">
						<view class="process-input date-picker">
							{{ modifyModeOptions[modifyModeIndex] }}
						</view>
					</picker>
				</view>
				<view class="input-group">
					<view class="input-label">计划生产日期</view>
					<picker mode="date" :value="plannedProductionDate" @change="onPlannedDateChange" class="picker-wrapper">
						<view class="process-input date-picker">
							{{ plannedProductionDate }}
						</view>
					</picker>
				</view>
				<button class="add-button" :disabled="isSubmitting" @click="addProcess">添加工序</button>
			</view>
		</view> 
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
	onLoad,
	onPullDownRefresh
} from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow';
import http from '../../utils/request.js'
import { showToast } from '../../utils/request.js'
import { ADD_PROCESS_URL } from '../../utils/api'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

/** 车间选项 */
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const selectedWorkshopIndex = ref(0)

const orderData = ref({
	ordercode: '',
	productcode: '',
	workshop: '',
	selectedSequence: 0, // 从派工页面传过来的计算好的工序顺序
	billRowid: '', // 从派工页面传过来的单据rowid
	processRowid: '', // 从派工页面传过来的选中工序的rowid
	billType: '' // 从派工页面传过来的单据类型（正常排产、返工排产）
})

/** 拉伸/喷涂车间：工序字典仅展示名称中含「新」字的工序 */
const NEW_PROCESS_NAME_CHAR = '新'

const shouldLimitAddProcessListToNewChar = (workshop) =>
	workshop === '拉伸车间' || workshop === '喷涂车间'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)
// 提交中标记：防止快速连点重复提交
const isSubmitting = ref(false)

// 选中的工序（存储整个工序对象）
const selectedProcess = ref(null)

// 生产顺序
const productionSequence = ref('')

// 修改方式：添加、替换
const modifyModeOptions = ['添加', '替换']
const modifyModeIndex = ref(0)
const modifyMode = computed(() => modifyModeOptions[modifyModeIndex.value])

const onModifyModeChange = (e) => {
	modifyModeIndex.value = Number(e.detail.value) || 0
}

// 计划生产日期
const plannedProductionDate = ref('')

// 搜索输入值
const searchValue = ref('')

// 搜索防抖定时器与请求序号（防止慢的旧响应覆盖新结果）
let searchTimer = null
let requestSeq = 0

// 防抖搜索：停止输入 300ms 后才发起请求，避免每次按键都请求
const handleSearch = () => {
	if (searchTimer) clearTimeout(searchTimer)
	searchTimer = setTimeout(() => {
		getProcessList(1, true)
	}, 300)
}

onLoad((options) => {
	orderData.value.ordercode = decodeURIComponent(options.orderCode || '');
	orderData.value.productcode = decodeURIComponent(options.productCode || '');
	orderData.value.workshop = options.workshop || '';
	orderData.value.selectedSequence = parseFloat(options.selectedSequence || 0);
	orderData.value.billRowid = decodeURIComponent(options.billRowid || '');
	orderData.value.processRowid = decodeURIComponent(options.processRowid || '');
	orderData.value.billType = decodeURIComponent(options.billType || '');
	// 设置生产顺序为传过来的计算好的顺序，统一保留两位小数
	if (orderData.value.selectedSequence > 0) {
		productionSequence.value = orderData.value.selectedSequence.toFixed(2)
	} else {
		// 如果没有传顺序，默认为1
		productionSequence.value = '1.00'
	}
	// 初始化计划生产日期为今天，格式：YYYY-MM-DD
	const today = new Date()
	const year = today.getFullYear()
	const month = String(today.getMonth() + 1).padStart(2, '0')
	const day = String(today.getDate()).padStart(2, '0')
	const todayStr = `${year}-${month}-${day}`
	plannedProductionDate.value = todayStr
	// 初始化车间选择器为传入的车间（无论什么权限都初始化）
	if (orderData.value.workshop) {
		const idx = workshopOptions.value.indexOf(orderData.value.workshop)
		if (idx >= 0) {
			selectedWorkshopIndex.value = idx
		}
	}
	getProcessList(1, true)  // 初次加载全部
})

const onWorkshopChange = (e) => {
	selectedWorkshopIndex.value = Number(e.detail.value) || 0
	const newWorkshop = workshopOptions.value[selectedWorkshopIndex.value]
	orderData.value.workshop = newWorkshop
	// 切换车间后重新加载工序列表
	searchValue.value = ''
	getProcessList(1, true)
}

onPullDownRefresh(async () => {
	await getProcessList(1, true)
	uni.stopPullDownRefresh()
})

const loadMore = () => {
	if (!hasMore.value || loading.value) return;
	// currentPage 由 getProcessList 内部统一赋值，此处不再自增，避免跳页
	getProcessList(currentPage.value + 1, false)
}

// 获取工序列表
const getProcessList = async (pageNum, isRefresh = false) => {
	// 加载更多时若已有请求在进行则跳过；刷新类请求（搜索/下拉/初始化）允许插队，过期响应通过序号丢弃
	if (loading.value && !isRefresh) return;
	const seq = ++requestSeq
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
		},
		{
			controlId: '6a324e7d6d70ffabc66cbe5f',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: ['1']
		}
	]

	// 动态添加工序名称 filter（有搜索词用搜索；拉伸/喷涂且无搜索时按「新」字模糊缩小范围）
	const limitNewChar = shouldLimitAddProcessListToNewChar(orderData.value.workshop)
	let filters = [...baseFilters]
	const nameSearch = searchValue.value.trim()
	if (nameSearch) {
		filters.push({
			controlId: '6614b6721103c1d5d3a08122',
			dataType: 30,
			spliceType: 1,
			filterType: 1,  // 模糊匹配
			values: [nameSearch]
		})
		console.log('搜索 filters:', filters)  // 日志确认搜索条件
	} else if (limitNewChar) {
		filters.push({
			controlId: '6614b6721103c1d5d3a08122',
			dataType: 30,
			spliceType: 1,
			filterType: 1,
			values: [NEW_PROCESS_NAME_CHAR]
		})
	}

	const params = {
		worksheetId: 'shujuzidian',
		filters
	}

	// 请求失败时复位 loading 并提示，避免页面卡死只能退出重进
	let res
	try {
		res = await callWorkflowListAPIPaged(params, pageSize.value, pageNum)
	} catch (e) {
		console.error('加载工序列表失败:', e)
		// 仅当没有更新的请求时才提示并复位 loading（新请求会自行管理 loading）
		if (seq === requestSeq) {
			showToast('加载失败，请重试')
			loading.value = false
		}
		return
	}
	// 已有更新的请求发出，丢弃本次过期结果
	if (seq !== requestSeq) return
	console.log('API res total:', res.total, 'data length:', res.data.length)
	console.log('API res data:', res.data)  // 日志确认数据
	let mappedData = res.data.map(item => {
		return {
			processName: item['Name'],
			rowid: item['rowid'] || ''
		}
	})
	if (limitNewChar) {
		mappedData = mappedData.filter((row) =>
			String(row.processName || '').includes(NEW_PROCESS_NAME_CHAR)
		)
	}
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
	// 防重复提交
	if (isSubmitting.value) return

	const processName = selectedProcess.value?.processName || ''

	if (!processName) {
		showToast('请选择工序')
		return
	}

	isSubmitting.value = true
	try {
		const res = await http.post(ADD_PROCESS_URL, {
			ordercode: orderData.value.ordercode,
			productcode: orderData.value.productcode,
			workshop: orderData.value.workshop,
			processName: processName,
			isNew: false,
			sequence: parseFloat(productionSequence.value) || 0,
			modifyMode: modifyMode.value,
			processPrice: 0,
			plannedProductionDate: plannedProductionDate.value || '',
			billRowid: orderData.value.billRowid,
			processRowid: orderData.value.processRowid || '',
			billType: orderData.value.billType || ''
		})
		console.log('保存响应:', res)
		showToast('添加成功')
		// 移到 navigateBack success 中
		uni.navigateBack({
			success: () => {
				uni.$emit('processAdded', {
					orderCode: orderData.value.ordercode,
					processName: processName
				})
			}
		})
	} catch (e) {
		console.error('添加工序失败:', e)
		showToast('添加失败，请重试')
	} finally {
		isSubmitting.value = false
	}
}

// 选中工序
const selectProcess = (item) => {
	selectedProcess.value = item  // 存储整个工序对象
	// 生产顺序保持使用跳转前选中的顺序+0.01，不需要重新计算
}

// 计划生产日期选择变化处理
const onPlannedDateChange = (e) => {
	plannedProductionDate.value = e.detail.value
}

// 返回
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped lang="scss">
.addProcess-container {
	width: 100vw;
	height: 100vh;
	background-color: #f0f0f0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.header {
	height: px2vw(90px);
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #5884f1;
	flex-shrink: 0;

	image {
		margin-left: px2vw(20px);
		height: px2vw(50px);
		width: px2vw(50px);
	}

	.title {
		font-size: px2vw(32px);
		color: white;
		font-weight: bold;
	}

}

.filter-bar {
	display: flex;
	align-items: center;
	gap: px2vw(15px);
	margin: px2vw(10px) px2vw(15px);
	flex-shrink: 0;

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: #fff;
		border-radius: px2vw(18px);
		padding: 0 px2vw(20px);
		height: px2vw(80px);
		min-width: 0;

		input {
			width: 100%;
			height: px2vw(80px);
			border: none;
			outline: none;
			font-size: px2vw(28px);
			background: transparent;
		}
	}

	.workshop-picker {
		flex: 1;
		min-width: 0;
		height: px2vw(80px);
		background-color: #5884f1;
		border-radius: px2vw(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 px2vw(20px);
		box-sizing: border-box;

		picker {
			width: 100%;
		}

		.picker-value {
			font-size: px2vw(28px);
			color: white;
			text-align: center;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-weight: bold;
		}
	}
}

/* 主要内容区域：左右布局 */
.main-content {
	display: flex;
	flex: 1;
	overflow: hidden;
	gap: px2vw(15px);
	margin: 0 px2vw(15px) px2vw(15px);
}

/* 左侧表格区域 */
.table-section {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.table {
	margin: 0;
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
	grid-template-columns: 1fr;
	width: 100%;
}

/* 右侧输入框和按钮区域 */
.input-section {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: px2vw(10px);
	padding: px2vw(20px);
	background-color: #fff;
	border-radius: px2vw(18px);
}

.input-group {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: px2vw(8px);
	margin-bottom: px2vw(2px);
}

.input-label {
	font-size: px2vw(30px);
	font-weight: bold;
	color: #333;
	width: px2vw(200px);
	flex-shrink: 0;
	white-space: nowrap;
}

.process-input {
	flex: 1;
	height: px2vw(80px);
	padding: 0 px2vw(20px);
	border: px2vw(2px) solid #e0e0e0;
	border-radius: px2vw(12px);
	font-size: px2vw(30px);
	background-color: #fff;
	box-sizing: border-box;

	&:focus {
		border-color: #5884f1;
		outline: none;
	}
	
	&.input-disabled,
	&:disabled {
		background-color: #f5f5f5;
		color: #999;
		cursor: not-allowed;
		opacity: 0.6;
	}
}

.picker-wrapper {
	flex: 1;
	min-width: 0;
	width: 100%;
}

.date-picker {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	color: #333;
	width: 100%;
	
	&:empty::before {
		content: '请选择计划生产日期';
		color: #999;
	}
}

.add-button {
	width: 100%;
	height: px2vw(80px);
	background-color: #5884f1;
	color: white;
	border: none;
	border-radius: px2vw(12px);
	font-size: px2vw(30px);
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: auto;

	&:active {
		background-color: #2755f1;
	}
}

::v-deep .table-header-row .table-header-cell,
::v-deep .table-body-row .uni-table-td {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: px2vw(30px) px2vw(20px);
	font-size: px2vw(30px);
}

::v-deep .table-header-row {
	min-height: px2vw(100px);
	align-items: center;
	background-color: #b0b0b0 !important;
	font-weight: bold;
}

::v-deep .table-body-row {
	min-height: px2vw(100px);
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
	min-height: px2vw(80px);
}

.loading-text {
	text-align: center;
	grid-column: 1 / -1;
	font-size: px2vw(25px);
	color: #999999;
	padding: px2vw(15px) 0;
	font-weight: 400;
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
