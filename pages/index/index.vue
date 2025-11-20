<template>
	<view class="content-container">
		<!-- 用户列表 -->
		<view class="user-list" v-if="isUserlist">
			<view class="user-item" v-for="item in userStore.userlist">
				<view class="user-name" @click="selectWorker(item)">
					{{ item.username }}
				</view>
				<view class="user-number" @click="selectWorker(item)">
					{{ item.code }}
				</view>
				<image src="/static/rubish.svg" @click="del(item.rowid)"></image>
			</view>
		</view>
		<view class="login-box">
			<view class="username">
				<image src="/static/user.svg"></image>
				<input type="text" v-model="loginform.username" />
			</view>
			<view class="password">
				<image src="/static/password.svg"></image>
				<input type="password" v-model="loginform.password" />
			</view>
			<view class="rem-box">
				<checkbox class="rem-check" :checked="userStore.rememberPassword"
					@click="userStore.changeRememberPassword()" />
				<text class="rem-text">记住密码</text>
			</view>
			<button class="login-btn" @click="login">登录</button>
		</view>
		<image src="/static/recode.svg" class="recode-btn" @click="isShow">
		</image>
		<view class="setting-box">
			<button class="login-setting" @click="goLoginSetting()">
				<image src="/static/setting.svg"></image>登录设置
			</button>
			<button class="check-update">
				<image src="/static/update.svg"></image>检查更新
			</button>
			<button class="change-password" @click="goChangePassword()">
				<image src="/static/key.svg"></image>修改密码
			</button>
		</view>
	</view>
</template>

<script setup>
import {
	onLoad,
	onShow
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

onLoad(() => {
	if (userStore.rememberPassword === true) {
		loginform.value.username = userStore.loginInfo.username
		loginform.value.password = userStore.loginInfo.password
	}
})

onShow(() => {
	uni.$emit('clearDispatchData')  // 清空派工数据
})

// 登录过的用户列表
const userStore = useUserStore()
const isUserlist = ref(true)
const isShow = () => {
	isUserlist.value = !isUserlist.value
}

// 登录表单
const loginform = ref({
	username: '',
	password: ''
})

// 登录
const login = async () => {
	// 检测输入是否为空
	if (loginform.value.username === '' || loginform.value.password === '') {
		showToast('请输入账号密码')
		return
	}
	// 发请求
	const res = await http.post('/api/workflow/hooks/NjkxNTc3NDc4YTVhMDAzMjI2M2I1ZGJi', loginform.value)
	if (res.status === 1) {
		showToast('账号或密码错误')
		return
	}
	showToast('登录成功')
	// 判断用户列表是否已经存在
	const index = userStore.userlist.findIndex(item => item.rowid === res.rowid)
	if (index === -1) {
		userStore.userlist.push({
			username: res.username,
			password: res.password,
			code: res.code,
			rowid: res.rowid
		})
	}
	// 将登录名称覆盖
	userStore.loginName = res.username
	// 清空输入框
	if (userStore.rememberPassword === false) {
		loginform.value.username = ''
		loginform.value.password = ''
	} else {
		// 保存账号密码
		userStore.loginInfo.username = loginform.value.username
		userStore.loginInfo.password = loginform.value.password
	}
	// 跳转主页面
	goMain()
}

// 选择登入的工作者
const selectWorker = (item) => {
	loginform.value.username = item.username
	loginform.value.password = item.password
}

// 删除
const del = (rowid) => {
	const index = userStore.userlist.findIndex(item => item.rowid === rowid)
	userStore.userlist.splice(index, 1)
}

// 跳转主页面
const goMain = () => {
	uni.navigateTo({
		url: '/pages/main/main'
	})
}

// 跳转登录页面
const goLoginSetting = () => {
	uni.navigateTo({
		url: '/pages/loginSetting/loginSetting'
	})
}

// 跳转修改密码页面
const goChangePassword = () => {
	uni.navigateTo({
		url: '/pages/changePassword/changePassword'
	})
}
</script>

<style scoped lang="scss">
.content-container {
	height: 100vh;
	width: 100vw;
	background-color: #3556e3;
	display: flex;

	/* 用户列表 */
	.user-list {
		position: absolute;
		width: px2vw(500px);
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: #ccc #3556e3;

		/* 用户每一项 */
		.user-item {
			color: #fff;
			height: px2vw(200px);
			width: 100%;
			border: px2vw(2px) solid #fff;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: px2vw(25px);
			cursor: pointer;
			font-size: px2vw(50px);

			/* 删除图标 */
			image {
				height: px2vw(50px);
				width: px2vw(50px);
			}
		}
	}

	/* 登录区域 */
	.login-box {
		position: absolute;
		bottom: px2vw(70px);
		left: px2vw(450px);

		.username {
			width: px2vw(1000px);
			height: px2vw(100px);
			border: px2vw(4px) solid #fff;
			margin: px2vw(20px);
			border-radius: px2vw(87.5px);
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 px2vw(75px);

			image {
				width: px2vw(70px);
				height: px2vw(70px);
			}

			input {
				height: px2vw(100px);
				width: px2vw(750px);
				color: white;
				font-size: px2vw(50px);
			}
		}

		.password {
			width: px2vw(1000px);
			height: px2vw(100px);
			border: px2vw(4px) solid #fff;
			margin: px2vw(20px);
			border-radius: px2vw(50px);
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 px2vw(75px);

			image {
				width: px2vw(70px);
				height: px2vw(70px);
			}

			input {
				height: px2vw(100px);
				width: px2vw(750px);
				color: white;
				font-size: px2vw(50px);
			}
		}

		.rem-box {
			margin: px2vw(25px);

			.rem-check {}

			.rem-text {
				color: #fff;
			}
		}

		.login-btn {
			width: px2vw(1000px);
			height: px2vw(100px);
			color: #4274e0;
			border-radius: px2vw(50px);
			background-color: #e0e0e0;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: px2vw(50px);
		}
	}
	.recode-btn {
		width: px2vw(70px);
		height: px2vw(70px);
		position: absolute;
		left: px2vw(1500px);
		top: px2vw(450px);
	}

	/* 设置区域 */
	.setting-box {
		position: absolute;
		right: px2vw(75px);

		.login-setting,
		.check-update,
		.change-password {
			width: px2vw(262.5px);
			height: px2vw(70px);
			border-radius: px2vw(35px);
			font-size: px2vw(35px);
			display: flex;
			justify-content: center;
			align-items: center;
			margin: px2vw(17.5px);
			background-color: white;
			color: #3556e3;

			image {
				height: px2vw(43.75px);
				width: px2vw(43.75px);
				margin-right: px2vw(17.5px);
			}
		}
	}
}
</style>