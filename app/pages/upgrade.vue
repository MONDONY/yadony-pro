<script setup lang="ts">
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'auth' })
</script>

<template>
  <div class="w-full max-w-md space-y-4 rounded-el border border-border bg-surface p-8 text-center shadow-card">
    <h1 class="font-display text-2xl font-bold">Compte PRO requis</h1>
    <p class="text-text-muted">
      Le workspace dony PRO est réservé aux voyageurs professionnels.
      Demande l'activation de ton compte depuis l'application mobile dony.
    </p>
    <Button as-child>
      <a href="https://dony.app">Télécharger l'app mobile</a>
    </Button>
  </div>
</template>
