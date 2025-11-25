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
			}
		}, 100)
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
</style>
