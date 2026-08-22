import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filters for the Music page, kept in a store for the same reason as the other
// two: selections survive navigating away and back. Songs have no months or
// hours — the axis that matters is the mood you pick before asking K.K. for a
// request, which is the only thing that steers which song he plays.
export const useMusicFiltersStore = defineStore('musicFilters', () => {
  const search = ref('')
  const mood = ref('all') // 'all', one of MOODS, or 'special' for the moodless few
  const hideCollected = ref(true)

  return { search, mood, hideCollected }
})
