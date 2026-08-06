<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HemisphereToggle from './HemisphereToggle.vue'

const authStore = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await authStore.signOut()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
      <router-link to="/" class="mr-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
        🏝️ ACNH Tracker
      </router-link>

      <nav class="flex gap-4 text-sm font-medium text-stone-600 dark:text-stone-300">
        <router-link to="/" class="hover:text-emerald-700 dark:hover:text-emerald-400" active-class="text-emerald-700 dark:text-emerald-400">Home</router-link>
        <router-link to="/browse" class="hover:text-emerald-700 dark:hover:text-emerald-400" active-class="text-emerald-700 dark:text-emerald-400">Browse</router-link>
        <router-link to="/collection" class="hover:text-emerald-700 dark:hover:text-emerald-400" active-class="text-emerald-700 dark:text-emerald-400">My Collection</router-link>
      </nav>

      <div class="ml-auto flex items-center gap-3">
        <HemisphereToggle />

        <template v-if="authStore.user">
          <span class="hidden text-sm text-stone-500 sm:inline">{{ authStore.user.email }}</span>
          <button
            type="button"
            class="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            @click="handleSignOut"
          >
            Sign out
          </button>
        </template>
        <router-link
          v-else
          to="/login"
          class="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Sign in
        </router-link>
      </div>
    </div>
  </header>
</template>
