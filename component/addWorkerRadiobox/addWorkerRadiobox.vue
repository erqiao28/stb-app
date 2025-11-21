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
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: px2vw(18px);
  width: px2vw(1400px);
  height: px2vw(700px);
  overflow-y: auto;
  box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
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

.modal-body {
  flex: 1;
  padding: px2vw(20px) px2vw(20px) px2vw(10px) px2vw(20px);
  display: flex;
  flex-direction: column;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: px2vw(20px);
  max-height: calc(#{px2vw(700px)} - #{px2vw(200px)});
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: px2vw(15px);
  border-bottom: px2vw(1px) solid #eee;
  border-radius: 0;
}

.checkbox-label text {
  font-size: px2vw(30px);
  margin-left: px2vw(10px);
}

.checkbox-label:hover {
  background-color: #f5f5f5;
}

.checkbox-label checkbox {
  margin-right: px2vw(10px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: px2vw(10px);
  padding: px2vw(30px) px2vw(40px);
  border-top: px2vw(2px) solid #eee;
  flex-shrink: 0;
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
