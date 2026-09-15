import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-subtle text-ink-2 ring-line',
        brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
        accent: 'bg-accent-50 text-accent-700 ring-accent-600/15',
        success: 'bg-success-bg text-success ring-success/20',
        warning: 'bg-warning-bg text-warning ring-warning/20',
        danger: 'bg-danger-bg text-danger ring-danger/20',
        info: 'bg-info-bg text-info ring-info/20',
        outline: 'bg-transparent text-ink-2 ring-line-strong',
      },
      size: {
        sm: 'h-5 px-1.5 text-[11px]',
        md: 'h-6 px-2 text-xs',
        lg: 'h-7 px-2.5 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />
}

export { badgeVariants }
