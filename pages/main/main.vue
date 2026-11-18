<template>
	<view class="main-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBackToIndex"></image>
			<view class="title">主页面</view>
			<view></view>
		</view>
		<view class="btn-box">
			<button v-if="showDispatchEntryButtons" class="btn-order" @click="goSelectBills">订单派工</button>
			<button v-if="showDispatchEntryButtons" class="btn-product" @click="goSelectProductDispatch">产品派工</button>
			<button v-if="showDispatchEntryButtons" class="btn-rework" @click="goReworkDispatch">
				返工派工
				<text v-if="reworkPlanCount > 0" class="rework-count-badge">{{ reworkPlanCountText }}</text>
			</button>
			<button class="btn-time" @click="goTimeWork">记时派工</button>
			<button class="btn-query" @click="goDispatchInquiry">派工查询</button>
			<button
				v-if="showDispatchInquiryMore"
				class="btn-inquiry-more"
				@click="goDispatchInquiryMore"
			>多对多派工查询</button>
			<button v-if="isGongyiLimits" class="btn-craft" @click="goCraftOrder">工艺订单</button>
			<button class="btn-workload" @click="goWorkload">员工工作量查询</button>
			<button v-if="showPreDispatched" class="btn-pre-dispatched" @click="goPreDispatched">预派工</button>
		</view>
	</view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import { defaultWorkshopFromLoginLimits } from '../../utils/workshop'
import { fetchAvailableReworkPlans } from '../../utils/reworkPlan'
const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const loginLimitsTrim = computed(() => (userStore.loginLimits || '').trim())

/** 工艺权限：仅多对多派工查询等，不展示订单/产品/返工派工入口 */
const isGongyiLimits = computed(() => loginLimitsTrim.value === '工艺')

const showDispatchEntryButtons = computed(() => !isGongyiLimits.value)

/** 全账号显示「多对多派工查询」（已放开车间限制） */
const showDispatchInquiryMore = computed(() => true)

/** 当前登录权限对应车间；非车间权限由入口显隐逻辑阻止统计 */
const currentWorkshop = computed(() => defaultWorkshopFromLoginLimits(loginLimitsTrim.value))

// 返工派工按钮角标：当前车间仍可进入返工派工的计划数量
const reworkPlanCount = ref(0)
const reworkPlanCountText = computed(() => (
  reworkPlanCount.value >= 100 ? '99+' : String(reworkPlanCount.value)
))
let reworkPlanCountQuerySequence = 0

/**
 * 每次主页面可见时刷新返工数量。
 * 角标是附加提醒，查询失败不打断首页，只清空数量并保留原入口可用。
 */
const loadReworkPlanCount = async () => {
  const sequence = ++reworkPlanCountQuerySequence
  reworkPlanCount.value = 0
  const workshop = currentWorkshop.value
  if (!showDispatchEntryButtons.value || !workshop) return

  try {
    const planMap = await fetchAvailableReworkPlans({ workshop })
    if (sequence !== reworkPlanCountQuerySequence || !showDispatchEntryButtons.value || currentWorkshop.value !== workshop) return
    reworkPlanCount.value = Object.values(planMap).reduce(
      (total, plans) => total + (Array.isArray(plans) ? plans.length : 0),
      0
    )
  } catch (error) {
    console.error('加载返工派工数量失败:', error)
    if (sequence === reworkPlanCountQuerySequence) reworkPlanCount.value = 0
  }
}

onShow(loadReworkPlanCount)

/** 车间权限显示「预派工」（工艺等非车间账号隐藏） */
const showPreDispatched = computed(() => {
	const w = loginLimitsTrim.value
	return w === '组装车间' || w === '喷涂车间' || w === '抛光车间' || w === '拉伸车间'
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
	uni.navigateTo({
		url: '/pages/dispatchInquiryMore/dispatchInquiryMore'
	})
}

const goCraftOrder = () => {
	uni.navigateTo({
		url: '/pages/carftOrder/carftOrder'
	})
}

const goWorkload = () => {
	uni.navigateTo({
		url: '/pages/workload/workload'
	})
}

const goPreDispatched = () => {
	uni.navigateTo({
		url: '/pages/preDispatched/preDispatched'
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
	position: relative;

	.header {
		height: px2vw(90px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;

		image {
			margin-left: px2vw(20px);
			height: px2vw(50px);
			width: px2vw(50px);
		}

		.title {
			margin-right: px2vw(80px);
			font-size: px2vw(32px);
			color: white;
			font-weight: bold;
		}
	}

	.btn-box {
		width: 100%;
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-start;
		align-content: flex-end;
		padding: 0 px2vw(40px) px2vw(80px);
		gap: px2vw(20px);

		button {
			width: calc((100% - #{px2vw(60px)}) / 4);
			height: px2vw(100px);
			border-radius: px2vw(20px);
			font-size: px2vw(32px);
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 px2vw(6px) px2vw(16px) rgba(0, 0, 0, 0.2);
			transition: all 0.25s ease;
			color: white;
			font-weight: 600;
			line-height: 1.3;
			padding: 0 px2vw(10px);
			text-align: center;

			&:active {
				transform: translateY(px2vw(4px)) scale(0.97);
				box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.15);
			}

			&.btn-order {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			}

			&.btn-product {
				background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
			}

			&.btn-rework {
				position: relative;
				background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

				.rework-count-badge {
					position: absolute;
					top: px2vw(10px);
					right: px2vw(12px);
					min-width: px2vw(36px);
					height: px2vw(36px);
					padding: 0 px2vw(8px);
					border-radius: px2vw(18px);
					background-color: #f56c6c;
					color: #fff;
					font-size: px2vw(20px);
					font-weight: bold;
					line-height: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					box-sizing: border-box;
				}
			}

			&.btn-time {
				background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
			}

			&.btn-query {
				background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
			}

			&.btn-inquiry-more {
				background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
				color: #8e44ad;
			}

			&.btn-craft {
				background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
				color: #5a4fcf;
			}

			&.btn-workload {
				background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
				color: #5a4fcf;
			}

			&.btn-pre-dispatched {
				background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
				color: #c0392b;
			}
		}
	}
}
</style>
