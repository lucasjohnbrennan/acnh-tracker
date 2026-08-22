// K.K. Slider's five mood prompts, verbatim from the game's dialogue —
// punctuation included, since that's how they read on screen and how they
// arrive in the source spreadsheet's notes column.
//
// Picking a mood before requesting a song is the only lever you have over
// which one he plays, so it's the axis the Music page filters on. Shared here
// because both the filter pills and the card badge need the same emoji.
export const MOOD_ICONS = {
  'I feel good!': '😄',
  'Laid-back.': '😌',
  'A little blue...': '😢',
  'A little grumpy...': '😠',
  "It's hard to say.": '🤔',
}

export const MOOD_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(MOOD_ICONS).map(([mood, icon]) => ({ value: mood, label: `${icon} ${mood}` })),
  // The handful of songs no mood will ever produce: the request-only hidden
  // tracks, and the two K.K. hands you just for turning up.
  { value: 'special', label: '⭐ Special' },
]
