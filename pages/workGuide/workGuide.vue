<template>
	<view class="process-container" @click="closeDropdowns">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				作业指导书
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
		<!-- 搜索区域 -->
		<view class="search-box">
			<view class="filetype">
				<text class="label">文件类别</text>
				<view class="picker-box" @click.stop="toggleFiletype">
					<text class="picker-selected">{{ selectedFiletypeLabel }}</text>
					<view class="picker-arrow"></view>
					<view v-if="isFiletypeOpen" class="picker-options">
						<view v-for="option in filetype" :key="option.value" class="picker-option"
							@click.stop="selectFiletype(option)">
							{{ option.text }}
						</view>
					</view>
				</view>
			</view>
			<view class="filename">
				<text class="filename-text">文件名</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="name">
				<text class="name-text">名称</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>

			<view class="searchbtn">
				搜索
			</view>


		</view>
		<!-- 表格区域 -->
		<view class="table">
			<uni-table stripe style="width: 100%;">
				<uni-tr class="table-header-row">
					<uni-th align="center" class="table-header-cell">编码</uni-th>
					<uni-th align="center" class="table-header-cell">文件名</uni-th>
					<uni-th align="center" class="table-header-cell">文件类别</uni-th>
					<uni-th align="center" class="table-header-cell">名称</uni-th>
					<uni-th align="center" class="table-header-cell">操作员</uni-th>
					<uni-th align="center" class="table-header-cell">操作</uni-th>
				</uni-tr>
				<view class="table-header-gap"></view>
				<uni-tr v-for="item in tableData" class="table-body-row">
					<uni-td align="center">{{ item.code }}</uni-td>
					<uni-td align="center">{{ item.filename }}</uni-td>
					<uni-td align="center">{{ item.filetype }}</uni-td>
					<uni-td align="center">{{ item.name }}</uni-td>
					<uni-td align="center">{{ item.operator }}</uni-td>
					<uni-td align="center">{{ item.operate }}</uni-td>
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

// 检验选择
const filetype = ref([{
	text: '全部',
	value: 'all'
}, {
	text: '文件类别一',
	value: 'type1'
}, {
	text: '文件类别二',
	value: 'type2'
}, {
	text: '文件类别三',
	value: 'type3'
}, {
	text: '文件类别四',
	value: 'type4'
}])
const selectedFiletype = ref(filetype.value[0])
const isFiletypeOpen = ref(false)
const selectedFiletypeLabel = computed(() => selectedFiletype.value?.text || '请选择养护类型')
const toggleFiletype = () => {
	isFiletypeOpen.value = !isFiletypeOpen.value
}
const selectFiletype = (option) => {
	selectedFiletype.value = option
	isFiletypeOpen.value = false
	console.log('选中:', option.text)
}
const closeDropdowns = () => {
	isFiletypeOpen.value = false
}

// 表格数据
const tableData = ref([{
	code: 20040228,
	filename: '测试文件',
	filetype: '测试类型',
	name: '测试名称',
	operator: '长江二桥',
	operate: '删除'
}])

// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped>
.process-container {
	height: 100vh;
	width: 100vw;
	overflow: hidden;

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

	/* 搜索区域 */
	.search-box {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		width: 100%;

		.filetype {
			margin: 20rpx;
			display: flex;
			align-items: center;

			.label {
				margin-right: 20rpx;
				font-size: 40rpx;
			}

			.picker-box {
				width: 800rpx;
				height: 100rpx;
				border: 2.5rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 40rpx;
				font-size: 40rpx;
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

			.picker-arrow {
				width: 0;
				height: 0;
				border-left: 16rpx solid transparent;
				border-right: 16rpx solid transparent;
				border-top: 20rpx solid #5884f1;
				margin-left: 24rpx;
			}

			.picker-options {
				position: absolute;
				top: calc(100% + 16rpx);
				left: 0;
				width: 100%;
				background-color: #fff;
				border: 2.5rpx solid #5884f1;
				border-radius: 20rpx;
				box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.12);
				max-height: 320rpx;
				overflow-y: auto;
				z-index: 10;
			}

			.picker-option {
				padding: 28rpx 40rpx;
				font-size: 40rpx;
				text-align: center;
				color: #333;
			}

			.picker-option:not(:last-child) {
				border-bottom: 2rpx solid #f0f0f0;
			}

			.picker-option:active {
				background-color: #eef4ff;
			}
		}

		.filename {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.filename-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 700rpx;
				height: 100rpx;
				border: 2.5rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				padding: 0 40rpx;
				margin-left: 10rpx;

				input {
					font-size: 40rpx;
				}
			}
		}

		.name {
			display: flex;
			margin: 20rpx;
			align-items: center;

			.name-text {
				font-size: 40rpx;
			}

			.input-box {
				width: 700rpx;
				height: 100rpx;
				border: 2.5rpx solid #5884f1;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				padding: 0 40rpx;
				margin-left: 10rpx;

				input {
					font-size: 40rpx;
				}
			}
		}

		.searchbtn {
			height: 100rpx;
			width: 220rpx;
			margin: 20rpx;
			padding: 20rpx 40rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 20rpx;
			color: #fff;
			display: flex;
			align-items: center;
			background-color: #5884f1;
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
			grid-template-columns: repeat(6, 1fr);
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
}
</style>