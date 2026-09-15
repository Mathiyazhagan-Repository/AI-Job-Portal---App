import { NotificationsPage } from '@/features/notifications/NotificationsPage'

/** R17 — recruiter side of the shared notification centre. */
export function Component() {
  return <NotificationsPage persona="recruiter" />
}
Component.displayName = 'RecruiterNotifications'
