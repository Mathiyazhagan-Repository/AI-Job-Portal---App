import * as React from 'react'
import { ArrowUpDown, Search, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/controls'
import { EmptyState } from './EmptyState'
import { Stagger, StaggerItem } from '@/components/motion'
import { useVariant } from '@/hooks'

/**
 * One DataTable, every table in the product (DESIGN.md §9.5).
 * The recruiter job list, admin users, audit log and payments differ
 * only in a `columns` array.
 *
 * Below `md` it renders as stacked cards rather than a scrolling table
 * — PRD Part 41's "tables convert to stacked card lists".
 */

export interface Column<T> {
  key: string
  header: string
  /** Column is hidden below this breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'right' | 'center'
  width?: string
  sortable?: boolean
  sortValue?: (row: T) => string | number
  cell: (row: T) => React.ReactNode
  /** Shown as the card title on mobile instead of a label/value pair. */
  primary?: boolean
}

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Enables the search box; return the haystack for a row. */
  searchable?: (row: T) => string
  searchPlaceholder?: string
  /** Enables checkbox selection and the bulk bar. */
  selectable?: boolean
  bulkActions?: (selected: string[], clear: () => void) => React.ReactNode
  onRowClick?: (row: T) => void
  activeKey?: string
  /** Rendered under a row when it is the active one. */
  expanded?: (row: T) => React.ReactNode
  empty?: { title: string; description?: string; action?: { label: string; onClick?: () => void } }
  toolbar?: React.ReactNode
  className?: string
  dense?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchable,
  searchPlaceholder = 'Search…',
  selectable,
  bulkActions,
  onRowClick,
  activeKey,
  expanded,
  empty,
  toolbar,
  className,
  dense,
}: DataTableProps<T>) {
  const variant = useVariant()
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const isDense = dense ?? variant === 'b'

  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => searchable(r).toLowerCase().includes(q))
  }, [rows, query, searchable])

  const sorted = React.useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return filtered
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort, columns])

  const allKeys = sorted.map(rowKey)
  const allSelected = allKeys.length > 0 && selected.length === allKeys.length

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )

  const hideClass = (c: Column<T>) =>
    c.hideBelow === 'sm' ? 'hidden sm:table-cell'
      : c.hideBelow === 'md' ? 'hidden md:table-cell'
        : c.hideBelow === 'lg' ? 'hidden lg:table-cell'
          : ''

  return (
    <div className={cn('min-w-0', className)}>
      {(searchable || toolbar) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-56 flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
          <p className="ml-auto text-sm text-ink-3" role="status">
            <span className="font-mono tnum font-medium text-ink">{sorted.length}</span>
            {sorted.length === rows.length ? '' : ` of ${rows.length}`}
          </p>
        </div>
      )}

      {selectable && selected.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-v border border-brand-200 bg-brand-50 px-3 py-2">
          <span className="text-sm font-medium text-brand-800">
            {selected.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions?.(selected, () => setSelected([]))}
          </div>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto text-xs font-medium text-brand-700 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={empty?.title ?? 'Nothing here'}
          description={empty?.description}
          action={empty?.action}
          compact
        />
      ) : (
        <>
          {/* ── table, md and up ── */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {selectable && (
                    <th scope="col" className="w-9 py-2 pl-1">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(v) => setSelected(v ? allKeys : [])}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      className={cn(
                        'py-2 text-xs font-medium text-ink-3',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        hideClass(c),
                      )}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            'inline-flex items-center gap-1 transition-v hover:text-ink',
                            sort?.key === c.key && 'text-ink',
                          )}
                        >
                          {c.header}
                          <ArrowUpDown className="size-3" aria-hidden />
                          <span className="sr-only">
                            {sort?.key === c.key ? `sorted ${sort.dir}ending` : 'sort'}
                          </span>
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <Stagger as="tbody" className="divide-y divide-line" whenVisible={false}>
                {sorted.map((row) => {
                  const key = rowKey(row)
                  const active = activeKey === key
                  return (
                    <React.Fragment key={key}>
                      <StaggerItem
                        as="tr"
                        className={cn(
                          'transition-v',
                          onRowClick && 'cursor-pointer',
                          active ? 'bg-brand-50' : 'hover:bg-hover',
                        )}
                      >
                        {selectable && (
                          <td className="w-9 pl-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.includes(key)}
                              onCheckedChange={(v) =>
                                setSelected((s) => (v ? [...s, key] : s.filter((x) => x !== key)))
                              }
                              aria-label={`Select row ${key}`}
                            />
                          </td>
                        )}
                        {columns.map((c) => (
                          <td
                            key={c.key}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={cn(
                              isDense ? 'py-1.5' : 'py-3',
                              c.align === 'right' && 'text-right',
                              c.align === 'center' && 'text-center',
                              hideClass(c),
                            )}
                          >
                            {c.cell(row)}
                          </td>
                        ))}
                      </StaggerItem>
                      {active && expanded && (
                        <tr>
                          <td colSpan={columns.length + (selectable ? 1 : 0)} className="bg-canvas p-3">
                            {expanded(row)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </Stagger>
            </table>
          </div>

          {/* ── stacked cards, below md (PRD Part 41) ── */}
          <Stagger className="space-y-2 md:hidden" whenVisible={false}>
            {sorted.map((row) => {
              const key = rowKey(row)
              const primary = columns.find((c) => c.primary) ?? columns[0]
              const rest = columns.filter((c) => c !== primary)
              return (
                <StaggerItem key={key}>
                  <div
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-3 shadow-v-card',
                      onRowClick && 'cursor-pointer',
                      activeKey === key && 'border-brand-500',
                    )}
                  >
                    <div className="mb-2 font-medium text-ink">{primary.cell(row)}</div>
                    <dl className="space-y-1">
                      {rest.map((c) => (
                        <div key={c.key} className="flex justify-between gap-3 text-sm">
                          <dt className="text-ink-3">{c.header}</dt>
                          <dd className="text-right">{c.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </StaggerItem>
              )
            })}
          </Stagger>
        </>
      )}
    </div>
  )
}
