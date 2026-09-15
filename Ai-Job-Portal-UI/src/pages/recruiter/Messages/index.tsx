import { MessagesPage } from '@/features/messaging/MessagesPage'

/** R16 — recruiter side of the shared messaging surface. */
export function Component() {
  return <MessagesPage persona="recruiter" />
}
Component.displayName = 'RecruiterMessages'
