<template>
  <view class="selectProduct-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 导航栏（与选择订单页面一致） -->
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">
        选择产品
      </view>
      <view></view>
    </view>

    <!-- 搜索区域：销售订单 + 订单物品 + 查询按钮 -->
    <view class="search-box">
      <view class="salesOrder">
        <text class="salesOrder-text">销售订单</text>
        <view class="input-box">
          <input
            type="text"
            v-model="searchForm.salesOrder"
            placeholder="请输入销售订单"
          />
        </view>
      </view>

      <view class="orderItem">
        <text class="orderItem-text">订单物品</text>
        <view class="input-box">
          <input
            type="text"
            v-model="searchForm.orderItem"
            placeholder="请输入订单物品"
          />
        </view>
      </view>

      <view class="btn-item search-btn" @click="search">查询</view>
    </view>

    <!-- 单据列表：在选择订单基础上，展示订单编号 + 客户名称 + 产品名称 + 规格型号 -->
    <view class="orderList">
      <view
        class="orderItem"
        v-for="item in billsList"
        :key="item.productionCode || item.productCode || (item.orderCode + '-' + item.name)"
        @click="selectProductItem(item)"
      >
        <view class="goodsInfo">
          <!-- 第一行：订单编号 + 客户名称 + 产品名称 -->
          <view class="row-top">
            <view class="col col-left">
              <text class="label">订单编号：</text>
              <text class="value">{{ item.orderCode }}</text>
            </view>
            <view class="col col-center">
              <text class="label">客户名称：</text>
              <text class="value">{{ item.customerName || '-' }}</text>
            </view>
            <view class="col col-right">
              <text class="label">产品名称：</text>
              <text class="value">{{ item.name || '-' }}</text>
            </view>
          </view>
          <!-- 第二行：规格型号，占整行，允许换行 -->
          <view class="row-bottom">
            <text class="label">规格型号：</text>
            <text class="value value-models">{{ item.models || '-' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import { callWorkflowListAPIPaged } from '../../utils/workflow'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

// 车间：与派工、选择订单页面保持一致
const workshop = ref('拉伸车间')
// 排产类型固定为正常排产（与选择订单页面一致）
const billTypeFilter = '正常排产'

// 由选择订单页面带入的订单编号，用于接口筛选
const selectedOrderCode = ref('')

const billsList = ref([])
const searchForm = ref({
  salesOrder: '',
  orderItem: ''
})

onLoad((options) => {
  // 优先从登录权限取车间
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = userStore.loginLimits
  } else if (options && options.workshop) {
    workshop.value = options.workshop
  }

  // 从选择订单页面带入订单编号，并赋值到搜索栏
  if (options && options.orderCode) {
    const orderCode = decodeURIComponent(options.orderCode)
    selectedOrderCode.value = orderCode
    searchForm.value.salesOrder = orderCode
  }

  // 进入页面后立即根据当前条件获取数据
  search()
})

onShow(() => {
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = userStore.loginLimits
  }
})

// 获取单据原始数据（与选择订单接口一致，但增加订单编号筛选）
const getBillsListRaw = async () => {
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
      values: [billTypeFilter]
    }
  ]

  // 接口级别增加订单编号筛选（由选择订单页面带入）
  if (selectedOrderCode.value) {
    filters.push({
      controlId: '655e1cbbbd2094b316347f92', // 订单编号字段
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedOrderCode.value]
    })
  }

  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paichanjihua',
    filters
  })
  return res
}

const search = async () => {
  const billsRes = await getBillsListRaw()
  if (!billsRes.data || billsRes.data.length === 0) {
    billsList.value = []
    return
  }

  // 与其他页面保持一致的固定过滤：
  // 66974cda2503723eec1af600 不为空 / 不为 []，且 69a8e4563b5e707f84d33c0c > 0
  const filteredData = billsRes.data.filter(item => {
    const val = item['66974cda2503723eec1af600']
    if (
      val == null ||
      val === '' ||
      String(val).trim() === '' ||
      val === '[]'
    ) {
      return false
    }
    const num = Number(item['69a8e4563b5e707f84d33c0c'])
    return !Number.isNaN(num) && num > 0
  })

  if (!filteredData.length) {
    billsList.value = []
    return
  }

  // 单条维度展示：订单编号 + 客户名称 + 产品名称 + 规格型号
  let list = filteredData.map(item => {
    const orderCode = item['655e1cbbbd2094b316347f92'] || ''
    const customerName = item['69a8ed3c3b5e707f84d33f8b'] || ''
    const name = item['6937d255ff2b019b3cb34be3'] || ''
    const models = item['6937d255ff2b019b3cb34be4'] || ''

    return {
      orderCode,
      customerName,
      name,
      models,
      productionCode: item['698438933b5e707f84cf51fd'] || '',
      productCode: item['691d6336535b29cbd5c6c0ca'] || ''
    }
  })

  // 前端模糊过滤：销售订单 -> orderCode，订单物品 -> name
  const salesOrderKeyword = (searchForm.value.salesOrder || '').trim().toLowerCase()
  const orderItemKeyword = (searchForm.value.orderItem || '').trim().toLowerCase()

  if (salesOrderKeyword || orderItemKeyword) {
    list = list.filter(item => {
      const orderCodeStr = (item.orderCode || '').toString().toLowerCase()
      const nameStr = (item.name || '').toString().toLowerCase()

      const matchSalesOrder = !salesOrderKeyword || orderCodeStr.includes(salesOrderKeyword)
      const matchOrderItem = !orderItemKeyword || nameStr.includes(orderItemKeyword)

      return matchSalesOrder && matchOrderItem
    })
  }

  billsList.value = list
}

// 返回选择订单页面
const quit = () => {
  uni.redirectTo({
    url: '/pages/selectBills/selectBills'
  })
}

// 选择产品后，跳转到派工页面，并将物品名称传过去
const selectProductItem = (item) => {
  uni.navigateTo({
    url: `/pages/dispatchWork/dispatchWork?workshop=${encodeURIComponent(
      workshop.value
    )}&orderCode=${encodeURIComponent(item.orderCode || '')}&orderItem=${encodeURIComponent(
      item.name || ''
    )}`
  })
}
</script>

<style scoped lang="scss">
.selectProduct-container {
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
      margin-right: px2vw(80px);
      font-size: px2vw(35px);
      color: white;
    }
  }

  .search-box {
    display: flex;
    align-items: center;
    width: 100%;
    background-color: #fff;
    height: px2vw(100px);
    padding: px2vw(15px) px2vw(20px);
    margin: px2vw(10px);
    border-radius: px2vw(18px);
    box-sizing: border-box;
    gap: px2vw(10px);

    .salesOrder,
    .orderItem {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .salesOrder-text,
    .orderItem-text {
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
      padding: 0 px2vw(30px);

      input {
        font-size: px2vw(25px);
        width: 100%;
      }
    }

    .search-btn {
      flex-shrink: 0;
      margin-left: px2vw(10px);
      margin-right: 0;
      width: auto;
      min-width: px2vw(260px);
      height: px2vw(80px);
      padding: px2vw(16px) px2vw(25px);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(18px);
      color: #fff;
      background-color: #2755f1;
      font-size: px2vw(25px);
    }
  }

  .orderList {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    .orderItem {
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(15px);
      padding: px2vw(15px);

      .goodsInfo {
        display: flex;
        flex-direction: column;
        font-size: px2vw(25px);
        gap: px2vw(10px);

        .row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
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
            flex: 1.2;
            justify-content: flex-start;
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
  }
}
</style>
