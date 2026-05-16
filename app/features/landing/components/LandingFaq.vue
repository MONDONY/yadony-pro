<template>
  <section id="faq" class="py-20" style="background-color: var(--surface-el);">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Colonne intro fixe -->
        <div class="lg:w-60 flex-shrink-0">
          <h2 class="font-display font-bold text-3xl text-text mb-3">Questions fréquentes</h2>
          <p class="text-sm text-text-muted leading-relaxed">Tout ce qu'il faut savoir avant de rejoindre dony PRO.</p>
        </div>

        <!-- Accordéon -->
        <div class="flex-1 flex flex-col divide-y divide-border">
          <div v-for="item in faqItems" :key="item.question" class="py-5">
            <button
              type="button"
              @click="toggle(item.question)"
              class="w-full flex items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs"
              :aria-expanded="openItem === item.question"
              :aria-controls="`faq-answer-${faqItems.indexOf(item)}`"
            >
              <span class="font-semibold text-text">{{ item.question }}</span>
              <span
                class="flex-shrink-0 text-text-muted transition-transform duration-200"
                :style="openItem === item.question ? 'transform: rotate(180deg)' : ''"
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </button>

            <Transition
              enter-active-class="transition-all duration-200 ease-out overflow-hidden"
              leave-active-class="transition-all duration-150 ease-in overflow-hidden"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-show="openItem === item.question"
                :id="`faq-answer-${faqItems.indexOf(item)}`"
                class="mt-3 text-sm text-text-muted leading-relaxed pr-8"
              >
                {{ item.answer }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const faqItems = [
  {
    question: "C'est quoi dony PRO ?",
    answer: "dony PRO est l'espace web réservé aux voyageurs vérifiés de l'application dony. Il te permet de gérer tes trajets, tes demandes de transport, ta négociation avec les expéditeurs et tes paiements depuis un ordinateur.",
  },
  {
    question: 'Comment accéder à dony PRO ?',
    answer: "L'accès à dony PRO se débloque depuis l'application mobile dony après validation de ton identité (KYC). Va dans Profil → PRO → Activer. Une fois activé, connecte-toi sur cette page avec ton numéro de téléphone.",
  },
  {
    question: 'Comment fonctionne le paiement sécurisé ?',
    answer: "Les paiements transitent par Stripe, leader mondial du paiement en ligne. Dès qu'un expéditeur confirme un envoi, les fonds sont bloqués en séquestre. Ils sont libérés sur ton compte Stripe automatiquement lorsque tu scannes le QR code à la livraison.",
  },
  {
    question: 'Quelle commission prend dony ?',
    answer: "dony prélève 12 % sur chaque transaction, déduits du montant versé à l'expéditeur. Tu encaisses le montant négocié avec l'expéditeur, sans surprise.",
  },
  {
    question: 'Que se passe-t-il en cas de litige ?',
    answer: "En cas de problème à la livraison, dony dispose d'une équipe de résolution des litiges. Les fonds restent en séquestre jusqu'à résolution. Pour les cas non résolus sous 48h, dony peut forcer la libération ou rembourser l'expéditeur selon les éléments fournis.",
  },
]

const openItem = ref<string | null>(faqItems[0]?.question ?? null)

function toggle(question: string) {
  openItem.value = openItem.value === question ? null : question
}
</script>
