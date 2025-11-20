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

<style scoped lang="scss">
/* 模态框遮罩层 */
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

/* 模态框内容 */
.modal-content {
  background: white;
  border-radius: px2vw(10px);
  width: px2vw(1400px);
  height: px2vw(700px);
  overflow-y: auto;
  box-shadow: 0 px2vw(5px) px2vw(25px) rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: px2vw(30px);
  border-bottom: px2vw(1.25px) solid #eee;
  flex-shrink: 0;
}

/* 模态框标题 */
.modal-title {
  margin: 0;
  font-size: px2vw(35px);
  text-align: center;
}

/* 模态框主体 */
.modal-body {
  flex: 1;
  padding: px2vw(30px);
  display: flex;
  flex-direction: column;
}

/* 搜索区域 */
.search-section {
  display: flex;
  gap: px2vw(10px);
  margin-bottom: px2vw(30px);
  flex-shrink: 0;
}

/* 搜索输入框 */
.search-input {
  flex: 1;
  padding: px2vw(20px) px2vw(20px);
  border-bottom: px2vw(1.25px) solid #ddd;
  border-left: none;
  border-top: none;
  border-right: none;
  border-radius: 0;
  font-size: px2vw(30px);
  pointer-events: auto;
  position: relative;
  z-index: 10000;
  height: px2vw(80px);
  line-height: 1.2;
  background: white;
  box-sizing: border-box;
}

/* 搜索按钮 */
.search-btn {
  height: px2vw(70px);
  width: px2vw(150px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: px2vw(5px);
  cursor: pointer;
  font-size: px2vw(30px);
}

.search-btn:hover {
  background-color: #0056b3;
}

/* 单选组 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: px2vw(20px);
  max-height: calc(#{px2vw(700px)} - #{px2vw(200px)});
  overflow-y: auto;
}

/* 单选标签 */
.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: px2vw(20px) px2vw(10px);
  border-bottom: px2vw(1.25px) solid #ddd;
  border-radius: 0;
}

.radio-label text {
  font-size: px2vw(30px);
  margin-left: px2vw(10px);
}

.radio-label:hover {
  background-color: #f5f5f5;
}

.radio-label input[type="radio"] {
  margin-right: px2vw(10px);
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: px2vw(10px);
  padding: px2vw(30px);
  border-top: px2vw(1.25px) solid #eee;
  flex-shrink: 0;
}

/* 按钮 */
.btn-cancel, .btn-confirm {
  height: px2vw(70px);
  width: px2vw(150px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: px2vw(1.25px) solid #ddd;
  border-radius: px2vw(5px);
  cursor: pointer;
  font-size: px2vw(30px);
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
