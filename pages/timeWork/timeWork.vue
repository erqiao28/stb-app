<template>
	<view class="timeWork-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<!-- 导航栏（与其他页面一致） -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				记时派工
			</view>
			<view></view>
		</view>

		<!-- 顶部筛选 + 记时派工按钮（导航栏下方） -->
		<view class="top-action-bar">
			<view class="filter-row">
				<text class="filter-label">车间：</text>
				<picker
					mode="selector"
					:range="workshopOptions"
					:value="timeWorkWorkshopIndex"
					@change="onTimeWorkWorkshopChange"
				>
					<view class="filter-picker-value">
						{{ timeWorkForm.workshop || '请选择车间' }}
					</view>
				</picker>
			</view>
			<button class="btn-new-timework" @click="onFabAdd">
				记时派工
			</button>
		</view>

		<!-- 记时派工记录列表（根据车间筛选） -->
		<scroll-view class="timework-bill-list" scroll-y>
			<view
				v-for="bill in timeWorkBills"
				:key="bill.id || bill.dispatchTime + bill.employee"
				class="bill-item"
			>
				<view class="bill-row">
					<view class="bill-col">
						<text class="bill-label">车间：</text>
						<text class="bill-value">{{ bill.workshop || '-' }}</text>
					</view>
					<view class="bill-col">
						<text class="bill-label">员工：</text>
						<text class="bill-value">{{ bill.employee || '-' }}</text>
					</view>
				</view>
				<view class="bill-row">
					<view class="bill-col">
						<text class="bill-label">派工时间：</text>
						<text class="bill-value">{{ bill.dispatchTime || '-' }}</text>
					</view>
					<view class="bill-col">
						<text class="bill-label">开工时间：</text>
						<text class="bill-value">{{ bill.startTime || '-' }}</text>
					</view>
				</view>
				<view class="bill-row">
					<view class="bill-col">
						<text class="bill-label">派工工时：</text>
						<text class="bill-value">{{ bill.dispatchHours || '-' }}</text>
					</view>
					<view class="bill-col">
						<text class="bill-label">时薪：</text>
						<text class="bill-value">{{ bill.hourlyRate || '-' }}</text>
					</view>
				</view>
				<view class="bill-row">
					<view class="bill-col">
						<text class="bill-label">完工时间：</text>
						<text class="bill-value">{{ bill.finishTime || '-' }}</text>
					</view>
					<view class="bill-col">
						<text class="bill-label">用时：</text>
						<text class="bill-value">{{ bill.duration || '-' }}</text>
					</view>
				</view>
				<view class="bill-row">
					<view class="bill-col">
						<text class="bill-label">工资：</text>
						<text class="bill-value">{{ bill.salary || '-' }}</text>
					</view>
					<view class="bill-col">
						<text class="bill-label">报工备注：</text>
						<text class="bill-value">{{ bill.reportRemark || '-' }}</text>
					</view>
				</view>
				<view class="bill-detail-row">
					<text class="bill-label">具体事项：</text>
					<text class="bill-value detail-text">{{ bill.detail || '-' }}</text>
				</view>
				<view class="status-tag" :class="getStatusTagClass(bill.status)">
					{{ bill.status || '-' }}
				</view>
			</view>
			<view v-if="!timeWorkBills.length" class="bill-empty">暂无记时派工记录</view>
		</scroll-view>

		<!-- 记时派工模态框 -->
		<view class="time-work-modal" v-if="showTimeWorkModal" @click.self="closeTimeWorkModal">
			<view class="time-work-modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">记时派工</text>
					<view class="modal-close" @click="closeTimeWorkModal">×</view>
				</view>
				<scroll-view scroll-y class="modal-scroll">
					<view class="modal-body">
						<view class="form-row">
							<view class="form-group">
								<text class="label">车间：</text>
								<picker mode="selector" :range="workshopOptions" :value="timeWorkWorkshopIndex" @change="onTimeWorkWorkshopChange">
									<view class="picker-value">{{ timeWorkForm.workshop || '请选择车间' }}</view>
								</picker>
							</view>
						</view>
						<view class="form-row">
							<view class="form-group">
								<text class="label">派工工时：</text>
								<input v-model.number="timeWorkForm.workHours" type="digit" placeholder="请输入派工工时" class="input-field" />
							</view>
							<view class="form-group">
								<text class="label">时薪：</text>
								<input v-model.number="timeWorkForm.hourlyRate" type="digit" placeholder="请输入时薪" class="input-field" />
							</view>
						</view>
						<view class="form-row">
							<view class="form-group full">
								<text class="label">具体事项：</text>
								<textarea v-model="timeWorkForm.remark" placeholder="请输入具体事项" class="textarea-field" maxlength="500" />
							</view>
						</view>
						<!-- 员工列表（与派工模态框一致） -->
						<view class="employee-section">
							<view class="table-header">
								<view class="col selected">操作</view>
								<view class="col name">姓名</view>
								<view class="col totalHours">总工时数</view>
								<view class="col unrecordedHours">未派工时</view>
							</view>
							<view class="employee-table">
								<view v-for="emp in timeWorkEmployeeList" :key="emp.id" class="table-row">
									<view class="col selected">
										<text class="remove-employee" @click.stop="removeTimeWorkEmployee(emp.id)">移除</text>
									</view>
									<view class="col name">{{ emp.name }}</view>
									<view class="col totalHours">{{ emp.totalHours }} 时</view>
									<view class="col unrecordedHours">{{ emp.unrecordedHours }} 时</view>
								</view>
								<view v-if="timeWorkEmployeeList.length === 0" class="table-empty">暂无员工，请点击下方「添加员工」</view>
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="modal-footer">
					<button class="btn-add-employee" @click="openAddEmployeeModal">添加员工</button>
					<button class="btn-dispatch" @click="doTimeWorkDispatch">派工</button>
				</view>
			</view>
		</view>

		<!-- 添加员工模态框（与派工页面一致；可多选） -->
		<AddWorkerRadiobox
			v-model="selectedEmployeesForAdd"
			:options="allEmployeesOptions"
			title="添加员工"
			:visible="showAddEmployeeModal"
			@update:visible="handleAddEmployeeModalClose"
			@confirm="handleAddEmployeeConfirm"
			:workshopOptions="workshopOptions"
			:workshop="modalWorkshop"
			@update:workshop="onModalWorkshopChange"
		/>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import http from '../../utils/request'
import { useUserStore } from '../../store/user.store'
import AddWorkerRadiobox from '../../component/addWorkerRadiobox/addWorkerRadiobox.vue'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const showTimeWorkModal = ref(false)
const showAddEmployeeModal = ref(false)

// 记时派工记录列表
const timeWorkBills = ref([])

// 车间选项（与派工页面一致）
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])

/** 喷涂车间时，筛选/员工与派工页一致，按组装车间处理 */
const workshopForFilter = (w) => {
	if (!w) return '拉伸车间'
	return w === '喷涂车间' ? '组装车间' : w
}

/** 默认车间：与登录权限 loginLimits 一致；喷涂车间时默认为组装车间 */
const getDefaultTimeWorkshop = () => {
	const raw = (userStore.loginLimits && userStore.loginLimits.trim()) || ''
	if (raw && workshopOptions.value.includes(raw)) {
		return workshopForFilter(raw)
	}
	return '拉伸车间'
}

// 记时派工表单
const timeWorkForm = ref({
	workshop: getDefaultTimeWorkshop(),
	workHours: '',
	hourlyRate: '',
	remark: ''
})

// 记时派工模态框内的车间（用于添加员工时传给 AddWorkerRadiobox；喷涂→组装）
const modalWorkshop = ref(workshopForFilter(timeWorkForm.value.workshop))
const timeWorkWorkshopIndex = computed(() => {
	const i = workshopOptions.value.indexOf(timeWorkForm.value.workshop)
	return i >= 0 ? i : 0
})

async function onTimeWorkWorkshopChange(e) {
	const index = e.detail.value
	timeWorkForm.value.workshop = workshopOptions.value[index] || '拉伸车间'
	modalWorkshop.value = workshopForFilter(timeWorkForm.value.workshop)
	await loadTimeWorkBills()
}

// 员工列表（已添加的员工，与派工模态框一致）
const timeWorkEmployeeList = ref([])
const allEmployeesOptions = ref([])
const allEmployeesMap = ref({})
const selectedEmployeesForAdd = ref([])

const getCurrentDate = () => {
	const now = new Date()
	const y = now.getFullYear()
	const m = String(now.getMonth() + 1).padStart(2, '0')
	const d = String(now.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// 加载可选员工（按车间 + 当前日期，与派工页面一致）
const loadEmployeesForAdd = async () => {
	try {
		const currentDate = getCurrentDate()
		const workshop = modalWorkshop.value || workshopForFilter(timeWorkForm.value.workshop)
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'yggs',
			filters: [{
				controlId: '696075d19223cfe3a0c169dc',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [workshop]
			}],
			pageSize: 100,
			pageNum: 1
		})
		if (res.data && res.data.length > 0) {
			const mapped = res.data.map(item => {
				const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
				const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
				const dispatchWorkDate = item['69524e7b7a59e0522d855df6'] || ''
				return {
					id: item['6943bd902161a0fc58bad5ab'] || '',
					name: item['6938db8bda0981f67b352af3'] || '',
					totalHours: totalHoursStr === '' ? 0 : parseFloat(totalHoursStr) || 0,
					unrecordedHours: unrecordedHoursStr === '' ? 0 : parseFloat(unrecordedHoursStr) || 0,
					dispatchWorkDate
				}
			}).filter(emp => emp.id).filter(emp => emp.dispatchWorkDate === currentDate)
			allEmployeesOptions.value = mapped.map(emp => ({
				label: emp.name,
				value: emp.id,
				totalHours: emp.totalHours || 0,
				unrecordedHours: emp.unrecordedHours || 0
			}))
			allEmployeesMap.value = {}
			mapped.forEach(emp => { allEmployeesMap.value[emp.id] = emp })
		} else {
			allEmployeesOptions.value = []
			allEmployeesMap.value = {}
		}
	} catch (e) {
		console.error('加载员工失败', e)
		allEmployeesOptions.value = []
		allEmployeesMap.value = {}
	}
}

// 加载记时派工记录（数据表 jspg），按车间筛选，过滤掉已完成
const loadTimeWorkBills = async () => {
	try {
		const currentWorkshop = workshopForFilter(timeWorkForm.value.workshop)
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'jspg',
			filters: [
				{
					controlId: '69a7eb4c3b5e707f84d2f8dc',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [currentWorkshop]
				}
			]
		})

		if (!res.data || !res.data.length) {
			timeWorkBills.value = []
			return
		}

		const mapped = res.data
			.map(item => {
				const status = item['69a7dd4c3b5e707f84d2f319'] || ''
				return {
					id: item.rowid || item['rowid'] || '',
					workshop: item['69a7eb4c3b5e707f84d2f8dc'] || '',
					employee: item['69ae75563b5e707f84d481df'] || '',
					dispatchTime: item['69a7dd4c3b5e707f84d2f31c'] || '',
					startTime: item['69ad32953b5e707f84d43ae2'] || '',
					dispatchHours: item['69a7dfdf3b5e707f84d2f464'] || '',
					hourlyRate: item['69a7dd4c3b5e707f84d2f31d'] || '',
					finishTime: item['69a7e5a93b5e707f84d2f5c2'] || '',
					duration: item['69a7e5a93b5e707f84d2f5c3'] || '',
					salary: item['69a7e4a53b5e707f84d2f54f'] || '',
					reportRemark: item['69a7e4d93b5e707f84d2f55a'] || '',
					detail: item['69a7dd4c3b5e707f84d2f31e'] || '',
					status
				}
			})
			// 过滤掉已完成的单据
			.filter(item => item.status !== '已完成')

		// 派工时间倒序
		mapped.sort((a, b) =>
			String(b.dispatchTime || '').localeCompare(String(a.dispatchTime || ''))
		)

		timeWorkBills.value = mapped
	} catch (e) {
		console.error('加载记时派工记录失败:', e)
		timeWorkBills.value = []
	}
}

const openAddEmployeeModal = async () => {
	modalWorkshop.value = workshopForFilter(timeWorkForm.value.workshop)
	await loadEmployeesForAdd()
	selectedEmployeesForAdd.value = timeWorkEmployeeList.value.map((e) => e.id)
	showAddEmployeeModal.value = true
}

const removeTimeWorkEmployee = (id) => {
	timeWorkEmployeeList.value = timeWorkEmployeeList.value.filter((e) => String(e.id) !== String(id))
}

const handleAddEmployeeModalClose = (value) => {
	showAddEmployeeModal.value = value
}

const onModalWorkshopChange = (value) => {
	modalWorkshop.value = workshopForFilter(value)
	loadEmployeesForAdd()
}

const handleAddEmployeeConfirm = async (selectedIds) => {
	if (!selectedIds || selectedIds.length === 0) {
		uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
		return
	}
	const next = []
	selectedIds.forEach((id) => {
		const emp = allEmployeesMap.value[id] || allEmployeesOptions.value.find((o) => String(o.value) === String(id))
		if (emp) {
			next.push({
				id: emp.id || id,
				name: emp.name || emp.label,
				totalHours: emp.totalHours ?? 0,
				unrecordedHours: emp.unrecordedHours ?? 0
			})
		}
	})
	timeWorkEmployeeList.value = next
	showAddEmployeeModal.value = false
	uni.showToast({ title: `已选 ${next.length} 名员工`, icon: 'success' })
}

// 返回选择订单页面
const quit = () => {
	uni.redirectTo({
		url: '/pages/selectBills/selectBills'
	})
}

const onFabAdd = () => {
	const w = timeWorkForm.value.workshop || getDefaultTimeWorkshop()
	timeWorkForm.value = {
		workshop: w,
		workHours: '',
		hourlyRate: '',
		remark: ''
	}
	timeWorkEmployeeList.value = []
	modalWorkshop.value = workshopForFilter(w)
	showTimeWorkModal.value = true
}

const closeTimeWorkModal = () => {
	showTimeWorkModal.value = false
}

const doTimeWorkDispatch = async () => {
	// 基本校验
	if (!timeWorkEmployeeList.value.length) {
		uni.showToast({ title: '请先选择员工', icon: 'none' })
		return
	}
	if (!timeWorkForm.value.workHours) {
		uni.showToast({ title: '请输入派工工时', icon: 'none' })
		return
	}
	if (!timeWorkForm.value.hourlyRate) {
		uni.showToast({ title: '请输入时薪', icon: 'none' })
		return
	}

	const employeesPayload = timeWorkEmployeeList.value.map((emp) => ({
		id: String(emp.id != null ? emp.id : ''),
		name: emp.name || ''
	}))
	const payload = {
		workshop: workshopForFilter(timeWorkForm.value.workshop),
		workHours: parseFloat(timeWorkForm.value.workHours) || 0,
		hourlyRate: parseFloat(timeWorkForm.value.hourlyRate) || 0,
		remark: timeWorkForm.value.remark || '',
		date: getCurrentDate(),
		employees: employeesPayload,
		// 供工作流脚本节点 JSON.parse：部分平台对嵌套数组解析不稳定，增加纯字符串字段更可靠
		employeesJson: JSON.stringify(employeesPayload),
		employeeIds: timeWorkEmployeeList.value.map((e) => e.id).join(','),
		employeeNames: timeWorkEmployeeList.value.map((e) => e.name).join('、'),
		loginCode: userStore.loginCode || '',
		loginName: userStore.loginName || ''
	}

	try {
		uni.showLoading({ title: '提交中...', mask: true })
		const res = await http.post('https://www.dachen.vip/api/workflow/hooks/NjlhZTZiOTIwZjBkMGFkODBmZDQ3MWEz', payload)
		uni.hideLoading()

		// 约定：status === 1 视为失败（与登录、修改密码接口一致）
		if (res && res.status === 1) {
			uni.showToast({ title: res.message || '派工失败', icon: 'none' })
			return
		}

		uni.showToast({ title: res?.message || '派工成功', icon: 'success' })
		closeTimeWorkModal()
		// 派工成功后延迟刷新列表，避免后端写入延迟导致列表未更新
		setTimeout(() => {
			loadTimeWorkBills()
		}, 1000)
	} catch (error) {
		uni.hideLoading()
		console.error('记时派工失败:', error)
		uni.showToast({ title: '派工失败：' + (error.message || '未知错误'), icon: 'none' })
	}
}

// 工单状态标签样式
const getStatusTagClass = (status) => {
	if (status === '待开工') return 'status-pending-start'
	if (status === '待报工') return 'status-pending-report'
	if (status === '待审核') return 'status-pending-approve'
	return 'status-default'
}

const confirmTimeWorkDispatch = async () => {
	// TODO: 记时派工提交逻辑
	uni.showToast({ title: '派工', icon: 'none' })
	closeTimeWorkModal()
}

onLoad((options) => {
	if (options && options.workshop) {
		const w = decodeURIComponent(options.workshop)
		if (workshopOptions.value.includes(w)) {
			timeWorkForm.value.workshop = w
			modalWorkshop.value = workshopForFilter(w)
		}
	} else {
		timeWorkForm.value.workshop = getDefaultTimeWorkshop()
		modalWorkshop.value = workshopForFilter(timeWorkForm.value.workshop)
	}
	loadTimeWorkBills()
})
</script>

<style scoped lang="scss">
.timeWork-container {
	height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;
	display: flex;
	flex-direction: column;

	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(35px);
			color: white;
		}
	}

	/* 导航栏下方的操作按钮区域 */
	.top-action-bar {
		padding: px2vw(20px) px2vw(40px);
		background-color: #f0f0f0;
		flex-shrink: 0;

		.filter-row {
			display: flex;
			align-items: center;
			margin-bottom: px2vw(16px);

			.filter-label {
				font-size: px2vw(28px);
				color: #666;
				margin-right: px2vw(12px);
				white-space: nowrap;
			}

			picker {
				flex: 1;
			}

			.filter-picker-value {
				height: px2vw(60px);
				line-height: px2vw(60px);
				padding: 0 px2vw(12px);
				border-radius: px2vw(8px);
				border: px2vw(1px) solid #eee;
				background-color: #fff;
				font-size: px2vw(28px);
				color: #333;
			}
		}

		.btn-new-timework {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: px2vw(70px);
			padding: 0 px2vw(40px);
			border-radius: px2vw(18px);
			border: none;
			background-color: #2755f1;
			color: #fff;
			font-size: px2vw(30px);
		}
	}
}

/* 记时派工记录列表样式 */
.timework-bill-list {
	flex: 1;
	padding: 0 px2vw(20px) px2vw(20px);
	box-sizing: border-box;
}

.bill-item {
	background-color: #fff;
	border-radius: px2vw(18px);
	padding: px2vw(20px) px2vw(24px) px2vw(40px);
	margin-bottom: px2vw(20px);
	box-shadow: 0 px2vw(4px) px2vw(10px) rgba(0, 0, 0, 0.05);
	position: relative;
}

.bill-row {
	display: flex;
	margin-bottom: px2vw(8px);
}

.bill-col {
	flex: 1;
	display: flex;
	font-size: px2vw(26px);

	.bill-label {
		color: #888;
		margin-right: px2vw(6px);
		white-space: nowrap;
	}

	.bill-value {
		color: #333;
	}
}

.bill-detail-row {
	margin-top: px2vw(8px);
	font-size: px2vw(26px);
	display: flex;
	align-items: flex-start;

	.bill-label {
		color: #888;
		margin-right: px2vw(6px);
		white-space: nowrap;
	}

	.detail-text {
		color: #333;
		flex: 1;
	}
}

.bill-empty {
	text-align: center;
	color: #999;
	font-size: px2vw(26px);
	margin-top: px2vw(40px);
}

.status-tag {
	position: absolute;
	right: px2vw(20px);
	bottom: px2vw(14px);
	padding: px2vw(6px) px2vw(16px);
	border-radius: px2vw(20px);
	font-size: px2vw(24px);
	color: #fff;
	background-color: #ccc;
}

.status-pending-start {
	background-color: #9e9e9e; /* 灰色 */
}

.status-pending-report {
	background-color: #f44336; /* 红色 */
}

.status-pending-approve {
	background-color: #ffb300; /* 黄色 */
	color: #333;
}

.status-default {
	background-color: #ccc;
}

.time-work-modal {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 200;
	padding: px2vw(20px);
	box-sizing: border-box;

	.time-work-modal-content {
		background: white;
		border-radius: px2vw(18px);
		width: 95%;
		max-width: px2vw(1400px);
		max-height: 90vh;
		box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: px2vw(30px) px2vw(40px);
			border-bottom: px2vw(2px) solid #eee;
			font-size: px2vw(35px);
			color: #333;
			flex-shrink: 0;

			.modal-title { font-weight: bold; }
			.modal-close {
				width: px2vw(60px);
				height: px2vw(60px);
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: px2vw(50px);
				color: #999;
			}
		}

		.modal-scroll {
			flex: 1;
			overflow-y: auto;
		}

		.modal-body {
			padding: px2vw(30px) px2vw(40px);
		}

		.form-row {
			display: flex;
			gap: px2vw(20px);
			margin-bottom: px2vw(20px);
		}

		.form-group {
			display: flex;
			align-items: center;
			gap: px2vw(12px);
			margin: 0 px2vw(10px);
			flex: 1;

			&.full { width: 100%; }

			.label {
				font-size: px2vw(28px);
				color: #666;
				white-space: nowrap;
				width: px2vw(140px);
			}

			.picker-value {
				flex: 1;
				height: px2vw(60px);
				line-height: px2vw(60px);
				padding: 0 px2vw(10px);
				border: px2vw(1px) solid #eee;
				border-radius: px2vw(8px);
				font-size: px2vw(28px);
			}

			.input-field {
				flex: 1;
				height: px2vw(60px);
				padding: 0 px2vw(12px);
				border: px2vw(1px) solid #eee;
				border-radius: px2vw(8px);
				font-size: px2vw(28px);
			}

			.textarea-field {
				width: 100%;
				min-height: px2vw(160px);
				padding: px2vw(12px);
				border: px2vw(1px) solid #eee;
				border-radius: px2vw(8px);
				font-size: px2vw(28px);
				box-sizing: border-box;
			}
		}

		.employee-section {
			margin-top: px2vw(20px);
			padding: 0 px2vw(10px) px2vw(15px);

			.table-header {
				display: flex;
				background-color: #f5f5f5;
				font-weight: bold;
				padding: px2vw(15px);
				border-bottom: px2vw(2px) solid #eee;
				align-items: center;

				.col {
					font-size: px2vw(28px);
					padding: 0 px2vw(12px);

					&.selected { width: px2vw(100px); text-align: center; flex-shrink: 0; }
					&.name { flex: 2; padding-left: px2vw(15px); }
					&.totalHours { flex: 1; text-align: right; }
					&.unrecordedHours { flex: 1; text-align: right; }
				}
			}

			.employee-table {
				.table-row {
					display: flex;
					align-items: center;
					padding: px2vw(15px);
					border-bottom: px2vw(1px) solid #eee;

					.col {
						font-size: px2vw(28px);
						padding: 0 px2vw(12px);

						&.selected { width: px2vw(100px); text-align: center; flex-shrink: 0; }
						&.name { flex: 2; padding-left: px2vw(15px); }
						&.totalHours { flex: 1; text-align: right; }
						&.unrecordedHours { flex: 1; text-align: right; }
					}

					.remove-employee {
						font-size: px2vw(24px);
						color: #f44336;
					}
				}

				.table-empty {
					padding: px2vw(30px);
					text-align: center;
					color: #999;
					font-size: px2vw(26px);
				}
			}
		}

		.modal-footer {
			display: flex;
			justify-content: center;
			gap: px2vw(20px);
			padding: px2vw(20px) px2vw(30px);
			border-top: px2vw(1px) solid #eee;
			flex-shrink: 0;

			.btn-add-employee,
			.btn-dispatch {
				min-width: px2vw(280px);
				height: px2vw(70px);
				padding: 0 px2vw(40px);
				border-radius: px2vw(18px);
				font-size: px2vw(30px);
				border: none;
			}

			.btn-add-employee {
				background: #f5f5f5;
				color: #333;
			}

			.btn-dispatch {
				background: #5884f1;
				color: white;
			}
		}
	}
}
</style>
