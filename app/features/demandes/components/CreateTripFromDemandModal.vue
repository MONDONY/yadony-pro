<!-- stub temporaire — sera remplacé en Task 9 -->
<script setup lang="ts">
import type { MatchingRequest } from '@/features/demandes/types/index'
defineProps<{ request: MatchingRequest | null }>()
defineEmits<{ close: []; success: [requestId: string] }>()
</script>
<template><div /></template>
