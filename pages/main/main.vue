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

<style scoped lang="scss">
   .main-container {
	   height: 100vh;
	   width: 100vw;
	   background-color: #3556e3;
	   
	   .btn-box {
		   height: px2vw(350px);
		   width: 100%;
		   display: flex;
		   flex-wrap: wrap;
		   position: absolute;
		   bottom: 0;
		   
		   button {
			   width: px2vw(550px);
			   height: px2vw(120px);
			   background-color: white;
			   color: #3556e3;
			   border-radius: px2vw(50px);
			   display: flex;
			   justify-content: center;
			   align-items: center;
			   font-size: px2vw(50px)
		   }
	   }
   }
</style>
