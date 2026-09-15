import * as React from 'react'
import { cn } from '@/lib/utils'

const base = [
  'w-full bg-paper text-ink placeholder:text-ink-3',
  'border border-line rounded-v-control',
  'transition-[border-color,box-shadow] duration-150',
  'hover:border-line-strong',
  'focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-subtle',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10',
].join(' ')

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, 'h-9.5 px-3 text-sm', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, 'min-h-24 px-3 py-2 text-sm resize-y', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-ink leading-none select-none', className)}
    {...props}
  />
))
Label.displayName = 'Label'

/** Field wrapper: label + control + error, wired for a11y (PRD Part 42). */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  htmlFor?: string
}) {
  const describedBy = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden>
            *
          </span>
        )}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : undefined,
          })
        : children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
