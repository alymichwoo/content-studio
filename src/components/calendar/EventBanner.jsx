import { SCHEDULE_TYPES_BY_VALUE } from '../../lib/constants'

export default function EventBanner({ event, showTitle }) {
  const typeMeta = SCHEDULE_TYPES_BY_VALUE[event.type]
  const color = typeMeta?.color ?? '#8E8E93'

  return (
    <div
      className="w-full truncate rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream"
      style={{ backgroundColor: `${color}CC` }}
      title={event.title}
    >
      {showTitle ? event.title : '\u00A0'}
    </div>
  )
}
