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
				<button class="check-update date-test-btn" @click="openDateTest">
					<image src="/static/time.svg"></image>日期接口测试
				</button>
			</view>

			<!-- 日期接口筛选测试弹窗（开发调试用：验证预派工“派工日期”能否在接口层做筛选） -->
			<view class="date-test-mask" v-if="showDateTestModal" @click.self="closeDateTest">
				<view class="date-test-panel" @click.stop>
					<view class="date-test-header">
						<text class="date-test-title">日期接口筛选测试</text>
						<text class="date-test-close" @click="closeDateTest">×</text>
					</view>
					<view class="date-test-body">
						<view class="date-test-field-row">
							<text class="date-test-label">派工日期：</text>
							<picker mode="date" :value="dateTestDate" @change="(e) => (dateTestDate = e.detail.value)">
								<view class="date-test-picker">{{ dateTestDate || '请选择日期' }}</view>
							</picker>
						</view>
						<button class="date-test-go" :loading="dateTestLoading" :disabled="dateTestLoading || !dateTestDate"
							@click="runDateTest">
							获取预派工数据
						</button>
						<view v-if="dateTestBaseline !== null" class="date-test-baseline">
							对照基准（仅“未派工”、无日期限制）：接口共 <text class="date-test-baseline-num">{{ dateTestBaseline }}</text> 条
						</view>
						<view v-if="dateTestResults.length" class="date-test-results">
							<view v-for="(r, idx) in dateTestResults" :key="idx" class="date-test-result">
								<view class="date-test-result-head">
									<text class="date-test-result-name">{{ idx + 1 }}. {{ r.label }}</text>
									<text class="date-test-result-tag"
										:class="r.error ? 'tag-fail' : (r.restricted ? 'tag-ok' : 'tag-fail')">
										{{ r.error ? '失败' : (r.restricted ? '接口层生效' : '未生效') }}
									</text>
								</view>
								<view class="date-test-result-meta" v-if="r.error">
									请求失败：{{ r.error }}
								</view>
								<view class="date-test-result-meta" v-else>
									接口total {{ r.total }} ｜ 本页返回 {{ r.returned }} ｜ 本页日期匹配 {{ r.matched }}
								</view>
							</view>
							<view class="date-test-tip">各写法请求参数与返回明细已打印到控制台（console）</view>
						</view>
					</view>
				</view>
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

// ---------------- 日期接口筛选测试（登录页调试用） ----------------
// 预派工工作表与字段（与 pages/preDispatched/preDispatched.vue 一致）
const DATE_TEST_WS_ID = '6a1e468d27514927ff33cbae'
const DATE_TEST_DATE_FIELD = '6a1e488327514927ff33cca9' // 派工日期
const DATE_TEST_STATUS_FIELD = '6a1e49c427514927ff33ccf5' // 状态（单选下拉）

const showDateTestModal = ref(false)
const dateTestLoading = ref(false)
const dateTestDate = ref('')
// 无日期限制（仅未派工）的对照总条数，用于判断日期条件是否真的在接口层生效
const dateTestBaseline = ref(null)
const dateTestResults = ref([])

const pad2 = (n) => String(n).padStart(2, '0')
const formatDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

// 预派工按“明天”排产为主，打开弹窗默认给明天
const getDefaultTestDate = () => {
	const d = new Date()
	d.setDate(d.getDate() + 1)
	return formatDateStr(d)
}

const openDateTest = () => {
	dateTestDate.value = getDefaultTestDate()
	dateTestBaseline.value = null
	dateTestResults.value = []
	showDateTestModal.value = true
}

const closeDateTest = () => {
	showDateTestModal.value = false
}

// 归一化接口返回的日期原始值（可能带时间部分、对象或数组），只取前 10 位 yyyy-MM-dd
const toDatePrefix = (v) => {
	if (v == null) return ''
	if (Array.isArray(v)) v = v[0]
	if (v && typeof v === 'object') v = v.value ?? v.name ?? v.text ?? ''
	return String(v).trim().slice(0, 10)
}

// 候选日期筛选写法（filterType 枚举含义见 utils/filterTypeEnum.js；
// minValue/maxValue/dateRange 等扩展字段参考明道云官方筛选器说明）
const buildDateFilterCandidates = (date) => {
	const common = {
		controlId: DATE_TEST_DATE_FIELD,
		dataType: 15, // 15=日期(年-月-日)，见 utils/dataTypeEnum.js
		spliceType: 1
	}
	return [{
			label: 'Eq(2) values=[日期]',
			filter: { ...common, filterType: 2, values: [date] }
		},
		{
			label: 'DateEnum(17) value=日期',
			filter: { ...common, filterType: 17, dateRange: 18, dateRangeType: 1, value: date, values: [] }
		},
		{
			label: 'DateEnum(17) value=日期 00:00:00',
			filter: { ...common, filterType: 17, dateRange: 18, dateRangeType: 1, value: `${date} 00:00:00`, values: [] }
		},
		{
			label: 'DateBetween(31) minValue/maxValue 整天',
			filter: {
				...common,
				filterType: 31,
				dateRange: 18,
				dateRangeType: 1,
				minValue: `${date} 00:00:00`,
				maxValue: `${date} 23:59:59`,
				values: []
			}
		}
	]
}

// 执行测试：先取“仅未派工”对照 total，再逐个跑各候选写法，结果输出到弹窗与控制台
const runDateTest = async () => {
	const date = dateTestDate.value
	if (!date || dateTestLoading.value) return
	dateTestLoading.value = true
	dateTestResults.value = []
	const statusFilter = {
		controlId: DATE_TEST_STATUS_FIELD,
		dataType: 11, // 11=单选下拉，与预派工页一致
		spliceType: 1,
		filterType: 2,
		values: ['未派工']
	}
	try {
		// 对照基准：不加日期条件，仅未派工
		const base = await callWorkflowListAPIPaged({
			worksheetId: DATE_TEST_WS_ID,
			filters: [statusFilter],
			pageSize: 1,
			silent: true
		})
		dateTestBaseline.value = base.total || 0
		console.log('【日期接口测试】对照（仅未派工、无日期限制）接口 total =', base.total)

		// 逐个请求各候选写法（只取第一页用于判定，total 由接口返回；单个写法失败不影响其他写法）
		const results = []
		for (const c of buildDateFilterCandidates(date)) {
			try {
				const res = await callWorkflowListAPIPaged({
					worksheetId: DATE_TEST_WS_ID,
					filters: [statusFilter, c.filter],
					pageSize: 100,
					silent: true
				})
				const rows = Array.isArray(res.data) ? res.data : []
				const total = res.total || 0
				const matched = rows.filter((r) => toDatePrefix(r[DATE_TEST_DATE_FIELD]) === date).length
				// 判定是否在接口层生效：接口 total 明显小于对照值，或返回行全部命中所选日期
				const restricted = dateTestBaseline.value != null &&
					(total < dateTestBaseline.value || (rows.length > 0 && matched === rows.length))
				console.log('【日期接口测试】' + c.label, {
					请求filter: c.filter,
					接口total: total,
					本页返回: rows.length,
					本页日期匹配: matched,
					接口层是否生效: restricted
					})
				results.push({ label: c.label, total, returned: rows.length, matched, restricted, rows })
				// 生效的写法，把完整第一页数据打出来便于核对
				if (restricted) {
					console.log('【日期接口测试】' + c.label + ' 已生效，完整返回数据：', rows)
				}
			} catch (err) {
				console.error('【日期接口测试】' + c.label + ' 请求失败:', err)
				results.push({ label: c.label, error: err.message || '请求失败', total: '-', returned: 0, matched: 0, restricted: false })
			}
		}
		dateTestResults.value = results.map(({ rows, ...rest }) => rest)
		const anyHit = dateTestResults.value.some((r) => r.restricted)
		console.log('【日期接口测试】结论：' + (anyHit ? '日期可以在接口层做限制（见上方生效写法）' : '以上写法均未生效，日期限制需继续在前端处理或调整写法'))
	} catch (e) {
		console.error('【日期接口测试】请求失败:', e)
		showToast('测试失败：' + (e.message || '未知错误'))
	} finally {
		dateTestLoading.value = false
	}
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

	/* 登录页右侧“日期接口测试”按钮 */
	.date-test-btn {
		margin-top: px2vw(20px);
		background: rgba(255, 255, 255, 0.08);
	}

	/* 日期接口筛选测试弹窗 */
	.date-test-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.55);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-test-panel {
		width: 640rpx;
		max-width: 92vw;
		max-height: 80vh;
		overflow: auto;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx 34rpx;
		box-sizing: border-box;
	}

	.date-test-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.date-test-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #222;
	}

	.date-test-close {
		font-size: 44rpx;
		line-height: 1;
		color: #999;
		padding: 6rpx 10rpx;
	}

	.date-test-field-row {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.date-test-label {
		font-size: 28rpx;
		color: #333;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.date-test-picker {
		flex: 1;
		height: 76rpx;
		line-height: 76rpx;
		padding: 0 24rpx;
		background: #f2f4f7;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #222;
	}

	.date-test-go {
		width: 100%;
		height: 80rpx;
		line-height: 80rpx;
		background: #3556e3;
		color: #fff;
		font-size: 30rpx;
		border-radius: 40rpx;

		&::after {
			border: none;
		}
	}

	.date-test-baseline {
		margin-top: 22rpx;
		font-size: 26rpx;
		color: #666;
	}

	.date-test-baseline-num {
		color: #3556e3;
		font-weight: 600;
	}

	.date-test-results {
		margin-top: 18rpx;
	}

	.date-test-result {
		background: #f7f8fa;
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
		margin-top: 14rpx;
	}

	.date-test-result-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.date-test-result-name {
		font-size: 26rpx;
		color: #333;
	}

	.date-test-result-tag {
		font-size: 22rpx;
		padding: 4rpx 14rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		margin-left: 16rpx;
	}

	.tag-ok {
		color: #0a7d32;
		background: #e6f7ec;
	}

	.tag-fail {
		color: #c0392b;
		background: #fdecea;
	}

	.date-test-result-meta {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #888;
	}

	.date-test-tip {
		margin-top: 16rpx;
		font-size: 24rpx;
		color: #b06d00;
	}
}
</style>