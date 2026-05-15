<!-- app/features/trajets/components/TripDetailBids.vue — stub (T8) -->
<script setup lang="ts">
import type { TripBid } from '@/features/trajets/types/index'
defineProps<{ bids: TripBid[]; isLoading: boolean }>()
defineEmits<{ 'accept': [bidId: string]; 'reject': [bidId: string]; 'export-csv': [] }>()
</script>
<template><div /></template>
