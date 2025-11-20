<template>
    <view class="modal-overlay" v-if="visible" @click.self="close">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ title }}</text>
        </view>
        <view class="modal-body">
          <view class="checkbox-group">
            <checkbox-group @change="onCheckboxChange">
              <label v-for="option in processedOptions" :key="option.value" class="checkbox-label">
                <checkbox :value="option.value" :checked="isChecked(option.value)" />
                <text>{{ option.label }}</text>
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
  }
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'confirm'])

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
  internalModel.value = e.detail.value || []
}
</script>

<style scoped>
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
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 10rpx;
  width: 2500rpx;
  height: 1200rpx;
  overflow-y: auto;
  box-shadow: 0 5rpx 25rpx rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 50rpx;
  border-bottom: 1.25rpx solid #eee;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 50rpx;
  text-align: center;
}

.modal-body {
  flex: 1;
  padding: 50rpx;
  display: flex;
  flex-direction: column;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  max-height: calc(625rpx - 250rpx);
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 30rpx 20rpx;
  border-bottom: 1.25rpx solid #ddd;
  border-radius: 0;
}

.checkbox-label text {
  font-size: 50rpx;
  margin-left: 10rpx;
}

.checkbox-label:hover {
  background-color: #f5f5f5;
}

.checkbox-label checkbox {
  margin-right: 20rpx;
}

.modal-footer {
  display: flex;
  justify-content: space-evenly;
  gap: 20rpx;
  padding: 50rpx;
  border-top: 1.25rpx solid #eee;
  flex-shrink: 0;
}

.btn-cancel, .btn-confirm, .btn-clear {
  height: 100rpx;
  width: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.25rpx solid #ddd;
  border-radius: 5rpx;
  cursor: pointer;
  font-size: 50rpx;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
  touch-action: manipulation;
}

.btn-cancel {
  background-color: white;
  color: #333;
}

.btn-clear {
  background-color: #f5f5f5;
  color: #666;
  border-color: #ddd;
}

.btn-clear:hover {
  background-color: #e0e0e0;
}

.btn-confirm {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-confirm:hover {
  background-color: #0056b3;
}
</style>
