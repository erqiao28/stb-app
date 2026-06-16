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
              <text class="process-extra" v-if="getProcessExtraInfo(process)">{{ getProcessExtraInfo(process) }}</text>
            </view>
            <view v-if="index < processList.length - 1" class="connector"></view>
          </view>
        </view>
      </view>
      <view v-else class="no-process-tip">暂无工序</view>
    </view>

    <!-- 右下角浮动按钮 -->
    <view class="fab-refresh" @click="onManualRefresh">
      <text class="fab-refresh-text">&#x27F3;</text>
    </view>
    <view class="fab-action" :class="{ 'fab-action--disabled': !selectedProcess }" @click="openActionModal">
      <text class="fab-action-text">&#x2699;</text>
    </view>

    <!-- 操作工序模态框 -->
    <view class="action-modal" v-if="showActionModal" @click.self="closeActionModal">
      <view class="action-modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">操作工序</text>
          <view class="modal-close" @click="closeActionModal">&times;</view>
        </view>

        <view class="modal-body">
          <!-- 当前选中工序信息 -->
          <view class="selected-process-info" v-if="selectedProcess">
            <text class="selected-process-name">{{ selectedProcess.processName || '-' }}</text>
          </view>

          <!-- 搜索 -->
          <view class="filter-bar">
            <view class="search-box">
              <input type="text" placeholder="请输入工序名称" v-model="modalSearchValue" @input="handleModalSearch" />
            </view>
          </view>

          <!-- 主要内容区域 -->
          <view class="main-content">
            <!-- 左侧：工序列表 -->
            <view class="table-section">
              <scroll-view scroll-y class="table-content" @scrolltolower="loadModalMore" lower-threshold="50">
                <view class="table">
                  <view class="table-header-row">
                    <view class="table-header-cell">工序名称</view>
                  </view>
                  <view v-for="item in modalTableData" :key="item.rowid" class="table-body-row" :class="{ selected: modalSelectedProcess?.rowid === item.rowid }" @click="selectModalProcess(item)">
                    <view class="uni-table-td">{{ item.processName }}</view>
                  </view>
                  <view v-if="modalLoading && modalTableData.length > 0" class="loading-row">
                    <view class="loading-text">加载中...</view>
                  </view>
                  <view v-if="!modalHasMore && modalTableData.length > 0" class="no-more-row">
                    <view class="loading-text">没有更多数据了</view>
                  </view>
                </view>
              </scroll-view>
            </view>

            <!-- 右侧：输入框 -->
            <view class="input-section">
              <view class="input-group">
                <view class="input-label">生产顺序</view>
                <input type="number" class="process-input" placeholder="请输入生产顺序" v-model="modalProductionSequence" step="0.01" disabled />
              </view>
              <view class="input-group">
                <view class="input-label">修改方式</view>
                <picker mode="selector" :range="modifyModeOptions" :value="modalModifyModeIndex" @change="onModalModifyModeChange" class="picker-wrapper">
                  <view class="process-input date-picker">{{ modifyModeOptions[modalModifyModeIndex] }}</view>
                </picker>
              </view>

            </view>
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-delete" @click="deleteSelectedProcess">删除</button>
          <view class="modal-footer-right">
            <button class="btn-cancel" @click="closeActionModal">取消</button>
            <button class="btn-confirm" @click="confirmAction">确定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import http from '../../utils/request.js'
import { showToast } from '../../utils/request.js'
import { OPERATE_PROCESS_URL, DELETE_PROCESS_URL } from '../../utils/api'

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
const selectedProcess = ref(null)

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
    mold: item['695222a27a59e0522d853edf'] || '',
    perMinute: item['6a0bfcccc03685667d6787bf'] || '',
    timeMachine: item['6a0bfcccc03685667d6787c0'] || '',
    timeHuman: item['6a0bfcccc03685667d6787c1'] || '',
    timeMinute: item['6a0bfcccc03685667d6787c2'] || ''
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

const getProcessExtraInfo = (process) => {
  const perMinute = String(process.perMinute || '').trim()
  const timeMachine = String(process.timeMachine || '').trim()
  const timeHuman = String(process.timeHuman || '').trim()
  const timeMinute = String(process.timeMinute || '').trim()
  const dailyOutput = String(process.dailyoutput || '').trim()

  if (perMinute) {
    return `(${perMinute})`
  } else if (timeMachine && timeHuman) {
    return `(${timeMachine}+${timeHuman})`
  } else if (timeMinute) {
    return `(${timeMinute})`
  } else if (dailyOutput) {
    return `(${dailyOutput})`
  }
  return ''
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

// ==================== 操作工序模态框 ====================
const showActionModal = ref(false)
const modalSearchValue = ref('')
const modalTableData = ref([])
const modalCurrentPage = ref(1)
const modalPageSize = ref(10)
const modalHasMore = ref(true)
const modalLoading = ref(false)
const modalSelectedProcess = ref(null)
const modalProductionSequence = ref('')
const modifyModeOptions = ref(['添加', '替换'])
const modalModifyModeIndex = ref(0)

const openActionModal = () => {
  // 必须选中一个工序才能打开模态框
  if (!selectedProcess.value) {
    uni.showToast({ title: '请先选择一个工序', icon: 'none' })
    return
  }
  showActionModal.value = true
  // 初始化默认值
  modalSearchValue.value = ''
  modalSelectedProcess.value = null
  modalModifyModeIndex.value = 0
  // 计算生产顺序：在选中的工序后添加
  const currentSequence = parseFloat(selectedProcess.value.sequence || 0)
  const selectedSequence = parseFloat((currentSequence + 0.01).toFixed(2))
  modalProductionSequence.value = selectedSequence.toFixed(2)
  // 加载工序列表
  loadModalProcessList(1, true)
}

const closeActionModal = () => {
  showActionModal.value = false
}

const handleModalSearch = () => {
  loadModalProcessList(1, true)
}

const loadModalMore = () => {
  if (!modalHasMore.value || modalLoading.value) return
  loadModalProcessList(modalCurrentPage.value + 1, false)
}

const loadModalProcessList = async (pageNum, isRefresh = false) => {
  if (modalLoading.value) return
  modalLoading.value = true

  const baseFilters = [
    { controlId: '6614d7ed1f7f1264f3a332c3', dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
    { controlId: '66b07c4a965ba588586ec783', dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] }
  ]

  let filters = [...baseFilters]
  const nameSearch = modalSearchValue.value.trim()
  if (nameSearch) {
    filters.push({
      controlId: '6614b6721103c1d5d3a08122',
      dataType: 30,
      spliceType: 1,
      filterType: 1,
      values: [nameSearch]
    })
  }

  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'shujuzidian',
      filters
    }, modalPageSize.value, pageNum)

    let mappedData = (res.data || []).map(item => ({
      processName: item['Name'],
      rowid: item['rowid'] || ''
    }))

    if (isRefresh) {
      modalTableData.value = mappedData
    } else {
      modalTableData.value.push(...mappedData)
    }

    modalCurrentPage.value = pageNum
    modalHasMore.value = mappedData.length === modalPageSize.value && (res.total || 0) > modalTableData.value.length
  } finally {
    modalLoading.value = false
  }
}

const selectModalProcess = (item) => {
  modalSelectedProcess.value = item
}

const onModalModifyModeChange = (e) => {
  modalModifyModeIndex.value = Number(e.detail.value) || 0
}

const confirmAction = async () => {
  // 必须选中模态框中的一个工序
  if (!modalSelectedProcess.value) {
    uni.showToast({ title: '请选择一个工序', icon: 'none' })
    return
  }

  const params = {
    processName: modalSelectedProcess.value.processName || '',
    sequence: parseFloat(modalProductionSequence.value) || 0,
    modifyMode: modifyModeOptions.value[modalModifyModeIndex.value] || '添加',
    selectedProcessId: selectedProcess.value?.rowid || '',
    productionCode: productionCode.value || ''
  }

  console.log('【操作工序】请求参数:', JSON.stringify(params))
  console.log('【操作工序】请求URL:', OPERATE_PROCESS_URL)

  uni.showLoading({ title: '提交中...', mask: true })
  try {
    const res = await http.post(OPERATE_PROCESS_URL, params)
    console.log('【操作工序】响应结果:', JSON.stringify(res))

    // 检查接口返回的业务状态
    if (res && (res.status === 0 || res.success === true || res.code === 200 || res.data)) {
      uni.showToast({ title: '操作成功', icon: 'success' })
      closeActionModal()
      // 清空选中状态并刷新
      selectedProcess.value = null
      setTimeout(() => {
        loadData()
      }, 1000)
    } else if (res && res.message) {
      uni.showToast({ title: res.message, icon: 'none' })
    } else if (res && res.msg) {
      uni.showToast({ title: res.msg, icon: 'none' })
    } else {
      uni.showToast({ title: '操作失败', icon: 'none' })
    }
  } catch (error) {
    console.error('【操作工序】请求异常:', error)
    uni.showToast({ title: '网络错误:' + (error.message || ''), icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 删除选中的工序
const deleteSelectedProcess = async () => {
  const processRowid = selectedProcess.value?.rowid || ''
  if (!processRowid) {
    uni.showToast({ title: '工序ID不存在', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除工序「${selectedProcess.value?.processName || ''}」吗？删除后无法恢复。`,
    confirmText: '删除',
    cancelText: '取消',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        uni.showLoading({ title: '删除中...' })
        try {
          const result = await http.post(DELETE_PROCESS_URL, {
            rowid: processRowid
          })
          uni.hideLoading()

          if (result.status === 1) {
            uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
            return
          }

          uni.showToast({ title: '删除成功' })
          closeActionModal()
          // 清空选中状态
          selectedProcess.value = null
          setTimeout(() => {
            loadData()
          }, 1000)
        } catch (error) {
          uni.hideLoading()
          console.error('删除工序失败:', error)
          uni.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' })
        }
      }
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
      font-weight: bold;
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

    .process-extra {
      margin-top: px2vw(5px);
      font-size: px2vw(24px);
      color: #5884f1;
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
    bottom: px2vw(140px);
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

  .fab-action {
    position: fixed;
    right: px2vw(30px);
    bottom: px2vw(30px);
    width: px2vw(90px);
    height: px2vw(90px);
    border-radius: 50%;
    background-color: #28a745;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 px2vw(4px) px2vw(12px) rgba(0, 0, 0, 0.3);
    z-index: 100;

    .fab-action-text {
      font-size: px2vw(40px);
      color: white;
    }
  }

  // 操作工序模态框
  .action-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: px2vw(30px);

    .action-modal-content {
      width: 100%;
      max-width: px2vw(1400px);
      height: 85vh;
      background-color: #fff;
      border-radius: px2vw(18px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      height: px2vw(100px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 px2vw(30px);
      background-color: #5884f1;
      flex-shrink: 0;

      .modal-title {
        font-size: px2vw(35px);
        color: white;
        font-weight: bold;
      }

      .modal-close {
        font-size: px2vw(50px);
        color: white;
        line-height: 1;
        padding: px2vw(10px);
      }
    }

    .modal-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: px2vw(20px);

      .selected-process-info {
        display: flex;
        align-items: center;
        gap: px2vw(10px);
        padding: px2vw(12px) px2vw(16px);
        background-color: #e8f4fc;
        border: px2vw(2px) solid #b3d9f7;
        border-radius: px2vw(10px);
        margin-bottom: px2vw(15px);
        flex-shrink: 0;
        flex-wrap: wrap;

        .selected-process-name {
          font-size: px2vw(28px);
          color: #2755f1;
          font-weight: bold;
        }
      }
    }

    .modal-footer {
      height: px2vw(120px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: px2vw(20px);
      padding: 0 px2vw(30px);
      border-top: px2vw(2px) solid #e0e0e0;
      flex-shrink: 0;

      .btn-delete {
        height: px2vw(80px);
        padding: 0 px2vw(50px);
        border-radius: px2vw(12px);
        font-size: px2vw(28px);
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background-color: #f44336;
        color: white;
      }

      .modal-footer-right {
        display: flex;
        align-items: center;
        gap: px2vw(20px);
      }

      .btn-cancel,
      .btn-confirm {
        height: px2vw(80px);
        padding: 0 px2vw(50px);
        border-radius: px2vw(12px);
        font-size: px2vw(28px);
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
      }

      .btn-cancel {
        background-color: #e0e0e0;
        color: #333;
      }

      .btn-confirm {
        background-color: #5884f1;
        color: white;
      }
    }
  }

  // 模态框内样式（模仿添加工序页面）
  .filter-bar {
    display: flex;
    align-items: center;
    gap: px2vw(15px);
    margin-bottom: px2vw(15px);
    flex-shrink: 0;

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      background-color: #fff;
      border: px2vw(2px) solid #e0e0e0;
      border-radius: px2vw(12px);
      padding: 0 px2vw(20px);
      height: px2vw(80px);
      min-width: 0;

      input {
        width: 100%;
        height: px2vw(80px);
        border: none;
        outline: none;
        font-size: px2vw(28px);
        background: transparent;
      }
    }
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: px2vw(15px);
  }

  .table-section {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: px2vw(2px) solid #e0e0e0;
    border-radius: px2vw(12px);

    .table-content {
      height: 100%;
    }

    .table {
      width: 100%;
    }

    .table-header-row {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: px2vw(80px);
      background-color: #b0b0b0;
      font-weight: bold;
      font-size: px2vw(28px);
    }

    .table-body-row {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: px2vw(80px);
      font-size: px2vw(26px);
      border-bottom: px2vw(1px) solid #e0e0e0;

      &:nth-of-type(odd) {
        background-color: #f5f5f5;
      }

      &:nth-of-type(even) {
        background-color: white;
      }

      &.selected {
        background-color: #007AFF !important;
        color: white !important;
      }
    }

    .loading-row,
    .no-more-row {
      min-height: px2vw(60px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-text {
      font-size: px2vw(24px);
      color: #999;
    }
  }

  .input-section {
    flex: 0 0 px2vw(400px);
    display: flex;
    flex-direction: column;
    gap: px2vw(15px);
    padding: px2vw(20px);
    background-color: #f5f5f5;
    border-radius: px2vw(12px);

    .input-group {
      display: flex;
      flex-direction: column;
      gap: px2vw(8px);

      .input-label {
        font-size: px2vw(26px);
        font-weight: bold;
        color: #333;
      }

      .process-input {
        height: px2vw(70px);
        padding: 0 px2vw(20px);
        border: px2vw(2px) solid #e0e0e0;
        border-radius: px2vw(10px);
        font-size: px2vw(26px);
        background-color: #fff;
        box-sizing: border-box;

        &:disabled {
          background-color: #f0f0f0;
          color: #999;
        }
      }

      .date-picker {
        display: flex;
        align-items: center;
        color: #333;
      }

      .picker-wrapper {
        width: 100%;
      }
    }
  }
}
</style>
