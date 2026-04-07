import { ref } from 'vue'
import { useAuth } from './useAuth'
import type { Task, TaskStatus } from '../types'
import { AxiosError } from 'axios'

const tasks = ref<Task[]>([])
const globalLoading = ref<boolean>(false)
const actionLoadings = ref<Record<number, boolean>>({}) // Tracks loading state per task ID

export function useTasks() {
  const { api } = useAuth()

  const fetchTasks = async (): Promise<Task[]> => {
    globalLoading.value = true
    try {
      const { data } = await api.get<Task[]>('/tasks')
      tasks.value = data
      return data
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to fetch tasks'
      }
      throw 'Failed to fetch tasks'
    } finally {
      globalLoading.value = false
    }
  }

  const getTaskDetail = async (id: number): Promise<Task> => {
    try {
      const { data } = await api.get<Task>(`/api/tasks/${id}`)
      return data
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to fetch task details'
      }
      throw 'Failed to fetch task details'
    }
  }

  const createTask = async (taskData: Partial<Task>): Promise<void> => {
    try {
      await api.post('/tasks', taskData)
      await fetchTasks()
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to create task'
      }
      throw 'Failed to create task'
    }
  }

  const withActionLoading = async (id: number, asyncFn: () => Promise<any>): Promise<void> => {
    actionLoadings.value[id] = true
    try {
      await asyncFn()
      await fetchTasks()
    } finally {
      actionLoadings.value[id] = false
    }
  }

  const updateTaskStatus = async (id: number, status: TaskStatus): Promise<void> => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}`, { status }))
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to update task'
      }
      throw 'Failed to update task'
    }
  }

  const toggleSos = async (id: number, currentSos: boolean): Promise<void> => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}`, { sos_flag: !currentSos }))
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to update SOS'
      }
      throw 'Failed to update SOS'
    }
  }

  const submitReview = async (id: number, evidence?: string | null): Promise<void> => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}/request-review`, { evidence_note: evidence || null }))
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to submit review'
      }
      throw 'Failed to submit review'
    }
  }

  const reviewTask = async (id: number, action: string): Promise<void> => {
    try {
      await withActionLoading(id, () => api.put(`/tasks/${id}/review`, { action }))
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to review task'
      }
      throw 'Failed to review task'
    }
  }

  const deleteTask = async (id: number): Promise<void> => {
    try {
      await withActionLoading(id, () => api.delete(`/tasks/${id}`))
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        throw err.response.data?.error || err.response.data?.detail || 'Failed to delete task'
      }
      throw 'Failed to delete task'
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
