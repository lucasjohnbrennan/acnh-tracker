<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectiblesStore } from '../stores/collectibles'
import { useHemisphereStore } from '../stores/hemisphere'
import { useBrowseFiltersStore } from '../stores/browseFilters'
import { MONTH_NAMES, formatHour, isHourInWindows, rangeOverlapsWindows } from '../lib/time'
import CollectibleCard from '../components/CollectibleCard.vue'

const collectiblesStore = useCollectiblesStore()
const hemisphereStore = useHemisphereStore()
const filtersStore = useBrowseFiltersStore()
const { search, category, month, hourFrom, hourTo, hideCaught } = storeToRefs(filtersStore)

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'bug', label: '🐛 Bugs' },
  { value: 'fish', label: '🐟 Fish' },
  { value: 'sea', label: '🦀 Sea Creatures' },
]

const MONTH_OPTIONS = [
  { value: 'all', label: 'All months' },
  ...MONTH_NAMES.map((name, idx) => ({ value: idx + 1, label: name })),
]

const HOUR_OPTIONS = [
  { value: 'all', label: 'Any' },
  ...Array.from({ length: 24 }, (_, h) => ({ value: h, label: formatHour(h) })),
]

// Whether a collectible is catchable in the selected hour range: within the
// selected month if one's chosen, otherwise in at least one month all year.
// If only one of from/to is set, it's treated as a single-hour filter.
function matchesHour(collectible) {
  if (hourFrom.value === 'all' && hourTo.value === 'all') return true
  const monthly = collectible.availability[hemisphereStore.hemisphere]
  const monthsToCheck = month.value === 'all' ? monthly : [monthly[month.value - 1]]

  if (hourFrom.value !== 'all' && hourTo.value !== 'all') {
    return monthsToCheck.some((windows) => rangeOverlapsWindows(hourFrom.value, hourTo.value, windows))
  }
  const singleHour = hourFrom.value !== 'all' ? hourFrom.value : hourTo.value
  return monthsToCheck.some((windows) => isHourInWindows(singleHour, windows))
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return collectiblesStore.all.filter((c) => {
    if (category.value !== 'all' && c.category !== category.value) return false
    if (hideCaught.value && collectiblesStore.caughtIds.has(c.id)) return false
    if (query && !c.name.toLowerCase().includes(query)) return false
    if (month.value !== 'all') {
      const windows = c.availability[hemisphereStore.hemisphere][month.value - 1]
      if (windows.length === 0) return false
    }
    if (!matchesHour(c)) return false
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
          v-for="opt in CATEGORIES"
          :key="opt.value"
          type="button"
          class="rounded-full px-3 py-1 text-sm transition-colors"
          :class="category === opt.value
            ? 'bg-emerald-600 text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'"
          @click="category = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <select
        v-model="month"
        class="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
      >
        <option v-for="opt in MONTH_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>

      <div class="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
        <select
          v-model="hourFrom"
          aria-label="From hour"
          class="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <option v-for="opt in HOUR_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <span>to</span>
        <select
          v-model="hourTo"
          aria-label="To hour"
          class="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <option v-for="opt in HOUR_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <label class="ml-auto flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <input v-model="hideCaught" type="checkbox" class="rounded" />
        Hide caught
      </label>
    </div>

    <p class="text-sm text-stone-500 dark:text-stone-400">{{ filtered.length }} results</p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CollectibleCard
        v-for="c in filtered"
        :key="c.id"
        :collectible="c"
        :filter-month="month === 'all' ? null : month"
      />
    </div>
  </div>
</template>
