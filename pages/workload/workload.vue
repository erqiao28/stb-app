<template>
	<view class="dispatchInquiry-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				员工工作量查询
			</view>

			<view class="btn-box">
				<view class="btn-one" @click="userStore?.logout()">
					<image src="/static/Quit.svg"></image>
					<text>切换</text>
				</view>
				<view class="btn-one">
					<image src="/static/Quit.svg"></image>
					<text>退出</text>
				</view>
			</view>
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
					</uni-tr>
					<uni-tr v-for="item in tableData" :key="item.staff" class="table-body-row">
						<uni-td align="center" class="table-data-cell">{{ item.staff }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.allWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.recordedWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.unrecordedWorktime }}</uni-td>
						<uni-td align="center" class="table-data-cell">{{ item.remainWorktime }}</uni-td>
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

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)

onLoad(() => {
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
	
	const res = await callWorkflowListAPIPaged({
		worksheetId: 'yggs',
		filters: []
	}, pageSize.value, pageNum)
	
	const mappedData = res.data.map(item => ({
		staff: item['6938db8bda0981f67b352af3'],
		allWorktime: item['693bcaa5f15635c61ac3507a'],
		recordedWorktime: item['693bcaa5f15635c61ac3507b'],
		unrecordedWorktime: item['693bc9b7f15635c61ac35050'],
		remainWorktime: item['693bcaa5f15635c61ac3507c'],
	}))
	
	if (isRefresh) {
		tableData.value = mappedData
	}
	currentPage.value = pageNum
	
	if (!isRefresh) {
		tableData.value.push(...mappedData)
	}
	
	// 判断是否还有更多数据
	hasMore.value = mappedData.length === pageSize.value && res.total > tableData.value.length
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

		image {
			margin-left: px2vw(20px);
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
				border-radius: px2vw(18px);
				font-size: px2vw(25px);

				image {
					height: px2vw(50px);
					width: px2vw(50px);
					margin-right: px2vw(20px);
				}
			}
		}
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
	grid-template-columns: repeat(5, 1fr);
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
	grid-template-columns: repeat(5, 1fr);
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
