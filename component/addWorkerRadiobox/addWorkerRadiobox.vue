<template>
    <view class="modal-overlay" v-if="visible" @click.self="close">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ title }}</text>
        </view>
        <view class="modal-toolbar-row">
          <view class="modal-workshop-selector">
            <text class="workshop-label">车间：</text>
            <picker mode="selector" :range="workshopOptions" :value="workshopIndex" @change="onWorkshopChange">
              <view class="workshop-value">
                {{ workshop || '请选择车间' }}
              </view>
            </picker>
          </view>
          <!-- 员工姓名模糊筛选（与车间同一行） -->
          <view class="employee-search-box">
            <input
              v-model="searchKeyword"
              class="employee-search-input"
              type="text"
              placeholder="输入员工姓名筛选"
              placeholder-class="employee-search-placeholder"
              confirm-type="search"
            />
          </view>
          <view v-if="showEmployeeTypeSwitch" class="employee-type-switch">
            <view
              class="switch-btn"
              :class="{ 'switch-btn--active': employeeTypeFilter === 'normal' }"
              @click="onEmployeeTypeSwitch('normal')"
            >普</view>
            <view
              class="switch-btn"
              :class="{ 'switch-btn--active': employeeTypeFilter === 'temp' }"
              @click="onEmployeeTypeSwitch('temp')"
            >临</view>
          </view>
        </view>
        <view class="modal-body">
          <view class="employee-table-header">
            <view class="col-checkbox"></view>
            <view class="col-name">姓名</view>
            <view class="col-position">岗位</view>
            <view class="col-hours">总工时数</view>
            <view class="col-hours">未派工时</view>
          </view>
          <view class="checkbox-group">
            <checkbox-group @change="onCheckboxChange">
              <label v-for="option in filteredEmployeeOptions" :key="option.value" class="checkbox-label">
                <view class="col-checkbox">
                  <checkbox :value="option.value" :checked="isChecked(option.value)" />
                </view>
                <view class="col-name">{{ option.label }}</view>
                <view class="col-position">{{ option.position || '-' }}</view>
                <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
              </label>
            </checkbox-group>
            <view v-if="filteredEmployeeOptions.length === 0" class="employee-search-empty">
              无匹配的员工
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn-cancel" @click="close">取消</view>
          <view class="btn-clear" @click="clear">清空</view>
          <view class="btn-confirm" @click="confirm">确定</view>
        </view>
      </view>
    </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '请选择'
  },
  visible: {
    type: Boolean,
    default: false
  },
  workshopOptions: {
    type: Array,
    default: () => []
  },
  workshop: {
    type: String,
    default: ''
  },
  // 最多可选数量：仅记时派工传 1（单选），其他页面不传则默认 0（不限制）
  maxSelection: {
    type: Number,
    default: 0
  },
  /** 是否显示员工类型切换按钮（普/临） */
  showEmployeeTypeSwitch: {
    type: Boolean,
    default: false
  },
  /** 当前员工类型筛选：normal-正常员工，temp-临时工 */
  employeeTypeFilter: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'update:workshop', 'update:employeeTypeFilter', 'confirm'])

// 车间选择相关
const workshopIndex = computed(() => {
  const index = props.workshopOptions.indexOf(props.workshop)
  return index >= 0 ? index : 0
})

const onWorkshopChange = (e) => {
  const selectedIndex = e.detail.value
  const selectedWorkshop = props.workshopOptions[selectedIndex]
  emit('update:workshop', selectedWorkshop)
}

// 切换员工类型
const onEmployeeTypeSwitch = (type) => {
  emit('update:employeeTypeFilter', type)
}

// 处理 options 为字符串数组或对象数组的情况，并去重
const processedOptions = computed(() => {
  if (Array.isArray(props.options)) {
    if (props.options.length > 0 && typeof props.options[0] === 'string') {
      // 去重：使用 Set 移除重复字符串
      const uniqueOpts = [...new Set(props.options)]
      return uniqueOpts.map(opt => ({ label: opt, value: opt, position: '' }))
    }
    // 如果是对象数组，简单返回（假设用户已去重）
    return props.options
  }
  return []
})

const internalModel = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
let isClosing = false  // 标记是否正在关闭

// 员工姓名模糊筛选关键词（打开弹窗时清空）
const searchKeyword = ref('')

/** 按姓名模糊筛选后的员工列表（保留原顺序） */
const filteredEmployeeOptions = computed(() => {
  const kw = String(searchKeyword.value || '').trim()
  const opts = processedOptions.value
  if (!kw) return opts
  return opts.filter(opt => String(opt.label || '').includes(kw))
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      isClosing = false
      searchKeyword.value = ''
      internalModel.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    }
  }
)

// 移除对 props.modelValue 的 watch，避免循环更新
// 只在打开模态框时同步一次即可

// 监听 internalModel 的变化，但关闭时不触发
watch(() => [...internalModel.value], (val) => {
  if (!isClosing) {
    emit('update:modelValue', val)
  }
})

const close = () => {
  // 先标记正在关闭，避免触发 watch
  isClosing = true
  // 发出关闭事件
  emit('update:visible', false)
  // 延迟重置选中的值（取消时不保存更改）
  setTimeout(() => {
    internalModel.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    isClosing = false
  }, 0)
}

const confirm = () => {
  emit('confirm', [...internalModel.value])
  close()
}

const clear = () => {
  internalModel.value = []
}

const isChecked = (value) => {
  const id = normalizeId(value)
  return internalModel.value.some((x) => normalizeId(x) === id)
}

const normalizeId = (v) => String(v)

// 保持「点选顺序」：保留仍勾选项的原顺序，新勾选项按本次事件中的顺序接在后面（不采用平台 detail.value 的固定排序）
const onCheckboxChange = (e) => {
  const newValues = (e.detail.value || []).map(normalizeId)
  const prevOrder = internalModel.value.map(normalizeId)
  const prevSet = new Set(prevOrder)
  const kept = prevOrder.filter((id) => newValues.includes(id))
  const newlyAdded = newValues.filter((id) => !prevSet.has(id))
  let next = [...kept, ...newlyAdded]

  if (props.maxSelection === 1 && next.length > 1) {
    next = [next[next.length - 1]]
  } else if (props.maxSelection > 0 && next.length > props.maxSelection) {
    next = next.slice(-props.maxSelection)
  }
  internalModel.value = next
}
</script>

<style scoped lang="scss">
.modal-overlay {
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
}

.modal-content {
  background: white;
  border-radius: px2vw(18px);
  width: px2vw(1400px);
  height: px2vw(700px);
  box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: px2vw(30px) px2vw(40px);
  border-bottom: px2vw(2px) solid #eee;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-weight: bold;
  font-size: px2vw(35px);
  color: #333;
  text-align: center;
}

.modal-toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: px2vw(16px);
  padding: px2vw(12px) px2vw(40px);
  border-bottom: px2vw(2px) solid #eee;
  flex-shrink: 0;
  background: #fafafa;
  box-sizing: border-box;
}

.modal-workshop-selector {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: px2vw(15px);
  max-width: 42%;

  .workshop-label {
    font-size: px2vw(30px);
    color: #666;
    font-weight: bold;
    white-space: nowrap;
  }

  .workshop-value {
    flex: 0 1 auto;
    min-width: px2vw(200px);
    max-width: px2vw(380px);
    font-size: px2vw(30px);
    color: #333;
    padding: px2vw(8px) px2vw(12px);
    background: #fff;
    border-radius: px2vw(5px);
    border: px2vw(1px) solid #eee;
    min-height: px2vw(50px);
    display: flex;
    align-items: center;
    box-sizing: border-box;
    cursor: pointer;
  }
}

.employee-type-switch {
  display: flex;
  background-color: #f0f0f0;
  border-radius: px2vw(6px);
  overflow: hidden;

  .switch-btn {
    padding: px2vw(8px) px2vw(14px);
    font-size: px2vw(24px);
    color: #666;
    background-color: transparent;

    &.switch-btn--active {
      color: #fff;
      background-color: #1890ff;
    }
  }
}

.modal-body {
  flex: 1;
  padding: px2vw(20px) px2vw(20px) px2vw(100px) px2vw(20px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 员工姓名模糊筛选框（与车间选择同一行） */
.employee-search-box {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.employee-search-input {
  width: 100%;
  box-sizing: border-box;
  height: px2vw(52px);
  font-size: px2vw(28px);
  color: #333;
  padding: 0 px2vw(20px);
  background: #fff;
  border: px2vw(1px) solid #e5e5e5;
  border-radius: px2vw(10px);
}

.employee-search-placeholder {
  color: #999;
}

.employee-search-empty {
  padding: px2vw(60px) 0;
  text-align: center;
  font-size: px2vw(28px);
  color: #999;
}

.employee-table-header {
  display: flex;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: px2vw(15px);
  border-bottom: px2vw(2px) solid #eee;
  align-items: center;
  flex-shrink: 0;

  .col-checkbox {
    width: px2vw(80px);
    text-align: center;
    flex-shrink: 0;
  }

  .col-name {
    flex: 1.6;
    font-size: px2vw(30px);
    padding-left: px2vw(20px);
  }

  .col-position {
    flex: 1.2;
    font-size: px2vw(28px);
    text-align: center;
    padding: 0 px2vw(8px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .col-hours {
    flex: 1;
    font-size: px2vw(30px);
    text-align: right;
    padding-right: px2vw(15px);
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: px2vw(0px);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: px2vw(15px);
  border-bottom: px2vw(1px) solid #eee;
  border-radius: 0;

  &:hover {
    background-color: #f5f5f5;
  }

  .col-checkbox {
    width: px2vw(80px);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  .col-name {
    flex: 1.6;
    font-size: px2vw(30px);
    padding-left: px2vw(20px);
    display: flex;
    align-items: center;
  }

  .col-position {
    flex: 1.2;
    font-size: px2vw(28px);
    text-align: center;
    padding: 0 px2vw(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #555;
  }

  .col-hours {
    flex: 1;
    font-size: px2vw(30px);
    text-align: right;
    padding-right: px2vw(15px);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

.modal-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  gap: px2vw(10px);
  padding: px2vw(20px) px2vw(20px);
  border-top: px2vw(2px) solid #eee;
  flex-shrink: 0;
  background: white;
  z-index: 10;
}

.btn-cancel, .btn-confirm, .btn-clear {
  width: px2vw(200px);
  height: px2vw(70px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: px2vw(18px);
  cursor: pointer;
  font-size: px2vw(30px);
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
  touch-action: manipulation;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-clear {
  background: #f5f5f5;
  color: #666;
}

.btn-clear:hover {
  background-color: #e0e0e0;
}

.btn-confirm {
  background: #5884f1;
  color: white;
}

.btn-confirm:hover {
  background-color: #0056b3;
}
</style>
