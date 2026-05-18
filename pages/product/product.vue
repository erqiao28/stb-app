<template>
  <view class="product-detail-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 导航栏 -->
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">产品详情</view>
      <view class="header-placeholder"></view>
    </view>

    <!-- 单据信息区域 -->
    <view class="bill-card" v-if="productInfo">
      <!-- 订单信息头部 -->
      <view class="bill-header">
        <view class="order-info">
          <view class="order-label">订单</view>
          <view class="order-number">{{ productInfo.orderCode || '-' }}</view>
        </view>
        <view class="status-indicator">
          <view class="status-item">
            <view class="status-color normal"></view>
            <text class="status-text">正常</text>
          </view>
          <view class="status-item">
            <view class="status-color terminated"></view>
            <text class="status-text">已终止</text>
          </view>
        </view>
        <view class="bill-actions">
          <button class="btn-add-process" @click="addProcess">添加工序</button>
        </view>
      </view>

      <!-- 订单详细信息 -->
      <view class="bill-detail">
        <view class="detail-row">
          <view class="detail-item">
            <view class="detail-label">产品名称：</view>
            <view class="detail-value name">{{ productInfo.name || '-' }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">生产编号：</view>
            <view class="detail-value">{{ productInfo.productionCode || '-' }}</view>
          </view>
        </view>
        <view class="detail-row">
          <view class="detail-item">
            <view class="detail-label">订单数量：</view>
            <view class="detail-value">{{ productInfo.orderCount === 0 || productInfo.orderCount ? productInfo.orderCount : '-' }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">生产状态：</view>
            <view class="detail-value status">{{ productInfo.productionStatus || '-' }}</view>
          </view>
        </view>
        <view class="detail-row">
          <view class="detail-item full">
            <view class="detail-label">规格型号：</view>
            <view class="detail-value">{{ productInfo.models || '-' }}</view>
          </view>
        </view>
      </view>

      <!-- 工序进度展示 -->
      <view class="processes-section" v-if="processList.length > 0">
        <view class="processes-container">
          <view v-for="(process, index) in processList" :key="process.rowid || index" class="process-wrapper">
            <view
              class="process-item"
              :class="{
                'process-over': process.isOver == 1,
                'process-selected': selectedProcess?.rowid === process.rowid
              }"
              @click="selectProcess(process)"
            >
              <view class="process-sequence">{{ process.sequence || '' }}</view>
              <view class="progress-circle"
                :style="{
                  '--percent': Math.round(
                    (parseFloat(process.dispatchedCount) || 0) /
                    Math.max(
                      (parseFloat(process.allcount) || 0) ||
                      ((parseFloat(process.needCount) || 0) + (parseFloat(process.dispatchedCount) || 0)),
                      1
                    ) * 100
                  ) + '%'
                }">
                <view class="progress-inner">
                  <view class="progress-top">
                    {{ productInfo.orderCount }}
                  </view>
                  <view class="progress-divider"></view>
                  <view class="progress-bottom">
                    <text class="bottom-left">{{ process.allcount }}</text>
                    <view class="progress-bottom-divider"></view>
                    <text class="bottom-right">{{ process.finishCount || 0 }}</text>
                  </view>
                </view>
              </view>
              <text class="process-name">{{ process.processName }}</text>
            </view>
            <view v-if="index < processList.length - 1" class="connector"></view>
          </view>
        </view>
      </view>
      <view v-else class="no-process-tip">暂无工序</view>
    </view>

    <!-- 右下角刷新按钮 -->
    <view class="fab-refresh" @click="onManualRefresh">
      <text class="fab-refresh-text">⟳</text>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'

const { statusBarHeight } = useStatusBar()

/** 产品生产进度单 scd */
const WORKSHEET_SCD = 'scd'
const FIELD_ORDER_CODE = '690860b889796f37a2540994'
const FIELD_PRODUCTION_CODE = '69144a1454182012ca73966c'
const FIELD_NAME = '698197b03b5e707f84cec409'
const FIELD_ORDER_COUNT = '695e00ac9223cfe3a0c0aa7c'
const FIELD_PRODUCTION_STATUS = '6929116bf779440d044c5121'
const FIELD_MODELS = '6a0ab49fc03685667d66c376'

/** 派工单 paigongdan */
const WORKSHEET_PAIGONGDAN = 'paigongdan'

const productionCode = ref('')
const orderCode = ref('')
const productInfo = ref(null)
const processList = ref([])
const selectedProcess = ref(null) // 当前选中的工序

onLoad((options) => {
  const pc = options?.productionCode
    ? decodeURIComponent(String(options.productionCode)).trim()
    : ''
  if (!pc) {
    uni.showToast({ title: '缺少生产编号', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack({
        fail: () => uni.redirectTo({ url: '/pages/carftProduct/carftProduct' })
      })
    }, 800)
    return
  }

  productionCode.value = pc
  orderCode.value = options?.orderCode
    ? decodeURIComponent(String(options.orderCode)).trim()
    : ''

  loadData()
})

const loadData = async () => {
  uni.showLoading({ title: '加载中...' })
  try {
    await Promise.all([
      loadProductInfo(),
      loadProcessList()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const loadProductInfo = async () => {
  const filters = [
    {
      controlId: FIELD_PRODUCTION_CODE,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [productionCode.value]
    }
  ]

  if (orderCode.value) {
    filters.push({
      controlId: FIELD_ORDER_CODE,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [orderCode.value]
    })
  }

  const res = await callWorkflowListAPIPaged({
    worksheetId: WORKSHEET_SCD,
    filters,
    silent: true
  }, 1, 1)

  const rows = res.data || []
  if (rows.length > 0) {
    const item = rows[0]
    productInfo.value = {
      rowid: item.rowid || '',
      orderCode: item[FIELD_ORDER_CODE] || '',
      productionCode: item[FIELD_PRODUCTION_CODE] || '',
      name: item[FIELD_NAME] || '',
      orderCount: item[FIELD_ORDER_COUNT],
      productionStatus: item[FIELD_PRODUCTION_STATUS] || '',
      models: item[FIELD_MODELS] || ''
    }
  }
}

const loadProcessList = async () => {
  const filters = [
    {
      controlId: '691d6160535b29cbd5c6c0a9',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [productionCode.value]
    }
  ]

  if (orderCode.value) {
    filters.push({
      controlId: '6593b07ae97eb866a50eeba1',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [orderCode.value]
    })
  }

  const res = await callWorkflowListAPIPaged({
    worksheetId: WORKSHEET_PAIGONGDAN,
    filters,
    silent: true
  })

  const rows = res.data || []
  processList.value = rows.map(item => ({
    processName: item['656ffd1bba5ef3863bf3ec1e'] || '',
    needCount: item['690dc19f8d797ee211e7fc60'] || 0,
    finishCount: item['697c8b023b5e707f84ce02cc'] || 0,
    allcount: item['68099ac75d6fc47331574e82'] || 0,
    dispatchedCount: item['69840b633b5e707f84cf341e'] || 0,
    processOrder: item['6593b07ae97eb866a50eeba1'] || '',
    productcode: item['691d6160535b29cbd5c6c0a9'] || '',
    worktime: item['69211dac21066a9f124f62df'] || '',
    sequence: item['693a62040f64427fac25ae80'] || '',
    hourlyoutput: item['693a879a0f64427fac25da92'] || '',
    dailyoutput: item['69a96d623b5e707f84d380b6'] || '',
    rowid: item['rowid'] || '',
    isOver: item['6940f719c81c746aae8ede5d'],
    price: item['657b282cd13eaaec2c6606b5'] || 0,
    mold: item['695222a27a59e0522d853edf'] || ''
  })).sort((a, b) => {
    const seqA = parseFloat(a.sequence) || 0
    const seqB = parseFloat(b.sequence) || 0
    return seqA - seqB
  })
}

const selectProcess = (process) => {
  if (selectedProcess.value?.rowid === process.rowid) {
    selectedProcess.value = null
  } else {
    selectedProcess.value = process
  }
}

const addProcess = () => {
  if (!productInfo.value) {
    uni.showToast({ title: '产品信息未加载', icon: 'none' })
    return
  }

  const info = productInfo.value
  let selectedSequence = 1
  let processRowid = ''

  if (selectedProcess.value) {
    // 有选中工序：在选中工序后添加
    const currentSequence = parseFloat(selectedProcess.value.sequence || 0)
    selectedSequence = parseFloat((currentSequence + 0.01).toFixed(2))
    processRowid = selectedProcess.value.rowid || ''
  } else if (processList.value.length > 0) {
    // 无选中工序：在最后一个工序后添加
    const lastProcess = processList.value[processList.value.length - 1]
    const currentSequence = parseFloat(lastProcess.sequence || 0)
    selectedSequence = parseFloat((currentSequence + 0.01).toFixed(2))
    processRowid = lastProcess.rowid || ''
  }

  uni.navigateTo({
    url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(info.orderCode || '')}&productCode=${encodeURIComponent(info.productionCode || '')}&workshop=拉伸车间&selectedSequence=${selectedSequence}&billRowid=${encodeURIComponent(info.rowid || '')}&processRowid=${encodeURIComponent(processRowid)}&billType=${encodeURIComponent('正常排产')}`
  })
}

const onManualRefresh = () => {
  loadData()
}

const quit = () => {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/carftProduct/carftProduct' })
    }
  })
}
</script>

<style scoped lang="scss">
.product-detail-container {
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

  .bill-card {
    width: 98%;
    background-color: #fff;
    border-radius: px2vw(18px);
    margin: px2vw(15px);
    padding: px2vw(15px);
    box-sizing: border-box;

    .bill-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: px2vw(15px);

      .order-info {
        display: flex;
        align-items: center;
        gap: px2vw(10px);

        .order-label {
          background-color: #5884f1;
          color: white;
          padding: px2vw(6px) px2vw(12px);
          border-radius: px2vw(8px);
          font-size: px2vw(22px);
          font-weight: bold;
        }

        .order-number {
          font-size: px2vw(26px);
          color: #333;
          font-weight: 500;
        }
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: px2vw(16px);

        .status-item {
          display: flex;
          align-items: center;
          gap: px2vw(6px);

          .status-color {
            width: px2vw(16px);
            height: px2vw(16px);
            border-radius: 50%;

            &.normal {
              background-color: #4CAF50;
            }

            &.terminated {
              background-color: #f44336;
            }
          }

          .status-text {
            font-size: px2vw(20px);
            color: #666;
          }
        }
      }

      .bill-actions {
        .btn-add-process {
          margin: 0;
          padding: px2vw(16px) px2vw(36px);
          background-color: #28a745;
          color: #fff;
          font-size: px2vw(28px);
          border-radius: px2vw(10px);
          border: none;
          line-height: 1.4;
          font-weight: bold;
        }
      }
    }

    .bill-detail {
      .detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: px2vw(20px);
        margin-bottom: px2vw(10px);

        &:last-child {
          margin-bottom: 0;
        }

        .detail-item {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;

          &.full {
            width: 100%;
          }

          .detail-label {
            color: #666;
            font-size: px2vw(24px);
            white-space: nowrap;
            flex-shrink: 0;
            margin-right: px2vw(6px);
          }

          .detail-value {
            color: #333;
            font-size: px2vw(24px);
            flex: 1;
            word-break: break-all;

            &.name {
              color: #ff4d4f;
              font-weight: 500;
            }

            &.status {
              color: #d46b08;
            }
          }
        }
      }
    }

    .processes-section {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: px2vw(20px);
      padding: 0 px2vw(20px);
      box-sizing: border-box;
    }

    .processes-container {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
      flex-wrap: wrap;
      gap: px2vw(10px);
    }

    .process-wrapper {
      display: flex;
      align-items: center;
      margin: 0;
    }

    .process-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 0;
      position: relative;
      padding: px2vw(11px);
      border-radius: px2vw(12px);
      min-width: px2vw(200px);
      width: px2vw(200px);
      box-sizing: border-box;

      &.process-over {
        .process-sequence {
          color: #f44336 !important;
        }

        .progress-circle {
          background: conic-gradient(#f44336 0%, #f44336 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%) !important;
        }

        .process-name {
          color: #f44336 !important;
        }
      }

      &.process-selected {
        border: px2vw(3px) solid #2196F3;
        background-color: rgba(33, 150, 243, 0.08);
      }
    }

    .process-sequence {
      font-size: px2vw(24px);
      font-weight: bold;
      color: #4CAF50;
      margin-bottom: px2vw(5px);
      min-height: px2vw(30px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-circle {
      width: px2vw(150px);
      height: px2vw(150px);
      border-radius: 50%;
      background: conic-gradient(#4CAF50 0%, #4CAF50 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .progress-inner {
      position: absolute;
      width: 88%;
      height: 88%;
      border-radius: 50%;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: px2vw(12px);
      top: 6%;
      left: 6%;
      padding: px2vw(6px) px2vw(4px);
      box-sizing: border-box;
      gap: px2vw(4px);
    }

    .progress-top {
      text-align: center;
      font-size: px2vw(18px);
      font-weight: bold;
      color: #333;
    }

    .progress-divider {
      width: 100%;
      min-height: 2px;
      height: 2px;
      background-color: #ccc;
      flex-shrink: 0;
    }

    .progress-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: px2vw(18px);
      color: #555;
      width: 100%;
    }

    .progress-bottom-divider {
      width: 2px;
      min-width: 2px;
      align-self: stretch;
      min-height: px2vw(14px);
      background-color: #ccc;
      flex-shrink: 0;
    }

    .bottom-left,
    .bottom-right {
      flex: 1;
      text-align: center;
      font-size: px2vw(18px);
    }

    .process-name {
      margin-top: px2vw(10px);
      font-size: px2vw(24px);
      color: #555;
      text-align: center;
      max-width: px2vw(150px);
      word-break: break-word;
    }

    .connector {
      width: px2vw(30px);
      height: px2vw(3px);
      background-color: #ccc;
      margin: 0 px2vw(8px) 0 px2vw(10px);
      position: relative;
      top: px2vw(-10px);
    }

    .no-process-tip {
      text-align: center;
      color: #999;
      font-size: px2vw(26px);
      padding: px2vw(40px) 0;
    }
  }

  .fab-refresh {
    position: fixed;
    right: px2vw(30px);
    bottom: px2vw(30px);
    width: px2vw(90px);
    height: px2vw(90px);
    border-radius: 50%;
    background-color: #5884f1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 px2vw(4px) px2vw(12px) rgba(0, 0, 0, 0.3);
    z-index: 100;

    .fab-refresh-text {
      font-size: px2vw(40px);
      color: white;
    }
  }
}
</style>
