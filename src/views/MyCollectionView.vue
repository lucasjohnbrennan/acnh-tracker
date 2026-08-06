<script setup>
import { computed, ref } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import CollectibleCard from '../components/CollectibleCard.vue'

const collectiblesStore = useCollectiblesStore()
const showUncaught = ref(false)

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bugs' },
  { value: 'fish', label: '🐟 Fish' },
  { value: 'sea', label: '🦀 Sea Creatures' },
]

function itemsFor(category) {
  return collectiblesStore.byCategory[category].filter((c) =>
    showUncaught.value ? !collectiblesStore.caughtIds.has(c.id) : collectiblesStore.caughtIds.has(c.id)
  )
}

const overallPercent = computed(() => {
  const total = collectiblesStore.all.length
  return total === 0 ? 0 : Math.round((collectiblesStore.caughtCount / total) * 100)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div class="flex items-center justify-between">
        <p class="font-medium text-stone-900 dark:text-white">
          {{ collectiblesStore.caughtCount }} / {{ collectiblesStore.all.length }} caught ({{ overallPercent }}%)
        </p>
        <label class="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <input v-model="showUncaught" type="checkbox" class="rounded" />
          Show what's left instead
        </label>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div class="h-full bg-emerald-500" :style="{ width: overallPercent + '%' }" />
      </div>
    </div>

    <section v-for="cat in CATEGORIES" :key="cat.value" class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold text-stone-900 dark:text-white">{{ cat.label }}</h2>
      <div v-if="itemsFor(cat.value).length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CollectibleCard v-for="c in itemsFor(cat.value)" :key="c.id" :collectible="c" />
      </div>
      <p v-else class="text-sm text-stone-500 dark:text-stone-400">
        {{ showUncaught ? "You've caught them all!" : 'Nothing caught yet.' }}
      </p>
    </section>
  </div>
</template>
