import { ref } from 'vue'

// State module-level : le topbar (bouton hamburger) et le layout (drawer mobile)
// partagent la même instance.
const isOpen = ref(false)

export function useSidebar() {
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }
  function toggle() { isOpen.value = !isOpen.value }

  return { isOpen, open, close, toggle }
}
