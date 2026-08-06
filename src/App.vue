<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
    <NavBar />
    <main class="mx-auto max-w-5xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
