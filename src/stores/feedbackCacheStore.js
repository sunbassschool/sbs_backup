import { defineStore } from "pinia"

const TTL = 60 * 1000 // 1 min

export const useFeedbackCacheStore = defineStore("feedbackCache", {
  state: () => ({
    ts: 0,
    all: null,        // feedbacks globaux
    byEleve: {}       // { email: feedbacks[] }
  }),

  actions: {
    isValid() {
      return this.all && Date.now() - this.ts < TTL
    },

    getAll() {
      return this.isValid() ? this.all : null
    },

    setAll(data) {
      this.all = data
      this.ts = Date.now()
    },

    invalidate() {
      this.all = null
      this.byEleve = {}
      this.ts = 0
    }
  },  persist: true

})
