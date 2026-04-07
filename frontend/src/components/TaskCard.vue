<script setup lang="ts">
import { computed, ref, useCssModule } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useLinearEffects } from '../composables/useLinearEffects'
import type { Task, TaskStatus } from '../types'

const $style = useCssModule()

interface Props {
  task: Task
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  (e: 'openDetail', task: Task): void
  (e: 'action', payload: any): void
  (e: 'delete', id: number): void
}>()

const { role: currentUserRole, customRoleId, isReviewer } = useAuth() as Record<string, any>

const cardRef = ref<HTMLElement | null>(null)
const { cardTransform, glowStyle, isHovered } = useLinearEffects(cardRef)

const deadlineInfo = computed(() => {
  if (!props.task.due_date) return null
  const dueDate = new Date(props.task.due_date)
  const now = new Date()
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const status = props.task.status

  const isOverdue = dueDate < now && status !== 'completed'
  const dateStr = dueDate.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })

  let colorClass = 'text-slate-500'
  if (status !== 'completed') {
    if (diffHours < 0) colorClass = 'text-red-600 animate-pulse font-bold'
    else if (diffHours < 24) colorClass = 'text-orange-500 font-bold'
    else if (diffHours < 72) colorClass = 'text-amber-500 font-bold'
    else colorClass = 'text-emerald-500 font-bold'
  }

  return { isOverdue, dateStr, colorClass }
})

const currentUserProps = computed(() => {
  let parsedRoleId = null
  if (customRoleId?.value && customRoleId.value !== 'null' && customRoleId.value !== 'undefined') {
    parsedRoleId = parseInt(customRoleId.value)
  }
  return {
    role: currentUserRole?.value,
    custom_role_id: parsedRoleId,
    is_reviewer: isReviewer?.value || false 
  }
})

const canDelete = computed(() => currentUserProps.value.role === 'admin')

const actionButton = computed(() => {
  const status = props.task.status || 'pending'
  if (status === 'pending_review') {
    const isSelfRoleTask = (props.task.assigned_role_id !== null && props.task.assigned_role_id === currentUserProps.value.custom_role_id)
    const canReview = currentUserProps.value.role === 'admin' || (currentUserProps.value.is_reviewer && !isSelfRoleTask)
    if (canReview) return { type: 'review_actions' }
    return { type: 'waiting_label' }
  }

  const actionBtnLabel = status === 'pending' ? 'Start' : (status === 'in_progress' ? (currentUserProps.value.role === 'admin' ? 'Complete' : 'Submit Review') : 'Reopen')
  let cssClass = status === 'pending' ? $style.actionBtnBlue : (status === 'in_progress' ? $style.actionBtnGreen : $style.actionBtnYellow)

  const isUnassigned = props.task.assigned_role_id === null || props.task.assigned_role_id === undefined
  const matchesRole = props.task.assigned_role_id === currentUserProps.value.custom_role_id
  const canEdit = currentUserProps.value.role === 'admin' || isUnassigned || matchesRole

  if (!canEdit) return { type: 'disabled', label: actionBtnLabel, cssClass: $style.actionBtnDisabled }
  if (status === 'in_progress' && currentUserProps.value.role !== 'admin') return { type: 'request_review', label: actionBtnLabel, cssClass }

  const nextStatusMap: Record<string, TaskStatus> = { 'pending': 'in_progress', 'in_progress': 'completed', 'completed': 'pending' }
  return { type: 'update_status', label: actionBtnLabel, cssClass, nextStatus: nextStatusMap[status] }
})
</script>

<template>
  <div 
    ref="cardRef"
    class="task-card flex flex-col text-left relative cursor-pointer group"
    :class="[$style.glassCard, { 'opacity-60 pointer-events-none': isLoading }]"
    :style="{ transform: cardTransform }"
    :data-id="task.id"
    @click="$emit('openDetail', task)"
  >
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-white/20 rounded-2xl backdrop-blur-[2px]">
      <svg class="animate-spin h-8 w-8 text-indigo-600 drop-shadow-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <!-- Magnetic Glow element -->
    <div :class="$style.glow" :style="glowStyle"></div>

    <span v-if="task.sos_flag" :class="$style.sosBadge" class="absolute -top-3 -right-3 z-20 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg border-2 border-white animate-pulse">
      SOS
    </span>
    
    <div v-if="deadlineInfo" class="text-xs font-semibold mb-2 flex items-center gap-1 relative z-10" :class="deadlineInfo.colorClass">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span class="truncate">{{ deadlineInfo.isOverdue ? 'Overdue: ' : 'Deadline: ' }} {{ deadlineInfo.dateStr }}</span>
    </div>

    <!-- Move delete button to outer container for proper hovering -->
    <div v-if="canDelete" class="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 z-30">
      <button @click.stop="$emit('delete', task.id)" :class="$style.deleteBtn" class="p-1.5 rounded-md shadow-sm ring-1 ring-border-muted hover:bg-red-50 hover:text-red-600 transition duration-200" title="Delete Task">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    </div>

    <div class="flex justify-between items-start mb-3 mt-1 relative z-10">
      <h4 class="font-bold text-text-primary leading-tight pr-8">{{ task.title }}</h4>
    </div>
    
    <p v-if="task.description" class="text-sm text-text-secondary mb-3 line-clamp-3 leading-relaxed relative z-10" style="word-break: break-all;">
      {{ task.description }}
    </p>
    <div v-else class="mb-3 relative z-10"></div>

    <div v-if="task.evidence_note" class="mt-2 text-xs p-2 rounded-md break-words mb-2 relative z-10" :class="$style.evidenceBox">
      <b>Evidence:</b> <span>{{ task.evidence_note }}</span>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-y-3 mt-auto pt-4 relative z-10" :class="$style.cardFooter">
      <div class="flex items-center gap-2.5 shrink-0 max-w-1/2 pr-2">
        <div class="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ring-2 shadow-sm" :class="$style.avatar">
          {{ task.assigned_role_name ? task.assigned_role_name.charAt(0).toUpperCase() : '?' }}
        </div>
        <span class="text-xs font-semibold px-2 py-1 rounded-md border truncate max-w-[80px]" :class="$style.roleLabel" :title="task.assigned_role_name || 'Unassigned'">
          {{ task.assigned_role_name || 'Unassigned' }}
        </span>
      </div>
      
      <div class="shrink-0 flex items-center justify-end relative z-20">
        <template v-if="actionButton.type === 'review_actions'">
          <div class="flex flex-wrap gap-2 shrink-0 justify-end">
             <button @click.stop="$emit('action', { id: task.id, action: 'review', value: 'approve' })" :class="[$style.actionBtn, $style.actionBtnGreen]">Approve</button>
             <button @click.stop="$emit('action', { id: task.id, action: 'review', value: 'reject' })" :class="[$style.actionBtn, $style.actionBtnRed]">Reject</button>
          </div>
        </template>
        <template v-else-if="actionButton.type === 'waiting_label'">
          <span :class="$style.waitingLabel">⏳ Đang chờ duyệt</span>
        </template>
        <template v-else-if="actionButton.type === 'disabled'">
          <button disabled :title="actionButton.label" :class="[$style.actionBtn, actionButton.cssClass]">{{ actionButton.label }}</button>
        </template>
        <template v-else-if="actionButton.type === 'request_review'">
          <button @click.stop="$emit('action', { id: task.id, action: 'request_review' })" :class="[$style.actionBtn, actionButton.cssClass]">{{ actionButton.label }}</button>
        </template>
        <template v-else-if="actionButton.type === 'update_status'">
          <button @click.stop="$emit('action', { id: task.id, action: 'update_status', value: actionButton.nextStatus })" :class="[$style.actionBtn, actionButton.cssClass]">{{ actionButton.label }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.glassCard {
  @include glassmorphism;
  padding: 1.25rem;
  border-radius: 1rem;
  transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.4s ease;
  transform-style: preserve-3d;
  will-change: transform;
  user-select: none;
  
  &:hover {
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.1);
  }
  
  :global(.dark) &:hover {
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(0, 0, 0, 0.4);
  }
}

.glow {
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  pointer-events: none;
  mix-blend-mode: overlay;
  transition: opacity 0.3s ease;
  z-index: 1;
  :global(.dark) & { mix-blend-mode: normal; opacity: 0.15 !important; }
}

.sosBadge { background-color: #dc2626; }

.deleteBtn {
  color: var(--text-muted);
  background-color: transparent;
  transition: all 0.2s;
  &:hover { color: #ef4444; background-color: #fef2f2; }
  :global(.dark) &:hover { background-color: rgba(239, 68, 68, 0.15); }
}

.evidenceBox {
  background-color: #eef2ff;
  border: 1px solid #e0e7ff;
  color: #3730a3;
  :global(.dark) & {
    background-color: rgba(67, 56, 202, 0.15);
    border-color: rgba(99, 102, 241, 0.2);
    color: #e0e7ff;
  }
}

.cardFooter {
  border-top-color: rgba(241, 245, 249, 0.5);
  :global(.dark) & { border-top-color: rgba(51, 65, 85, 0.5); }
}

.avatar {
  background: linear-gradient(135deg, #e0e7ff, #e9d5ff);
  color: #4338ca;
  border-color: white;
  :global(.dark) & {
    background: linear-gradient(135deg, #3730a3, #6b21a8);
    color: #e0e7ff;
    border-color: rgba(255,255,255,0.1);
  }
}

.roleLabel {
  background-color: #f8fafc;
  color: #64748b;
  border-color: #e2e8f0;
  :global(.dark) & {
    background-color: rgba(30, 41, 59, 0.6);
    color: #94a3b8;
    border-color: rgba(71, 85, 105, 0.5);
  }
}

.actionBtn {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  &:active { transform: scale(0.95); }
}

.actionBtnBlue {
  color: #1d4ed8; background-color: #eff6ff; border-color: #bfdbfe;
  &:hover { background-color: #dbeafe; }
  :global(.dark) & { color: #93c5fd; background-color: rgba(29, 78, 216, 0.2); border-color: rgba(59, 130, 246, 0.3); }
  :global(.dark) &:hover { background-color: rgba(29, 78, 216, 0.3); }
}
.actionBtnGreen {
  color: #047857; background-color: #ecfdf5; border-color: #a7f3d0;
  &:hover { background-color: #d1fae5; }
  :global(.dark) & { color: #6ee7b7; background-color: rgba(4, 120, 87, 0.2); border-color: rgba(16, 185, 129, 0.3); }
  :global(.dark) &:hover { background-color: rgba(4, 120, 87, 0.3); }
}
.actionBtnYellow {
  color: #b45309; background-color: #fffbeb; border-color: #fde68a;
  &:hover { background-color: #fef3c7; }
  :global(.dark) & { color: #fcd34d; background-color: rgba(180, 83, 9, 0.2); border-color: rgba(245, 158, 11, 0.3); }
  :global(.dark) &:hover { background-color: rgba(180, 83, 9, 0.3); }
}
.actionBtnRed {
  color: #b91c1c; background-color: #fef2f2; border-color: #fecaca;
  &:hover { background-color: #fee2e2; }
  :global(.dark) & { color: #fca5a5; background-color: rgba(185, 28, 28, 0.2); border-color: rgba(239, 68, 68, 0.3); }
  :global(.dark) &:hover { background-color: rgba(185, 28, 28, 0.3); }
}
.actionBtnDisabled {
  color: #94a3b8; background-color: #f8fafc; border-color: #e2e8f0;
  cursor: not-allowed; opacity: 0.5;
  &:active { transform: none; }
  :global(.dark) & { color: #cbd5e1; background-color: rgba(30, 41, 59, 0.5); border-color: rgba(71, 85, 105, 0.5); }
}

.waitingLabel {
  font-size: 0.75rem; font-weight: 600; color: #7e22ce; background-color: #faf5ff;
  padding: 0.375rem 0.5rem; border-radius: 0.375rem; border: 1px solid #e9d5ff; user-select: none;
  :global(.dark) & { color: #d8b4fe; background-color: rgba(126, 34, 206, 0.2); border-color: rgba(168, 85, 247, 0.3); }
}
</style>
