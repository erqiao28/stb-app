<template>
  <view class="process-container" @click="closeWorkshopOptions" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- ==================== 模态框组件 ==================== -->
    
    <!-- 车间选择模态框 -->
    <Radiobox v-model="workshop" :options="workshopOptions" title="车间" v-model:visible="showWorkshopModal"
      @confirm="handleWorkshopConfirm" />
    
    <!-- 机台选择模态框 -->
    <MachineRadiobox v-model="machine" :options="machineOptions" title="选择机台" v-model:visible="showMachineModal"
      @confirm="handleMachineConfirm" />
    
    <!-- 模具选择模态框 -->
    <MachineRadiobox v-model="mold" :options="moldOptions" title="选择模具" v-model:visible="showMoldModal"
      @confirm="handleMoldConfirm" />
    
    <!-- 添加员工模态框 -->
    <AddWorkerRadiobox v-model="selectedEmployeesForAdd" :options="allEmployeesOptions" title="添加员工" 
      :visible="showAddEmployeeModal" @update:visible="handleAddEmployeeModalClose" @confirm="handleAddEmployeeConfirm" />
    
    <!-- 图片预览模态框 -->
    <view class="image-preview-modal" v-if="showImagePreview" @click="closeImagePreview" :style="{ paddingTop: statusBarHeight + 'px' }">
      <button class="btn-close" @click="closeImagePreview">关闭</button>
      <img 
        v-if="currentImageUrl"
        :src="currentImageUrl" 
        class="preview-image"
        @error="handleImageError"
        @load="handleImageLoad"
        alt="预览图片"
      />
    </view>
    
    <!-- 工序派工模态框 -->
    <view class="process-modal" v-if="showProcessModal" @click.self="closeProcessModal">
      <view class="process-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ selectedProcessData?.process?.processName }}(工序派工)</text>
        </view>
        
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
              <text class="label">待派工数量：</text>
              <text class="value">{{ selectedProcessData?.process?.needCount }}</text>
            </view>
          </view>
          
          <!-- 本次派工数量和时数 -->
          <view class="row-group">
            <view class="form-group">
              <text class="label">本次派工数量：</text>
              <input v-model.number="processDispatchData.quantity" type="number" placeholder="请输入数量"
                :max="remainingQuantity" min="1" class="input-field" />
            </view>
            <view class="form-group">
              <text class="label">本次派工时数：</text>
              <input v-model.number="processDispatchData.time" type="number" placeholder="请输入时数" 
                class="input-field" disabled />
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
              <view class="value" @click="getMoldList">
                {{ mold?.name || '请选择模具' }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 员工选择表格 -->
        <view class="employee-section">
          <view class="table-header">
            <view class="col selected">选中</view>
            <view class="col name">姓名</view>
            <view class="col hours">已派未记时数量</view>
          </view>
          <checkbox-group @change="onEmployeeCheckboxChange" class="employee-table">
            <label v-for="emp in employeeList" :key="emp.id" class="table-row">
              <view class="col selected">
                <checkbox :value="emp.id" :checked="isEmployeeSelected(emp.id)" />
              </view>
              <view class="col name">{{ emp.name }}</view>
              <view class="col hours">{{ emp.unrecordedHours }} 时</view>
            </label>
          </checkbox-group>
        </view>
        
        <!-- 模态框底部按钮 -->
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeProcessModal">取消</button>
          <button class="btn-confirm" @click="addEmployee">添加员工</button>
          <button class="btn-confirm" @click="goOrderDetail">工单明细</button>
          <button class="btn-confirm" @click="confirmProcessDispatch">确认派工</button>
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
        <view class="assemble-box" @click="showWorkshopModal = true">
          {{ workshop }}
        </view>
      </view>
      <view class="selectDocument" @click="goSelectBills">选择单据</view>
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
            <view class="buttons">
              <button class="btn-dispatch" @click="dispatchOrder(item)">查看图片</button>
              <button class="btn-detail" @click="viewDetail(item)">插入工序</button>
              <button class="btn-delete" @click="addProcess(item)">添加工序</button>
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
          
          <!-- 工序进度展示 -->
          <view class="processes-section" v-if="item.processes && item.processes.length > 0" :key="`processes-${item.orderCode}-${listKey}`">
            <view class="processes-container" :key="`container-${item.orderCode}-${listKey}`">
              <view v-for="(process, index) in item.processes" :key="`${item.orderCode}-${process.processName}-${index}-${listKey}`" class="process-wrapper">
                <view class="process-item">
                  <view class="progress-circle"
                    :style="{ '--percent': Math.round((process.finishCount / process.needCount) * 100) + '%' }"
                    @click="openProcessModal(item, process)">
                    <view class="progress-inner">
                      <view class="progress-text">{{ process.finishCount }}/{{ process.needCount }}</view>
                    </view>
                  </view>
                  <text class="process-name">{{ process.processName }}</text>
                </view>
                <view v-if="index < item.processes.length - 1" class="connector"></view>
              </view>
            </view>
          </view>
        </view>
        <view class="goodsProcess"></view>
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

// ---------- 机台相关 ----------
const machine = ref(null)
const machineOptions = ref([])
const showMachineModal = ref(false)

// ---------- 模具相关 ----------
const mold = ref(null)
const moldOptions = ref([])
const showMoldModal = ref(false)

// ---------- 搜索和列表相关 ----------
const searchValue = ref('')
const billsList = ref([])
const processList = ref([])
const listKey = ref(0)

// ---------- 图片预览相关 ----------
const showImagePreview = ref(false)
const currentImageUrl = ref('')

// ---------- 工序模态相关 ----------
const showProcessModal = ref(false)
const selectedProcessData = ref(null)
const processDispatchData = ref({
  employee: '',
  quantity: 1,
  time: 1,
  machine: '',
  mold: ''
})

// ---------- 员工相关 ----------
const employeeList = ref([])
const selectedEmployee = ref([])
const showAddEmployeeModal = ref(false)
const selectedEmployeesForAdd = ref([])
const allEmployeesOptions = ref([])
const allEmployeesMap = ref({})

// ==================== 计算属性 ====================
const remainingQuantity = computed(() => {
  return selectedProcessData.value?.process?.needCount - selectedProcessData.value?.process?.finishCount || 0
})

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

// ---------- 模具相关方法 ----------
const getMoldList = async () => {
  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'shebeidangan',
      filters: [{
        "controlId": "67ac0a87d6566fd9d09a2340",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [workshop.value]
      }]
    })
    if (!res.data || res.data.length === 0) {
      uni.showToast({ title: '无模具数据', icon: 'none' })
      return null
    }
    moldOptions.value = res.data.map(item => ({
      workshop: item['67ac0a87d6566fd9d09a2340'] || '',
      code: item['63db6b67e134b5cd4f9f96bb'] || '',
      name: item['63db6b67e134b5cd4f9f96bc'] || '',
      value: item['63db6b67e134b5cd4f9f96bb'] || ''
    })).filter(item => item.value)
    showMoldModal.value = true
    return res
  } catch (error) {
    console.error('获取模具列表失败:', error)
    uni.showToast({ title: '获取模具列表失败', icon: 'none' })
    return null
  }
}

const handleMoldConfirm = (value) => {
  mold.value = value
  showMoldModal.value = false
}

// ---------- 搜索和列表相关方法 ----------
const getProcessRaw = async (searchVal = '') => {
  const filters = [{
    "controlId": "669a6cae2503723eec1b49bb",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [workshop.value]
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
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  
  const [billsRes, processRes] = await Promise.all([
    getBillsListRaw(searchValue.value),
    getProcessRaw(searchValue.value)
  ])

  const newProcessList = processRes.data.map(item => ({
    processName: item['656ffd1bba5ef3863bf3ec1e'],
    needCount: item['68099ac75d6fc47331574e82'],
    finishCount: item['669b71152503723eec1b52d7'],
    processOrder: item['6593b07ae97eb866a50eeba1'],
    worktime: item['69211dac21066a9f124f62df']
  }))
  processList.value = newProcessList.map(item => ({ ...item }))

  if (billsRes.data.length === 0) {
    billsList.value = []
    return
  }

  const newBillsList = billsRes.data.map(item => {
    const orderGoods = item['691c47ee1c02c451c72a81c5']
    const orderCode = item['655e1cbbbd2094b316347f92']
    const processes = processList.value.filter(p => p.processOrder === orderCode)
    
    let imageData = item['6683a0448d2110bec155ac64']
    if (typeof imageData === 'string' && imageData.trim()) {
      try {
        imageData = JSON.parse(imageData)
      } catch (e) {
        // 解析失败，保持原值
      }
    }
    
    return {
      orderGoods,
      orderCount: item['681b0b53b139204fd264c5fd'],
      name: item['6937d255ff2b019b3cb34be3'],
      productionCode: item['691d6336535b29cbd5c6c0ca'],
      image: imageData,
      completedProcess: processes.length > 0 ? `${processes.filter(p => p.finishCount === p.needCount).length}/${processes.length}` : '0',
      productCode: item['691d6336535b29cbd5c6c0ca'],
      processes: processes.map(p => ({ ...p })),
      orderCode
    }
  })
  
  billsList.value = []
  await nextTick()
  billsList.value = newBillsList.map(item => ({
    ...item,
    processes: item.processes.map(p => ({ ...p }))
  }))
  listKey.value = Date.now()
  await nextTick()
}

const loadAllData = async (retryCount = 0) => {
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  
  await search()
  
  if (retryCount === 0) {
    setTimeout(async () => {
      await search()
    }, 1000)
  }
}

// ---------- 图片预览相关方法 ----------
const dispatchOrder = (item) => {
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
  
  const firstImage = imageArray[0]
  const downloadUrl = firstImage?.DownloadUrl
  
  if (!downloadUrl) {
    uni.showToast({ title: '图片地址不存在', icon: 'none' })
    return
  }
  
  currentImageUrl.value = downloadUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  currentImageUrl.value = ''
}

const handleImageError = (e) => {
  uni.showToast({ title: '图片加载失败', icon: 'none' })
}

const handleImageLoad = () => {
  // 图片加载成功处理
}

// ---------- 工序模态相关方法 ----------
const openProcessModal = (item, process) => {
  selectedProcessData.value = { item, process }
  machine.value = null
  mold.value = null
  processDispatchData.value = {
    employee: '',
    quantity: 1,
    time: process?.worktime || 0,
    machine: '',
    mold: ''
  }
  selectedEmployee.value = []
  employeeList.value = []
  loadEmployees()
  showProcessModal.value = true
}

const closeProcessModal = () => {
  showProcessModal.value = false
  processDispatchData.value = { employee: '', quantity: 1, time: 1, machine: '', mold: '' }
  machine.value = null
  mold.value = null
  employeeList.value = []
  selectedEmployee.value = []
}

const confirmProcessDispatch = async () => {
  if (!processDispatchData.value.quantity || processDispatchData.value.quantity <= 0) {
    uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
    return
  }
  if (!processDispatchData.value.time || processDispatchData.value.time <= 0) {
    uni.showToast({ title: '请填写有效的派工时数 (>0)', icon: 'none' })
    return
  }
  if (!machine.value?.code) {
    uni.showToast({ title: '请选择机台', icon: 'none' })
    return
  }
  if (!mold.value?.code) {
    uni.showToast({ title: '请选择模具', icon: 'none' })
    return
  }
  if (!selectedEmployee.value || selectedEmployee.value.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
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
    machine: machine.value?.name || '',
    mold: mold.value?.name || '',
    workshop: workshop.value || ''
  }

  const res = await http.post('https://www.dachen.vip/api/workflow/hooks/NjkyMTJlNzdhOWE4ZGM2YmMxZjczYzlk', dispatchData)
  if (res.status === 1) {
    uni.showToast({ title: '派工成功' })
    showProcessModal.value = false
    search()
  } else {
    uni.showToast({ title: res.message })
  }
}

// ---------- 员工相关方法 ----------
const loadEmployees = async () => {
  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'yggs',
      filters: [{
        "controlId": "6937d496ff2b019b3cb34c95",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [workshop.value]
      }]
    })
    if (res.data && res.data.length > 0) {
      const mappedEmployees = res.data.map(item => ({
        id: item['692113fb21066a9f124f5fe2'] || '',
        name: item['6938db8bda0981f67b352af3'] || '',
        unrecordedHours: item['6921135b21066a9f124f5f79'] || 0
      })).filter(emp => emp.id)
      
      allEmployeesOptions.value = mappedEmployees.map(emp => ({
        label: emp.name,
        value: emp.id
      }))
      
      allEmployeesMap.value = {}
      mappedEmployees.forEach(emp => {
        allEmployeesMap.value[emp.id] = emp
      })
    }
  } catch (error) {
    console.error('加载员工失败:', error)
  }
}

const addEmployee = async () => {
  if (allEmployeesOptions.value.length === 0) {
    await loadEmployees()
  }
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
          unrecordedHours: fullEmployee.unrecordedHours || 0
        })
        addedCount++
      } else {
        const option = allEmployeesOptions.value.find(opt => opt.value === id)
        if (option) {
          employeeList.value.push({
            id: option.value,
            name: option.label,
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
    url: '/pages/dispatchInquiry/dispatchInquiry'
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
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}`
  })
}

const goOrderDetail = () => {
  uni.navigateTo({
    url: '/pages/orderDetail/orderDetail'
  })
}

const addProcess = async (item) => {
  uni.navigateTo({
    url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(item.orderCode || '')}&productCode=${encodeURIComponent(item.productCode || '')}&workshop=${workshop.value}`
  })
}

const viewDetail = (item) => {
  // 插入工序功能
}

const quit = () => {
  uni.navigateBack()
}

// ==================== Watch监听器 ====================
watch(() => processDispatchData.value.quantity, (newVal) => {
  const remaining = remainingQuantity.value
  if (newVal > remaining) {
    uni.showToast({ title: `数量不能超过剩余 ${remaining}`, icon: 'none' })
    processDispatchData.value.quantity = remaining
  } else if (newVal < 1) {
    processDispatchData.value.quantity = 1
  }
})

// ==================== 生命周期钩子 ====================
onLoad(() => {
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
  if (searchValue.value && searchValue.value.trim()) {
    setTimeout(() => {
      loadAllData(0)
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
        width: px2vw(1200px);
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

    .assemble,
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

      .goodsInfo {
        width: 100%;
        display: flex;
        flex-direction: column;

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
            display: flex;
            align-items: center;
            width: px2vw(400px);
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
      justify-content: center;
      align-items: center;
      padding: px2vw(30px) px2vw(40px);
      border-bottom: px2vw(2px) solid #eee;
      font-size: px2vw(35px);
      color: #333;
    }
  }
}

.modal-title {
  font-weight: bold;
  font-size: px2vw(35px);
  color: #333;
}

/* 模态主体样式 */
.modal-body {
  flex: 0 0 auto;
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
  .btn-confirm {
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
  }
}



/* 员工选择表格样式 */
.employee-section {
  margin-top: px2vw(10px);
  flex: 1;
  overflow-y: auto;

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

      &.hours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }
    }
  }

  .employee-table {
    max-height: px2vw(250px);
    overflow-y: auto;

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

  .preview-image {
    max-width: 50vw;
    max-height: 50vh;
    width: auto;
    height: auto;
    display: block;
    object-fit: contain;
  }
}
</style>