<template>
  <view class="pdf-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="pdf-header">
      <view class="pdf-back" @click="goBack">‹ 返回</view>
      <text class="pdf-title">{{ currentFileName || '文件预览' }}</text>
      <text class="pdf-page-info" v-if="!isOpening">{{ currentStatus }}</text>
    </view>
    <view class="pdf-body">
      <view v-if="isOpening" class="pdf-loading">
        <text>{{ currentStatus }}</text>
      </view>
      <view v-if="openError" class="pdf-error">
        <text>{{ openError }}</text>
        <view class="retry-btn" @click="openFile">重试</view>
      </view>
    </view>

    <view class="pdf-tabs" v-if="drawings.length > 1">
      <scroll-view scroll-x class="tabs-scroll">
        <view
          v-for="(d, idx) in drawings"
          :key="idx"
          class="tab-item"
          :class="{ active: idx === currentIndex }"
          @click="switchTo(idx)"
        >
          <text class="tab-label">{{ d.label }}</text>
          <text class="tab-index">{{ idx + 1 }}/{{ drawings.length }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar.js'

const { statusBarHeight } = useStatusBar()

const drawings = ref([])
const currentIndex = ref(0)
const fileName = ref('')
const isOpening = ref(false)
const openError = ref('')
const currentStatus = ref('正在处理...')

const currentFileName = computed(() => {
  if (drawings.value.length > 1) return drawings.value[currentIndex.value]?.label || ''
  return fileName.value
})

onLoad((options) => {
  if (options.drawings) {
    try {
      drawings.value = JSON.parse(decodeURIComponent(options.drawings))
      currentIndex.value = parseInt(options.index || '0')
    } catch (e) { console.error('图纸数据解析失败:', e) }
  }
  if (options.name) fileName.value = decodeURIComponent(options.name)

  nextTick(() => {
    setTimeout(() => openFile(), 100)
  })
})
const goBack = () => uni.navigateBack()

const getCurrentUrl = () => {
  if (drawings.value.length > 0) return drawings.value[currentIndex.value]?.url || ''
  return ''
}

const openFile = () => {
  const url = getCurrentUrl()
  if (!url) {
    openError.value = '文件地址无效'
    return
  }

  isOpening.value = true
  openError.value = ''
  currentStatus.value = '正在下载文件...'

  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        currentStatus.value = '正在打开文件...'
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          fail: () => {
            isOpening.value = false
            openError.value = '无法打开此文件，请确认手机已安装PDF阅读器'
          },
          success: () => {
            isOpening.value = false
          }
        })
      } else {
        isOpening.value = false
        openError.value = '文件下载失败，HTTP状态码：' + res.statusCode
      }
    },
    fail: (err) => {
      isOpening.value = false
      console.error('文件下载失败:', err)
      openError.value = '文件下载失败，请检查网络连接'
    }
  })
}

const switchTo = (idx) => {
  if (idx === currentIndex.value) return
  currentIndex.value = idx
  openFile()
}
</script>

<style lang="scss" scoped>
.pdf-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  overflow: hidden;
}
.pdf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #222;
  color: #fff;
  flex-shrink: 0;
  .pdf-back { font-size: 16px; color: #4a9eff; min-width: 60px; }
  .pdf-title { flex: 1; text-align: center; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 10px; }
  .pdf-page-info { font-size: 13px; color: #aaa; min-width: 60px; text-align: right; }
}
.pdf-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.pdf-loading {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #aaa;
  font-size: 15px;
  padding: 40px;
}
.pdf-error {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #f66;
  font-size: 14px;
  text-align: center;
  padding: 20px;
  .retry-btn {
    margin-top: 16px;
    padding: 8px 24px;
    background: #4a9eff;
    color: #fff;
    border-radius: 6px;
    font-size: 14px;
  }
}
.pdf-tabs {
  flex-shrink: 0;
  background: #1a1a1a;
  border-top: 1px solid #333;
  .tabs-scroll { white-space: nowrap; padding: 8px 10px; }
  .tab-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    margin-right: 8px;
    background: #333;
    border-radius: 8px;
    border: 1px solid #444;
    min-width: 70px;
    max-width: 100px;
    &.active { background: #4a9eff; border-color: #4a9eff; }
    .tab-label { font-size: 12px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px; }
    .tab-index { font-size: 10px; color: #aaa; margin-top: 2px; }
    &.active .tab-index { color: rgba(255, 255, 255, 0.7); }
  }
}
</style>
