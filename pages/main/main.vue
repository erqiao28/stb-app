<template>
	<view class="main-container">
		<view class="btn-box">
			<button @click="goProcess">工序检验</button>
			<button @click="goFinish">完工</button>
			<button @click="goDevice">设备点检</button>
			<button @click="goMoldFixture">模具夹点检</button>
			<button @click="goMaintain">设备维修</button>
			<button @click="goDispatchWork">派工</button>
		</view>
	</view>
</template>

<script setup>
	const goProcess = () => {
		uni.navigateTo({
			url: '/pages/process/process'
		})
	}
	const goFinish = () => {
		uni.navigateTo({
			url: '/pages/finish/finish'
		})
	}
	const goDevice = () => {
		uni.navigateTo({
			url: '/pages/device/device'
		})
	}
	const goMoldFixture = () => {
		uni.navigateTo({
			url: '/pages/moldFixture/moldFixture'
		})
	}
	const goMaintain = () => {
		uni.navigateTo({
			url: '/pages/maintain/maintain'
		})
	}
	const goDispatchWork = () => {
		uni.navigateTo({
			url: '/pages/dispatchWork/dispatchWork'
		})
	}
</script>

<style scoped>
   .main-container {
	   height: 100vh;
	   width: 100vw;
	   background-color: #3556e3;
	   
	   .btn-box {
		   height: 500rpx;
		   width: 100%;
		   display: flex;
		   flex-wrap: wrap;
		   position: absolute;
		   bottom: 0;
		   padding: 0 162.5rpx;
		   
		   button {
			   width: 800rpx;
			   height: 212.5rpx;
			   background-color: white;
			   color: #3556e3;
			   margin: 0 53.75rpx;
			   border-radius: 65rpx;
			   display: flex;
			   justify-content: center;
			   align-items: center;
			   font-size: 63.75rpx
		   }
	   }
   }
</style>
