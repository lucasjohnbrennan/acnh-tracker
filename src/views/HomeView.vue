<script setup>
import { computed } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import BestTimeBanner from '../components/BestTimeBanner.vue'

const collectiblesStore = useCollectiblesStore()
const authStore = useAuthStore()

const totals = computed(() => ({
  bug: collectiblesStore.byCategory.bug.length,
  fish: collectiblesStore.byCategory.fish.length,
  sea: collectiblesStore.byCategory.sea.length,
}))

const caughtByCategory = computed(() => {
  const counts = { bug: 0, fish: 0, sea: 0 }
  for (const c of collectiblesStore.all) {
    if (collectiblesStore.caughtIds.has(c.id)) counts[c.category]++
  }
  return counts
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <BestTimeBanner />

    <section v-if="authStore.user" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="(label, key) in { bug: '🐛 Bugs', fish: '🐟 Fish', sea: '🦀 Sea Creatures' }"
        :key="key"
        class="rounded-xl border border-stone-200 bg-white p-4 text-center dark:border-stone-800 dark:bg-stone-900"
      >
        <p class="text-sm text-stone-500 dark:text-stone-400">{{ label }}</p>
        <p class="text-2xl font-bold text-stone-900 dark:text-white">
          {{ caughtByCategory[key] }} <span class="text-base font-normal text-stone-400">/ {{ totals[key] }}</span>
        </p>
      </div>
    </section>

    <section v-else class="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-600 dark:border-stone-700 dark:text-stone-300">
      <p>
        <router-link to="/login" class="font-medium text-emerald-700 underline dark:text-emerald-400">Sign in</router-link>
        to track which of the {{ collectiblesStore.all.length }} bugs, fish, and sea creatures you've caught.
      </p>
    </section>

    <router-link
      to="/browse"
      class="inline-block w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
    >
      Browse all collectibles →
    </router-link>
  </div>
</template>
