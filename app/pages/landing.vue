<template>
  <div>
    <LandingNav />
    <main>
      <LandingHero />
      <LandingAppBridge />
      <LandingSteps />
      <LandingTestimonials />
      <!-- sections suivantes -->
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>
