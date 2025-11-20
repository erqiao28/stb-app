<template>
	<view class="dispatchInquiry-container">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				派工查询
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
	</view>
</template>

<script setup>
import { useUserStore } from '../../store/user.store'
const userStore = useUserStore()
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
</style>
