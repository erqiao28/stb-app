<template>
	<view class="changePassword-conainer">
		<view class="middle-container">
			<view class="input-box">
				<image src="/static/user.svg" mode=""></image>
				<input type="text" placeholder="请输入用户" placeholder-style="color: white;" v-model="formdata.username" />
			</view>
			<view class="input-box">
				<image src="/static/password.svg" mode=""></image>
				<input type="password" placeholder="请输入原密码" placeholder-style="color: white;" v-model="formdata.password" />
			</view>
			<view class="input-box">
				<image src="/static/password.svg" mode=""></image>
				<input type="password" placeholder="请输入新密码" placeholder-style="color: white;"
					v-model="formdata.newPassword" />
			</view>
			<view class="input-box">
				<image src="/static/password.svg" mode=""></image>
				<input type="password" placeholder="再次输入新密码" placeholder-style="color: white;"
					v-model="formdata.confirmPassword" />
			</view>
			<button @click="confim">确定</button>
		</view>
		<view class="return-btn" @click="goBack()">
			<image src="/static/left-arrow-black.svg"></image>
			<text>返回</text>
		</view>
	</view>
</template>

<script setup>
	import {
		onLoad
	} from '@dcloudio/uni-app'
	import {
		ref
	} from 'vue'
	import http, {
		showToast
	} from '../../utils/request'
	import {
		useUserStore
	} from '../../store/user.store'
	const userStore = useUserStore()

	onLoad(() => {
		formdata.value.username = userStore.loginInfo.username
	})

	// 表单数据
	const formdata = ref({
		username: '',
		password: '',
		newPassword: '',
		confirmPassword: ''
	})

	// 确定按钮
	const confim = async () => {
		// 判空
		if (formdata.value.username === '') {
			showToast('请输入账号')
			return
		} else if (formdata.value.password === '') {
			showToast('请输入原密码')
			return
		} else if (formdata.value.newPassword === '') {
			showToast('请输入新密码')
			return
		} else if (formdata.value.confirmPassword === '') {
			showToast('请输入确认新密码')
			return
		}

		// 判重
		if (formdata.value.password === formdata.value.newPassword) {
			showToast('新密码不能与原密码相同')
		}

		// 判不重
		if (formdata.value.newPassword !== formdata.value.confirmPassword) {
			showToast('确认新密码与新密码不同')
		}

		// 发送请求
		const res = await http.post(
			'/api/workflow/hooks/NjkxYTdlNjg5ZDQzNzY1NDk1YmYyOGQy', formdata.value)
		if (res.status === 1) {
			showToast('账号或密码错误')
			return
		}
		showToast('密码修改成功')
		// 清空输入框
		formdata.value = {
			username: '',
			password: '',
			newPassword: '',
			confirmPassword: ''
		}
		// 回到登录页面
		uni.redirectTo({
			url: '/pages/index/index'
		})

	}

	// 返回
	const goBack = () => {
		uni.navigateBack()
	}
</script>

<style scoped>
.changePassword-conainer {
	background-color: #3556e3;
	width: 100vw;
	height: 100vh;
	display: flex;

	.middle-container {
		width: 2000rpx;
		height: 300rpx;
		margin: 450rpx 0 0 520rpx;

		.input-box {
			width: 2000rpx;
			height: 150rpx;
			border: 4rpx solid #fff;
			border-radius: 75rpx;
			margin: 18.75rpx 0;
			display: flex;
			align-items: center;
			padding: 0 37.5rpx;

			image {
				height: 50rpx;
				width: 50rpx;
			}

			input {
				margin: 0 25rpx;
				font-size: 50rpx;
				color: white;
				width: 2000rpx;
			}

			input::-webkit-input-placeholder {
				color: white;
			}

			input::-moz-placeholder {
				color: white;
			}

			input:-ms-input-placeholder {
				color: white;
			}

			input:-moz-placeholder {
				color: white;
			}

			input::placeholder {
				color: white;
			}
		}

		button {
			width: 2000rpx;
			height: 130rpx;
			border: 2.5rpx solid #fff;
			border-radius: 62.5rpx;
			margin: 18.75rpx 0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 50rpx;
			color: #3556e3;
		}
	}

	.return-btn {
		position: absolute;
		background-color: white;
		border-radius: 25rpx;
		top: 25rpx;
		right: 25rpx;
		height: 100rpx;
		width: 300rpx;
		display: flex;
		align-items: center;
		padding: 0 12.5rpx;
		font-size: 40rpx;

		image {
			height: 100rpx;
			width: 70rpx;
			margin: 0 20rpx;
		}
	}
}
</style>