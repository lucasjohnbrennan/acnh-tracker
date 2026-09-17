<script setup>
import { consentBannerVisible, setAnalyticsConsent } from '../lib/analytics'
</script>

<template>
  <!--
    Both buttons are styled identically on purpose: declining has to be exactly
    as easy as accepting, so neither choice gets the emerald "do this one" look
    used elsewhere in the app.
  -->
  <div
    v-if="consentBannerVisible"
    role="dialog"
    aria-label="Analytics cookies"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white shadow-lg dark:border-stone-800 dark:bg-stone-900"
  >
    <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      <p class="text-sm text-stone-600 dark:text-stone-300">
        Mind if I count page views? Google Analytics, cookies and all, just to see
        which pages get used — never what you've caught or who you are. It doesn't
        load at all unless you say yes, and you can change your mind at the bottom
        of any page.
      </p>

      <div class="flex shrink-0 gap-2 sm:ml-auto">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          @click="setAnalyticsConsent('denied')"
        >
          No thanks
        </button>
        <button
          type="button"
          class="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          @click="setAnalyticsConsent('granted')"
        >
          Sure, count me
        </button>
      </div>
    </div>
  </div>
</template>
