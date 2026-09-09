<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectiblesStore } from '../stores/collectibles'
import { useArtFiltersStore } from '../stores/artFilters'
import CollectibleCard from '../components/CollectibleCard.vue'

const collectiblesStore = useCollectiblesStore()
const filtersStore = useArtFiltersStore()
const { search, artType, fake, hideDonated } = storeToRefs(filtersStore)

const ART_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'painting', label: '🖼️ Paintings' },
  { value: 'statue', label: '🗿 Statues' },
]

// Redd sells a forgery of most, but not all, of the collection. Which side a
// piece falls on decides whether you need to squint at it before buying.
const FAKE_OPTIONS = [
  // "Any" rather than a second "All" — the two pill groups sit side by side and
  // shouldn't have identically-labelled defaults.
  { value: 'all', label: 'Any' },
  { value: 'fake', label: '⚠️ Fake exists' },
  { value: 'genuine', label: '✅ Always genuine' },
]

const artworks = computed(() => collectiblesStore.byCategory.art)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return artworks.value.filter((c) => {
    if (artType.value !== 'all' && c.artType !== artType.value) return false
    if (fake.value === 'fake' && !c.hasFake) return false
    if (fake.value === 'genuine' && c.hasFake) return false
    if (hideDonated.value && collectiblesStore.caughtIds.has(c.id)) return false
    if (query && !c.name.toLowerCase().includes(query)) return false
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

      <div class="flex gap-1">
        <button
          v-for="opt in ART_TYPES"
          :key="opt.value"
          type="button"
          class="rounded-full px-3 py-1 text-sm transition-colors"
          :class="artType === opt.value
            ? 'bg-emerald-600 text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'"
          @click="artType = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="flex gap-1">
        <button
          v-for="opt in FAKE_OPTIONS"
          :key="opt.value"
          type="button"
          class="rounded-full px-3 py-1 text-sm transition-colors"
          :class="fake === opt.value
            ? 'bg-emerald-600 text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'"
          @click="fake = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <label class="ml-auto flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <input v-model="hideDonated" type="checkbox" class="rounded" />
        Hide donated
      </label>
    </div>

    <p class="text-sm text-stone-500 dark:text-stone-400">
      {{ filtered.length }} results<span v-if="fake === 'genuine'"> · Redd can't fake these, so any copy he's selling is the real thing</span><span v-else-if="fake === 'fake'"> · check each of these carefully before you hand over the bells</span>
    </p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CollectibleCard v-for="c in filtered" :key="c.id" :collectible="c" />
    </div>
  </div>
</template>
