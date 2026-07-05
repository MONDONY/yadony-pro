import { cva, type VariantProps } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

/**
 * Pastille de statut « Comptoir » : point coloré + fond teinté ~10 %.
 * La couleur sémantique (success/warning/danger) est distincte de l'accent.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full text-xs font-medium leading-none before:h-1.5 before:w-1.5 before:rounded-full before:bg-current',
  {
    variants: {
      variant: {
        info:    'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger:  'bg-danger/10 text-danger',
        neutral: 'bg-surface-el text-text-muted before:bg-text-subtle',
      },
      size: {
        default: 'px-2.5 py-1',
        sm:      'px-2 py-0.5 text-[11px]',
      },
      dot: {
        true: '',
        false: 'before:hidden',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'default',
      dot: true,
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
