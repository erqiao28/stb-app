<template>
  <view class="process-container" @click="closeWorkshopOptions">
    <!-- 车间选择单选模态框 -->
    <Radiobox v-model="workshop" :options="workshopOptions" title="车间" v-model:visible="showWorkshopModal"
      @confirm="handleWorkshopConfirm" />
    <!-- 机台选择单选模态框 -->
    <MachineRadiobox v-model="machine" :options="machineOptions" title="选择机台" v-model:visible="showMachineModal"
      @confirm="handleMachineConfirm" />
    <!-- 模具选择单选模态框 -->
    <MachineRadiobox v-model="mold" :options="moldOptions" title="选择模具" v-model:visible="showMoldModal"
      @confirm="handleMoldConfirm" />
    <!-- 添加员工多选模态框 -->
    <AddWorkerRadiobox v-model="selectedEmployeesForAdd" :options="allEmployeesOptions" title="添加员工" 
      :visible="showAddEmployeeModal" @update:visible="handleAddEmployeeModalClose" @confirm="handleAddEmployeeConfirm" />
    <!-- 工序派工模态框 -->
    <view class="process-modal" v-if="showProcessModal" @click.self="closeProcessModal">
      <view class="process-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title"> {{ selectedProcessData?.process?.processName }}(工序派工)</text>
        </view>
        <!-- 模态框模板：修改 modal-body 内结构 -->
        <view class="modal-body">
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
          <!-- 新增：本次派工数量和时数行 -->
          <view class="row-group">
            <view class="form-group">
              <text class="label">本次派工数量：</text>
              <input v-model.number="processDispatchData.quantity" type="number" placeholder="请输入数量"
                :max="remainingQuantity" min="1" class="input-field" />
            </view>
            <view class="form-group">
              <text class="label">本次派工时数：</text>
              <input v-model.number="processDispatchData.time" type="number" placeholder="请输入时数" min="0.1"
                class="input-field" @input="validateTime" />
            </view>
          </view>
          <!-- 新增：机台和模具选择行 -->
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
          <radio-group v-model="selectedEmployee" class="employee-table">
            <label v-for="emp in employeeList" :key="emp.id" class="table-row">
              <view class="col selected">
                <radio :value="emp.id" />
              </view>
              <view class="col name">{{ emp.name }}</view>
              <view class="col hours">{{ emp.unrecordedHours }} 时</view>
            </label>
          </radio-group>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeProcessModal">取消</button>
          <button class="btn-confirm" @click="addEmployee">添加员工</button>
          <button class="btn-confirm" @click="goOrderDetail">工单明细</button>
          <button class="btn-confirm" @click="confirmProcessDispatch">确认派工</button>
        </view>
      </view>
    </view>
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
    <!-- 按钮栏 -->
    <view class="btn-list">
      <view class="btn-item" @click="goDispatchInquiry">
        派工查询
      </view>
      <view class="btn-item" @click="goWorkload">
        员工工作量查询
      </view>
      <view class="btn-item" @click="goWorkGuide">
        作业指导书
      </view>
    </view>
    <!-- 搜索区域 -->
    <view class="search-box">
      <view class="assemble">
        <view class="assemble-box" @click="showWorkshopModal = true">
          {{ workshop }}
        </view>
      </view>

      <view class="selectDocument" @click="goSelectBills">
        选择单据
      </view>

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
          <view class="goodsInfo-down">
            <view class="orderItem">
              <view>订单物品：</view>
              <view>{{ item.orderGoods }}</view>
            </view>
            <view class="orderCount">
              <view>订单数量：</view>
              <view>{{ item.orderCount }}</view>
            </view>
            <view class="name">
              <view>名称：</view>
              <view>{{ item.name }}</view>
            </view>
          </view>
          <view class="processes-section" v-if="item.processes && item.processes.length > 0" :key="`processes-${item.orderCode}-${listKey}`">
            <view class="processes-container" :key="`container-${item.orderCode}-${listKey}`">
              <view v-for="(process, index) in item.processes" :key="`${item.orderCode}-${process.processName}-${index}-${listKey}`" class="process-wrapper">
                <view class="process-item">
                  <view class="progress-circle"
                    :style="{ '--percent': Math.round((process.finishCount / process.needCount) * 100) + '%' }"
                    @click="openProcessModal(item, process)">
                    <view class="progress-inner">
                      <view class="progress-text">{{ process.finishCount }}/{{ process.needCount
                      }}</view>
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
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick
} from 'vue'
import Radiobox from "../../component/radiobox/radiobox.vue";
import MachineRadiobox from "../../component/machineRadiobox/machineRadiobox.vue";
import AddWorkerRadiobox from "../../component/addWorkerRadiobox/addWorkerRadiobox.vue";
import { useUserStore } from '../../store/user.store'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
const userStore = useUserStore()

// 添加函数定义
const closeWorkshopOptions = () => {
  // 空函数，防止warn（如果不需要，可移除模板@click）
}

// 车间选择单选框
const workshop = ref('拉伸车间')
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const handleWorkshopConfirm = (value) => {
  workshop.value = value
  showWorkshopModal.value = false
  search()  // 车间改变时触发搜索，使用新 workshop 值
}

// 新增：机台选择
const machine = ref(null)
const machineOptions = ref([])  // 将从API加载对象数组
const showMachineModal = ref(false)
const handleMachineConfirm = (value) => {
  machine.value = value  // value现在是对象
  showMachineModal.value = false
}
// 获取机台列表
const getMachineList = async () => {
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
      uni.showToast({ title: '无机台数据', icon: 'none' })
      return
    }
    // 映射为对象数组
    machineOptions.value = res.data.map(item => ({
      workshop: item['67ac0a87d6566fd9d09a2340'] || '',
      code: item['63db6b67e134b5cd4f9f96bb'] || '',
      name: item['63db6b67e134b5cd4f9f96bc'] || '',
      value: item['63db6b67e134b5cd4f9f96bb'] || ''  // 添加value，用code作为唯一键
    })).filter(item => item.value)  // 过滤无效项
    showMachineModal.value = true
  } catch (error) {
    console.error('获取机台列表失败:', error)
    uni.showToast({ title: '获取机台列表失败', icon: 'none' })
  }
}

// 新增：模具选择
const mold = ref(null)
const moldOptions = ref([])  // 将从API加载对象数组
const showMoldModal = ref(false)
const handleMoldConfirm = (value) => {
  mold.value = value  // value现在是对象
  showMoldModal.value = false
}
// 获取模具列表
const getMoldList = async () => {
  let res = null  // 初始化
  try {
    res = await callWorkflowListAPIPaged({
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
    // 映射为对象数组
    moldOptions.value = res.data.map(item => ({
      workshop: item['67ac0a87d6566fd9d09a2340'] || '',
      code: item['63db6b67e134b5cd4f9f96bb'] || '',
      name: item['63db6b67e134b5cd4f9f96bc'] || '',
      value: item['63db6b67e134b5cd4f9f96bb'] || ''
    })).filter(item => item.value)  // 过滤无效项
    showMoldModal.value = true
    return res  // 在try内return
  } catch (error) {
    console.error('获取模具列表失败:', error)
    uni.showToast({ title: '获取模具列表失败', icon: 'none' })
    return null  // catch中return null
  }
}

const searchValue = ref('')  // 搜索输入值
const billsList = ref([])  // 单据列表
const processList = ref([])  // 工序列表
const listKey = ref(0)  // 用于强制重新渲染的key


// 新增：工序模态状态
const showProcessModal = ref(false)
const selectedProcessData = ref(null)  // { item, process }
const processDispatchData = ref({
  employee: '',  // 员工名称
  quantity: 1,   // 派工数量
  time: 1,       // 改为初始1
  machine: '',   // 新增：机台
  mold: ''       // 新增：模具
})

const employeeList = ref([])  // 员工列表
const selectedEmployee = ref('')  // 选中员工ID

// 添加员工模态框相关状态
const showAddEmployeeModal = ref(false)
const selectedEmployeesForAdd = ref([])  // 选中的员工ID数组
const allEmployeesOptions = ref([])  // 所有员工选项（用于添加员工模态框）
const allEmployeesMap = ref({})  // 所有员工的完整信息映射（id -> employee对象）

// 加载员工列表
const loadEmployees = async () => {
  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'employee',  // 假设员工worksheetId，根据实际调整
      filters: [{
        "controlId": "67ac0a87d6566fd9d09a2340",  // 车间过滤
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [workshop.value]
      }]
    })
    if (res.data && res.data.length > 0) {
      const mappedEmployees = res.data.map(item => ({
        id: item['employeeIdControlId'] || '',  // 假设ID字段
        name: item['nameControlId'] || '',  // 姓名字段
        unrecordedHours: item['hoursControlId'] || 0  // 已派未记时数量字段，替换实际controlId
      })).filter(emp => emp.id)
      
      employeeList.value = mappedEmployees
      // 同时设置所有员工选项（用于添加员工模态框）
      allEmployeesOptions.value = mappedEmployees.map(emp => ({
        label: emp.name,
        value: emp.id
      }))
      // 创建员工映射，方便快速查找
      allEmployeesMap.value = {}
      mappedEmployees.forEach(emp => {
        allEmployeesMap.value[emp.id] = emp
      })
    }
  } catch (error) {
    console.error('加载员工失败:', error)
  }
}

// 打开工序模态
const openProcessModal = (item, process) => {
  selectedProcessData.value = { item, process }
  // 新增：重置选择
  machine.value = null
  mold.value = null
  processDispatchData.value = {
    employee: '',
    quantity: 1,
    time: 1,  // 改为1
    machine: '',
    mold: ''
  }
  selectedEmployee.value = ''  // 重置选中员工
  loadEmployees()  // 加载员工列表
  showProcessModal.value = true
}

// 确认派工，添加员工验证和dispatchData
const confirmProcessDispatch = () => {
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
  if (!selectedEmployee.value) {
    uni.showToast({ title: '请选择员工', icon: 'none' })
    return
  }

  processDispatchData.value.employee = employeeList.value.find(emp => emp.id === selectedEmployee.value)?.name || ''  // 设置员工名称

  // 单独创建工序派工模态框的8个核心数据对象
  const dispatchData = {
    orderCode: selectedProcessData.value?.item?.orderCode || '',  // 订单编号
    processName: selectedProcessData.value?.process?.processName || '',  // 工序
    finishCount: selectedProcessData.value?.process?.finishCount || 0,  // 已派工数量
    needCount: selectedProcessData.value?.process?.needCount || 0,  // 待派工数量
    quantity: processDispatchData.value.quantity,  // 本次派工数量
    time: processDispatchData.value.time,  // 本次派工时数
    employee: processDispatchData.value.employee,  // 员工（新增）
    machine: machine.value?.name || '',  // 机台（名称）
    mold: mold.value?.name || ''  // 模具（名称）
  }

  // 打印9个核心数据（添加员工）
  console.log('工序派工模态框的数据:', dispatchData)

  // TODO: 调用 API 保存派工，例如 uni.request({ url: '/api/process-dispatch', data: dispatchData })
  uni.showToast({ title: '派工成功' })
  showProcessModal.value = false
  // 刷新列表以更新工序进度
  search()
}

// 新增：添加员工按钮处理
const addEmployee = () => {
  // 先打开模态框
  showAddEmployeeModal.value = true
  // 延迟重置选中的员工，避免触发不必要的更新
  setTimeout(() => {
    selectedEmployeesForAdd.value = []
  }, 0)
}

// 处理添加员工模态框关闭
const handleAddEmployeeModalClose = (value) => {
  showAddEmployeeModal.value = value
}

// 处理添加员工确认
const handleAddEmployeeConfirm = (selectedIds) => {
  if (!selectedIds || selectedIds.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  
  let addedCount = 0
  // 将选中的员工添加到员工列表中（如果不存在）
  selectedIds.forEach(id => {
    const exists = employeeList.value.find(emp => emp.id === id)
    if (!exists) {
      // 从员工映射中获取完整信息
      const fullEmployee = allEmployeesMap.value[id]
      if (fullEmployee) {
        employeeList.value.push({
          id: fullEmployee.id,
          name: fullEmployee.name,
          unrecordedHours: fullEmployee.unrecordedHours || 0
        })
        addedCount++
      }
    }
  })
  
  if (addedCount > 0) {
    uni.showToast({ title: `已添加 ${addedCount} 名员工`, icon: 'success' })
  } else {
    uni.showToast({ title: '所选员工已存在', icon: 'none' })
  }
}

// 获取员工列表
const getEmployeeList = async () => {
  const res = await callWorkflowListAPIPaged({
    worksheetId: 'employee',
    filters: [{
      "controlId": "67ac0a87d6566fd9d09a2340",
      "dataType": 30,
      "spliceType": 1,
      "filterType": 2,
      "values": [workshop.value]
    }]
  })
  return res
}

// 新增：工单明细按钮处理
const goOrderDetail = () => {
  uni.navigateTo({
    url: '/pages/orderDetail/orderDetail'
  })
}

// 关闭工序模态
const closeProcessModal = () => {
  showProcessModal.value = false
  processDispatchData.value = { employee: '', quantity: 1, time: 1, machine: '', mold: '' }  // 改为time:1
  machine.value = null
  mold.value = null
}

const getProcessRaw = async (searchVal = '') => {
  const filters = [{
    "controlId": "669a6cae2503723eec1b49bb",
    "dataType": 30,
    "spliceType": 1,
    "filterType": 2,
    "values": [workshop.value]
  }]
  if (searchVal) {  // 只在有搜索值时添加 filter
    filters.push({
      "controlId": "6593b07ae97eb866a50eeba1",  // processOrder 字段，匹配订单编码
      "dataType": 30,
      "spliceType": 1,
      "filterType": 2,  // 精确匹配
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
  if (searchVal) {  // 只在有搜索值时添加 filter
    filters.push({
      "controlId": "655e1cbbbd2094b316347f92",  // 订单编码字段（原来的 orderGoods ID）
      "dataType": 30,
      "spliceType": 1,
      "filterType": 2,  // 精确匹配
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
  console.log('search 函数被调用，searchValue:', searchValue.value)
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  console.log('search 开始请求数据')
  const [billsRes, processRes] = await Promise.all([getBillsListRaw(searchValue.value), getProcessRaw(searchValue.value)])

  // 使用新数组确保 Vue 检测到变化
  const newProcessList = processRes.data.map(item => ({
    processName: item['656ffd1bba5ef3863bf3ec1e'],
    needCount: item['68099ac75d6fc47331574e82'],
    finishCount: item['669b71152503723eec1b52d7'],
    processOrder: item['6593b07ae97eb866a50eeba1']
  }))
  // 直接赋值新数组，确保引用完全改变
  processList.value = newProcessList.map(item => ({ ...item }))
  console.log('search 获取到的工序列表:', processList.value.length, '条')

  if (billsRes.data.length === 0) {
    billsList.value = []
    return
  }

  const newBillsList = billsRes.data.map(item => {
    const orderGoods = item['691c47ee1c02c451c72a81c5']  // 新订单物品 ID
    const orderCode = item['655e1cbbbd2094b316347f92']  // 订单编码 (旧 ID)
    // 使用最新的 processList.value 来过滤工序
    const processes = processList.value.filter(p => p.processOrder === orderCode)  // 关联基于 orderCode (旧 ID)
    return {
      orderGoods,
      orderCount: item['681b0b53b139204fd264c5fd'],
      name: item['691c247e1c02c451c72a6169'],
      completedProcess: processes.length > 0 ? `${processes.filter(p => p.finishCount === p.needCount).length}/${processes.length}` : '0',
      productCode: item['691d6336535b29cbd5c6c0ca'],
      processes: processes.map(p => ({ ...p })),  // 深拷贝每个process对象
      orderCode
    }
  })
  // 完全重新创建数组和对象，确保所有引用都是新的
  billsList.value = []
  await nextTick()
  billsList.value = newBillsList.map(item => ({
    ...item,
    processes: item.processes.map(p => ({ ...p }))
  }))
  // 更新key强制重新渲染
  listKey.value = Date.now()
  await nextTick()
  console.log('search 获取到的单据列表:', billsList.value.length, '条')
  console.log('search 完成，数据已更新')
  console.log('billsList 第一个项的 processes 数量:', billsList.value[0]?.processes?.length)
  console.log('billsList 第一个项的 processes:', JSON.stringify(billsList.value[0]?.processes))
  console.log('listKey 已更新为:', listKey.value)
}

// 添加工序
const addProcess = async (item) => {
  uni.navigateTo({
    url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(item.orderCode || '')}&productCode=${encodeURIComponent(item.productCode || '')}&workshop=${workshop.value}`
  })
}

// 刷新全部数据
const loadAllData = async (retryCount = 0) => {
  console.log('loadAllData 被调用，searchValue:', searchValue.value, 'retryCount:', retryCount)
  if (!searchValue.value || !searchValue.value.trim()) {
    billsList.value = []
    processList.value = []
    return
  }
  console.log('loadAllData 开始刷新数据')
  await search() // search 函数内部已经同时获取了单据列表和工序列表
  console.log('loadAllData 刷新完成')
  
  // 如果数据可能不完整，可以重试一次（最多重试1次）
  if (retryCount === 0) {
    setTimeout(async () => {
      console.log('loadAllData 延迟重试获取数据')
      await search()
    }, 1000)  // 1秒后再次获取，确保数据已同步
  }
}

// 在 script setup 中添加 computed
const remainingQuantity = computed(() => {
  return selectedProcessData.value?.process?.needCount - selectedProcessData.value?.process?.finishCount || 0
})

// 更新 watch，移除调试log
watch(() => processDispatchData.value.quantity, (newVal) => {
  const remaining = remainingQuantity.value
  if (newVal > remaining) {
    uni.showToast({ title: `数量不能超过剩余 ${remaining}`, icon: 'none' })
    processDispatchData.value.quantity = remaining
  } else if (newVal < 1) {
    processDispatchData.value.quantity = 1
  }
})

watch(() => processDispatchData.value.time, (newVal) => {
  if (newVal <= 0) {
    uni.showToast({ title: '时数必须大于0', icon: 'none' })
    processDispatchData.value.time = 1
  }
})

const validateTime = (e) => {
  const value = parseFloat(e.detail.value) || 0
  if (value <= 0) {
    processDispatchData.value.time = 1
  }
}

// 页面挂载时注册事件监听器（只注册一次）
onLoad(() => {
  // 监听选择单据事件
  uni.$on('selectOrder', (order) => {
    searchValue.value = order
  })
  // 监听添加工序事件（保留事件监听，但刷新由 onShow 处理）
  uni.$on('processAdded', (data) => {
    // 事件已接收，刷新由 onShow 处理
  })
  // 监听清空派工数据事件
  uni.$on('clearDispatchData', () => {
    searchValue.value = ''
    billsList.value = []
    processList.value = []
  })
})

// 页面显示时刷新数据（从其他页面返回时）
onShow(() => {
  console.log('onShow 触发，searchValue:', searchValue.value)
  // 每次显示页面时，如果有搜索值则刷新数据
  if (searchValue.value && searchValue.value.trim()) {
    console.log('onShow 触发刷新数据')
    // 延迟一下，确保后端数据已同步
    setTimeout(() => {
      loadAllData(0)  // 传入retryCount=0，会触发一次延迟重试
    }, 500)  // 延迟500ms再获取数据
  } else {
    console.log('onShow 触发，但 searchValue 为空，不刷新')
  }
})

onUnload(() => {
  uni.$off('selectOrder')  // 清理事件监听
  uni.$off('processAdded')  // 清理事件监听
  uni.$off('clearDispatchData')  // 清理清空事件监听
})

// 跳转派工查询
const goDispatchInquiry = () => {
  uni.navigateTo({
    url: '/pages/dispatchInquiry/dispatchInquiry'
  })
}

// 跳转员工工作量查询
const goWorkload = () => {
  uni.navigateTo({
    url: '/pages/workload/workload'
  })
}

// 跳转作业指导书
const goWorkGuide = () => {
  uni.navigateTo({
    url: '/pages/workGuide/workGuide'
  })
}

// 跳转选择单据
const goSelectBills = () => {
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}`
  })
}

// 退出
const quit = () => {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
/* 整体容器样式 */
.process-container {
  height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;

  /* 导航栏样式 */
  .header {
    height: px2vw(120px);
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
        height: px2vw(90px);
        width: px2vw(170px);
        display: flex;
        align-items: center;
        background-color: white;
        margin: px2vw(20px);
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
  z-index: 1000;

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
</style>