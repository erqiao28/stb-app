<script>
export default {
	onLaunch: function () {
		console.log('App Launch')
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
</style>
