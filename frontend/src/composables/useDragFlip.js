import { ref } from 'vue'
import { useTasks } from './useTasks'

export function useDragFlip() {
  const { tasks } = useTasks()
  const draggingItem = ref(null)
  const pointerPos = ref({ x: 0, y: 0 })
  const offset = ref({ x: 0, y: 0 })
  const cloneEl = ref(null)
  
  // Track origin to prevent cross-column moves
  const originalColumnStatus = ref(null)

  const onPointerDown = (e, task, el) => {
    if (e.button !== 0) return
    if (e.target.closest('button')) return

    const rect = el.getBoundingClientRect()
    offset.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    cloneEl.value = el.cloneNode(true)
    cloneEl.value.style.position = 'fixed'
    cloneEl.value.style.left = `${rect.left}px`
    cloneEl.value.style.top = `${rect.top}px`
    cloneEl.value.style.width = `${rect.width}px`
    cloneEl.value.style.height = `${rect.height}px`
    cloneEl.value.style.zIndex = '9999'
    cloneEl.value.style.pointerEvents = 'none'
    cloneEl.value.style.transform = 'scale(1.02) rotate(1deg)'
    cloneEl.value.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
    cloneEl.value.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    
    document.body.appendChild(cloneEl.value)
    
    el.style.opacity = '0.3'

    draggingItem.value = { task, el, rect }
    originalColumnStatus.value = task.status

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    
    document.body.style.cursor = 'grabbing'
  }

  const onPointerMove = (e) => {
    if (!cloneEl.value || !draggingItem.value) return
    const x = e.clientX - offset.value.x
    const y = e.clientY - offset.value.y
    cloneEl.value.style.left = `${x}px`
    cloneEl.value.style.top = `${y}px`
    
    const { task } = draggingItem.value
    
    const elementsBeneath = document.elementsFromPoint(e.clientX, e.clientY)
    const taskCardElement = elementsBeneath.find(el => el.classList.contains('task-card') && el !== draggingItem.value.el)
    
    if (taskCardElement) {
      const hoverTaskId = parseInt(taskCardElement.getAttribute('data-id'))
      
      if (!isNaN(hoverTaskId)) {
        const currentIndex = tasks.value.findIndex(t => t.id === task.id)
        const hoverIndex = tasks.value.findIndex(t => t.id === hoverTaskId)
        
        if (currentIndex !== -1 && hoverIndex !== -1) {
          const targetTask = tasks.value[hoverIndex]
          
          if (targetTask.status === originalColumnStatus.value) {
            const hoverRect = taskCardElement.getBoundingClientRect()
            const hoverCenterY = hoverRect.top + hoverRect.height / 2
            
            let shouldSwap = false
            // If dragging downwards to a task below
            if (currentIndex < hoverIndex && e.clientY > hoverCenterY) {
              shouldSwap = true
            } 
            // If dragging upwards to a task above
            else if (currentIndex > hoverIndex && e.clientY < hoverCenterY) {
              shouldSwap = true
            }

            if (shouldSwap) {
              const temp = tasks.value[currentIndex]
              tasks.value[currentIndex] = tasks.value[hoverIndex]
              tasks.value[hoverIndex] = temp
            }
          }
        }
      }
    }
  }

  const onPointerUp = (e) => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.body.style.cursor = ''
    
    if (!draggingItem.value) return

    draggingItem.value.el.style.opacity = '1'

    if (cloneEl.value) {
      document.body.removeChild(cloneEl.value)
      cloneEl.value = null
    }

    draggingItem.value = null
    originalColumnStatus.value = null
  }

  return {
    onPointerDown
  }
}
