import { ref, computed } from 'vue'
import { useMouseInElement } from '@vueuse/core'

/**
 * Creates a Linear-app style 3D tilt effect and cursor highlight glow
 */
export function useLinearEffects(targetRef) {
  const { elementX, elementY, isOutside, elementHeight, elementWidth } = useMouseInElement(targetRef)

  // 3D Tilt calculation
  const cardTransform = computed(() => {
    if (isOutside.value || !targetRef.value) {
      return 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    }
    
    // Normalize coordinates (-0.5 to 0.5)
    const x = (elementX.value / elementWidth.value) - 0.5
    const y = (elementY.value / elementHeight.value) - 0.5
    
    // Max rotation 10 degrees, springy
    const rx = y * -15 
    const ry = x * 15
    return `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`
  })

  // Radial gradient for glow following the cursor
  const glowStyle = computed(() => {
    if (isOutside.value || !targetRef.value) return { opacity: 0 }
    
    return {
      opacity: 1,
      background: `radial-gradient(circle 250px at ${elementX.value}px ${elementY.value}px, rgba(255,255,255,0.4), transparent 80%)`
    }
  })

  return {
    cardTransform,
    glowStyle,
    isHovered: computed(() => !isOutside.value)
  }
}
