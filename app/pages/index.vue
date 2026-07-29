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
  title: 'Yadony PRO — Gérez. Encaissez. Soyez payés.',
  description: "L'espace de gestion pour les voyageurs vérifiés Yadony. Publiez vos trajets, acceptez des colis, encaissez en sécurité.",
  ogTitle: 'Yadony PRO',
  ogDescription: 'Gérez votre activité de transporteur depuis le web.',
})
</script>
