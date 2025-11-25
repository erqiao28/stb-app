<template>
	<view class="changePassword-conainer" :style="{ paddingTop: statusBarHeight + 'px' }">
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
	import { useStatusBar } from '../../composables/useStatusBar'
	const userStore = useUserStore()
	const { statusBarHeight } = useStatusBar()
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

<style scoped lang="scss">
.changePassword-conainer {
	background-color: #3556e3;
	width: 100vw;
	height: 100vh;
	display: flex;
	box-sizing: border-box;

	.middle-container {
		width: px2vw(1000px);
		height: px2vw(300px);
		margin: px2vw(400px) 0 0 px2vw(500px);

		.input-box {
			width: px2vw(1000px);
			height: px2vw(150px);
			border: px2vw(4px) solid #fff;
			border-radius: px2vw(75px);
			margin: px2vw(20px) 0;
			display: flex;
			align-items: center;
			padding: 0 px2vw(40px);

			image {
				height: px2vw(50px);
				width: px2vw(50px);
			}

			input {
				margin: 0 px2vw(25px);
				font-size: px2vw(50px);
				color: white;
				width: px2vw(850px);
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
			width: px2vw(1000px);
			height: px2vw(130px);
			border: px2vw(3px) solid #fff;
			border-radius: px2vw(65px);
			margin: px2vw(20px) 0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: px2vw(50px);
			color: #3556e3;
			background-color: #e0e0e0;
		}
	}

	.return-btn {
		position: absolute;
		background-color: white;
		border-radius: px2vw(25px);
		top: px2vw(25px);
		right: px2vw(25px);
		height: px2vw(100px);
		width: px2vw(300px);
		display: flex;
		align-items: center;
		padding: 0 px2vw(15px);
		font-size: px2vw(40px);

		image {
			height: px2vw(100px);
			width: px2vw(70px);
			margin: 0 px2vw(20px);
		}
	}
}
</style>