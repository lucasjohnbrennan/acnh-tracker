<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import { useMusicFiltersStore } from '../stores/musicFilters'
import { MOOD_OPTIONS } from '../lib/music'
import CollectibleCard from '../components/CollectibleCard.vue'

const collectiblesStore = useCollectiblesStore()
const authStore = useAuthStore()
const filtersStore = useMusicFiltersStore()
const { search, mood, hideCollected } = storeToRefs(filtersStore)

function matchesMood(song) {
  if (mood.value === 'all') return true
  if (mood.value === 'special') return song.mood === null
  return song.mood === mood.value
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return collectiblesStore.musicItems.filter((c) => {
    if (!matchesMood(c)) return false
    if (hideCollected.value && collectiblesStore.caughtIds.has(c.id)) return false
    if (query && !c.name.toLowerCase().includes(query)) return false
    return true
  })
})

const total = computed(() => collectiblesStore.musicItems.length)
const collected = computed(() => collectiblesStore.musicCaughtCount)
const percent = computed(() => (total.value === 0 ? 0 : Math.round((collected.value / total.value) * 100)))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="authStore.user"
      class="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-medium text-stone-900 dark:text-white">
          🎵 {{ collected }} / {{ total }} songs collected ({{ percent }}%)
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          K.K.'s records aren't museum exhibits — these don't count towards your donations.
        </p>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div class="h-full bg-sky-500" :style="{ width: percent + '%' }" />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search by name…"
        class="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
      />

      <label class="ml-auto flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <input v-model="hideCollected" type="checkbox" class="rounded" />
        Hide collected
      </label>
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        v-for="opt in MOOD_OPTIONS"
        :key="opt.value"
        type="button"
        class="rounded-full px-3 py-1 text-sm transition-colors"
        :class="mood === opt.value
          ? 'bg-emerald-600 text-white'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'"
        @click="mood = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <p class="text-sm text-stone-500 dark:text-stone-400">
      {{ filtered.length }} results<span v-if="mood !== 'all' && mood !== 'special'"> · tell K.K. you're feeling “{{ mood }}” and he might play one of these</span>
    </p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CollectibleCard v-for="c in filtered" :key="c.id" :collectible="c" />
    </div>
  </div>
</template>
