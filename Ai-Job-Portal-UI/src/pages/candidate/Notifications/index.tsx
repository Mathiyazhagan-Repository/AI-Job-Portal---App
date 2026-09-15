import { NotificationsPage } from '@/features/notifications/NotificationsPage'

/** C14 — candidate side of the shared notification centre. */
export function Component() {
  return <NotificationsPage persona="candidate" />
}
Component.displayName = 'CandidateNotifications'
