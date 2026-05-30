import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Button from '../ui/Button'
import { iconButtonClass } from '../ui/iconButtonStyles'

export default function CalendarHeader({ currentMonth, onPrev, onToday, onNext, onAddEvent }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-black uppercase tracking-tighter text-charcoal">
        {format(currentMonth, 'MMMM yyyy')}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className={`${iconButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral`}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
          <button
            type="button"
            onClick={onNext}
            className={`${iconButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral`}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <Button size="sm" onClick={onAddEvent}>
          Add event
        </Button>
      </div>
    </div>
  )
}
