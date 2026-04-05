import { ref } from 'vue'
import { useAuth } from './useAuth'

const tasks = ref([])
const globalLoading = ref(false)
const actionLoadings = ref({}) // Tracks loading state per task ID

export function useTasks() {
  const { api } = useAuth()

  const fetchTasks = async () => {
    globalLoading.value = true
    try {
      const { data } = await api.get('/tasks')
      tasks.value = data
      return data
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to fetch tasks'
    } finally {
      globalLoading.value = false
    }
  }

  const getTaskDetail = async (id) => {
    try {
      const { data } = await api.get(`/api/tasks/${id}`)
      return data
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to fetch task details'
    }
  }

  const createTask = async (taskData) => {
    try {
      await api.post('/tasks', taskData)
      await fetchTasks()
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to create task'
    }
  }

  const withActionLoading = async (id, asyncFn) => {
    actionLoadings.value[id] = true
    try {
      await asyncFn()
      await fetchTasks()
    } finally {
      actionLoadings.value[id] = false
    }
  }

  const updateTaskStatus = async (id, status) => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}`, { status }))
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to update task'
    }
  }

  const toggleSos = async (id, currentSos) => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}`, { sos_flag: !currentSos }))
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to update SOS'
    }
  }

  const submitReview = async (id, evidence) => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}/request-review`, { evidence_note: evidence || null }))
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to submit review'
    }
  }

  const reviewTask = async (id, action) => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}/review`, { action }))
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to review task'
    }
  }

  const deleteTask = async (id) => {
    try {
      await withActionLoading(id, () => api.delete(`/tasks/${id}`))
    } catch (err) {
      throw err.response?.data?.error || err.response?.data?.detail || 'Failed to delete task'
    }
  }

  return {
    tasks,
    globalLoading,
    actionLoadings,
    fetchTasks,
    getTaskDetail,
    createTask,
    updateTaskStatus,
    toggleSos,
    submitReview,
    reviewTask,
    deleteTask
  }
}
