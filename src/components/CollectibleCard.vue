<script setup>
import { computed } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import { useHemisphereStore } from '../stores/hemisphere'
import { formatWindows, summarizeYearWindows, MONTH_NAMES } from '../lib/time'

const props = defineProps({
  collectible: { type: Object, required: true },
  // 1-12, or null/undefined to show a full-year summary instead of one month.
  filterMonth: { type: Number, default: null },
})

const collectiblesStore = useCollectiblesStore()
const authStore = useAuthStore()
const hemisphereStore = useHemisphereStore()

const CATEGORY_META = {
  bug: { icon: '🐛', label: 'Bug' },
  fish: { icon: '🐟', label: 'Fish' },
  sea: { icon: '🦀', label: 'Sea creature' },
}

const meta = computed(() => CATEGORY_META[props.collectible.category])
const isCaught = computed(() => collectiblesStore.caughtIds.has(props.collectible.id))
const monthlyWindows = computed(() => props.collectible.availability[hemisphereStore.hemisphere])
const availableMonths = computed(() => monthlyWindows.value.map((w) => w.length > 0))

const timeLabel = computed(() => {
  if (props.filterMonth) {
    return `In ${MONTH_NAMES[props.filterMonth - 1]}: ${formatWindows(monthlyWindows.value[props.filterMonth - 1])}`
  }
  return summarizeYearWindows(monthlyWindows.value)
})

async function handleToggle() {
  if (!authStore.user) return
  await collectiblesStore.toggleCaught(props.collectible.id)
}
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-xl border p-4 transition-colors"
    :class="isCaught
      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
      : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="font-semibold text-stone-900 dark:text-white">
          <span aria-hidden="true">{{ meta.icon }}</span> {{ collectible.name }}
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ meta.label }} · {{ collectible.location }}<span v-if="collectible.price"> · {{ collectible.price.toLocaleString() }} bells</span><span v-if="collectible.shadowSize"> · Shadow: {{ collectible.shadowSize }}</span>
        </p>
      </div>

      <button
        type="button"
        class="shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        :class="isCaught
          ? 'border-emerald-500 bg-emerald-600 text-white'
          : 'border-stone-300 text-stone-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-stone-700 dark:text-stone-400'"
        :disabled="!authStore.user"
        :title="authStore.user ? '' : 'Sign in to track your collection'"
        @click="handleToggle"
      >
        {{ isCaught ? 'Caught ✓' : 'Mark caught' }}
      </button>
    </div>

    <p class="text-sm text-stone-700 dark:text-stone-300">{{ timeLabel }}</p>

    <div class="flex gap-0.5" :title="'Months available (' + hemisphereStore.hemisphere + 'ern hemisphere)'">
      <span
        v-for="(available, idx) in availableMonths"
        :key="idx"
        class="h-2 flex-1 rounded-sm"
        :class="available ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'"
        :aria-label="MONTH_NAMES[idx]"
      />
    </div>
  </div>
</template>
