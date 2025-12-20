import { defineStore } from "pinia"

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    data: null,
    ts: 0
  }),  persist: true

})
