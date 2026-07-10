import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

/**
 * Bouton « Comptoir » : accent surélevé (--elev-btn), focus ring 2px offset,
 * rayon 12px. Sémantique séparée de l'accent (variant danger dédié).
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-sm font-medium transition-[background,box-shadow,transform,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary shadow-btn hover:bg-primary-hover active:translate-y-px',
        subtle:  'bg-primary/10 text-primary hover:bg-primary/15',
        ghost:   'text-text-muted hover:bg-surface-el hover:text-text',
        outline: 'border border-border-strong bg-transparent text-text hover:bg-surface-el',
        danger:  'bg-danger text-on-danger hover:bg-danger-hover active:translate-y-px',
      },
      size: {
        default: 'h-10 px-4',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-11 px-6',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
