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

<style lang="scss">
	/* 导航栏 */
	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
	
		image {
			margin: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}
	
		.title {
			font-size: px2vw(40px);
			color: white;
		}
	}       
	/* 输入框区域 */
	.input-box {
		width: 100%;
		height: px2vw(150px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: px2vw(10px) solid #e2e2e2;
		
		.input-text {
			margin: px2vw(15px);
			font-size: px2vw(35px);
		}
		
		input {
			font-size: px2vw(35px);
			width: px2vw(1200px);
		}
	}
</style>
