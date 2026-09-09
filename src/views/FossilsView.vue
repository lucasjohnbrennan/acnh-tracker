<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectiblesStore } from '../stores/collectibles'
import { useFossilFiltersStore } from '../stores/fossilFilters'
import CollectibleCard from '../components/CollectibleCard.vue'

const collectiblesStore = useCollectiblesStore()
const filtersStore = useFossilFiltersStore()
const { search, hideDonated } = storeToRefs(filtersStore)

const fossils = computed(() => collectiblesStore.byCategory.fossil)

// The game abbreviates the pieces of a set ("Diplo Skull", "Tricera Tail"),
// so searching for the animal you're actually thinking of only works if the
// full set name counts as a match too.
function matchesSearch(fossil, query) {
  if (!query) return true
  return (
    fossil.name.toLowerCase().includes(query) ||
    (fossil.fossilGroup?.toLowerCase().includes(query) ?? false)
  )
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return fossils.value.filter((c) => {
    if (hideDonated.value && collectiblesStore.caughtIds.has(c.id)) return false
    if (!matchesSearch(c, query)) return false
    return true
  })
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search by name…"
        class="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
      />

      <label class="ml-auto flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <input v-model="hideDonated" type="checkbox" class="rounded" />
        Hide donated
      </label>
    </div>

    <p class="text-sm text-stone-500 dark:text-stone-400">
      {{ filtered.length }} results<span v-if="search.trim()"> · searching a set name like “Diplodocus” finds all its pieces</span>
    </p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CollectibleCard v-for="c in filtered" :key="c.id" :collectible="c" />
    </div>
  </div>
</template>
