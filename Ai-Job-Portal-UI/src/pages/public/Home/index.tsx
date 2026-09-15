import { useVariant } from '@/hooks'
import HomeA from './Home.a'
import HomeB from './Home.b'
import HomeC from './Home.c'

/**
 * The variant switch — identical shape on every page (DESIGN.md §6.6b).
 * Data is resolved HERE and passed down, so the three views are pure
 * presentation and can never diverge in behaviour.
 */
const VIEWS = { a: HomeA, b: HomeB, c: HomeC }

export function Component() {
  const variant = useVariant()
  const View = VIEWS[variant] ?? VIEWS.a
  return <View />
}

Component.displayName = 'HomePage'
