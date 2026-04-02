import { nextTick, ref } from 'vue'
import { sendGameChat } from '../services/api'

function mapSpeakerName(activeSpeaker) {
  if (activeSpeaker === 'Rou') return '苏婉'
  if (activeSpeaker === 'Zhi') return '智'
  return '林夏'
}

function mapSpeakerRole(name) {
  if (name === '苏婉') return 'suwan'
  if (name === '智') return 'zhi'
  return 'linxia'
}

export function useChatGateway({
  agentMonitorApi,
  chatHistory,
  currentSpeaker,
  timerState,
  gameState,
  targetDuration,
  isShaking,
  speakCharacterText,
  scrollToBottom,
  startTimerRef,
  playerInput,
  selectedImageBase64,
  fileInput,
}) {
  const isLoading = ref(false)

  const processAIResponse = async (textToBackend, imageBase64 = null) => {
    isLoading.value = true
    agentMonitorApi.markSyncing()

    try {
      const payload = { message: textToBackend }
      if (imageBase64) payload.imageBase64 = imageBase64

      const result = await sendGameChat(payload)

      if (result?.code !== 200 || !result?.data?.aiData) {
        throw new Error('解析失败')
      }

      setTimeout(async () => {
        const aiData = result.data.aiData
        currentSpeaker.value = mapSpeakerName(aiData.active_speaker)
        agentMonitorApi.applyAiState(aiData)

        let replyText = aiData.speaker_reply || '（无言）'
        replyText = replyText.replace(/\[START_TIMER:.*?:\d+\]/gi, '').trim()

        if (aiData.speaker_emotion === 'angry') {
          isShaking.value = true
          setTimeout(() => {
            isShaking.value = false
          }, 800)
        }

        chatHistory.value.push({
          role: mapSpeakerRole(currentSpeaker.value),
          name: currentSpeaker.value,
          text: replyText,
        })

        const rawStringToCheck = `${aiData.system_event || ''} ${aiData.speaker_reply || ''}`
        const timerMatch = rawStringToCheck.match(/\[START_TIMER:\s*(.+?)\s*:\s*(\d+)\s*\]/i)

        if (timerMatch) {
          if (timerState.isRunning) {
            chatHistory.value.push({
              role: 'system',
              name: 'SYS',
              text: '🛡️ 保护：专注中，拦截覆盖指令。',
            })
          } else {
            const forceTask = timerMatch[1].trim()
            const forceMinutes = parseInt(timerMatch[2], 10)

            chatHistory.value.push({
              role: 'system',
              name: 'SYS',
              text: `⚠️ 强制接管：自动设定 [${forceTask}]`,
            })

            gameState.currentTask = forceTask
            await nextTick()
            targetDuration.value = forceMinutes * 60

            setTimeout(() => {
              if (!timerState.isRunning) {
                startTimerRef.current?.()
              }
            }, 1500)
          }
        }

        scrollToBottom()
        speakCharacterText(replyText, currentSpeaker.value)
      }, 500)
    } catch (error) {
      agentMonitorApi.markDisconnected()
      setTimeout(() => {
        chatHistory.value.push({ role: 'system', name: 'SYS', text: '链路异常...' })
        scrollToBottom()
      }, 500)
    } finally {
      isLoading.value = false
      scrollToBottom()
    }
  }

  const handleUserMessage = () => {
    if ((!playerInput.value.trim() && !selectedImageBase64.value) || isLoading.value) return

    const msgText = playerInput.value.trim() || '（上传了图片）'
    const imageToSend = selectedImageBase64.value

    chatHistory.value.push({
      role: 'player',
      name: 'You',
      text: msgText,
      image: imageToSend,
    })

    playerInput.value = ''
    selectedImageBase64.value = null
    if (fileInput.value) fileInput.value.value = ''

    scrollToBottom()
    processAIResponse(`[玩家说：${msgText}]`, imageToSend)
  }

  return {
    isLoading,
    processAIResponse,
    handleUserMessage,
  }
}
