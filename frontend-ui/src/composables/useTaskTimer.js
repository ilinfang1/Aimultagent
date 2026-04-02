import { reactive, ref, watch } from 'vue'
import { addFocusRecord } from '../services/api'

export function useTaskTimer({
  appState,
  gameState,
  audioState,
  audioPlayer,
  chatHistory,
  saveGameData,
  achievementState,
  checkAchievements,
  scrollToBottom,
  getProcessAIResponse,
}) {
  const targetDuration = ref(25 * 60)
  const timerState = reactive({
    isRunning: false,
    remainingTime: 1500,
    intervalId: null,
  })

  watch(
    () => gameState.currentTask,
    (newTask) => {
      if (timerState.isRunning) return

      const task = newTask.trim()
      if (!task) {
        targetDuration.value = 25 * 60
        return
      }

      if (/(歌|音乐|休息|伸展)/.test(task)) targetDuration.value = 5 * 60
      else if (/(代码|编程|卷)/.test(task)) targetDuration.value = 45 * 60
      else targetDuration.value = 25 * 60
    },
  )

  const adjustTime = (amountSeconds) => {
    if (targetDuration.value + amountSeconds >= 300) {
      targetDuration.value += amountSeconds
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainSeconds.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    if (timerState.isRunning || !gameState.currentTask) return

    timerState.isRunning = true
    timerState.remainingTime = targetDuration.value

    const minutes = Math.floor(targetDuration.value / 60)
    chatHistory.value.push({
      role: 'system',
      name: 'SYS',
      text: `已启动：${gameState.currentTask} (${minutes}分钟)`,
    })
    scrollToBottom()

    if (audioState.currentTrack && !audioState.isPlaying) {
      audioPlayer.play()
      audioState.isPlaying = true
    }

    timerState.intervalId = setInterval(() => {
      timerState.remainingTime -= 1
      if (timerState.remainingTime <= 0) handleTimerEnd(true)
    }, 1000)
  }

  const stopTimer = () => {
    if (!timerState.isRunning) return
    handleTimerEnd(false)
  }

  const handleTimerEnd = async (isSuccess) => {
    clearInterval(timerState.intervalId)
    timerState.isRunning = false
    timerState.intervalId = null

    if (audioState.isPlaying) {
      audioPlayer.pause()
      audioState.isPlaying = false
    }

    if (isSuccess) {
      const earned = Math.floor(targetDuration.value / 60)
      gameState.focusCrystals += earned
      achievementState.stats.focusCount += 1

      checkAchievements({ chatHistory, saveGameData, scrollToBottom })

      chatHistory.value.push({
        role: 'system',
        name: 'SYS',
        text: `完成挑战。获得 ${earned} 颗水晶。`,
      })
      saveGameData()

      try {
        await addFocusRecord({
          userId: appState.currentUserId,
          taskName: gameState.currentTask,
          durationMinutes: earned,
        })
      } catch (error) {
        console.error(error)
      }

      await getProcessAIResponse()?.(`[指令：玩家完成了"${gameState.currentTask}"。如果你是教官，请强硬要求玩家上传作业截图验收。]`)
    } else {
      chatHistory.value.push({ role: 'system', name: 'SYS', text: '你中止了任务。' })
      scrollToBottom()
    }

    gameState.currentTask = ''
  }

  return {
    targetDuration,
    timerState,
    adjustTime,
    formatTime,
    startTimer,
    stopTimer,
  }
}
