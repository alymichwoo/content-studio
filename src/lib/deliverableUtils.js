import { PLATFORMS_BY_VALUE, POST_TYPES_BY_VALUE } from './constants'

/** Human-readable deliverable label, e.g. "Instagram reel ×3". */
export function formatDeliverableLabel(deliverable) {
  const platform = PLATFORMS_BY_VALUE[deliverable.platform]?.label ?? deliverable.platform
  const postType =
    POST_TYPES_BY_VALUE[deliverable.post_type]?.label?.toLowerCase() ?? deliverable.post_type
  return `${platform} ${postType} ×${deliverable.quantity_required}`
}

/** Count linked posts; posted status counts as delivered. */
export function computeDeliverableProgress(deliverable, linkedPosts = []) {
  const required = deliverable.quantity_required ?? 0
  const linked = linkedPosts.length
  const delivered = linkedPosts.filter((post) => post.status === 'posted').length
  const pending = linked - delivered
  const isOverdue =
    Boolean(deliverable.due_date) &&
    deliverable.due_date < new Date().toISOString().slice(0, 10) &&
    delivered < required

  return { required, linked, delivered, pending, isOverdue }
}
