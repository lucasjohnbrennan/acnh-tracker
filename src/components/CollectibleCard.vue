<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import { useHemisphereStore } from '../stores/hemisphere'
import { formatWindows, summarizeYearWindows, MONTH_NAMES } from '../lib/time'
import artFakes from '../data/art-fakes.json'
import { MOOD_ICONS } from '../lib/music'
import { actionVerb, actionVerbTitle } from '../lib/terms'

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
  music: { icon: '🎵', label: 'Song' },
}

const meta = computed(() => CATEGORY_META[props.collectible.category])
const isArt = computed(() => props.collectible.category === 'art')

// "Art" is what the museum calls the wing; on the piece itself the useful word
// is which half of it you're looking at — one hangs on a wall, one doesn't.
const categoryLabel = computed(() =>
  isArt.value ? (props.collectible.artType === 'statue' ? 'Statue' : 'Painting') : meta.value.label
)
const categoryIcon = computed(() =>
  isArt.value && props.collectible.artType === 'statue' ? '🗿' : meta.value.icon
)

// Every fossil carries a group, but for the standalone ones (Amber, Ammonite)
// the group is just the fossil's own name — "Amber set" tells you nothing.
// It's only worth showing on the multi-piece dinosaurs.
const showFossilGroup = computed(
  () => Boolean(props.collectible.fossilGroup) && props.collectible.fossilGroup !== props.collectible.name
)
const imgFailed = ref(false)
const isCaught = computed(() => collectiblesStore.caughtIds.has(props.collectible.id))

// Sell price is meaningful for critters and fossils, but not for art: Blathers
// wants it and Nook's Cranny won't buy it, so the number is just noise here.
// Songs carry no price at all — every one of them is the same 3,200/800.
const showPrice = computed(() => Boolean(props.collectible.price) && props.collectible.category !== 'art')

const isMusic = computed(() => props.collectible.category === 'music')

// For songs with a mood, the badge above already says everything the sheet's
// notes do, so show where the record comes from instead. For the few with no
// mood, the notes are the only place that explains how to get them.
const musicSourceLabel = computed(() =>
  props.collectible.mood ? props.collectible.source : props.collectible.sourceNotes
)

// How to tell this piece's forgery from the genuine article, if we have it.
const fakeTell = computed(() => artFakes[props.collectible.id] ?? null)

// The guide gives every piece its own section, anchored on the slug of its
// name — which is exactly our id with the `art-` prefix stripped, since both
// slugify the same name (checked against the live page: all 43 pieces match).
// If they ever rename an anchor the link just lands at the top of the guide,
// which is where it used to land for everything anyway.
const fakeGuideUrl = computed(
  () => `${FAKE_GUIDE_URL}#${props.collectible.id.replace(/^art-/, '')}`
)
const showFakeInfo = ref(false)
const fakeInfoRoot = ref(null)
const fakeInfoPanel = ref(null)
// The panel normally hangs below the badge, but the last cards on a page have
// no room down there — on a phone it ran off the bottom of the screen. When
// below doesn't fit and above does, flip it.
const fakeInfoAbove = ref(false)

// Matches the mt-1.5/mb-1.5 gap between badge and panel.
const PANEL_GAP = 6

async function toggleFakeInfo() {
  if (showFakeInfo.value) {
    showFakeInfo.value = false
    return
  }
  // Open downwards first so the panel is in the DOM to be measured.
  fakeInfoAbove.value = false
  showFakeInfo.value = true
  await nextTick()

  const badge = fakeInfoRoot.value?.getBoundingClientRect()
  const panel = fakeInfoPanel.value?.getBoundingClientRect()
  if (!badge || !panel) return

  const spaceBelow = window.innerHeight - badge.bottom
  const needed = panel.height + PANEL_GAP
  // Only flip if above is actually roomier — on a short screen where neither
  // side fits, dropping down keeps the first line (the tell) visible.
  fakeInfoAbove.value = spaceBelow < needed && badge.top > spaceBelow
}

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
        >{{ categoryIcon }}</span>

        <div>
          <p class="font-semibold text-stone-900 dark:text-white">{{ collectible.name }}</p>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ categoryLabel }}<span v-if="collectible.location"> · {{ collectible.location }}</span><span v-if="showFossilGroup"> · {{ collectible.fossilGroup }} set</span><span v-if="collectible.seasonEvent"> · {{ collectible.seasonEvent }}</span><span v-if="showPrice"> · {{ collectible.price.toLocaleString() }} bells</span><span v-if="collectible.shadowSize"> · Shadow: {{ collectible.shadowSize }}</span>
          </p>

          <div v-if="collectible.hasFake" ref="fakeInfoRoot" class="relative mt-1">
            <button
              type="button"
              class="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/70"
              :aria-expanded="showFakeInfo"
              title="A counterfeit version of this exists at Redd's — tap to see how to spot it."
              @click="toggleFakeInfo"
            >
              ⚠️ Fake exists
            </button>

            <div
              v-if="showFakeInfo"
              ref="fakeInfoPanel"
              class="absolute left-0 z-20 w-64 rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-800"
              :class="fakeInfoAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5'"
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
                :href="fakeGuideUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-block text-stone-500 underline hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-400"
              >
                Side-by-side pictures of this piece ↗
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
        {{ isCaught ? `${actionVerbTitle(collectible.category)} ✓` : `Mark ${actionVerb(collectible.category)}` }}
      </button>
    </div>

    <p
      v-if="isArt && collectible.realArtworkTitle"
      class="text-xs italic text-stone-500 dark:text-stone-400"
    >
      {{ collectible.realArtworkTitle }}<span v-if="collectible.artist"> — {{ collectible.artist }}</span>
    </p>

    <template v-if="isMusic">
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-if="collectible.mood"
          class="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
          title="Pick this mood before asking K.K. for a song and he might play this one."
        >{{ MOOD_ICONS[collectible.mood] }} {{ collectible.mood }}</span>
        <span
          class="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
        >{{ collectible.nookShopping ? '🛒 Nook Shopping' : '🎤 K.K. only' }}</span>
        <span
          v-if="collectible.versionAdded && collectible.versionAdded !== '1.0.0'"
          class="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
          title="Added in a later game update"
        >Update {{ collectible.versionAdded }}</span>
      </div>
      <p v-if="musicSourceLabel" class="text-sm text-stone-700 dark:text-stone-300">{{ musicSourceLabel }}</p>
    </template>

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
