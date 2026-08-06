<script setup>
import { useHemisphereStore } from '../stores/hemisphere'

const hemisphereStore = useHemisphereStore()
</script>

<template>
  <div class="inline-flex rounded-full border border-stone-300 bg-white p-0.5 text-sm dark:border-stone-700 dark:bg-stone-900">
    <button
      type="button"
      class="rounded-full px-3 py-1 transition-colors"
      :class="hemisphereStore.hemisphere === 'north'
        ? 'bg-emerald-600 text-white'
        : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'"
      @click="hemisphereStore.setHemisphere('north')"
    >
      Northern
    </button>
    <button
      type="button"
      class="rounded-full px-3 py-1 transition-colors"
      :class="hemisphereStore.hemisphere === 'south'
        ? 'bg-emerald-600 text-white'
        : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'"
      @click="hemisphereStore.setHemisphere('south')"
    >
      Southern
    </button>
  </div>
</template>
