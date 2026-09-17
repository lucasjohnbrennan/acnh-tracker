<script setup>
import NavBar from './components/NavBar.vue'
import MuseumCompleteCelebration from './components/MuseumCompleteCelebration.vue'
import AnalyticsConsent from './components/AnalyticsConsent.vue'
import { analyticsConfigured, analyticsConsent, reopenAnalyticsConsent } from './lib/analytics'
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
    <NavBar />
    <main class="mx-auto max-w-5xl px-4 py-6">
      <router-view />
    </main>

    <!-- Withdrawing consent has to be as easy as giving it, so the current
         setting stays reachable from every page once the banner is gone. -->
    <footer
      v-if="analyticsConfigured && analyticsConsent !== null"
      class="mx-auto max-w-5xl px-4 pb-6 text-center text-xs text-stone-500"
    >
      <button
        type="button"
        class="underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300"
        @click="reopenAnalyticsConsent"
      >
        Analytics: {{ analyticsConsent === 'granted' ? 'on' : 'off' }} — change
      </button>
    </footer>

    <MuseumCompleteCelebration />
    <AnalyticsConsent />
  </div>
</template>
