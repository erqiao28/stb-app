<template>
	<view class="dispatchInquiry-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏（与派工页面一致：仅左侧返回 + 中间标题） -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				员工工作量查询
			</view>
			<view></view>
		</view>

		<!-- 车间选择 -->
		<view class="workshop-filter">
			<text class="filter-label">车间：</text>
			<picker mode="selector" :range="workshopOptions" range-key="label" @change="onWorkshopChange">
				<view class="picker-display">
					<text class="picker-text">{{ selectedWorkshop }}</text>
					<text class="picker-arrow">▼</text>
				</view>
			</picker>
		</view>

		<!-- 表格区域 -->
		<view class="table">
			<scroll-view scroll-y class="table-content" @scrolltolower="loadMore" lower-threshold="50">
				<uni-table stripe style="width: 100%;">
					<uni-tr class="table-header-row">
						<uni-th align="center" class="table-header-cell">员工</uni-th>
						<uni-th align="center" class="table-header-cell">总工时</uni-th>
						<uni-th align="center" class="table-header-cell">已记工时</uni-th>
						<uni-th align="center" class="table-header-cell">未记工时</uni-th>
						<uni-th align="center" class="table-header-cell">剩余工时</uni-th>
						<uni-th align="center" class="table-header-cell">预计工资</uni-th>
					</uni-tr>
					<uni-tr v-for="item in tableData" :key="item.staff" class="table-body-row">
						<uni-td align="center" class="table-data-cell">{{ item.staff }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.allWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.recordedWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.unrecordedWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.remainWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.estimatedSalary }}</uni-td>
					</uni-tr>
					<!-- 加载更多提示 -->
					<uni-tr v-if="loading && tableData.length > 0" class="loading-row">
						<uni-td align="center" class="loading-text loading-cell">加载中...</uni-td>
					</uni-tr>
					<uni-tr v-if="!hasMore && tableData.length > 0" class="no-more-row">
						<uni-td align="center" class="loading-text loading-cell">没有更多数据了</uni-td>
					</uni-tr>
				</uni-table>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import {
	ref,
} from 'vue'
import {
	onLoad,
	onPullDownRefresh,
	onReachBottom
} from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { buildDateEnumFilter } from '../../utils/dateFilter'
import { defaultWorkshopFromLoginLimits } from '../../utils/workshop'
import { DataTypeEnum } from '../../utils/dataTypeEnum'
import { FilterTypeEnum } from '../../utils/filterTypeEnum'

// 获取当前日期（格式：YYYY-MM-DD）
const getCurrentDate = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)

// 车间单选
const workshopOptions = ref([
	{ label: '拉伸车间', value: '拉伸车间' },
	{ label: '喷涂车间', value: '喷涂车间' },
	{ label: '抛光车间', value: '抛光车间' },
	{ label: '组装车间', value: '组装车间' }
])
const selectedWorkshop = ref('拉伸车间')

const onWorkshopChange = (e) => {
	const index = e.detail.value
	const item = workshopOptions.value[index]
	if (!item) return

	// 更新当前选中车间
	selectedWorkshop.value = item.value

	// 重置分页状态并重新拉取数据
	currentPage.value = 1
	hasMore.value = true
	tableData.value = []
	getWorkloadList(1, true)
}

onLoad(() => {
	const lim = defaultWorkshopFromLoginLimits((userStore.loginLimits || '').trim())
	if (lim && workshopOptions.value.some((o) => o.value === lim)) {
		selectedWorkshop.value = lim
	}
	getWorkloadList(1, true)
})

onPullDownRefresh(() => {
	getWorkloadList(1, true)
	uni.stopPullDownRefresh()
})

onReachBottom(() => {
	loadMore()
})

const loadMore = () => {
	if (!hasMore.value || loading.value) return;
	getWorkloadList(currentPage.value + 1, false)
}

// 获取员工工作量查询列表
const getWorkloadList = async (pageNum, isRefresh = false) => {
	if (loading.value) return;
	loading.value = true;
	
	// 获取当前日期（格式：YYYY-MM-DD）
	const currentDate = getCurrentDate()
	console.log('员工工作量查询页面 - 获取员工列表 - 当前日期:', currentDate)
	
	// 日期作为接口筛选条件下推（DateEnum(17)，构造器见 utils/dateFilter.js），只取当日员工记录，
	// 不再“仅按车间拉取后在前端过滤日期”，接口 total 即当日条数，滚动分页判断保持不变
	const filters = [
		{
			"controlId": "696075d19223cfe3a0c169dc",
			"dataType": DataTypeEnum.EXTERNAL_FIELD,
			"spliceType": 1,
			"filterType": FilterTypeEnum.Eq,
			"values": [selectedWorkshop.value]
		}
	]
	const dateFilter = buildDateEnumFilter({
		controlId: '69524e7b7a59e0522d855df6',
		date: currentDate
	})
	if (dateFilter) filters.push(dateFilter)

	const res = await callWorkflowListAPIPaged({
		worksheetId: 'yggs',
		filters
	}, pageSize.value, pageNum)

	console.log('[员工工作量查询] 获取数据', { total: res?.total, dataLength: res?.data?.length })

	const mappedData = res.data.map(item => ({
		staff: item['6938db8bda0981f67b352af3'],
		allWorktime: item['693bcaa5f15635c61ac3507a'],
		recordedWorktime: item['693bcaa5f15635c61ac3507b'],
		unrecordedWorktime: item['693bc9b7f15635c61ac3507c'],
		remainWorktime: item['693bcaa5f15635c61ac3507c'],
		estimatedSalary: item['69a652043b5e707f84d2a269'] ?? '',
		dispatchWorkDate: item['69524e7b7a59e0522d855df6'] || ''
	}))

	console.log('[员工工作量查询] 接口层日期过滤后数据', { currentDate, mappedCount: mappedData.length })

	if (isRefresh) {
		tableData.value = mappedData
	}
	currentPage.value = pageNum
	
	if (!isRefresh) {
		tableData.value.push(...mappedData)
	}
	
	hasMore.value = res.data.length >= pageSize.value && pageNum * pageSize.value < (res.total || 0)
	loading.value = false
}
// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped lang="scss">
.dispatchInquiry-container {
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
		position: relative;

		image {
			margin: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			margin-left: 0;
			font-size: px2vw(35px);
			color: white;
			font-weight: bold;
		}
	}

	/* 车间选择 */
	.workshop-filter {
		padding: px2vw(16px) px2vw(24px);
		display: flex;
		align-items: center;
		background-color: #f7f7f7;
	}

	.filter-label {
		font-size: px2vw(30px);
		margin-right: px2vw(20px);
	}

	.picker-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-width: px2vw(360px);
		padding: px2vw(12px) px2vw(20px);
		border-radius: px2vw(12px);
		background-color: #ffffff;
		border: 1px solid #e0e0e0;
	}

	.picker-text {
		font-size: px2vw(28px);
	}

	.picker-arrow {
		font-size: px2vw(24px);
		color: #999999;
	}
}

/* 表格区域 */
.table {
	margin-top: px2vw(10px);
	height: calc(100vh - #{px2vw(130px)});
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
	grid-template-columns: repeat(6, 1fr);
	width: 100%;
}

::v-deep .table-header-row .table-header-cell,
::v-deep .table-header-row uni-th {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: px2vw(30px) px2vw(20px);
	font-size: px2vw(35px) !important;
	font-weight: 600;
}

::v-deep .table-body-row .uni-table-td,
::v-deep .table-body-row uni-td,
::v-deep .table-data-cell,
::v-deep .uni-table .table-body-row .uni-table-td,
::v-deep .uni-table .table-body-row uni-td {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: px2vw(30px) px2vw(20px);
	font-size: px2vw(30px) !important;
}

::v-deep .table-body-row .uni-table-td *,
::v-deep .table-body-row uni-td *,
::v-deep .table-data-cell * {
	font-size: px2vw(30px) !important;
}

::v-deep .table-header-row {
	min-height: px2vw(100px);
	align-items: center;
	font-weight: bold;
}

::v-deep .table-body-row {
	min-height: px2vw(100px);
	align-items: center;
}

/* 斑马纹效果 - 从标题开始 */
/* 标题行作为第1行 - 灰色 */
::v-deep .table-header-row {
	background-color: #b0b0b0 !important;
}

/* 数据行：第1个数据行是第2行（白色），第2个数据行是第3行（灰色） */
/* 所以数据行的第1、3、5...个应该是白色，第2、4、6...个应该是灰色 */
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
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	width: 100%;
}

::v-deep .loading-row .loading-cell,
::v-deep .no-more-row .loading-cell {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	font-size: px2vw(25px);
	color: #999999;
	padding: px2vw(15px) 0;
	font-weight: 400;
}
</style>
