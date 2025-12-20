import { defineStore } from "pinia"

const TTL = 2 * 60 * 1000 // 2 min

export const useCoursStore = defineStore("cours", {
  state: () => ({
    cours: [],
    ts: 0
  }),

  getters: {
    isValid: (state) =>
      state.cours.length > 0 && Date.now() - state.ts < TTL
  },

  actions: {
    get() {
      return this.isValid ? this.cours : null
    },

    set(data) {
      this.cours = data
      this.ts = Date.now()
    },

    invalidate() {
      this.cours = []
      this.ts = 0
    }
  },

  persist: {
    key: "coursCache",
    storage: localStorage
  }
})
