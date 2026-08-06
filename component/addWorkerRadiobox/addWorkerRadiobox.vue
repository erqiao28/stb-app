<template>
    <view class="modal-overlay" v-if="visible" @click.self="close">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ title }}</text>
        </view>
        <view class="modal-toolbar-row" :class="{ 'modal-toolbar-row--no-filters': !showPositionFilterBar && !showEmployeeTypeSwitch }">
          <view class="modal-workshop-selector">
            <text class="workshop-label">车间：</text>
            <picker mode="selector" :range="workshopOptions" :value="workshopIndex" @change="onWorkshopChange">
              <view class="workshop-value">
                {{ workshop || '请选择车间' }}
              </view>
            </picker>
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
          <view v-if="showPositionFilterBar" class="position-filter-bar">
            <scroll-view scroll-x class="position-filter-scroll" :show-scrollbar="false">
              <view class="position-filter-chips">
                <view
                  class="filter-chip"
                  :class="{ 'filter-chip--active': activePositionFilterLabel === null }"
                  @click="setPositionFilter(null)"
                >
                  全部
                </view>
                <view
                  v-for="btn in positionFilterButtons"
                  :key="btn.label"
                  class="filter-chip"
                  :class="{ 'filter-chip--active': activePositionFilterLabel === btn.label }"
                  @click="setPositionFilter(btn.label)"
                >
                  {{ btn.label }}
                </view>
              </view>
            </scroll-view>
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
              <template v-if="partitionedEmployeeOptions.showSections">
                <view v-if="partitionedEmployeeOptions.priority.length" class="employee-section-label">
                  优先匹配（工序与岗位）
                </view>
                <label
                  v-for="option in partitionedEmployeeOptions.priority"
                  :key="'p-' + option.value"
                  class="checkbox-label"
                >
                  <view class="col-checkbox">
                    <checkbox :value="option.value" :checked="isChecked(option.value)" />
                  </view>
                  <view class="col-name">{{ option.label }}</view>
                  <view class="col-position">{{ option.position || '-' }}</view>
                  <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                  <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
                </label>
                <view v-if="partitionedEmployeeOptions.fallback.length" class="employee-section-label">
                  次优先（机抛、抛光）
                </view>
                <label
                  v-for="option in partitionedEmployeeOptions.fallback"
                  :key="'f-' + option.value"
                  class="checkbox-label"
                >
                  <view class="col-checkbox">
                    <checkbox :value="option.value" :checked="isChecked(option.value)" />
                  </view>
                  <view class="col-name">{{ option.label }}</view>
                  <view class="col-position">{{ option.position || '-' }}</view>
                  <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                  <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
                </label>
                <view
                  v-if="
                    partitionedEmployeeOptions.rest.length &&
                    (partitionedEmployeeOptions.priority.length || partitionedEmployeeOptions.fallback.length)
                  "
                  class="employee-section-label"
                >
                  其他员工
                </view>
                <label
                  v-for="option in partitionedEmployeeOptions.rest"
                  :key="'r-' + option.value"
                  class="checkbox-label"
                >
                  <view class="col-checkbox">
                    <checkbox :value="option.value" :checked="isChecked(option.value)" />
                  </view>
                  <view class="col-name">{{ option.label }}</view>
                  <view class="col-position">{{ option.position || '-' }}</view>
                  <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                  <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
                </label>
              </template>
              <template v-else>
                <label v-for="option in optionsAfterPositionFilter" :key="option.value" class="checkbox-label">
                  <view class="col-checkbox">
                    <checkbox :value="option.value" :checked="isChecked(option.value)" />
                  </view>
                  <view class="col-name">{{ option.label }}</view>
                  <view class="col-position">{{ option.position || '-' }}</view>
                  <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                  <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
                </label>
              </template>
            </checkbox-group>
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
import { ref, watch, computed, nextTick } from 'vue'
import {
  pickAutoSelectEmployeeIds,
  getAddEmployeeModalPositionFilters,
  employeePositionMatchesFilter
} from '../../utils/employeePositionMatch'

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
  /** 岗位匹配关键字（岗位字段包含即视为匹配），用于排序靠前与自动勾选 */
  positionPriorityKeywords: {
    type: Array,
    default: () => []
  },
  /** 次优先关键字（未命中主关键字时，岗位包含则排在「其他」之前），如抛光车间机抛/抛光 */
  positionFallbackKeywords: {
    type: Array,
    default: () => []
  },
  /** 打开弹窗时自动勾选岗位匹配的员工（受 maxSelection 限制） */
  autoSelectMatching: {
    type: Boolean,
    default: false
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

/** 当前车间在「添加员工」弹窗中是否展示岗位筛选条 */
const positionFilterButtons = computed(() => getAddEmployeeModalPositionFilters(props.workshop))
const showPositionFilterBar = computed(() => positionFilterButtons.value.length > 0)

/** 选中的筛选按钮 label，null 表示全部 */
const activePositionFilterLabel = ref(null)

const setPositionFilter = (label) => {
  activePositionFilterLabel.value = label
}

const optionsAfterPositionFilter = computed(() => {
  const opts = processedOptions.value
  const label = activePositionFilterLabel.value
  if (label == null) return opts
  const cfg = positionFilterButtons.value.find((b) => b.label === label)
  if (!cfg) return opts
  return opts.filter((o) => employeePositionMatchesFilter(o.position, cfg))
})

const positionMatchKeywords = computed(() =>
  (props.positionPriorityKeywords || []).filter((k) => k != null && String(k).trim() !== '')
)

const positionFallbackMatchKeywords = computed(() =>
  (props.positionFallbackKeywords || []).filter((k) => k != null && String(k).trim() !== '')
)

const optionMatchesPriority = (opt) => {
  const kws = positionMatchKeywords.value
  if (!kws.length) return false
  const pos = String(opt.position || '')
  return kws.some((kw) => pos.includes(String(kw)))
}

const optionMatchesFallbackOnly = (opt) => {
  if (optionMatchesPriority(opt)) return false
  const kws = positionFallbackMatchKeywords.value
  if (!kws.length) return false
  const pos = String(opt.position || '')
  return kws.some((kw) => pos.includes(String(kw)))
}

/** 主匹配 → 次优先匹配 → 其余 */
const partitionedEmployeeOptions = computed(() => {
  const opts = optionsAfterPositionFilter.value
  const primaryKws = positionMatchKeywords.value
  const fbKws = positionFallbackMatchKeywords.value
  if (!primaryKws.length && !fbKws.length) {
    return { priority: [], fallback: [], rest: opts, showSections: false }
  }
  const priority = []
  const fallback = []
  const rest = []
  for (const o of opts) {
    if (optionMatchesPriority(o)) priority.push(o)
    else if (optionMatchesFallbackOnly(o)) fallback.push(o)
    else rest.push(o)
  }
  return {
    priority,
    fallback,
    rest,
    showSections: primaryKws.length > 0 || fbKws.length > 0
  }
})

const internalModel = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
let isClosing = false  // 标记是否正在关闭

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      isClosing = false
      activePositionFilterLabel.value = null
      await nextTick()
      if (
        props.autoSelectMatching &&
        positionMatchKeywords.value.length &&
        processedOptions.value.length
      ) {
        internalModel.value = pickAutoSelectEmployeeIds(
          processedOptions.value,
          positionMatchKeywords.value,
          props.maxSelection
        ).map((id) => normalizeId(id))
      } else {
        internalModel.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
      }
    }
  }
)

watch(
  () => props.workshop,
  () => {
    activePositionFilterLabel.value = null
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
  &.modal-toolbar-row--no-filters {
    .modal-workshop-selector {
      max-width: none;
      flex: 1;
      min-width: 0;
    }

    .workshop-value {
      max-width: none;
      flex: 1;
    }
  }
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

.position-filter-bar {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;

  .position-filter-scroll {
    width: 100%;
    white-space: nowrap;
  }

  .position-filter-chips {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: px2vw(12px);
    padding: px2vw(4px) 0;
  }

  .filter-chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: px2vw(10px) px2vw(22px);
    font-size: px2vw(28px);
    color: #444;
    background: #fff;
    border: px2vw(2px) solid #ddd;
    border-radius: px2vw(24px);
    box-sizing: border-box;

    &.filter-chip--active {
      color: #fff;
      background: #5884f1;
      border-color: #5884f1;
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

.employee-section-label {
  padding: px2vw(12px) px2vw(15px) px2vw(8px);
  font-size: px2vw(26px);
  color: #5884f1;
  font-weight: bold;
  background: #f0f5ff;
  border-bottom: px2vw(1px) solid #e0e8ff;
  flex-shrink: 0;
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
