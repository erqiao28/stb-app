<template>
  <view class="pdf-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="pdf-header">
      <view class="pdf-back" @click="goBack">‹ 返回</view>
      <text class="pdf-title">{{ fileName || 'PDF 预览' }}</text>
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
        <text>正在加载 PDF...</text>
      </view>
      <view v-if="error" class="pdf-error">
        <text>{{ error }}</text>
      </view>
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMount, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStatusBar } from '../../composables/useStatusBar.js'

const { statusBarHeight } = useStatusBar()

const pdfUrl = ref('')
const fileName = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.5)
const loading = ref(true)
const error = ref('')
const canvasRef = ref(null)

const pdfBodyHeight = computed(() => {
  return uni.getSystemInfoSync().windowHeight - statusBarHeight.value - 90
})

let pdfDoc = null
let renderTask = null
let pdfjsLib = null

onLoad((options) => {
  if (options.url) {
    pdfUrl.value = decodeURIComponent(options.url)
  }
  if (options.name) {
    fileName.value = decodeURIComponent(options.name)
  }
})

onMount(() => {
  if (pdfUrl.value) {
    loadPdfJs()
  }
})

const goBack = () => {
  uni.navigateBack()
}

const loadPdfJs = async () => {
  loading.value = true
  error.value = ''
  try {
    const pdfjsModule = await import('/static/pdfjs/pdf.mjs')
    pdfjsLib = pdfjsModule
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/pdfjs/pdf.worker.mjs'

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl.value,
    })

    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    await renderPage(currentPage.value)
  } catch (err) {
    console.error('PDF加载失败:', err)
    error.value = 'PDF 加载失败：' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

const renderPage = async (pageNum) => {
  if (!pdfDoc || !canvasRef.value) return

  if (renderTask) {
    try { renderTask.cancel() } catch (e) {}
    renderTask = null
  }

  try {
    const page = await pdfDoc.getPage(pageNum)
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    const viewport = page.getViewport({ scale: scale.value })

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }

    renderTask = page.render(renderContext)
    await renderTask.promise
    renderTask = null
  } catch (err) {
    if (err.name !== 'RenderingCancelledException') {
      console.error('页面渲染失败:', err)
    }
  }
}

const prevPage = async () => {
  if (currentPage.value <= 1) return
  currentPage.value--
  await renderPage(currentPage.value)
}

const nextPage = async () => {
  if (currentPage.value >= totalPages.value) return
  currentPage.value++
  await renderPage(currentPage.value)
}

const zoomIn = async () => {
  scale.value = Math.min(scale.value + 0.25, 4)
  await renderPage(currentPage.value)
}

const zoomOut = async () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
  await renderPage(currentPage.value)
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

  .pdf-back {
    font-size: 16px;
    color: #4a9eff;
    min-width: 60px;
  }

  .pdf-title {
    flex: 1;
    text-align: center;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 10px;
  }

  .pdf-page-info {
    font-size: 13px;
    color: #aaa;
    min-width: 60px;
    text-align: right;
  }
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 16px;
  background: #2a2a2a;
  flex-shrink: 0;

  .toolbar-btn {
    flex: 1;
    text-align: center;
    color: #4a9eff;
    font-size: 14px;
    padding: 8px 0;

    &:active {
      opacity: 0.6;
    }
  }
}

.pdf-body {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 10px 0;
}

.pdf-loading,
.pdf-error {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #aaa;
  font-size: 14px;
  padding: 40px;
}

.pdf-error {
  color: #f66;
}

.pdf-canvas {
  display: block;
}
</style>
