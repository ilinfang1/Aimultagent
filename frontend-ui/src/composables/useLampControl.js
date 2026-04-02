import { onMounted, onUnmounted, ref } from 'vue'
import { LAMP_COLORS } from '../constants/lampColors'

export function useLampControl() {
  const isLampOn = ref(false)
  const pullDx = ref(0)
  const pullDy = ref(0)
  const currentLampColor = ref('#007aff')

  let isDragging = false
  let startX = 0
  let startY = 0
  let velocityX = 0
  let velocityY = 0
  let bounceAnimId = null

  const getRandomColor = () => LAMP_COLORS[Math.floor(Math.random() * LAMP_COLORS.length)]

  const startPull = (event) => {
    if (bounceAnimId) clearInterval(bounceAnimId)
    isDragging = true
    startX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX
    startY = event.type.includes('mouse') ? event.pageY : event.touches[0].pageY
  }

  const onPull = (event) => {
    if (!isDragging) return

    const currentX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX
    const currentY = event.type.includes('mouse') ? event.pageY : event.touches[0].pageY
    const dx = currentX - startX
    const dy = currentY - startY
    const rawDistance = Math.sqrt(dx * dx + dy * dy)

    const limit = 45
    let finalDistance = rawDistance

    if (rawDistance > limit) {
      finalDistance = limit + (rawDistance - limit) * 0.25
    }

    if (rawDistance > 0) {
      pullDx.value = (dx / rawDistance) * finalDistance
      pullDy.value = (dy / rawDistance) * finalDistance
    }
  }

  const endPull = ({ onLampToggle } = {}) => {
    if (!isDragging) return

    isDragging = false

    if (pullDy.value > 25) {
      isLampOn.value = !isLampOn.value
      currentLampColor.value = isLampOn.value ? getRandomColor() : currentLampColor.value
      onLampToggle?.(isLampOn.value)
    }

    const stiffness = 0.25
    const damping = 0.65

    bounceAnimId = setInterval(() => {
      velocityX = (velocityX + -pullDx.value * stiffness) * damping
      velocityY = (velocityY + -pullDy.value * stiffness) * damping
      pullDx.value += velocityX
      pullDy.value += velocityY

      if (
        Math.abs(velocityX) < 0.1 &&
        Math.abs(velocityY) < 0.1 &&
        Math.abs(pullDx.value) < 0.5 &&
        Math.abs(pullDy.value) < 0.5
      ) {
        pullDx.value = 0
        pullDy.value = 0
        clearInterval(bounceAnimId)
      }
    }, 16)
  }

  const resetLamp = () => {
    isLampOn.value = false
    pullDx.value = 0
    pullDy.value = 0
  }

  const handleMouseUp = () => endPull()
  const handleTouchEnd = () => endPull()

  onMounted(() => {
    window.addEventListener('mousemove', onPull)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', onPull, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onPull)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', onPull)
    window.removeEventListener('touchend', handleTouchEnd)
    if (bounceAnimId) clearInterval(bounceAnimId)
  })

  return {
    isLampOn,
    pullDx,
    pullDy,
    currentLampColor,
    startPull,
    endPull,
    resetLamp,
  }
}
