/**
 * The marketing shell width, in one place.
 *
 * 1320px left 300px of dead margin either side on a 1920 display. 1480 plus a
 * wider inner gutter brings that down to ~220 while keeping the page from
 * running edge to edge — text blocks inside carry their own `max-w-*`, so the
 * prose never spans the full width even where the grid does.
 */
export const SHELL = 'mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-12'
