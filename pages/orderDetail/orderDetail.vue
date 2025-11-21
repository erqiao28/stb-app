<template>
	<view class="orderDetail-container">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				工单明细
			</view>
			<view>
			</view>
		</view>
		<!-- 工单列表 -->
		<view class="orderList">
			<view class="orderItem" v-for="item in orderList">
				<view class="orderInfo">
					<view class="orderInfo-up">
						<view class="name">
							名称：{{ item.name }}
						</view>
						<view class="processName">
							工序：{{ item.processName }}
						</view>
						<view class="date">
							日期：{{ item.date }}
						</view>
					</view>
					<view class="orderInfo-down">
					<view class="orderCode">
						订单编码：{{ item.orderCode }}
					</view>
					<view class="goodsCode">
						物品编码：{{ item.goodsCode }}
					</view>
					<view class="planFinishDate">
						计划完成日期：{{ item.planFinishDate }}
					</view>
					<view class="dispatchCount">
						派工数量：{{ item.dispatchCount }}
					</view>
					<view class="noteWorkCount">
						未完成数量：{{ item.noteWorkCount }}
					</view>
					<view class="dispatchedNoNoteTime">
						未派工时间：{{ item.dispatchedNoNoteTime }}
					</view>
				</view>
				</view>
				
				<view class="btn-box">
				<button class="btn-item">终止</button>
				<button class="btn-item">转派</button>
				<button class="btn-item">修改</button>
				<button class="btn-item">删除</button>
			</view>
			</view>
			
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../store/user.store'
const userStore = useUserStore()

const orderList = ref([
	{
		name: '18奶锅',
		processName: '拉伸',
		date: '2025-01-01',
		orderCode: '1234567890',
		goodsCode: '1234567890',
		planFinishDate: '2025-01-01',
		dispatchCount: '100',
		noteWorkCount: '0',
		dispatchedNoNoteTime: '0',
	}
])

// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped lang="scss">
.orderDetail-container {
	height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;

	/* 导航栏 */
	.header {
		height: px2vw(120px);
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
			font-size: px2vw(35px);
			color: white;
		}
	}

	/* 工单列表 */
	.orderList {

		/* 工单项 */
		.orderItem {
			width: 98%;
			margin: px2vw(10px);
			background-color: #fff;
			border-radius: px2vw(18px);
			margin: px2vw(10px);
			padding: px2vw(15px);
			display: flex;
			flex-direction: column;

			.orderInfo {
				width: 100%;
				display: flex;
				flex-direction: column;

				.orderInfo-up {
					width: 100%;
					display: flex;
					justify-content: flex-start;
					gap: px2vw(50px);
					font-size: px2vw(25px);
					font-weight: bold;
					align-items: center;
				}

				.orderInfo-down {
					width: 100%;
					display: flex;
					flex-wrap: wrap;
					margin-top: px2vw(10px);

					.orderCode,
					.goodsCode,
					.planFinishDate,
					.dispatchCount,
					.noteWorkCount,
					.dispatchedNoNoteTime {
						font-size: px2vw(25px);
						display: flex;
						justify-content: flex-start;
						align-items: center;
						width: px2vw(600px);
					}
				}
			}

			.btn-box {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: px2vw(25px);

				.btn-item {
					width: px2vw(400px);
					height: px2vw(60px);
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #fff;
					border: px2vw(3px) solid #ccc;
				}
			}
		}
	}


}
</style>
