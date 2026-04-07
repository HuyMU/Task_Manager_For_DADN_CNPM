<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'
import KanbanBoard from '../components/KanbanBoard.vue'
import TaskDetailModal from '../components/TaskDetailModal.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import type { CustomRole, Task } from '../types'

const { tasks, fetchTasks, createTask, updateTaskStatus, submitReview, reviewTask, deleteTask, actionLoadings } = useTasks()
const { role, api } = useAuth()

const isCreateModalOpen = ref<boolean>(false)
const isDetailModalOpen = ref<boolean>(false)
const selectedTaskId = ref<number | null>(null)
const isCreating = ref<boolean>(false)

const newTask = ref({
  title: '',
  description: '',
  due_date: '',
  assigned_role_id: '' as string | number
})
const roles = ref<CustomRole[]>([])

const noRolesWarning = computed(() => role.value === 'admin' && roles.value.length === 0)

const loadDashboard = async () => {
  await fetchTasks()
  if (role.value === 'admin') {
    try {
      const { data } = await api.get<CustomRole[]>('/api/roles')
      roles.value = data
    } catch(e) {
      console.error(e)
    }
  }
}

onMounted(loadDashboard)

const handleTaskAction = async (event: any) => {
  if (event.action === 'update_status') {
    await updateTaskStatus(event.id, event.value)
  } else if (event.action === 'request_review') {
    const evidence = prompt('Bạn đã hoàn thành? Vui lòng gửi kèm Link kết quả hoặc báo cáo ngắn (Evidence):', '')
    if (evidence === null) return
    await submitReview(event.id, evidence)
  } else if (event.action === 'review') {
    if (event.value === 'reject') {
      const reason = prompt('Nhập lý do từ chối (Tùy chọn):', '')
      if (reason === null) return
    }
    await reviewTask(event.id, event.value)
  }
}

const openDetail = (taskObj: Task) => {
  selectedTaskId.value = taskObj.id
  isDetailModalOpen.value = true
}

const handleDeleteTask = async (id: number) => {
  if(confirm("Are you sure you want to delete this task?")) {
    await deleteTask(id)
  }
}

const submitCreateTask = async () => {
  try {
    isCreating.value = true
    await createTask({
      title: newTask.value.title,
      description: newTask.value.description,
      due_date: newTask.value.due_date ? new Date(newTask.value.due_date).toISOString() : null,
      assigned_role_id: (newTask.value.assigned_role_id) ? parseInt(newTask.value.assigned_role_id.toString()) : null
    })
    isCreateModalOpen.value = false
    newTask.value = { title: '', description: '', due_date: '', assigned_role_id: '' }
  } catch (err: any) {
    alert(err)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="relative min-h-[500px]">
    <div v-if="noRolesWarning" class="bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200 text-sm font-medium mb-6">
      You have not created any Custom Roles yet. Members cannot register without roles. Please create a role in the workspace settings.
    </div>

    <!-- Desktop Action Bar -->
    <div class="flex justify-end mb-6" v-if="role === 'admin'">
      <button @click="isCreateModalOpen = true" class="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5 whitespace-nowrap focus:outline-none">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        New Task
      </button>
    </div>

    <KanbanBoard 
      :tasks="tasks" 
      :actionLoadings="actionLoadings"
      @update-status="({id, status}: {id: number, status: any}) => updateTaskStatus(id, status)"
      @task-action="handleTaskAction"
      @open-detail="openDetail"
      @delete-task="handleDeleteTask"
    />

    <FloatingActionButton v-if="role === 'admin'" @click="isCreateModalOpen = true" />

    <!-- Create Task Modal -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div class="glass w-full max-w-lg mx-4 rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        <button type="button" @click="isCreateModalOpen = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors focus:outline-none">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-300 border-b border-indigo-100 dark:border-slate-700 pb-3 shrink-0">
          <svg class="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          New Task
        </h2>
        
        <div class="overflow-y-auto pr-2 pb-2 custom-scrollbar">
          <form @submit.prevent="submitCreateTask" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Title <span class="text-red-500">*</span></label>
              <input v-model="newTask.title" type="text" required class="w-full rounded-xl border-slate-200 dark:border-slate-600 shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-white/70 dark:bg-slate-800/80 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-500" placeholder="E.g., Design homepage">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea v-model="newTask.description" rows="3" class="w-full rounded-xl border-slate-200 dark:border-slate-600 shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-white/70 dark:bg-slate-800/80 dark:text-white outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500" placeholder="Task details..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deadline <span class="text-red-500">*</span></label>
              <input v-model="newTask.due_date" type="datetime-local" required class="w-full rounded-xl border-slate-200 dark:border-slate-600 shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-white/70 dark:bg-slate-800/80 dark:text-white outline-none" style="color-scheme: light dark;">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign to Role</label>
              <select v-model="newTask.assigned_role_id" class="w-full rounded-xl border-slate-200 dark:border-slate-600 shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-white/70 dark:bg-slate-800/80 dark:text-white outline-none">
                <option value="" class="dark:bg-slate-800">Unassigned</option>
                <option v-for="r in roles" :key="r.id" :value="r.id" class="dark:bg-slate-800">{{ r.name }}</option>
              </select>
            </div>
            <button type="submit" :disabled="isCreating" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-transform transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="isCreating" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isCreating ? 'Creating...' : 'Create Task' }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <TaskDetailModal 
      v-model:isOpen="isDetailModalOpen" 
      :taskId="selectedTaskId" 
      @refresh="fetchTasks" 
    />
  </div>
</template>
