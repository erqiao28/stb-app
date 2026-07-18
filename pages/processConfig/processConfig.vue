<template>
	<view class="process-config-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBack"></image>
			<text class="header-title">工艺配置</text>
			<view></view>
		</view>

		<view class="main-content">
			<view class="left-panel" :class="{ 'collapsed': isLeftPanelCollapsed }">
				<view class="panel-title">
					<text v-if="!isLeftPanelCollapsed">产品列表({{ productList.length }})</text>
					<view class="collapse-btn" :class="{ 'collapsed': isLeftPanelCollapsed }" @click="toggleLeftPanel">
						<text>{{ isLeftPanelCollapsed ? '▶' : '◀' }}</text>
					</view>
				</view>
				<scroll-view class="product-list" scroll-y v-if="!isLeftPanelCollapsed">
					<view class="order-group" v-for="(group, gIdx) in groupedProductList" :key="group.orderNo">
						<view class="order-header" @click="toggleOrderCollapse(group.orderNo)">
						<text class="order-index">{{ chineseNumberMap[gIdx + 1] || (gIdx + 1) }}</text>
						<view class="order-header-main">
							<text class="order-no">{{ group.orderNo || '-' }}</text>
							<text class="order-delivery-date" v-if="group.orderDeliveryDate">{{ group.orderDeliveryDate }}</text>
						</view>
						<text class="order-count">({{ group.products.length }})</text>
					</view>
						<view class="order-products" v-show="!isOrderCollapsed(group.orderNo)">
							<view
								v-for="(product, idx) in group.products"
								:key="product.rowid || ('product-' + idx)"
								class="product-item"
								:class="{ 'product-active': selectedProductId === product.rowid }"
								@click="handleProductClick(product)"
							>
								<text class="product-index">{{ idx + 1 }}</text>
								<view class="product-info">
									<text class="product-name">{{ product.productName || '-' }}</text>
									<text class="product-exchange-date" v-if="product.productExchangeDate">{{ product.productExchangeDate }}</text>
								</view>
								<view class="product-btns">
									<text class="expand-btn" @click.stop="toggleExpand(product.rowid)">
										{{ expandedIds.includes(product.rowid) ? '▼' : '▲' }}
									</text>
								</view>
								<view class="product-spec" v-if="expandedIds.includes(product.rowid)">
									<view class="spec-row">
										<text class="spec-label">生产单号：</text>
										<text class="spec-value">{{ product.productionCode || '-' }}</text>
									</view>
									<view class="spec-row">
										<text class="spec-label">规格型号：</text>
										<text class="spec-value">{{ product.models || '-' }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
					<view class="empty-wrap" v-if="!productList.length && !loadingProducts">
						<text class="empty-text">暂无产品</text>
					</view>
				</scroll-view>
			</view>

			<view class="right-panel">
				<view class="right-placeholder" v-if="!selectedProductId">
					<text>请选择产品进行工艺配置</text>
				</view>
				<view class="process-chart-panel" v-else>
					<view class="chart-header">
						<text class="chart-title">工序配置</text>
						<text class="chart-subtitle">{{ selectedProductName || '-' }}</text>
						<view
							class="submit-btn"
							:class="{ 'disabled': !selectedProductId || selectedLevel3Sequence.length === 0 || isSubmitting }"
							@click="submitProcessConfig"
						>
							<text v-if="isSubmitting">提交中...</text>
							<text v-else>配置完成</text>
						</view>
					</view>
					<scroll-view class="process-chart-scroll" scroll-y scroll-x>
						<view v-if="!level2List.length" class="chart-empty">
							<text>暂无工序数据</text>
						</view>
						<view v-else class="chart-levels">
						<!-- 二级工序容器 -->
						<view class="level2-row">
							<view class="level2-column" v-for="node in level2List" :key="node.rowid">
								<view
									:id="'level2-' + node.rowid"
									class="chart-bar"
									:class="{ 'active': selectedLevel2Id === node.rowid }"
									@click="selectLevel2(node.rowid)"
								>
									<text class="chart-bar-name">{{ node.name || '-' }}</text>
								</view>
							</view>
						</view>

						<!-- 连接线层 -->
						<view class="connector-layer">
							<view
								class="connector-line"
								:class="line.type"
								v-for="(line, idx) in connectorLines"
								:key="idx"
								:style="{
									left: line.left + 'px',
									top: line.top + 'px',
									width: line.type === 'horizontal' ? line.width + 'px' : '1px',
									height: line.type === 'vertical' ? line.height + 'px' : '1px'
								}"
							></view>
						</view>

						<!-- 三级工序容器 -->
						<view class="level3-row" v-if="selectedLevel2Id && selectedLevel2Children.length">
							<view class="level3-column" v-for="child in selectedLevel2Children" :key="child.rowid">
								<view
									:id="'level3-' + child.rowid"
									class="chart-bar level3"
									:class="{ 'active': selectedLevel3Id === child.rowid, 'selected': selectedLevel3Set.has(child.rowid) }"
									@click.stop="selectLevel3(child.rowid)"
								>
									<view class="selected-marker" v-if="selectedLevel3Set.has(child.rowid)"></view>
									<text class="chart-bar-name">{{ child.name || '-' }}</text>
								</view>

								<!-- 四级工序 -->
								<view class="children-wrapper" v-if="selectedLevel3Id === child.rowid && child.children.length">
									<view class="connector-vertical"></view>
									<view class="children-row">
										<view class="child-column" v-for="leaf in child.children" :key="leaf.rowid">
											<view class="connector-vertical-short"></view>
											<view class="chart-bar level4">
												<text class="chart-bar-name">{{ leaf.name || '-' }}</text>
											</view>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
					</scroll-view>

					<!-- 已选工序栏 -->
					<view class="selected-process-panel" v-if="selectedLevel3Sequence.length">
						<view class="selected-process-title">已选工序</view>
						<scroll-view class="selected-process-scroll" scroll-x>
							<view class="selected-process-list">
								<view
									class="selected-process-item"
									v-for="(process, idx) in selectedLevel3Processes"
									:key="process.rowid"
								>
									<view class="selected-process-index">{{ idx + 1 }}</view>
									<view
										class="chart-bar selected"
										@click="removeSelectedLevel3(process.rowid)"
									>
										<text class="chart-bar-name">{{ process.name || '-' }}</text>
									</view>
								</view>
							</view>
						</scroll-view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import http from '../../utils/request'
import { PROCESS_CONFIG_COMPLETE_URL } from '../../utils/api'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const workshopOptions = ['拉伸车间', '喷涂车间', '抛光车间', '组装车间']
const loginWorkshop = computed(() => {
	const lim = (userStore.loginLimits || '').trim()
	return workshopOptions.includes(lim) ? lim : ''
})

// 产品管理工作表
const PRODUCT_WORKSHEET_ID = '68f6f149c729de3f57a0a354'
const PRODUCT_FIELD_MAP = {
	orderNo: '6a576ae26d70ffabc67c0b64',
	productName: '6937d219ff2b019b3cb34bc5',
	productionCode: '6a576dc76d70ffabc67c0b6b',
	models: '6937d219ff2b019b3cb34bc6',
	productOrder: '69214b0d21066a9f124f6b1b',
	orderStatus: '69a7dec43b5e707f84d2f3d4',
	auditStatus: '675fd061d12dcb2ce0aa8b4a',
	configStatus: '690edc630c0cc1d669a4e773',
	productionStatus: '6968eb149223cfe3a0c3ad86',
	craftBill: '66976f982503723eec1b00ea',
	orderDeliveryDate: '6a58683d6d70ffabc67c630f',
	productExchangeDate: '69808f5d3b5e707f84ce9841'
}

// 下拉选项 key（根据字段对照表）
const DROPDOWN_KEYS = {
	auditStatus: {
		locked: '613ced72-ceb0-4caa-9e1b-b28f7972a3ca'  // 已锁定
	},
	configStatus: {
		pending: 'cb755fdb-ffe0-48c4-9d94-e0b80fdf12d3',  // 待配置
		configured: 'afea38f8-9200-44d8-b1f1-a9321de965bb'  // 已配置
	}
}

// 工艺单工作表
const CRAFT_BILL_WORKSHEET_ID = '68f6f149c729de3f57a0a352'
const CRAFT_BILL_FIELD_MAP = {
	stretch: '6a5768e56d70ffabc67c0b48',
	spray: '6a57690f6d70ffabc67c0b4f',
	polish: '6a57690f6d70ffabc67c0b50',
	assembly: '6a57690f6d70ffabc67c0b51'
}

// 工序数据字典工作表
const PROCESS_DICT_WORKSHEET_ID = 'shujuzidian'
const PROCESS_DICT_FIELD_MAP = {
	dictType: '6614d7ed1f7f1264f3a332c3',
	level: '66b07c4a965ba588586ec783',
	workshop: '691e8522d50c894e2e798d03',
	isNewProcess: '6a324e7d6d70ffabc66cbe5f',
	parentProcess: 'Parent',
	childProcess: '6615e817fc700a214e1c2466',
	name: 'Name'
}

// 工序层级下拉选项 key
const LEVEL_KEYS = {
	level1: '1b5ce0ee-dbfd-4715-9b39-b7b52e3716d6',
	level2: '227b0b2b-6998-4962-bdc2-741c24a77d7f',
	level3: '93634f73-16cb-4231-9a8f-282ab0d91544',
	level4: 'c3b9855b-1356-40fe-b6cb-7a1e25187592'
}

const productList = ref([])
const loadingProducts = ref(false)
const selectedProductId = ref('')
const expandedIds = ref([])
const collapsedOrderIds = ref([])
const isLeftPanelCollapsed = ref(false)

const processDictList = ref([])
const processTree = ref([])
const expandedTreeIds = ref([])

const chineseNumberMap = {
	1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
	6: '六', 7: '七', 8: '八', 9: '九', 10: '十'
}

const goBack = () => {
	uni.navigateBack()
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
		return [t]
	}
	if (Array.isArray(v)) {
		return v.flatMap((item) => {
			if (typeof item === 'string') return item
			if (item && typeof item === 'object') return item.sid || item.rowid || item.id || ''
			return ''
		}).filter(Boolean)
	}
	if (typeof v === 'object') {
		return [v.sid || v.rowid || v.id || ''].filter(Boolean)
	}
	return []
}

const extractRelationList = (v) => {
	if (v == null || v === '') return []
	let list = []
	if (typeof v === 'string') {
		const t = v.trim()
		if (t.startsWith('[') && t.endsWith(']')) {
			try {
				list = JSON.parse(t)
			} catch {
				return []
			}
		} else {
			return [{ sid: t, name: '' }]
		}
	} else if (Array.isArray(v)) {
		list = v
	} else if (typeof v === 'object') {
		list = [v]
	}
	return list.map((item) => {
		if (typeof item === 'string') return { sid: item, name: '' }
		return {
			sid: item.sid || item.rowid || item.id || '',
			name: item.name || item.text || item.value || item.label || item.title || ''
		}
	}).filter(item => item.sid)
}

const parseNumber = (v) => {
	if (v == null || v === '') return 0
	if (typeof v === 'number') return v
	const n = parseFloat(String(v).trim())
	return isNaN(n) ? 0 : n
}

// 获取当前车间对应的工艺单工序数量字段
const getCraftBillQtyField = () => {
	const ws = loginWorkshop.value
	if (ws === '拉伸车间') return CRAFT_BILL_FIELD_MAP.stretch
	if (ws === '喷涂车间') return CRAFT_BILL_FIELD_MAP.spray
	if (ws === '抛光车间') return CRAFT_BILL_FIELD_MAP.polish
	if (ws === '组装车间') return CRAFT_BILL_FIELD_MAP.assembly
	return ''
}

// 工艺单数量缓存，避免重复查询
const craftBillQtyCache = new Map()

// 根据工艺单工序数量进行二次筛选（支持缓存）
const filterByCraftBill = async (products) => {
	// 1. 工艺单字段为空的产品直接保留
	const emptyProducts = products.filter(p => !p.craftBillSids || p.craftBillSids.length === 0)
	const hasBillProducts = products.filter(p => p.craftBillSids && p.craftBillSids.length > 0)
	
	if (hasBillProducts.length === 0) {
		return emptyProducts
	}
	
	// 2. 收集未缓存的工艺单 rowid
	const qtyField = getCraftBillQtyField()
	if (!qtyField) {
		return emptyProducts
	}
	
	const uncachedSids = [...new Set(hasBillProducts.flatMap(p => p.craftBillSids))].filter(sid => !craftBillQtyCache.has(sid))
	
	// 3. 查询未缓存的工艺单
	if (uncachedSids.length > 0) {
		try {
			const res = await callWorkflowListAPIPaged({
				worksheetId: CRAFT_BILL_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: uncachedSids
				}],
				pageSize: 100,
				pageNum: 1,
				silent: true
			})
			const rows = Array.isArray(res?.data) ? res.data : []
			rows.forEach(item => {
				if (item.rowid) {
					craftBillQtyCache.set(item.rowid, parseNumber(item[qtyField]))
				}
			})
			// 未查询到的也缓存为 null，避免重复查询
			uncachedSids.forEach(sid => {
				if (!craftBillQtyCache.has(sid)) {
					craftBillQtyCache.set(sid, null)
				}
			})
		} catch (e) {
			console.error('查询工艺单失败:', e)
		}
	}
	
	// 4. 判断每个产品的工艺单工序数量是否等于0
	const zeroQtyProducts = hasBillProducts.filter(p => {
		return p.craftBillSids.some(sid => craftBillQtyCache.get(sid) === 0)
	})
	
	return [...emptyProducts, ...zeroQtyProducts]
}

// 加载产品列表（分页循环：每次100条，筛选后追加，直到获取不到数据）
const loadProducts = async () => {
	loadingProducts.value = true
	productList.value = []
	craftBillQtyCache.clear()
	
	try {
		let pageNum = 1
		const pageSize = 100
		let hasMore = true
		
		while (hasMore) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: PRODUCT_WORKSHEET_ID,
				filters: [
					{
						controlId: PRODUCT_FIELD_MAP.productOrder,
						dataType: 29,
						spliceType: 1,
						filterType: 8
					},
					{
						controlId: PRODUCT_FIELD_MAP.orderStatus,
						dataType: 30,
						spliceType: 1,
						filterType: 2,
						values: ['审批通过']
					},
					{
						controlId: PRODUCT_FIELD_MAP.auditStatus,
						dataType: 11,
						spliceType: 1,
						filterType: 2,
						values: [DROPDOWN_KEYS.auditStatus.locked]
					},
					{
						controlId: PRODUCT_FIELD_MAP.configStatus,
						dataType: 11,
						spliceType: 1,
						filterType: 6,
						values: [DROPDOWN_KEYS.configStatus.configured]
					},
					{
						controlId: PRODUCT_FIELD_MAP.productionStatus,
						dataType: 30,
						spliceType: 1,
						filterType: 6,
						values: ['已全部出库']
					}
				],
				pageSize,
				pageNum,
				silent: pageNum > 1
			})
			
			const rows = Array.isArray(res?.data) ? res.data : []
			const mapped = rows.map(item => ({
				rowid: item.rowid || '',
				orderNo: formatFieldValue(item[PRODUCT_FIELD_MAP.orderNo]) || '',
				productName: formatFieldValue(item[PRODUCT_FIELD_MAP.productName]) || '',
				productionCode: formatFieldValue(item[PRODUCT_FIELD_MAP.productionCode]) || '',
				models: formatFieldValue(item[PRODUCT_FIELD_MAP.models]) || '',
				orderDeliveryDate: formatFieldValue(item[PRODUCT_FIELD_MAP.orderDeliveryDate]) || '',
				productExchangeDate: formatFieldValue(item[PRODUCT_FIELD_MAP.productExchangeDate]) || '',
				craftBillSids: extractRelationSids(item[PRODUCT_FIELD_MAP.craftBill])
			}))
			
			// 前端二次筛选并追加
			const filtered = await filterByCraftBill(mapped)
			productList.value.push(...filtered)
			
			// 判断是否有更多数据
			hasMore = rows.length >= pageSize
			pageNum++
		}
		
		// 默认收起所有订单分组
		collapseAllOrders()
	} catch (e) {
		console.error('加载产品列表失败:', e)
		uni.showToast({ title: '加载产品列表失败', icon: 'none' })
	} finally {
		loadingProducts.value = false
	}
}

const collapseAllOrders = () => {
	collapsedOrderIds.value = [...new Set(productList.value.map(p => p.orderNo).filter(Boolean))]
}

// 按订单编号分组，并按订单交货日期升序排列
const groupedProductList = computed(() => {
	const groups = {}
	productList.value.forEach(product => {
		const orderNo = product.orderNo || '未分类'
		if (!groups[orderNo]) {
			groups[orderNo] = {
				orderNo,
				orderDeliveryDate: product.orderDeliveryDate || '',
				products: []
			}
		}
		groups[orderNo].products.push(product)
	})
	return Object.values(groups).sort((a, b) => {
		if (!a.orderDeliveryDate) return 1
		if (!b.orderDeliveryDate) return -1
		return a.orderDeliveryDate.localeCompare(b.orderDeliveryDate)
	})
})

const toggleOrderCollapse = (orderNo) => {
	const idx = collapsedOrderIds.value.indexOf(orderNo)
	if (idx >= 0) {
		collapsedOrderIds.value.splice(idx, 1)
	} else {
		collapsedOrderIds.value.push(orderNo)
	}
}

const isOrderCollapsed = (orderNo) => {
	return collapsedOrderIds.value.includes(orderNo)
}

const toggleExpand = (rowid) => {
	const idx = expandedIds.value.indexOf(rowid)
	if (idx >= 0) {
		expandedIds.value.splice(idx, 1)
	} else {
		expandedIds.value.push(rowid)
	}
}

const selectedProductName = computed(() => {
	const product = productList.value.find(p => p.rowid === selectedProductId.value)
	return product ? product.productName : ''
})

const handleProductClick = (product) => {
	selectedProductId.value = product.rowid
	selectedLevel2Id.value = ''
	selectedLevel3Id.value = ''
	selectedLevel3Sequence.value = []
	connectorLines.value = []
	loadProcessTree()
}

const toggleLeftPanel = () => {
	isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value
}

// 加载工序数据字典并构建工序树
const loadProcessTree = async () => {
	try {
		const res = await callWorkflowListAPIPaged({
			worksheetId: PROCESS_DICT_WORKSHEET_ID,
			filters: [
				{
					controlId: PROCESS_DICT_FIELD_MAP.dictType,
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['工序']
				},
				{
					controlId: PROCESS_DICT_FIELD_MAP.workshop,
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [loginWorkshop.value]
				},
				{
					controlId: PROCESS_DICT_FIELD_MAP.isNewProcess,
					dataType: 36,
					spliceType: 1,
					filterType: 2,
					values: [1]
				}
			],
			pageSize: 500,
			pageNum: 1,
			silent: true
		})
		const rows = Array.isArray(res?.data) ? res.data : []
		processDictList.value = rows.map(item => ({
			rowid: item.rowid || '',
			name: formatFieldValue(item[PROCESS_DICT_FIELD_MAP.name]) || '',
			level: formatFieldValue(item[PROCESS_DICT_FIELD_MAP.level]) || '',
			workshop: formatFieldValue(item[PROCESS_DICT_FIELD_MAP.workshop]) || '',
			parentProcessSids: extractRelationSids(item[PROCESS_DICT_FIELD_MAP.parentProcess]),
			parentProcessList: extractRelationList(item[PROCESS_DICT_FIELD_MAP.parentProcess]),
			childProcessSids: extractRelationSids(item[PROCESS_DICT_FIELD_MAP.childProcess])
		}))
		
		// 构建工序树：二级工序 -> 三级工序 -> 四级工序
		processTree.value = buildProcessTree(processDictList.value)
		
		// 默认展开二级工序
		expandedTreeIds.value = processTree.value.map(node => node.rowid)
		
		// 如果当前选中的二级工序仍有效，重绘连接线
		updateConnectors()
	} catch (e) {
		console.error('加载工序数据失败:', e)
		uni.showToast({ title: '加载工序数据失败', icon: 'none' })
	}
}

// 构建工序树
const getProcessLevel = (levelStr) => {
	if (!levelStr) return ''
	const value = String(levelStr).trim()
	if (value === '二级') return 'level2'
	if (value === '三级') return 'level3'
	if (value === '四级') return 'level4'
	return ''
}

const buildProcessTree = (processes) => {
	const map = new Map()
	processes.forEach(p => {
		const level = getProcessLevel(p.level)
		map.set(p.rowid, { ...p, levelKey: level, children: [] })
	})

	// 根据 Parent 字段建立父子关系，父级不在结果集中时创建虚拟二级节点
	processes.forEach(p => {
		const node = map.get(p.rowid)
		const parents = p.parentProcessList || []
		parents.forEach(parent => {
			if (!parent.sid) return
			let parentNode = map.get(parent.sid)
			if (!parentNode) {
				// 父级被过滤掉时，根据子级层级推断父级层级（三级 -> 二级）
				const parentLevelText = node.levelKey === 'level4' ? '三级' : '二级'
				parentNode = {
					rowid: parent.sid,
					name: parent.name || '-',
					level: parentLevelText,
					levelKey: getProcessLevel(parentLevelText),
					workshop: p.workshop || '',
					parentProcessSids: [],
					parentProcessList: [],
					childProcessSids: [],
					children: [],
					isVirtual: true
				}
				map.set(parent.sid, parentNode)
			}
			if (!parentNode.children.find(c => c.rowid === node.rowid)) {
				parentNode.children.push(node)
			}
		})
	})

	// 以二级工序作为树状图的根节点
	return [...map.values()].filter(node => node.levelKey === 'level2')
}

const selectedLevel2Id = ref('')
const selectedLevel3Id = ref('')
const selectedLevel3Sequence = ref([])

const level2List = computed(() => processTree.value)

const selectedLevel2Children = computed(() => {
	const node = level2List.value.find(n => n.rowid === selectedLevel2Id.value)
	return node ? node.children : []
})

const selectedLevel3Processes = computed(() => {
	const allLevel3 = []
	processTree.value.forEach(node => {
		allLevel3.push(...node.children)
	})
	return selectedLevel3Sequence.value.map(rowid => {
		return allLevel3.find(child => child.rowid === rowid)
	}).filter(Boolean)
})

const selectedLevel3Set = computed(() => new Set(selectedLevel3Sequence.value))

const connectorLines = ref([])

const getRect = (selector) => {
	return new Promise((resolve) => {
		uni.createSelectorQuery().select(selector).boundingClientRect((rect) => {
			resolve(rect || null)
		}).exec()
	})
}

const updateConnectors = async () => {
	await nextTick()
	if (!selectedLevel2Id.value || selectedLevel2Children.value.length === 0) {
		connectorLines.value = []
		return
	}

	const connectorLayerRect = await getRect('.connector-layer')
	const selectedL2Rect = await getRect('#level2-' + selectedLevel2Id.value)
	if (!connectorLayerRect || !selectedL2Rect) {
		connectorLines.value = []
		return
	}

	// 以连接线层为参照系计算位置，自动兼容横向滚动
	const selectedCenterX = selectedL2Rect.left + selectedL2Rect.width / 2 - connectorLayerRect.left
	const l2BottomY = selectedL2Rect.bottom - connectorLayerRect.top

	const childRects = []
	for (const child of selectedLevel2Children.value) {
		const rect = await getRect('#level3-' + child.rowid)
		if (rect) {
			childRects.push({
				rowid: child.rowid,
				centerX: rect.left + rect.width / 2 - connectorLayerRect.left,
				topY: rect.top - connectorLayerRect.top
			})
		}
	}

	if (childRects.length === 0) {
		connectorLines.value = []
		return
	}

	const minX = Math.min(...childRects.map(c => c.centerX))
	const maxX = Math.max(...childRects.map(c => c.centerX))
	const midY = l2BottomY + (childRects[0].topY - l2BottomY) / 2

	const lines = [
		// 从选中的二级工序向下到横向主干
		{ type: 'vertical', left: selectedCenterX, top: l2BottomY, height: midY - l2BottomY },
		// 横向主干
		{ type: 'horizontal', left: minX, top: midY, width: maxX - minX }
	]

	// 从横向主干向上到每个三级工序
	childRects.forEach((c) => {
		lines.push({ type: 'vertical', left: c.centerX, top: midY, height: c.topY - midY })
	})

	connectorLines.value = lines
}

watch(selectedLevel2Id, updateConnectors)

const selectLevel2 = (rowid) => {
	selectedLevel2Id.value = rowid === selectedLevel2Id.value ? '' : rowid
	selectedLevel3Id.value = ''
}

const selectLevel3 = (rowid) => {
	const idx = selectedLevel3Sequence.value.indexOf(rowid)
	if (idx >= 0) {
		selectedLevel3Sequence.value.splice(idx, 1)
		if (selectedLevel3Id.value === rowid) {
			selectedLevel3Id.value = ''
		}
	} else {
		selectedLevel3Id.value = rowid
		selectedLevel3Sequence.value.push(rowid)
	}
}

const removeSelectedLevel3 = (rowid) => {
	const idx = selectedLevel3Sequence.value.indexOf(rowid)
	if (idx >= 0) {
		selectedLevel3Sequence.value.splice(idx, 1)
	}
}

const isSubmitting = ref(false)

const doSubmitProcessConfig = async () => {
	const params = {
		productRowid: selectedProductId.value,
		workshop: loginWorkshop.value,
		processes: selectedLevel3Sequence.value.map((rowid, index) => ({
			rowid,
			sequence: index + 1
		}))
	}

	isSubmitting.value = true
	try {
		const res = await http.post(PROCESS_CONFIG_COMPLETE_URL, params)
		console.log('工艺配置提交成功:', res)
		uni.showToast({ title: '配置完成', icon: 'success' })

		// 提交成功后刷新产品列表
		await loadProducts()
	} catch (e) {
		console.error('工艺配置提交失败:', e)
		uni.showToast({ title: '提交失败，请重试', icon: 'none' })
	} finally {
		isSubmitting.value = false
	}
}

const submitProcessConfig = () => {
	if (!selectedProductId.value) {
		uni.showToast({ title: '请先选择产品', icon: 'none' })
		return
	}
	if (selectedLevel3Sequence.value.length === 0) {
		uni.showToast({ title: '请至少选择一个工序', icon: 'none' })
		return
	}

	const count = selectedLevel3Sequence.value.length
	uni.showModal({
		title: '确认提交',
		content: `已选择 ${count} 个工序，确定提交工艺配置吗？`,
		confirmText: '确定',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				doSubmitProcessConfig()
			}
		}
	})
}

onMounted(() => {
	loadProducts()
})
</script>

<style scoped lang="scss">
.process-config-container {
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
		position: relative;
		z-index: 200;
		padding: 0 px2vw(20px);
		box-sizing: border-box;

		image {
			width: px2vw(36px);
			height: px2vw(36px);
			flex-shrink: 0;
		}

		.header-title {
			font-size: px2vw(30px);
			color: #fff;
			font-weight: bold;
		}
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.left-panel {
		width: px2vw(460px);
		background-color: #fff;
		border-right: 1px solid #eee;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		transition: width 0.3s ease;

		&.collapsed {
			width: px2vw(50px);
		}

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
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;

			.collapse-btn {
				position: absolute;
				right: px2vw(12px);
				width: px2vw(36px);
				height: px2vw(36px);
				line-height: px2vw(36px);
				text-align: center;
				border-radius: 50%;
				font-size: px2vw(18px);
				color: #666;
				background-color: #e9ecef;
				cursor: pointer;
				transition: all 0.2s ease;

				&:active {
					background-color: #dee2e6;
				}

				&.collapsed {
					right: auto;
					left: 50%;
					transform: translateX(-50%);
				}
			}
		}

		.product-list {
			flex: 1;
			overflow: hidden;
			background-color: #f8f9fa;

			.order-group {
				margin: px2vw(6px) px2vw(12px);
				background-color: #fff;
				border-radius: px2vw(12px);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
				overflow: hidden;

				.order-header {
					display: flex;
					flex-direction: row;
					align-items: center;
					padding: px2vw(10px) px2vw(16px);
					background-color: #fff;
					cursor: pointer;

					&:active {
						background-color: #f8f9fa;
					}

					.order-index {
						padding: px2vw(4px) px2vw(10px);
						background-color: #e9ecef;
						border-radius: px2vw(6px);
						font-size: px2vw(18px);
						color: #333;
						font-weight: bold;
						margin-right: px2vw(12px);
						flex-shrink: 0;
					}

					.order-header-main {
						flex: 1;
						display: flex;
						flex-direction: row;
						align-items: center;
						min-width: 0;
						overflow: hidden;
					}

					.order-no {
						font-size: px2vw(22px);
						color: #333;
						font-weight: bold;
						min-width: 0;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.order-delivery-date {
						font-size: px2vw(18px);
						color: #888;
						margin-left: px2vw(12px);
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						flex-shrink: 0;
					}

					.order-count {
						margin-left: px2vw(8px);
						font-size: px2vw(20px);
						color: #888;
						font-weight: normal;
						flex-shrink: 0;
					}
				}

				.order-products {
					border-top: 1px solid #f1f3f5;
					padding: px2vw(2px) 0;
				}
			}

			.product-item {
				padding: px2vw(8px) px2vw(16px);
				display: flex;
				flex-direction: row;
				align-items: center;
				flex-wrap: wrap;
				transition: background-color 0.15s ease;

				&:active {
					background-color: #f8f9fa;
				}

				&.product-active {
					background-color: #e7f5ff;
					border-left: px2vw(4px) solid #339af0;
				}

				.product-index {
					width: px2vw(32px);
					height: px2vw(32px);
					line-height: px2vw(32px);
					text-align: center;
					background-color: #e9ecef;
					color: #333;
					border-radius: 50%;
					font-size: px2vw(16px);
					font-weight: bold;
					flex-shrink: 0;
					margin: 0 px2vw(4px);
				}

				.product-info {
					flex: 1;
					display: flex;
					flex-direction: row;
					align-items: center;
					margin-left: px2vw(12px);
					min-width: 0;
				}

				.product-name {
					font-size: px2vw(22px);
					color: #333;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					min-width: 0;
				}

				.product-exchange-date {
					font-size: px2vw(18px);
					color: #888;
					margin-left: px2vw(12px);
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					flex-shrink: 0;
				}

				.product-btns {
					display: flex;
					flex-direction: row;
					align-items: center;
					flex-shrink: 0;
					gap: px2vw(8px);
				}

				.expand-btn {
					width: px2vw(32px);
					height: px2vw(32px);
					line-height: px2vw(32px);
					text-align: center;
					border-radius: 50%;
					font-size: px2vw(18px);
					color: #666;
					background-color: #f1f3f5;
					flex-shrink: 0;
					transition: all 0.15s ease;

					&:active {
						background-color: #dee2e6;
					}
				}

				.product-spec {
					width: 100%;
					background-color: #f1f3f5;
					border-radius: px2vw(8px);
					padding: px2vw(8px) px2vw(12px);
					font-size: px2vw(16px);
					color: #666;
					margin-top: px2vw(8px);
					margin-left: px2vw(50px);

					.spec-row {
						display: flex;
						flex-direction: row;
						margin-bottom: px2vw(4px);

						&:last-child {
							margin-bottom: 0;
						}

						.spec-label {
							flex-shrink: 0;
							color: #888;
						}

						.spec-value {
							flex: 1;
							min-width: 0;
							word-break: break-all;
						}
					}
				}
			}
		}

		.empty-wrap {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: px2vw(40px) 0;

			.empty-text {
				font-size: px2vw(22px);
				color: #999;
			}
		}
	}

	.right-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #fff;

		.right-placeholder {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;

			text {
				font-size: px2vw(24px);
				color: #999;
			}
		}

		.process-chart-panel {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;

			.chart-header {
				height: px2vw(60px);
				background-color: #f5f7fa;
				border-bottom: 1px solid #eee;
				display: flex;
				align-items: center;
				padding: 0 px2vw(20px);
				flex-shrink: 0;

				.chart-title {
					font-size: px2vw(26px);
					font-weight: bold;
					color: #333;
					margin-right: px2vw(16px);
					flex-shrink: 0;
				}

				.chart-subtitle {
					font-size: px2vw(22px);
					color: #666;
					flex: 1;
					min-width: 0;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.submit-btn {
					flex-shrink: 0;
					padding: 0 px2vw(20px);
					height: px2vw(42px);
					line-height: px2vw(42px);
					background: linear-gradient(180deg, #5884f1 0%, #3b6ad9 100%);
					color: #fff;
					font-size: px2vw(22px);
					font-weight: bold;
					border-radius: px2vw(8px);
					box-shadow: 0 2px 8px rgba(88, 132, 241, 0.3);
					text-align: center;
					transition: all 0.2s ease;
					margin-left: px2vw(16px);

					&:active {
						transform: scale(0.98);
					}

					&.disabled {
						background: #c5c5c5;
						box-shadow: none;
						pointer-events: none;
					}
				}
			}

			.chart-bar {
				flex-shrink: 0;
				width: px2vw(60px);
				height: px2vw(180px);
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(180deg, #5884f1 0%, #3b6ad9 100%);
				border-radius: px2vw(8px);
				box-shadow: 0 2px 8px rgba(88, 132, 241, 0.3);
				cursor: pointer;
				transition: all 0.2s ease;
				position: relative;

				&:active {
					transform: scale(0.96);
				}

				&.active {
					background: linear-gradient(180deg, #27ae60 0%, #219150 100%);
					box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
				}

				&.level3 {
					height: px2vw(180px);
					background: linear-gradient(180deg, #27ae60 0%, #219150 100%);
					box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
				}

				&.level4 {
					height: px2vw(120px);
					background: linear-gradient(180deg, #9b59b6 0%, #7d3c98 100%);
					box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
				}

				&.selected {
					background: linear-gradient(180deg, #27ae60 0%, #219150 100%);
					box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
				}

				.chart-bar-name {
					font-size: px2vw(20px);
					color: #fff;
					writing-mode: vertical-rl;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					max-height: 90%;
					padding: px2vw(8px) 0;
				}

				.selected-marker {
					position: absolute;
					top: px2vw(8px);
					right: px2vw(8px);
					width: px2vw(16px);
					height: px2vw(16px);
					background-color: #fff;
					border-radius: 50%;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
				}
			}

			.process-chart-scroll {
				flex: 1;
				background-color: #f8f9fa;

				.chart-empty {
					display: flex;
					justify-content: center;
					align-items: center;
					padding: px2vw(40px) 0;

					text {
						font-size: px2vw(22px);
						color: #999;
					}
				}

				.chart-levels {
					position: relative;
					display: inline-flex;
					flex-direction: column;
					min-width: 100%;
					padding: px2vw(20px);

					.level2-row {
						display: flex;
						flex-wrap: wrap;
						justify-content: space-around;
						align-items: flex-start;
						width: 100%;
					}

					.level2-column {
						display: flex;
						flex-direction: column;
						align-items: center;
						flex-shrink: 0;
						margin: px2vw(10px);
						min-width: px2vw(80px);
					}

					.connector-layer {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						pointer-events: none;
						z-index: 1;

						.connector-line {
							position: absolute;
							background-color: #999;

							&.horizontal {
								height: 1px;
							}

							&.vertical {
								width: 1px;
							}
						}
					}

					.level3-row {
						display: flex;
						justify-content: flex-start;
						align-items: flex-start;
						gap: px2vw(16px);
						width: 100%;
						margin-top: px2vw(20px);
					}

					.level3-column {
						display: flex;
						flex-direction: column;
						align-items: center;
						flex-shrink: 0;
					}

					.children-wrapper {
						display: flex;
						flex-direction: column;
						align-items: center;
						margin-top: px2vw(20px);
					}

					.connector-vertical {
						width: 1px;
						height: px2vw(30px);
						background-color: #999;
					}

					.children-row {
						display: inline-flex;
						align-items: flex-start;
						gap: px2vw(16px);
						padding-top: px2vw(20px);
						position: relative;
						border-top: 1px solid #999;

						.child-column {
							display: flex;
							flex-direction: column;
							align-items: center;
							position: relative;

							.connector-vertical-short {
								position: absolute;
								top: px2vw(-20px);
								left: 50%;
								transform: translateX(-50%);
								width: 1px;
								height: px2vw(20px);
								background-color: #999;
							}
						}
					}

				}
			}

			.selected-process-panel {
				flex-shrink: 0;
				background-color: #fff;
				border-top: 1px solid #eee;
				padding: px2vw(16px) px2vw(20px);

				.selected-process-title {
					font-size: px2vw(24px);
					font-weight: bold;
					color: #333;
					margin-bottom: px2vw(12px);
				}

				.selected-process-scroll {
					width: 100%;
					white-space: nowrap;
				}

				.selected-process-list {
					display: inline-flex;
					align-items: flex-end;
					gap: px2vw(16px);
					padding: px2vw(10px) 0;
				}

				.selected-process-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					flex-shrink: 0;

					.selected-process-index {
						width: px2vw(32px);
						height: px2vw(32px);
						line-height: px2vw(32px);
						text-align: center;
						background-color: #5884f1;
						color: #fff;
						border-radius: 50%;
						font-size: px2vw(18px);
						font-weight: bold;
						margin-bottom: px2vw(8px);
					}

					.chart-bar {
						background: linear-gradient(180deg, #f5a623 0%, #d48b1a 100%);
						border: none;
						box-shadow: 0 2px 8px rgba(245, 166, 35, 0.3);

						.chart-bar-name {
							color: #fff;
						}
					}
				}
			}
		}
	}
}
</style>
