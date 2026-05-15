import { ref } from 'vue'
import type { Bid } from '@/features/colis/types/index'

export function useBidDetail() {
  const isOpen = ref(false)
  const selectedBid = ref<Bid | null>(null)

  function openPanel(bid: Bid): void {
    selectedBid.value = bid
    isOpen.value = true
  }

  function closePanel(): void {
    isOpen.value = false
    // selectedBid kept for CSS exit animation; caller clears after transition
  }

  function updateSelectedBid(partial: Partial<Bid>): void {
    if (selectedBid.value) {
      selectedBid.value = { ...selectedBid.value, ...partial }
    }
  }

  return { isOpen, selectedBid, openPanel, closePanel, updateSelectedBid }
}
