<template>
	<view class="content-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="main-home" v-if="isMainPage">
			<view class="btn-box">
				<button class="btn-order" @click="goSelectBills">
					<view class="btn-icon">📋</view>
					<view class="btn-text">订单派工</view>
				</button>
				<button class="btn-product" @click="goSelectProductDispatch">
					<view class="btn-icon">📦</view>
					<view class="btn-text">产品派工</view>
				</button>
				<button class="btn-rework" @click="goReworkDispatch">
					<view class="btn-icon">🔄</view>
					<view class="btn-text">返工派工</view>
				</button>
				<button class="btn-time" @click="goTimeWork">
					<view class="btn-icon">⏱️</view>
					<view class="btn-text">记时派工</view>
				</button>
				<button class="btn-query" @click="goDispatchInquiry">
					<view class="btn-icon">🔍</view>
					<view class="btn-text">派工查询</view>
				</button>
				<button class="btn-workload" @click="goWorkload">
					<view class="btn-icon">📊</view>
					<view class="btn-text">员工工作量查询</view>
				</button>
			</view>
		</view>
		<view class="login-page" v-else>
			<!-- 左侧：用户列表 -->
			<view class="user-list" v-if="isUserlist">
				<view class="user-list-header">
					<text class="user-list-title">历史登录账号</text>
				</view>
				<view class="user-item" v-for="item in userStore.userlist" :key="item.rowid" @click="selectWorker(item)">
					<view class="user-item-main">
						<view class="user-avatar">{{ item.username.charAt(0) }}</view>
						<view class="user-name">{{ item.username }}</view>
					</view>
					<view class="user-del-btn" @tap.stop="del(item.rowid)">
						<image src="/static/rubish.svg" mode="aspectFit" />
					</view>
				</view>
			</view>
			<!-- 右侧：检查更新等按钮 -->
			<view class="login-right-sidebar">
				<button class="check-update" @click="checkUpdate()">
					<image src="/static/update.svg"></image>检查更新
				</button>
			</view>
			<!-- 中间输入框区域 -->
			<view class="login-center">
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
			</view>
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
import { LOGIN_URL } from '../../utils/api'
// 使用状态栏高度
const { statusBarHeight } = useStatusBar()

onLoad((options) => {
	if (options?.mode === 'main') {
		isMainPage.value = true
	}
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
			} catch (e) {
				console.error('【检查更新】解析 fileList 失败:', e)
				uni.hideLoading()
				showToast('更新数据格式错误')
				return
			}
		}
		
		// 检查 fileList 是否为有效数组
		if (!fileList) {
			uni.hideLoading()
			showToast('暂无更新文件')
			return
		}
		
		// 如果不是数组，尝试转换为数组
		if (!Array.isArray(fileList)) {
			// 如果是对象，尝试包装成数组
			if (typeof fileList === 'object') {
				fileList = [fileList]
			} else {
				uni.hideLoading()
				console.error('【检查更新】fileList 不是数组也不是对象:', fileList)
				showToast('更新数据格式错误')
				return
			}
		}
		
		if (fileList.length === 0) {
			uni.hideLoading()
			showToast('暂无更新文件')
			return
		}
		
		// 4. 获取第一个文件（最新版本）
		const fileData = fileList[0]

		// 5. 提取下载地址（优先使用 DownloadUrl，其次使用 file_path + file_name）
		const wgtUrl = fileData.DownloadUrl || (fileData.file_path + fileData.file_name)
		if (!wgtUrl) {
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
		console.error('【检查更新】检查更新失败:', error)
		// #ifdef APP-PLUS
		// uni.showModal({ // 调试弹窗，已按需注释
		// 	title: '检查更新失败(调试)',
		// 	content: `错误信息：${error.message || JSON.stringify(error)}`,
		// 	showCancel: false,
		// 	confirmText: '知道了'
		// })
		// #endif
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
							console.error('【检查更新】安装失败:', error)
							
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
const isMainPage = ref(false)
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
	const res = await http.post(LOGIN_URL, loginform.value)
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
	userStore.loginCode = res.code
	
	// 如果登录响应中有limits字段，保存到仓库的loginLimits
	if (res.limits !== undefined && res.limits !== null && res.limits !== '') {
		userStore.loginLimits = res.limits
	}
	
	// 清空输入框
	if (userStore.rememberPassword === false) {
		loginform.value.username = ''
		loginform.value.password = ''
	} else {
		// 保存账号密码
		userStore.loginInfo.username = loginform.value.username
		userStore.loginInfo.password = loginform.value.password
	}
	// 登录后跳转到主页面（index 主页面模式）
	goMainHome()
}

// 选择登入的工作者
const selectWorker = (item) => {
	loginform.value.username = item.username
	loginform.value.password = item.password
}

// 删除登录账号
const del = (rowid) => {
	const index = userStore.userlist.findIndex(item => item.rowid === rowid)
	if (index === -1) return
	userStore.userlist.splice(index, 1)
}

// 跳转主页面（index 页面）
const goMainHome = () => {
	uni.redirectTo({
		url: '/pages/main/main'
	})
}

// 主页面按钮：订单派工
const goSelectBills = () => {
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?billTypeIndex=0&billType=${encodeURIComponent('正常排产')}&billTypeReadonly=1`
	})
}

// 主页面按钮：产品派工（暂不设置）
const goSelectProductDispatch = () => {
	showToast('产品派工跳转暂未设置')
}

// 主页面按钮：返工派工（暂不设置）
const goReworkDispatch = () => {
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?billTypeIndex=1&billType=${encodeURIComponent('返工排产')}&billTypeReadonly=1`
	})
}

// 主页面按钮：记时派工
const goTimeWork = () => {
	uni.navigateTo({
		url: '/pages/timeWork/timeWork'
	})
}

// 主页面按钮：派工查询
const goDispatchInquiry = () => {
	uni.navigateTo({
		url: '/pages/dispatchInquiry/dispatchInquiry'
	})
}

// 主页面按钮：员工工作量查询
const goWorkload = () => {
	uni.navigateTo({
		url: '/pages/workload/workload'
	})
}

// 跳转登录设置页面
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

// 查看字段类型
const goFieldTypes = async () => {
	let res = await callWorkflowListAPIPaged({
		worksheetId: 'yggs',
		filters: []
	})
	console.log(res.data[0]['697b12b13b5e707f84cd9407'])
}
</script>

<style scoped lang="scss">
.content-container {
	height: 100vh;
	width: 100vw;
	background-color: #3556e3;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;

	.main-home {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: flex-end;

		.btn-box {
			width: 100%;
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			padding: 0 px2vw(40px) px2vw(80px);
			gap: px2vw(30px);

			button {
				width: calc((100% - #{px2vw(60px)}) / 3);
				height: px2vw(140px);
				border-radius: px2vw(24px);
				font-size: px2vw(36px);
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				border: none;
				box-shadow: 0 px2vw(6px) px2vw(16px) rgba(0, 0, 0, 0.2);
				transition: all 0.25s ease;
				color: white;
				font-weight: 600;
				line-height: 1.3;

				&:active {
					transform: translateY(px2vw(4px)) scale(0.97);
					box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.15);
				}

				.btn-icon {
					font-size: px2vw(48px);
					margin-bottom: px2vw(8px);
				}

				.btn-text {
					font-size: px2vw(32px);
				}

				&.btn-order {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				}

				&.btn-product {
					background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
				}

				&.btn-rework {
					background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
				}

				&.btn-time {
					background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
				}

				&.btn-query {
					background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
				}

				&.btn-workload {
					background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
					color: #5a4fcf;
				}
			}
		}
	}

	/* 登录页 */
	.login-page {
		flex: 1;
		display: flex;
		flex-direction: row;
		position: relative;
		align-items: flex-start;
		justify-content: space-between;
		overflow: auto;
		box-sizing: border-box;
	}

	/* 用户列表 */
	.user-list {
		width: px2vw(420px);
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: #ccc #3556e3;
		padding: px2vw(20px);
		box-sizing: border-box;
		flex-shrink: 0;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;

		.user-list-header {
			padding: px2vw(20px) px2vw(16px);
			margin-bottom: px2vw(10px);

			.user-list-title {
				color: rgba(255, 255, 255, 0.7);
				font-size: px2vw(28px);
				font-weight: 500;
			}
		}

		/* 用户每一项 */
		.user-item {
			color: #fff;
			width: 100%;
			background: rgba(255, 255, 255, 0.1);
			border: px2vw(1px) solid rgba(255, 255, 255, 0.2);
			border-radius: px2vw(16px);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: px2vw(16px) px2vw(20px);
			margin-bottom: px2vw(12px);
			font-size: px2vw(32px);
			box-sizing: border-box;
			transition: all 0.2s ease;
			cursor: pointer;

			&:active {
				background: rgba(255, 255, 255, 0.2);
				transform: scale(0.98);
			}

			.user-item-main {
				flex: 1;
				min-width: 0;
				display: flex;
				align-items: center;
				gap: px2vw(16px);
			}

			.user-avatar {
				width: px2vw(56px);
				height: px2vw(56px);
				border-radius: 50%;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: px2vw(28px);
				font-weight: bold;
				color: white;
				flex-shrink: 0;
			}

			.user-name {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-size: px2vw(32px);
				font-weight: 500;
			}

			.user-del-btn {
				flex-shrink: 0;
				width: px2vw(44px);
				height: px2vw(44px);
				padding: px2vw(8px);
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.15);
				display: flex;
				justify-content: center;
				align-items: center;
				transition: all 0.2s ease;

				&:active {
					background: rgba(255, 100, 100, 0.4);
				}

				image {
					width: 100%;
					height: 100%;
				}
			}
		}
	}

	/* 登录区域居中 */
	.login-center {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		padding: px2vw(160px) px2vw(40px) px2vw(80px);
		min-width: 0;
		position: absolute;
		bottom: 0;
		left: 0;
		box-sizing: border-box;
	}

	/* 登录区域 */
	.login-box {
		width: 100%;
		max-width: px2vw(1000px);

		.username {
			width: 100%;
			height: px2vw(100px);
			border: px2vw(4px) solid #fff;
			margin: px2vw(20px) 0;
			border-radius: px2vw(87.5px);
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 px2vw(75px);
			box-sizing: border-box;

			image {
				width: px2vw(70px);
				height: px2vw(70px);
				flex-shrink: 0;
			}

			input {
				height: px2vw(100px);
				flex: 1;
				min-width: 0;
				color: white;
				font-size: px2vw(50px);
				margin-left: px2vw(20px);
			}
		}

		.password {
			width: 100%;
			height: px2vw(100px);
			border: px2vw(4px) solid #fff;
			margin: px2vw(20px) 0;
			border-radius: px2vw(50px);
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 px2vw(75px);
			box-sizing: border-box;

			image {
				width: px2vw(70px);
				height: px2vw(70px);
				flex-shrink: 0;
			}

			input {
				height: px2vw(100px);
				flex: 1;
				min-width: 0;
				color: white;
				font-size: px2vw(50px);
				margin-left: px2vw(20px);
			}
		}

		.rem-box {
			margin: px2vw(25px) 0;

			.rem-text {
				color: #fff;
				font-size: px2vw(45px);
			}
		}

		.login-btn {
			width: 100%;
			height: px2vw(100px);
			color: #4274e0;
			border-radius: px2vw(50px);
			background-color: #e0e0e0;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: px2vw(50px);
			margin-top: px2vw(20px);
		}
	}

	/* 右侧边栏 */
	.login-right-sidebar {
		width: px2vw(300px);
		height: 100%;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: px2vw(20px);
		box-sizing: border-box;
		position: absolute;
		top: 0;
		right: 0;
		z-index: 10;

		.check-update {
			width: 100%;
			height: px2vw(80px);
			border-radius: px2vw(40px);
			font-size: px2vw(32px);
			display: flex;
			justify-content: center;
			align-items: center;
			background: rgba(255, 255, 255, 0.1);
			border: px2vw(1px) solid rgba(255, 255, 255, 0.2);
			color: white;
			padding: 0 px2vw(20px);
			transition: all 0.25s ease;

			&:active {
				transform: translateY(px2vw(2px)) scale(0.97);
				box-shadow: 0 px2vw(2px) px2vw(6px) rgba(0, 0, 0, 0.2);
			}

			image {
				height: px2vw(44px);
				width: px2vw(44px);
				margin-right: px2vw(12px);
				flex-shrink: 0;
			}
		}
	}
}
</style>