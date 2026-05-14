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

		<!-- 修改派工数量模态框 -->
		<view class="transfer-modal" v-if="showEditQtyModal" @click.self="closeEditQtyModal">
			<view class="transfer-content edit-qty-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">修改派工数量</text>
					<view class="modal-close" @click="closeEditQtyModal">×</view>
				</view>
				<scroll-view scroll-y class="modal-scroll-content">
					<view class="modal-body">
						<view class="row-group">
							<view class="form-group">
								<text class="label">生产数量：</text>
								<text class="value-readonly">{{ editQtyForm.productionQtyDisplay }}</text>
							</view>
						</view>
						<view class="row-group">
							<view class="form-group">
								<text class="label">当前派工数量：</text>
								<text class="value-readonly">{{ editQtyForm.currentQtyDisplay }}</text>
							</view>
						</view>
						<view class="row-group">
							<view class="form-group">
								<text class="label">修改后：</text>
								<input
									v-model="editQtyForm.newQty"
									type="number"
									class="qty-input-inline"
								/>
							</view>
						</view>
						<view class="row-group">
							<view class="form-group full">
								<text class="label">修改原因：</text>
								<textarea
									v-model="editQtyForm.reason"
									class="remark-textarea"
									maxlength="500"
								/>
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="modal-footer">
					<button class="btn-cancel" @click="closeEditQtyModal">取消</button>
					<button class="btn-confirm" @click="confirmEditQty">提交</button>
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
			:workshopOptions="workshopTabOptions"
			:workshop="modalWorkshop"
			@update:workshop="onModalWorkshopChange"
		/>
		<!-- 导航栏（与派工页面一致：仅左侧返回 + 中间标题） -->
		<view class="header">
			<image src="/static/left-arrow.svg" @click="quit"></image>
			<view class="title">
				多对多派工查询
			</view>
			<view></view>
		</view>

		<!-- 车间：喷涂 / 组装；默认登录权限，派工等入口可 URL 覆盖 -->
		<view class="workshop-tabs">
			<view
				v-for="name in workshopTabOptions"
				:key="name"
				class="workshop-tab"
				:class="{ 'workshop-tab--active': workshop === name }"
				@click="selectWorkshop(name)"
			>
				<text class="workshop-tab-text">{{ name }}</text>
			</view>
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
			<view class="dispatchInquiry-item" v-for="item in dispatchInquiryList" :key="item.rowid || item.id">
				<view class="action-buttons">
					<button
						class="btn-transfer btn-edit-qty"
						@click="openEditQtyModal(item)"
					>修改数量</button>
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
						<!-- 第一行：产品名称、派工数量、工时（单行高度一致） -->
						<view class="info-row info-row-three">
							<view class="info-cell">
								<text class="cell-label">产品名称：</text>
								<text class="cell-value">{{ item.goodsName || '-' }}</text>
							</view>
							<view class="info-cell">
								<text class="cell-label">派工数量：</text>
								<text class="cell-value">{{ item.dispatchCount ?? '-' }}</text>
							</view>
							<view class="info-cell">
								<text class="cell-label">工时：</text>
								<text class="cell-value">{{ item.worktime ?? '-' }}</text>
							</view>
						</view>
						<!-- 第二行：完成数量、返工数量、废品数量 -->
						<view class="info-row info-row-three">
							<view class="info-cell">
								<text class="cell-label">完成数量：</text>
								<text class="cell-value">{{ item.finishCount ?? '-' }}</text>
							</view>
							<view class="info-cell">
								<text class="cell-label">返工数量：</text>
								<text class="cell-value">{{ item.reworkCount ?? '-' }}</text>
							</view>
							<view class="info-cell">
								<text class="cell-label">废品数量：</text>
								<text class="cell-value">{{ item.wasteCount ?? '-' }}</text>
							</view>
						</view>
						<!-- 第三行：工序、员工（可多行，单独一行避免撑乱上方面板） -->
						<view class="info-row info-row-process-worker">
							<view class="info-cell info-cell-block">
								<text class="cell-label">工序：</text>
								<text class="cell-value cell-value-multiline">{{ item.processName || '-' }}</text>
							</view>
							<view class="info-cell info-cell-block">
								<text class="cell-label">员工：</text>
								<text class="cell-value cell-value-multiline">{{ item.worker || '-' }}</text>
							</view>
						</view>
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
import {
	DISPATCH_INQUIRY_MORE_DELETE_URL,
	DISPATCH_TRANSFER_URL,
	DISPATCH_QTY_UPDATE_URL,
} from '../../utils/api'
import { useStatusBar } from '../../composables/useStatusBar'
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()

/** 本页仅喷涂、组装；默认优先登录权限，无 URL 时不用派工页带入车间 */
const workshopTabOptions = ref(['喷涂车间', '组装车间'])
const workshop = ref('组装车间')
const modalWorkshop = ref('')

const onModalWorkshopChange = (value) => {
	modalWorkshop.value = value || ''
	loadEmployees()
}

const selectWorkshop = (name) => {
	if (workshop.value === name) return
	workshop.value = name
	getDispatchInquiryList()
}

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

// 接口只按报工状态拉取；车间在前端筛。明道「车间」控件常为对象或 JSON 字符串，不能直接 === 比较
const WORKSHOP_FIELD = '69b295d13b5e707f84d705cf'

/** 从原始行解析车间展示文案 */
function cellWorkshopText(raw) {
	const v = raw[WORKSHOP_FIELD]
	if (v == null || v === '') return ''
	if (typeof v === 'string') {
		const t = v.trim()
		if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
			try {
				const p = JSON.parse(t)
				return cellWorkshopText({ ...raw, [WORKSHOP_FIELD]: p })
			} catch {
				return t
			}
		}
		return t
	}
	if (Array.isArray(v)) {
		const first = v[0]
		if (first && typeof first === 'object') {
			return String(first.name || first.text || first.value || first.fullname || '').trim()
		}
		return v.filter(Boolean).map((x) => (typeof x === 'string' ? x : '')).join('、').trim()
	}
	if (typeof v === 'object') {
		return String(v.name || v.text || v.value || v.label || v.title || '').trim()
	}
	return String(v).trim()
}

/** 与当前选中的「喷涂车间/组装车间」是否视为同一车间 */
function workshopMatchesRow(rowLabel, selected) {
	const b = String(selected || '').trim()
	if (!b) return true
	const a = String(rowLabel || '').trim()
	if (!a) return false
	if (a === b) return true
	const strip = (s) => s.replace(/车间$/, '').replace(/\s/g, '')
	if (strip(a) && strip(b) && strip(a) === strip(b)) return true
	return a.includes(b) || b.includes(a)
}

const getDispatchInquiryList = async () => {
  let res
  try {
    res = await callWorkflowListAPIPaged({
      worksheetId: 'dddpg',
      filters: [{
        controlId: '697b11b33b5e707f84cd938e',
        dataType: 30,
        spliceType: 1,
        filterType: 6,
        values: ['全部报工','已转派']
      }],
      pageSize: 100,
      pageNum: 1
    })
  } catch (e) {
    console.error('多对多派工列表请求失败:', e)
    dispatchInquiryList.value = []
    uni.showToast({ title: '加载失败', icon: 'none' })
    return
  }

  let rows = Array.isArray(res.data) ? res.data : []
  // 带报工状态筛时若 0 条，再试无筛选（明道选项值若变更会导致一直空）
  if (rows.length === 0) {
    try {
      const res2 = await callWorkflowListAPIPaged({
        worksheetId: 'dddpg',
        filters: [],
        pageSize: 100,
        pageNum: 1,
        silent: true
      })
      const r2 = Array.isArray(res2.data) ? res2.data : []
      if (r2.length) {
        rows = r2
        uni.showToast({ title: '已显示本页数据（报工条件无匹配时放宽）', icon: 'none' })
      }
    } catch (_) {
      /* 忽略 */
    }
  }

  const currentWs = String(workshop.value || '').trim()

  const hasWorkshopValues = rows.some((raw) => cellWorkshopText(raw))
  let filtered = rows
  if (currentWs && hasWorkshopValues) {
    filtered = rows.filter((raw) => workshopMatchesRow(cellWorkshopText(raw), currentWs))
  }
  // 有车间数据但筛完为空：多半是文案不一致，避免整页空白，退回全量并提示
  if (rows.length > 0 && filtered.length === 0 && hasWorkshopValues) {
    uni.showToast({ title: '车间未匹配到记录，已显示全部', icon: 'none' })
    filtered = rows
  }

  dispatchInquiryList.value = filtered
    .map(item => ({
    goodsName: item['698a94e23b5e707f84d090ba'],
    processName: item['69ad18473b5e707f84d42fb4'],
    date: item['698a9d193b5e707f84d0917c'],
    orderCode: item['69acec3a3b5e707f84d4266b'],
    productionOrder: item['69ad12213b5e707f84d42b28'],
    worker: (() => {
      let raw = item['69ace00c3b5e707f84d42211']
      if (typeof raw === 'string' && raw.trim()) {
        try {
          raw = JSON.parse(raw)
        } catch (e) {
          return raw
        }
      }
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(o => (o && o.fullname) != null ? o.fullname : '').filter(Boolean).join(',') || ''
      }
      return raw != null ? String(raw) : ''
    })(),
    dispatchCount: item['697b0e503b5e707f84cd912f'],
    finishCount: item['6980728c3b5e707f84ce90e4'],
    worktime: item['697c61173b5e707f84cdd7c1'],
	reworkCount: item['69c23c283b5e707f84da9bb9'],
	wasteCount: item['69c23c283b5e707f84da9bba'],
	rowid: item['rowid'],
	machineNumber: item['695c9af59223cfe3a0c02d5f'],
	mouldNumber: item['695c9b009223cfe3a0c02d66'],
	remainCount: item['6901c87f7a33416aedfd6bc4'],
	workshop: item['69b295d13b5e707f84d705cf'],
	status: item['697b11b33b5e707f84cd938e'],
	isRedeploy: item['695b7efca820885c2979af50'],
	isredeploy: item['695b7efca820885c2979af4f'],
	/** 生产数量（修改数量弹窗展示与上限校验，不在列表展示） */
	productionQty: item['697b0ff43b5e707f84cd922e'],
  }))
}

/** 解析生产数量上限；无效则返回 null（不做客户端上限） */
const parseProductionQtyCap = (v) => {
	if (v === undefined || v === null || v === '') return null
	const n = parseFloat(String(v).replace(/,/g, '').trim())
	return Number.isFinite(n) ? n : null
}

/** 弹窗内展示用：可解析为数字则用数字文案，否则尽量展示原始值 */
const formatProductionQtyDisplay = (raw) => {
	const cap = parseProductionQtyCap(raw)
	if (Number.isFinite(cap)) return String(cap)
	if (raw !== undefined && raw !== null && String(raw).trim() !== '') return String(raw).trim()
	return '-'
}

onLoad((options) => {
	const two = workshopTabOptions.value
	if (options?.workshop) {
		const w = decodeURIComponent(String(options.workshop)).trim()
		if (two.includes(w)) {
			workshop.value = w
		}
	} else {
		const lim = (userStore.loginLimits || '').trim()
		if (lim && two.includes(lim)) {
			workshop.value = lim
		}
	}
	getDispatchInquiryList()
})

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

/** 修改派工数量（多对多派工查询） */
const showEditQtyModal = ref(false)
const editQtyRowid = ref('')
const editQtyForm = ref({
	currentQtyDisplay: '',
	/** 提交接口用的原派工数量（可解析时为数字，否则为 null） */
	originalDispatchQuantity: null,
	/** 生产数量上限；可解析时修改后数量不可超过该值 */
	maxProductionQty: null,
	/** 生产数量（仅弹窗展示） */
	productionQtyDisplay: '-',
	newQty: '',
	reason: ''
})

const openEditQtyModal = (item) => {
	if (!item?.rowid) {
		uni.showToast({ title: '缺少单据标识', icon: 'none' })
		return
	}
	editQtyRowid.value = item.rowid
	const cur = item.dispatchCount
	const disp =
		cur === undefined || cur === null || cur === ''
			? '-'
			: String(cur)
	const origParsed = parseFloat(String(cur).replace(/,/g, ''))
	const originalDispatchQuantity =
		cur === undefined || cur === null || cur === '' || !Number.isFinite(origParsed)
			? null
			: origParsed
	editQtyForm.value = {
		currentQtyDisplay: disp,
		originalDispatchQuantity,
		maxProductionQty: parseProductionQtyCap(item.productionQty),
		productionQtyDisplay: formatProductionQtyDisplay(item.productionQty),
		newQty: '',
		reason: ''
	}
	showEditQtyModal.value = true
}

const closeEditQtyModal = () => {
	showEditQtyModal.value = false
	editQtyRowid.value = ''
	editQtyForm.value = {
		currentQtyDisplay: '',
		originalDispatchQuantity: null,
		maxProductionQty: null,
		productionQtyDisplay: '-',
		newQty: '',
		reason: ''
	}
}

const confirmEditQty = async () => {
	const reason = (editQtyForm.value.reason || '').trim()
	const rawNew = editQtyForm.value.newQty
	const newStr = rawNew === null || rawNew === undefined ? '' : String(rawNew).trim()
	if (newStr === '') {
		uni.showToast({ title: '请填写修改后的派工数量', icon: 'none' })
		return
	}
	if (reason === '') {
		uni.showToast({ title: '请填写修改原因', icon: 'none' })
		return
	}
	const n = parseFloat(newStr.replace(/,/g, ''))
	if (!Number.isFinite(n) || n < 0) {
		uni.showToast({ title: '修改后的派工数量无效', icon: 'none' })
		return
	}
	const cap = editQtyForm.value.maxProductionQty
	if (Number.isFinite(cap) && n > cap) {
		uni.showToast({
			title: `修改后数量不能超过生产数量（${cap}）`,
			icon: 'none'
		})
		return
	}
	if (!editQtyRowid.value) {
		uni.showToast({ title: '缺少单据标识', icon: 'none' })
		return
	}
	try {
		const result = await http.post(DISPATCH_QTY_UPDATE_URL, {
			dispatchBillType: '多对多派工',
			rowid: editQtyRowid.value,
			originalDispatchQuantity: editQtyForm.value.originalDispatchQuantity,
			newDispatchQuantity: n,
			reason,
			loginCode: userStore.loginCode || ''
		})
		if (result && result.status === 1) {
			uni.showToast({ title: result.msg || result.message || '修改失败', icon: 'none' })
			return
		}
		closeEditQtyModal()
		try {
			await getDispatchInquiryList()
		} catch (e) {
			console.error('修改数量后刷新列表失败:', e)
		}
		uni.showToast({ title: result?.msg || result?.message || '提交成功', icon: 'success' })
	} catch (error) {
		console.error('修改派工数量失败:', error)
		uni.showToast({ title: '修改失败：' + (error.message || '未知错误'), icon: 'none' })
	}
}

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
	const selectedWorkshop = modalWorkshop.value || workshop.value
	if (!selectedWorkshop) {
		uni.showToast({
			title: '缺少车间信息',
			icon: 'none'
		})
		return
	}
	
	try {
		const currentDate = getCurrentDate()
		console.log('多对多派工查询 - 获取员工列表 - 当前日期:', currentDate)
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'yggs',
			filters: [{
				"controlId": "696075d19223cfe3a0c169dc",
				"dataType": 30,
				"spliceType": 1,
				"filterType": 2,
				"values": [selectedWorkshop]
			}],
			pageSize: 100,
			pageNum: 1
		})
		
		if (res.data && res.data.length > 0) {
			const mappedEmployees = res.data.map(item => {
				const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
				const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
				
				return {
					id: item['6943bd902161a0fc58bad5ab'] || '',
					name: item['6938db8bda0981f67b352af3'] || '',
					position: item['6943bf332161a0fc58bad7a4'] || '',
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
				position: emp.position || '',
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

// 判断是否可以删除：与派工查询一致，仅「待报工」可删
const canDeleteDispatch = (item) => {
	return item.status === '待报工'
}

// 删除多对多派工单据（与派工查询页同一接口）
const handleDeleteDispatch = async (item) => {
	if (!canDeleteDispatch(item)) {
		uni.showToast({ title: '仅“待报工”状态可以删除', icon: 'none' })
		return
	}

	if (!item.rowid) {
		uni.showToast({ title: '缺少单据标识，无法删除', icon: 'none' })
		return
	}

	uni.showModal({
		title: '提示',
		content: '确定要删除该派工单据吗？',
		confirmText: '删除',
		cancelText: '取消',
		success: async (res) => {
			if (!res.confirm) return

			try {
				const result = await http.post(DISPATCH_INQUIRY_MORE_DELETE_URL, {
					rowid: item.rowid
				})

				if (result && result.status === 1) {
					uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
					return
				}

				uni.showToast({ title: result?.msg || '删除成功', icon: 'success' })
				dispatchInquiryList.value = dispatchInquiryList.value.filter(
					(row) => row.rowid !== item.rowid
				)
				setTimeout(() => {
					getDispatchInquiryList()
				}, 500)
			} catch (error) {
				console.error('删除派工失败:', error)
				uni.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' })
			}
		}
	})
}

// 打开转派模态框
const handleTransfer = (item) => {
	// 再次检查是否可以转派
	if (!canTransfer(item)) {
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

// 打开选择转派员工模态框（与派工「添加员工」一致：默认车间为喷涂时按组装拉员工）
const openSelectEmployeeModal = async () => {
	let w = modalWorkshop.value || workshop.value
	if (w === '喷涂车间') w = '组装车间'
	modalWorkshop.value = w
	await loadEmployees()
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
		const res = await http.post(DISPATCH_TRANSFER_URL, transferData.value)
		
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

	.workshop-tabs {
		display: flex;
		flex-wrap: nowrap;
		gap: px2vw(16px);
		padding: px2vw(16px) px2vw(20px);
		background-color: #fff;
		box-sizing: border-box;
		width: 100%;
	}

	.workshop-tab {
		flex: 1;
		min-width: 0;
		height: px2vw(72px);
		border: px2vw(2px) solid #5884f1;
		border-radius: px2vw(12px);
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.workshop-tab--active {
		background-color: #5884f1;
		border-color: #5884f1;
	}

	.workshop-tab-text {
		font-size: px2vw(28px);
		color: #333;
		text-align: center;
		line-height: 1.2;
	}

	.workshop-tab--active .workshop-tab-text {
		color: #fff;
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

			.btn-edit-qty {
				width: auto;
				min-width: unset;
				padding: 0 px2vw(12px);
				white-space: nowrap;
				flex-shrink: 0;
				border-color: #2e7d32;
				color: #2e7d32;
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
					padding-right: px2vw(165px);

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
					flex-direction: column;
					margin-top: px2vw(10px);
					gap: 0;

					.info-row {
						width: 100%;
						display: flex;
						flex-direction: row;
						align-items: flex-start;
						gap: px2vw(12px);
						margin-top: px2vw(12px);

						&:first-child {
							margin-top: 0;
						}
					}

					.info-row-three .info-cell {
						flex: 1;
						min-width: 0;
						display: flex;
						flex-direction: row;
						align-items: flex-start;
						font-size: px2vw(25px);
						line-height: 1.35;

						.cell-label {
							color: #666;
							flex-shrink: 0;
							white-space: nowrap;
						}

						.cell-value {
							flex: 1;
							min-width: 0;
							color: #333;
							word-break: break-all;
						}
					}

					.info-row-process-worker {
						margin-top: px2vw(12px);
						padding-top: px2vw(10px);
						border-top: px2vw(1px) solid #eee;
						align-items: flex-start;
						gap: px2vw(16px);

						.info-cell-block {
							flex: 1;
							min-width: 0;
							display: flex;
							flex-direction: column;
							align-items: flex-start;
							gap: px2vw(6px);
							font-size: px2vw(25px);

							.cell-label {
								color: #666;
								flex-shrink: 0;
							}

							.cell-value-multiline {
								width: 100%;
								color: #333;
								word-break: break-all;
								white-space: normal;
								line-height: 1.45;
							}
						}
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

			&.edit-qty-modal {
				width: 82%;
				max-width: px2vw(640px);
				max-height: 62vh;

				.modal-header {
					padding: px2vw(18px) px2vw(22px);

					.modal-title {
						font-size: px2vw(32px);
					}

					.modal-close {
						font-size: px2vw(44px);
					}
				}

				.modal-body {
					padding: px2vw(12px) px2vw(16px) px2vw(8px);
					gap: px2vw(8px);
				}

				.row-group {
					flex-direction: column;
					gap: 0;
				}

				.form-group {
					flex-direction: column;
					align-items: stretch;
					justify-content: flex-start;
					flex: none;
					width: 100%;
					gap: px2vw(6px);

					&.full {
						width: 100%;
					}

					.label {
						width: auto;
						white-space: normal;
					}

					.value-readonly,
					.qty-input-inline,
					.remark-textarea {
						width: 100%;
					}

					.remark-textarea {
						min-height: px2vw(100px);
					}
				}

				.modal-footer {
					padding: px2vw(16px) px2vw(22px);

					.btn-cancel,
					.btn-confirm {
						width: px2vw(160px);
						height: px2vw(62px);
						font-size: px2vw(28px);
					}
				}
			}
			
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

				.qty-input-inline {
					width: px2vw(400px);
					font-size: px2vw(30px);
					color: #333;
					padding: px2vw(8px) px2vw(12px);
					border: px2vw(1px) solid #eee;
					border-radius: px2vw(5px);
					background: #fff;
					min-height: px2vw(50px);
					box-sizing: border-box;
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
