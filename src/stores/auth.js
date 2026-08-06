import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '../lib/firebase'

const NOT_CONFIGURED_MESSAGE =
  'Firebase is not configured yet. Copy .env.example to .env and fill in your project credentials.'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initializing = ref(true)
  let readyResolve
  const ready = new Promise((resolve) => { readyResolve = resolve })

  if (firebaseConfigured) {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      if (initializing.value) {
        initializing.value = false
        readyResolve()
      }
    })
  } else {
    initializing.value = false
    readyResolve()
  }

  async function signUp(email, password) {
    if (!firebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE)
    await createUserWithEmailAndPassword(auth, email, password)
  }

  async function signIn(email, password) {
    if (!firebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE)
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    if (!firebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE)
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function signOut() {
    if (!firebaseConfigured) return
    await firebaseSignOut(auth)
  }

  return { user, initializing, ready, firebaseConfigured, signUp, signIn, signInWithGoogle, signOut }
})
