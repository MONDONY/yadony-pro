import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// twMerge doit connaître les scales custom du design system « Comptoir » pour
// dédupliquer correctement les classes en conflit (rounded-*, shadow-*, text-2xs).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['card', 'el', 'btn', 'input', 'sheet', 'xs'] }],
      'font-size': [{ text: ['2xs'] }],
      shadow: [{ shadow: ['card', 'pop', 'btn'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
