<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Package } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatTile } from '@/components/ui/stat'
import { SectionLabel } from '@/components/ui/section-label'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { Field, Input } from '@/components/ui/input'

definePageMeta({ layout: false })

const isDark = ref(false)
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('dony-theme', isDark.value ? 'dark' : 'light')
}

const offers = [
  { name: 'Aïcha D.', ini: 'AD', content: 'Documents', kg: '2,0 kg', amount: '48,00 €', status: 'warn' },
  { name: 'Karim S.', ini: 'KS', content: 'Vêtements', kg: '5,5 kg', amount: '121,00 €', status: 'pos' },
  { name: 'Moussa T.', ini: 'MT', content: 'Électronique', kg: '3,0 kg', amount: '90,00 €', status: 'warn' },
]
const query = ref('')
</script>

<template>
  <div class="min-h-screen bg-bg text-text">
    <div class="mx-auto max-w-5xl px-6 py-14">
      <!-- Masthead -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>dony PRO · design system · Comptoir</SectionLabel>
          <h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Primitives</h1>
          <p class="mt-2 max-w-xl text-text-muted">
            Référence vivante des composants « Comptoir ». Bascule le thème pour vérifier clair / sombre.
          </p>
        </div>
        <Button variant="outline" size="sm" @click="toggleTheme">
          {{ isDark ? 'Mode clair' : 'Mode sombre' }}
        </Button>
      </div>

      <!-- KPI row -->
      <section class="mt-12">
        <SectionLabel>StatTile — vue d'ensemble</SectionLabel>
        <div class="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <StatTile label="En séquestre" value="4 820,00 €" trend="up" trend-value="12,4 %" />
          <StatTile label="Commission (juil.)" value="578,40 €" trend="up" trend-value="8,1 %" />
          <StatTile label="Colis en transit" value="7" trend="down" trend-value="1" sub="7 j" />
          <StatTile label="Note" value="4,9" sub="128 avis" />
        </div>
      </section>

      <!-- Cards + buttons -->
      <section class="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel>Card — trajet en cours</SectionLabel>
          <Card class="mt-4" interactive>
            <CardHeader>
              <CardTitle>Paris CDG <span class="text-primary">→</span> Dakar DSS</CardTitle>
              <Badge variant="info">En cours</Badge>
            </CardHeader>
            <CardBody class="pt-3">
              <div class="h-1.5 overflow-hidden rounded-full bg-surface-el">
                <div class="h-full rounded-full bg-primary" style="width: 52%" />
              </div>
              <div class="mt-2 flex justify-between font-mono text-xs tabular-nums text-text-muted">
                <span>12,0 kg réservés</span><span>23,0 kg au total</span>
              </div>
            </CardBody>
            <CardFooter>
              <Button size="sm">Gérer le trajet</Button>
              <Button variant="ghost" size="sm">Détails</Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <SectionLabel>Button — variantes</SectionLabel>
          <Card variant="flat" class="mt-4">
            <CardBody class="flex flex-wrap items-center gap-3">
              <Button>Accepter l'offre</Button>
              <Button variant="subtle">Contre-offre</Button>
              <Button variant="outline">Voir le détail</Button>
              <Button variant="ghost">Ignorer</Button>
              <Button variant="danger">Refuser</Button>
            </CardBody>
            <CardBody class="flex flex-wrap items-center gap-2 pt-0">
              <Badge variant="info">En séquestre</Badge>
              <Badge variant="success">Accepté</Badge>
              <Badge variant="warning">En attente</Badge>
              <Badge variant="danger">Refusé</Badge>
              <Badge variant="neutral">Brouillon</Badge>
            </CardBody>
          </Card>
        </div>
      </section>

      <!-- Table -->
      <section class="mt-12">
        <SectionLabel>DataTable — offres reçues</SectionLabel>
        <Card class="mt-4">
          <CardBody>
            <DataTable>
              <thead>
                <tr>
                  <th>Expéditeur</th><th>Contenu</th>
                  <th class="num">Poids</th><th class="num">Montant</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in offers" :key="o.name">
                  <td>
                    <span class="flex items-center gap-3">
                      <span class="grid h-8 w-8 place-items-center rounded-full bg-surface-el text-xs font-semibold text-text-muted">{{ o.ini }}</span>
                      <span class="font-medium">{{ o.name }}</span>
                    </span>
                  </td>
                  <td class="text-text-muted">{{ o.content }}</td>
                  <td class="num">{{ o.kg }}</td>
                  <td class="num">{{ o.amount }}</td>
                  <td>
                    <Badge :variant="o.status === 'pos' ? 'success' : 'warning'">
                      {{ o.status === 'pos' ? 'Accepté' : 'En attente' }}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </DataTable>
          </CardBody>
        </Card>
      </section>

      <!-- Field + EmptyState -->
      <section class="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel>Field + Input</SectionLabel>
          <Card class="mt-4">
            <CardBody class="flex flex-col gap-4">
              <Field label="Rechercher un expéditeur" hint="Nom ou référence de colis">
                <template #default="{ id, describedBy }">
                  <Input :id="id" v-model="query" :aria-describedby="describedBy" placeholder="Aïcha, KS-2048…" />
                </template>
              </Field>
              <Field label="Prix par kg" error="Le prix doit être supérieur à 0.">
                <template #default="{ id, invalid, describedBy }">
                  <Input :id="id" :invalid="invalid" :aria-describedby="describedBy" model-value="0" />
                </template>
              </Field>
            </CardBody>
          </Card>
        </div>

        <div>
          <SectionLabel>EmptyState</SectionLabel>
          <Card variant="flat" class="mt-4">
            <EmptyState
              :icon="Package"
              title="Aucune offre en attente"
              description="Les nouvelles demandes de colis sur vos trajets apparaîtront ici."
            >
              <Button size="sm">Publier un trajet</Button>
            </EmptyState>
          </Card>
        </div>
      </section>

      <footer class="mt-16 border-t border-border pt-8 text-sm text-text-subtle">
        Geist + Geist Mono · accent #1E49C7 · ombres en 2 couches · zéro emoji.
      </footer>
    </div>
  </div>
</template>
