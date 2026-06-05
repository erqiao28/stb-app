<template>
	<view class="pre-dispatched-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBack"></image>
			<view class="title">预派工</view>
			<view></view>
		</view>

		<scroll-view class="pre-dispatched-list" scroll-y @scrolltolower="loadMore">
			<view
				class="pre-dispatched-item"
				v-for="(item, idx) in preDispatchedList"
				:key="item.rowid || ('row-' + idx)"
				@click="handleItemClick(item)"
			>
				<view class="item-body">
					<view class="info-row">
					<view class="info-cell">
						<text class="label">订单</text>
						<text class="value">{{ item.pureOrderNo || item.orderNo || '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">产品</text>
						<text class="value">{{ item.productName || '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">交货日期</text>
						<text class="value">{{ item.deliveryDate || '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">派工日期</text>
						<text class="value">{{ item.dispatchDate || '-' }}</text>
					</view>
				</view>
				<view class="info-row">
					<view class="info-cell">
						<text class="label">车间</text>
						<text class="value">{{ item.workshop || '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">派工数量</text>
						<text class="value">{{ item.dispatchCount ?? '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">工时</text>
						<text class="value">{{ item.worktime ?? '-' }}</text>
					</view>
					<view class="info-cell">
						<text class="label">工价</text>
						<text class="value">{{ item.wage ?? '-' }}</text>
					</view>
				</view>
					<view class="info-row info-row-wide">
						<view class="info-cell">
							<text class="label">工序</text>
							<text class="value">{{ item.processName || '-' }}</text>
						</view>
						<view class="info-cell">
							<text class="label">员工</text>
							<text class="value">{{ item.employeeName || '-' }}</text>
						</view>
					</view>
					<view class="info-row spec-row">
						<view class="info-cell">
							<text class="label">规格型号</text>
							<text class="value">{{ item.specification || '-' }}</text>
						</view>
					</view>

				</view>
			</view>
			<view class="load-more-wrap" v-if="preDispatchedList.length">
				<text v-if="loadingMore" class="load-more-text">加载中...</text>
				<text v-else-if="!hasMore" class="load-more-text">没有更多了</text>
				<text v-else class="load-more-text">上拉加载更多</text>
			</view>
			<view class="empty-wrap" v-if="!preDispatchedList.length && !loadingMore">
				<text class="empty-text">暂无预派工数据</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const workshopOptions = ['拉伸车间', '喷涂车间', '抛光车间', '组装车间']

const loginWorkshop = computed(() => {
	const lim = (userStore.loginLimits || '').trim()
	return workshopOptions.includes(lim) ? lim : ''
})

const preDispatchedList = ref([])
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)
const PAGE_SIZE = 20

// 预派工表工作表ID（使用原始ID）
const WORKSHEET_ID = '6a1e468d27514927ff33cbae'

// 字段ID映射（根据大陈云字段配置）
const FIELD_MAP = {
	orderNo: '6a1e47d727514927ff33cc45',
	pureOrderNo: '6a1fff8738176d619e00e008',
	productName: '6a1e47d727514927ff33cc47',
	workshop: '6a1e4c1427514927ff33cda4',
	deliveryDate: '6a1e7d2c27514927ff33e56b',
	dispatchDate: '6a1e488327514927ff33cca9',
	dispatchCount: '6a1e47d727514927ff33cc4b',
	worktime: '6a1e489127514927ff33ccb7',
	wage: '6a1e488327514927ff33ccaa',
	specification: '6a1e4a2327514927ff33cd1a',
	processName: '6a1e48b627514927ff33ccc0',
	employeeName: '6a1e48b627514927ff33ccc1',
	productionCode: '6a1fee4638176d619e00db16',
	processDetail: '6a1e47d727514927ff33cc4c',
	dailyWage: '6a1e47d727514927ff33cc4e',
}

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

// 提取关联记录的 sid 数组
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

const formatSpecification = (v) => {
	const raw = formatFieldValue(v)
	if (!raw) return ''
	// 非组装车间权限时，只显示 "盖子" 之前的内容
	if (loginWorkshop.value && loginWorkshop.value !== '组装车间') {
		const idx = raw.indexOf('盖子')
		if (idx !== -1) {
			return raw.substring(0, idx).trim()
		}
	}
	return raw
}

const mapRawRows = (raw) => {
	return raw.map((item) => ({
		rowid: item.rowid,
		orderNo: formatFieldValue(item[FIELD_MAP.orderNo]),
		pureOrderNo: formatFieldValue(item[FIELD_MAP.pureOrderNo]),
		productName: formatFieldValue(item[FIELD_MAP.productName]),
		workshop: formatFieldValue(item[FIELD_MAP.workshop]),
		deliveryDate: formatFieldValue(item[FIELD_MAP.deliveryDate]),
		dispatchDate: formatFieldValue(item[FIELD_MAP.dispatchDate]),
		dispatchCount: formatFieldValue(item[FIELD_MAP.dispatchCount]),
		worktime: formatFieldValue(item[FIELD_MAP.worktime]),
		wage: formatFieldValue(item[FIELD_MAP.wage]),
		specification: formatSpecification(item[FIELD_MAP.specification]),
		processName: formatFieldValue(item[FIELD_MAP.processName]),
		employeeName: formatFieldValue(item[FIELD_MAP.employeeName]),
		productionCode: formatFieldValue(item[FIELD_MAP.productionCode]),
		processDetail: extractRelationSids(item[FIELD_MAP.processDetail]),
		dailyWage: extractRelationSids(item[FIELD_MAP.dailyWage]),
	}))
}

const handleItemClick = (item) => {
	// item 是 mapRawRows 映射后的数据，processDetail 和 dailyWage 已经是 sid 数组
	const processDetailSids = Array.isArray(item.processDetail) ? item.processDetail : []
	const dailyWageSids = Array.isArray(item.dailyWage) ? item.dailyWage : []
	const params = {
		orderCode: item.pureOrderNo || item.orderNo || '',
		productionCode: item.productionCode || '',
		workshop: item.workshop || '',
		productName: item.productName || '',
		processDetailSids: processDetailSids.length > 0 ? JSON.stringify(processDetailSids) : '',
		dailyWageSids: dailyWageSids.length > 0 ? JSON.stringify(dailyWageSids) : '',
		dispatchDate: item.dispatchDate || '',
		dispatchCount: item.dispatchCount || '',
		fromPreDispatch: '1',
	}
	const query = Object.entries(params)
		.filter(([_, v]) => v !== '')
		.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
		.join('&')
	uni.navigateTo({
		url: `/pages/dispatchWork/dispatchWork?${query}`
	})
}

const loadData = async (reset = true) => {
	const nextPage = reset ? 1 : pageNum.value + 1
	loadingMore.value = true

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

		const res = await callWorkflowListAPIPaged({
			worksheetId: WORKSHEET_ID,
			filters,
			pageSize: PAGE_SIZE,
			pageNum: nextPage,
			silent: !reset
		})

		const raw = Array.isArray(res?.data) ? res.data : []
		const mapped = mapRawRows(raw)

		if (reset) {
			preDispatchedList.value = mapped
		} else {
			preDispatchedList.value = [...preDispatchedList.value, ...mapped]
		}
		pageNum.value = nextPage

		const total = typeof res?.total === 'number' ? res.total : 0
		if (total > 0) {
			const fetched = (nextPage - 1) * PAGE_SIZE + raw.length
			hasMore.value = fetched < total
		} else {
			hasMore.value = raw.length >= PAGE_SIZE
		}
	} catch (e) {
		console.error('加载失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loadingMore.value = false
	}
}

const loadMore = () => {
	if (loadingMore.value || !hasMore.value) return
	loadData(false)
}

onMounted(() => {
	loadData(true)
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
		height: px2vw(90px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(50px);
			width: px2vw(50px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(32px);
			color: white;
			font-weight: bold;
		}
	}

	.pre-dispatched-list {
		flex: 1;
		padding: px2vw(10px);

		.pre-dispatched-item {
			background-color: #fff;
			border-radius: px2vw(8px);
			margin-bottom: px2vw(10px);
			box-shadow: 0 px2vw(2px) px2vw(6px) rgba(0, 0, 0, 0.06);
			overflow: hidden;
			transition: transform 0.2s ease;

			&:active {
				transform: scale(0.99);
			}

			.item-body {
				padding: px2vw(10px) px2vw(12px);
				display: flex;
				flex-direction: column;
				gap: px2vw(6px);

				.info-row {
					display: flex;
					gap: px2vw(10px);
					flex-wrap: wrap;

					&.spec-row {
						.info-cell {
							.value {
								color: #e67e22;
								font-weight: 500;
							}
						}
					}

					.info-cell {
						display: flex;
						align-items: center;
						gap: px2vw(6px);
						background-color: #f8f9fa;
						padding: px2vw(4px) px2vw(8px);
						border-radius: px2vw(4px);
						min-width: 0;
						flex: 1;

						.label {
							font-size: px2vw(20px);
							color: #999;
							white-space: nowrap;
							flex-shrink: 0;
						}

						.value {
							font-size: px2vw(22px);
							color: #333;
							font-weight: 600;
							word-break: break-all;
							min-width: 0;
						}
					}
				}

			}
		}

		.load-more-wrap {
			padding: px2vw(16px) 0 px2vw(30px);
			text-align: center;

			.load-more-text {
				font-size: px2vw(24px);
				color: #888;
			}
		}

		.empty-wrap {
			padding: px2vw(100px) 0;
			text-align: center;

			.empty-text {
				font-size: px2vw(28px);
				color: #aaa;
			}
		}
	}
}
</style>
