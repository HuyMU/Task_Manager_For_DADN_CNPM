<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Moon, Sun } from 'lucide-vue-next'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button 
    @click="toggleDark()" 
    class="relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <!-- Sun icon for light mode (visible when dark is active, so we can switch to light?) Wait, typically you show the icon corresponding to the CURRENT mode, or the mode it will CHANGE to?
         Usually, if it's dark, you show Moon to indicate it IS dark, but sometimes users prefer the other. Let's just show Sun if Dark, Moon if Light, or vice versa.
         Let's show Moon when Light, because clicking Moon brings Dark. And show Sun when Dark because clicking Sun brings Light. -->
    
    <Sun v-if="isDark" class="w-5 h-5 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
    <Moon v-else class="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
  </button>
</template>
