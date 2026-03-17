<template>
	<view class="dispatchInquiry-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<Radiobox v-model="report" :options="reportOptions" title="报工" v-model:visible="showReportModal"
			@confirm="handleReportConfirm" />
		<Radiobox v-model="isStop" :options="isStopOptions" title="终止否" v-model:visible="showIsStopModal"
			@confirm="handleIsStopConfirm" />
		
		<!-- 转派模态框 -->
		<view class="transfer-modal" v-if="showTransferModal" @click.self="closeTransferModal">
			<view class="transfer-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">转派</text>
					<view class="modal-close" @click="closeTransferModal">×</view>
				</view>
				
				<scroll-view scroll-y class="modal-scroll-content">
					<view class="modal-body">
						<!-- 机台和模具 -->
						<view class="row-group">
							<view class="form-group">
								<text class="label">机台：</text>
								<text class="value-readonly">{{ transferData.machineNumber || '无' }}</text>
							</view>
							<view class="form-group">
								<text class="label">模具：</text>
								<text class="value-readonly">{{ transferData.mouldNumber || '无' }}</text>
							</view>
						</view>
						
						<!-- 员工和转派数量 -->
						<view class="row-group">
							<view class="form-group">
								<text class="label">员工：</text>
								<view class="value" @click="openSelectEmployeeModal">
									{{ transferData.employee || '请选择员工' }}
								</view>
							</view>
							<view class="form-group">
								<text class="label">转派数量：</text>
								<text class="value-readonly">{{ transferData.remainCount || '0' }}</text>
							</view>
						</view>
						
						<!-- 转派日期 -->
						<view class="row-group">
							<view class="form-group">
								<text class="label">转派日期：</text>
								<text class="value-readonly">{{ transferData.transferDate || '' }}</text>
							</view>
							<view class="form-group">
								<text class="label">工序：</text>
								<text class="value-readonly">{{ transferData.processName || '' }}</text>
							</view>
						</view>

						<!-- 转派备注 -->
						<view class="row-group">
							<view class="form-group">
								<text class="label">转派备注：</text>
								<textarea 
									v-model="transferData.remark" 
									placeholder="请输入转派备注" 
									class="remark-textarea"
									maxlength="200"
								/>
							</view>
							<view class="form-group">
								<!-- 占位 -->
							</view>
						</view>
					</view>
				</scroll-view>
				
				<!-- 模态框底部按钮 -->
				<view class="modal-footer">
					<button class="btn-cancel" @click="closeTransferModal">取消</button>
					<button class="btn-confirm" @click="confirmTransfer">确定转派</button>
				</view>
			</view>
		</view>
		
		<!-- 选择转派员工模态框 -->
		<AddWorkerRadiobox 
			v-model="selectedTransferEmployees" 
			:options="allEmployeesOptions" 
			title="选择转派员工" 
			:visible="showSelectEmployeeModal" 
			@update:visible="handleSelectEmployeeModalClose" 
			@confirm="handleSelectEmployeeConfirm" 
			:workshopOptions="workshopOptions"
			:workshop="modalWorkshop"
			@update:workshop="onModalWorkshopChange"
		/>
		<!-- 导航栏（与派工页面一致：仅左侧返回 + 中间标题） -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				派工查询
			</view>
			<view></view>
		</view>

		<!-- 搜索区域 -->
		<!-- <view class="search-box">
			<view class="startdate">
				<text class="startdate-text">开始日期</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="enddate">
				<text class="enddate-text">结束日期</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="worker">
				<text class="worker-text">加工人</text>
				<view class="input-box">
					<input type="text" />
				</view>
			</view>
			<view class="report">
				<text class="label">报工</text>
				<view class="picker-box" @click="showReportModal = true">
					<text class="picker-selected">{{ report }}</text>
				</view>
			</view>
			<view class="isStop">
				<text class="label">终止否</text>
				<view class="picker-box" @click="showIsStopModal = true">
					<text class="picker-selected">{{ isStop }}</text>
				</view>
			</view>
		</view> -->

		<!-- 派工单据列表 -->
		<view class="dispatchInquiry-list">
			<view class="dispatchInquiry-item" v-for="item in dispatchInquiryList" :key="item.id">
				<view class="action-buttons">
					<button 
						class="btn-transfer" 
						@click="handleTransfer(item)"
					>转派</button>
					<button
						class="btn-transfer btn-delete-dispatch"
						@click="handleDeleteDispatch(item)"
					>删除</button>
				</view>
				<view class="dispatchInquiry-item-info">
					<view class="dispatchInquiry-item-info-top">
						<text class="productionOrder">生产订单：{{ item.productionOrder }}</text>
						<text class="orderCode">订单编码：{{ item.orderCode }}</text>
						<text class="date">日期：{{ item.date }}</text>
					</view>
					<view class="dispatchInquiry-item-info-bottom">
						<text class="goodsName">产品名称：{{ item.goodsName }}</text>
						<text class="goodsCode">产品编码：{{ item.goodsCode }}</text>
						<text class="processName">工序名称：{{ item.processName }}</text>
						<text class="worker">加工人：{{ item.worker }}</text>
						<text class="dispatchCount">派工数量：{{ item.dispatchCount }}</text>
						<text class="worktime">工时：{{ item.worktime }}</text>
						<text class="finishCount">完成数量：{{ item.finishCount }}</text>
						<text class="reworkCount">返工数量：{{ item.reworkCount }}</text>
						<text class="wasteCount">废品数量：{{ item.wasteCount }}</text>
						
					</view>
				</view>
				<view class="status-badge" v-if="item.status">
					{{ item.status }}
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { useUserStore } from '../../store/user.store'
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import Radiobox from '../../component/radiobox/radiobox.vue'
import AddWorkerRadiobox from '../../component/addWorkerRadiobox/addWorkerRadiobox.vue'
import http from '../../utils/request'
import { useStatusBar } from '../../composables/useStatusBar'
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()
onLoad((options) => {
	// 从URL参数获取workshop值，如果存在则使用，否则使用默认值
	if (options.workshop) {
		workshop.value = decodeURIComponent(options.workshop)
	}
	getDispatchInquiryList()
})

// 车间相关
const workshop = ref('拉伸车间')
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
// 选择员工模态框中的车间选择（用于 AddWorkerRadiobox）
const modalWorkshop = ref('')

// 需检验单选框
const report = ref('全部')
const reportOptions = ref(['全部', '已完成', '未完成'])
const showReportModal = ref(false)
const handleReportConfirm = (value) => {
	report.value = value
	showReportModal.value = false
}

// 终止否单选框
const isStop = ref('全部')
const isStopOptions = ref(['全部', '已终止', '未终止'])
const showIsStopModal = ref(false)
const handleIsStopConfirm = (value) => {
	isStop.value = value
	showIsStopModal.value = false
}

// 派工单据列表
const dispatchInquiryList = ref([
	{
		goodsName: '',
		goodsCode: '',
		processName: '',
		date: '',
		orderCode: '',
		productionOrder: '',
		worker: '',
		dispatchCount: '',
		worktime: '',
		finishCount: '',
		reworkCount: '',
		wasteCount: '',
	}
])

// 获取派工单据列表
const getDispatchInquiryList = async () => {
	
  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paigongrenyuan',
    filters: [{
    "controlId": "690c30aacf407aa3d9389791",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [workshop.value]
  }],
  pageSize: 1000,
  pageNum: 1
  })
  const statusExclude = ['全部报工', '已转派']
  dispatchInquiryList.value = res.data
    .filter(item => {
      const status = item['66c7f8866440b9d16c7bf908'] || ''
      return !statusExclude.includes(status)
    })
    .map(item => ({
    goodsName: item['6944facfdc7b13304885b3ad'],
    goodsCode: item['6921596021066a9f124f6e63'],
    processName: item['6945061adc7b13304885b92a'],
    date: item['690d9ae28d797ee211e7e6a4'],
    orderCode: item['6593b04a666735003d33ba61'],
    productionOrder: item['6921596021066a9f124f6e61'],
    worker: item['6938dcf1da0981f67b352b55'],
    dispatchCount: item['655d9cd8cc4f25a27fb3e858'],
    finishCount: item['693fe07b284b84255a6ebda5'],
    worktime: item['693a7d580f64427fac25d070'],
	reworkCount: item['694e69638c7b5544ee6c3493'],
	wasteCount: item['694e69638c7b5544ee6c3494'],
	rowid: item['rowid'],
	machineNumber: item['695c9af59223cfe3a0c02d5f'],
	mouldNumber: item['695c9b009223cfe3a0c02d66'],
	remainCount: item['6901c87f7a33416aedfd6bc4'],
	workshop: item['66f130864a66ee0d85e400a9'],
	status: item['66c7f8866440b9d16c7bf908'],
	isRedeploy: item['695b7efca820885c2979af50'],
	isredeploy: item['695b7efca820885c2979af4f'],
  }))
}

// 转派相关数据
const showTransferModal = ref(false)
const showSelectEmployeeModal = ref(false)
const selectedTransferEmployees = ref([])
const allEmployeesOptions = ref([])
const allEmployeesMap = ref({})
const currentTransferItem = ref(null)

// 转派表单数据
const transferData = ref({
	machineNumber: '',
	mouldNumber: '',
	employee: '',
	employeeId: '',
	remainCount: '',
	transferDate: '',
	processName: '',
	remark: '',
	rowid: '',
	loginCode: ''
})

// 获取当前日期（格式：YYYY-MM-DD）
const getCurrentDate = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// 获取员工列表
const loadEmployees = async () => {
	// 选择员工用的车间：优先使用模态框中的车间；
	// 若为空，则使用当前页面车间，但喷涂车间特殊处理，默认切到组装车间
	const selectedWorkshop = modalWorkshop.value || (workshop.value === '喷涂车间' ? '组装车间' : workshop.value)

	if (!selectedWorkshop) {
		uni.showToast({
			title: '缺少车间信息',
			icon: 'none'
		})
		return
	}
	
	try {
		const currentDate = getCurrentDate()
		console.log('派工查询页面 - 获取员工列表 - 当前日期:', currentDate)
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'yggs',
			filters: [{
				"controlId": "696075d19223cfe3a0c169dc",
				"dataType": 30,
				"spliceType": 1,
				"filterType": 2,
				"values": [selectedWorkshop]
			}],
			pageSize: 1000,
			pageNum: 1
		})
		
		if (res.data && res.data.length > 0) {
			const mappedEmployees = res.data.map(item => {
				const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
				const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
				
				return {
					id: item['6943bd902161a0fc58bad5ab'] || '',
					name: item['6938db8bda0981f67b352af3'] || '',
					totalHours: totalHoursStr === '' ? 0 : parseFloat(totalHoursStr) || 0,
					unrecordedHours: unrecordedHoursStr === '' ? 0 : parseFloat(unrecordedHoursStr) || 0,
					dispatchWorkDate: item['69524e7b7a59e0522d855df6'] || ''
				}
			})
			.filter(emp => emp.id)
			.filter(emp => emp.dispatchWorkDate === currentDate)
			
			allEmployeesOptions.value = mappedEmployees.map(emp => ({
				label: emp.name,
				value: emp.id,
				totalHours: emp.totalHours || 0,
				unrecordedHours: emp.unrecordedHours || 0
			}))
			
			allEmployeesMap.value = {}
			mappedEmployees.forEach(emp => {
				allEmployeesMap.value[emp.id] = emp
			})
		} else {
			allEmployeesOptions.value = []
			allEmployeesMap.value = {}
		}
	} catch (error) {
		console.error('加载员工失败:', error)
		allEmployeesOptions.value = []
		allEmployeesMap.value = {}
	}
}

// 判断是否可以转派
const canTransfer = (item) => {
	// status 为 "部分报工" 或 "待报工"，并且 isRedeploy === "[]"，并且 isredeploy 为空
	const statusValid = item.status === '部分报工'
	const isRedeployValid = item.isRedeploy === '[]'
	const isredeployValid = !item.isredeploy || item.isredeploy === '' || item.isredeploy === '[]'
	return statusValid && isRedeployValid && isredeployValid
}

// 判断是否可以删除派工：状态为待报工时才能删除
const canDeleteDispatch = (item) => {
	return item.status === '待报工'
}

// 打开转派模态框
const handleTransfer = (item) => {
	// 再次检查是否可以转派
	if (!canTransfer(item)) {
		uni.showToast({
			title: '仅“部分报工”且未转派的记录可以转派',
			icon: 'none'
		})
		return
	}
	
	currentTransferItem.value = item
	transferData.value = {
		machineNumber: item.machineNumber || '',
		mouldNumber: item.mouldNumber || '',
		employee: '',
		employeeId: '',
		remainCount: item.remainCount || '0',
		transferDate: getCurrentDate(),
		processName: item.processName || '',
		remark: '',
		rowid: item.rowid || '',
		loginCode: userStore.loginCode || ''
	}
	selectedTransferEmployees.value = []
	showTransferModal.value = true
}

// 删除派工（占位函数，后续可接真实接口）
const handleDeleteDispatch = async (item) => {
	if (!canDeleteDispatch(item)) {
		uni.showToast({ title: '仅“待报工”状态可以删除', icon: 'none' })
		return
	}
	
	if (!item.rowid) {
		uni.showToast({ title: '缺少单据标识，无法删除', icon: 'none' })
		return
	}

	try {
		const res = await http.post('/api/workflow/hooks/NjliOTIzMTIwZjBkMGFkODBmNTQ5Mzhh', {
			rowid: item.rowid
		})

		// 按约定：status === 1 为失败，其余视为成功（接口当前返回示例为 {status:2,...}）
		if (res && res.status === 1) {
			uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
			return
		}

		uni.showToast({ title: res?.msg || '删除成功', icon: 'success' })
		// 删除成功后刷新列表，增加轻微延迟，确保后端数据已更新
		setTimeout(() => {
			getDispatchInquiryList()
		}, 500)
	} catch (error) {
		console.error('删除派工失败:', error)
		uni.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' })
	}
}

// 关闭转派模态框
const closeTransferModal = () => {
	showTransferModal.value = false
	currentTransferItem.value = null
	transferData.value = {
		machineNumber: '',
		mouldNumber: '',
		employee: '',
		employeeId: '',
		remainCount: '',
		transferDate: '',
		processName: '',
		remark: '',
		rowid: '',
		loginCode: ''
	}
	selectedTransferEmployees.value = []
}

// 打开选择员工模态框
const openSelectEmployeeModal = async () => {
	// 初始化选择员工模态框中的车间：喷涂车间特殊处理，默认组装车间
	if (!modalWorkshop.value) {
		modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
	}
	if (allEmployeesOptions.value.length === 0) {
		await loadEmployees()
	}
	selectedTransferEmployees.value = []
	showSelectEmployeeModal.value = true
}

// 关闭选择员工模态框
const handleSelectEmployeeModalClose = (value) => {
	showSelectEmployeeModal.value = value
}

// 确认选择员工
const handleSelectEmployeeConfirm = (selectedIds) => {
	if (selectedIds && selectedIds.length > 0) {
		// 只取第一个选中的员工
		const selectedId = selectedIds[0]
		const emp = allEmployeesMap.value[selectedId]
		
		if (emp) {
			transferData.value.employee = emp.name
			transferData.value.employeeId = selectedId
		} else {
			transferData.value.employee = ''
			transferData.value.employeeId = ''
		}
	} else {
		transferData.value.employee = ''
		transferData.value.employeeId = ''
	}
	showSelectEmployeeModal.value = false
}

// 确定转派
const confirmTransfer = async () => {
	if (!transferData.value.employee || !transferData.value.employeeId) {
		uni.showToast({
			title: '请选择转派员工',
			icon: 'none'
		})
		return
	}
	
	try {
		const res = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk1Y2E1ZDIwODY3ZmI3ZDc1Njc2ZDUx', transferData.value)
		
		// 判断转派是否成功
		const isSuccess = (typeof res === 'string' && res.includes('转派成功')) || 
		                  (res && res.status === 1) || 
		                  (res && res.message === '转派成功')
		
		if (isSuccess) {
			uni.showToast({ title: '转派成功', icon: 'success' })
			closeTransferModal()
			// 延迟刷新，确保后端数据已更新
			setTimeout(() => {
				getDispatchInquiryList()
			}, 500)
		} else {
			const errorMsg = res?.message || res?.data || res || '转派失败'
			uni.showToast({ title: errorMsg, icon: 'none' })
		}
	} catch (error) {
		uni.showToast({ title: '转派失败：' + (error.message || '未知错误'), icon: 'none' })
	}
}

// 退出
const quit = () => {
	uni.navigateBack()
}
</script>

<style scoped lang="scss">
.dispatchInquiry-container {
	min-height: 100vh;
	width: 100vw;
	background-color: #f0f0f0;
	box-sizing: border-box;

	/* 导航栏 */
	.header {
		height: px2vw(100px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		position: relative;

		image {
			margin: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			margin-left: 0;
			font-size: px2vw(35px);
			color: white;
		}
	}

	/* 搜索区域 */
	.search-box {
		background-color: white;
		display: flex;
		height: px2vw(100px);
		flex-wrap: wrap;
		width: 100%;

		.startdate {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.startdate-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.enddate {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.enddate-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.worker {
			display: flex;
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			align-items: center;

			.worker-text {
				font-size: px2vw(30px);
			}

			.input-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				padding: 0 px2vw(35px);
				margin-left: px2vw(15px);

				input {
					font-size: px2vw(30px);
				}
			}
		}

		.report {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(35px);
				font-size: px2vw(30px);		
				box-sizing: border-box;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}
		}

		.isStop {
			margin: 0 px2vw(10px) px2vw(3px) px2vw(10px);
			display: flex;
			align-items: center;

			.label {
				margin-right: px2vw(15px);
				font-size: px2vw(30px);
			}

			.picker-box {
				width: px2vw(250px);
				height: px2vw(80px);
				border: px2vw(3px) solid #5884f1;
				border-radius: px2vw(18px);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0 px2vw(35px);
				font-size: px2vw(30px);
				box-sizing: border-box;
				position: relative;
				cursor: pointer;
			}

			.picker-selected {
				flex: 1;
				text-align: center;
				color: #333;
			}
		}

	}

	/* 派工单据列表 */
	.dispatchInquiry-list {
		.dispatchInquiry-item {
			width: 99%;
			margin: px2vw(10px);
			background-color: #fff;
			border-radius: px2vw(18px);
			padding: px2vw(15px);
			display: flex;
			flex-direction: column;
			position: relative;
			
			.action-buttons {
				position: absolute;
				top: px2vw(15px);
				right: px2vw(15px);
				display: flex;
				gap: px2vw(10px);
				z-index: 10;
			}
			
			.btn-transfer {
				width: px2vw(120px);
				height: px2vw(50px);
				font-size: px2vw(25px);
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: #fff;
				color: #5884f1;
				border: px2vw(2px) solid #5884f1;
				border-radius: px2vw(10px);
				cursor: pointer;
				
				&:active {
					opacity: 0.8;
				}
			}
			
			.btn-delete-dispatch {
				border-color: #5884f1;
				color: #5884f1;
			}

			.dispatchInquiry-item-info {
				width: 100%;
				display: flex;
				flex-direction: column;

				.dispatchInquiry-item-info-top {
					width: 100%;
					display: flex;
					justify-content: flex-start;
					gap: px2vw(50px);
					font-size: px2vw(25px);
					font-weight: bold;
					align-items: center;
					padding-right: px2vw(140px);

					.orderCode {
						font-size: px2vw(25px);
					}
					.productionOrder {
						font-size: px2vw(25px);
					}
					.date {
						font-size: px2vw(25px);
					}
				}
				.dispatchInquiry-item-info-bottom {
					width: 100%;
					display: flex;
					flex-wrap: wrap;
					margin-top: px2vw(10px);

					.goodsName,
					.goodsCode,
					.processName,
					.worker,
					.dispatchCount,
					.finishCount,
					.worktime,
					.reworkCount,
					.wasteCount {
						font-size: px2vw(25px);
						display: flex;
						justify-content: flex-start;
						align-items: center;
						width: px2vw(600px);
					}
				}
			}
			
			.status-badge {
				position: absolute;
				bottom: px2vw(10px);
				right: px2vw(10px);
				color: white;
				padding: px2vw(8px) px2vw(16px);
				border-radius: px2vw(8px);
				font-size: px2vw(22px);
				font-weight: bold;
				white-space: nowrap;
				z-index: 100;
				box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.2);
				background-color: #5884f1;
				pointer-events: none;
			}
		}
	}
	
	/* 转派模态框样式 */
	.transfer-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
		
		.transfer-content {
			background: white;
			border-radius: px2vw(18px);
			width: 90%;
			max-width: px2vw(1400px);
			max-height: 80vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			
			.modal-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: px2vw(30px) px2vw(40px);
				border-bottom: px2vw(2px) solid #eee;
				flex-shrink: 0;
				
				.modal-title {
					font-size: px2vw(35px);
					font-weight: bold;
					color: #333;
				}
				
				.modal-close {
					width: px2vw(50px);
					height: px2vw(50px);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: px2vw(50px);
					color: #999;
					cursor: pointer;
					
					&:active {
						opacity: 0.7;
					}
				}
			}
			
			.modal-scroll-content {
				flex: 1;
				overflow-y: auto;
				-webkit-overflow-scrolling: touch;
			}
			
			.modal-body {
				padding: px2vw(20px) px2vw(20px) px2vw(10px) px2vw(20px);
				display: flex;
				flex-direction: column;
				gap: px2vw(10px);
			}
			
			.row-group {
				display: flex;
				gap: px2vw(10px);
				width: 100%;
				
				&.single .form-group.full {
					width: 100%;
				}
			}
			
			.form-group {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				gap: px2vw(10px);
				flex: 1;
				
				&.full {
					width: 100%;
				}
				
				.label {
					font-size: px2vw(30px);
					color: #666;
					font-weight: bold;
					width: px2vw(120px);
					white-space: nowrap;
					flex-shrink: 0;
					text-align: left;
				}
				
				.value {
					width: px2vw(400px);
					font-size: px2vw(30px);
					color: #333;
					padding: px2vw(8px) px2vw(12px);
					background: #f9f9f9;
					border-radius: px2vw(5px);
					border: px2vw(1px) solid #eee;
					min-height: px2vw(50px);
					display: flex;
					align-items: center;
					box-sizing: border-box;
					cursor: pointer;
				}
				
				.value-readonly {
					width: px2vw(400px);
					font-size: px2vw(30px);
					color: #333;
					padding: px2vw(8px) px2vw(12px);
					background: #f9f9f9;
					border-radius: px2vw(5px);
					border: px2vw(1px) solid #eee;
					min-height: px2vw(50px);
					display: flex;
					align-items: center;
					box-sizing: border-box;
					cursor: default;
				}
				
				.remark-textarea {
					flex: none;
					width: px2vw(400px);
					min-height: px2vw(120px);
					padding: px2vw(8px) px2vw(12px);
					border: px2vw(1px) solid #eee;
					border-radius: px2vw(5px);
					background: #f9f9f9;
					font-size: px2vw(30px);
					color: #333;
					box-sizing: border-box;
					resize: none;
				}
			}
			
			.modal-footer {
				display: flex;
				justify-content: flex-end;
				gap: px2vw(10px);
				padding: px2vw(30px) px2vw(40px);
				border-top: px2vw(2px) solid #eee;
				flex-shrink: 0;
				
				.btn-cancel,
				.btn-confirm {
					width: px2vw(200px);
					height: px2vw(70px);
					border-radius: px2vw(18px);
					font-size: px2vw(30px);
					border: none;
					cursor: pointer;
				}
				
				.btn-cancel {
					background: #f5f5f5;
					color: #666;
				}
				
				.btn-confirm {
					background: #5884f1;
					color: white;
					
					&:disabled {
						background: #ccc;
						color: #999;
						cursor: not-allowed;
						opacity: 0.6;
					}
				}
			}
		}
	}
}
</style>
