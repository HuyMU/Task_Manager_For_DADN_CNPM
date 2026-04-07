<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import type { CustomRole } from '../types'

const username = ref<string>('')
const password = ref<string>('')
const roleId = ref<string | number>('')
const errorMsg = ref<string>('')
const loading = ref<boolean>(false)
const roles = ref<CustomRole[]>([])
const router = useRouter()
const { register, api } = useAuth()

onMounted(async () => {
  try {
    const { data } = await api.get<CustomRole[]>('/api/roles')
    roles.value = data
  } catch(e) {
    console.error('Failed to load roles')
  }
})

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await register({ username: username.value, password: password.value, custom_role_id: roleId.value })
    alert('Registration successful! Please login.')
    router.push('/login')
  } catch (err: any) {
    errorMsg.value = err
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="glass p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Taskboard</h1>
        <p class="text-text-muted mt-2 font-medium">Create a new Member account.</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-text-secondary mb-1">Username</label>
          <input v-model="username" type="text" required class="w-full rounded-xl border border-border-muted shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-surface-bg text-text-primary outline-none">
        </div>
        <div>
          <label class="block text-sm font-semibold text-text-secondary mb-1">Password</label>
          <input v-model="password" type="password" required class="w-full rounded-xl border border-border-muted shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-surface-bg text-text-primary outline-none">
        </div>
        <div>
          <label class="block text-sm font-semibold text-text-secondary mb-1">Select Your Role</label>
          <select v-model="roleId" required class="w-full rounded-xl border border-border-muted shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 px-4 py-2.5 bg-surface-bg text-text-primary outline-none">
            <option value="" disabled class="bg-surface-bg text-text-primary">-- Choose Role --</option>
            <option v-for="r in roles" :key="r.id" :value="r.id" class="bg-surface-bg text-text-primary">{{ r.name }}</option>
          </select>
        </div>
        
        <div v-if="errorMsg" class="text-red-500 text-sm font-medium">{{ errorMsg }}</div>

        <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-transform transform hover:-translate-y-0.5 mt-2 disabled:opacity-50">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        
        <div class="text-center mt-4">
          <router-link to="/login" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors">
            Already have an account? Login here.
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
