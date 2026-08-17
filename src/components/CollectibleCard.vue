<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import { useHemisphereStore } from '../stores/hemisphere'
import { formatWindows, summarizeYearWindows, MONTH_NAMES } from '../lib/time'
import artFakes from '../data/art-fakes.json'

const FAKE_GUIDE_URL =
  'https://animalcrossingworld.com/guides/new-horizons/jolly-redds-art-real-genuine-vs-fake-forgery-cheat-sheet/'

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
  fossil: { icon: '🦴', label: 'Fossil' },
  art: { icon: '🖼️', label: 'Art' },
}

const meta = computed(() => CATEGORY_META[props.collectible.category])
const actionVerb = computed(() =>
  props.collectible.category === 'fossil' || props.collectible.category === 'art' ? 'Donated' : 'Caught'
)
const imgFailed = ref(false)
const isCaught = computed(() => collectiblesStore.caughtIds.has(props.collectible.id))

// Sell price is meaningful for critters and fossils, but not for art: Blathers
// wants it and Nook's Cranny won't buy it, so the number is just noise here.
const showPrice = computed(() => Boolean(props.collectible.price) && props.collectible.category !== 'art')

// How to tell this piece's forgery from the genuine article, if we have it.
const fakeTell = computed(() => artFakes[props.collectible.id] ?? null)
const showFakeInfo = ref(false)
const fakeInfoRoot = ref(null)

function closeOnOutsideClick(event) {
  if (fakeInfoRoot.value && !fakeInfoRoot.value.contains(event.target)) showFakeInfo.value = false
}

function closeOnEscape(event) {
  if (event.key === 'Escape') showFakeInfo.value = false
}

watch(showFakeInfo, (open) => {
  const method = open ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', closeOnOutsideClick)
  document[method]('keydown', closeOnEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutsideClick)
  document.removeEventListener('keydown', closeOnEscape)
})
const isTimeBased = computed(() => Boolean(props.collectible.availability))
const monthlyWindows = computed(() =>
  isTimeBased.value ? props.collectible.availability[hemisphereStore.hemisphere] : null
)
const availableMonths = computed(() => monthlyWindows.value?.map((w) => w.length > 0) ?? [])

const timeLabel = computed(() => {
  if (!isTimeBased.value) return null
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
      <div class="flex items-start gap-3">
        <img
          v-if="collectible.iconUrl && !imgFailed"
          :src="collectible.iconUrl"
          :alt="collectible.name"
          loading="lazy"
          class="h-11 w-11 shrink-0 object-contain"
          @error="imgFailed = true"
        />
        <span
          v-else
          class="flex h-11 w-11 shrink-0 items-center justify-center text-2xl"
          aria-hidden="true"
        >{{ meta.icon }}</span>

        <div>
          <p class="font-semibold text-stone-900 dark:text-white">{{ collectible.name }}</p>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ meta.label }}<span v-if="collectible.location"> · {{ collectible.location }}</span><span v-if="collectible.fossilGroup"> · {{ collectible.fossilGroup }} set</span><span v-if="showPrice"> · {{ collectible.price.toLocaleString() }} bells</span><span v-if="collectible.shadowSize"> · Shadow: {{ collectible.shadowSize }}</span>
          </p>

          <div v-if="collectible.hasFake" ref="fakeInfoRoot" class="relative mt-1">
            <button
              type="button"
              class="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/70"
              :aria-expanded="showFakeInfo"
              title="A counterfeit version of this exists at Redd's — tap to see how to spot it."
              @click="showFakeInfo = !showFakeInfo"
            >
              ⚠️ Fake exists
            </button>

            <div
              v-if="showFakeInfo"
              class="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-800"
            >
              <p class="font-semibold text-stone-900 dark:text-white">Spotting the forgery</p>
              <template v-if="fakeTell">
                <p class="mt-2 text-stone-600 dark:text-stone-300">
                  <span class="font-semibold text-red-600 dark:text-red-400">Fake:</span>
                  {{ fakeTell.fake }}
                </p>
                <p class="mt-1.5 text-stone-600 dark:text-stone-300">
                  <span class="font-semibold text-emerald-700 dark:text-emerald-400">Real:</span>
                  {{ fakeTell.real }}
                </p>
                <p v-if="fakeTell.also" class="mt-1.5 text-stone-500 dark:text-stone-400">{{ fakeTell.also }}</p>
              </template>
              <p v-else class="mt-2 text-stone-600 dark:text-stone-300">
                A counterfeit of this piece exists at Redd's — compare it carefully before buying.
              </p>
              <a
                :href="FAKE_GUIDE_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-block text-stone-500 underline hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-400"
              >
                Side-by-side pictures ↗
              </a>
            </div>
          </div>
        </div>
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
        {{ isCaught ? `${actionVerb} ✓` : `Mark ${actionVerb.toLowerCase()}` }}
      </button>
    </div>

    <template v-if="isTimeBased">
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
    </template>
  </div>
</template>
