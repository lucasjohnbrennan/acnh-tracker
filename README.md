# ACNH Tracker

Tracks catchable bugs, fish, and sea creatures in *Animal Crossing: New
Horizons*. Pick your hemisphere, and the home page tells you the single best
month + hour to time-travel to — the one where the most species (that you
personally haven't caught yet, once signed in) are available.

**Stack:** Vue 3 (Composition API, `<script setup>`) + Vite + Tailwind CSS,
Pinia for state, vue-router. No backend server — Firebase Auth handles sign-in
and Firestore stores each user's caught collectibles.

## Getting started

```bash
npm install
npm run dev
```

The app works out of the box for browsing and the best-time calculator, no
Firebase needed. Sign-in and "my collection" tracking stay disabled (with a
message pointing you here) until you configure Firebase — see below.

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build > Authentication > Get started** → enable the **Email/Password** sign-in provider.
3. **Build > Firestore Database > Create database** (production mode is fine — the rules below lock it down).
4. Deploy [`firestore.rules`](firestore.rules) from the Firestore **Rules** tab in the console (or via `firebase deploy --only firestore:rules` if you use the Firebase CLI). It restricts each user to reading/writing only their own document.
5. **Project settings > General > Your apps** → add a Web app, copy the config values.
6. Copy `.env.example` to `.env` and fill in those values:

```bash
cp .env.example .env
```

Restart `npm run dev` after creating/editing `.env` (Vite only reads it at server start).

Each signed-in user's caught collectibles are stored at `users/{uid}` as a
`caughtIds` string array, kept in sync live via a Firestore listener.

## The master collectibles data

`src/data/collectibles.json` is the single source of truth for every bug,
fish, and sea creature — price, location, size, and, per hemisphere, which
months and hours it's catchable in (some species have two catch windows a
day, e.g. `4 AM–8 AM & 4 PM–7 PM`).

It's generated from the community-maintained ["Data Spreadsheet for Animal
Crossing New Horizons"](https://docs.google.com/spreadsheets/d/13d_LAJPlxMa_DubPTuirkIV4DERBMXbrWQsmSh8ReK4)
(Insects / Fish / Sea Creatures tabs). To regenerate it (e.g. after the sheet
gets updated for a new game update):

```bash
npm run build:data
```

This re-downloads the sheet as CSV and re-normalizes it — nothing in the app
talks to Google Sheets at runtime.

## How "best time to time-travel" is calculated

`src/lib/time.js` builds a 12-month × 24-hour grid of how many species are
catchable at each moment, for the selected hemisphere, excluding whatever the
current user has already marked as caught (or nothing, if signed out — then
it's just the moment with the most total species catchable). It picks the
grid cell(s) with the highest count, and among ties prefers the longest
contiguous window. Recomputes automatically whenever hemisphere, sign-in
state, or your caught list changes.

## Project structure

```
scripts/fetch-collectibles.mjs   data pipeline (Google Sheet -> collectibles.json)
src/data/collectibles.json       master collectibles list (generated, committed)
src/lib/time.js                  best-time-to-travel calculation (pure functions)
src/lib/firebase.js              Firebase app/auth/db init
src/stores/                      Pinia stores: auth, hemisphere, collectibles
src/views/                       HomeView, BrowseView, LoginView, MyCollectionView
src/components/                  NavBar, HemisphereToggle, BestTimeBanner, CollectibleCard
```

## Known limitations

- No collectible artwork/icons — the source spreadsheet's image columns don't
  export via CSV. Cards show a category emoji instead.
- Best-time picks a single top window; it doesn't yet account for cases where
  a slightly-lower-count time might be more convenient (e.g. avoiding a
  wraparound-midnight window).
