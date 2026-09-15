/**
 * Photography for the marketing pages.
 *
 * DESIGN.md §5.3 originally forbade photography outright ("company logos,
 * prism artwork and data are the only imagery"). That was reversed for the
 * public pages on request — the console keeps the no-photo rule, because a
 * face on a triage row is exactly the bias signal PRD Part 16.7 is trying to
 * keep out of hiring decisions. Photos appear on `/`, `/jobs`, `/companies`
 * and `/pricing` only, and never next to a candidate's score.
 *
 * Every id is pinned rather than using Unsplash's random `/random` endpoint,
 * so the page composes the same way on every load and can be reviewed.
 *
 * `/login` and `/register` were added later: they sit outside the console, the
 * photo lives on the marketing panel beside the form, and nobody is being
 * scored on that screen — so the no-photo rule still holds where it matters.
 */

const BASE = 'https://images.unsplash.com/'

export interface Photo {
  id: string
  /** Alt text is written per use site — this is the fallback description. */
  alt: string
}

export const PHOTOS = {
  /* hero — the person the product is for */
  heroMain: { id: 'photo-1573496359142-b8d87734a5a2', alt: 'An engineer at her desk, mid-conversation' },
  heroAlt: { id: 'photo-1580489944761-15a19d654956', alt: 'A candidate reviewing her application' },

  /* feature rows */
  featureA: { id: 'photo-1522071820081-009f0129c71c', alt: 'A hiring team reviewing a shortlist together' },
  featureB: { id: 'photo-1600880292203-757bb62b4baf', alt: 'Two people in an interview conversation' },
  featureC: { id: 'photo-1497366754035-f200968a6e72', alt: 'An open-plan office at work' },

  /* auth split-screen panel — tall crops, copy sits over the lower third */
  authSignIn: {
    id: 'photo-1551434678-e076c223a692',
    alt: 'Two engineers working side by side at a bright desk',
  },
  authJoin: {
    id: 'photo-1522071820081-009f0129c71c',
    alt: 'A hiring team working through candidates together',
  },

  /* faces for quotes */
  faceA: { id: 'photo-1507003211169-0a1dd7228f2d', alt: '' },
  faceB: { id: 'photo-1494790108377-be9c29b29330', alt: '' },
  faceC: { id: 'photo-1519085360753-af0119f7cbe7', alt: '' },

  /* category tiles */
  catEng: { id: 'photo-1461749280684-dccba630e2f6', alt: 'Code on a screen' },
  catDesign: { id: 'photo-1561070791-2526d30994b5', alt: 'A design workspace' },
  catData: { id: 'photo-1551288049-bebda4e38f71', alt: 'A dashboard of charts' },
  catProduct: { id: 'photo-1531403009284-440f080d1e12', alt: 'A product workshop wall' },
  catMkt: { id: 'photo-1552664730-d307ca884978', alt: 'A team planning session' },
  catOps: { id: 'photo-1454165804606-c3d57bc86b40', alt: 'A team meeting around a table' },
} satisfies Record<string, Photo>

export type PhotoKey = keyof typeof PHOTOS

/**
 * Build a sized, cropped URL. Width is the *rendered* width; the `dpr`
 * parameter lets Unsplash serve the retina variant without us shipping a
 * second URL, and `q=70` is the point where the artefacts stop being visible
 * at these sizes.
 */
export function photo(
  key: PhotoKey,
  {
    w = 800,
    h,
    dpr = 2,
    crop,
  }: { w?: number; h?: number; dpr?: number; crop?: 'faces' | 'entropy' } = {},
) {
  const p = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(w),
    q: '70',
    dpr: String(dpr),
  })
  if (h) p.set('h', String(h))
  // Ask the CDN to pick the region rather than taking a centre crop. A
  // portrait source dropped into a wide box otherwise scales to the box width
  // and zooms into whatever happens to sit dead centre — usually a chin.
  if (crop) p.set('crop', crop === 'faces' ? 'faces,entropy' : 'entropy')
  return `${BASE}${PHOTOS[key].id}?${p}`
}

/** A low-cost blurred placeholder of the same frame, for the loading state. */
export function photoBlur(key: PhotoKey) {
  return `${BASE}${PHOTOS[key].id}?auto=format&fit=crop&w=24&q=20&blur=200`
}
