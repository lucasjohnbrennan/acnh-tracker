<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref('signin') // 'signin' | 'signup'
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }
    router.push(route.query.redirect || { name: 'home' })
  } catch (err) {
    error.value = err.message.replace('Firebase: ', '')
  } finally {
    submitting.value = false
  }
}

async function handleGoogleSignIn() {
  error.value = ''
  submitting.value = true
  try {
    await authStore.signInWithGoogle()
    router.push(route.query.redirect || { name: 'home' })
  } catch (err) {
    error.value = err.message.replace('Firebase: ', '')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm">
    <h1 class="mb-4 text-xl font-semibold text-stone-900 dark:text-white">
      {{ mode === 'signin' ? 'Sign in' : 'Create an account' }}
    </h1>

    <p
      v-if="!authStore.firebaseConfigured"
      class="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      Firebase isn't configured yet — copy <code>.env.example</code> to <code>.env</code> and add your project credentials to enable sign-in.
    </p>

    <button
      type="button"
      :disabled="submitting"
      class="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
      @click="handleGoogleSignIn"
    >
      <svg viewBox="0 0 48 48" class="h-4 w-4" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.9 29.6 5 24 5c-7.5 0-13.9 4.3-17.1 10.6z" />
        <path fill="#4CAF50" d="M24 44c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.6 16.4 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
      </svg>
      Continue with Google
    </button>

    <div class="my-4 flex items-center gap-3 text-xs text-stone-400">
      <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
      or
      <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
      <label class="flex flex-col gap-1 text-sm text-stone-600 dark:text-stone-300">
        Email
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="rounded-md border border-stone-300 px-3 py-1.5 dark:border-stone-700 dark:bg-stone-900"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm text-stone-600 dark:text-stone-300">
        Password
        <input
          v-model="password"
          type="password"
          required
          minlength="6"
          :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
          class="rounded-md border border-stone-300 px-3 py-1.5 dark:border-stone-700 dark:bg-stone-900"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {{ mode === 'signin' ? 'Sign in' : 'Sign up' }}
      </button>
    </form>

    <p class="mt-4 text-sm text-stone-500 dark:text-stone-400">
      <template v-if="mode === 'signin'">
        Don't have an account?
        <button type="button" class="text-emerald-700 underline dark:text-emerald-400" @click="mode = 'signup'">Sign up</button>
      </template>
      <template v-else>
        Already have an account?
        <button type="button" class="text-emerald-700 underline dark:text-emerald-400" @click="mode = 'signin'">Sign in</button>
      </template>
    </p>
  </div>
</template>
