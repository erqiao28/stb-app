<template>
    <view class="modal-overlay" v-if="visible" @click.self="close">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">{{ title }}</text>
        </view>
        <view class="modal-body">
          <view class="search-section">
            <input 
              v-model="searchQuery" 
              @focus="onFocus"
              type="text" 
              placeholder="请输入关键词" 
              class="search-input"
            />
            <button class="search-btn" @click="performSearch">搜索</button>
          </view>
          <view class="radio-group">
            <radio-group @change="onRadioChange">
              <label v-for="option in filteredOptions" :key="option.value" class="radio-label">
                <radio :value="option.value" :checked="internalModel === option.value" />
                <text>{{ option.label }}</text>
              </label>
            </radio-group>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="close">取消</button>
          <button class="btn-confirm" @click="confirm">确定</button>
        </view>
      </view>
    </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: String,
  options: {
    type: [Array, String],
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

// 处理 options 为字符串数组的情况，并去重
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

const searchQuery = ref('')
const searchFilter = ref('')

// 过滤选项
const filteredOptions = computed(() => {
  if (!searchFilter.value) {
    return processedOptions.value
  }
  return processedOptions.value.filter(option => 
    option.label.toLowerCase().includes(searchFilter.value.toLowerCase())
  )
})

const internalModel = ref(props.modelValue)

watch(() => props.visible, (val) => {
  if (val) {
    internalModel.value = props.modelValue
    searchQuery.value = ''
    searchFilter.value = ''  // 重置过滤
  }
})

watch(internalModel, (val) => {
  emit('update:modelValue', val)
})

const close = () => {
  emit('update:visible', false)
}

const confirm = () => {
  emit('confirm', internalModel.value)
  close()
}

const performSearch = () => {
  searchFilter.value = searchQuery.value  // 应用搜索过滤
}

const onInput = (e) => {
  const inputValue = e.detail ? e.detail.value : (e.target ? e.target.value : '');
  searchQuery.value = inputValue;
  searchFilter.value = inputValue;  // 实时更新过滤
};

const onFocus = () => {
  console.log('Input focused');
}

watch(searchQuery, (newVal) => {
  console.log('Search query changed:', newVal);
  searchFilter.value = newVal  // 实时过滤
})

const onRadioChange = (e) => {
  internalModel.value = e.detail.value
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

.search-section {
  display: flex;
  gap: 12.5rpx;
  margin-bottom: 50rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 25rpx 25rpx;  /* 减小垂直padding，避免挤压 */
  border-bottom: 1.25rpx solid #ddd;
  border-left: none;
  border-top: none;
  border-right: none;
  border-radius: 0;
  font-size: 50rpx;  /* 稍减小字体，避免过大 */
  pointer-events: auto;
  position: relative;
  z-index: 10000;
  height: 125rpx;  /* 固定高度 */
  line-height: 1.2;  /* 正常行高，确保文本可见 */
  background: white;  /* 明确背景 */
  box-sizing: border-box;  /* 包含padding */
}

.search-btn {
  height: 90rpx;
  width: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5rpx;
  cursor: pointer;
  font-size: 50rpx;
}

.search-btn:hover {
  background-color: #0056b3;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  max-height: calc(625rpx - 250rpx);  /* 调整以适应高度 */
  overflow-y: auto;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 30rpx 20rpx; /* 增加垂直 padding 以提高高度 */
  border-bottom: 1.25rpx solid #ddd;
  border-radius: 0;
}

.radio-label text {
  font-size: 50rpx; /* 增大选项名字体大小 */
  margin-left: 10rpx;
}

.radio-label:hover {
  background-color: #f5f5f5;
}

.radio-label input[type="radio"] {
  margin-right: 20rpx;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12.5rpx;
  padding: 50rpx;
  border-top: 1.25rpx solid #eee;
  flex-shrink: 0;
}

.btn-cancel, .btn-confirm {
  height: 100rpx;
  width: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.25rpx solid #ddd;
  border-radius: 5rpx;
  cursor: pointer;
  font-size: 50rpx;
}

.btn-cancel {
  background-color: white;
  color: #333;
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
