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
					<uni-td align="center" class="table-data-cell">{{ item.staff }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.worktime }}</uni-td>

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
	::v-deep .table-header-row uni-th {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: px2vw(30px) px2vw(20px);
		font-size: px2vw(30px) !important;
	}

	::v-deep .table-body-row .uni-table-td,
	::v-deep .table-body-row uni-td,
	::v-deep .table-data-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: px2vw(30px) px2vw(20px);
		font-size: px2vw(25px) !important;
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

}
</style>
