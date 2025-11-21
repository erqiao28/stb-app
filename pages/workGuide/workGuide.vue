<template>
	<view class="process-container">
		<!-- 文件类别单选模态框 -->
		<Radiobox v-model="selectedFiletype" :options="filetypeOptions" title="文件类别" v-model:visible="showFiletypeModal"
			@confirm="handleFiletypeConfirm" />
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
				<view class="picker-box" @click="showFiletypeModal = true">
					<text class="picker-selected">{{ selectedFiletypeLabel }}</text>
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
					<uni-td align="center" class="table-data-cell">{{ item.code }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.filename }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.filetype }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.name }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.operator }}</uni-td>
					<uni-td align="center" class="table-data-cell">{{ item.operate }}</uni-td>
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
import Radiobox from "../../component/radiobox/radiobox.vue";

// 文件类别选项（字符串数组格式）
const filetypeOptions = ref(['全部', '文件类别一', '文件类别二', '文件类别三', '文件类别四'])
const selectedFiletype = ref('全部')
const showFiletypeModal = ref(false)

const selectedFiletypeLabel = computed(() => selectedFiletype.value || '请选择文件类别')

const handleFiletypeConfirm = (value) => {
	selectedFiletype.value = value
	showFiletypeModal.value = false
	console.log('选中:', value)
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

<style scoped lang="scss">
.process-container {
	height: 100vh;
	width: 100vw;
	overflow: hidden;

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

	/* 搜索区域 */
	.search-box {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		width: 100%;

		.filetype {
			margin: px2vw(15px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(340px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(30px);
				font-size: px2vw(30px);
				box-sizing: border-box;
				background-color: #fff;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}
		}

		.filename {
			display: flex;
			margin: px2vw(15px);
			align-items: center;

			.filename-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(500px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(30px);
				margin-left: px2vw(10px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.name {
			display: flex;
			margin: px2vw(15px);
			align-items: center;

			.name-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(500px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(30px);
				margin-left: px2vw(10px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.searchbtn {
			height: px2vw(80px);
			width: px2vw(150px);
			margin: px2vw(15px);
			padding: px2vw(15px) px2vw(30px);
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: px2vw(18px);
			color: #fff;
			background-color: #5884f1;
			font-size: px2vw(30px);
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
			grid-template-columns: repeat(6, 1fr);
			width: 100%;
		}

		::v-deep .table-header-row .table-header-cell {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: px2vw(30px) px2vw(20px);
			font-size: px2vw(30px);
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
}
</style>