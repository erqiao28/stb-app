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
            <view class="radio-header">
              <view class="radio-col"></view>
              <view class="info-cols">
                <text class="col workshop">车间</text>
                <text class="col code">编码</text>
                <text class="col name">名称</text>
              </view>
            </view>
            <radio-group @change="onRadioChange">
              <label v-for="option in filteredOptions" :key="option.value" class="radio-label">
                <view class="radio-col">
                  <radio :value="option.value" :checked="internalModel?.value === option.value" />
                </view>
                <view class="info-cols">
                  <text class="col workshop">{{ option.workshop }}</text>
                  <text class="col code">{{ option.code }}</text>
                  <text class="col name">{{ option.name }}</text>
                </view>
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
  modelValue: {
    type: Object,
    default: null
  },
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
    const opts = props.options.filter(Boolean); // 移除空值
    if (opts.length > 0 && typeof opts[0] === 'string') {
      // 字符串数组：去重并转换为对象
      const uniqueOpts = [...new Set(opts)]
      return uniqueOpts.map(opt => ({ 
        workshop: '', 
        code: opt, 
        name: opt, 
        value: opt,
        label: opt 
      }))
    } else {
      // 对象数组：添加label（基于name），并基于value去重
      const uniqueMap = new Map();
      const withLabel = opts.map(opt => ({
        ...opt,
        label: opt.name || opt.label || opt.code || opt.workshop || ''
      }));
      withLabel.forEach(item => {
        if (!uniqueMap.has(item.value)) {
          uniqueMap.set(item.value, item);
        }
      });
      return Array.from(uniqueMap.values());
    }
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
  const query = searchFilter.value.toLowerCase()
  return processedOptions.value.filter(option => 
    (option.workshop && option.workshop.toLowerCase().includes(query)) ||
    (option.code && option.code.toLowerCase().includes(query)) ||
    (option.name && option.name.toLowerCase().includes(query))
  )
})

const internalModel = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  internalModel.value = val
})

watch(internalModel, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.visible, (val) => {
  if (val) {
    internalModel.value = props.modelValue
    searchQuery.value = ''
    searchFilter.value = ''  // 重置过滤
  }
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
  const selectedValue = e.detail.value
  internalModel.value = filteredOptions.value.find(option => option.value === selectedValue) || null
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
  z-index: 8888;
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

.search-section {
  display: flex;
  gap: px2vw(10px);
  margin-bottom: px2vw(30px);
  flex-shrink: 0;
}

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

.search-btn {
  height: px2vw(70px);
  width: px2vw(150px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #5884f1;
  color: white;
  border: none;
  border-radius: px2vw(18px);
  cursor: pointer;
  font-size: px2vw(30px);
}

.search-btn:hover {
  background-color: #0056b3;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: px2vw(20px);
  max-height: calc(#{px2vw(700px)} - #{px2vw(200px)});
  overflow-y: auto;
}

.radio-header {
  display: flex;
  align-items: center;
  padding: px2vw(15px);
  border-bottom: px2vw(2px) solid #ddd;
  background-color: #f5f5f5;
  font-weight: bold;
}

.radio-col {
  flex-shrink: 0;
  width: px2vw(60px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-cols {
  flex: 1;
  display: flex;
  gap: px2vw(40px);
}

.col {
  flex: 1;
  font-size: px2vw(30px);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col.workshop {
  margin-left: px2vw(20px);
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: px2vw(15px);
  border-bottom: px2vw(1px) solid #eee;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: px2vw(10px);
  padding: px2vw(30px) px2vw(40px);
  border-top: px2vw(2px) solid #eee;
  flex-shrink: 0;
}

.btn-cancel, .btn-confirm {
  width: px2vw(200px);
  height: px2vw(70px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: px2vw(18px);
  cursor: pointer;
  font-size: px2vw(30px);
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: #5884f1;
  color: white;
}

.btn-confirm:hover {
  background-color: #0056b3;
}
</style>
