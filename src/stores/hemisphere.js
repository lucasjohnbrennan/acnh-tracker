import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'acnh-tracker:hemisphere'

export const useHemisphereStore = defineStore('hemisphere', () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const hemisphere = ref(stored === 'south' ? 'south' : 'north')

  watch(hemisphere, (value) => {
    localStorage.setItem(STORAGE_KEY, value)
  })

  function setHemisphere(value) {
    hemisphere.value = value === 'south' ? 'south' : 'north'
  }

  function toggle() {
    hemisphere.value = hemisphere.value === 'north' ? 'south' : 'north'
  }

  return { hemisphere, setHemisphere, toggle }
})
