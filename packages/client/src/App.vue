<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50">
    <h1 class="text-4xl font-bold text-gray-900">Entasis</h1>
    <p class="text-gray-500">Vue 3 + Vite + Tailwind CSS</p>
    <button
      class="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700"
      @click="count++"
    >
      count is {{ count }}
    </button>
  </div>
</template>
