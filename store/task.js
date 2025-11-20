import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', {
  state: () => ({
    // 需要更新的任务数据
    pendingTaskUpdate: null
  }),

  actions: {
    // 设置需要更新的任务
    setPendingTaskUpdate(taskData) {
      this.pendingTaskUpdate = taskData
    },

    // 清除待更新任务
    clearPendingTaskUpdate() {
      this.pendingTaskUpdate = null
    }
  }
})