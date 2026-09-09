// What you actually *do* with each kind of collectible. Critters get caught
// with a net or rod, museum pieces (fossils, artwork) get donated to Blathers,
// and K.K.'s records just get collected — he hands them over and the museum
// never sees them.
//
// Shared so the card button, the "hide" checkboxes and the empty states all
// say the same word for the same thing.
const ACTION_VERBS = {
  bug: 'caught',
  fish: 'caught',
  sea: 'caught',
  fossil: 'donated',
  art: 'donated',
  music: 'collected',
}

export function actionVerb(category) {
  return ACTION_VERBS[category] ?? 'caught'
}

export function actionVerbTitle(category) {
  const verb = actionVerb(category)
  return verb[0].toUpperCase() + verb.slice(1)
}
