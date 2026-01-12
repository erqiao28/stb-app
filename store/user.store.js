import {
	defineStore
} from 'pinia'
import {
	ref
} from 'vue'

export const useUserStore = defineStore(
	'user',
	() => {
		// 用户列表
		const userlist = ref([])
		// 登录者信息
		const loginInfo = ref({
			username: '',
			password: ''
		})
		
		// 服务器地址
		const serverSite = ref('')
		// 账套
		const account = ref('')
		
		// 记住密码
		const rememberPassword = ref(false)
		const changeRememberPassword = () => {
			rememberPassword.value = !rememberPassword.value
		}
		
		// 应用版本号（从更新接口获取后存储）
		const appVersion = ref('')
		
		// 登录名称
		const loginName = ref('')
		const loginCode = ref('')
		const loginLimits = ref('')
		
		// 登出
		const logout = () => {
			uni.navigateTo({
				url: '/pages/index/index'
			})
		}

		return {
			userlist,
			logout,
			loginInfo,
			rememberPassword,
			changeRememberPassword,
			serverSite,
			account,
			appVersion,
			loginName,
			loginCode,
			loginLimits
		}
	}, {
		persist: {
			storage: {
				getItem(key) {
					return JSON.parse(uni.getStorageSync(key));
				},
				setItem(key, value) {
					uni.setStorageSync(key, JSON.stringify(value));
				},
			},
		}
	}
)