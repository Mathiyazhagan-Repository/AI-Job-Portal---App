import { MessagesPage } from '@/features/messaging/MessagesPage'

/** C13 — candidate side of the shared messaging surface. */
export function Component() {
  return <MessagesPage persona="candidate" />
}
Component.displayName = 'CandidateMessages'
