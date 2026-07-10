<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Trip } from '@/features/trajets/types/index'

const props = defineProps<{ trips: Trip[] }>()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else { currentMonth.value-- }
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else { currentMonth.value++ }
}

const calendarDays = computed<Array<number | null>>(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const cells: Array<number | null> = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

const tripsByDay = computed<Map<number, Trip[]>>(() => {
  const map = new Map<number, Trip[]>()
  for (const trip of props.trips) {
    const d = new Date(trip.departureDate)
    if (d.getFullYear() === currentYear.value && d.getMonth() === currentMonth.value) {
      const day = d.getDate()
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(trip)
    }
  }
  return map
})

const isToday = (day: number): boolean =>
  day === today.getDate() &&
  currentMonth.value === today.getMonth() &&
  currentYear.value === today.getFullYear()

const statusDotColor: Record<string, string> = {
  ACTIVE: 'bg-success',
  FULL: 'bg-primary',
  IN_PROGRESS: 'bg-warning',
  COMPLETED: 'bg-text-subtle',
  CANCELLED: 'bg-danger',
}
</script>

<template>
  <div class="bg-surface border border-border rounded-card shadow-card overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-border">
      <button class="p-1.5 rounded-btn text-text-muted hover:bg-surface-el hover:text-text transition-colors" @click="prevMonth">
        <ChevronLeft class="w-4 h-4" />
      </button>
      <h2 class="font-display font-semibold text-text">{{ MONTHS_FR[currentMonth] }} <span class="tabular-nums">{{ currentYear }}</span></h2>
      <button class="p-1.5 rounded-btn text-text-muted hover:bg-surface-el hover:text-text transition-colors" @click="nextMonth">
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <div class="grid grid-cols-7 border-b border-border">
      <div v-for="day in DAYS_FR" :key="day" class="py-2 text-center text-xs font-medium text-text-muted">
        {{ day }}
      </div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="(day, i) in calendarDays"
        :key="i"
        :class="cn('min-h-[80px] p-2 border-r border-b border-border', !day && 'bg-bg/30')"
      >
        <template v-if="day !== null">
          <span :class="cn('inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-medium tabular-nums mb-1', isToday(day) ? 'bg-primary text-on-primary' : 'text-text-muted')">
            {{ day }}
          </span>
          <div v-if="tripsByDay.has(day)" class="space-y-0.5">
            <div
              v-for="trip in tripsByDay.get(day)"
              :key="trip.id"
              class="flex items-center gap-1 text-xs rounded-xs px-1.5 py-0.5 bg-surface-el truncate"
            >
              <span :class="cn('w-1.5 h-1.5 rounded-full shrink-0', statusDotColor[trip.status])" />
              <span class="truncate text-text-muted">{{ trip.arrivalCity.label }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
