<template>
	<view class="pre-dispatched-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBack"></image>
			<view class="title">预派工</view>
			<view></view>
		</view>

		<view class="main-content">
			<view class="left-panel">
				<view class="panel-title">产品列表({{ selectedProductIds.length }}/{{ productList.length }})</view>
				<scroll-view class="product-list" scroll-y>
					<view
						v-for="(product, idx) in productList"
						:key="product.rowid || ('product-' + idx)"
						class="product-item"
						:class="{ 'product-active': selectedProductIds.includes(product.rowid) }"
						@click="handleProductClick(product)"
						@longpress="handleLongPress(product)"
						@mousedown="onMouseDown(product)"
						@mouseup="onMouseUp"
						@mouseleave="onMouseUp"
					>
						<text class="product-index">{{ idx + 1 }}</text>
						<view class="product-info">
							<text class="product-order">{{ product.orderNo || '-' }}</text>
							<text class="product-name">{{ product.productNameNew || '-' }}</text>
						</view>
						<view class="product-btns">
							<text class="expand-btn" @click.stop="toggleExpand(product.rowid)">{{ expandedIds.includes(product.rowid) ? '▼' : '▲' }}</text>
							<view class="dispatch-icon" @click.stop="openDispatchModal(product)">
								<view class="dispatch-icon-line"></view>
								<view class="dispatch-icon-line"></view>
								<view class="dispatch-icon-line"></view>
							</view>
						</view>
						<view class="product-spec" v-if="expandedIds.includes(product.rowid)">
							<text v-if="product.thickness">{{ product.thickness }} |</text>
							<text v-if="product.guokouSpec">{{ product.guokouSpec }} |</text>
							<text v-if="product.guokouSizeSpec">{{ product.guokouSizeSpec }} |</text>
							<text v-if="product.craftSpec">{{ product.craftSpec }} |</text>
							<text v-if="product.paintSpec">{{ product.paintSpec }} |</text>
							<text v-if="product.polishSpec">{{ product.polishSpec }} |</text>
							<text v-if="product.materialSizeSpec">{{ product.materialSizeSpec }}</text>
						</view>
					</view>
					<view class="empty-wrap" v-if="!productList.length && !loadingProducts">
						<text class="empty-text">暂无产品</text>
					</view>
				</scroll-view>
			</view>

			<view class="right-panel" :class="{ 'employee-expanded': isEmployeeExpanded }">
			<view class="right-panel-top">
				<scroll-view class="process-list" scroll-y scroll-x>
						<view
							v-for="group in groupedProcessList"
							:key="group.productRowid"
							class="process-table-grid"
							:style="{ gridTemplateColumns: 'min-content min-content repeat(' + group.processes.length + ', min-content)' }"
						>
							<view class="grid-product-name" style="grid-row: 1 / span 6; grid-column: 1">
								{{ group.productName }}
							</view>
							<view class="grid-label-cell" style="grid-row: 1; grid-column: 2">选中</view>
							<view class="grid-label-cell" style="grid-row: 2; grid-column: 2">顺序</view>
							<view class="grid-label-cell" style="grid-row: 3; grid-column: 2">工序</view>
							<view class="grid-label-cell" style="grid-row: 4; grid-column: 2">订单数</view>
							<view class="grid-label-cell" style="grid-row: 5; grid-column: 2">日产量</view>
							<view class="grid-label-cell" style="grid-row: 6; grid-column: 2">派工数量</view>
							<template v-for="(p, idx) in group.processes" :key="p.rowid">
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 1, gridColumn: 3 + idx }">
								<checkbox :checked="selectedProcessIds.includes(p.rowid)" :disabled="!p.isAssociated" @click="toggleProcessSelection(p)" />
							</view>
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 2, gridColumn: 3 + idx }">{{ p.sequence || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 3, gridColumn: 3 + idx }">{{ p.processName || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 4, gridColumn: 3 + idx }">{{ p.orderCount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 5, gridColumn: 3 + idx }">{{ p.dailyOutput || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': p.isAssociated && selectedProcessIds.includes(p.rowid), 'disabled-column': !p.isAssociated }" :style="{ gridRow: 6, gridColumn: 3 + idx }">{{ productDispatchCounts[p.productRowid] || 0 }}</view>
						</template>
						</view>
						<view class="empty-wrap" v-if="!processList.length && !loadingProducts">
							<text class="empty-text">暂无工序</text>
						</view>
					</scroll-view>
				</view>
				<view class="right-panel-bottom">
				<view class="employee-expand-bar" @click="toggleEmployeeSection">
					<text class="employee-expand-icon">{{ isEmployeeExpanded ? '⛶' : '⛶' }}</text>
				</view>
				<view class="employee-summary">
					<view class="summary-item">
						<text class="summary-label">员工数量</text>
						<text class="summary-value">{{ employeeSummary.total }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">未派人员</text>
						<text class="summary-value">{{ employeeSummary.unassigned }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">未满人员</text>
						<text class="summary-value">{{ employeeSummary.incomplete }}</text>
					</view>
				</view>
				<scroll-view class="employee-chart-scroll" scroll-x>
					<view class="employee-chart">
						<view
							v-for="(emp, index) in employeeList"
							:key="emp.id"
							class="employee-column"
							:id="'emp-column-' + index"
							@click="openEmployeeTaskPopover(emp, index)"
						>
							<text class="emp-wage">{{ Number(emp.wage || 0).toFixed(2) }}</text>
							<view class="emp-bar-container">
								<view
									class="emp-bar-recorded"
									:style="{ height: emp.recordedHeight, backgroundColor: emp.recordedColor }"
								>
									<text v-if="emp.recordedHours >= 3" class="emp-hours">{{ emp.recordedHours }}</text>
								</view>
								<view
									class="emp-bar-unrecorded"
									:style="{ height: emp.unrecordedHeight }"
								></view>
							</view>
							<text class="emp-name">{{ emp.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
		</view>

		<view class="void-modal" v-if="showVoidModal" @click.self="closeVoidModal">
			<view class="void-modal-content">
				<view class="void-modal-title">作废确认</view>
				<input
					v-model="voidReason"
					type="text"
					placeholder="请输入作废原因"
					class="void-input"
				/>
				<view class="void-modal-buttons">
					<view class="void-btn-cancel" @click="closeVoidModal">取消</view>
					<view class="void-btn-confirm" @click="confirmVoid">确认</view>
				</view>
			</view>
		</view>

		<view class="confirm-dispatch-modal" v-if="showConfirmDispatchModal" @click.self="closeConfirmDispatchModal">
			<view class="confirm-dispatch-content">
				<view class="confirm-dispatch-title">确认派工</view>
				<view class="confirm-dispatch-body">
					<text class="confirm-dispatch-tip">确定要将 {{ confirmDispatchCount }} 条预派工转为正式派工吗？</text>
				</view>
				<view class="confirm-dispatch-buttons">
					<view class="confirm-dispatch-btn-cancel" @click="closeConfirmDispatchModal">取消</view>
					<view class="confirm-dispatch-btn-confirm" @click="doConfirmDispatch">确认</view>
				</view>
			</view>
		</view>

		<view class="edit-modal" v-if="showEditModal" @click.self="closeEditModal">
			<view class="edit-modal-content" @click.stop>
				<view class="edit-modal-title">预派工调整</view>
				<view class="edit-modal-body">
					<view class="edit-form">
						<view class="edit-row">
							<text class="edit-label">订单编号:</text>
							<text class="edit-value">{{ editData.orderNo || '-' }}</text>
						</view>
						<view class="edit-row">
							<text class="edit-label">产品名称:</text>
							<text class="edit-value">{{ editData.productNameNew || '-' }}</text>
						</view>
						<view class="edit-row">
							<text class="edit-label">工序:</text>
							<text class="edit-value">{{ editData.processDisplay || '-' }}</text>
						</view>
						<view class="edit-row">
							<text class="edit-label">派工日期:</text>
							<picker mode="date" :value="editData.dispatchDate" @change="onDispatchDateChange">
								<view class="edit-date-picker">
									<text class="edit-date-text">{{ editData.dispatchDate || '请选择日期' }}</text>
									<text class="edit-date-arrow">▼</text>
								</view>
							</picker>
						</view>
						<view class="edit-row">
							<text class="edit-label">派工数量:</text>
							<input
								v-model="editData.dispatchCount"
								type="number"
								class="edit-input"
								placeholder="请输入派工数量"
							/>
						</view>
						<view class="edit-row">
							<text class="edit-label">员工姓名:</text>
							<view class="edit-employee-tags">
								<view v-for="(name, idx) in editData.selectedEmployeeNames" :key="idx" class="employee-tag">{{ name }}</view>
								<view v-if="!editData.selectedEmployeeNames || editData.selectedEmployeeNames.length === 0" class="edit-employee-input" @click="openEmployeeSelector">
									<text class="edit-input-text">请选择员工</text>
									<text class="edit-input-arrow">▼</text>
								</view>
							</view>
							<view class="edit-employee-add-btn" @click="openEmployeeSelector">
								<text class="add-btn-text">+选择</text>
							</view>
						</view>
						<view class="edit-row">
							<text class="edit-label">工时:</text>
							<text class="edit-value">{{ editData.worktime || '-' }}</text>
						</view>
						<view class="edit-row">
							<text class="edit-label">工价:</text>
							<text class="edit-value">{{ editData.wage || '-' }}</text>
						</view>
					</view>
				</view>
				<view class="edit-modal-buttons">
					<view class="edit-btn-cancel" @click="closeEditModal">取消</view>
					<view class="edit-btn-confirm" @click="confirmEdit">确认</view>
				</view>
			</view>
		</view>

		<view class="employee-modal" :class="{ show: showEmployeeSelector }" @click.self="closeEmployeeSelector">
			<view class="employee-modal-content" @click.stop>
				<view class="employee-modal-header">
					<text class="employee-modal-title">选择员工</text>
					<view class="employee-modal-close" @click="closeEmployeeSelector">×</view>
				</view>
				<scroll-view scroll-y class="employee-modal-list">
					<view
						v-for="emp in allEmployeeOptions"
						:key="emp.id"
						class="employee-modal-item"
						:class="{ active: editData.selectedEmployeeIds.includes(emp.id) }"
						@click="toggleEmployee(emp)"
					>
						<view class="employee-modal-check">
							<text v-if="editData.selectedEmployeeIds.includes(emp.id)" class="check-icon">✓</text>
						</view>
						<view class="employee-modal-info">
							<text class="employee-modal-name">{{ emp.name }}</text>
							<text class="employee-modal-position">岗位: {{ emp.position || '-' }}</text>
							<text class="employee-modal-hours">未派工时: {{ emp.unrecordedHours || 0 }}h</text>
						</view>
					</view>
					<view class="employee-modal-empty" v-if="allEmployeeOptions.length === 0">
						<text>暂无员工</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<view class="dispatch-modal" v-if="showDispatchModal" @click.self="closeDispatchModal">
			<view class="dispatch-modal-content" @click.stop>
				<view class="dispatch-modal-title">派工设置</view>
				<view class="dispatch-modal-body">
					<view class="dispatch-grid">
						<view class="dispatch-grid-cell">
							<text class="grid-cell-label">订单数量</text>
							<text class="grid-cell-value">100</text>
						</view>
						<view class="dispatch-grid-cell">
							<text class="grid-cell-label">可派数量</text>
							<text class="grid-cell-value">50</text>
						</view>
						<view class="dispatch-grid-cell">
							<text class="grid-cell-label">完成数量</text>
							<text class="grid-cell-value">30</text>
						</view>
						<view class="dispatch-grid-cell">
							<text class="grid-cell-label">派工数量</text>
							<input
								v-model="dispatchModalInput"
								type="number"
								class="dispatch-input"
								placeholder="请输入"
							/>
						</view>
					</view>
				</view>
				<view class="dispatch-modal-buttons">
					<view class="dispatch-btn-cancel" @click="closeDispatchModal">取消</view>
					<view class="dispatch-btn-confirm" @click="saveDispatchModal">确认</view>
				</view>
			</view>
		</view>
		<view class="employee-task-popover" v-if="showEmployeeTaskPopover" @click="closeEmployeeTaskPopover">
			<view class="employee-task-content" :style="employeeTaskPopoverStyle" @click.stop>
				<view class="employee-task-arrow" :style="employeeTaskArrowStyle"></view>
				<view class="employee-task-list">
					<view class="employee-task-header">
						<text class="task-header-cell">订单编号</text>
						<text class="task-header-cell">产品名称</text>
						<text class="task-header-cell">派工数量</text>
					</view>
					<view
						class="employee-task-item"
						v-for="(task, idx) in selectedEmployeeForPopover?.tasks || []"
						:key="idx"
					>
						<text class="task-cell">{{ task.orderNo }}</text>
						<text class="task-cell">{{ task.productName }}</text>
						<text class="task-cell">{{ task.dispatchCount }}</text>
					</view>
					<view class="employee-task-empty" v-if="!(selectedEmployeeForPopover?.tasks || []).length">
						<text>暂无任务</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import http from '../../utils/request'
import { PRE_DISPATCH_VOID_URL, PRE_DISPATCH_UPDATE_URL, PRE_DISPATCH_CONFIRM_URL } from '../../utils/api'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const workshopOptions = ['拉伸车间', '喷涂车间', '抛光车间', '组装车间']

const loginWorkshop = computed(() => {
	const lim = (userStore.loginLimits || '').trim()
	return workshopOptions.includes(lim) ? lim : ''
})

const PRE_DISPATCH_WORKSHEET_ID = '6a1e468d27514927ff33cbae'
const PRE_DISPATCH_SUMMARY_WORKSHEET_ID = '6a3a172c6d70ffabc66e5d97'

const PRE_DISPATCH_FIELD_MAP = {
	orderNo: '6a1e47d727514927ff33cc45',
	pureOrderNo: '6a1fff8738176d619e00e008',
	productName: '6a1e47d727514927ff33cc47',
	productNameNew: '6a3a4b306d70ffabc66ec686',
	workshop: '6a1e4c1427514927ff33cda4',
	dispatchDate: '6a1e488327514927ff33cca9',
	dispatchCount: '6a1e47d727514927ff33cc4b',
	worktime: '6a1e489127514927ff33ccb7',
	wage: '6a3a17c56d70ffabc66e5e01',
	specification: '6a1e4a2327514927ff33cd1a',
	processName: '6a1e48b627514927ff33ccc0',
	employeeName: '6a1e48b627514927ff33ccc1',
	processDetail: '6a1e47d727514927ff33cc4c',
	craftPosition: '6a3a1e6b6d70ffabc66e6757',
	dailyWage: '6a1e47d727514927ff33cc4e',
	productionCode: '6a1fee4638176d619e00db16',
	thickness: '6a3deb356d70ffabc6702cfd',
	guokouSpec: '6a3deb356d70ffabc6702cfe',
	guokouSizeSpec: '6a3deb356d70ffabc6702cff',
	craftSpec: '6a3deb356d70ffabc6702d00',
	paintSpec: '6a3deb356d70ffabc6702d01',
	polishSpec: '6a3deb356d70ffabc6702d02',
	materialSizeSpec: '6a3debe76d70ffabc6702dbb',
}

const PRE_DISPATCH_SUMMARY_FIELD_MAP = {
	summaryNo: '6a3a20236d70ffabc66e6977',
	dailyWage: '6a3a20236d70ffabc66e6978',
	workshop: '6a3a36136d70ffabc66e87ce',
	dispatchDate: '6a3a20756d70ffabc66e69c5',
	totalWorktime: '6a3a20606d70ffabc66e69a7',
	totalWage: '6a3a20606d70ffabc66e69a8',
	preDispatch: '6a3a20236d70ffabc66e697c',
}

const DAILY_WAGE_WORKSHEET_ID = '692112b021066a9f124f5c9f'
const DAILY_WAGE_EMPLOYEE_NAME_FIELD = '6938db8bda0981f67b352af3'

const CRAFT_POSITION_WORKSHEET_ID = '6a276f516d70ffabc66285e7'
const CRAFT_POSITION_FIELD_ID = '6a276ffc6d70ffabc66285f8'

const filterOrderCode = ref('')
const filterProductName = ref('')
const filterCraft = ref('')
const filterInnerPaint = ref('')
const filterPolish = ref('')
const filterGuokou = ref('')
const filterDate = ref(getCurrentDate())

const productList = ref([])
const summaryList = ref([])
const loadingProducts = ref(false)
const loadingSummary = ref(false)
const loadingMore = ref(false)
const hasMoreSummary = ref(true)
const summaryPageNum = ref(1)
const SUMMARY_PAGE_SIZE = 20

const selectedProductIds = ref([])
const expandedIds = ref([])
const processList = ref([])
const loadedProductIds = ref([])
const selectedProcessIds = ref([])
const employeeList = ref([])

const productDispatchCounts = ref({})
const showDispatchModal = ref(false)
const dispatchModalProduct = ref(null)
const dispatchModalInput = ref('0')
const isEmployeeExpanded = ref(false)

const showEmployeeTaskPopover = ref(false)
const selectedEmployeeForPopover = ref(null)
const employeeTaskPopoverStyle = ref({})
const employeeTaskArrowStyle = ref({})
const instance = getCurrentInstance()

const employeeSummary = computed(() => {
	const total = employeeList.value.length
	const unassigned = employeeList.value.filter((e) => e.recordedHours === 0).length
	const incomplete = employeeList.value.filter((e) => e.recordedHours > 0 && e.recordedHours < MAX_EMPLOYEE_HOURS).length
	return { total, unassigned, incomplete }
})

const PROCESS_DETAIL_WORKSHEET_ID = 'paigongdan'
const PROCESS_DETAIL_FIELD_MAP = {
	sequence: '693a62040f64427fac25ae80',
	processName: '656ffd1bba5ef3863bf3ec1e',
	needCount: '690dc19f8d797ee211e7fc60',
	finishCount: '697c8b023b5e707f84ce02cc',
	allcount: '68099ac75d6fc47331574e82',
	dailyOutput: '69a96d623b5e707f84d380b6',
}

const EMPLOYEE_WORKSHEET_ID = 'yggs'
const EMPLOYEE_FIELD_MAP = {
	workshop: '696075d19223cfe3a0c169dc',
	dispatchDate: '69524e7b7a59e0522d855df6',
	recordedHours: '697dd01d3b5e707f84ce30c3',
	unrecordedHours: '697dd01d3b5e707f84ce30c4',
	totalHours: '6a4f304c6d70ffabc67913b8',
	wage: '6a4f304c6d70ffabc67913b9',
	employeeName: '6938db8bda0981f67b352af3',
}

const MAX_EMPLOYEE_HOURS = 11

const showVoidModal = ref(false)
const voidReason = ref('')
const voidRowid = ref('')

const showConfirmDispatchModal = ref(false)
const confirmDispatchCount = ref(0)
const confirmDispatchRowids = ref([])

const showEditModal = ref(false)
const editData = ref({
	rowid: '',
	orderNo: '',
	productNameNew: '',
	processDisplay: '',
	dispatchDate: '',
	dispatchCount: '',
	employeeName: '',
	employeeId: '',
	employeeNames: [],
	selectedEmployeeIds: [],
	selectedEmployeeNames: [],
	worktime: '',
	wage: ''
})
const showEmployeeSelector = ref(false)
const allEmployeeOptions = ref([])

const goBack = () => {
	uni.redirectTo({
		url: '/pages/main/main'
	})
}

const formatFieldValue = (v) => {
	if (v == null || v === '') return ''
	if (typeof v === 'string') {
		const t = v.trim()
		if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
			try {
				const p = JSON.parse(t)
				return formatFieldValue(p)
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

const extractRelationSids = (v) => {
	if (v == null || v === '') return []
	if (typeof v === 'string') {
		const t = v.trim()
		if (t.startsWith('[') && t.endsWith(']')) {
			try {
				const p = JSON.parse(t)
				return extractRelationSids(p)
			} catch {
				return []
			}
		}
		return []
	}
	if (Array.isArray(v)) {
		return v
			.filter(item => item != null)
			.map(item => {
				if (typeof item === 'string') return item.trim()
				if (typeof item === 'object' && item !== null) return item.sid || item.value || item.id || ''
				return ''
			})
			.filter(Boolean)
	}
	return []
}

const parseSpecification = (spec) => {
	if (!spec) return { craft: '', innerPaint: '', polish: '', guokou: '' }
	const result = { craft: '', innerPaint: '', polish: '', guokou: '' }
	const pairs = spec.split(';')
	for (const pair of pairs) {
		const idx = pair.indexOf(':')
		if (idx > 0) {
			const key = pair.substring(0, idx).trim().toLowerCase()
			const value = pair.substring(idx + 1).trim()
			if (key === '工艺') result.craft = value
			else if (key === '内涂料') result.innerPaint = value
			else if (key === '抛光') result.polish = value
			else if (key === '锅口') result.guokou = value
		}
	}
	return result
}

const formatSpecification = (v) => {
	const raw = formatFieldValue(v)
	if (!raw) return ''
	if (loginWorkshop.value && loginWorkshop.value !== '组装车间') {
		const idx = raw.indexOf('盖子')
		if (idx !== -1) {
			return raw.substring(0, idx).trim()
		}
	}
	return raw
}

const mapPreDispatchRow = (item) => ({
	rowid: item.rowid,
	orderNo: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.pureOrderNo]) || formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.orderNo]),
	productName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productName]),
	productNameNew: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productNameNew]),
	workshop: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.workshop]),
	dispatchDate: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchDate]),
	dispatchCount: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchCount]),
	worktime: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.worktime]),
	wage: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.wage]),
	specification: formatSpecification(item[PRE_DISPATCH_FIELD_MAP.specification]),
	processName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.processName]),
	employeeName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.employeeName]),
	processDetail: extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail]),
	craftPosition: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftPosition]),
	dailyWage: extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage]),
	productionCode: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productionCode]),
	...parseSpecification(item[PRE_DISPATCH_FIELD_MAP.specification]),
	thickness: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.thickness]),
	guokouSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.guokouSpec]),
	guokouSizeSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.guokouSizeSpec]),
	craftSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftSpec]),
	paintSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.paintSpec]),
	polishSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.polishSpec]),
	materialSizeSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.materialSizeSpec]),
})

const mapSummaryRow = (item) => ({
	rowid: item.rowid,
	summaryNo: formatFieldValue(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.summaryNo]),
	workshop: formatFieldValue(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.workshop]),
	dispatchDate: formatFieldValue(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.dispatchDate]),
	totalWorktime: formatFieldValue(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.totalWorktime]),
	totalWage: formatFieldValue(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.totalWage]),
	dailyWageRowids: extractRelationSids(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.dailyWage]),
	preDispatchRowids: extractRelationSids(item[PRE_DISPATCH_SUMMARY_FIELD_MAP.preDispatch]),
})

const handleSearch = () => {
	loadProducts(true)
	loadSummaries(true)
}

const handleReset = () => {
	filterOrderCode.value = ''
	filterProductName.value = ''
	filterCraft.value = ''
	filterInnerPaint.value = ''
	filterPolish.value = ''
	filterGuokou.value = ''
	filterDate.value = getCurrentDate()
	selectedProductIds.value = []
	processList.value = []
	loadedProductIds.value = []
	handleSearch()
}

const onDateChange = (e) => {
	filterDate.value = e.detail.value
	handleSearch()
}

const handleAddPreDispatch = () => {
	const workshop = loginWorkshop.value || '拉伸车间'
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?workshop=${encodeURIComponent(workshop)}&fromPreDispatch=1`
	})
}

const handleConfirmDispatch = () => {
	const rowids = productList.value
		.map(item => item.rowid)
		.filter(Boolean)
	if (rowids.length === 0) {
		uni.showToast({ title: '没有可确认的预派工', icon: 'none' })
		return
	}
	confirmDispatchCount.value = rowids.length
	confirmDispatchRowids.value = rowids
	showConfirmDispatchModal.value = true
}

const doConfirmDispatch = async () => {
	showConfirmDispatchModal.value = false
	try {
		uni.showLoading({ title: '确认中...' })
		const resp = await http.post(PRE_DISPATCH_CONFIRM_URL, {
			rowids: confirmDispatchRowids.value
		})
		uni.hideLoading()
		if (resp.status === 1) {
			uni.showToast({ title: '确认派工成功', icon: 'success' })
			handleSearch()
		} else {
			uni.showToast({ title: resp.message || '确认派工失败', icon: 'none' })
		}
	} catch (e) {
		uni.hideLoading()
		console.error('确认派工失败:', e)
		uni.showToast({ title: '确认派工失败', icon: 'none' })
	}
}

const handleRefresh = () => {
	handleSearch()
}

const loadProducts = async (reset = true) => {
	loadingProducts.value = true
	try {
		const filters = []
		filters.push({
			controlId: '6a1e49c427514927ff33ccf5',
			dataType: 11,
			spliceType: 1,
			filterType: 2,
			values: ['未派工']
		})
		if (loginWorkshop.value) {
			filters.push({
				controlId: '6a1e4c1427514927ff33cda4',
				dataType: 11,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		if (filterOrderCode.value.trim()) {
			filters.push({
				controlId: PRE_DISPATCH_FIELD_MAP.pureOrderNo,
				dataType: 11,
				spliceType: 1,
				filterType: 1,
				values: [filterOrderCode.value.trim()]
			})
		}
		if (filterProductName.value.trim()) {
			filters.push({
				controlId: PRE_DISPATCH_FIELD_MAP.productName,
				dataType: 11,
				spliceType: 1,
				filterType: 1,
				values: [filterProductName.value.trim()]
			})
		}

		const res = await callWorkflowListAPIPaged({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters,
			pageSize: 100,
			pageNum: 1,
			silent: !reset
		})

		let raw = Array.isArray(res?.data) ? res.data : []
		let mapped = raw.map(mapPreDispatchRow)

		if (filterDate.value) {
			mapped = mapped.filter(item => item.dispatchDate === filterDate.value)
		}

		if (filterCraft.value.trim()) {
			const keyword = filterCraft.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.craft.toLowerCase().includes(keyword))
		}
		if (filterInnerPaint.value.trim()) {
			const keyword = filterInnerPaint.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.innerPaint.toLowerCase().includes(keyword))
		}
		if (filterPolish.value.trim()) {
			const keyword = filterPolish.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.polish.toLowerCase().includes(keyword))
		}
		if (filterGuokou.value.trim()) {
			const keyword = filterGuokou.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.guokou.toLowerCase().includes(keyword))
		}

		productList.value = mapped
	} catch (e) {
		console.error('加载产品失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loadingProducts.value = false
	}
}

const loadSummaries = async (reset = true) => {
	const nextPage = reset ? 1 : summaryPageNum.value + 1
	loadingSummary.value = true
	if (!reset) loadingMore.value = true

	try {
		const filters = []
		if (loginWorkshop.value) {
			filters.push({
				controlId: PRE_DISPATCH_SUMMARY_FIELD_MAP.workshop,
				dataType: 11,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}

		const res = await callWorkflowListAPIPaged({
			worksheetId: PRE_DISPATCH_SUMMARY_WORKSHEET_ID,
			filters,
			pageSize: SUMMARY_PAGE_SIZE,
			pageNum: nextPage,
			silent: !reset
		})

		let raw = Array.isArray(res?.data) ? res.data : []
		let mapped = raw.map(mapSummaryRow)

		if (filterDate.value) {
			mapped = mapped.filter(item => item.dispatchDate === filterDate.value)
		}

		if (reset) {
			summaryList.value = mapped
		} else {
			summaryList.value = [...summaryList.value, ...mapped]
		}
		summaryPageNum.value = nextPage

		const total = typeof res?.total === 'number' ? res.total : 0
		if (total > 0) {
			const fetched = (nextPage - 1) * SUMMARY_PAGE_SIZE + raw.length
			hasMoreSummary.value = fetched < total
		} else {
			hasMoreSummary.value = raw.length >= SUMMARY_PAGE_SIZE
		}

		await loadSummariesRelationData()
	} catch (e) {
		console.error('加载汇总失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loadingSummary.value = false
		loadingMore.value = false
	}
}

const loadSummariesRelationData = async () => {
	const allPreDispatchRowids = []
	const allDailyWageRowids = []
	summaryList.value.forEach(summary => {
		if (summary.preDispatchRowids && summary.preDispatchRowids.length > 0) {
			allPreDispatchRowids.push(...summary.preDispatchRowids)
		}
		if (summary.dailyWageRowids && summary.dailyWageRowids.length > 0) {
			allDailyWageRowids.push(...summary.dailyWageRowids)
		}
	})

	const tasks = []

	if (allPreDispatchRowids.length > 0) {
		const uniqueRowids = [...new Set(allPreDispatchRowids)]
		tasks.push(
			callWorkflowListAPIPaged({
				worksheetId: PRE_DISPATCH_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					filterType: 2,
					values: uniqueRowids
				}],
				pageSize: 500,
				pageNum: 1,
				silent: true
			}).then(res => ({ type: 'preDispatch', data: res }))
		)
	}

	if (allDailyWageRowids.length > 0) {
		const uniqueRowids = [...new Set(allDailyWageRowids)]
		tasks.push(
			callWorkflowListAPIPaged({
				worksheetId: DAILY_WAGE_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					filterType: 2,
					values: uniqueRowids
				}],
				pageSize: 500,
				pageNum: 1,
				silent: true
			}).then(res => ({ type: 'dailyWage', data: res }))
		)
	}

	if (tasks.length === 0) return

	try {
		const results = await Promise.all(tasks)

		const preDispatchMap = {}
		const dailyWageMap = {}

		results.forEach(result => {
			if (result.type === 'preDispatch') {
				const dataList = Array.isArray(result.data?.data) ? result.data.data : []
				dataList.forEach(item => {
					if (item.rowid) {
						preDispatchMap[item.rowid] = mapPreDispatchRow(item)
					}
				})
			} else if (result.type === 'dailyWage') {
				const dataList = Array.isArray(result.data?.data) ? result.data.data : []
				dataList.forEach(item => {
					if (item.rowid) {
						dailyWageMap[item.rowid] = formatFieldValue(item[DAILY_WAGE_EMPLOYEE_NAME_FIELD])
					}
				})
			}
		})

		summaryList.value.forEach(summary => {
				if (summary.preDispatchRowids && summary.preDispatchRowids.length > 0) {
					const preDispatches = summary.preDispatchRowids
						.map(rowid => preDispatchMap[rowid])
						.filter(Boolean)
						.map(item => {
							const processDetailSids = Array.isArray(item.processDetail) ? item.processDetail : []
							const processDisplay = processDetailSids.length > 1
								? (item.craftPosition || '岗位工序匹配表')
								: (item.processName || '')
							return {
								...item,
								processDisplay
							}
						})

					summary.preDispatches = preDispatches
				}

				if (summary.dailyWageRowids && summary.dailyWageRowids.length > 0) {
					const employeeName = formatFieldValue(dailyWageMap[summary.dailyWageRowids[0]])
					summary.employeeNames = employeeName || '-'
				}
			})

			// 按预派工订单编号排序，让相同预派工数据的汇总排列在一起
			summaryList.value.sort((a, b) => {
				const aOrder = a.preDispatches?.[0]?.orderNo || ''
				const bOrder = b.preDispatches?.[0]?.orderNo || ''
				if (aOrder !== bOrder) return aOrder.localeCompare(bOrder)
				const aProduct = a.preDispatches?.[0]?.productNameNew || ''
				const bProduct = b.preDispatches?.[0]?.productNameNew || ''
				return aProduct.localeCompare(bProduct)
			})
		} catch (e) {
			console.error('加载汇总关联数据失败:', e)
		}
	}

const loadMoreSummary = () => {
	if (loadingMore.value || !hasMoreSummary.value) return
	loadSummaries(false)
}

const handleProductClick = (product) => {
	if (!product || !product.rowid) return
	const idx = selectedProductIds.value.indexOf(product.rowid)
	if (idx >= 0) {
		selectedProductIds.value.splice(idx, 1)
	} else {
		selectedProductIds.value.push(product.rowid)
		loadProductProcesses(product)
	}
}

const openDispatchModal = (product) => {
	if (!product || !product.rowid) return
	dispatchModalProduct.value = product
	dispatchModalInput.value = productDispatchCounts.value[product.rowid] || '0'
	showDispatchModal.value = true
}

const closeDispatchModal = () => {
	showDispatchModal.value = false
	dispatchModalProduct.value = null
	dispatchModalInput.value = '0'
}

const saveDispatchModal = () => {
	if (dispatchModalProduct.value) {
		productDispatchCounts.value[dispatchModalProduct.value.rowid] = dispatchModalInput.value
	}
	closeDispatchModal()
}

const loadAssociatedProcessDetailRowids = async (product) => {
	try {
		const res = await callWorkflowListAPIPaged({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: 'rowid',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [product.rowid]
			}],
			pageSize: 500,
			pageNum: 1,
			silent: true
		})
		const rows = Array.isArray(res?.data) ? res.data : []
		const rowids = new Set()
		rows.forEach((item) => {
			const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			sids.forEach((sid) => rowids.add(sid))
		})
		return rowids
	} catch (e) {
		console.error('加载关联工序失败:', e)
		return new Set()
	}
}

const loadProductProcesses = async (product) => {
	if (!product || !product.rowid || loadedProductIds.value.includes(product.rowid)) return
	const productionCode = product.productionCode
	if (!productionCode) return
	loadedProductIds.value.push(product.rowid)
	try {
		const associatedRowids = await loadAssociatedProcessDetailRowids(product)
		const filters = [{
			controlId: '691d6160535b29cbd5c6c0a9',
			dataType: 30,
			spliceType: 1,
			filterType: 1,
			values: [productionCode]
		}]
		if (loginWorkshop.value) {
			filters.push({
				controlId: '669a6cae2503723eec1b49bb',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: PROCESS_DETAIL_WORKSHEET_ID,
			filters,
			pageSize: 500,
			pageNum: 1,
			silent: true
		})
		const rows = Array.isArray(res?.data) ? res.data : []
		const newProcesses = rows.map((item) => ({
			rowid: item.rowid || '',
			productRowid: product.rowid,
			productName: product.productNameNew || product.productName || '-',
			sequence: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.sequence]),
			processName: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.processName]),
			orderCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.allcount]) || 0,
			dailyOutput: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.dailyOutput]) || 0,
			isAssociated: associatedRowids.has(item.rowid)
		})).sort((a, b) => (parseFloat(a.sequence) || 0) - (parseFloat(b.sequence) || 0))
		processList.value.push(...newProcesses)
	} catch (e) {
		console.error('加载工序失败:', e)
	}
}

const toggleProcessSelection = (process) => {
	if (!process.rowid) return
	if (!process.isAssociated) {
		uni.showToast({ title: '产品还未流转到该工序', icon: 'none' })
		return
	}
	const index = selectedProcessIds.value.indexOf(process.rowid)
	if (index > -1) {
		selectedProcessIds.value.splice(index, 1)
	} else {
		selectedProcessIds.value.push(process.rowid)
	}
}

const toggleExpand = (rowid) => {
	const index = expandedIds.value.indexOf(rowid)
	if (index > -1) {
		expandedIds.value.splice(index, 1)
	} else {
		expandedIds.value.push(rowid)
	}
}

const toggleEmployeeSection = () => {
	isEmployeeExpanded.value = !isEmployeeExpanded.value
}

const generateFakeEmployeeTasks = () => {
	const products = [
		{ orderNo: '317-001', productName: '24C款煎锅', dispatchCount: 50 },
		{ orderNo: '317-002', productName: '28C款煎锅', dispatchCount: 30 },
		{ orderNo: '318-001', productName: '30C款煎锅', dispatchCount: 20 },
		{ orderNo: '319-001', productName: '32C款煎锅', dispatchCount: 40 }
	]
	const count = Math.floor(Math.random() * 3) + 2
	return products.slice(0, count)
}

const openEmployeeTaskPopover = (emp, index) => {
	const tasks = generateFakeEmployeeTasks()
	selectedEmployeeForPopover.value = { ...emp, tasks }
	const query = uni.createSelectorQuery().in(instance)
	query.select('#emp-column-' + index).boundingClientRect((rect) => {
		if (rect) {
			const systemInfo = uni.getSystemInfoSync()
			const windowWidth = systemInfo.windowWidth
			const popoverWidth = 320
			const popoverHeight = 220
			const arrowGap = 16
			let left = rect.left + rect.width / 2 - popoverWidth / 2
			let top = rect.top - popoverHeight - arrowGap
			if (left < 10) left = 10
			if (left + popoverWidth > windowWidth - 10) left = windowWidth - popoverWidth - 10
			if (top < 10) top = rect.bottom + arrowGap
			employeeTaskPopoverStyle.value = { left: left + 'px', top: top + 'px' }
			employeeTaskArrowStyle.value = { left: (rect.left + rect.width / 2 - left - 8) + 'px' }
		}
		showEmployeeTaskPopover.value = true
	}).exec()
}

const closeEmployeeTaskPopover = () => {
	showEmployeeTaskPopover.value = false
	selectedEmployeeForPopover.value = null
	employeeTaskPopoverStyle.value = {}
	employeeTaskArrowStyle.value = {}
}

const groupedProcessList = computed(() => {
	const groups = {}
	processList.value.forEach((p) => {
		if (!selectedProductIds.value.includes(p.productRowid)) {
			return
		}
		if (!groups[p.productRowid]) {
			groups[p.productRowid] = {
				productRowid: p.productRowid,
				productName: p.productName,
				processes: []
			}
		}
		groups[p.productRowid].processes.push(p)
	})
	return Object.values(groups)
})

const loadWorkshopEmployees = async () => {
	try {
		const currentDate = filterDate.value
		const filters = []
		if (loginWorkshop.value) {
			filters.push({
				controlId: EMPLOYEE_FIELD_MAP.workshop,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: EMPLOYEE_WORKSHEET_ID,
			filters,
			pageSize: 500,
			pageNum: 1,
			silent: true
		})
		const rows = Array.isArray(res?.data) ? res.data : []
		const filtered = rows.filter((item) => formatFieldValue(item[EMPLOYEE_FIELD_MAP.dispatchDate]) === currentDate)
		const mapped = filtered.map((item, index) => {
			let recordedHours
			if (index === 0) {
				recordedHours = Math.round((Math.random() * 5 + 1) * 10) / 10
			} else if (index === 1) {
				recordedHours = MAX_EMPLOYEE_HOURS
			} else if (index === 2 || index === 3) {
				recordedHours = 0
			} else {
				recordedHours = Math.round(Math.random() * 11 * 10) / 10
			}
			const unrecordedHours = 0
			const totalHours = recordedHours + unrecordedHours
			const wage = Number((recordedHours / MAX_EMPLOYEE_HOURS) * 400).toFixed(2)
			return {
				id: item.rowid || '',
				name: formatFieldValue(item[EMPLOYEE_FIELD_MAP.employeeName]) || '-',
				recordedHours,
				unrecordedHours,
				totalHours,
				wage
			}
		})
		employeeList.value = mapped.map((e) => {
			let recordedHeight = (e.recordedHours / MAX_EMPLOYEE_HOURS) * 100
			let unrecordedHeight = (e.unrecordedHours / MAX_EMPLOYEE_HOURS) * 100
			if (recordedHeight + unrecordedHeight > 100) {
				const total = recordedHeight + unrecordedHeight
				recordedHeight = (recordedHeight / total) * 100
				unrecordedHeight = (unrecordedHeight / total) * 100
			}
			let recordedColor = '#e74c3c'
			if (e.recordedHours >= MAX_EMPLOYEE_HOURS) {
				recordedColor = '#27ae60'
			}
			return {
				...e,
				recordedHeight: recordedHeight + '%',
				unrecordedHeight: unrecordedHeight + '%',
				recordedColor
			}
		})
	} catch (e) {
		console.error('加载员工数据失败:', e)
		employeeList.value = []
	}
}

const handleItemClick = (item) => {
	const processDetailSids = Array.isArray(item.processDetail) ? item.processDetail : []
	const dailyWageSids = Array.isArray(item.dailyWage) ? item.dailyWage : []
	const params = {
		orderCode: item.orderNo || '',
		productionCode: item.productionCode || '',
		workshop: item.workshop || '',
		productName: item.productName || '',
		processDetailSids: processDetailSids.length > 0 ? JSON.stringify(processDetailSids) : '',
		dailyWageSids: dailyWageSids.length > 0 ? JSON.stringify(dailyWageSids) : '',
		dispatchDate: item.dispatchDate || '',
		dispatchCount: item.dispatchCount || '',
		fromPreDispatch: '1',
		prerowid: item.rowid || '',
	}
	const query = Object.entries(params)
		.filter(([_, v]) => v !== '')
		.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
		.join('&')
	uni.navigateTo({
		url: `/pages/dispatchWork/dispatchWork?${query}`
	})
}

const handleVoidClick = async (item) => {
	uni.showModal({
		title: '作废确认',
		placeholderText: '请输入作废原因',
		editable: true,
		success: async (res) => {
			if (res.confirm && res.content) {
				try {
					const resp = await http.post(PRE_DISPATCH_VOID_URL, {
						rowid: item.rowid,
						reason: res.content
					})
					if (resp.status === 1) {
						uni.showToast({ title: resp.message || resp.msg || '作废失败', icon: 'none' })
						return
					}
					uni.showToast({ title: '作废成功', icon: 'success' })
					loadProducts(true)
					loadSummaries(true)
				} catch (e) {
					console.error('作废失败:', e)
					uni.showToast({ title: '作废失败', icon: 'none' })
				}
			}
		}
	})
}

const handleLongPress = (product) => {
	showVoidModal.value = true
	voidReason.value = ''
	voidRowid.value = product.rowid || ''
}

let longPressTimer = null

const onMouseDown = (item) => {
	longPressTimer = setTimeout(() => {
		handleLongPress(item)
	}, 500)
}

const onMouseUp = () => {
	if (longPressTimer) {
		clearTimeout(longPressTimer)
		longPressTimer = null
	}
}

const closeVoidModal = () => {
	showVoidModal.value = false
	voidReason.value = ''
	voidRowid.value = ''
}

const closeConfirmDispatchModal = () => {
	showConfirmDispatchModal.value = false
	confirmDispatchCount.value = 0
	confirmDispatchRowids.value = []
}

const confirmVoid = async () => {
	if (!voidReason.value.trim()) {
		uni.showToast({ title: '请输入作废原因', icon: 'none' })
		return
	}
	if (!voidRowid.value) {
		uni.showToast({ title: '缺少记录ID', icon: 'none' })
		return
	}
	try {
		const resp = await http.post(PRE_DISPATCH_VOID_URL, {
			rowid: voidRowid.value,
			reason: voidReason.value.trim()
		})
		closeVoidModal()
		if (resp.status === 1) {
			uni.showToast({ title: resp.message || resp.msg || '作废失败', icon: 'none' })
			return
		}
		uni.showToast({ title: '作废成功', icon: 'success' })
		loadProducts(true)
		loadSummaries(true)
	} catch (e) {
		console.error('作废失败:', e)
		uni.showToast({ title: '作废失败', icon: 'none' })
	}
}

const handleCircleClick = async (item) => {
	editData.value = {
		rowid: item.rowid || '',
		orderNo: item.orderNo || '',
		productNameNew: item.productNameNew || '',
		processDisplay: item.processDisplay || '',
		dispatchDate: item.dispatchDate || '',
		dispatchCount: item.dispatchCount || '',
		employeeName: item.employeeName || '',
		employeeId: item.employeeId || '',
		employeeNames: [],
		selectedEmployeeIds: [],
		selectedEmployeeNames: [],
		worktime: item.worktime || '',
		wage: item.wage || ''
	}
	// 查询当日工资情况，获取员工姓名列表
	const dailyWageSids = Array.isArray(item.dailyWage) ? item.dailyWage : []
	if (dailyWageSids.length > 0) {
		try {
			const res = await callWorkflowListAPIPaged({
				worksheetId: DAILY_WAGE_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					filterType: 2,
					values: dailyWageSids
				}],
				pageSize: 100,
				pageNum: 1,
				silent: true
			})
			const dataList = Array.isArray(res?.data) ? res.data : []
			const names = dataList.map(record => formatFieldValue(record[DAILY_WAGE_EMPLOYEE_NAME_FIELD])).filter(Boolean)
			editData.value.employeeNames = names
		} catch (e) {
			console.error('加载当日工资员工姓名失败:', e)
		}
	}
	showEditModal.value = true
	// 加载员工列表并匹配当日工资员工进行预选
	await loadEmployeeOptions()
	const dailyNames = editData.value.employeeNames
	if (dailyNames.length > 0 && allEmployeeOptions.value.length > 0) {
		const matchedIds = []
		const matchedNames = []
		allEmployeeOptions.value.forEach(emp => {
			if (dailyNames.includes(emp.name)) {
				matchedIds.push(emp.id)
				matchedNames.push(emp.name)
			}
		})
		editData.value.selectedEmployeeIds = matchedIds
		editData.value.selectedEmployeeNames = matchedNames
	}
	// 自动打开员工列表
	showEmployeeSelector.value = true
}

const onDispatchDateChange = (e) => {
	editData.value.dispatchDate = e.detail.value
}

const closeEditModal = () => {
	showEditModal.value = false
	showEmployeeSelector.value = false
	editData.value = {
		rowid: '',
		orderNo: '',
		productNameNew: '',
		processDisplay: '',
		dispatchDate: '',
		dispatchCount: '',
		employeeName: '',
		employeeId: '',
		employeeNames: [],
		selectedEmployeeIds: [],
		selectedEmployeeNames: [],
		worktime: '',
		wage: ''
	}
}

const confirmEdit = async () => {
	if (!editData.value.rowid) {
		uni.showToast({ title: '缺少记录ID', icon: 'none' })
		return
	}
	if (!editData.value.selectedEmployeeIds || editData.value.selectedEmployeeIds.length === 0) {
		uni.showToast({ title: '请选择员工', icon: 'none' })
		return
	}
	try {
		const resp = await http.post(PRE_DISPATCH_UPDATE_URL, {
			rowid: editData.value.rowid,
			dispatchDate: editData.value.dispatchDate,
			dispatchCount: editData.value.dispatchCount,
			employeeIds: editData.value.selectedEmployeeIds,
			employeeNames: editData.value.selectedEmployeeNames
		})
		if (resp.status === 1) {
			uni.showToast({ title: resp.message || resp.msg || '更新失败', icon: 'none' })
			return
		}
		uni.showToast({ title: '更新成功', icon: 'success' })
		closeEditModal()
		loadProducts(true)
		loadSummaries(true)
	} catch (e) {
		console.error('更新预派工失败:', e)
		uni.showToast({ title: '更新失败', icon: 'none' })
	}
}

function getCurrentDate() {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getTomorrowDate() {
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	const year = tomorrow.getFullYear()
	const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
	const day = String(tomorrow.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const loadEmployeeOptions = async () => {
	try {
		const currentDate = filterDate.value
		const filters = [{
			controlId: '6943bd902161a0fc58bad5ab',
			dataType: 30,
			spliceType: 1,
			filterType: 8
		}]
		if (loginWorkshop.value) {
			filters.unshift({
				controlId: '696075d19223cfe3a0c169dc',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'yggs',
			filters,
			pageSize: 100,
			pageNum: 1
		})
		if (res.data && res.data.length > 0) {
			const mappedEmployees = res.data.map(item => {
				const dispatchWorkDate = item['69524e7b7a59e0522d855df6'] || ''
				const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
				const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
				return {
					id: item['6943bd902161a0fc58bad5ab'] || '',
					name: item['6938db8bda0981f67b352af3'] || '',
					position: item['6943bf332161a0fc58bad7a4'] || '',
					totalHours: totalHoursStr === '' ? 0 : parseFloat(totalHoursStr) || 0,
					unrecordedHours: unrecordedHoursStr === '' ? 0 : parseFloat(unrecordedHoursStr) || 0,
					dispatchWorkDate: dispatchWorkDate
				}
			})
			const filteredEmployees = mappedEmployees.filter(emp => emp.dispatchWorkDate === currentDate)
			allEmployeeOptions.value = filteredEmployees
		} else {
			allEmployeeOptions.value = []
		}
	} catch (error) {
		console.error('加载员工列表失败:', error)
		allEmployeeOptions.value = []
	}
}

const openEmployeeSelector = async () => {
	await loadEmployeeOptions()
	showEmployeeSelector.value = true
}

const closeEmployeeSelector = () => {
	showEmployeeSelector.value = false
}

const toggleEmployee = (emp) => {
	const ids = editData.value.selectedEmployeeIds
	const names = editData.value.selectedEmployeeNames
	const idx = ids.indexOf(emp.id)
	if (idx >= 0) {
		ids.splice(idx, 1)
		names.splice(idx, 1)
	} else {
		ids.push(emp.id)
		names.push(emp.name)
	}
	// sync single employee field (first selected)
	if (ids.length > 0) {
		editData.value.employeeId = ids[0]
		editData.value.employeeName = names[0]
	} else {
		editData.value.employeeId = ''
		editData.value.employeeName = ''
	}
}

onMounted(() => {
	loadProducts(true)
	loadSummaries(true)
	loadWorkshopEmployees()
})
</script>

<style scoped lang="scss">
.pre-dispatched-container {
	height: 100vh;
	width: 100vw;
	background-color: #f5f7fa;
	display: flex;
	flex-direction: column;

	.header {
		height: px2vw(70px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(40px);
			width: px2vw(40px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(28px);
			color: white;
			font-weight: bold;
		}
	}

	.search-box {
			background-color: #fff;
			padding: px2vw(8px) px2vw(10px);
			border-bottom: 1px solid #eee;
			flex-shrink: 0;

			.search-row {
				display: flex;
				gap: px2vw(10px);
				margin-bottom: px2vw(10px);

				&.search-row:first-of-type,
				&.search-row--spec {
					display: none;
				}

				&.search-row--date {
					margin-bottom: 0;
				}

				.search-input {
					flex: 1;
					height: px2vw(70px);
					background-color: #f5f7fa;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(24px);

					&.search-input--spec {
						height: px2vw(60px);
						font-size: px2vw(22px);
					}
				}

				.btn-reset,
				.btn-search {
					flex-shrink: 0;
					padding: 0 px2vw(24px);
					height: px2vw(70px);
					line-height: px2vw(70px);
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					text-align: center;
				}

				.btn-reset {
					background-color: #f5f7fa;
					color: #666;
				}

				.date-picker-wrapper {
					flex-shrink: 0;
				}

				.btn-group-right {
					flex: 1;
					display: flex;
					justify-content: flex-end;
					align-items: center;
					gap: px2vw(12px);
				}

				.date-picker {
					width: auto;
					min-width: px2vw(280px);
					height: px2vw(70px);
					background-color: #f5f7fa;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					display: flex;
					align-items: center;
					font-size: px2vw(28px);

					.date-label {
						color: #666;
						font-size: px2vw(28px);
					}

					.date-value {
						color: #333;
						font-size: px2vw(28px);
					}
				}

				.btn-add-pre {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #27ae60;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.btn-confirm-dispatch {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #3498db;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.btn-refresh {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #f39c12;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}

	.main-content {
		flex: 1;
		display: flex;
		overflow: hidden;
		height: 0;

		.left-panel {
			width: px2vw(460px);
			background-color: #fff;
			border-right: 1px solid #eee;
			display: flex;
			flex-direction: column;
			flex-shrink: 0;

			.panel-title {
				height: px2vw(60px);
				line-height: px2vw(60px);
				text-align: center;
				font-size: px2vw(26px);
				font-weight: bold;
				color: #333;
				background-color: #f5f7fa;
				border-bottom: 1px solid #eee;
				flex-shrink: 0;
			}

			.product-list {
				flex: 1;
				overflow: hidden;

				.product-item {
					padding: px2vw(12px);
					border-bottom: 1px solid #f0f0f0;
					display: flex;
					flex-direction: row;
					align-items: center;
					flex-wrap: wrap;

					&.product-active {
						background-color: #e8f4ff;
						border-left: px2vw(6px) solid #3498db;
					}

					.product-index {
						width: px2vw(36px);
						height: px2vw(36px);
						line-height: px2vw(36px);
						text-align: center;
						background-color: #3498db;
						color: #fff;
						border-radius: 50%;
						font-size: px2vw(20px);
						flex-shrink: 0;
					}

					.product-info {
						flex: 1;
						display: flex;
						flex-direction: row;
						align-items: center;
						margin-left: px2vw(10px);
						gap: px2vw(8px);
						min-width: 0;
					}

					.product-order {
						font-size: px2vw(22px);
						color: #333;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						flex-shrink: 0;
					}

					.product-name {
						font-size: px2vw(22px);
						color: #333;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						margin-right: px2vw(16px);
						margin-left: px2vw(16px);
						flex: 1;
						min-width: 0;
					}

					.product-btns {
						display: flex;
						flex-direction: row;
						align-items: center;
						flex-shrink: 0;
					}

					.expand-btn {
						font-size: px2vw(20px);
						color: #999;
						padding: px2vw(4px) px2vw(8px);
						flex-shrink: 0;
					}

					.dispatch-icon {
						width: px2vw(28px);
						height: px2vw(32px);
						border: 2px solid #999;
						border-radius: px2vw(4px);
						display: flex;
						flex-direction: column;
						justify-content: center;
						align-items: center;
						gap: px2vw(4px);
						margin-left: px2vw(12px);
						flex-shrink: 0;

						.dispatch-icon-line {
							width: px2vw(14px);
							height: px2vw(3px);
							background-color: #999;
							border-radius: px2vw(2px);
						}
					}

					.product-spec {
						width: 100%;
						font-size: px2vw(18px);
						color: #999;
						margin-top: px2vw(8px);
						margin-left: px2vw(46px);
					}
				}
			}
		}

		.right-panel {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;

			&.employee-expanded {
				.right-panel-top {
					flex: 0 0 0;
					border-bottom: none;
				}

				.right-panel-bottom {
					flex: 1;
					height: auto;
				}
			}

			.right-panel-top {
				flex: 1;
				overflow: hidden;
				border-bottom: 1px solid #eee;
			}

			.right-panel-bottom {
				height: px2vw(210px);
				overflow: hidden;
				display: flex;
				flex-direction: row;
				transition: height 0.3s ease;

				.employee-expand-bar {
					width: px2vw(40px);
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #f0f0f0;
					border-right: 1px solid #eee;
					flex-shrink: 0;

					.employee-expand-icon {
						font-size: px2vw(24px);
						color: #666;
					}
				}

				.employee-summary {
					width: px2vw(140px);
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: center;
					padding: px2vw(10px);
					border-right: 1px solid #eee;
					background-color: #f9f9f9;
					position: relative;

					.summary-item {
						display: flex;
						flex-direction: column;
						align-items: center;
						margin-bottom: px2vw(10px);

						.summary-label {
							font-size: px2vw(16px);
							color: #666;
							margin-bottom: px2vw(4px);
						}

						.summary-value {
							font-size: px2vw(22px);
							color: #333;
							font-weight: bold;
						}
					}
				}

				.employee-chart-scroll {
					flex: 1;
					height: 100%;
					overflow: hidden;
				}
			}

			.process-list {
				height: 100%;

				.process-table-grid {
					display: grid;
					width: fit-content;
					grid-template-rows: repeat(6, auto);
					margin: px2vw(10px);
					border: 1px solid #999;

					.grid-product-name {
						grid-row: 1 / span 6;
						display: flex;
						align-items: center;
						justify-content: center;
						writing-mode: vertical-rl;
						text-orientation: upright;
						background-color: #f0f0f0;
						padding: px2vw(10px);
						border-right: 1px solid #999;
						font-size: px2vw(20px);
						color: #333;
						white-space: nowrap;
					}

					.grid-label-cell {
						background-color: #f0f0f0;
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(17px);
						color: #333;
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						white-space: nowrap;
					}

					.grid-cell {
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(17px);
						color: #333;
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						display: flex;
						align-items: center;
						justify-content: center;
						white-space: nowrap;

						&.selected-column {
							background-color: #d4edda;
						}

						&.disabled-column {
							background-color: #f0f0f0;
							color: #999;
						}

						&:nth-last-child(-n+6) {
							border-right: none;
						}
					}
				}

				.empty-wrap {
					padding: px2vw(85px) 0;
					text-align: center;

					.empty-text {
						font-size: px2vw(24px);
						color: #aaa;
					}
				}
			}

			.employee-chart {
					height: 100%;
					display: inline-flex;
					flex-direction: row;
					align-items: flex-end;
					justify-content: flex-start;
					padding: px2vw(20px);

					.employee-column {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: flex-end;
						height: 100%;
						flex: 1;
						min-width: px2vw(80px);

						.emp-wage {
							font-size: px2vw(20px);
							color: #333;
							margin-bottom: px2vw(8px);
						}

						.emp-bar-container {
							width: px2vw(45px);
							flex: 1;
							background-color: #e0e0e0;
							border-radius: px2vw(4px);
							position: relative;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: flex-end;
							overflow: hidden;

							.emp-bar-recorded {
								width: 100%;
								display: flex;
								align-items: center;
								justify-content: center;

								.emp-hours {
									font-size: px2vw(16px);
									color: #333;
								}
							}

							.emp-bar-unrecorded {
								width: 100%;
								background-color: #bdbdbd;
								border-bottom-left-radius: px2vw(4px);
								border-bottom-right-radius: px2vw(4px);
							}
						}

						.emp-name {
							font-size: px2vw(18px);
							color: #333;
							margin-top: px2vw(8px);
							text-align: center;
						}
					}
				}
		}
	}
}

.employee-task-popover {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;

	.employee-task-content {
		position: absolute;
		width: 320px;
		min-height: 120px;
		background-color: #fff;
		border-radius: px2vw(12px);
		padding: px2vw(20px);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

		.employee-task-arrow {
			position: absolute;
			bottom: -10px;
			width: 0;
			height: 0;
			border-left: 10px solid transparent;
			border-right: 10px solid transparent;
			border-top: 10px solid #fff;
		}

		.employee-task-list {
			.employee-task-header {
				display: flex;
				flex-direction: row;
				padding: px2vw(10px) 0;
				border-bottom: 1px solid #eee;

				.task-header-cell {
					flex: 1;
					font-size: px2vw(20px);
					color: #666;
					text-align: center;
				}
			}

			.employee-task-item {
				display: flex;
				flex-direction: row;
				padding: px2vw(12px) 0;
				border-bottom: 1px solid #f0f0f0;

				.task-cell {
					flex: 1;
					font-size: px2vw(20px);
					color: #333;
					text-align: center;
				}
			}

			.employee-task-empty {
				padding: px2vw(30px) 0;
				text-align: center;
				font-size: px2vw(22px);
				color: #999;
			}
		}
	}
}

.void-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.void-modal-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
	}

	.void-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
	}

	.void-input {
		width: 100%;
		height: px2vw(80px);
		border: 1px solid #ddd;
		border-radius: px2vw(8px);
		padding: 0 px2vw(20px);
		font-size: px2vw(28px);
		box-sizing: border-box;
		margin-bottom: px2vw(30px);
	}

	.void-modal-buttons {
		display: flex;
		gap: px2vw(20px);

		.void-btn-cancel,
		.void-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.void-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.void-btn-confirm {
			background-color: #ff4d4f;
			color: #fff;
		}
	}
}

.dispatch-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.dispatch-modal-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
	}

	.dispatch-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
		color: #333;
	}

	.dispatch-modal-body {
		margin-bottom: px2vw(30px);

		.dispatch-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
			border: 1px solid #ddd;
			border-radius: px2vw(8px);
			overflow: hidden;

			.dispatch-grid-cell {
				padding: px2vw(20px);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				border-right: 1px solid #eee;
				border-bottom: 1px solid #eee;

				&:nth-child(2n) {
					border-right: none;
				}

				&:nth-child(3),
				&:nth-child(4) {
					border-bottom: none;
				}

				.grid-cell-label {
					font-size: px2vw(22px);
					color: #666;
					margin-bottom: px2vw(8px);
				}

				.grid-cell-value {
					font-size: px2vw(28px);
					color: #333;
					font-weight: bold;
				}

				.dispatch-input {
					width: 100%;
					height: px2vw(50px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(10px);
					font-size: px2vw(24px);
					box-sizing: border-box;
					text-align: center;
				}
			}
		}
	}

	.dispatch-modal-buttons {
		display: flex;
		gap: px2vw(20px);

		.dispatch-btn-cancel,
		.dispatch-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.dispatch-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.dispatch-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}
}

.confirm-dispatch-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.confirm-dispatch-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
	}

	.confirm-dispatch-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
	}

	.confirm-dispatch-body {
		margin-bottom: px2vw(30px);

		.confirm-dispatch-tip {
			font-size: px2vw(28px);
			color: #333;
			line-height: px2vw(40px);
		}
	}

	.confirm-dispatch-buttons {
		display: flex;
		gap: px2vw(20px);

		.confirm-dispatch-btn-cancel,
		.confirm-dispatch-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.confirm-dispatch-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.confirm-dispatch-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}
}

.edit-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.edit-modal-content {
		width: px2vw(1000px);
		max-height: px2vw(900px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.edit-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
		flex-shrink: 0;
	}

	.edit-modal-body {
		flex: 1;
		display: flex;
		gap: px2vw(30px);
		overflow: hidden;
	}

	.edit-form {
		flex: 1;
		overflow-y: auto;
	}

	.edit-row {
		display: flex;
		align-items: center;
		margin-bottom: px2vw(20px);

		.edit-label {
			width: px2vw(160px);
			font-size: px2vw(26px);
			color: #666;
			flex-shrink: 0;
			text-align: right;
			padding-right: px2vw(20px);
			box-sizing: border-box;
		}

		.edit-value {
			flex: 1;
			font-size: px2vw(26px);
			color: #333;
		}

		.edit-date-picker {
			flex: 1;
			height: px2vw(60px);
			border: 1px solid #ddd;
			border-radius: px2vw(8px);
			padding: 0 px2vw(16px);
			box-sizing: border-box;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background-color: #fafafa;

			.edit-date-text {
				font-size: px2vw(26px);
				color: #333;
			}

			.edit-date-arrow {
				font-size: px2vw(20px);
				color: #999;
			}
		}

		.edit-input {
					flex: 1;
					height: px2vw(60px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(26px);
					box-sizing: border-box;
				}

				.edit-employee-input {
					flex: 1;
					height: px2vw(60px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(26px);
					box-sizing: border-box;
					display: flex;
					align-items: center;
					justify-content: space-between;
					background-color: #fafafa;

					.edit-input-text {
						color: #333;
					}

					.edit-input-arrow {
						font-size: px2vw(20px);
						color: #999;
					}
				}

				.edit-employee-tags {
					flex: 1;
					display: flex;
					flex-wrap: wrap;
					gap: px2vw(10px);
					align-items: center;
				}

				.employee-tag {
					display: inline-flex;
					align-items: center;
					height: px2vw(48px);
					padding: 0 px2vw(18px);
					background-color: #e8f4ff;
					border: 1px solid #3498db;
					border-radius: px2vw(24px);
					font-size: px2vw(22px);
					color: #3498db;
					font-weight: 500;
				}

				.edit-employee-add-btn {
					flex-shrink: 0;
					width: px2vw(80px);
					height: px2vw(48px);
					margin-left: px2vw(12px);
					background-color: #3498db;
					border-radius: px2vw(8px);
					display: flex;
					align-items: center;
					justify-content: center;

					.add-btn-text {
						font-size: px2vw(22px);
						color: #fff;
						font-weight: 600;
					}
				}
			}

			.edit-modal-buttons {
		display: flex;
		gap: px2vw(20px);
		margin-top: px2vw(30px);
		flex-shrink: 0;

		.edit-btn-cancel,
		.edit-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.edit-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.edit-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}

	.edit-employee-list {
		width: px2vw(350px);
		flex-shrink: 0;
		border: 1px solid #eee;
		border-radius: px2vw(8px);
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.edit-employee-header {
			height: px2vw(60px);
			line-height: px2vw(60px);
			text-align: center;
			background-color: #f5f7fa;
			border-bottom: 1px solid #eee;
			flex-shrink: 0;

			.edit-employee-title {
				font-size: px2vw(26px);
				font-weight: bold;
				color: #333;
			}
		}

		.edit-employee-scroll {
			flex: 1;
			overflow-y: auto;
			max-height: px2vw(600px);

			.edit-employee-item {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				padding: px2vw(20px);
				border-bottom: 1px solid #f0f0f0;

				&.active {
					background-color: #e8f4ff;
				}

				.edit-employee-name {
					font-size: px2vw(26px);
					color: #333;
					font-weight: 600;
					margin-bottom: px2vw(8px);
				}

				.edit-employee-position {
					font-size: px2vw(22px);
					color: #666;
					margin-bottom: px2vw(4px);
				}

				.edit-employee-hours {
					font-size: px2vw(22px);
					color: #999;
				}
			}

			.edit-employee-empty {
				padding: px2vw(60px) 0;
				text-align: center;

				text {
					font-size: px2vw(24px);
					color: #999;
				}
			}
		}
	}
}

.employee-modal {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: px2vw(400px);
	background-color: #fff;
	box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
	z-index: 1001;
	transform: translateX(100%);
	transition: transform 0.3s ease;

	&.show {
		transform: translateX(0);
	}

	.employee-modal-content {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.employee-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: px2vw(30px);
		border-bottom: 1px solid #eee;
		flex-shrink: 0;

		.employee-modal-title {
			font-size: px2vw(28px);
			font-weight: bold;
			color: #333;
		}

		.employee-modal-close {
			font-size: px2vw(40px);
			color: #999;
			line-height: 1;
		}
	}

	.employee-modal-list {
		flex: 1;
		overflow-y: auto;
		padding: px2vw(16px);

		.employee-modal-item {
			display: flex;
			flex-direction: row;
			align-items: center;
			padding: px2vw(20px);
			border-bottom: 1px solid #f0f0f0;

			&.active {
				background-color: #e8f4ff;
			}

			.employee-modal-check {
				width: px2vw(48px);
				height: px2vw(48px);
				border: 2px solid #ddd;
				border-radius: px2vw(8px);
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				margin-right: px2vw(16px);

				.check-icon {
					font-size: px2vw(28px);
					color: #3498db;
					font-weight: bold;
				}
			}

			&.active .employee-modal-check {
				border-color: #3498db;
				background-color: #3498db;

				.check-icon {
					color: #fff;
				}
			}

			.employee-modal-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
			}

			.employee-modal-name {
				font-size: px2vw(28px);
				color: #333;
				font-weight: 600;
				margin-bottom: px2vw(8px);
			}

			.employee-modal-position {
				font-size: px2vw(22px);
				color: #666;
				margin-bottom: px2vw(4px);
			}

			.employee-modal-hours {
				font-size: px2vw(22px);
				color: #999;
			}
		}

		.employee-modal-empty {
			padding: px2vw(60px) 0;
			text-align: center;

			text {
				font-size: px2vw(24px);
				color: #999;
			}
		}
	}
}
</style>
