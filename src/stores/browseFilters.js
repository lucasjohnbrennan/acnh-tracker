import { defineStore } from 'pinia'
import { ref } from 'vue'

// Lives here instead of local refs in BrowseView so filters survive
// navigating away and back (My Collection, Home, etc).
export const useBrowseFiltersStore = defineStore('browseFilters', () => {
  const search = ref('')
  const category = ref('all') // 'all' | 'bug' | 'fish' | 'sea'
  const month = ref('all') // 'all' or 1-12
  const hourFrom = ref('all') // 'all' or 0-23
  const hourTo = ref('all') // 'all' or 0-23 (exclusive end, same convention as availability windows)
  const hideCaught = ref(true)

  return { search, category, month, hourFrom, hourTo, hideCaught }
})
