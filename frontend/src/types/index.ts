export type TaskStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed' | 'rejected'

export interface CustomRole {
  id: number
  name: string
  created_at?: string
}

export interface ActivityLog {
  id: number
  task_id: number
  user_id: number
  action_type: string
  old_status?: string | null
  new_status?: string | null
  created_at: string
  user_name?: string
  user_role?: string
}

export interface Task {
  id: number
  title: string
  description?: string | null
  status: TaskStatus
  due_date?: string | null
  created_at: string
  assigned_role_id?: number | null
  evidence?: string | null
  evidence_note?: string | null
  sos_flag?: boolean
  review_reason?: string | null
  created_by?: number
  logs?: ActivityLog[]
  assigned_role_name?: string
}

export interface User {
  id: number
  username: string
  role: string
  custom_role_id?: number | null
}
