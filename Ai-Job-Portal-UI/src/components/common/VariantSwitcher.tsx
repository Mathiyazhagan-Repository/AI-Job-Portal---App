import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariantControl, VARIANTS, VARIANT_META, type Variant } from '@/hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/controls'
import { Link } from 'react-router'

const LETTER: Record<Variant, string> = { a: 'A', b: 'B', c: 'C' }

/**
 * DESIGN.md §6.6 — the design-direction switch.
 * Present in every layout so any screen can be compared in seconds.
 */
export function VariantSwitcher({ compact }: { compact?: boolean }) {
  return null
}
