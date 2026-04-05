<script setup>
</script>

<template>
  <button 
    class="fixed bottom-6 right-6 z-50 md:hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 focus:outline-none"
    @click="$emit('click')"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
    </svg>
  </button>
</template>
