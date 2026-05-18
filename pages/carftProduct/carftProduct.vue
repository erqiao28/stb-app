<template>
  <view class="craft-product-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">工艺产品</view>
      <view class="header-placeholder"></view>
    </view>

    <!-- 搜索：与选择产品页一致（订单编号 / 产品名称 / 可展开锅口·工艺·抛光） -->
    <view class="search-box">
      <view class="search-box-inner">
        <view class="search-main-row">
          <view class="search-filters-row">
            <view class="filter-row filter-row--order">
              <text class="filter-label">订单编号</text>
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
                      placeholder="输入关键词，点下方加入"
                      confirm-type="search"
                    />
                  </view>
                  <view v-if="orderInputTrimmed" class="suggest-dropdown suggest-dropdown--single">
                    <view class="suggest-item" @tap.stop="pickOrderSuggestion(orderInputTrimmed)">
                      <text>{{ orderInputTrimmed }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view class="filter-row filter-row--product">
              <text class="filter-label">产品名称</text>
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
                      placeholder="输入关键词，点下方加入"
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
          </view>
        </view>

        <view v-if="specFiltersExpanded" class="search-filters-row search-filters-row--spec">
          <view class="filter-row filter-row--spec">
            <text class="filter-label">锅口</text>
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
                    placeholder="输入关键词，点下方加入"
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
            <text class="filter-label">工艺</text>
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
                    placeholder="输入关键词，点下方加入"
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
            <text class="filter-label">抛光</text>
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
                    placeholder="输入关键词，点下方加入"
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

    <scroll-view class="orderList" scroll-y @scroll="onListScroll" @scrolltolower="loadMore" lower-threshold="80">
      <view
        class="orderItem orderItem--clickable"
        v-for="item in billsList"
        :key="item.rowid || item.productionCode || (item.orderCode + '-' + item.name)"
        @tap="openProductPage(item)"
      >
        <view class="goodsInfo">
          <view class="row-top">
            <view class="col col-left">
              <text class="label">订单编号：</text>
              <text class="value">{{ item.orderCode || '-' }}</text>
            </view>
            <view class="col col-center">
              <text class="label">生产编号：</text>
              <text class="value">{{ item.productionCode || '-' }}</text>
            </view>
            <view class="col col-right">
              <text class="label">生产状态：</text>
              <text class="value value-status">{{ item.productionStatus || '-' }}</text>
            </view>
          </view>
          <view class="row-middle">
            <view class="col col-left">
              <text class="label">产品名称：</text>
              <text class="value product-name-value">{{ item.name || '-' }}</text>
            </view>
            <view class="col col-center">
              <text class="label">订单数量：</text>
              <text class="value order-count-value">{{ item.orderCount === 0 || item.orderCount ? item.orderCount : '-' }}</text>
            </view>
            <view class="col col-right row-middle-placeholder"></view>
          </view>
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
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, nextTick } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { extractSpecFromModels } from '../../utils/extractSpecFromModels'

const { statusBarHeight } = useStatusBar()

/** 产品生产进度单 scd */
const WORKSHEET_SCD = 'scd'
const FIELD_ORDER_CODE = '690860b889796f37a2540994'
const FIELD_PRODUCTION_CODE = '69144a1454182012ca73966c'
const FIELD_NAME = '698197b03b5e707f84cec409'
const FIELD_ORDER_COUNT = '695e00ac9223cfe3a0c0aa7c'
const FIELD_PRODUCTION_STATUS = '6929116bf779440d044c5121'
const FIELD_MODELS = '6a0ab49fc03685667d66c376'

const EXCLUDED_PRODUCTION_STATUS = ['订单待审核', '待工序', '工序已完成']

const specFiltersExpanded = ref(false)
const toggleSpecFiltersExpanded = () => {
  specFiltersExpanded.value = !specFiltersExpanded.value
}

const orderFilterTags = ref([])
const orderSuggestInput = ref('')
const productNameFilterTags = ref([])
const productNameSuggestInput = ref('')
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

const billsList = ref([])
const baseListUnfiltered = ref([])
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 100
const totalRaw = ref(0)
const loadedRawCount = ref(0)
const hasUserScrolled = ref(false)

const productNameInputTrimmed = computed(() => (productNameSuggestInput.value || '').trim())
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
  list = filterListByTagsOr(list, orderFilterTags.value, (item) => (item.orderCode || '').toString())
  list = filterListByTagsOr(list, productNameFilterTags.value, (item) => (item.name || '').toString())
  for (const cfg of Object.values(specFilterConfig)) {
    list = filterListByTagsOr(list, cfg.tags.value, (item) => (item[cfg.field] || '').toString())
  }
  billsList.value = list
  nextTick(() => {
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
  if (productNameFilterTags.value.some((t) => String(t).trim().toLowerCase() === lower)) {
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

const isExcludedProductionStatus = (raw) => {
  const status = raw == null ? '' : String(raw).trim()
  return EXCLUDED_PRODUCTION_STATUS.includes(status)
}

const getBillsListRaw = async (pageNum = 1, silent = false) => {
  return callWorkflowListAPIPaged(
    {
      worksheetId: WORKSHEET_SCD,
      filters: [],
      silent
    },
    pageSize,
    pageNum
  )
}

const mapRowsBaseOnly = (rows) => {
  if (!rows || !rows.length) return []

  return rows
    .filter((item) => !isExcludedProductionStatus(item[FIELD_PRODUCTION_STATUS]))
    .map((item) => {
      const models = item[FIELD_MODELS] || ''
      return {
        rowid: item.rowid || '',
        orderCode: item[FIELD_ORDER_CODE] || '',
        productionCode: item[FIELD_PRODUCTION_CODE] || '',
        name: item[FIELD_NAME] || '',
        orderCount: item[FIELD_ORDER_COUNT],
        productionStatus: item[FIELD_PRODUCTION_STATUS] || '',
        models,
        specGuokou: extractSpecFromModels(models, '锅口'),
        specCraft: extractSpecFromModels(models, '工艺'),
        specPolish: extractSpecFromModels(models, '抛光')
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
    baseListUnfiltered.value = append ? baseListUnfiltered.value.concat(pageBase) : pageBase
    rebuildBillsList()

    hasMore.value = loadedRawCount.value < totalRaw.value
    currentPage.value = pageNum
  } finally {
    loadingMore.value = false
  }
}

const MAX_AUTO_PREFETCH_PAGES = 40

const prefetchUntilListNonEmptyIfNeeded = async () => {
  let steps = 0
  while (steps < MAX_AUTO_PREFETCH_PAGES && billsList.value.length === 0 && hasMore.value) {
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
  billsList.value = []
  baseListUnfiltered.value = []
  productNameFilterTags.value = []
  productNameSuggestInput.value = ''
  clearSpecFilterTags()
  await loadPage(1, false)
}

const onListScroll = (e) => {
  const top = Number(e?.detail?.scrollTop || 0)
  if (top > 0) hasUserScrolled.value = true
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  if (billsList.value.length > 0 && !hasUserScrolled.value) return
  await loadPage(currentPage.value + 1, true)
}

const openProductPage = (item) => {
  const productionCode = (item?.productionCode || '').toString().trim()
  if (!productionCode) {
    uni.showToast({ title: '缺少生产编号', icon: 'none' })
    return
  }
  const orderCode = (item?.orderCode || '').toString().trim()
  const orderItem = (item?.name || '').toString().trim()
  const orderCount =
    item?.orderCount === 0 || item?.orderCount ? String(item.orderCount) : ''
  let url = `/pages/product/product?productionCode=${encodeURIComponent(productionCode)}`
  if (orderCode) url += `&orderCode=${encodeURIComponent(orderCode)}`
  if (orderItem) url += `&orderItem=${encodeURIComponent(orderItem)}`
  if (orderCount) url += `&orderCount=${encodeURIComponent(orderCount)}`
  uni.navigateTo({ url })
}

const quit = () => {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/main/main' })
    }
  })
}

onLoad(() => {
  orderFilterTags.value = []
  orderSuggestInput.value = ''
  search()
})
</script>

<style scoped lang="scss">
.craft-product-container {
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
      font-size: px2vw(35px);
      color: white;
    }

    .header-placeholder {
      width: px2vw(80px);
      flex-shrink: 0;
    }
  }

  .search-box {
    width: 100%;
    background-color: #fff;
    min-height: px2vw(100px);
    padding: px2vw(15px) px2vw(20px);
    margin: px2vw(10px);
    border-radius: px2vw(18px);
    box-sizing: border-box;
    position: relative;
    z-index: 5;
    flex-shrink: 0;

    .search-box-inner {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: px2vw(12px);
    }

    .search-main-row {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      gap: px2vw(12px);
      min-width: 0;
    }

    .search-actions {
      flex-shrink: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding-bottom: px2vw(2px);
    }

    .spec-expand-btn {
      width: px2vw(76px);
      height: px2vw(76px);
      border-radius: px2vw(14px);
      border: px2vw(3px) solid #5884f1;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .spec-expand-arrow {
      font-size: px2vw(32px);
      color: #5884f1;
      line-height: 1;
    }

    .search-filters-row {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: px2vw(16px);
    }

    .search-filters-row--spec {
      flex-wrap: wrap;

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
      gap: px2vw(6px);
    }

    .filter-label {
      font-size: px2vw(24px);
      color: #333;
      line-height: 1.3;
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
    }

    .filter-tag {
      display: flex;
      flex-direction: row;
      align-items: center;
      max-width: 100%;
      padding: px2vw(6px) px2vw(12px);
      border-radius: px2vw(10px);
      background-color: #e8eefc;
      border: px2vw(2px) solid #b8c8f5;
      font-size: px2vw(22px);
      color: #2755f1;
    }

    .filter-tag-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: px2vw(8px);
    }

    .filter-tag-close {
      flex-shrink: 0;
      font-size: px2vw(30px);
      line-height: 1;
      color: #666;
    }

    .suggest-field {
      position: relative;
      width: 100%;
    }

    .suggest-input-box {
      width: 100%;
      border: px2vw(3px) solid #5884f1;
      border-radius: px2vw(18px);
      box-sizing: border-box;
      background-color: #fff;
    }

    .filter-tags-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: px2vw(8px);
      margin-right: px2vw(6px);
    }

    .suggest-input-box--chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: px2vw(8px);
      min-height: px2vw(80px);
      padding: px2vw(10px) px2vw(18px);
      box-sizing: border-box;

      input {
        flex: 1;
        min-width: px2vw(160px);
        height: px2vw(52px);
        font-size: px2vw(25px);
        border: none;
        background: transparent;
        padding: 0;
      }
    }

    .suggest-input-box--chips.suggest-input-box--compact {
      min-height: px2vw(76px);
      padding: px2vw(10px) px2vw(12px);

      input {
        flex: 1 1 auto;
        min-width: 0;
        font-size: px2vw(22px);
        min-height: px2vw(52px);
        height: px2vw(52px);
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
      border: px2vw(3px) solid #5884f1;
      border-radius: px2vw(14px);
      z-index: 30;
      box-shadow: 0 px2vw(8px) px2vw(24px) rgba(0, 0, 0, 0.12);
    }

    .suggest-item {
      padding: px2vw(20px) px2vw(22px);
      font-size: px2vw(26px);
      color: #333;
      border-bottom: px2vw(1px) solid #f0f0f0;
    }

    .suggest-item:last-child {
      border-bottom: none;
    }
  }

  .orderList {
    flex: 1;
    min-height: 0;
    background-color: #f0f0f0;

    .orderItem {
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(15px);
      padding: px2vw(15px);
      box-sizing: border-box;

      &.orderItem--clickable:active {
        background-color: #e8f4fc;
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
            flex: 1;

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

            .value.value-status {
              color: #d46b08;
            }
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
