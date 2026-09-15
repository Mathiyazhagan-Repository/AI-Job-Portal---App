import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ══════════════════ Tabs ══════════════════ */

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { fill?: boolean }
>(({ className, fill, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 p-1 bg-subtle rounded-v-control',
      fill && 'w-full',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 flex-1 whitespace-nowrap',
      'h-7.5 px-3 text-sm font-medium rounded-[calc(var(--v-radius-control)-2px)]',
      'text-ink-3 transition-all duration-150',
      'hover:text-ink',
      'data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:shadow-xs',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = TabsPrimitive.Content

/** Underline tab style — used for in-page section tabs. */
export const TabsListUnderline = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('flex items-center gap-6 border-b border-line overflow-x-auto', className)}
    {...props}
  />
))
TabsListUnderline.displayName = 'TabsListUnderline'

export const TabsTriggerUnderline = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative py-3 text-sm font-medium whitespace-nowrap text-ink-3 transition-colors',
      'hover:text-ink',
      'data-[state=active]:text-ink',
      'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full',
      'after:bg-brand-600 after:scale-x-0 after:transition-transform after:duration-200',
      'data-[state=active]:after:scale-x-100',
      className,
    )}
    {...props}
  />
))
TabsTriggerUnderline.displayName = 'TabsTriggerUnderline'

/* ══════════════════ Switch ══════════════════ */

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent transition-colors',
      'data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-line-strong',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-4.5 rounded-full bg-white shadow-sm ring-0',
        'transition-transform data-[state=checked]:translate-x-4.5 data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = 'Switch'

/* ══════════════════ Checkbox ══════════════════ */

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer size-4 shrink-0 rounded-[4px] border border-line-strong bg-paper',
      'transition-colors cursor-pointer',
      'hover:border-brand-500',
      'data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600',
      'data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:border-brand-600',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center text-white">
      <Check className="size-3 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = 'Checkbox'

/* ══════════════════ Separator ══════════════════ */

export const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-line',
      orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
      className,
    )}
    {...props}
  />
))
Separator.displayName = 'Separator'

/* ══════════════════ Progress ══════════════════ */

export const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    value?: number
    indicatorClassName?: string
  }
>(({ className, value = 0, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-subtle', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-[var(--ease-out-soft)]',
        indicatorClassName,
      )}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = 'Progress'

/* ══════════════════ Slider ══════════════════ */

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-line">
      <SliderPrimitive.Range className="absolute h-full bg-brand-600" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        className={cn(
          'block size-4 rounded-full border-2 border-brand-600 bg-white shadow-sm',
          'transition-transform hover:scale-110 focus-visible:scale-110',
          'cursor-grab active:cursor-grabbing',
        )}
      />
    ))}
  </SliderPrimitive.Root>
))
Slider.displayName = 'Slider'

/* ══════════════════ Dropdown menu ══════════════════ */

export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger
export const DropdownMenuGroup = DropdownPrimitive.Group

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, align = 'end', ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'z-50 min-w-48 overflow-hidden rounded-v border border-line bg-paper p-1 shadow-lg animate-fade',
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-v-control px-2 py-1.5 text-sm outline-none',
      'transition-colors',
      danger
        ? 'text-danger data-[highlighted]:bg-danger-bg'
        : 'text-ink-2 data-[highlighted]:bg-hover data-[highlighted]:text-ink',
      '[&_svg]:size-4 [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 text-xs font-medium text-ink-3', className)} {...props} />
}

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-line', className)} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

/* ══════════════════ Accordion ══════════════════ */

export const Accordion = AccordionPrimitive.Root

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b border-line', className)} {...props} />
))
AccordionItem.displayName = 'AccordionItem'

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between gap-4 py-4 text-left font-medium text-ink',
        'transition-colors hover:text-brand-600 [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:hidden"
    {...props}
  >
    <div className={cn('pb-4 pr-8 text-sm text-ink-2 leading-relaxed', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

/* ══════════════════ Skeleton ══════════════════ */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shimmer rounded-v-control bg-subtle', className)}
      aria-hidden
      {...props}
    />
  )
}

/* ══════════════════ Avatar ══════════════════ */

export function Avatar({
  name,
  id,
  src,
  size = 'md',
  className,
}: {
  name: string
  id?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    xs: 'size-5 text-[9px]',
    sm: 'size-7 text-[11px]',
    md: 'size-9 text-xs',
    lg: 'size-12 text-sm',
    xl: 'size-16 text-lg',
  }
  const hue = React.useMemo(() => {
    const key = id ?? name
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
    return h
  }, [id, name])

  const label = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('rounded-full object-cover border border-line', sizes[size], className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid place-items-center rounded-full font-semibold select-none shrink-0',
        sizes[size],
        className,
      )}
      style={{
        backgroundColor: `oklch(0.94 0.04 ${hue})`,
        color: `oklch(0.42 0.13 ${hue})`,
      }}
    >
      {label}
    </span>
  )
}
