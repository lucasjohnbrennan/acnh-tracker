import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filters for the Fossils & Art page. Lives in its own store (rather than
// local refs) so filters survive navigating away and back, same reasoning as
// critterFilters. No month/hour filters here — fossils and art aren't time
// dependent, which is the whole reason they get a separate page from Critters.
export const useArtifactFiltersStore = defineStore('artifactFilters', () => {
  const search = ref('')
  const type = ref('all') // 'all' | 'fossil' | 'art'
  const hideCaught = ref(true)

  return { search, type, hideCaught }
})
