<template>
	<view class="loginSetting-container">
		<!-- 导航栏 -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				登录设置
			</view>
			<image src="/static/right.svg"></image>
		</view>
		<!-- 输入框区域 -->
		<view class="input-box">
			<view class="input-text">
				服务器地址
			</view>
			<input type="text" v-model="serverSite" @blur="saveServerSite" />
		</view>
		<view class="input-box">
			<view class="input-text">
				账套
			</view>
			<input type="text" v-model="account" @blur="saveAccount" />
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import {
		onLoad
	} from '@dcloudio/uni-app'
	import { useUserStore } from '../../store/user.store';
	const userStore = useUserStore()
	
	onLoad(() => {
		serverSite.value = userStore.serverSite
		account.value = userStore.account
	})
	
	const serverSite = ref('') // 服务器地址
	const account = ref('') // 账套
	
	// 保存服务器地址
	const saveServerSite = () => {
		userStore.serverSite = serverSite.value
	}
	// 保存账套
	const saveAccount = () => {
		userStore.account = account.value
	}
	
	// 返回
	const quit = () => {
		uni.navigateBack()
	}
</script>

<style>
	/* 导航栏 */
	.header {
		height: 120rpx;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
	
		image {
			margin: 20rpx;
			height: 80rpx;
			width: 80rpx;
		}
	
		.title {
			font-size: 40rpx;
			color: white;
		}
	}       
	/* 输入框区域 */
	.input-box {
		width: 100%;
		height: 140rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 10rpx solid #e2e2e2;
		
		.input-text {
			margin: 20rpx;
			font-size: 40rpx;
		}
		
		input {
			font-size: 40rpx;
			width: 1000rpx;
		}
	}
</style>
