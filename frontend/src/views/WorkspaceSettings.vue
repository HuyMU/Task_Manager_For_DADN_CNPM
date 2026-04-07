<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import type { CustomRole, User } from '../types'

const { api } = useAuth()
const roles = ref<CustomRole[]>([])
const users = ref<any[]>([])
const newRoleName = ref<string>('')
const loadingRole = ref<boolean>(false)

const loadData = async () => {
  try {
    const rolesRes = await api.get<CustomRole[]>('/api/roles')
    roles.value = rolesRes.data
    const usersRes = await api.get<any[]>('/api/users')
    users.value = usersRes.data
  } catch(e) {
    console.error(e)
  }
}

onMounted(loadData)

const handleAddRole = async () => {
  if(!newRoleName.value) return
  loadingRole.value = true
  try {
    await api.post('/api/roles', { name: newRoleName.value })
    newRoleName.value = ''
    await loadData()
  } catch(e: any) {
    alert(e.response?.data?.error || 'Failed to create role')
  } finally {
    loadingRole.value = false
  }
}

const toggleReviewer = async (id: number, isReviewer: boolean) => {
  try {
    await api.put(`/api/users/${id}/reviewer`, { is_reviewer: isReviewer })
    await loadData()
  } catch(e) {
    console.error('Error toggling reviewer', e)
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto align-top">
    <!-- Add Role Form -->
    <div class="glass rounded-2xl p-6 shadow-sm h-fit border dark:border-slate-700">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-300 border-b border-indigo-100 dark:border-slate-700 pb-2">
        <svg class="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Create Role
      </h2>
      <form @submit.prevent="handleAddRole" class="space-y-3">
        <div>
          <input v-model="newRoleName" type="text" required class="w-full text-sm rounded-lg border border-border-muted shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-3 py-2 bg-surface-bg text-text-primary outline-none" placeholder="E.g., Designer">
        </div>
        <button type="submit" :disabled="loadingRole" class="w-full text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50">
          {{ loadingRole ? 'Adding...' : 'Add Role' }}
        </button>
      </form>
    </div>

    <!-- Manage Reviewers -->
    <div class="glass rounded-2xl p-6 shadow-sm h-fit border dark:border-slate-700">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-300 border-b border-indigo-100 dark:border-slate-700 pb-2">
        <svg class="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        Manage Reviewers
      </h2>
      <div class="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
        <p v-if="users.length === 0" class="text-xs text-text-muted italic">No members found.</p>
        <div v-for="u in users" :key="u.id" class="flex items-center justify-between p-2 hover:bg-surface-hover rounded-lg border border-transparent hover:border-indigo-100 dark:hover:border-slate-600 transition-colors cursor-default text-sm">
          <div class="flex flex-col truncate pr-2">
            <span class="font-bold text-text-primary truncate">{{ u.username }}</span>
            <span class="text-[10px] text-text-muted uppercase tracking-wide truncate">{{ u.custom_role_name || 'No Role' }}</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" class="sr-only peer" :checked="u.is_reviewer" @change="toggleReviewer(u.id, ($event.target as HTMLInputElement).checked)">
            <div class="w-7 h-4 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-500 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
