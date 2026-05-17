<template>
  <div>
    <LandingNav />
    <main>
      <LandingHero />
      <LandingAppBridge />
      <LandingSteps />
      <LandingTestimonials />
      <LandingFeatures />
      <LandingFaq />
      <LandingCta />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'dony PRO — Gérez. Encaissez. Soyez payés.',
  description: "L'espace de gestion pour les voyageurs vérifiés dony. Publiez vos trajets, acceptez des colis, encaissez en sécurité.",
  ogTitle: 'dony PRO',
  ogDescription: 'Gérez votre activité de transporteur depuis le web.',
})
</script>
