/** Build a value → item lookup map from a constants array. */
function toLookupMap(items) {
  return Object.fromEntries(items.map((item) => [item.value, item]))
}

// pillar enum — colors match brand palette in project rules
export const PILLARS = [
  { value: 'train', label: 'Train', color: '#378ADD' },
  { value: 'live', label: 'Live', color: '#D4537E' },
  { value: 'think', label: 'Think', color: '#7F77DD' },
  { value: 'feel', label: 'Feel', color: '#1D9E75' },
  { value: 'fuel', label: 'Fuel', color: '#EF9F27' },
]

export const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export const STATUSES = [
  { value: 'idea', label: 'Idea' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'ready', label: 'Ready' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'posted', label: 'Posted' },
]

export const CAPTION_LIMITS = {
  tiktok: 2200,
  instagram: 2200,
  linkedin: 3000,
}

export const POST_TYPES = [
  { value: 'reel', label: 'Reel' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'story', label: 'Story' },
  { value: 'static', label: 'Static' },
  { value: 'video', label: 'Video' },
]

export const SCHEDULE_TYPES = [
  { value: 'event', label: 'Event', color: '#378ADD' },
  { value: 'travel', label: 'Travel', color: '#7F77DD' },
  { value: 'competition', label: 'Competition', color: '#FF5733' },
  { value: 'launch', label: 'Launch', color: '#1D9E75' },
  { value: 'personal', label: 'Personal', color: '#EF9F27' },
]

export const PILLARS_BY_VALUE = toLookupMap(PILLARS)
export const PLATFORMS_BY_VALUE = toLookupMap(PLATFORMS)
export const STATUSES_BY_VALUE = toLookupMap(STATUSES)
export const POST_TYPES_BY_VALUE = toLookupMap(POST_TYPES)
export const SCHEDULE_TYPES_BY_VALUE = toLookupMap(SCHEDULE_TYPES)

/** Per-platform engagement rate formulas (computed in code, never stored). */
export const ENGAGEMENT_FORMULAS = {
  tiktok: (metrics) => {
    const { views = 0, likes = 0, comments = 0, shares = 0 } = metrics
    if (!views) return null
    return (likes + comments + shares) / views
  },
  instagram: (metrics) => {
    const { reach = 0, likes = 0, comments = 0, saves = 0 } = metrics
    if (!reach) return null
    return (likes + comments + saves) / reach
  },
  linkedin: (metrics) => {
    const { impressions = 0, reactions = 0, comments = 0, reposts = 0 } = metrics
    if (!impressions) return null
    return (reactions + comments + reposts) / impressions
  },
}
