import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filters for the Art page, stored so selections survive navigating away and
// back. Artwork has no months or hours; the axes that actually matter when
// you're standing in Redd's boat are what kind of piece it is and whether a
// counterfeit of it exists at all.
export const useArtFiltersStore = defineStore('artFilters', () => {
  const search = ref('')
  const artType = ref('all') // 'all' | 'painting' | 'statue'
  // 'all' | 'fake' (a forgery exists — check it carefully) | 'genuine' (always
  // real, so Redd can't sell you a dud).
  const fake = ref('all')
  const hideDonated = ref(true)

  return { search, artType, fake, hideDonated }
})
