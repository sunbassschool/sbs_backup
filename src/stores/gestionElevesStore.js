import { defineStore } from "pinia"

export const useGestionElevesStore = defineStore("gestionEleves", {
  state: () => ({
    eleves: null,
    ts: 0
  }),  persist: true

})
