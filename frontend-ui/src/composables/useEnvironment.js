import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

function getSkyStyleForHalfHour(hour, minute) {
  const slotMinute = minute >= 30 ? 30 : 0
  const timeValue = hour + slotMinute / 60

  const keyframes = [
    { t: 0, top: [10, 20, 40], bot: [20, 40, 60], glow: [200, 220, 255, 0.8] },
    { t: 5, top: [15, 30, 50], bot: [30, 50, 70], glow: [200, 220, 255, 0.4] },
    { t: 6, top: [44, 62, 80], bot: [253, 116, 108], glow: [255, 120, 50, 0.8] },
    { t: 8, top: [100, 150, 255], bot: [160, 200, 255], glow: [255, 240, 200, 0.9] },
    { t: 12, top: [41, 128, 185], bot: [109, 213, 250], glow: [255, 255, 255, 1] },
    { t: 16, top: [60, 140, 200], bot: [130, 220, 255], glow: [255, 230, 180, 0.9] },
    { t: 18, top: [255, 75, 31], bot: [255, 144, 104], glow: [255, 100, 50, 0.8] },
    { t: 19, top: [40, 30, 80], bot: [120, 60, 100], glow: [200, 220, 255, 0.4] },
    { t: 20, top: [15, 25, 50], bot: [25, 45, 70], glow: [200, 220, 255, 0.6] },
    { t: 24, top: [10, 20, 40], bot: [20, 40, 60], glow: [200, 220, 255, 0.8] },
  ]

  let start = keyframes[0]
  let end = keyframes[keyframes.length - 1]

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    if (timeValue >= keyframes[index].t && timeValue < keyframes[index + 1].t) {
      start = keyframes[index]
      end = keyframes[index + 1]
      break
    }
  }

  const ratio = (timeValue - start.t) / (end.t - start.t)
  const lerp = (from, to, progress) => Math.round(from + (to - from) * progress)

  const topColor = `rgb(${lerp(start.top[0], end.top[0], ratio)}, ${lerp(start.top[1], end.top[1], ratio)}, ${lerp(start.top[2], end.top[2], ratio)})`
  const bottomColor = `rgb(${lerp(start.bot[0], end.bot[0], ratio)}, ${lerp(start.bot[1], end.bot[1], ratio)}, ${lerp(start.bot[2], end.bot[2], ratio)})`
  const glowR = lerp(start.glow[0], end.glow[0], ratio)
  const glowG = lerp(start.glow[1], end.glow[1], ratio)
  const glowB = lerp(start.glow[2], end.glow[2], ratio)
  const glowA = start.glow[3] + (end.glow[3] - start.glow[3]) * ratio

  let posX = 0
  let posY = 100

  if (timeValue >= 6 && timeValue <= 18) {
    const progress = (timeValue - 6) / 12
    posX = progress * 100
    posY = 100 - Math.sin(progress * Math.PI) * 80
  } else {
    let progress = 0
    if (timeValue > 18) progress = (timeValue - 18) / 12
    else progress = (timeValue + 6) / 12

    posX = progress * 100
    posY = 100 - Math.sin(progress * Math.PI) * 80
  }

  return `radial-gradient(circle at ${posX}% ${posY}%, rgba(${glowR}, ${glowG}, ${glowB}, ${glowA}) 0%, rgba(${glowR}, ${glowG}, ${glowB}, ${glowA * 0.4}) 15%, transparent 60%), linear-gradient(135deg, ${topColor} 0%, ${bottomColor} 100%)`
}

export function useEnvironment({ appState, gameState }) {
  const envState = reactive({
    temp: '--°C',
    desc: '',
    icon: '📡',
    timeOfDay: 'morning',
    skyStyle: '',
  })

  const currentTime = ref('')
  let timeInterval = null

  const initEnvironmentSensor = () => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true`)
          const data = await response.json()
          envState.temp = `${Math.round(data.current_weather.temperature)}°C`
          envState.icon = '☀️'
        } catch (error) {
          envState.temp = '24°C'
          envState.icon = '🌤️'
        }
      },
      () => {
        envState.temp = '24°C'
        envState.icon = '🌤️'
      },
      { timeout: 10000 },
    )
  }

  const updateTime = () => {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const hour = now.getHours()
    const minute = now.getMinutes()

    if (hour >= 6 && hour < 12) envState.timeOfDay = 'morning'
    else if (hour >= 12 && hour < 17) envState.timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 19) envState.timeOfDay = 'evening'
    else envState.timeOfDay = 'night'

    envState.skyStyle = getSkyStyleForHalfHour(hour, minute)
  }

  const themeClass = computed(() => {
    if (!appState.isLoggedIn) return 'theme-auth'
    if (gameState.baseLevel >= 3) return 'theme-quantum'
    if (gameState.baseLevel === 2) return 'theme-dark'
    if (envState.timeOfDay === 'night' || envState.timeOfDay === 'evening') return 'theme-dark'
    return 'theme-light'
  })

  onMounted(() => {
    updateTime()
    timeInterval = setInterval(updateTime, 1000)
    initEnvironmentSensor()
  })

  onUnmounted(() => {
    if (timeInterval) clearInterval(timeInterval)
  })

  return {
    envState,
    currentTime,
    themeClass,
  }
}
