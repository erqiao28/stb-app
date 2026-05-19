<template>
  <view class="craft-order-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">工艺订单</view>
      <view class="header-placeholder"></view>
    </view>

    <!-- 搜索区域：销售订单 + 查询 -->
    <view class="search-box">
      <view class="salesOrder">
        <text class="salesOrder-text">销售订单</text>
        <view class="input-box">
          <input type="text" v-model="searchForm.salesOrder" placeholder="请输入销售订单" />
        </view>
      </view>
      <view class="btn-item search-btn" @click="search">查询</view>
    </view>

    <!-- 订单列表：订单编号、客户名称、产品数量 -->
    <scroll-view
      class="orderList"
      scroll-y
      :lower-threshold="100"
      @scrolltolower="onScrollToLower"
    >
      <view class="orderItem" v-for="item in billsList" :key="item.orderCode" @click="selectOrder(item)">
        <view class="goodsInfo row-single">
          <view class="col col-left">
            <text class="label">订单编号：</text>
            <text class="value">{{ item.orderCode || '-' }}</text>
          </view>
          <view class="col col-center">
            <text class="label">客户名称：</text>
            <text class="value">{{ item.customerName || '-' }}</text>
          </view>
          <view class="col col-right">
            <text class="label">产品数量：</text>
            <text class="value product-count-value">{{ item.productCount }}</text>
          </view>
        </view>
      </view>
      <view v-if="loadingMore" class="list-footer">加载中...</view>
      <view v-else-if="!hasMore && billsList.length" class="list-footer">没有更多了</view>
      <view v-else-if="hasMore && billsList.length" class="list-footer hint">上拉加载更多</view>
      <view v-else-if="!billsList.length" class="list-footer">暂无数据</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { ref } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'

const { statusBarHeight } = useStatusBar()

/** 产品生产进度单 scd */
const WORKSHEET_SCD = 'scd'
const FIELD_ORDER_CODE = '690860b889796f37a2540994'
const FIELD_CUSTOMER = '698099903b5e707f84ce99df'
const FIELD_PRODUCTION_STATUS = '6929116bf779440d044c5121'

const EXCLUDED_PRODUCTION_STATUS = ['订单待审核', '待工序', '工序已完成']

const billsList = ref([])
const searchForm = ref({ salesOrder: '' })

/** 每页条数 */
const LIST_PAGE_SIZE = 100
const listPageNum = ref(1)
const hasMore = ref(true)
const accumulatedRawRows = ref([])
const loadingMore = ref(false)
const listLoading = ref(false)

const isExcludedProductionStatus = (raw) => {
  const status = raw == null ? '' : String(raw).trim()
  return EXCLUDED_PRODUCTION_STATUS.includes(status)
}

onLoad(() => {
  search()
})

/** 构建接口filters：生产状态排除 + 订单编号模糊搜索 */
const buildFilters = () => {
  const filters = []
  // 生产状态：不包含排除的状态（用NContain，每个状态一个filter，spliceType=1表示AND）
  EXCLUDED_PRODUCTION_STATUS.forEach((status) => {
    filters.push({
      controlId: FIELD_PRODUCTION_STATUS,
      dataType: 30,
      spliceType: 1,
      filterType: 6, // Ne - 不等于
      values: [status]
    })
  })
  // 订单编号：模糊搜索
  const keyword = (searchForm.value.salesOrder || '').trim()
  if (keyword) {
    filters.push({
      controlId: FIELD_ORDER_CODE,
      dataType: 30,
      spliceType: 1,
      filterType: 1, // Like - 包含
      values: [keyword]
    })
  }
  return filters
}

const getBillsListRaw = async (pageNum = 1, silent = false) => {
  return callWorkflowListAPIPaged(
    {
      worksheetId: WORKSHEET_SCD,
      filters: buildFilters(),
      silent
    },
    LIST_PAGE_SIZE,
    pageNum
  )
}

/**
 * 将已累积的原始行按订单汇总
 */
const buildDisplayListFromRawRows = (rawRows) => {
  if (!rawRows || rawRows.length === 0) {
    return []
  }

  const orderMap = {}
  rawRows.forEach((item) => {
    const orderCode = item[FIELD_ORDER_CODE] || ''
    if (!orderCode) return
    if (!orderMap[orderCode]) {
      orderMap[orderCode] = {
        count: 0,
        customerName: item[FIELD_CUSTOMER] || ''
      }
    }
    orderMap[orderCode].count += 1
  })

  const list = Object.keys(orderMap).map((orderCode) => ({
    orderCode,
    customerName: orderMap[orderCode].customerName,
    productCount: orderMap[orderCode].count
  }))

  return list
}

/** 本页是否还可能存在下一页 */
const updateHasMoreFromResponse = (res, pageNum) => {
  const rows = res?.data || []
  if (!rows.length || rows.length < LIST_PAGE_SIZE) return false
  const total = Number(res?.total) || 0
  if (total > 0 && pageNum * LIST_PAGE_SIZE >= total) return false
  return true
}

const MIN_LIST_SIZE = 50
const MAX_AUTO_PREFETCH_PAGES = 40

const search = async () => {
  listLoading.value = true
  listPageNum.value = 1
  accumulatedRawRows.value = []
  hasMore.value = true
  try {
    const billsRes = await getBillsListRaw(1, false)
    const rows = billsRes?.data || []
    accumulatedRawRows.value = rows
    hasMore.value = updateHasMoreFromResponse(billsRes, 1)

    let list = buildDisplayListFromRawRows(accumulatedRawRows.value)
    billsList.value = list

    // 自动预取：筛选后不足50条且还有下一页时，继续获取
    let prefetchSteps = 0
    while (prefetchSteps < MAX_AUTO_PREFETCH_PAGES && billsList.value.length < MIN_LIST_SIZE && hasMore.value) {
      prefetchSteps++
      const nextPage = listPageNum.value + 1
      loadingMore.value = true
      try {
        const nextRes = await getBillsListRaw(nextPage, true)
        const nextRows = nextRes?.data || []
        accumulatedRawRows.value = accumulatedRawRows.value.concat(nextRows)
        listPageNum.value = nextPage
        hasMore.value = updateHasMoreFromResponse(nextRes, nextPage)
        list = buildDisplayListFromRawRows(accumulatedRawRows.value)
        billsList.value = list
      } finally {
        loadingMore.value = false
      }
    }
  } finally {
    listLoading.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value || listLoading.value) return
  const nextPage = listPageNum.value + 1
  loadingMore.value = true
  try {
    const billsRes = await getBillsListRaw(nextPage, true)
    const rows = billsRes?.data || []
    accumulatedRawRows.value = accumulatedRawRows.value.concat(rows)
    listPageNum.value = nextPage
    hasMore.value = updateHasMoreFromResponse(billsRes, nextPage)
    billsList.value = buildDisplayListFromRawRows(accumulatedRawRows.value)
  } finally {
    loadingMore.value = false
  }
}

const onScrollToLower = () => {
  loadMore()
}

const selectOrder = (item) => {
  const orderCode = (item?.orderCode || '').toString().trim()
  if (!orderCode) {
    uni.showToast({ title: '缺少订单编号', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/carftProduct/carftProduct?orderCode=${encodeURIComponent(orderCode)}`
  })
}

const quit = () => {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/main/main' })
    }
  })
}
</script>

<style scoped lang="scss">
.craft-order-container {
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
    $search-row-btn-w: px2vw(340px);

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    background-color: #fff;
    min-height: px2vw(120px);
    padding: px2vw(10px) px2vw(10px);
    margin: px2vw(10px) px2vw(5px);
    border-radius: px2vw(18px);
    box-sizing: border-box;
    gap: px2vw(10px);

    .salesOrder {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      .salesOrder-text {
        font-size: px2vw(25px);
        margin-right: px2vw(10px);
        white-space: nowrap;
      }

      .input-box {
        flex: 1;
        min-width: 0;
        height: px2vw(80px);
        border: px2vw(3px) solid #5884f1;
        border-radius: px2vw(18px);
        display: flex;
        align-items: center;
        padding: 0 px2vw(24px);

        input {
          font-size: px2vw(25px);
          width: 100%;
        }
      }
    }

    .search-btn {
      flex: 0 0 $search-row-btn-w;
      width: $search-row-btn-w;
      box-sizing: border-box;
    }
  }

  .btn-item,
  .search-btn {
    height: px2vw(80px);
    padding: px2vw(16px) px2vw(25px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: px2vw(18px);
    color: #fff;
    background-color: #2755f1;
    font-size: px2vw(25px);
    box-sizing: border-box;
  }

  .orderList {
    flex: 1;
    min-height: 0;
    height: 0;

    .list-footer {
      padding: px2vw(24px);
      text-align: center;
      font-size: px2vw(22px);
      color: #999;

      &.hint {
        color: #bbb;
      }
    }

    .orderItem {
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(15px);
      padding: px2vw(15px);

      .goodsInfo {
        &.row-single {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          font-size: px2vw(25px);
          gap: px2vw(20px);

          .col {
            display: flex;
            align-items: center;
            min-width: 0;

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

            .value.product-count-value {
              color: #2755f1;
            }
          }

          .col-left {
            flex: 0 0 auto;
            justify-content: flex-start;
          }

          .col-center {
            flex: 1;
            justify-content: flex-start;
            padding: 0 px2vw(10px);
          }

          .col-right {
            flex: 0 0 auto;
            justify-content: flex-end;
          }
        }
      }
    }
  }
}
</style>
