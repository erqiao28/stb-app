<script>
import { initStatusBar } from './composables/useStatusBar'

export default {
	onLaunch: function () {
		console.log('App Launch')
		// 初始化状态栏高度（会自动设置 CSS 变量）
		initStatusBar()
		
		setTimeout(() => {
			if (typeof plus !== 'undefined') {
				plus.screen.lockOrientation('landscape')
				// 在 APP 平台，Toast 是原生组件，层级较高，通常不需要额外设置
				// 如果仍有问题，可以通过降低模态框的 z-index 来解决
			}
		}, 100)
		
		// H5 平台动态设置 Toast 层级
		// #ifdef H5
		setTimeout(() => {
			const style = document.createElement('style')
			style.innerHTML = `
				.uni-toast { z-index: 99999 !important; }
				.uni-toast__content { z-index: 99999 !important; }
				.uni-toast__content-text { z-index: 99999 !important; }
			`
			document.head.appendChild(style)
		}, 100)
		// #endif
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style lang="scss">
@import 'uni.scss';
/* 导入全局SCSS，确保函数可用 */

/*每个页面公共css */
* {
	box-sizing: border-box;
}

/* 全局状态栏高度适配 */
/* 通过 JS 动态设置 CSS 变量 */
:root {
	/* 默认状态栏高度，会被 JS 动态设置 */
	--status-bar-height: 0px;
}

/* 全局页面容器类，所有页面都可以使用 */
.page-container {
	padding-top: var(--status-bar-height);
	box-sizing: border-box;
}

/* 为 uni-app 内置的页面容器添加状态栏高度适配 */
/* #ifdef APP-PLUS */
.uni-page-body,
.uni-page {
	padding-top: var(--status-bar-height);
	box-sizing: border-box;
}
/* #endif */

/* H5 环境下的适配 */
/* #ifdef H5 */
.uni-page-body {
	padding-top: var(--status-bar-height);
	box-sizing: border-box;
}
/* #endif */

/* Toast 提示层级设置，确保显示在所有模态框之上 */
/* H5 平台使用 CSS 控制 */
/* #ifdef H5 */
.uni-toast {
	z-index: 99999 !important;
}

.uni-toast__content {
	z-index: 99999 !important;
}

.uni-toast__content-text {
	z-index: 99999 !important;
}
/* #endif */

/* APP 平台通过动态设置 */
/* #ifdef APP-PLUS */
/* APP 平台的 Toast 是原生组件，需要通过其他方式处理 */
/* 已在 onLaunch 中通过 plus.navigator 设置 */
/* #endif */
</style>
