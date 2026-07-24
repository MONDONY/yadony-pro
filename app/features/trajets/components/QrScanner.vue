<!-- app/features/trajets/components/QrScanner.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{ detected: [value: string]; error: [message: string] }>()

const videoRef = ref<HTMLVideoElement | null>(null)
const status = ref<'idle' | 'scanning' | 'unsupported' | 'denied'>('idle')

let stream: MediaStream | null = null
let rafId: number | null = null
let detector: { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } | null = null
let stopped = false

function stopCamera() {
  stopped = true
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

async function scanLoop() {
  if (stopped || !detector || !videoRef.value) return
  try {
    const codes = await detector.detect(videoRef.value)
    if (codes.length > 0 && codes[0].rawValue) {
      emit('detected', codes[0].rawValue)
      stopCamera()
      return
    }
  } catch {
    /* frame non décodable — on continue */
  }
  rafId = requestAnimationFrame(scanLoop)
}

onMounted(async () => {
  const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => typeof detector })
    .BarcodeDetector
  if (!BarcodeDetectorCtor || !navigator.mediaDevices?.getUserMedia) {
    status.value = 'unsupported'
    emit('error', 'Lecture QR non supportée par ce navigateur.')
    return
  }
  try {
    detector = new BarcodeDetectorCtor({ formats: ['qr_code'] }) as typeof detector
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
    status.value = 'scanning'
    scanLoop()
  } catch {
    status.value = 'denied'
    emit('error', "Accès caméra refusé ou indisponible.")
  }
})

onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="space-y-3" data-test="qr-scanner">
    <div class="relative aspect-square w-full max-w-xs mx-auto rounded-card overflow-hidden bg-black">
      <video ref="videoRef" class="w-full h-full object-cover" muted playsinline />
      <div v-if="status === 'scanning'" class="absolute inset-6 border-2 border-white/70 rounded-card pointer-events-none" />
    </div>
    <p v-if="status === 'scanning'" class="text-center text-sm text-text-muted" data-test="qr-scanning">
      Vise le QR code du colis…
    </p>
    <p v-else-if="status === 'unsupported'" class="text-center text-sm text-danger" data-test="qr-unsupported">
      Le scan QR n'est pas disponible sur ce navigateur. Utilise le bouton de confirmation manuelle.
    </p>
    <p v-else-if="status === 'denied'" class="text-center text-sm text-danger" data-test="qr-denied">
      Accès à la caméra refusé. Autorise la caméra ou confirme manuellement.
    </p>
  </div>
</template>
