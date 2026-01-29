<template>
  <view class="process-container" @click="closeWorkshopOptions" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- ==================== 模态框组件 ==================== -->
    
    <!-- 车间选择模态框 -->
    <Radiobox v-model="workshop" :options="workshopOptions" title="车间" v-model:visible="showWorkshopModal"
      @confirm="handleWorkshopConfirm" />
    
    <!-- 机台选择模态框 -->
    <MachineRadiobox v-model="machine" :options="machineOptions" title="选择机台" v-model:visible="showMachineModal"
      @confirm="handleMachineConfirm" />
    
    <!-- 添加员工模态框 -->
    <AddWorkerRadiobox v-model="selectedEmployeesForAdd" :options="allEmployeesOptions" title="添加员工" 
      :visible="showAddEmployeeModal" @update:visible="handleAddEmployeeModalClose" @confirm="handleAddEmployeeConfirm"
      :workshopOptions="workshopOptions" :workshop="modalWorkshop" @update:workshop="onModalWorkshopChange" />
    
    <!-- 图片预览模态框（多图轮播） -->
    <view class="image-preview-modal" v-if="showImagePreview" @click="closeImagePreview" :style="{ paddingTop: statusBarHeight + 'px' }">
      <button class="btn-close" @click="closeImagePreview">关闭</button>
      <view class="preview-content" @click.stop>
        <swiper
          v-if="previewImageUrls.length > 0"
          class="preview-swiper"
          :current="previewImageIndex"
          @change="onPreviewSwiperChange"
          :indicator-dots="previewImageUrls.length > 1"
          indicator-active-color="#5884f1"
          indicator-color="rgba(255,255,255,0.5)"
        >
          <swiper-item v-for="(url, idx) in previewImageUrls" :key="idx">
            <view class="swiper-item-inner">
              <image
                :src="url"
                class="preview-image"
                mode="aspectFit"
                :lazy-load="false"
                @error="handleImageError"
              />
            </view>
          </swiper-item>
        </swiper>
      </view>
    </view>
    
    <!-- 终止派工模态框 -->
    <view class="terminate-modal" v-if="showTerminateModal" @click.self="closeTerminateModal">
      <view class="terminate-content" @click.stop>
        <view class="terminate-body">
          <view class="terminate-tip">
            确定要终止工序“{{ selectedProcessData?.process?.processName || '' }}”吗？
          </view>
          <view class="form-group">
            <text class="label">终止原因：</text>
            <textarea 
              v-model="terminateReason" 
              placeholder="请输入终止原因" 
              class="terminate-textarea"
              maxlength="200"
            />
          </view>
        </view>
        <view class="terminate-footer">
          <button class="btn-cancel" @click="closeTerminateModal">取消</button>
          <button class="btn-confirm" @click="confirmTerminate" :disabled="!terminateReason || !terminateReason.trim()">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 工序派工模态框 -->
    <view class="process-modal" v-if="showProcessModal" @click.self="closeProcessModal">
      <view class="process-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ selectedProcessData?.process?.processName }}(工序派工)</text>
          <view class="modal-close" @click="closeProcessModal">×</view>
        </view>
        
        <!-- 可滚动内容区域（包含表单信息和员工表格） -->
        <scroll-view scroll-y class="modal-scroll-content">
          <!-- 表单信息区域 -->
          <view class="modal-body">
            <!-- 订单编号和工序名称 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">订单编号：</text>
                <text class="value">{{ selectedProcessData?.item?.orderCode }}</text>
              </view>
              <view class="form-group">
                <text class="label">工序：</text>
                <text class="value">{{ selectedProcessData?.process?.processName }}</text>
              </view>
            </view>
            
            <!-- 已派工数量和待派工数量 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">已派工数量：</text>
                <text class="value">{{ selectedProcessData?.process?.finishCount }}</text>
              </view>
              <view class="form-group">
                <text class="label">需派工数量：</text>
                <text class="value">{{ selectedProcessData?.process?.needCount }}</text>
              </view>
            </view>
            
            <!-- 本次派工数量和时数 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">派工数量：</text>
                <input v-model.number="processDispatchData.quantity" type="number" placeholder="请输入数量"
                  :max="maxQuantity" min="0" class="input-field" />
              </view>
              <view class="form-group">
                <text class="label">派工工时：</text>
                <input v-model.number="processDispatchData.time" type="number" placeholder="自动计算" 
                  class="input-field" readonly />
              </view>
            </view>
            
            <!-- 机台和模具选择 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">机台：</text>
                <view class="value" @click="getMachineList">
                  {{ machine?.name || '请选择机台' }}
                </view>
              </view>
              <view class="form-group">
                <text class="label">模具：</text>
                <text class="value-readonly">{{ selectedProcessData?.process?.mold || '无' }}</text>
              </view>
            </view>
            
            <!-- 日期选择和最终工序 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">派工日期：</text>
                <picker mode="date" :value="processDispatchData.date" @change="onDateChange">
                  <view class="value">
                    {{ processDispatchData.date || '请选择日期' }}
                  </view>
                </picker>
              </view>
              <view class="form-group">
                <text class="label">最终工序：</text>
                <picker mode="selector" :range="isLastOptions" :value="isLastIndex" @change="onIsLastChange">
                  <view class="value">
                    {{ processDispatchData.isLast || '请选择最终工序' }}
                  </view>
                </picker>
              </view>
            </view>
            
            <!-- 计薪方式和工价 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">计薪方式：</text>
                <picker mode="selector" :range="salaryMethodOptions" :value="salaryMethodIndex" @change="onSalaryMethodChange">
                  <view class="value">
                    {{ processDispatchData.salaryMethod || '请选择计薪方式' }}
                  </view>
                </picker>
              </view>
              <view class="form-group">
                <text class="label">工价：</text>
                <input v-model.number="processDispatchData.price" type="number" placeholder="请输入工价"
                  min="0" step="0.01" class="input-field" />
              </view>
            </view>
          </view>
          
          <!-- 员工选择表格 -->
          <view class="employee-section">
            <view class="table-header">
              <view class="col selected">选中</view>
              <view class="col name">姓名</view>
              <view class="col totalHours">总工时数</view>
              <view class="col unrecordedHours">未派工时</view>
            </view>
            <checkbox-group @change="onEmployeeCheckboxChange" class="employee-table">
              <label v-for="emp in employeeList" :key="emp.id" class="table-row">
                <view class="col selected">
                  <checkbox :value="emp.id" :checked="isEmployeeSelected(emp.id)" />
                </view>
                <view class="col name">{{ emp.name }}</view>
                <view class="col totalHours">{{ emp.totalHours }} 时</view>
                <view class="col unrecordedHours">{{ emp.unrecordedHours }} 时</view>
              </label>
            </checkbox-group>
          </view>
        </scroll-view>
        
        <!-- 模态框底部按钮 -->
        <view class="modal-footer">
          <button class="btn-confirm" @click="addEmployee">添加员工</button>
          <button class="btn-confirm" @click="confirmProcessDispatch" :disabled="!canDispatch">确认派工</button>
          <button class="btn-confirm" :disabled="isProcessOver" @click="overProcess">终止</button>
          <button class="btn-delete-process" v-if="selectedProcessData?.item?.billType === '返工排产'" @click="deleteProcess">删除</button>
          <!-- <button class="btn-confirm">转派</button>
          <button class="btn-confirm">修改</button> -->
        </view>
      </view>
    </view>
    
    <!-- ==================== 页面主体内容 ==================== -->
    
    <!-- 导航栏 -->
    <view class="header">
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">
        派工( {{ userStore?.loginName || '' }} )
      </view>
      <view class="btn-box">
        <view class="btn-one" @click="userStore?.logout()">
          <image src="/static/Quit.svg"></image>
          <text>切换</text>
        </view>
        <view class="btn-one">
          <image src="/static/Quit.svg"></image>
          <text>退出</text>
        </view>
      </view>
    </view>
    
    <!-- 功能按钮栏 -->
    <view class="btn-list">
      <view class="btn-item" @click="goDispatchInquiry">派工查询</view>
      <view class="btn-item" @click="goWorkload">员工工作量查询</view>
      <view class="btn-item" @click="goWorkGuide">作业指导书</view>
    </view>
    
    <!-- 搜索区域 -->
    <view class="search-box">
      <view class="assemble">
        <view class="assemble-box" :class="{ 'assemble-box-disabled': isWorkshopLocked }" @click="!isWorkshopLocked && (showWorkshopModal = true)">
          {{ workshop }}
        </view>
      </view>
      <view class="selectDocument" @click="goSelectBills">选择正常单据</view>
      <view class="selectDocument" @click="goSelectReworkBills">选择返工单据</view>
      <view class="device">
        <view class="input-box">
          <input type="text" v-model="searchValue" placeholder="请输入客户或单据编码" @input="search" />
        </view>
      </view>
      <view class="scan">
        <image src="/static/scan.svg"></image>
      </view>
    </view>

    <!-- 单据列表 -->
    <view class="orderList" :key="listKey">
      <view class="orderItem" v-for="item in billsList" :key="item.orderCode">
        <view class="goodsInfo">
          <!-- 订单信息头部 -->
          <view class="goodsInfo-up">
            <view class="orderGoods">
              <view class="order-label">订单</view>
              <view class="order-number">{{ item.orderCode }}</view>
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
            <view class="buttons">
              <button class="btn-dispatch" @click="lookImage(item)">查看图片</button>
              <button class="btn-sop" @click="lookSop(item)">查看SOP</button>
              <button class="btn-detail" @click="dispatchWork(item)">操作</button>
              <button class="btn-delete" @click="addProcess(item)">添加工序</button>
              <button class="btn-normal-process" v-if="item.billType === '返工排产'" @click="useNormalProcess(item)">使用正常工序</button>
            </view>
          </view>
          
          <!-- 订单详细信息 -->
          <view class="goodsInfo-down">
            <view class="name">
              <view>产品名称：</view>
              <view>{{ item.name }}</view>
            </view>
            <view class="productCode">
              <view>生产执行单：</view>
              <view>{{ item.productionCode }}</view>
            </view>
            <view class="orderCount">
              <view>订单数量：</view>
              <view>{{ item.orderCount }}</view>
            </view>
          </view>
          
          <!-- 问题描述 -->
          <view class="problemDescription" v-if="item.problemDescription && item.problemDescription.trim()">
            <view>问题描述：</view>
            <view>{{ item.problemDescription }}</view>
          </view>
          
          <!-- 工序进度展示 -->
          <view class="processes-section" v-if="item.processes && item.processes.length > 0" :key="`processes-${item.orderCode}-${listKey}`">
            <view class="processes-container" :key="`container-${item.orderCode}-${listKey}`">
              <view v-for="(process, index) in item.processes" :key="`${item.orderCode}-${process.processName}-${index}-${listKey}`" class="process-wrapper">
                <view class="process-item" :class="{ 
                  'process-selected': isProcessSelected(item, process), 
                  'process-over': process.isOver == 1
                }">
                  <view class="process-sequence">{{ process.sequence || '' }}</view>
                  <view class="progress-circle"
                    :style="{ '--percent': Math.round((process.finishCount / Math.max((parseFloat(process.needCount) || 0) + (parseFloat(process.finishCount) || 0), 1)) * 100) + '%' }"
                    @click="selectProcess(item, process)">
                    <view class="progress-inner">
                      <view class="progress-text">{{ process.finishCount }}/{{ Math.round((parseFloat(process.needCount) || 0) + (parseFloat(process.finishCount) || 0)) }}</view>
                    </view>
                  </view>
                  <text class="process-name">{{ process.processName }}</text>
                </view>
                <view v-if="index < item.processes.length - 1" class="connector"></view>
              </view>
            </view>
          </view>
        </view>
        <view class="goodsProcess">
          <view class="bill-type-badge" 
            :class="{ 'badge-normal': item.billType === '正常排产', 'badge-rework': item.billType === '返工排产' }"
            v-if="item.billType">{{ item.billType }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// ==================== 导入部分 ====================
import {
  ref,
  computed,
  watch,
  nextTick
} from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import http from '../../utils/request'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { useUserStore } from '../../store/user.store'
import { useStatusBar } from '../../composables/useStatusBar'
import Radiobox from "../../component/radiobox/radiobox.vue"
import MachineRadiobox from "../../component/machineRadiobox/machineRadiobox.vue"
import AddWorkerRadiobox from "../../component/addWorkerRadiobox/addWorkerRadiobox.vue"

// ==================== Store和Composables ====================
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()

// ==================== 响应式数据定义 ====================

// ---------- 车间相关 ----------
const workshop = ref('拉伸车间')
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const isWorkshopLocked = ref(false) // 车间是否被锁定（不能修改）
const modalWorkshop = ref('') // 模态框中的车间选择
const modalWorkshopIndex = computed(() => {
  const index = workshopOptions.value.indexOf(modalWorkshop.value)
  return index >= 0 ? index : 0
})

// 获取当前日期（格式：YYYY-MM-DD）
const getCurrentDate = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// ---------- 机台相关 ----------
const machine = ref(null)
const machineOptions = ref([])
const showMachineModal = ref(false)

// ---------- 搜索和列表相关 ----------
const searchValue = ref('')
const billTypeFilter = ref('正常排产')  // 单据类型过滤参数：正常排产、返工排产（用于获取单据）
const billsList = ref([])
const processList = ref([])
const listKey = ref(0)

// ---------- 图片预览相关 ----------
const showImagePreview = ref(false)
const previewImageUrls = ref([])   // 多图预览的 URL 列表
const previewImageIndex = ref(0)  // 当前显示的图片下标

// ---------- 工序模态相关 ----------
const showProcessModal = ref(false)
const selectedProcessData = ref(null)
const selectedProcess = ref(null) // 当前选中的工序 { item, process }
const processDispatchData = ref({
  employee: '',
  quantity: 0,
  time: 0,
  machine: '',
  mold: '',
  date: '',
  salaryMethod: '计件',  // 计薪方式：计件、计时，默认值为计件
  price: 0,  // 工价
  isLast: '否'  // 最终工序：是、否，默认值为否
})

// 计薪方式选项
const salaryMethodOptions = ref(['计件', '计时'])
const salaryMethodIndex = ref(0)  // 默认选中第一个选项（计件）

// 最终工序选项
const isLastOptions = ref(['是', '否'])
const isLastIndex = ref(1)  // 默认选中第二个选项（否）

// ---------- 终止派工模态相关 ----------
const showTerminateModal = ref(false)
const terminateReason = ref('')

// ---------- 员工相关 ----------
const employeeList = ref([])
const selectedEmployee = ref([])
const showAddEmployeeModal = ref(false)
const selectedEmployeesForAdd = ref([])
const allEmployeesOptions = ref([])
const allEmployeesMap = ref({})

// ==================== 计算属性 ====================
// 最大派工数量：需派工数量
const maxQuantity = computed(() => {
  return selectedProcessData.value?.process?.needCount || 0
})

// 判断是否可以派工：只要需派工数量大于0就可以派工
const canDispatch = computed(() => {
  const needCount = selectedProcessData.value?.process?.needCount || 0
  return needCount > 0
})

// 判断当前工序是否已终止
const isProcessOver = computed(() => {
  return selectedProcessData.value?.process?.isOver === 1
})

// 打开终止派工模态框
const overProcess = () => {
  if (selectedProcessData.value?.process?.isOver === 1) {
    uni.showToast({ title: '该工序已终止', icon: 'none' })
    return
  }
  
  // 重置终止原因
  terminateReason.value = ''
  // 打开终止模态框
  showTerminateModal.value = true
}

// 关闭终止派工模态框
const closeTerminateModal = () => {
  showTerminateModal.value = false
  terminateReason.value = ''
}

// 确认终止工序
const confirmTerminate = async () => {
  // 验证终止原因
  if (!terminateReason.value || !terminateReason.value.trim()) {
    uni.showToast({ title: '请输入终止原因', icon: 'none' })
    return
  }
  
  try {
    const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk0NGRjYTI0NDUzNWFkMTg3ZWFiZmFj', {
      rowid: selectedProcessData.value?.process?.rowid || '',
      terminateReason: terminateReason.value.trim(),
      loginCode: userStore.loginCode || ''
    })
    
    if (result.status === 1) {
      uni.showToast({ title: '终止失败', icon: 'none' })
      return
    }
    
    uni.showToast({ title: '终止成功' })
    showTerminateModal.value = false
    showProcessModal.value = false
    terminateReason.value = ''
    // 刷新数据
    search()
  } catch (error) {
    console.error('终止工序失败:', error)
    uni.showToast({ title: '终止失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// ==================== 方法定义 ====================

// ---------- 车间相关方法 ----------
const handleWorkshopConfirm = (value) => {
  workshop.value = value
  showWorkshopModal.value = false
  search()
}

const closeWorkshopOptions = () => {
  // 空函数，防止warn
}

// ---------- 机台相关方法 ----------
const getMachineList = async () => {
  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'shebeidangan',
      filters: [
        {
          "controlId": "67ac0a87d6566fd9d09a2340",
          "dataType": 30,
          "spliceType": 1,
          "filterType": 2,
          "values": [workshop.value]
        }
      ]
    })
    if (!res.data || res.data.length === 0) {
      uni.showToast({ title: '无机台数据', icon: 'none' })
      return
    }
    machineOptions.value = res.data.map(item => ({
      workshop: item['67ac0a87d6566fd9d09a2340'] || '',
      code: item['63db6b67e134b5cd4f9f96bb'] || '',
      name: item['63db6b67e134b5cd4f9f96bc'] || '',
      value: item['63db6b67e134b5cd4f9f96bb'] || ''
    })).filter(item => item.value)
    showMachineModal.value = true
  } catch (error) {
    console.error('获取机台列表失败:', error)
    uni.showToast({ title: '获取机台列表失败', icon: 'none' })
  }
}

const handleMachineConfirm = (value) => {
  machine.value = value
  showMachineModal.value = false
}

// ---------- 搜索和列表相关方法 ----------
// 根据单据的billType获取对应的工序类型参数
const getProcessTypeParam = (billType) => {
  return billType === '返工排产' ? '返工派工' : '正常派工'
}

const getProcessRaw = async (searchVal = '', billTypeValue = '') => {
  // 根据单据的billType决定processTypeParam
  const processTypeParam = getProcessTypeParam(billTypeValue || '正常排产')
  
  const filters = [{
    "controlId": "669a6cae2503723eec1b49bb",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [workshop.value]
  }, {
    "controlId": "6954ad997a59e0522d85df35",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [processTypeParam]
  }]
  if (searchVal) {
    filters.push({
      "controlId": "6593b07ae97eb866a50eeba1",
      "dataType": 30,
      "spliceType": 1,
      "filterType": 2,
      "values": [searchVal]
    })
  }
  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paigongdan',
    filters
  })
  return res
}

const getBillsListRaw = async (searchVal = '') => {
  const filters = [{
    "controlId": "67de26c9c5377d50a523c735",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [workshop.value]
  },{
    "controlId": "694a3954687045435008a7c3",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [billTypeFilter.value]
  }]
  if (searchVal) {
    filters.push({
      "controlId": "655e1cbbbd2094b316347f92",
      "dataType": 30,
      "spliceType": 1,
      "filterType": 2,
      "values": [searchVal]
    })
  }
  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paichanjihua',
    filters
  })
  return res
}

const search = async () => {
  // 清除选中状态
  selectedProcess.value = null
  
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  
  // 先获取单据列表
  const billsRes = await getBillsListRaw(searchValue.value)
  
  if (billsRes.data.length === 0) {
    billsList.value = []
    processList.value = []
    return
  }

  // 根据每个单据的billType分别获取对应的工序
  const billTypes = [...new Set(billsRes.data.map(item => item['694a3954687045435008a7c3'] || '正常排产'))]
  const processPromises = billTypes.map(billType => getProcessRaw(searchValue.value, billType))
  const processResults = await Promise.all(processPromises)
  
  // 合并所有工序结果
  const allProcesses = processResults.flatMap(res => res.data.map(item => ({
    processName: item['656ffd1bba5ef3863bf3ec1e'],
    needCount: item['690dc19f8d797ee211e7fc60'],
    finishCount: item['690c794ccf407aa3d938ba28'],
    processOrder: item['6593b07ae97eb866a50eeba1'],
    worktime: item['69211dac21066a9f124f62df'],
    sequence: item['693a62040f64427fac25ae80'],
    hourlyoutput: item['693a879a0f64427fac25da92'],
    rowid: item['rowid'],
    isOver: item['6940f719c81c746aae8ede5d'],
    price: item['657b282cd13eaaec2c6606b5'],
    sonoutput: item['66974d062503723eec1af614'],
    mold: item['695222a27a59e0522d853edf']
  })))
  
  processList.value = allProcesses.map(item => ({ ...item }))

  const newBillsList = billsRes.data.map(item => {
    const orderGoods = item['691c47ee1c02c451c72a81c5']
    const orderCode = item['655e1cbbbd2094b316347f92']
    const billType = item['694a3954687045435008a7c3'] || '正常排产'
    const processes = processList.value.filter(p => p.processOrder === orderCode && p.sonoutput !== "[]")
      .sort((a, b) => {
        // 按sequence字段从小到大排序
        const seqA = a.sequence || 0
        const seqB = b.sequence || 0
        return seqA - seqB
      })
    
    let imageData = item['6683a0448d2110bec155ac64']
    if (typeof imageData === 'string' && imageData.trim()) {
      try {
        imageData = JSON.parse(imageData)
      } catch (e) {
        // 解析失败，保持原值
      }
    }

    const sop = item['697b206a3b5e707f84cd9c48']
    
    return {
      orderGoods,
      orderCount: item['681b0b53b139204fd264c5fd'],
      name: item['6937d255ff2b019b3cb34be3'],
      productionCode: item['691d6336535b29cbd5c6c0ca'],
      image: imageData,
      sop,
      completedProcess: processes.length > 0 ? `${processes.filter(p => p.finishCount === p.needCount).length}/${processes.length}` : '0',
      productCode: item['691d6336535b29cbd5c6c0ca'],
      processes: processes.map(p => ({ ...p })),
      orderCode,
      problemDescription: item['694ba108dc025d98887fd782'] || '', // 问题描述字段
      billRowid: item['rowid'],
      billType: billType // 单据类型
    }
  })
  
  billsList.value = []
  await nextTick()
  billsList.value = newBillsList
  listKey.value = Date.now()
  await nextTick()
}

const loadAllData = async () => {
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  
  await search()
}

// ---------- 图片 / SOP 相关方法 ----------
const lookImage = (item) => {
  let imageData = item?.image
  
  if (!imageData) {
    uni.showToast({ title: '暂无图片', icon: 'none' })
    return
  }
  
  if (typeof imageData === 'string') {
    try {
      imageData = JSON.parse(imageData)
    } catch (e) {
      uni.showToast({ title: '图片数据格式错误', icon: 'none' })
      return
    }
  }
  
  const imageArray = Array.isArray(imageData) ? imageData : (imageData ? [imageData] : [])
  
  if (!imageArray || imageArray.length === 0) {
    uni.showToast({ title: '暂无图片', icon: 'none' })
    return
  }
  
  // 从对象数组中提取所有 DownloadUrl，支持多图
  const urls = imageArray
    .map(img => img?.DownloadUrl)
    .filter(Boolean)
  
  if (urls.length === 0) {
    uni.showToast({ title: '图片地址不存在', icon: 'none' })
    return
  }
  
  previewImageUrls.value = urls
  previewImageIndex.value = 0
  showImagePreview.value = true
}

const lookSop = (item) => {
  let sop = item?.sop

  if (!sop) {
    uni.showToast({ title: '暂无SOP文件', icon: 'none' })
    return
  }

  // sop 可能是字符串或对象数组，这里统一转为数组处理
  if (typeof sop === 'string') {
    try {
      sop = JSON.parse(sop)
    } catch (e) {
      // 解析失败则当作单个对象或无效数据处理
    }
  }

  const sopArray = Array.isArray(sop) ? sop : (sop ? [sop] : [])
  if (!sopArray.length) {
    uni.showToast({ title: '暂无SOP文件', icon: 'none' })
    return
  }

  const first = sopArray[0] || {}
  // 优先使用 DownloadUrl，其次 original_file_full_path，最后 file_path + file_name 兜底
  let url = first.DownloadUrl || first.original_file_full_path || (first.file_path && first.file_name ? first.file_path + first.file_name : '')

  if (!url) {
    uni.showToast({ title: 'SOP文件地址不存在', icon: 'none' })
    return
  }

  // H5 环境下通过本地代理转发，去掉固定域名，避免 CORS；App 等其他端保留完整地址
  if (process.env.UNI_PLATFORM === 'h5') {
    const domainPrefix = 'https://www.dachen.vip'
    if (url.startsWith(domainPrefix)) {
      url = url.slice(domainPrefix.length)
    }
  }

  const fileName = first.original_file_name || first.file_name || 'SOP文件'

  uni.showLoading({ title: '正在打开SOP...' })

  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {
            // 打开成功，无需额外提示
          },
          fail: () => {
            uni.showToast({ title: '无法打开SOP文件', icon: 'none' })
            // APP 端兜底：尝试使用系统浏览器打开链接
            // #ifdef APP-PLUS
            try {
              plus.runtime.openURL(url)
            } catch (e) {
              // 兜底也失败就不再额外处理
            }
            // #endif
          },
          complete: () => {
            uni.hideLoading()
          }
        })
      } else {
        uni.hideLoading()
        uni.showToast({ title: 'SOP文件下载失败', icon: 'none' })
      }
    },
    fail: (err) => {
      uni.hideLoading()
      uni.showToast({ title: 'SOP文件下载失败', icon: 'none' })
    }
  })
}

const onPreviewSwiperChange = (e) => {
  previewImageIndex.value = e.detail?.current ?? 0
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrls.value = []
  previewImageIndex.value = 0
}

const handleImageError = (e) => {
  uni.showToast({ title: '图片加载失败', icon: 'none' })
}


// ---------- 工序模态相关方法 ----------
// 选择工序
const selectProcess = (item, process) => {
  // 如果点击的是已选中的工序，则取消选中
  if (isProcessSelected(item, process)) {
    selectedProcess.value = null
  } else {
    selectedProcess.value = { item, process }
  }
}

// 判断工序是否被选中
const isProcessSelected = (item, process) => {
  if (!selectedProcess.value) return false
  return selectedProcess.value.item.orderCode === item.orderCode && 
         selectedProcess.value.process.processName === process.processName
}

// 打开工序派工模态框
const openProcessModal = (item, process) => {
  selectedProcessData.value = { item, process }
  machine.value = null
  // 初始化日期为今天，格式：YYYY-MM-DD
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  // 初始化模态框车间为页面当前车间
  modalWorkshop.value = workshop.value
  
  processDispatchData.value = {
    employee: '',
    quantity: 0,
    time: 0,
    machine: '',
    mold: '',
    date: todayStr,
    salaryMethod: '计件',  // 默认值为计件
    price: process?.price || 0,  // 将工序的工价赋值给派工模态框
    isLast: '否'  // 默认值为否
  }
  salaryMethodIndex.value = 0  // 默认选中第一个选项（计件）
  isLastIndex.value = 1  // 默认选中第二个选项（否）
  selectedEmployee.value = []
  employeeList.value = []
  loadEmployees()
  showProcessModal.value = true
}

const closeProcessModal = () => {
  showProcessModal.value = false
  processDispatchData.value = { employee: '', quantity: 0, time: 0, machine: '', mold: '', date: '', salaryMethod: '计件', price: 0, isLast: '否' }
  machine.value = null
  employeeList.value = []
  selectedEmployee.value = []
  salaryMethodIndex.value = 0
  isLastIndex.value = 1
  modalWorkshop.value = ''  // 清空模态框车间选择
  // 关闭模态框后不清空选中状态，保持选中以便再次派工
}

// 日期选择变化处理
const onDateChange = (e) => {
  processDispatchData.value.date = e.detail.value
}

// 模态框车间选择变化处理
const onModalWorkshopChange = (value) => {
  modalWorkshop.value = value
  // 车间改变时，重新加载员工列表
  loadEmployees()
}

// 计薪方式选择变化处理
const onSalaryMethodChange = (e) => {
  salaryMethodIndex.value = e.detail.value
  processDispatchData.value.salaryMethod = salaryMethodOptions.value[e.detail.value]
}

// 最终工序选择变化处理
const onIsLastChange = (e) => {
  isLastIndex.value = e.detail.value
  processDispatchData.value.isLast = isLastOptions.value[e.detail.value]
}

const confirmProcessDispatch = async () => {
  // 检查是否可以派工
  if (!canDispatch.value) {
    uni.showToast({ title: '该工序需派工数量为0，无法派工', icon: 'none' })
    return
  }
  
  if (!processDispatchData.value.quantity || processDispatchData.value.quantity <= 0) {
    uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
    return
  }
  
  // 检查派工数量是否超过需派工数量
  const maxQty = maxQuantity.value
  if (processDispatchData.value.quantity > maxQty) {
    uni.showToast({ title: `派工数量不能超过需派工数量 ${maxQty}`, icon: 'none' })
    return
  }
  
  const hourlyOutput = selectedProcessData.value?.process?.hourlyoutput || 0
  if (!hourlyOutput || hourlyOutput <= 0) {
    uni.showToast({ title: '该工序的小时产量数据异常，无法计算派工工时', icon: 'none' })
    return
  }
  
  if (!processDispatchData.value.time || processDispatchData.value.time <= 0) {
    uni.showToast({ title: '派工工时计算错误，请检查派工数量', icon: 'none' })
    return
  }
  if (!machine.value?.code) {
    uni.showToast({ title: '请选择机台', icon: 'none' })
    return
  }
  if (!selectedEmployee.value || selectedEmployee.value.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  if (!processDispatchData.value.date) {
    uni.showToast({ title: '请选择派工日期', icon: 'none' })
    return
  }

  const selectedEmployees = employeeList.value.filter(emp => selectedEmployee.value.includes(emp.id))
  const selectedEmployeeNames = selectedEmployees.map(emp => emp.name).join('、')
  processDispatchData.value.employee = selectedEmployeeNames

  const dispatchData = {
    productCode: selectedProcessData.value?.item?.productCode || '',
    orderCode: selectedProcessData.value?.item?.orderCode || '',
    processName: selectedProcessData.value?.process?.processName || '',
    finishCount: selectedProcessData.value?.process?.finishCount || 0,
    needCount: selectedProcessData.value?.process?.needCount || 0,
    quantity: processDispatchData.value.quantity,
    time: processDispatchData.value.time,
    employee: processDispatchData.value.employee,
    employees: selectedEmployees,
    machine: machine.value?.code || '',
    mold: selectedProcessData.value?.process?.mold || '',
    workshop: workshop.value || '',
    rowid: selectedProcessData.value?.process?.rowid || '',
    date: processDispatchData.value.date || '',
    salaryMethod: processDispatchData.value.salaryMethod || '',
    price: processDispatchData.value.price || 0,
    isLast: processDispatchData.value.isLast || '否'
  }

  const res = await http.post('https://www.dachen.vip/api/workflow/hooks/NjkyMTJlNzdhOWE4ZGM2YmMxZjczYzlk', dispatchData)
  if (res.status === 1) {
    uni.showToast({ title: '派工成功' })
    showProcessModal.value = false
    // 派工成功后刷新数据，确保进度条更新
    if (searchValue.value && searchValue.value.trim()) {
      // 添加延迟，确保后端数据已更新
      setTimeout(async () => {
        await search()
      }, 1000)
    }
  } else {
    uni.showToast({ title: res.message })
  }
}

// ---------- 员工相关方法 ----------
const loadEmployees = async () => {
  try {
    // 每次请求时获取当前日期
    const currentDate = getCurrentDate()
    
    // 使用模态框中的车间值，如果没有则使用页面车间值
    const selectedWorkshop = modalWorkshop.value || workshop.value
    
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'yggs',
      filters: [{
        "controlId": "696075d19223cfe3a0c169dc",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [selectedWorkshop]
      }],
      pageSize: 1000,
      pageNum: 1
    })

    if (res.data && res.data.length > 0) {
      const mappedEmployees = res.data.map(item => {
        const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
        const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
        
        return {
          id: item['6943bd902161a0fc58bad5ab'] || '',
          name: item['6938db8bda0981f67b352af3'] || '',
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

const addEmployee = async () => {
  // 如果模态框车间值还没有设置，使用当前页面车间值
  if (!modalWorkshop.value) {
    modalWorkshop.value = workshop.value
  }
  
  // 重新加载员工列表，确保使用最新的车间值
  await loadEmployees()
  
  selectedEmployeesForAdd.value = []
  showAddEmployeeModal.value = true
}

const handleAddEmployeeModalClose = (value) => {
  showAddEmployeeModal.value = value
}

const handleAddEmployeeConfirm = async (selectedIds) => {
  if (!selectedIds || selectedIds.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  
  if (Object.keys(allEmployeesMap.value).length === 0) {
    await loadEmployees()
  }
  
  let addedCount = 0
  
  selectedIds.forEach(id => {
    const exists = employeeList.value.find(emp => emp.id === id)
    if (!exists) {
      const fullEmployee = allEmployeesMap.value[id]
      if (fullEmployee) {
        employeeList.value.push({
          id: fullEmployee.id,
          name: fullEmployee.name,
          totalHours: fullEmployee.totalHours || 0,
          unrecordedHours: fullEmployee.unrecordedHours || 0
        })
        addedCount++
      } else {
        const option = allEmployeesOptions.value.find(opt => opt.value === id)
        if (option) {
          employeeList.value.push({
            id: option.value,
            name: option.label,
            totalHours: 0,
            unrecordedHours: 0
          })
          addedCount++
        }
      }
    }
  })
  
  showAddEmployeeModal.value = false
  
  selectedIds.forEach(id => {
    if (!selectedEmployee.value.includes(id)) {
      selectedEmployee.value.push(id)
    }
  })
  
  if (addedCount > 0) {
    uni.showToast({ title: `已添加 ${addedCount} 名员工`, icon: 'success' })
  } else {
    uni.showToast({ title: '所选员工已存在', icon: 'none' })
  }
}

const isEmployeeSelected = (employeeId) => {
  return selectedEmployee.value.includes(employeeId)
}

const onEmployeeCheckboxChange = (e) => {
  selectedEmployee.value = e.detail.value || []
}

// ---------- 页面跳转方法 ----------
const goDispatchInquiry = () => {
  uni.navigateTo({
    url: `/pages/dispatchInquiry/dispatchInquiry?workshop=${encodeURIComponent(workshop.value)}`
  })
}

const goWorkload = () => {
  uni.navigateTo({
    url: '/pages/workload/workload'
  })
}

const goWorkGuide = () => {
  uni.navigateTo({
    url: '/pages/workGuide/workGuide'
  })
}

const goSelectBills = () => {
  billTypeFilter.value = '正常排产'
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}&type=${encodeURIComponent('正常排产')}`
  })
}

const goSelectReworkBills = () => {
  billTypeFilter.value = '返工排产'
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}&type=${encodeURIComponent('返工排产')}`
  })
}

const addProcess = async (item) => {
  // 获取单据的rowid
  const billRowid = item.billRowid || ''
  
  let selectedSequence = 0
  
  // 获取选中工序的rowid（如果选择了工序）
  let processRowid = ''
  
  // 计算新工序的顺序
  if (selectedProcess.value && selectedProcess.value.item.orderCode === item.orderCode) {
    // 情况1：如果选择了工序，选中工序的顺序 + 0.01
    const currentSequence = parseFloat(selectedProcess.value.process.sequence || 0)
    selectedSequence = parseFloat((currentSequence + 0.01).toFixed(2))
    processRowid = selectedProcess.value.process.rowid || ''  // 获取选中工序的rowid
  } else if (item.processes && item.processes.length > 0) {
    // 情况2：如果工序列表有工序，但没有选择工序，取顺序最大的工序的顺序 + 1，并往下取整
    const maxSequence = Math.max(...item.processes.map(p => parseFloat(p.sequence || 0)))
    selectedSequence = Math.floor(maxSequence) + 1
  } else {
    // 情况3：工序列表没有工序，顺序直接为1
    selectedSequence = 1
  }
  
  uni.navigateTo({
    url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(item.orderCode || '')}&productCode=${encodeURIComponent(item.productCode || '')}&workshop=${workshop.value}&selectedSequence=${selectedSequence}&billRowid=${encodeURIComponent(billRowid)}&processRowid=${encodeURIComponent(processRowid)}&billType=${encodeURIComponent(item.billType || '正常排产')}`
  })
}

const dispatchWork = (item) => {
  // 检查是否有选中的工序
  if (!selectedProcess.value) {
    uni.showToast({ title: '请先选择一个工序', icon: 'none' })
    return
  }
  
  // 检查选中的工序是否属于当前订单
  if (selectedProcess.value.item.orderCode !== item.orderCode) {
    uni.showToast({ title: '请选择当前订单的工序', icon: 'none' })
    return
  }
  
  // 打开派工模态框
  openProcessModal(selectedProcess.value.item, selectedProcess.value.process)
}

// 使用正常工序
const useNormalProcess = async (item) => {
  const billRowid = item.billRowid || ''
  
  if (!billRowid) {
    uni.showToast({ title: '单据ID不存在', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '处理中...' })
    const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk3MWMwODkwZjBkMGFkODBmMjhjOGU1', {
      billRowid: billRowid
    })
    uni.hideLoading()
    
    if (result.status === 1) {
      uni.showToast({ title: result.msg || '操作失败', icon: 'none' })
      return
    }
    
    uni.showToast({ title: '操作成功' })
    // 刷新数据，确保数据更新
    if (searchValue.value && searchValue.value.trim()) {
      // 添加延迟，确保后端数据已更新
      setTimeout(async () => {
        await search()
      }, 1000)
    }
  } catch (error) {
    uni.hideLoading()
    console.error('使用正常工序失败:', error)
    uni.showToast({ title: '操作失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// 删除工序
const deleteProcess = async () => {
  const processRowid = selectedProcessData.value?.process?.rowid || ''
  
  if (!processRowid) {
    uni.showToast({ title: '工序ID不存在', icon: 'none' })
    return
  }
  
  // 确认删除
  uni.showModal({
    title: '确认删除',
    content: `确定要删除工序"${selectedProcessData.value?.process?.processName || ''}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk3MWNkY2UwZjBkMGFkODBmMmE3NGM3', {
            rowid: processRowid
          })
          uni.hideLoading()
          
          if (result.status === 1) {
            uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
            return
          }
          
          uni.showToast({ title: '删除成功' })
          // 关闭模态框
          showProcessModal.value = false
          // 刷新数据，确保数据更新
          if (searchValue.value && searchValue.value.trim()) {
            // 添加延迟，确保后端数据已更新
            setTimeout(async () => {
              await search()
            }, 1000)
          }
        } catch (error) {
          uni.hideLoading()
          console.error('删除工序失败:', error)
          uni.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' })
        }
      }
    }
  })
}

const quit = () => {
  uni.navigateBack()
}

// ==================== Watch监听器 ====================
// 监听派工数量变化，验证并计算派工工时
watch(() => processDispatchData.value.quantity, (newVal) => {
  const maxQty = maxQuantity.value
  if (newVal > maxQty) {
    uni.showToast({ title: `数量不能超过需派工数量 ${maxQty}`, icon: 'none' })
    processDispatchData.value.quantity = maxQty
    return
  } else if (newVal < 0) {
    processDispatchData.value.quantity = 0
  }
  
  // 自动计算派工工时：派工数量 / 小时产量（从工序数据中获取）
  calculateWorkTime()
})

// 计算派工工时
const calculateWorkTime = () => {
  const quantity = processDispatchData.value.quantity || 0
  // 从工序数据中获取小时产量
  const hourlyOutput = selectedProcessData.value?.process?.hourlyoutput || 0
  
  if (hourlyOutput > 0 && quantity > 0) {
    // 保留2位小数
    processDispatchData.value.time = parseFloat((quantity / hourlyOutput).toFixed(2))
  } else {
    processDispatchData.value.time = 0
  }
}

// ==================== 生命周期钩子 ====================
onLoad(() => {
  // 检查仓库中的权限字段（车间）
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = userStore.loginLimits
    isWorkshopLocked.value = true // 锁定车间，不允许修改
  }
  
  uni.$on('selectOrder', (order) => {
    searchValue.value = order
  })
  uni.$on('processAdded', (data) => {
    // 事件已接收，刷新由 onShow 处理
  })
  uni.$on('clearDispatchData', () => {
    searchValue.value = ''
    billsList.value = []
    processList.value = []
  })
})

onShow(() => {
  // 每次显示页面时也检查一次权限字段（车间）
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    if (workshop.value !== userStore.loginLimits) {
      workshop.value = userStore.loginLimits
    }
    if (!isWorkshopLocked.value) {
      isWorkshopLocked.value = true
    }
  }
  
  if (searchValue.value && searchValue.value.trim()) {
    setTimeout(() => {
      loadAllData()
    }, 500)
  }
})

onUnload(() => {
  uni.$off('selectOrder')
  uni.$off('processAdded')
  uni.$off('clearDispatchData')
})
</script>

<style scoped lang="scss">
/* 整体容器样式 */
.process-container {
  height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;

  /* 导航栏样式 */
  .header {
    height: px2vw(100px);
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #5884f1;

    image {
      margin: px2vw(20px);
      height: px2vw(60px);
      width: px2vw(60px);
    }

    .title {
      margin-left: px2vw(300px);
      font-size: px2vw(35px);
      color: white;
    }

    .btn-box {
      display: flex;
      align-items: center;

      .btn-one {
        height: px2vw(80px);
        width: px2vw(170px);
        display: flex;
        align-items: center;
        background-color: white;
        margin: px2vw(20px);
        font-size: px2vw(25px);
        border-radius: px2vw(20px);

        image {
          height: px2vw(50px);
          width: px2vw(50px);
          margin-right: px2vw(20px);
        }
      }
    }
  }

  /* 按钮栏样式 */
  .btn-list {
    height: px2vw(120px);
    width: 100%;
    display: flex;
    align-items: center;

    .btn-item {
      height: px2vw(80px);
      width: px2vw(620px);
      margin: px2vw(10px);
      padding: px2vw(16px) px2vw(25px);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(18px);
      color: #fff;
      display: flex;
      align-items: center;
      background-color: #2755f1;
      font-size: px2vw(25px);
    }
  }

  /* 搜索区域样式 */
  .search-box {
    display: flex;
    height: px2vw(100px);
    width: 100%;
    background-color: #fff;

    .device {
      display: flex;
      align-items: center;

      .input-box {
        width: px2vw(1100px);
        height: px2vw(80px);
        margin-right: px2vw(10px);
        border: px2vw(3px) solid #5884f1;
        border-radius: px2vw(18px);
        display: flex;
        align-items: center;
        padding: 0 px2vw(35px);
        margin-left: px2vw(10px);

        input {
          width: 100%;
          font-size: px2vw(30px);
        }
      }
    }

    .scan {
      display: flex;
      align-items: center;

      image {
        width: px2vw(80px);
        height: px2vw(80px);
      }
    }

    .assemble {
      width: px2vw(280px);
      height: px2vw(80px);
      margin: px2vw(10px);
      padding: px2vw(16px) px2vw(25px);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(18px);
      color: #fff;
      display: flex;
      align-items: center;
      background-color: #2755f1;
      font-size: px2vw(25px);
      
      .assemble-box {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        
        &.assemble-box-disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }
      }
    }
    
    .selectDocument {
      width: px2vw(280px);
      height: px2vw(80px);
      margin: px2vw(10px);
      padding: px2vw(16px) px2vw(25px);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(18px);
      color: #fff;
      display: flex;
      align-items: center;
      background-color: #2755f1;
      font-size: px2vw(25px);
    }
  }

  /* 订单列表样式 */
  .orderList {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    .orderItem {
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(10px);
      padding: px2vw(15px);
      display: flex;
      position: relative;

      .goodsInfo {
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;

        .goodsInfo-up {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .orderGoods {
            display: flex;
            margin: 0 px2vw(20px);
            align-items: center;
          }

          .order-label {
            width: px2vw(120px);
            font-size: px2vw(30px);
            color: #5884f1;
            border: px2vw(2px) solid #5884f1;
            padding: px2vw(8px) 0;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: px2vw(8px);
            margin-right: px2vw(8px);
          }

          .order-number {
            height: px2vw(60px);
            padding: px2vw(8px) 0;
            border-radius: px2vw(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: px2vw(25px);
            margin-left: px2vw(8px);
            background: white;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: px2vw(20px);
            margin: 0 px2vw(20px);

            .status-item {
              display: flex;
              align-items: center;
              gap: px2vw(8px);

              .status-color {
                width: px2vw(20px);
                height: px2vw(20px);
                border-radius: px2vw(4px);

                &.normal {
                  background-color: #4CAF50;
                }

                &.terminated {
                  background-color: #f44336;
                }
              }

              .status-text {
                font-size: px2vw(22px);
                color: #333;
              }
            }
          }

          .buttons {
            display: flex;
            gap: px2vw(10px);

            button {
              width: px2vw(150px);
              padding: 0;
              font-size: px2vw(28px);
              border-radius: px2vw(8px);
              border: px2vw(2px) solid #5884f1;
              color: #5884f1;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;

              &.btn-dispatch {
                background: white;
                color: #5884f1;
              }
              
              &.btn-normal-process {
                width: px2vw(200px);
                background: white;
                color: #5884f1;
              }
            }
          }
        }

        .goodsInfo-down {
          display: flex;
          width: 100%;
          justify-content: space-between;
          margin-top: px2vw(10px);

          .orderItem,
          .orderCount,
          .productCode,
          .name {
            font-size: px2vw(25px);
            margin: px2vw(10px) px2vw(20px);
            display: flex;
            align-items: center;
            width: px2vw(400px);
          }
        }

        .problemDescription {
          display: flex;
          margin: px2vw(10px) px2vw(20px);
          font-size: px2vw(25px);
          color: #f44336;
          width: px2vw(800px);
          
          view:first-child {
            font-weight: bold;
            margin-right: px2vw(10px);
            white-space: nowrap;
          }
          
          view:last-child {
            flex: 1;
            word-break: break-word;
          }
        }

        .processes-section {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: px2vw(20px);
          padding: 0 px2vw(20px);
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
          padding: px2vw(8px);
          border-radius: px2vw(12px);

          &.process-selected {
            border: px2vw(3px) solid #4CAF50;
          }

          &.process-selected.process-over {
            border-color: #f44336;
          }

          &.process-over {
            .process-sequence {
              color: #f44336 !important;
            }

            .progress-circle {
              background: conic-gradient(#f44336 0%, #f44336 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%) !important;
            }

            .progress-text {
              color: #f44336 !important;
            }

            .process-name {
              color: #f44336 !important;
            }

            &.process-selected {
              .process-sequence {
                color: #f44336 !important;
              }

              .process-name {
                color: #f44336 !important;
              }
            }
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
          width: px2vw(120px);
          height: px2vw(120px);
          border-radius: 50%;
          background: conic-gradient(#4CAF50 0%, #4CAF50 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        }

        .progress-inner {
          position: absolute;
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: px2vw(12px);
          top: 10%;
          left: 10%;
        }

        .progress-text {
          font-size: px2vw(20px);
          font-weight: bold;
          color: #333;
          text-align: center;
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
      }
      
      .goodsProcess {
        position: absolute;
        bottom: px2vw(10px);
        right: px2vw(10px);
        flex-shrink: 0;
        z-index: 100;
        pointer-events: none;
        
        .bill-type-badge {
          color: white;
          padding: px2vw(8px) px2vw(16px);
          border-radius: px2vw(8px);
          font-size: px2vw(22px);
          font-weight: bold;
          white-space: nowrap;
          z-index: 100;
          box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.2);
          
          &.badge-normal {
            background-color: #4CAF50; // 绿色 - 正常排产
          }
          
          &.badge-rework {
            background-color: #FFC107; // 黄色 - 返工排产
            color: white; // 白色文字
          }
        }
      }
    }
  }
}

/* 终止派工模态框样式 */
.terminate-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  padding: px2vw(20px);
  box-sizing: border-box;

  .terminate-content {
    background: white;
    border-radius: px2vw(18px); 
    width: 90%;
    max-width: px2vw(900px);
    height: auto;
    max-height: 90vh;
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .terminate-body {
      padding: px2vw(40px) px2vw(30px) px2vw(20px);
      flex: 1;
      overflow-y: auto;
      min-height: 0;

      .terminate-tip {
        font-size: px2vw(32px);
        color: #333;
        margin-bottom: px2vw(30px);
        text-align: center;
        font-weight: bold;
        line-height: 1.5;
        word-break: break-word;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: px2vw(15px);

        .label {
          font-size: px2vw(30px);
          color: #333;
          font-weight: bold;
        }

        .terminate-textarea {
          width: 100%;
          min-height: px2vw(120px);
          padding: px2vw(15px);
          border: px2vw(2px) solid #ddd;
          border-radius: px2vw(8px);
          font-size: px2vw(28px);
          box-sizing: border-box;
          resize: none;
          line-height: 1.5;

          &:focus {
            border-color: #5884f1;
            outline: none;
          }

          &::placeholder {
            color: #999;
          }
        }
      }
    }

    .terminate-footer {
      display: flex;
      justify-content: center;
      gap: px2vw(20px);
      padding: px2vw(20px) px2vw(30px);
      border-top: px2vw(1px) solid #eee;
      flex-shrink: 0;

      .btn-cancel,
      .btn-confirm {
        flex: 1;
        max-width: px2vw(250px);
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

/* 工序派工模态样式 */
.process-modal {
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

  .process-content {
    background: white;
    border-radius: px2vw(18px);
    width: 90%;
    width: px2vw(1400px);
    height: px2vw(700px);
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: px2vw(30px) px2vw(40px);
      border-bottom: px2vw(2px) solid #eee;
      font-size: px2vw(35px);
      color: #333;
      position: relative;
      flex-shrink: 0;
    }
  }
}

.modal-title {
  font-weight: bold;
  font-size: px2vw(35px);
  color: #333;
  flex: 1;
  text-align: center;
}

.modal-close {
  position: absolute;
  right: px2vw(40px);
  top: 50%;
  transform: translateY(-50%);
  width: px2vw(60px);
  height: px2vw(60px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: px2vw(50px);
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  line-height: 1;
  
  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
  
  &:active {
    background-color: #e0e0e0;
  }
}

/* 可滚动内容区域 */
.modal-scroll-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 模态主体样式 */
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
  align-items: center;
  justify-content: space-between;
  gap: px2vw(10px);
  flex: 1;

  &.full {
    width: 100%;
  }

  &.full.second-column {
    margin-left: 50%;
    width: 50%;
    justify-content: space-between;
  }

  @media (max-width: #{px2vw(750px)}) {
    flex-direction: column;
    align-items: flex-start;
    gap: px2vw(5px);
    justify-content: flex-start;
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
  
  picker {
    flex: none;
    display: flex;
    width: px2vw(400px);
  }

  .input-field {
    flex: none;
    width: px2vw(400px);
    flex-shrink: 0;
    height: px2vw(60px);
    padding: px2vw(8px) px2vw(12px);
    border: px2vw(1px) solid #eee;
    border-radius: px2vw(5px);
    background: #f9f9f9;
    font-size: px2vw(30px);
    box-sizing: border-box;

    &[readonly] {
      background: #f5f5f5;
      color: #666;
      cursor: not-allowed;
    }
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
  .btn-confirm,
  .btn-delete-process {
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
  
  .btn-delete-process {
    background: #f44336;
    color: white;
    
    &:hover {
      background: #d32f2f;
    }
    
    &:active {
      background: #b71c1c;
    }
  }
}



/* 员工选择表格样式 */
.employee-section {
  margin-top: px2vw(10px);
  padding: 0 px2vw(20px) px2vw(20px);

  .table-header {
    display: flex;
    background-color: #f5f5f5;
    font-weight: bold;
    padding: px2vw(15px);
    border-bottom: px2vw(2px) solid #eee;
    align-items: center;

    .col {
      font-size: px2vw(30px);
      padding: 0 px2vw(15px);
      text-align: left;

      &.selected {
        width: px2vw(120px);
        text-align: center;
        flex-shrink: 0;
        padding: 0 px2vw(12px);
      }

      &.name {
        flex: 2;
        padding-left: px2vw(20px);
      }

      &.totalHours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }

      &.unrecordedHours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }

      &.hours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }
    }
  }

  .employee-table {
    .table-row {
      display: flex;
      align-items: center;
      padding: px2vw(15px);
      border-bottom: px2vw(1px) solid #eee;
      cursor: pointer;

      &:hover {
        background-color: #f9f9f9;
      }

      .col {
        font-size: px2vw(30px);
        padding: 0 px2vw(15px);
        text-align: left;
        display: flex;
        align-items: center;

        &.selected {
          width: px2vw(120px);
          text-align: center;
          flex-shrink: 0;
          justify-content: center;
          padding: 0 px2vw(12px);
        }

        &.name {
          flex: 2;
          padding-left: px2vw(20px);
        }

        &.totalHours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }

        &.unrecordedHours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }

        &.hours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }
      }
    }
  }
}

/* 图片预览模态框样式 */
.image-preview-modal {
  position: fixed;
  top: px2vw(100px);
  left: 0;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;

  .btn-close {
    position: absolute;
    top: px2vw(30px);
    right: px2vw(30px);
    margin-top: 0;
    padding: px2vw(10px) px2vw(30px);
    background-color: #5884f1;
    color: white;
    border: none;
    border-radius: px2vw(8px);
    font-size: px2vw(28px);
    cursor: pointer;
    z-index: 10000;

    &:active {
      background-color: #2755f1;
    }
  }

  .preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .preview-swiper {
    width: 100%;
    height: 80vh;
  }

  .swiper-item-inner {
    width: 100%;
    height: 100%;
    min-height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .preview-image {
    width: 90vw;
    height: 70vh;
    min-width: 200px;
    min-height: 200px;
    display: block;
  }

}
</style>