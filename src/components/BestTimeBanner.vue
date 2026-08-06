<script setup>
import { computed } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'

const collectiblesStore = useCollectiblesStore()
const authStore = useAuthStore()

const best = computed(() => collectiblesStore.bestTime)

const breakdown = computed(() => {
  const idSet = new Set(best.value.ids)
  const species = collectiblesStore.all.filter((c) => idSet.has(c.id))
  return {
    bug: species.filter((c) => c.category === 'bug').length,
    fish: species.filter((c) => c.category === 'fish').length,
    sea: species.filter((c) => c.category === 'sea').length,
  }
})
</script>

<template>
  <section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
      Best time to time-travel to
    </p>

    <div v-if="best.count > 0" class="mt-2">
      <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ best.label }}</p>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">
        {{ best.count }} {{ authStore.user ? 'not-yet-caught' : 'total' }} species catchable —
        🐛 {{ breakdown.bug }} bugs · 🐟 {{ breakdown.fish }} fish · 🦀 {{ breakdown.sea }} sea creatures
      </p>
      <p v-if="!authStore.user" class="mt-2 text-xs text-stone-500 dark:text-stone-400">
        <router-link to="/login" class="underline hover:text-emerald-700 dark:hover:text-emerald-400">Sign in</router-link>
        to get recommendations based on what you personally haven't caught yet.
      </p>
    </div>
    <p v-else class="mt-2 text-lg font-semibold text-stone-700 dark:text-stone-200">
      You've caught everything catchable this year — nice work!
    </p>
  </section>
</template>
