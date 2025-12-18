<template>
	<view class="content-container" :style="{ paddingTop: statusBarHeight + 'px' }">
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
			<button class="check-update" @click="checkUpdate()">
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
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
// 使用状态栏高度
const { statusBarHeight } = useStatusBar()

onLoad(() => {
	if (userStore.rememberPassword === true) {
		loginform.value.username = userStore.loginInfo.username
		loginform.value.password = userStore.loginInfo.password
	}
})

onShow(() => {
	uni.$emit('clearDispatchData')  // 清空派工数据
})

// 检查更新
const checkUpdate = async () => {
	try {
		// 显示检查中提示
		uni.showLoading({
			title: '检查更新中...',
			mask: true
		})

		// 1. 获取更新信息
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'rjzyb',
			filters: []
		})

		// 2. 检查数据是否存在
		if (!res.data || res.data.length === 0) {
			uni.hideLoading()
			showToast('暂无更新信息')
			return
		}

		// 3. 提取文件数据数组和版本号
		let fileList = res.data[0]['692feb5aee6bb1f6871490de']
		let newVersion = res.data[0]['6937e096ff2b019b3cb35149'] // 从接口获取的新版本
		
		// 获取当前版本（从 pinia 读取）
		const currentVersion = userStore.appVersion || ''
		
		// 如果 fileList 是字符串，尝试解析为 JSON
		if (typeof fileList === 'string') {
			try {
				fileList = JSON.parse(fileList)
				console.log('解析后的 fileList:', fileList)
				console.log('解析后是否为数组:', Array.isArray(fileList))
				console.log('解析后长度:', fileList ? fileList.length : 'null')
			} catch (e) {
				console.error('解析 fileList 失败:', e)
				uni.hideLoading()
				showToast('更新数据格式错误')
				return
			}
		}
		
		// 检查 fileList 是否为有效数组
		if (!fileList) {
			console.log('fileList 为空，返回')
			uni.hideLoading()
			showToast('暂无更新文件')
			return
		}
		
		// 如果不是数组，尝试转换为数组
		if (!Array.isArray(fileList)) {
			console.log('fileList 不是数组，尝试转换')
			// 如果是对象，尝试包装成数组
			if (typeof fileList === 'object') {
				fileList = [fileList]
				console.log('已转换为数组:', fileList)
			} else {
				uni.hideLoading()
				console.error('fileList 不是数组也不是对象:', fileList)
				showToast('更新数据格式错误')
				return
			}
		}
		
		console.log('最终 fileList 长度:', fileList.length)
		if (fileList.length === 0) {
			console.log('fileList 长度为 0，返回')
			uni.hideLoading()
			showToast('暂无更新文件')
			return
		}
		
		console.log('fileList 验证通过，继续处理')

		// 4. 获取第一个文件（最新版本）
		const fileData = fileList[0]

		// 5. 提取下载地址（优先使用 DownloadUrl，其次使用 file_path + file_name）
		const wgtUrl = fileData.DownloadUrl || (fileData.file_path + fileData.file_name)
		console.log('wgtUrl:', wgtUrl)
		if (!wgtUrl) {
			console.log('wgtUrl 为空，返回')
			uni.hideLoading()
			showToast('更新文件地址无效')
			return
		}

		uni.hideLoading()

		// 6. 格式化文件大小
		const fileSize = fileData.file_size ? (fileData.file_size / 1024).toFixed(2) + ' KB' : '未知大小'
		const fileName = fileData.original_file_name || fileData.file_name || '更新包'

		// 7. 弹出更新提示框
		uni.showModal({
			title: '发现新版本',
			content: `当前版本：${currentVersion || '未知'}\n更新版本：${newVersion || '未知'}\n文件名：${fileName}\n文件大小：${fileSize}`,
			confirmText: '立即更新',
			cancelText: '稍后',
			success: (modalRes) => {
				if (modalRes.confirm) {
					// 8. 下载并安装更新（传入新版本号，更新成功后保存到 pinia）
					downloadAndInstall(wgtUrl, newVersion)
				}
			}
		})

	} catch (error) {
		uni.hideLoading()
		console.error('检查更新失败:', error)
		showToast('检查更新失败：' + (error.message || '未知错误'))
	}
}

// 下载并安装更新包
const downloadAndInstall = (wgtUrl, newVersion) => {
	// 显示下载进度
	uni.showLoading({
		title: '正在下载更新...',
		mask: true
	})

	// 下载 wgt 文件
	const downloadTask = uni.downloadFile({
		url: wgtUrl,
		success: (downloadRes) => {
			if (downloadRes.statusCode === 200) {
				// #ifdef APP-PLUS
				if (typeof plus !== 'undefined' && plus.runtime) {
					// 安装 wgt 资源包
					plus.runtime.install(
						downloadRes.tempFilePath,
						{
							force: false // 是否强制安装
						},
						() => {
							// 安装成功，保存新版本到 pinia
							if (newVersion) {
								userStore.appVersion = newVersion
								console.log('版本已保存到 pinia:', newVersion)
							}
							uni.hideLoading()
							uni.showModal({
								title: '更新完成',
								content: '应用将重启以完成更新',
								showCancel: false,
								confirmText: '确定',
								success: () => {
									// 重启应用
									plus.runtime.restart()
								}
							})
						},
						(error) => {
							// 安装失败
							uni.hideLoading()
							console.error('安装失败:', error)
							
							// 检查是否是版本不匹配错误
							const errorMsg = error.message || error.code || JSON.stringify(error)
							let errorTip = '安装失败：'
							
							if (errorMsg.includes('version') || errorMsg.includes('版本') || errorMsg.includes('manifest')) {
								errorTip = '版本不匹配：更新包的版本号必须大于当前应用版本号。\n\n'
								errorTip += '解决方案：\n'
								errorTip += '1. 请重新打包APK并安装\n'
								errorTip += '2. 或联系管理员更新资源包版本号'
								
								uni.showModal({
									title: '安装失败',
									content: errorTip,
									showCancel: false,
									confirmText: '知道了'
								})
							} else {
								showToast(errorTip + errorMsg)
							}
						}
					)
				} else {
					uni.hideLoading()
					showToast('当前环境不支持热更新')
				}
				// #endif

				// #ifndef APP-PLUS
				uni.hideLoading()
				showToast('当前环境不支持热更新，请在APP中使用')
				// #endif
			} else {
				uni.hideLoading()
				showToast('下载失败，状态码：' + downloadRes.statusCode)
			}
		},
		fail: (error) => {
			uni.hideLoading()
			console.error('下载失败:', error)
			showToast('下载失败：' + (error.errMsg || '未知错误'))
		}
	})

	// 监听下载进度
	downloadTask.onProgressUpdate((res) => {
		const progress = Math.floor(res.progress)
		uni.showLoading({
			title: `下载中 ${progress}%`,
			mask: true
		})
	})
}

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
	const res = await http.post('https://www.dachen.vip/api/workflow/hooks/NjkxNTc3NDc4YTVhMDAzMjI2M2I1ZGJi', loginform.value)
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
	box-sizing: border-box;

	/* 用户列表 */
	.user-list {
		position: absolute;
		width: px2vw(400px);
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: #ccc #3556e3;

		/* 用户每一项 */
		.user-item {
			color: #fff;
			height: px2vw(150px);
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
				font-size: px2vw(45px);
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
			font-size: px2vw(30px);
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