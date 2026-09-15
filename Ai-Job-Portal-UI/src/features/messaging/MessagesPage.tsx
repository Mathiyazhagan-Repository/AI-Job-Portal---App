import * as React from 'react'
import { Link } from 'react-router'
import {
  Send, Paperclip, Flag, ShieldAlert, ArrowLeft, MessageSquare, Info, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useIsMobile } from '@/hooks'
import { type Conversation } from '@/data/console'
import { useApplicationStore } from '@/store/applications'
import { jobById, companyById } from '@/data/mock'
import { relativeTime, timeOfDay, shortDate } from '@/lib/format'
import { Avatar } from '@/components/ui/controls'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@/components/ui/overlay'
import { EmptyState } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { StagePill } from '@/components/brand'
import { applications } from '@/data/mock'
import { useProfileStore } from '@/store/profile'
import { buildProfilePdf } from '@/lib/profilePdf'

/**
 * C13 / R16 — Messaging (PRD Part 26).
 *
 * One implementation, two personas. The rule the UI makes visible:
 * a conversation is always tied to a specific application, a recruiter
 * starts it, and a candidate can only reply — no cold-messaging.
 *
 * Per direction: A three panes · B two panes with context in a popover
 * · C full-width thread with a collapsible list.
 */

export function MessagesPage({ persona }: { persona: 'candidate' | 'recruiter' }) {
  const variant = useVariant()
  const isMobile = useIsMobile()
  const { conversations } = useApplicationStore()
  const [activeId, setActiveId] = React.useState(conversations[0].id)
  const [draft, setDraft] = React.useState('')
  const [sent, setSent] = React.useState<Record<string, string[]>>({})
  const [showList, setShowList] = React.useState(true)

  const active = conversations.find((c) => c.id === activeId)!
  const extra = sent[active.id] ?? []

  const send = () => {
    if (!draft.trim()) return
    setSent((s) => ({ ...s, [active.id]: [...(s[active.id] ?? []), draft.trim()] }))
    setDraft('')
  }

  const list = (
    <ConversationList
      persona={persona}
      conversations={conversations}
      activeId={activeId}
      onSelect={(id) => {
        setActiveId(id)
        if (isMobile || variant === 'c') setShowList(false)
      }}
    />
  )

  const thread = (
    <Thread
      conversation={active}
      persona={persona}
      extra={extra}
      draft={draft}
      setDraft={setDraft}
      onSend={send}
      onBack={isMobile || variant === 'c' ? () => setShowList(true) : undefined}
      showContextInline={variant !== 'a'}
    />
  )

  const context = <ContextRail conversation={active} persona={persona} />

  /* ── mobile: one pane at a time ── */
  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-4rem-5rem)]">
        {showList ? <div className="h-full overflow-y-auto">{list}</div> : thread}
      </div>
    )
  }

  /* ── C · full-width thread, collapsible list ── */
  if (variant === 'c') {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="font-display tracking-tight mb-6 text-display-2 font-semibold text-ink">
          Messages
        </h1>
        {showList ? (
          <Reveal className="rounded-v bg-paper p-4 shadow-v-card">{list}</Reveal>
        ) : (
          <Reveal className="h-[70dvh] overflow-hidden rounded-v bg-paper shadow-lg">{thread}</Reveal>
        )}
      </div>
    )
  }

  /* ── B · two panes, context in a popover ── */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
        <h1 className="mb-2 border-b border-line pb-2 text-base font-semibold text-ink">Messages</h1>
        <div className="grid h-[calc(100dvh-9rem)] grid-cols-[280px_1fr] overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
          <div className="overflow-y-auto border-r border-line">{list}</div>
          {thread}
        </div>
      </div>
    )
  }

  /* ── A · three panes ── */
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-ink">Messages</h1>
      <div className="grid h-[calc(100dvh-11rem)] grid-cols-[300px_1fr_280px] overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
        <div className="overflow-y-auto border-r border-line">{list}</div>
        {thread}
        <div className="overflow-y-auto border-l border-line">{context}</div>
      </div>
    </div>
  )
}

/* ══════════════════ list ══════════════════ */

function ConversationList({
  persona,
  conversations,
  activeId,
  onSelect,
}: {
  persona: 'candidate' | 'recruiter'
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <Stagger whenVisible={false}>
      {conversations.map((c) => {
        const last = c.messages.at(-1)!
        const who = persona === 'candidate' ? c.recruiterName : c.candidateName
        const active = c.id === activeId
        return (
          <StaggerItem key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'relative flex w-full items-start gap-3 border-b border-line p-3 text-left transition-v',
                'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:transition-v',
                active ? 'bg-brand-50 before:bg-brand-600' : 'hover:bg-hover before:bg-transparent',
              )}
            >
              <Avatar name={who} id={c.id} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium text-ink">{who}</span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-3">
                    {relativeTime(last.at)}
                  </span>
                </span>
                <span className="block truncate text-xs text-ink-3">{c.company}</span>
                <span className="mt-1 block truncate text-sm text-ink-2">{last.body}</span>
              </span>
              {c.unread > 0 && (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-600" aria-label={`${c.unread} unread`} />
              )}
            </button>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}

/* ══════════════════ thread ══════════════════ */

function Thread({
  conversation,
  persona,
  extra,
  draft,
  setDraft,
  onSend,
  onBack,
  showContextInline,
}: {
  conversation: Conversation
  persona: 'candidate' | 'recruiter'
  extra: string[]
  draft: string
  setDraft: (v: string) => void
  onSend: () => void
  onBack?: () => void
  showContextInline?: boolean
}) {
  const job = jobById(conversation.jobId)
  const who = persona === 'candidate' ? conversation.recruiterName : conversation.candidateName
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [extra.length, conversation.id])

  return (
    <div className="flex min-h-0 flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line p-3">
        {onBack && (
          <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <Avatar name={who} id={conversation.id} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{who}</p>
          <p className="truncate text-xs text-ink-3">
            {conversation.company} · {job?.title}
          </p>
        </div>

        {showContextInline && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Conversation context">
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <ContextRail conversation={conversation} persona={persona} compact />
            </PopoverContent>
          </Popover>
        )}
        <Tooltip content="Report this conversation">
          <Button variant="ghost" size="icon-sm" aria-label="Report conversation">
            <Flag className="size-4" />
          </Button>
        </Tooltip>
      </div>

      {/* messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((m) => (
          <Bubble
            key={m.id}
            mine={m.from === persona}
            body={m.body}
            at={m.at}
            read={Boolean(m.readAt)}
            attachment={m.attachment}
          />
        ))}
        {extra.map((body, i) => (
          <Bubble key={`x${i}`} mine body={body} at={new Date().toISOString()} read={false} />
        ))}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-line p-3">
        {persona === 'candidate' && (
          <p className="mb-2 flex items-start gap-1.5 text-[11px] leading-snug text-ink-3">
            <ShieldAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
            You can reply to recruiters who have contacted you about an application. Candidates
            cannot start conversations with recruiters they have not applied to.
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend()
            }}
            placeholder="Write a reply…  (⌘↵ to send)"
            aria-label="Message"
            className="min-h-0 resize-none"
          />
          <Button variant="ghost" size="icon" aria-label="Attach a file">
            <Paperclip className="size-4" />
          </Button>
          <Button onClick={onSend} disabled={!draft.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Bubble({
  mine,
  body,
  at,
  read,
  attachment,
}: {
  mine: boolean
  body: string
  at: string
  read: boolean
  attachment?: { type: 'resume'; fileName: string }
}) {
  const profile = useProfileStore()

  const openResume = async () => {
    const tab = window.open('', '_blank')
    if (!tab) return
    const pdf = await buildProfilePdf(profile.data, { filledFrom: profile.filledFrom?.label })
    const url = pdf.output('bloburl')
    tab.location.href = url.toString()
  }

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%]', mine && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-v px-3.5 py-2.5 text-left text-sm leading-relaxed',
            mine
              ? 'bg-brand-600 text-white'
              : 'border-[length:var(--v-card-border)] border-line bg-subtle text-ink-2',
          )}
        >
          {body}
          {attachment?.type === 'resume' && (
            <button
              type="button"
              onClick={openResume}
              className={cn(
                'mt-3 flex w-full items-center gap-2 rounded-v-control border px-2.5 py-2 text-left text-xs transition-v',
                mine
                  ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  : 'border-line bg-paper text-brand-600 hover:bg-hover',
              )}
            >
              <FileText className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
              <span className="shrink-0 font-semibold">Open</span>
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-ink-3">
          {timeOfDay(at)}
          {mine && (read ? ' · read' : ' · sent')}
        </p>
      </div>
    </div>
  )
}

/* ══════════════════ context ══════════════════ */

function ContextRail({
  conversation,
  persona,
  compact,
}: {
  conversation: Conversation
  persona: 'candidate' | 'recruiter'
  compact?: boolean
}) {
  const job = jobById(conversation.jobId)
  const company = job ? companyById(job.companyId) : undefined
  const app = applications.find((a) => a.jobId === conversation.jobId)

  return (
    <div className={cn('space-y-4', compact ? 'p-3' : 'p-4')}>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">
          What this is about
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Every conversation on Kairo is attached to one application, so context is never lost and
          the thread can be audited later.
        </p>
      </div>

      {job && (
        <div className="rounded-v border border-line p-3">
          <p className="font-medium text-ink">{job.title}</p>
          <p className="text-sm text-ink-3">
            {company?.name} · {job.location}
          </p>
          {app && (
            <div className="mt-2">
              <StagePill stage={app.stage} size="sm" />
            </div>
          )}
          <Link
            to={persona === 'candidate' ? '/candidate/applications' : `/recruiter/jobs/${job.id}/applicants`}
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            {persona === 'candidate' ? 'View my application' : 'Open in triage'}
          </Link>
        </div>
      )}

      <dl className="space-y-2 text-sm">
        {[
          ['Started', shortDate(conversation.messages[0].at)],
          ['Messages', String(conversation.messages.length)],
          ['Started by', conversation.recruiterName + ' (recruiter)'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {persona === 'recruiter' && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Quick replies
          </h2>
          <div className="space-y-1.5">
            {['Invite to interview', 'Request availability', 'Share assessment link'].map((t) => (
              <button
                key={t}
                type="button"
                className="w-full rounded-v-control border border-line px-2.5 py-1.5 text-left text-sm text-ink-2 transition-v hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-ink-3">
        Full history is retained for audit. Reporting or blocking is available from the flag icon.
      </p>
    </div>
  )
}
