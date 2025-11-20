<template>
	<view class="dispatchInquiry-container">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				员工工作量查询
			</view>

			<view class="btn-box">
				<view class="btn-one">
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
			<uni-table stripe style="width: 100%;">
				<uni-tr class="table-header-row">
					<uni-th align="center" class="table-header-cell">员工</uni-th>
					<uni-th align="center" class="table-header-cell">已派未记工时</uni-th>
				</uni-tr>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.staff }}</uni-td>
					<uni-td align="center">{{ item.worktime }}</uni-td>

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
// 表格数据
const tableData = ref([{
	staff: '江桥',
	worktime: 10
}])
// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped>
.dispatchInquiry-container {
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
}

/* 表格区域 */
.table {
	margin-top: 10rpx;
	height: calc(100vh - 160rpx);
	overflow: auto;

	::v-deep .uni-table {
		display: flex;
		flex-direction: column;
		width: 100%;
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
	}

	::v-deep .table-body-row {
		min-height: 120rpx;
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

}
</style>
