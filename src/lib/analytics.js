import { computed, ref } from 'vue'
import {
  initializeAnalytics,
  isSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
} from 'firebase/analytics'
import { firebaseApp, firebaseConfigured, measurementId } from './firebase'

const STORAGE_KEY = 'acnh-tracker:analytics-consent'

// No measurement ID means there is nothing to consent to: no banner, no SDK.
export const analyticsConfigured = Boolean(firebaseConfigured && measurementId)

function readStoredConsent() {
  // Safari's private mode throws on storage access rather than returning null.
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : null
  } catch {
    return null
  }
}

// 'granted' | 'denied' | null, where null means they haven't been asked yet.
// Reactive so the banner and the footer toggle both follow the current choice.
export const analyticsConsent = ref(readStoredConsent())

export const consentBannerVisible = computed(
  () => analyticsConfigured && analyticsConsent.value === null,
)

let analyticsPromise = null
let pendingPageView = null

// Deliberately lazy: the SDK is what loads gtag.js and sets cookies, so it must
// not be touched until consent exists. Re-checked on every call rather than
// once at import, because consent can arrive (or be withdrawn) mid-session.
function ensureAnalytics() {
  if (!analyticsConfigured || analyticsConsent.value !== 'granted') return Promise.resolve(null)
  // isSupported() resolves false where measurement can't run at all (no cookies
  // or IndexedDB, some in-app browsers), and initializing anyway throws.
  analyticsPromise ||= isSupported()
    .then((supported) =>
      supported
        ? // Page views come from the router instead. The automatic one fires
          // only on the initial document load, missing in-app navigation.
          initializeAnalytics(firebaseApp, { config: { send_page_view: false } })
        : null,
    )
    .catch(() => null)
  return analyticsPromise
}

export async function logAnalyticsEvent(name, params) {
  const analytics = await ensureAnalytics()
  if (!analytics) {
    // Hold the current page so that accepting counts the visit they're already
    // on, instead of starting from wherever they happen to navigate next.
    if (name === 'page_view') pendingPageView = params
    return
  }
  logEvent(analytics, name, params)
}

// Withdrawing after the SDK has already started: stop collection and clear the
// cookies it set, so "no" means the same thing whenever it's chosen.
function stopCollection() {
  if (analyticsPromise) {
    analyticsPromise.then((analytics) => {
      if (analytics) setAnalyticsCollectionEnabled(analytics, false)
    })
  }
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (name === '_ga' || name.startsWith('_ga_')) {
      document.cookie = `${name}=; path=/; max-age=0`
    }
  }
}

export function setAnalyticsConsent(choice) {
  const value = choice === 'granted' ? 'granted' : 'denied'
  analyticsConsent.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage is blocked — the choice holds for this page only, and they get
    // asked again next visit. Asking twice is the safe way to fail here.
  }

  if (value === 'denied') {
    pendingPageView = null
    stopCollection()
    return
  }

  const queued = pendingPageView
  pendingPageView = null
  if (queued) logAnalyticsEvent('page_view', queued)
}

// Puts the choice back in front of them. Consent reverts to undecided, which
// also pauses logging until they answer again.
export function reopenAnalyticsConsent() {
  analyticsConsent.value = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing was persisted in the first place.
  }
}
