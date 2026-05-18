<template>
	<view class="main-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBackToIndex"></image>
			<view class="title">主页面</view>
			<view></view>
		</view>
		<view class="btn-box">
			<button v-if="showDispatchEntryButtons" @click="goSelectBills">订单派工</button>
			<button v-if="showDispatchEntryButtons" @click="goSelectProductDispatch">产品派工</button>
			<button v-if="showDispatchEntryButtons" @click="goReworkDispatch">返工派工</button>
			<button @click="goTimeWork">记时派工</button>
			<button @click="goDispatchInquiry">派工查询</button>
			<button
				v-if="showDispatchInquiryMore"
				@click="goDispatchInquiryMore"
			>多对多派工查询</button>
			<button v-if="isGongyiLimits" @click="goCraftProduct">工艺产品</button>
			<button @click="goWorkload">员工工作量查询</button>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import { defaultWorkshopFromLoginLimits } from '../../utils/workshop'
const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const loginLimitsTrim = computed(() => (userStore.loginLimits || '').trim())

/** 工艺权限：仅多对多派工查询等，不展示订单/产品/返工派工入口 */
const isGongyiLimits = computed(() => loginLimitsTrim.value === '工艺')

const showDispatchEntryButtons = computed(() => !isGongyiLimits.value)

/** 组装/喷涂/工艺权限显示「多对多派工查询」 */
const showDispatchInquiryMore = computed(() => {
	const w = loginLimitsTrim.value
	return w === '组装车间' || w === '喷涂车间' || w === '工艺'
})

const goBackToIndex = () => {
	uni.redirectTo({
		url: '/pages/index/index'
	})
}

const goSelectBills = () => {
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?billTypeIndex=0&billType=${encodeURIComponent('正常排产')}&billTypeReadonly=1`
	})
}

const goSelectProductDispatch = () => {
	const raw = (userStore.loginLimits && userStore.loginLimits.trim()) || ''
	const workshop = defaultWorkshopFromLoginLimits(raw) || raw || '拉伸车间'
	uni.navigateTo({
		url: `/pages/selectProduct/selectProduct?workshop=${encodeURIComponent(workshop)}&billTypeIndex=0&billType=${encodeURIComponent('正常排产')}&billTypeReadonly=1&dispatchMode=product`
	})
}

const goReworkDispatch = () => {
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?billTypeIndex=1&billType=${encodeURIComponent('返工排产')}&billTypeReadonly=1`
	})
}

const goTimeWork = () => {
	uni.navigateTo({
		url: '/pages/timeWork/timeWork'
	})
}

const goDispatchInquiry = () => {
	uni.navigateTo({
		url: '/pages/dispatchInquiry/dispatchInquiry'
	})
}

const goDispatchInquiryMore = () => {
	// 不带车间参数：由多对多派工查询页根据登录权限 loginLimits 默认选中车间
	uni.navigateTo({
		url: '/pages/dispatchInquiryMore/dispatchInquiryMore'
	})
}

const goCraftProduct = () => {
	uni.navigateTo({
		url: '/pages/carftProduct/carftProduct'
	})
}

const goWorkload = () => {
	uni.navigateTo({
		url: '/pages/workload/workload'
	})
}
</script>

<style scoped lang="scss">
.main-container {
	height: 100vh;
	width: 100vw;
	background-color: #3556e3;
	display: flex;
	flex-direction: column;

	.header {
		height: px2vw(120px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(60px);
			width: px2vw(60px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(35px);
			color: white;
		}
	}

	.btn-box {
		width: 100%;
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-content: flex-end;
		padding: 0 px2vw(40px) px2vw(60px);
		gap: px2vw(25px);

		button {
			width: calc((100% - #{px2vw(50px)}) / 3);
			height: px2vw(120px);
			background-color: white;
			color: #3556e3;
			border-radius: px2vw(60px);
			font-size: px2vw(40px);
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
}
</style>
