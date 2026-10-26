<template>
  <!-- 合并工序弹窗：两个派工页面共用，查询逻辑与提交动作解耦 -->
  <view class="merge-process-modal" v-if="visible" @click.self="close">
    <view class="merge-process-content" @click.stop>
      <view class="merge-process-title">合并工序</view>
      <view class="merge-process-search">
        <input
          class="merge-process-search-input"
          type="text"
          v-model="searchValue"
          placeholder="请输入工序名称"
          @input="onSearchInput"
        />
      </view>
      <!-- 列表区单独 flex 收缩，避免 scroll-view 盖住底部按钮 -->
      <view class="merge-process-list-wrap">
        <scroll-view
          scroll-y
          class="merge-process-scroll"
          :lower-threshold="50"
          @scrolltolower="loadMore"
        >
          <view v-if="tableData.length > 0" class="merge-process-header">
            <view class="merge-process-header-check"></view>
            <view class="merge-process-header-sequence">生产顺序</view>
            <view class="merge-process-header-name">工序名称</view>
          </view>
          <view
            v-for="process in tableData"
            :key="process.rowid || process.processName"
            class="merge-process-row"
            :class="{ selected: isSelected(process.rowid) }"
            @click="toggleSelect(process)"
          >
            <view class="merge-process-check">{{ isSelected(process.rowid) ? '✓' : '' }}</view>
            <view class="merge-process-sequence">{{ process.sequence || '-' }}</view>
            <text class="merge-process-name">{{ process.processName || '-' }}</text>
          </view>
          <view v-if="loading && tableData.length === 0" class="merge-process-tip">加载中...</view>
          <view v-else-if="!loading && tableData.length === 0" class="merge-process-tip">暂无工序</view>
          <view v-if="loading && tableData.length > 0" class="merge-process-tip">加载中...</view>
          <view v-if="!hasMore && tableData.length > 0" class="merge-process-tip">没有更多了</view>
        </scroll-view>
      </view>
      <view class="merge-process-footer-bar">
        <view class="merge-process-footer">
          <button class="btn-cancel" @click="close">取消</button>
          <button class="btn-merge" @click="confirmSelection">合并</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { callWorkflowListAll } from '../../utils/workflow'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  /** 生产编号与车间共同确定当前返工产品对应的正常工序列表 */
  productionCode: {
    type: String,
    default: ''
  },
  workshop: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

// 工序排产明细表与字段 ID：与预派工、正式派工两页的既有查询口径保持一致
const WORKSHEET_ID = 'paigongdan'
const FIELD = {
  productionCode: '691d6160535b29cbd5c6c0a9',
  workshop: '669a6cae2503723eec1b49bb',
  dispatchType: '6954ad997a59e0522d85df35',
  sequence: '693a62040f64427fac25ae80',
  processName: '656ffd1bba5ef3863bf3ec1e'
}
const PAGE_SIZE = 10

const loading = ref(false)
const allData = ref([])
const page = ref(1)
const searchValue = ref('')
const selectedRowid = ref('')

const filteredData = computed(() => {
  const keyword = searchValue.value.trim()
  if (!keyword) return allData.value
  return allData.value.filter((item) => item.processName.includes(keyword))
})
const tableData = computed(() => filteredData.value.slice(0, page.value * PAGE_SIZE))
const hasMore = computed(() => tableData.value.length < filteredData.value.length)

/** 关联字段可能返回 JSON 字符串、数组或对象，这里统一提取展示名称 */
const extractRelationNames = (value) => {
  if (!value) return []
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('[')) {
      try {
        return extractRelationNames(JSON.parse(text))
      } catch {
        return []
      }
    }
    return []
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === 'object')
      .map((item) => item.name || item.text || item.title || '')
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    return [value.name || value.text || value.title || ''].filter(Boolean)
  }
  return []
}

const formatProcessName = (raw) => {
  const names = extractRelationNames(raw)
  return names.length > 0 ? names.join('、') : String(raw ?? '').trim()
}

const fetchProcessList = async () => {
  if (loading.value) return
  const productionCode = props.productionCode.trim()
  if (!props.workshop) {
    uni.showToast({ title: '未选择车间', icon: 'none' })
    return
  }
  if (!productionCode) {
    uni.showToast({ title: '缺少生产编号', icon: 'none' })
    return
  }

  loading.value = true
  // 固定读取正常派工明细：返工合并的来源是产品正常工序，不受页面当前正常/返工筛选影响
  const filters = [
    {
      controlId: FIELD.productionCode,
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [productionCode]
    },
    { controlId: FIELD.workshop, dataType: 30, spliceType: 1, filterType: 2, values: [props.workshop] },
    { controlId: FIELD.dispatchType, dataType: 30, spliceType: 1, filterType: 2, values: ['正常派工'] }
  ]

  try {
    // 列表接口没有稳定的服务端排序参数，先全量拉取，再统一按生产顺序升序排序
    const res = await callWorkflowListAll({ worksheetId: WORKSHEET_ID, filters, silent: true }, 100)
    const rows = (res?.data || []).map((item) => ({
      sequence: String(item[FIELD.sequence] ?? '').trim(),
      processName: formatProcessName(item[FIELD.processName]),
      rowid: item.rowid || ''
    }))
    rows.sort((a, b) => (parseFloat(a.sequence) || 0) - (parseFloat(b.sequence) || 0))
    allData.value = rows
    page.value = 1
  } catch (error) {
    console.error('[合并工序] 加载工序排产明细失败:', error)
    allData.value = []
    uni.showToast({ title: '加载工序失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const resetSelectionState = () => {
  allData.value = []
  searchValue.value = ''
  selectedRowid.value = ''
  page.value = 1
}

const open = () => {
  resetSelectionState()
  fetchProcessList()
}

const close = () => emit('update:visible', false)

const loadMore = () => {
  if (!hasMore.value || loading.value) return
  page.value += 1
}

const onSearchInput = () => {
  page.value = 1
}

const toggleSelect = (process) => {
  if (!process.rowid) return
  selectedRowid.value = selectedRowid.value === process.rowid ? '' : process.rowid
}

const isSelected = (rowid) => !!rowid && selectedRowid.value === rowid

const confirmSelection = () => {
  if (!selectedRowid.value) {
    uni.showToast({ title: '请选择要合并的工序', icon: 'none' })
    return
  }
  const selected = tableData.value.find((item) => item.rowid === selectedRowid.value)
  emit('confirm', {
    rowid: selectedRowid.value,
    processName: selected?.processName || ''
  })
}

watch(
  () => [props.visible, props.productionCode, props.workshop],
  ([visible]) => {
    if (visible) open()
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) resetSelectionState()
  }
)
</script>

<style scoped lang="scss">
.merge-process-modal {
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
  padding: px2vw(20px);
  box-sizing: border-box;
}

.merge-process-content {
  background: white;
  border-radius: px2vw(18px);
  width: 90%;
  max-width: px2vw(900px);
  // 固定高度让中间列表分到剩余空间；仅 max-height 时 scroll-view 无法获得稳定高度
  height: 75vh;
  max-height: 82vh;
  box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.merge-process-title {
  padding: px2vw(28px) px2vw(30px) px2vw(12px);
  font-size: px2vw(34px);
  font-weight: bold;
  color: #333;
  text-align: center;
  flex-shrink: 0;
}

.merge-process-search {
  padding: 0 px2vw(24px) px2vw(16px);
  flex-shrink: 0;
}

.merge-process-search-input {
  width: 100%;
  height: px2vw(72px);
  padding: 0 px2vw(20px);
  font-size: px2vw(28px);
  border: px2vw(1px) solid #e0e0e0;
  border-radius: px2vw(12px);
  box-sizing: border-box;
}

.merge-process-list-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.merge-process-scroll {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: px2vw(8px) px2vw(24px) px2vw(12px);
  box-sizing: border-box;
  background: #f5f6f8;
  border-radius: px2vw(12px);
}

.merge-process-footer-bar {
  flex-shrink: 0;
  position: relative;
  z-index: 20;
  width: 100%;
  background: #ffffff;
  box-sizing: border-box;
  padding: px2vw(16px) px2vw(24px) px2vw(24px);
  border-top: px2vw(1px) solid #e8e8e8;
  box-shadow: 0 px2vw(-6px) px2vw(20px) rgba(0, 0, 0, 0.08);
}

.merge-process-header {
  display: flex;
  align-items: center;
  gap: px2vw(16px);
  padding: 0 px2vw(16px) px2vw(10px);
  margin-bottom: px2vw(10px);
  border-bottom: px2vw(1px) solid #e0e0e0;
}

.merge-process-header-check {
  width: px2vw(40px);
  flex-shrink: 0;
}

.merge-process-header-sequence {
  width: px2vw(120px);
  flex-shrink: 0;
  text-align: center;
  font-size: px2vw(24px);
  color: #666;
}

.merge-process-header-name {
  flex: 1;
  font-size: px2vw(24px);
  color: #666;
}

.merge-process-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: px2vw(16px);
  padding: px2vw(20px) px2vw(16px);
  margin-bottom: px2vw(12px);
  border-radius: px2vw(12px);
  border: px2vw(1px) solid #eee;
  background: #fafafa;

  &.selected {
    border-color: #5884f1;
    background: #eef3ff;
  }
}

.merge-process-check {
  width: px2vw(40px);
  height: px2vw(40px);
  line-height: px2vw(40px);
  text-align: center;
  font-size: px2vw(28px);
  color: #5884f1;
  font-weight: bold;
}

.merge-process-sequence {
  width: px2vw(120px);
  flex-shrink: 0;
  text-align: center;
  font-size: px2vw(28px);
  color: #333;
}

.merge-process-name {
  flex: 1;
  font-size: px2vw(28px);
  color: #333;
}

.merge-process-tip {
  text-align: center;
  font-size: px2vw(24px);
  color: #999;
  padding: px2vw(16px) 0;
}

.merge-process-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: px2vw(20px);
  padding: 0;
  border-top: none;

  .btn-cancel,
  .btn-merge {
    flex: 1;
    max-width: px2vw(280px);
    height: px2vw(72px);
    border-radius: px2vw(18px);
    font-size: px2vw(30px);
    border: none;
  }

  .btn-cancel {
    background: #f5f5f5;
    color: #666;
  }

  .btn-merge {
    background: #2e7d32;
    color: #fff;
  }
}
</style>
