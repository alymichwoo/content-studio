/** Icon-only actions — 44px tap targets on mobile, compact on desktop. */
export const iconButtonClass =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-slate transition hover:bg-charcoal/5 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral md:min-h-0 md:min-w-0 md:p-2'

export const iconButtonDangerClass = `${iconButtonClass} hover:bg-coral/10 hover:text-coral`

/** Sticky modal footer — pins actions on mobile while body scrolls. */
export const modalFooterClass =
  'sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-slate/20 bg-cream px-4 py-3 sm:-mx-6 sm:px-6 md:static md:mx-0 md:flex-row md:justify-end md:border-t md:px-0 md:pt-4'
