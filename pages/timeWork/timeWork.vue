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

		<!-- 固定在视口右下角的加号按钮 -->
		<view class="fab-add" @click="onFabAdd"><text class="fab-add-icon">+</text></view>

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
							<view class="form-group form-group-empty"></view>
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
								<view class="col selected">选中</view>
								<view class="col name">姓名</view>
								<view class="col totalHours">总工时数</view>
								<view class="col unrecordedHours">未派工时</view>
							</view>
							<view class="employee-table">
								<view v-for="emp in timeWorkEmployeeList" :key="emp.id" class="table-row">
									<view class="col selected">{{ '' }}</view>
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
					<button class="btn-dispatch" @click="confirmTimeWorkDispatch">派工</button>
				</view>
			</view>
		</view>

		<!-- 添加员工模态框（与派工页面一致；仅记时派工限制单选，其他页面不传 maxSelection 即不限制） -->
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
			:maxSelection="1"
		/>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import AddWorkerRadiobox from '../../component/addWorkerRadiobox/addWorkerRadiobox.vue'

const { statusBarHeight } = useStatusBar()

const showTimeWorkModal = ref(false)
const showAddEmployeeModal = ref(false)

// 车间选项（与派工页面一致）
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])

// 记时派工表单
const timeWorkForm = ref({
	workshop: '拉伸车间',
	workHours: '',
	hourlyRate: '',
	remark: ''
})

// 记时派工模态框内的车间（用于添加员工时传给 AddWorkerRadiobox）
const modalWorkshop = ref('拉伸车间')
const timeWorkWorkshopIndex = computed(() => {
	const i = workshopOptions.value.indexOf(timeWorkForm.value.workshop)
	return i >= 0 ? i : 0
})

function onTimeWorkWorkshopChange(e) {
	const index = e.detail.value
	timeWorkForm.value.workshop = workshopOptions.value[index] || '拉伸车间'
	modalWorkshop.value = timeWorkForm.value.workshop
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
		const workshop = modalWorkshop.value || timeWorkForm.value.workshop || '拉伸车间'
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'yggs',
			filters: [{
				controlId: '696075d19223cfe3a0c169dc',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [workshop]
			}],
			pageSize: 1000,
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

const openAddEmployeeModal = async () => {
	modalWorkshop.value = timeWorkForm.value.workshop || '拉伸车间'
	await loadEmployeesForAdd()
	selectedEmployeesForAdd.value = []
	showAddEmployeeModal.value = true
}

const handleAddEmployeeModalClose = (value) => {
	showAddEmployeeModal.value = value
}

const onModalWorkshopChange = (value) => {
	modalWorkshop.value = value
	loadEmployeesForAdd()
}

const handleAddEmployeeConfirm = async (selectedIds) => {
	if (!selectedIds || selectedIds.length === 0) {
		uni.showToast({ title: '请选择一个员工', icon: 'none' })
		return
	}
	// 记时派工只能一名员工：取当前选中的唯一 id，覆盖列表
	const id = selectedIds[0]
	const emp = allEmployeesMap.value[id] || allEmployeesOptions.value.find(o => o.value === id)
	if (emp) {
		timeWorkEmployeeList.value = [{
			id: emp.id || id,
			name: emp.name || emp.label,
			totalHours: emp.totalHours ?? 0,
			unrecordedHours: emp.unrecordedHours ?? 0
		}]
		uni.showToast({ title: '已选择员工', icon: 'success' })
	}
	showAddEmployeeModal.value = false
}

// 返回选择订单页面
const quit = () => {
	uni.redirectTo({
		url: '/pages/selectBills/selectBills'
	})
}

const onFabAdd = () => {
	timeWorkForm.value = {
		workshop: '拉伸车间',
		workHours: '',
		hourlyRate: '',
		remark: ''
	}
	timeWorkEmployeeList.value = []
	modalWorkshop.value = '拉伸车间'
	showTimeWorkModal.value = true
}

const closeTimeWorkModal = () => {
	showTimeWorkModal.value = false
}

const confirmTimeWorkDispatch = () => {
	// TODO: 记时派工提交逻辑
	uni.showToast({ title: '派工', icon: 'none' })
	closeTimeWorkModal()
}

onLoad((options) => {
	if (options && options.workshop) {
		const w = decodeURIComponent(options.workshop)
		if (workshopOptions.value.includes(w)) {
			timeWorkForm.value.workshop = w
			modalWorkshop.value = w
		}
	}
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

	.fab-add {
		position: fixed;
		right: px2vw(40px);
		bottom: px2vw(40px);
		width: px2vw(100px);
		height: px2vw(100px);
		border-radius: 50%;
		background-color: #2755f1;
		color: #fff;
		font-size: px2vw(60px);
		font-weight: 300;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 px2vw(4px) px2vw(12px) rgba(0, 0, 0, 0.2);
		z-index: 100;

		.fab-add-icon {
			position: relative;
			top: px2vw(-4px);
		}
	}
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
				padding: 0 px2vw(12px);
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
