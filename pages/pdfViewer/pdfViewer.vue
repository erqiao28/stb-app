<template>
  <view class="pdf-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="pdf-header">
      <view class="pdf-back" @click="goBack">‹ 返回</view>
      <text class="pdf-title">{{ currentFileName || 'PDF 预览' }}</text>
      <text class="pdf-page-info">{{ currentPage }} / {{ totalPages }}</text>
    </view>

    <view class="pdf-toolbar">
      <view class="toolbar-btn" @click="prevPage">‹ 上一页</view>
      <view class="toolbar-btn" @click="nextPage">下一页 ›</view>
      <view class="toolbar-btn" @click="zoomOut">− 缩小</view>
      <view class="toolbar-btn" @click="zoomIn">+ 放大</view>
    </view>

    <scroll-view scroll-y class="pdf-body" :style="{ height: pdfBodyHeight + 'px' }">
      <view v-if="loading" class="pdf-loading">
        <text>{{ loadMsg }}</text>
      </view>
      <view v-if="error" class="pdf-error">
        <text>{{ error }}</text>
      </view>
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    </scroll-view>

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
import { ref, onMount, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar.js'

const { statusBarHeight } = useStatusBar()

const drawings = ref([])
const currentIndex = ref(0)
const pdfUrl = ref('')
const fileName = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.5)
const loading = ref(true)
const error = ref('')
const loadMsg = ref('正在加载 PDF...')
const canvasRef = ref(null)

const currentFileName = computed(() => {
  if (drawings.value.length > 1) return drawings.value[currentIndex.value]?.label || ''
  return fileName.value
})

const pdfBodyHeight = computed(() => {
  const tabBarHeight = drawings.value.length > 1 ? 60 : 0
  return uni.getSystemInfoSync().windowHeight - statusBarHeight.value - 90 - tabBarHeight
})

let pdfDoc = null
let renderTask = null
let pdfjsLib = null

onLoad((options) => {
  if (options.drawings) {
    try {
      drawings.value = JSON.parse(decodeURIComponent(options.drawings))
      currentIndex.value = parseInt(options.index || '0')
    } catch (e) { console.error('图纸数据解析失败:', e) }
  }
  if (options.url) pdfUrl.value = decodeURIComponent(options.url)
  if (options.name) fileName.value = decodeURIComponent(options.name)
})

const goBack = () => uni.navigateBack()
const getCurrentUrl = () => {
  if (drawings.value.length > 0) return drawings.value[currentIndex.value]?.url || ''
  return pdfUrl.value
}

const loadPdfJs = async () => {
  const url = getCurrentUrl()
  if (!url) return
  loading.value = true
  error.value = ''
  currentPage.value = 1
  totalPages.value = 0

  // #ifdef H5
  try {
    if (!pdfjsLib) {
      loadMsg.value = '正在加载解析器...'
      const script = document.createElement('script')
      script.src = '/static/pdfjs/pdf.mjs'
      await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script) })
      const workerScript = document.createElement('script')
      workerScript.src = '/static/pdfjs/pdf.worker.mjs'
      await new Promise((resolve, reject) => { workerScript.onload = resolve; workerScript.onerror = reject; document.head.appendChild(workerScript) })
      pdfjsLib = window.pdfjsLib
      if (pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/pdfjs/pdf.worker.mjs'
    }
    loadMsg.value = '正在加载 PDF...'
    const loadingTask = pdfjsLib.getDocument({ url })
    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    await renderPage(currentPage.value)
  } catch (err) {
    console.error('PDF加载失败:', err)
    error.value = 'PDF 加载失败：' + (err.message || String(err))
  } finally {
    loading.value = false
  }
  // #endif

  // #ifndef H5
  uni.showLoading({ title: '正在打开...' })
  uni.downloadFile({
    url,
    success: (res) => {
      uni.hideLoading()
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          fail: () => {
            uni.showToast({ title: '无法打开文件', icon: 'none' })
            // #ifdef APP-PLUS
            try { plus.runtime.openURL(url) } catch (e) {}
            // #endif
          }
        })
      } else {
        uni.showToast({ title: '文件下载失败', icon: 'none' })
      }
    },
    fail: () => { uni.hideLoading(); uni.showToast({ title: '文件下载失败', icon: 'none' }) }
  })
  loading.value = false
  // #endif
}

const renderPage = async (pageNum) => {
  if (!pdfDoc || !canvasRef.value) return
  if (renderTask) { try { renderTask.cancel() } catch (e) {} renderTask = null }
  try {
    const page = await pdfDoc.getPage(pageNum)
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: scale.value })
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    renderTask = page.render({ canvasContext: ctx, viewport })
    await renderTask.promise
    renderTask = null
  } catch (err) {
    if (err.name !== 'RenderingCancelledException') console.error('页面渲染失败:', err)
  }
}

onMount(() => { loadPdfJs() })

const prevPage = async () => { if (currentPage.value <= 1) return; currentPage.value--; await renderPage(currentPage.value) }
const nextPage = async () => { if (currentPage.value >= totalPages.value) return; currentPage.value++; await renderPage(currentPage.value) }
const zoomIn = async () => { scale.value = Math.min(scale.value + 0.25, 4); await renderPage(currentPage.value) }
const zoomOut = async () => { scale.value = Math.max(scale.value - 0.25, 0.5); await renderPage(currentPage.value) }
const switchTo = (idx) => { if (idx === currentIndex.value) return; currentIndex.value = idx; loadPdfJs() }
</script>

<style lang="scss" scoped>
.pdf-container { width: 100vw; min-height: 100vh; display: flex; flex-direction: column; background: #1a1a1a; overflow: hidden; }
.pdf-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: #222; color: #fff; flex-shrink: 0;
  .pdf-back { font-size: 16px; color: #4a9eff; min-width: 60px; }
  .pdf-title { flex: 1; text-align: center; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 10px; }
  .pdf-page-info { font-size: 13px; color: #aaa; min-width: 60px; text-align: right; }
}
.pdf-toolbar {
  display: flex; align-items: center; justify-content: space-around;
  padding: 8px 16px; background: #2a2a2a; flex-shrink: 0;
  .toolbar-btn { flex: 1; text-align: center; color: #4a9eff; font-size: 14px; padding: 8px 0; &:active { opacity: 0.6; } }
}
.pdf-body { flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start; padding: 10px 0; }
.pdf-loading, .pdf-error { width: 100%; display: flex; justify-content: center; align-items: center; color: #aaa; font-size: 14px; padding: 40px; }
.pdf-error { color: #f66; }
.pdf-canvas { display: block; }
.pdf-tabs {
  flex-shrink: 0; background: #1a1a1a; border-top: 1px solid #333;
  .tabs-scroll { white-space: nowrap; padding: 8px 10px; }
  .tab-item {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 6px 16px; margin-right: 8px; background: #333; border-radius: 8px;
    border: 1px solid #444; min-width: 70px; max-width: 100px;
    &.active { background: #4a9eff; border-color: #4a9eff; }
    .tab-label { font-size: 12px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px; }
    .tab-index { font-size: 10px; color: #aaa; margin-top: 2px; }
    &.active .tab-index { color: rgba(255, 255, 255, 0.7); }
  }
}
</style>
