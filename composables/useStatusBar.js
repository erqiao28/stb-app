import { ref } from 'vue'

// 全局状态栏高度
const statusBarHeight = ref(0)

/**
 * 获取状态栏高度 composable
 * @returns {Object} 包含 statusBarHeight 的对象
 */
export function useStatusBar() {
	// 如果还没有获取过，则获取一次
	if (statusBarHeight.value === 0) {
		try {
			const systemInfo = uni.getSystemInfoSync()
			statusBarHeight.value = systemInfo.statusBarHeight || 0
		} catch (error) {
			console.error('获取状态栏高度失败:', error)
			statusBarHeight.value = 0
		}
	}
	
	return {
		statusBarHeight
	}
}

/**
 * 初始化状态栏高度（在 App.vue 中调用）
 */
export function initStatusBar() {
	try {
		const systemInfo = uni.getSystemInfoSync()
		statusBarHeight.value = systemInfo.statusBarHeight || 0
		
		// 设置 CSS 变量供全局使用
		// #ifdef H5
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--status-bar-height', statusBarHeight.value + 'px')
		}
		// #endif
		
		// #ifdef APP-PLUS
		// App 环境下设置状态栏样式
		if (typeof plus !== 'undefined') {
			// 设置状态栏背景为透明
			plus.navigator.setStatusBarStyle('light')
			// 设置 CSS 变量（通过 plus API）
			if (plus.webview) {
				const currentWebview = plus.webview.currentWebview()
				if (currentWebview) {
					currentWebview.setStyle({
						statusbar: {
							background: 'transparent'
						}
					})
				}
			}
		}
		// #endif
		
		console.log('状态栏高度已初始化:', statusBarHeight.value)
		return statusBarHeight.value
	} catch (error) {
		console.error('初始化状态栏高度失败:', error)
		return 0
	}
}

