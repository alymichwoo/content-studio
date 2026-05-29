import Select from '../ui/Select'
import { PILLARS, PLATFORMS } from '../../lib/constants'

const ALL_OPTION = { value: null, label: 'All' }

export default function CalendarFilterBar({ platform, pillar, onPlatformChange, onPillarChange }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Select
        id="calendar-platform-filter"
        label="Platform"
        value={platform}
        onChange={onPlatformChange}
        options={[ALL_OPTION, ...PLATFORMS]}
        className="w-44"
      />
      <Select
        id="calendar-pillar-filter"
        label="Pillar"
        value={pillar}
        onChange={onPillarChange}
        options={[ALL_OPTION, ...PILLARS]}
        className="w-44"
      />
    </div>
  )
}
