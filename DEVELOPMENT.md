# Development

Setup, deployment, and internals — see [README.md](README.md) for what the
app actually does.

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

## Deploying to GitHub Pages (free)

Already wired up via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) —
every push to `main` builds the app and publishes it to
`https://<your-username>.github.io/acnh-tracker/`. One-time setup:

1. **Settings > Pages** → set **Source** to **GitHub Actions**.
2. **Settings > Secrets and variables > Actions** → add a repository secret for
   each value in your `.env` file (`VITE_FIREBASE_API_KEY`,
   `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
   `VITE_FIREBASE_APP_ID`) — the workflow injects them at build time since
   `.env` itself isn't committed.
3. In the Firebase console, **Authentication > Settings > Authorized domains**
   → add `<your-username>.github.io` (required for sign-in to work once the
   site isn't on `localhost`).
4. Push to `main`. Check the **Actions** tab for build/deploy progress; the
   Pages URL appears in the deploy job once it finishes.

Two build details that make a Vite SPA work on Pages: `vite.config.js` sets
`base: '/acnh-tracker/'` for production builds (Pages serves the repo under
that subpath, not domain root), and a `postbuild` script copies `index.html`
to `404.html` so that direct links/refreshes on client-side routes (like
`/critters`) don't 404 — GitHub Pages serves `404.html` for any unmatched path,
which just re-boots the app and lets vue-router take over.

## The master collectibles data

`src/data/collectibles.json` is the single source of truth for all 423
collectibles across six categories: `bug`, `fish`, `sea`, `fossil`, `art`,
and `music`.

Critters carry price, location, size, and, per hemisphere, which months and
hours they're catchable in (some species have two catch windows a day, e.g.
`4 AM–8 AM & 4 PM–7 PM`). **Fossils, art and music deliberately have no
`availability` field at all** — that absence is the signal the whole app runs
on. `timeBased` in the collectibles store filters on it, which is what keeps
them off the Critters page and the best-time calculation, and on their own
pages instead.

There's a second, independent axis: **is it a museum exhibit?** Songs are the
only thing you collect that Blathers won't take, so music rows — and only
music rows — carry `museum: false`. `museumItems` in the store filters with
`c.museum !== false` rather than a truthy test, deliberately: every other
category omits the key entirely, and a truthy test would silently exclude all
316 of them. That one computed is what every completion number hangs off —
the My Collection bar, the home page tiles, and `museumComplete` — so songs
can never nudge a donation count.

It's generated from the community-maintained ["Data Spreadsheet for Animal
Crossing New Horizons"](https://docs.google.com/spreadsheets/d/13d_LAJPlxMa_DubPTuirkIV4DERBMXbrWQsmSh8ReK4)
(Insects / Fish / Sea Creatures / Fossils / Artwork / Music tabs). To regenerate it
(e.g. after the sheet gets updated for a new game update):

```bash
npm run build:data
```

This re-downloads the sheet as CSV and re-normalizes it — nothing in the app
talks to Google Sheets at runtime.

One wrinkle worth knowing about the Artwork tab: it has **two rows per piece**
when a counterfeit exists, a `Genuine: Yes` row and a `Genuine: No` row
sharing the same name. The pipeline groups by name and keeps only the genuine
one, since the fake isn't something you collect — it's a trap to avoid. What
survives is a `hasFake: true` flag on the real piece, which is what drives the
*Fake exists* badge. That's why the art count is 43 and not 70.

Each entry also gets an `iconUrl` built against the same CDN the sheet's own
`=IMAGE()` cells point to — `nh-cdn.catalogue.ac/MenuIcon/{filename}.png` for
critters, `/FtrIcon/{filename}.png` for fossils, art and music, all of which
are furniture items in the game's data. (The CDN also serves the big album
covers at `/Audio/{filename}.png`, but at ~470 KB apiece against ~20 KB for
the framed-record icon, a 107-card grid isn't the place for them.)
`CollectibleCard` falls back to a category emoji if an icon ever 404s.

## Redd's real-vs-fake art tells

`src/data/art-fakes.json` maps a collectible id to `{ fake, real, also? }` —
what the forgery gets wrong, what the genuine looks like, and an optional note
for the three pieces (Graceful, Scary, Wistful) that have a *second* forgery
variant. `CollectibleCard` renders it in the popover behind the *Fake exists*
badge.

It's hand-maintained, adapted from [Animal Crossing World's cheat
sheet](https://animalcrossingworld.com/guides/new-horizons/jolly-redds-art-real-genuine-vs-fake-forgery-cheat-sheet/),
and lives in its own file precisely so `npm run build:data` can regenerate
`collectibles.json` without clobbering it. Its 27 keys must line up with the
art entries flagged `hasFake` — if you add or rename a piece, check both:

```bash
node -e "const d=require('./src/data/collectibles.json'),f=require('./src/data/art-fakes.json');const ids=d.filter(c=>c.hasFake).map(c=>c.id);console.log('missing:',ids.filter(i=>!f[i]),'orphans:',Object.keys(f).filter(k=>!ids.includes(k)))"
```

A piece flagged `hasFake` with no entry still gets a badge — it just falls
back to generic "compare it carefully" wording rather than breaking.

## K.K. Slider's songs

The Music tab of the same spreadsheet lists 110 rows, but only **107** are
collectibles. Three of them (`Hazure01`–`03`) are the jingles K.K. plays when
you request something he doesn't know; the sheet's own notes say they don't
give a take-home track, so `normalizeMusicRow` drops anything matching
`does not give take-home track`. 107 is also exactly the real song count — 95
at launch plus 12 added in 2.0.0, which is why entries keep a `versionAdded`
for the *Update 2.0.0* badge.

No `price` field, on purpose: every single song is 3,200 bells to buy and 800
to sell, so the number distinguishes nothing. What's actually useful is where
a record comes from, which is split across three fields:

- `mood` — pulled out of the sheet's prose notes (`Possible song K.K. will
  play when choosing "Laid-back." as your mood`) by `MOOD_RE`. Picking a mood
  before a request is the one lever you have over what he plays, so it's the
  axis the Music page filters on, and the five values are his dialogue options
  verbatim, punctuation included.
- `nookShopping` — whether it's in the Nook Shopping daily rotation, or only
  obtainable by asking K.K. for it directly.
- `sourceNotes` — the raw note, shown on the card only for the five songs with
  no mood (three request-only hidden tracks, plus the two K.K. hands you for
  turning up, one of them birthday-gated). Mood songs show `source` instead,
  since their note says nothing the mood badge doesn't.

`src/lib/music.js` holds the mood → emoji map, shared because both the filter
pills in `MusicView` and the badge in `CollectibleCard` need the same one.

## How "best time to time-travel" is calculated

`src/lib/time.js` builds a 12-month × 24-hour grid of how many species are
catchable at each moment, for the selected hemisphere, excluding whatever the
current user has already marked as caught (or nothing, if signed out — then
it's just the moment with the most total species catchable). It picks the
grid cell(s) with the highest count, and among ties prefers the longest
contiguous window. Recomputes automatically whenever hemisphere, sign-in
state, or your caught list changes.

## The museum-complete celebration

`MuseumCompleteCelebration` is mounted once in `App.vue` and fires confetti
when `museumComplete` in the collectibles store flips true — every collectible
donated, artwork included. Songs are not included: they're not exhibits, and
gating the confetti on them would mean a finished museum went uncelebrated
over a record you never bought.

The tricky part is *when* it's allowed to fire. `caughtIds` starts as an empty
set and only fills in once Firestore's snapshot arrives, so a player who has
already finished looks, for one tick on every single page load, like someone
who just that second completed the museum. The store therefore exposes a
`hydrated` flag (set in the snapshot callback, cleared on sign-out), and the
component only celebrates on a false→true transition where `hydrated` was
*already* true beforehand. Net effect: it fires at the moment you finish, and
never on a reload.

The confetti is a plain `<canvas>` with hand-rolled physics — two corner
cannons plus a few seconds of drift, no dependency. `prefers-reduced-motion`
skips the confetti and the card animations entirely, leaving just the message.

## Project structure

```
scripts/fetch-collectibles.mjs   data pipeline (Google Sheet -> collectibles.json)
src/data/collectibles.json       master collectibles list (generated, committed)
src/data/art-fakes.json          real-vs-fake tells for Redd's forgeries (hand-written)
src/lib/time.js                  best-time-to-travel calculation (pure functions)
src/lib/music.js                 K.K.'s five mood prompts + their emoji (shared)
src/lib/terms.js                 the verb each category uses (caught/donated/collected)
src/lib/firebase.js              Firebase app/auth/db init
src/stores/                      Pinia stores: auth, hemisphere, collectibles,
                                 critterFilters, fossilFilters, artFilters, musicFilters
src/views/                       HomeView, CrittersView, FossilsView, ArtView, MusicView,
                                 LoginView, MyCollectionView
src/components/                  NavBar, HemisphereToggle, BestTimeBanner, CollectibleCard,
                                 MuseumCompleteCelebration
```

Routes: `/` home, `/critters` time-dependent critters, `/fossils` fossils,
`/art` artwork, `/music` K.K. Slider's songs, `/collection` your collection
(auth-gated), `/login`. Two redirects keep old links working: `/browse` goes to
`/critters` (that page was called Browse until it picked up a name that says
what it lists), and `/artifacts` goes to `/fossils` (fossils and art shared one
page before they got filters of their own).

Fossils and art are separate pages because they filter on nothing in common: a
fossil is only ever "do I still owe Blathers this one?", while artwork splits
into paintings vs statues and into pieces Redd can forge vs pieces he can't.
`artType` on each art entry is derived in the fetch script from the game's own
asset naming (`FtrSculpture…` vs `FtrArt…`).

Each category also has its own verb — critters are **caught**, fossils and art
are **donated**, songs are **collected** — which is what `src/lib/terms.js`
centralizes so the card button, the "hide" checkbox and the My Collection empty
states never disagree.

The four filter stores exist so search/category/month/hour/mood selections
survive navigating away and back. They're also how the home page's best-time banner
deep-links into Critters: it sets the month and hour range, then pushes the
route.

**Stack:** Vue 3 (Composition API, `<script setup>`) + Vite + Tailwind CSS,
Pinia for state, vue-router. No backend server — Firebase Auth handles sign-in
and Firestore stores each user's caught collectibles.

## Known limitations

- Best-time picks a single top window; it doesn't yet account for cases where
  a slightly-lower-count time might be more convenient (e.g. avoiding a
  wraparound-midnight window).
- Icons are hotlinked from a third-party CDN (`nh-cdn.catalogue.ac`), not
  self-hosted — if that CDN ever goes away, icons fall back to a category
  emoji rather than breaking.
- The art fake tells are hand-written, not generated, so they won't pick up
  changes if Nintendo ever alters a piece — unlike `collectibles.json`, which
  is one `npm run build:data` away from current.
- The tells are text-only. Some are easy to act on ("the stone is blue"),
  others really want the side-by-side image the tooltip links out to.
