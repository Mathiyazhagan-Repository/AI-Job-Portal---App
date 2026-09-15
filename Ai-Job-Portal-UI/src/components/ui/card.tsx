import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Shape comes from the variant layer:
 *   A → 12px radius, hairline border, subtle shadow
 *   B → 6px radius, hairline border, NO shadow
 *   C → 20px radius, NO border, lifted shadow
 * One component, three directions (DESIGN.md §6.6a).
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-paper rounded-v shadow-v-card',
        'border-[length:var(--v-card-border)] border-line',
        'transition-v',
        interactive && 'hover-lift cursor-pointer',
        className,
      )}
      {...props}
    />
))
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-v-card pb-3', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('font-semibold text-ink tracking-tight', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-ink-3', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-v-card pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 p-v-card pt-0', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'
