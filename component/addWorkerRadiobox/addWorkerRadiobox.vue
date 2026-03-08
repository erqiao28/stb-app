<template>
    <view class="modal-overlay" v-if="visible" @click.self="close">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ title }}</text>
        </view>
        <view class="modal-workshop-selector">
          <text class="workshop-label">车间：</text>
          <picker mode="selector" :range="workshopOptions" :value="workshopIndex" @change="onWorkshopChange">
            <view class="workshop-value">
              {{ workshop || '请选择车间' }}
            </view>
          </picker>
        </view>
        <view class="modal-body">
          <view class="employee-table-header">
            <view class="col-checkbox"></view>
            <view class="col-name">姓名</view>
            <view class="col-hours">总工时数</view>
            <view class="col-hours">未派工时</view>
          </view>
          <view class="checkbox-group">
            <checkbox-group @change="onCheckboxChange">
              <label v-for="option in processedOptions" :key="option.value" class="checkbox-label">
                <view class="col-checkbox">
                  <checkbox :value="option.value" :checked="isChecked(option.value)" />
                </view>
                <view class="col-name">{{ option.label }}</view>
                <view class="col-hours">{{ option.totalHours || 0 }} 时</view>
                <view class="col-hours">{{ option.unrecordedHours || 0 }} 时</view>
              </label>
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
  }
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'update:workshop', 'confirm'])

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

// 处理 options 为字符串数组或对象数组的情况，并去重
const processedOptions = computed(() => {
  if (Array.isArray(props.options)) {
    if (props.options.length > 0 && typeof props.options[0] === 'string') {
      // 去重：使用 Set 移除重复字符串
      const uniqueOpts = [...new Set(props.options)]
      return uniqueOpts.map(opt => ({ label: opt, value: opt }))
    }
    // 如果是对象数组，简单返回（假设用户已去重）
    return props.options
  }
  return []
})

const internalModel = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
let isClosing = false  // 标记是否正在关闭

watch(() => props.visible, (val) => {
  if (val) {
    // 打开模态框时，重置为初始值
    isClosing = false
    internalModel.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  }
})

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
  return internalModel.value.includes(value)
}

const onCheckboxChange = (e) => {
  let next = e.detail.value || []
  if (props.maxSelection === 1 && next.length > 1) {
    // 单选：只保留最后勾选的那一项
    next = [next[next.length - 1]]
  } else if (props.maxSelection === 1 && next.length === 1) {
    // 已是单选，直接使用
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

.modal-workshop-selector {
  display: flex;
  align-items: center;
  padding: px2vw(15px) px2vw(40px);
  border-bottom: px2vw(2px) solid #eee;
  flex-shrink: 0;
  gap: px2vw(15px);

  .workshop-label {
    font-size: px2vw(30px);
    color: #666;
    font-weight: bold;
    white-space: nowrap;
  }

  .workshop-value {
    flex: 1;
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
    flex: 2;
    font-size: px2vw(30px);
    padding-left: px2vw(20px);
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
    flex: 2;
    font-size: px2vw(30px);
    padding-left: px2vw(20px);
    display: flex;
    align-items: center;
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
