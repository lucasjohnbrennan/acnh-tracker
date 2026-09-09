import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filters for the Fossils page. Kept in a store (rather than local refs) so
// selections survive navigating away and back, same reasoning as the other
// filter stores.
//
// Deliberately thin: a fossil is a fossil. There's no season, no time of day
// and no forgery to worry about, so the only questions worth asking are "which
// one?" and "what do I still owe Blathers?".
export const useFossilFiltersStore = defineStore('fossilFilters', () => {
  const search = ref('')
  const hideDonated = ref(true)

  return { search, hideDonated }
})
