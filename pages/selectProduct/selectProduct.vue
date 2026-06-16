<template>
  <view class="selectProduct-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 导航栏（与选择订单页面一致） -->
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">
        选择产品
      </view>
      <view class="header-tag-wrap">
        <text
          class="dispatch-mode-tag"
          :class="dispatchMode === 'product' ? 'is-product' : 'is-order'"
        >{{ dispatchMode === 'product' ? '产品派工' : '订单派工' }}</text>
      </view>
    </view>

    <!-- 搜索区域：首行订单编号+产品名称与确定/展开对齐；锅口/工艺/抛光可展开 -->
    <view class="search-box">
      <view class="search-box-inner">
        <view class="search-main-row">
          <view class="search-filters-row">
        <view class="filter-row filter-row--order">
          <view class="product-name-stack">
            <view class="suggest-field">
              <view class="suggest-input-box suggest-input-box--chips suggest-input-box--compact">
                <view v-if="orderFilterTags.length" class="filter-tags-inline">
                  <view
                    v-for="(tag, tIdx) in orderFilterTags"
                    :key="'ord-' + tIdx + '-' + tag"
                    class="filter-tag"
                    @tap.stop="removeOrderTag(tIdx)"
                  >
                    <text class="filter-tag-text">{{ tag }}</text>
                    <text class="filter-tag-close">×</text>
                  </view>
                </view>
                <input
                  v-model="orderSuggestInput"
                  type="text"
                  placeholder="订单编号"
                  confirm-type="search"
                />
              </view>
              <view v-if="orderInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                <view
                  class="suggest-item"
                  @tap.stop="pickOrderSuggestion(orderInputTrimmed)"
                >
                  <text>{{ orderInputTrimmed }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="filter-row filter-row--product">
          <view class="product-name-stack">
            <view class="suggest-field">
              <view class="suggest-input-box suggest-input-box--chips suggest-input-box--compact">
                <view v-if="productNameFilterTags.length" class="filter-tags-inline">
                  <view
                    v-for="(tag, tIdx) in productNameFilterTags"
                    :key="'tag-' + tIdx + '-' + tag"
                    class="filter-tag"
                    @tap.stop="removeProductNameTag(tIdx)"
                  >
                    <text class="filter-tag-text">{{ tag }}</text>
                    <text class="filter-tag-close">×</text>
                  </view>
                </view>
                <input
                  v-model="productNameSuggestInput"
                  type="text"
                  placeholder="产品名称"
                  confirm-type="search"
                />
              </view>
              <view v-if="productNameInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                <view
                  class="suggest-item"
                  @tap.stop="pickProductNameSuggestion(productNameInputTrimmed)"
                >
                  <text>{{ productNameInputTrimmed }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
          </view>

          <view class="search-actions">
            <view class="spec-expand-btn" @tap="toggleSpecFiltersExpanded">
              <text class="spec-expand-arrow">{{ specFiltersExpanded ? '▲' : '▼' }}</text>
            </view>
            <view
              class="btn-item confirm-btn"
              v-if="dispatchMode === 'product'"
              @click="confirmSelectedProducts"
            >确定</view>
          </view>
        </view>

      <view v-if="specFiltersExpanded" class="search-filters-row search-filters-row--spec">
        <view class="filter-row filter-row--spec">
          <view class="product-name-stack">
            <view class="suggest-field">
              <view class="suggest-input-box suggest-input-box--chips suggest-input-box--compact">
                <view v-if="guokouFilterTags.length" class="filter-tags-inline">
                  <view
                    v-for="(tag, tIdx) in guokouFilterTags"
                    :key="'gk-' + tIdx + '-' + tag"
                    class="filter-tag"
                    @tap.stop="removeGuokouTag(tIdx)"
                  >
                    <text class="filter-tag-text">{{ tag }}</text>
                    <text class="filter-tag-close">×</text>
                  </view>
                </view>
                <input
                  v-model="guokouSuggestInput"
                  type="text"
                  placeholder="锅口"
                  confirm-type="search"
                />
              </view>
              <view v-if="guokouInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                <view class="suggest-item" @tap.stop="pickGuokouSuggestion(guokouInputTrimmed)">
                  <text>{{ guokouInputTrimmed }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="filter-row filter-row--spec">
          <view class="product-name-stack">
            <view class="suggest-field">
              <view class="suggest-input-box suggest-input-box--chips suggest-input-box--compact">
                <view v-if="craftFilterTags.length" class="filter-tags-inline">
                  <view
                    v-for="(tag, tIdx) in craftFilterTags"
                    :key="'cf-' + tIdx + '-' + tag"
                    class="filter-tag"
                    @tap.stop="removeCraftTag(tIdx)"
                  >
                    <text class="filter-tag-text">{{ tag }}</text>
                    <text class="filter-tag-close">×</text>
                  </view>
                </view>
                <input
                  v-model="craftSuggestInput"
                  type="text"
                  placeholder="工艺"
                  confirm-type="search"
                />
              </view>
              <view v-if="craftInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                <view class="suggest-item" @tap.stop="pickCraftSuggestion(craftInputTrimmed)">
                  <text>{{ craftInputTrimmed }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="filter-row filter-row--spec">
          <view class="product-name-stack">
            <view class="suggest-field">
              <view class="suggest-input-box suggest-input-box--chips suggest-input-box--compact">
                <view v-if="polishFilterTags.length" class="filter-tags-inline">
                  <view
                    v-for="(tag, tIdx) in polishFilterTags"
                    :key="'pl-' + tIdx + '-' + tag"
                    class="filter-tag"
                    @tap.stop="removePolishTag(tIdx)"
                  >
                    <text class="filter-tag-text">{{ tag }}</text>
                    <text class="filter-tag-close">×</text>
                  </view>
                </view>
                <input
                  v-model="polishSuggestInput"
                  type="text"
                  placeholder="抛光"
                  confirm-type="search"
                />
              </view>
              <view v-if="polishInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                <view class="suggest-item" @tap.stop="pickPolishSuggestion(polishInputTrimmed)">
                  <text>{{ polishInputTrimmed }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      </view>
    </view>

    <!-- 单据列表：在选择订单基础上，展示订单编号 + 客户名称 + 产品名称 + 规格型号 -->
    <scroll-view class="orderList" scroll-y @scroll="onListScroll" @scrolltolower="loadMore" lower-threshold="80">
      <view
        class="orderItem"
        :class="{ 'orderItem--selected': dispatchMode === 'product' && isProductChecked(item) }"
        v-for="item in billsList"
        :key="item.productionCode || item.productCode || (item.orderCode + '-' + item.name)"
        @tap="handleProductItemClick(item)"
      >
        <!-- 小程序里原生 checkbox 常拦截触摸；透明层盖住框，由父级统一 @tap 勾选，避免点框无效 -->
        <view
          class="item-checkbox"
          v-if="dispatchMode === 'product'"
          @tap.stop="toggleProductChecked(item)"
        >
          <checkbox :checked="isProductChecked(item)" />
          <view class="item-checkbox-cover" aria-hidden="true" />
        </view>
        <view class="goodsInfo">
          <!-- 第一行：订单编号 + 客户名称 + 生产单号 -->
          <view class="row-top">
            <view class="col col-left">
              <text class="label">订单编号：</text>
              <text class="value">{{ item.orderCode }}</text>
            </view>
            <view class="col col-center">
              <text class="label">客户：</text>
              <text class="value value-name">{{ item.customerName || '-' }}</text>
            </view>
            <view class="col col-right">
              <text class="label">生产单号：</text>
              <text class="value">{{ item.productionCode || '-' }}</text>
            </view>
          </view>
          <!-- 第二行：与第一行同三列网格 — 产品名称 | 订单数量或返工数量 | 占位（与生产单号列对齐） -->
          <view class="row-middle">
            <view class="col col-left">
              <text class="label">产品名称：</text>
              <text class="value product-name-value">{{ item.name || '-' }}</text>
            </view>
            <view class="col col-center" v-if="billTypeFilter !== '返工排产'">
              <text class="label">订单数量：</text>
              <text class="value order-count-value">{{ item.orderCount || '-' }}</text>
            </view>
            <view class="col col-center" v-else>
              <text class="label">返工数量：</text>
              <text class="value rework-qty-value">{{ item.reworkQtyDisplay }}</text>
            </view>
            <view class="col col-right row-middle-placeholder"></view>
          </view>
          <!-- 第三行：规格型号，占整行，允许换行 -->
          <view class="row-bottom">
            <text class="label">规格型号：</text>
            <text class="value value-models">{{ item.models || '-' }}</text>
          </view>
        </view>
      </view>
      <view class="list-status" v-if="loadingMore">加载中...</view>
      <view class="list-status" v-else-if="!hasMore && billsList.length > 0">没有更多数据了</view>
      <view class="list-status" v-else-if="!billsList.length">暂无数据</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, computed, nextTick } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { defaultWorkshopFromLoginLimits } from '../../utils/workshop'
import { extractSpecFromModels } from '../../utils/extractSpecFromModels'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

// 车间：与派工、选择订单页面保持一致
const workshop = ref('拉伸车间')
// 排产类型：默认正常排产；由选择订单 / 派工返回 URL 参数 billType 带入，与接口 694a3954687045435008a7c3 一致
const BILL_TYPE_ALLOWED = ['正常排产', '返工排产']
const billTypeFilter = ref('正常排产')
const billTypeIndex = ref(0)
const isBillTypeReadonly = ref(false)
const dispatchMode = ref('order')
/** 是否展开锅口 / 工艺 / 抛光筛选行 */
const specFiltersExpanded = ref(false)

const toggleSpecFiltersExpanded = () => {
  specFiltersExpanded.value = !specFiltersExpanded.value
}

/** 订单编号筛选标签（与产品名称相同：本地 OR 匹配 orderCode 包含任一关键词） */
const orderFilterTags = ref([])
const orderSuggestInput = ref('')

const billsList = ref([])
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 100
const totalRaw = ref(0)
const loadedRawCount = ref(0)
const hasUserScrolled = ref(false)
const selectedProductKeys = ref([])

/** 已选中的产品名称筛选条件（标签）；列表需匹配其中任一词（OR） */
const productNameFilterTags = ref([])
/** 输入框内容（trim 后点下方选项加入 productNameFilterTags，不做数据联想） */
const productNameSuggestInput = ref('')

/** 从规格型号解析的锅口 / 工艺 / 抛光（仅用于筛选，不在列表展示） */
const guokouFilterTags = ref([])
const guokouSuggestInput = ref('')
const craftFilterTags = ref([])
const craftSuggestInput = ref('')
const polishFilterTags = ref([])
const polishSuggestInput = ref('')

const specFilterConfig = {
  guokou: { field: 'specGuokou', tags: guokouFilterTags },
  craft: { field: 'specCraft', tags: craftFilterTags },
  polish: { field: 'specPolish', tags: polishFilterTags }
}

/** 接口已加载并映射后的全集（不含销售订单、不含产品名标签筛选） */
const baseListUnfiltered = ref([])

const getProductKey = (item) => {
  return (
    item?.productionCode ||
    item?.productCode ||
    `${item?.orderCode || ''}-${item?.name || ''}`
  )
}

const productNameInputTrimmed = computed(() =>
  (productNameSuggestInput.value || '').trim()
)

const orderInputTrimmed = computed(() => (orderSuggestInput.value || '').trim())

const guokouInputTrimmed = computed(() => (guokouSuggestInput.value || '').trim())
const craftInputTrimmed = computed(() => (craftSuggestInput.value || '').trim())
const polishInputTrimmed = computed(() => (polishSuggestInput.value || '').trim())

const normalizeTagsLower = (tags) =>
  (tags || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean)

const filterListByTagsOr = (list, tags, getFieldStr) => {
  const tagsLower = normalizeTagsLower(tags)
  if (!tagsLower.length) return list
  return list.filter((item) => {
    const fieldStr = getFieldStr(item).toLowerCase()
    return tagsLower.some((tag) => fieldStr.includes(tag))
  })
}

const rebuildBillsList = () => {
  let list = [...baseListUnfiltered.value]
  list = filterListByTagsOr(list, orderFilterTags.value, (item) =>
    (item.orderCode || '').toString()
  )
  list = filterListByTagsOr(list, productNameFilterTags.value, (item) =>
    (item.name || '').toString()
  )
  for (const cfg of Object.values(specFilterConfig)) {
    list = filterListByTagsOr(list, cfg.tags.value, (item) =>
      (item[cfg.field] || '').toString()
    )
  }
  billsList.value = list
  nextTick(() => {
    // 须在单次 loadPage 结束（loadingMore 已置 false）后再拉取，否则会与当前请求冲突被 loadPage 首行拦截
    if (loadingMore.value) return
    if (billsList.value.length === 0 && hasMore.value) {
      prefetchUntilListNonEmptyIfNeeded()
    }
  })
}

const pickOrderSuggestion = (raw) => {
  const n = (raw || '').toString().trim()
  if (!n) return
  const lower = n.toLowerCase()
  if (orderFilterTags.value.some((t) => String(t).trim().toLowerCase() === lower)) {
    orderSuggestInput.value = ''
    return
  }
  orderFilterTags.value.push(n)
  orderSuggestInput.value = ''
  rebuildBillsList()
}

const removeOrderTag = (idx) => {
  if (idx < 0 || idx >= orderFilterTags.value.length) return
  orderFilterTags.value.splice(idx, 1)
  rebuildBillsList()
}

const pickProductNameSuggestion = (name) => {
  const n = (name || '').toString().trim()
  if (!n) return
  const lower = n.toLowerCase()
  if (
    productNameFilterTags.value.some((t) => String(t).trim().toLowerCase() === lower)
  ) {
    productNameSuggestInput.value = ''
    return
  }
  productNameFilterTags.value.push(n)
  productNameSuggestInput.value = ''
  rebuildBillsList()
}

const removeProductNameTag = (idx) => {
  if (idx < 0 || idx >= productNameFilterTags.value.length) return
  productNameFilterTags.value.splice(idx, 1)
  rebuildBillsList()
}

const pickSpecTag = (tagsRef, inputRef, raw) => {
  const n = (raw || '').toString().trim()
  if (!n) return
  const lower = n.toLowerCase()
  if (tagsRef.value.some((t) => String(t).trim().toLowerCase() === lower)) {
    inputRef.value = ''
    return
  }
  tagsRef.value.push(n)
  inputRef.value = ''
  rebuildBillsList()
}

const removeSpecTag = (tagsRef, idx) => {
  if (idx < 0 || idx >= tagsRef.value.length) return
  tagsRef.value.splice(idx, 1)
  rebuildBillsList()
}

const pickGuokouSuggestion = (raw) => pickSpecTag(guokouFilterTags, guokouSuggestInput, raw)
const removeGuokouTag = (idx) => removeSpecTag(guokouFilterTags, idx)
const pickCraftSuggestion = (raw) => pickSpecTag(craftFilterTags, craftSuggestInput, raw)
const removeCraftTag = (idx) => removeSpecTag(craftFilterTags, idx)
const pickPolishSuggestion = (raw) => pickSpecTag(polishFilterTags, polishSuggestInput, raw)
const removePolishTag = (idx) => removeSpecTag(polishFilterTags, idx)

const clearSpecFilterTags = () => {
  guokouFilterTags.value = []
  guokouSuggestInput.value = ''
  craftFilterTags.value = []
  craftSuggestInput.value = ''
  polishFilterTags.value = []
  polishSuggestInput.value = ''
}

const isProductChecked = (item) => {
  const key = getProductKey(item)
  return selectedProductKeys.value.includes(key)
}

const toggleProductChecked = (item) => {
  const key = getProductKey(item)
  const idx = selectedProductKeys.value.indexOf(key)
  if (idx >= 0) {
    selectedProductKeys.value.splice(idx, 1)
  } else {
    selectedProductKeys.value.push(key)
  }
}

const handleProductItemClick = (item) => {
  if (dispatchMode.value === 'product') {
    toggleProductChecked(item)
    return
  }
  selectProductItem(item)
}

onLoad((options) => {
  // 优先从登录权限取车间（与权限一致）
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = defaultWorkshopFromLoginLimits(userStore.loginLimits.trim())
  } else if (options && options.workshop) {
    const ow = decodeURIComponent(String(options.workshop)).trim()
    workshop.value = defaultWorkshopFromLoginLimits(ow) || ow
  }

  // 从选择订单页面带入订单编号：预填一条订单标签（仍可继续添加关键词）
  orderFilterTags.value = []
  orderSuggestInput.value = ''
  if (options && options.orderCode) {
    const oc = decodeURIComponent(options.orderCode).trim()
    if (oc) orderFilterTags.value.push(oc)
  }

  // 排产类型：与选择订单当前筛选一致（或派工页返回时带入）
  if (options && options.billTypeIndex !== undefined && options.billTypeIndex !== '') {
    const idx = Number(options.billTypeIndex)
    if (Number.isFinite(idx) && idx >= 0 && idx < BILL_TYPE_ALLOWED.length) {
      billTypeIndex.value = idx
      billTypeFilter.value = BILL_TYPE_ALLOWED[idx]
    }
  }
  if (options && options.billType) {
    const bt = decodeURIComponent(options.billType)
    if (BILL_TYPE_ALLOWED.includes(bt)) {
      billTypeFilter.value = bt
      billTypeIndex.value = BILL_TYPE_ALLOWED.indexOf(bt)
    }
  }
  const readonlyFlag = String(options?.billTypeReadonly || '')
  isBillTypeReadonly.value = readonlyFlag === '1' || readonlyFlag.toLowerCase() === 'true'
  const mode = String(options?.dispatchMode || '').trim()
  dispatchMode.value = mode === 'product' ? 'product' : 'order'

  // 进入页面后立即根据当前条件获取数据
  search()
})

onShow(() => {
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = defaultWorkshopFromLoginLimits(userStore.loginLimits.trim())
  }
  // 产品派工：每次进入/从派工页返回不保留勾选（页面栈复用时不应记住上次选中）
  if (dispatchMode.value === 'product') {
    selectedProductKeys.value = []
  }
})

// 获取单据原始数据（与选择订单接口一致；订单编号改由本地多关键词筛选，不在此接口收窄）
const getBillsListRaw = async (pageNum = 1, silent = false) => {
  const filters = [
    {
      controlId: '67de26c9c5377d50a523c735',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [workshop.value]
    },
    {
      controlId: '694a3954687045435008a7c3',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [billTypeFilter.value]
    },
    {
      controlId: '655b875ffc44a9469a3aa225',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: ['已排产', '部分排产']
    },
    {
      controlId: '69db0017665ab27f3913c455',
      dataType: 30,
      spliceType: 1,
      filterType: 6,
      values: ['准时交货']
    },
    {
      controlId: '66974cda2503723eec1af600',
      dataType: 30,
      spliceType: 1,
      filterType: 8
    }
  ]

  const res = await callWorkflowListAPIPaged(
    {
      worksheetId: 'paichanjihua',
      filters,
      silent
    },
    pageSize,
    pageNum
  )
  return res
}

/** 映射 + 排产类型相关行过滤；不含销售订单与产品名称标签筛选（供联想与 rebuildBillsList） */
const mapRowsBaseOnly = (rows) => {
  if (!rows || rows.length === 0) return []

  // 正常排产：69a8e4563b5e707f84d33c0c（未完成工序数量）> 0
  // 返工排产：按 69ccb3e7665ab27f39105da2 返工进度排除「已完成」
  const FIELD_REWORK_PROGRESS = '69ccb3e7665ab27f39105da2'
  const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
  const isReworkProgressCompleted = (row) => {
    const raw = row[FIELD_REWORK_PROGRESS]
    const p = raw == null ? '' : String(raw).trim()
    return p === '已完成'
  }
  const filteredData = rows.filter(item => {
    if (billTypeFilter.value === '返工排产') {
      return !isReworkProgressCompleted(item)
    }
    const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
    return !Number.isNaN(num) && num > 0
  })

  if (!filteredData.length) return []

  return filteredData.map(item => {
    const orderCode = item['655e1cbbbd2094b316347f92'] || ''
    const customerName = item['69a8ed3c3b5e707f84d33f8b'] || ''
    const name = item['6937d255ff2b019b3cb34be3'] || ''
    const models = item['6937d255ff2b019b3cb34be4'] || ''
    const orderCount = item['69e33354665ab27f3916f758'] || ''
    const reworkRaw = item['653f1c62df3ac906c8a8f4f6']
    const reworkQtyDisplay =
      reworkRaw == null || reworkRaw === '' || String(reworkRaw).trim() === ''
        ? '-'
        : reworkRaw

    return {
      orderCode,
      customerName,
      name,
      models,
      specGuokou: extractSpecFromModels(models, '锅口'),
      specCraft: extractSpecFromModels(models, '工艺'),
      specPolish: extractSpecFromModels(models, '抛光'),
      orderCount,
      reworkQtyDisplay,
      productionCode: item['698438933b5e707f84cf51fd'] || '',
      productCode: item['691d6336535b29cbd5c6c0ca'] || ''
    }
  })
}

const loadPage = async (pageNum = 1, append = false) => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    const billsRes = await getBillsListRaw(pageNum, pageNum > 1)
    const rawRows = billsRes.data || []
    totalRaw.value = Number(billsRes.total || 0)
    loadedRawCount.value += rawRows.length

    const pageBase = mapRowsBaseOnly(rawRows)
    baseListUnfiltered.value = append
      ? baseListUnfiltered.value.concat(pageBase)
      : pageBase
    rebuildBillsList()

    hasMore.value = loadedRawCount.value < totalRaw.value
    currentPage.value = pageNum
  } finally {
    loadingMore.value = false
  }
}

/** 订单/产品关键词为本地筛选：若当前已加载行筛完后为空，但服务端仍有分页，则自动继续拉取，避免仅加载前几页就「暂无数据」且无法触发上拉 */
const MAX_AUTO_PREFETCH_PAGES = 40

const prefetchUntilListNonEmptyIfNeeded = async () => {
  let steps = 0
  while (
    steps < MAX_AUTO_PREFETCH_PAGES &&
    billsList.value.length === 0 &&
    hasMore.value
  ) {
    steps++
    await loadPage(currentPage.value + 1, true)
  }
}

const search = async () => {
  currentPage.value = 1
  loadedRawCount.value = 0
  totalRaw.value = 0
  hasMore.value = true
  hasUserScrolled.value = false
  selectedProductKeys.value = []
  billsList.value = []
  baseListUnfiltered.value = []
  productNameFilterTags.value = []
  productNameSuggestInput.value = ''
  clearSpecFilterTags()
  // 保留 orderFilterTags / orderSuggestInput（含路由预填的订单），避免进入页 search 冲掉 onLoad 已设标签
  await loadPage(1, false)
}

const onListScroll = (e) => {
  const top = Number(e?.detail?.scrollTop || 0)
  if (top > 0) hasUserScrolled.value = true
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  // 有数据时需用户先滚动过再加载更多，避免首屏误触发连刷；筛选结果为空时允许直接触底继续拉取
  if (billsList.value.length > 0 && !hasUserScrolled.value) return
  await loadPage(currentPage.value + 1, true)
}

// 返回选择订单页面
const quit = () => {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.redirectTo({
        url: '/pages/main/main'
      })
    }
  })
}

// 选择产品后，跳转到派工页面：车间、订单、生产单号、物品名称、排产类型（与当前列表筛选一致）
const selectProductItem = (item) => {
  const readonlyPart = isBillTypeReadonly.value ? '&billTypeReadonly=1' : ''
  uni.navigateTo({
    url: `/pages/dispatchWork/dispatchWork?workshop=${encodeURIComponent(
      workshop.value
    )}&orderCode=${encodeURIComponent(item.orderCode || '')}&productionCode=${encodeURIComponent(
      item.productionCode || ''
    )}&orderItem=${encodeURIComponent(item.name || '')}&billType=${encodeURIComponent(
      billTypeFilter.value || '正常排产'
    )}&billTypeIndex=${billTypeIndex.value}&dispatchMode=${dispatchMode.value}${readonlyPart}`
  })
}

const confirmSelectedProducts = () => {
  const selectedItems = billsList.value.filter(item => isProductChecked(item))
  if (!selectedItems.length) {
    uni.showToast({ title: '请先勾选单据', icon: 'none' })
    return
  }
  const readonlyPart = isBillTypeReadonly.value ? '&billTypeReadonly=1' : ''
  const payload = selectedItems.map(item => ({
    orderCode: item.orderCode || '',
    productionCode: item.productionCode || '',
    name: item.name || '',
    orderCount: item.orderCount
  }))
  uni.navigateTo({
    url: `/pages/dispatchWork/dispatchWork?workshop=${encodeURIComponent(
      workshop.value
    )}&billType=${encodeURIComponent(
      billTypeFilter.value || '正常排产'
    )}&billTypeIndex=${billTypeIndex.value}&dispatchMode=product&selectedProducts=${encodeURIComponent(
      JSON.stringify(payload)
    )}${readonlyPart}`
  })
}
</script>

<style scoped lang="scss">
.selectProduct-container {
  height: 100vh;
  min-height: 100vh;
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
      flex: 1;
      min-width: 0;
      text-align: center;
      margin-right: 0;
      font-size: px2vw(35px);
      color: white;
      font-weight: bold;
    }

    .header-tag-wrap {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-right: px2vw(16px);
      min-width: px2vw(100px);
      box-sizing: border-box;
    }

    .dispatch-mode-tag {
      font-size: px2vw(22px);
      color: #fff;
      padding: px2vw(6px) px2vw(14px);
      border-radius: px2vw(10px);
      background: rgba(255, 255, 255, 0.2);
      border: px2vw(1px) solid rgba(255, 255, 255, 0.45);
      white-space: nowrap;
    }

    .dispatch-mode-tag.is-order {
      background: rgba(255, 255, 255, 0.18);
    }

    .dispatch-mode-tag.is-product {
      background: rgba(255, 193, 7, 0.35);
      border-color: rgba(255, 224, 130, 0.85);
    }
  }

  .search-box {
    width: 100%;
    background-color: #fff;
    padding: px2vw(10px);
    border-bottom: 1px solid #eee;
    box-sizing: border-box;
    position: relative;
    z-index: 5;
    flex-shrink: 0;

    .search-box-inner {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: px2vw(10px);
    }

    .search-main-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: px2vw(10px);
      min-width: 0;
    }

    .search-actions {
      flex-shrink: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: px2vw(10px);
    }

    .spec-expand-btn {
      width: px2vw(70px);
      height: px2vw(70px);
      border-radius: px2vw(8px);
      background-color: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .spec-expand-arrow {
      font-size: px2vw(28px);
      color: #666;
      line-height: 1;
    }

    .search-filters-row {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: px2vw(10px);
    }

    .search-filters-row--spec {
      flex-wrap: wrap;
      margin-top: px2vw(2px);

      .filter-row--spec {
        flex: 1 1 30%;
        min-width: px2vw(200px);
        position: relative;
        z-index: 4;
      }
    }

    .filter-row {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .filter-row--order {
      position: relative;
      z-index: 6;
    }

    .filter-row--product {
      position: relative;
      z-index: 5;
    }

    .product-name-stack {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .filter-tag {
      display: flex;
      flex-direction: row;
      align-items: center;
      max-width: 100%;
      padding: px2vw(4px) px2vw(10px);
      border-radius: px2vw(6px);
      background-color: #e8eefc;
      border: px2vw(2px) solid #b8c8f5;
      font-size: px2vw(20px);
      color: #2755f1;
      box-sizing: border-box;
    }

    .filter-tag-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: px2vw(6px);
    }

    .filter-tag-close {
      flex-shrink: 0;
      font-size: px2vw(26px);
      line-height: 1;
      color: #666;
    }

    .suggest-field {
      position: relative;
      width: 100%;
    }

    .suggest-input-box {
      width: 100%;
      border-radius: px2vw(8px);
      box-sizing: border-box;
      background-color: #f5f7fa;
    }

    .filter-tags-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: px2vw(6px);
      margin-right: px2vw(6px);
    }

    /* 标签与输入同在框内：横向排列，过多时换行 */
    .suggest-input-box--chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      align-content: center;
      gap: px2vw(6px);
      min-height: px2vw(70px);
      padding: px2vw(8px) px2vw(12px);
      box-sizing: border-box;

      input {
        flex: 1;
        min-width: px2vw(120px);
        height: px2vw(44px);
        font-size: px2vw(22px);
        border: none;
        background: transparent;
        padding: 0;
      }
    }

    /* 双列：输入随剩余空间拉满便于点击；标签 flex-wrap，多条自动换行 */
    .suggest-input-box--chips.suggest-input-box--compact {
      min-height: px2vw(70px);
      padding: px2vw(8px) px2vw(10px);
      align-items: center;

      input {
        flex: 1 1 auto;
        align-self: stretch;
        min-width: 0;
        width: auto;
        font-size: px2vw(22px);
        min-height: px2vw(44px);
        height: px2vw(44px);
        box-sizing: border-box;
      }
    }

    .suggest-dropdown {
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      margin-top: px2vw(4px);
      max-height: px2vw(420px);
      overflow-y: auto;
      background-color: #fff;
      border: px2vw(2px) solid #ddd;
      border-radius: px2vw(8px);
      z-index: 30;
      box-shadow: 0 px2vw(8px) px2vw(24px) rgba(0, 0, 0, 0.12);
    }

    .suggest-item {
      padding: px2vw(16px) px2vw(18px);
      font-size: px2vw(24px);
      color: #333;
      border-bottom: px2vw(1px) solid #f0f0f0;
    }

    .suggest-item:last-child {
      border-bottom: none;
    }

    .orderItem-text {
      font-size: px2vw(25px);
      margin-right: px2vw(10px);
      white-space: nowrap;
    }

    .input-box {
      flex: 1;
      min-width: 0;
      height: px2vw(70px);
      background-color: #f5f7fa;
      border-radius: px2vw(8px);
      display: flex;
      align-items: center;
      padding: 0 px2vw(16px);

      input {
        font-size: px2vw(22px);
        width: 100%;
      }
    }

    .confirm-btn {
      flex-shrink: 0;
      margin: 0;
      width: auto;
      min-width: px2vw(120px);
      height: px2vw(70px);
      padding: 0 px2vw(22px);
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(8px);
      color: #fff;
      background-color: #28a745;
      font-size: px2vw(26px);
    }
  }

  .orderList {
    flex: 1;
    min-height: 0;
    background-color: #f0f0f0;

    .orderItem {
      position: relative;
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(15px);
      padding: px2vw(15px);
      transition: background-color 0.15s ease;

      &.orderItem--selected {
        background-color: #e8f4fc;
        box-shadow: inset 0 0 0 px2vw(2px) rgba(88, 132, 241, 0.35);
      }

      .item-checkbox {
        position: absolute;
        top: px2vw(12px);
        right: px2vw(12px);
        z-index: 2;
        padding: px2vw(8px);
        margin: px2vw(-8px);
        box-sizing: content-box;
      }

      .item-checkbox-cover {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
      }

      .goodsInfo {
        display: flex;
        flex-direction: column;
        font-size: px2vw(25px);
        gap: px2vw(10px);

        .row-top,
        .row-middle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: px2vw(20px);

          .col {
            display: flex;
            align-items: center;
            min-width: 0;
            flex: 1; // 三列等宽，保证上下行标题对齐

            .label {
              color: #666;
              margin-right: px2vw(6px);
              white-space: nowrap;
              flex-shrink: 0;
            }

            .value {
              color: #333;
              word-break: break-all;
              white-space: normal;
            }

            .value.product-name-value {
              color: #ff4d4f;
            }

            .value.order-count-value {
              color: #2755f1;
            }

            .value.rework-qty-value {
              color: #d46b08;
            }
          }

          .col-left,
          .col-center,
          .col-right {
            justify-content: flex-start;
          }

          .row-middle-placeholder {
            min-height: 1px;
            pointer-events: none;
          }
        }

        .row-bottom {
          display: flex;
          align-items: flex-start;
          margin-top: px2vw(5px);

          .label {
            color: #666;
            margin-right: px2vw(6px);
            white-space: nowrap;
            flex-shrink: 0;
          }

          .value-models {
            flex: 1;
            color: #333;
            word-break: break-word;
            white-space: normal;
          }
          
          .value-name {
            flex: 1;
            color: #333;
            word-break: break-word;
            white-space: normal;
          }
        }
      }
    }
    
    .list-status {
      text-align: center;
      color: #999;
      font-size: px2vw(24px);
      padding: px2vw(20px) 0;
    }
  }
}
</style>
