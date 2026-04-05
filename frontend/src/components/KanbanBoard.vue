<script setup>
import { computed } from 'vue'
import TaskCard from './TaskCard.vue'
import { useDragFlip } from '../composables/useDragFlip'

const props = defineProps({
  tasks: { type: Array, required: true },
  actionLoadings: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['updateStatus', 'taskAction', 'openDetail', 'deleteTask'])

const { onPointerDown } = useDragFlip()

const columns = [
  { id: 'pending', title: 'Pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-slate-600', bgBorder: 'border-slate-200', highlight: 'bg-slate-50' },
  { id: 'in_progress', title: 'In Progress', icon: 'M13 10V3L4 14h7v7l9-11h-7z', colorClass: 'text-indigo-600', bgBorder: 'border-indigo-200', highlight: 'bg-indigo-50' },
  { id: 'pending_review', title: 'Review', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-fuchsia-600', bgBorder: 'border-fuchsia-200', highlight: 'bg-fuchsia-50' },
  { id: 'completed', title: 'Completed', icon: 'M5 13l4 4L19 7', colorClass: 'text-emerald-600', bgBorder: 'border-emerald-200', highlight: 'bg-emerald-50' }
]

const getTasksByStatus = (status) => props.tasks.filter(t => t.status === status)

const getTaskCount = (status) => getTasksByStatus(status).length
</script>

<template>
  <div class="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory pt-2 items-start" :class="$style.kanbanScroll">
    <div 
      v-for="column in columns" 
      :key="column.id"
      class="snap-start shrink-0 w-[300px] md:w-[320px] flex flex-col rounded-2xl relative"
      :class="[$style.kanbanColumn]"
      :data-status="column.id"
    >
      <div class="flex items-center justify-between mb-2 pb-2 border-b-2" :class="column.bgBorder">
        <h3 class="font-extrabold flex items-center gap-2 text-sm tracking-tight uppercase" :class="column.colorClass">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="column.icon"></path></svg>
          {{ column.title }}
        </h3>
        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 text-slate-600">
          {{ getTaskCount(column.id) }}
        </span>
      </div>

      <!-- Using auto-animate for list reordering transitions -->
      <!-- GSAP Draggable handles the drop target visualization -->
      <div 
        class="flex flex-col gap-4 min-h-[500px] h-full pb-10" 
        v-auto-animate="{ duration: 300, easing: 'ease-out' }"
      >
        <TaskCard 
          v-for="task in getTasksByStatus(column.id)" 
          :key="task.id" 
          :task="task" 
          :isLoading="props.actionLoadings && props.actionLoadings[task.id]"
          @pointerdown.stop="(e) => onPointerDown(e, task, e.currentTarget)"
          @openDetail="emit('openDetail', $event)"
          @action="emit('taskAction', $event)"
          @delete="emit('deleteTask', $event)"
        />
        
        <!-- Empty State Ghost -->
        <div v-if="getTaskCount(column.id) === 0" class="h-24 w-full rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center pointer-events-none mt-2 opacity-50">
          <span class="text-xs font-semibold text-slate-400">Gắp thả vào đây...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.kanbanScroll {
  /* Hide scrollbar for clean look but keep it functional */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none; // Safari and Chrome
  }
}

.kanbanColumn {
  @include glassmorphism;
  padding: 1.25rem 1rem;
  background-color: transparent; /* Override glassmorphism bg for columns */
  backdrop-filter: none;
  box-shadow: none;
  border-radius: 0;
  border: none;
  
  /* We use the glassmorphism purely on the items, but column has a slight background */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%);
    border-radius: 1.5rem;
    z-index: -1;
    border: 1px solid rgba(255,255,255,0.6);
  }
  
  transition: background-color 0.3s ease;
}
</style>
