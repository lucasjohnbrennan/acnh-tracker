import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { doc, onSnapshot, setDoc, arrayRemove, arrayUnion } from 'firebase/firestore'
import { db, firebaseConfigured } from '../lib/firebase'
import { useAuthStore } from './auth'
import { useHemisphereStore } from './hemisphere'
import { findBestTime } from '../lib/time'
import allCollectibles from '../data/collectibles.json'

export const useCollectiblesStore = defineStore('collectibles', () => {
  const all = ref(allCollectibles)
  const caughtIds = ref(new Set())
  let unsubscribeSnapshot = null

  const authStore = useAuthStore()
  const hemisphereStore = useHemisphereStore()

  function subscribeToUser(uid) {
    if (unsubscribeSnapshot) unsubscribeSnapshot()
    unsubscribeSnapshot = onSnapshot(doc(db, 'users', uid), (snap) => {
      const ids = snap.exists() ? snap.data().caughtIds || [] : []
      caughtIds.value = new Set(ids)
    })
  }

  watch(
    () => authStore.user,
    (user) => {
      if (user && firebaseConfigured) {
        subscribeToUser(user.uid)
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot()
        unsubscribeSnapshot = null
        caughtIds.value = new Set()
      }
    },
    { immediate: true }
  )

  async function setCaught(id, isCaught) {
    const user = authStore.user
    if (!user || !firebaseConfigured) return
    await setDoc(
      doc(db, 'users', user.uid),
      { caughtIds: isCaught ? arrayUnion(id) : arrayRemove(id) },
      { merge: true }
    )
  }

  async function toggleCaught(id) {
    await setCaught(id, !caughtIds.value.has(id))
  }

  const byCategory = computed(() => ({
    bug: all.value.filter((c) => c.category === 'bug'),
    fish: all.value.filter((c) => c.category === 'fish'),
    sea: all.value.filter((c) => c.category === 'sea'),
  }))

  const caughtCount = computed(() => caughtIds.value.size)

  // Signed-in users get the "most uncaught species" recommendation; signed-out
  // visitors fall back to "most total species catchable" (excludeIds empty).
  const bestTime = computed(() =>
    findBestTime(all.value, hemisphereStore.hemisphere, authStore.user ? caughtIds.value : new Set())
  )

  return { all, byCategory, caughtIds, caughtCount, bestTime, toggleCaught }
})
