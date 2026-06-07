import { defineStore } from "pinia"
import { ref } from "vue"

export const useDeveloperStore = defineStore("developer", () => {
  const enabled = ref(false)

  function toggle() {
    enabled.value = !enabled.value
  }

  return { enabled, toggle }
})
