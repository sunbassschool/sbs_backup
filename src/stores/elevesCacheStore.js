// stores/elevesCacheStore.js
import { defineStore } from "pinia"

export const useElevesCacheStore = defineStore("elevesCache", {
  state: () => ({
    eleves: null,
    ts: 0
  }),
  actions: {
    get() {
      if (!this.eleves) return null
      if (Date.now() - this.ts > 5 * 60 * 1000) return null
      return this.eleves
    },
    set(data) {
      this.eleves = data
      this.ts = Date.now()
    },
    invalidate() {
      this.eleves = null
      this.ts = 0
        this.$reset()

    }
  },
    persist: true

})
