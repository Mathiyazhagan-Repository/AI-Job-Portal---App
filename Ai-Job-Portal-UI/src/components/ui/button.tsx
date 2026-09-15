import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'rounded-v-control transition-v',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800',
        secondary:
          'bg-paper text-ink border border-line shadow-xs hover:bg-subtle hover:border-line-strong',
        ghost: 'text-ink-2 hover:bg-hover hover:text-ink',
        subtle: 'bg-subtle text-ink-2 hover:bg-hover hover:text-ink',
        danger: 'bg-danger text-white shadow-xs hover:brightness-95',
        'danger-ghost': 'text-danger hover:bg-danger-bg',
        link: 'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-9.5 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'size-9 p-0',
        'icon-sm': 'size-7 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
