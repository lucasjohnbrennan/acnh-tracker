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
  // False until the signed-in user's saved collection has actually arrived from
  // Firestore. Without it, every page load looks like "just caught everything"
  // to anyone already finished, and the museum celebration would replay forever.
  const hydrated = ref(false)
  let unsubscribeSnapshot = null

  const authStore = useAuthStore()
  const hemisphereStore = useHemisphereStore()

  function subscribeToUser(uid) {
    if (unsubscribeSnapshot) unsubscribeSnapshot()
    unsubscribeSnapshot = onSnapshot(doc(db, 'users', uid), (snap) => {
      const ids = snap.exists() ? snap.data().caughtIds || [] : []
      caughtIds.value = new Set(ids)
      hydrated.value = true
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
        hydrated.value = false
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
    fossil: all.value.filter((c) => c.category === 'fossil'),
    art: all.value.filter((c) => c.category === 'art'),
  }))

  // Fossils/art aren't time dependent (no `availability` field) — keep them
  // out of anything driven by the month/hour grid.
  const timeBased = computed(() => all.value.filter((c) => c.availability))

  const caughtCount = computed(() => caughtIds.value.size)

  // "Museum complete" = the whole building: every bug, fish, sea creature,
  // fossil and piece of artwork donated.
  const museumComplete = computed(
    () => all.value.length > 0 && all.value.every((c) => caughtIds.value.has(c.id))
  )

  // Signed-in users get the "most uncaught species" recommendation; signed-out
  // visitors fall back to "most total species catchable" (excludeIds empty).
  const bestTime = computed(() =>
    findBestTime(timeBased.value, hemisphereStore.hemisphere, authStore.user ? caughtIds.value : new Set())
  )

  return {
    all,
    byCategory,
    timeBased,
    caughtIds,
    caughtCount,
    hydrated,
    museumComplete,
    bestTime,
    toggleCaught,
  }
})
