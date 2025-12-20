import { defineStore } from "pinia"

export const useFeedbackProfStore = defineStore("feedbackProf", {
  state: () => ({
    feedbacks: null,
    ts: 0
  }),  persist: true

})
