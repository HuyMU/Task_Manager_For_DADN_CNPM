<script setup>
import { ref, watch, onMounted, onUnmounted, useCssModule } from 'vue'
import { marked } from 'marked'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  taskId: { type: Number, default: null }
})

const emit = defineEmits(['update:isOpen', 'refresh'])

const { getTaskDetail, toggleSos } = useTasks()
const { role } = useAuth()

const task = ref(null)
const isLoading = ref(false)
const error = ref(null)

const modalContent = ref(null)
onClickOutside(modalContent, () => close())

const fetchTaskData = async () => {
  if (!props.taskId) return
  isLoading.value = true
  error.value = null
  try {
    task.value = await getTaskDetail(props.taskId)
  } catch (err) {
    error.value = err
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    fetchTaskData()
  } else {
    document.body.style.overflow = ''
    setTimeout(() => { task.value = null }, 300)
  }
})

const close = () => {
  emit('update:isOpen', false)
}

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen) close()
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
})

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getLogIcon = (actionType) => {
  if (actionType === 'created') return '<div class="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>'
  else if (actionType === 'status_changed') return '<div class="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>'
  else if (actionType === 'review_submitted') return '<div class="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>'
  else if (actionType === 'sos_triggered') return '<div class="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute opacity-75"></div><div class="w-2.5 h-2.5 bg-red-500 rounded-full relative"></div>'
  else if (actionType === 'sos_resolved') return '<div class="w-2.5 h-2.5 bg-teal-500 rounded-full"></div>'
  return '<div class="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>'
}

const handleSosToggle = async () => {
  if (role.value !== 'admin') {
    alert("Only Admin can override Priority Flag.")
    return
  }
  if (!task.value) return
  await toggleSos(task.value.id, task.value.sos_flag)
  await fetchTaskData()
  emit('refresh')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="close"></div>

    <!-- Modal Container with Glassmorphism -->
    <div ref="modalContent" class="relative w-full max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col sm:flex-row overflow-hidden shadow-2xl transition-all" :class="$style.glassModal">
      <!-- Close Btn -->
      <button type="button" @click="close" class="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors focus:outline-none shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="absolute inset-0 bg-white z-[5] p-8 flex flex-col md:flex-row gap-8 animate-pulse">
        <div class="flex-[7] space-y-4 pt-10">
          <div class="h-10 bg-slate-200 rounded-xl w-3/4"></div>
          <div class="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div class="space-y-3 mt-10">
            <div class="h-4 bg-slate-200 rounded w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
        <div class="flex-[3] border-l border-slate-100 pl-8 space-y-6 pt-10">
          <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
          <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
          <div class="h-48 bg-slate-200 rounded-xl w-full mt-10"></div>
        </div>
      </div>

      <template v-else-if="task">
        <!-- Left Column (70%) -->
        <div class="flex-[7] p-6 md:p-8 md:overflow-y-auto bg-white/50 shrink-0 md:shrink relative">
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <span class="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 mt-1 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{{ formatDateTime(task.created_at) }}</span>
            </span>
            <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg shadow-sm border border-indigo-200 mt-1">
              {{ task.assigned_role_name || 'Unassigned' }}
            </span>
            <span v-if="task.sos_flag" class="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg shadow-sm border border-red-200 mt-1 animate-pulse flex items-center gap-1">
              🆘 KHẨN CẤP
            </span>
          </div>
          
          <h2 class="text-3xl font-extrabold text-slate-800 mb-6 leading-tight mt-3">{{ task.title }}</h2>
          <div class="h-px bg-slate-200/60 w-full mb-8"></div>
          
          <!-- Markdown Container -->
          <div v-if="task.description" class="prose prose-slate prose-indigo max-w-none prose-headings:font-bold prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-a:text-indigo-600 prose-p:leading-relaxed prose-li:my-1" v-html="marked(task.description)"></div>
          <div v-else class="text-slate-400 italic">No description provided.</div>

          <div v-if="task.evidence_note" class="mt-10 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
            <h4 class="text-sm font-bold text-indigo-900 mb-2.5 flex items-center gap-2 border-b border-indigo-100/50 pb-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              Evidence Note
            </h4>
            <p class="text-sm text-indigo-800 break-words whitespace-pre-wrap leading-relaxed">{{ task.evidence_note }}</p>
          </div>
        </div>

        <!-- Right Column (30%) -->
        <div class="flex-[3] p-6 lg:p-8 bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col md:max-h-[85vh] md:overflow-y-auto shrink-0 md:shrink">
          <div class="shrink-0 space-y-5">
            <h3 class="font-bold text-slate-400 text-xs tracking-widest uppercase mb-4">Properties</h3>
            
            <!-- Status -->
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select disabled :value="task.status" class="w-full text-sm rounded-xl border border-slate-200 shadow-sm px-3.5 py-2.5 bg-slate-50 font-semibold text-slate-500 outline-none cursor-not-allowed appearance-none opacity-80">
                <option value="pending">🟡 Pending (Chưa bắt đầu)</option>
                <option value="in_progress">🔵 In Progress (Đang làm)</option>
                <option value="pending_review">🟣 Pending Review (Chờ duyệt)</option>
                <option value="completed">🟢 Completed (Hoàn thành)</option>
              </select>
            </div>

            <!-- Priority / SOS -->
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
              <button @click="handleSosToggle" class="w-full flex items-center justify-between px-4 py-2.5 border rounded-xl shadow-sm text-sm font-bold transition-all bg-white hover:bg-slate-50 border-slate-200 text-slate-600" :class="{'cursor-not-allowed opacity-75': role !== 'admin'}">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                  SOS Flag
                </span>
                <div class="w-10 h-5 rounded-full relative transition-colors duration-300 shadow-inner" :class="task.sos_flag ? 'bg-red-500' : 'bg-slate-200'">
                  <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow" :class="task.sos_flag ? 'left-5' : 'left-0.5'"></div>
                </div>
              </button>
            </div>
          </div>

          <div class="h-px bg-slate-200 w-full my-6 shrink-0 shadow-sm"></div>

          <!-- Audit Logs Timeline -->
          <div class="flex-1 overflow-hidden flex flex-col min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative">
            <h3 class="font-bold text-slate-700 text-sm tracking-wider uppercase mb-5 shrink-0 flex gap-2 items-center text-indigo-900 border-b border-slate-100 pb-3">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Activity Log
            </h3>
            <div class="flex-1 overflow-y-auto pr-2 pb-4 relative custom-scrollbar">
              <div class="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent"></div>
              <div class="space-y-6 relative" v-auto-animate="{ duration: 300 }">
                <div v-if="task.logs?.length === 0" class="text-xs text-slate-400 italic pl-6">No activity recorded.</div>
                <div v-for="log in task.logs" :key="log.id" class="flex gap-4 relative">
                  <div class="w-6 flex justify-center mt-1.5 relative shrink-0">
                    <div class="bg-white p-0.5 relative z-10" v-html="getLogIcon(log.action_type)"></div>
                  </div>
                  <div>
                    <p class="text-[13px] text-slate-700 font-medium">
                      <span class="font-bold text-indigo-700">{{ log.user_name }}</span>
                      <span v-if="log.action_type === 'created'"> created this task</span>
                      <span v-else-if="log.action_type === 'status_changed'"> 
                        moved task from <b>{{ log.old_status }}</b> to <b>{{ log.new_status }}</b>
                      </span>
                      <span v-else-if="log.action_type === 'review_submitted'"> 
                        submitted evidence for review
                      </span>
                      <span v-else-if="log.action_type === 'review_approved'"> 
                        <span class="text-emerald-600 font-bold">approved</span> the task
                      </span>
                      <span v-else-if="log.action_type === 'review_rejected'"> 
                        <span class="text-red-600 font-bold">rejected</span> the task and returned it
                      </span>
                      <span v-else-if="log.action_type === 'sos_triggered'"> 
                        flagged task as <span class="text-red-500 font-bold">SOS</span>
                      </span>
                      <span v-else-if="log.action_type === 'sos_resolved'"> 
                        resolved the <span class="text-teal-500 font-bold">SOS</span> flag
                      </span>
                      <span v-else> performed an action</span>
                    </p>
                    <p class="text-[11px] text-slate-400 mt-1 font-semibold tracking-wide uppercase">{{ formatDateTime(log.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style module lang="scss">
.glassModal {
  @include glassmorphism;
  border-radius: 1.5rem;
  background: color-mix(in srgb, rgba(255, 255, 255, 0.8) 100%, transparent); // Slightly more opaque glass for readability
  // On mobile we might want specific rounded corners
}
</style>
