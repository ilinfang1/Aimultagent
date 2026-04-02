import { ref } from 'vue'
import { synthesizeSpeech } from '../services/api'

export function useVoiceMedia({ currentSpeaker, playerInput, onSubmit }) {
  const isVoiceOn = ref(true)
  const isAiSpeaking = ref(false)
  const isRecording = ref(false)
  const selectedImageBase64 = ref(null)
  const fileInput = ref(null)

  let currentAudio = null
  let recognition = null

  const toggleVoice = () => {
    isVoiceOn.value = !isVoiceOn.value

    if (!isVoiceOn.value && currentAudio) {
      currentAudio.pause()
      currentAudio = null
      isAiSpeaking.value = false
    }
  }

  const getVoiceTypeBySpeaker = (speaker) => {
    if (speaker === '林夏') return 'female_zhubo'
    if (speaker === '苏婉') return 'female_sichuan'
    if (speaker === '智') return 'male_db'
    return 'female_zhubo'
  }

  const speakerColorClass = () => {
    if (currentSpeaker.value === '林夏') return 'speaker-Ling'
    if (currentSpeaker.value === '苏婉') return 'speaker-Rou'
    if (currentSpeaker.value === '智') return 'speaker-Zhi'
    return ''
  }

  const normalizeBase64Audio = (rawAudio) => {
  if (!rawAudio || typeof rawAudio !== 'string') return { mimeType: 'audio/mpeg', base64: '' }

  let input = rawAudio.trim()

  // 如果接口直接返回 data URL
  const dataUrlMatch = input.match(/^data:([^;]+);base64,(.+)$/i)
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1] || 'audio/mpeg',
      base64: dataUrlMatch[2].replace(/\s+/g, ''),
    }
  }

  // 去掉空白
  input = input.replace(/\s+/g, '')

  // URL-safe Base64 转标准 Base64
  input = input.replace(/-/g, '+').replace(/_/g, '/')

  // 自动补齐 padding
  while (input.length % 4 !== 0) {
    input += '='
  }

  return {
    mimeType: detectAudioMimeType(input),
    base64: input,
  }
}

const detectAudioMimeType = (base64) => {
  if (!base64 || typeof base64 !== 'string') return 'audio/mpeg'

  if (base64.startsWith('UklGR')) return 'audio/wav'
  if (base64.startsWith('/+MY') || base64.startsWith('SUQz')) return 'audio/mpeg'
  if (base64.startsWith('T2dnUw')) return 'audio/ogg'

  return 'audio/mpeg'
}

  const base64ToBlobUrl = (base64, mimeType) => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    return URL.createObjectURL(blob)
  }

  const speakCharacterText = async (text) => {
    if (!isVoiceOn.value) return
    if (!text || typeof text !== 'string') return

    const cleanText = text
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500)

    if (!cleanText) return

    try {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }

      const voiceType = getVoiceTypeBySpeaker(currentSpeaker.value)
      const res = await synthesizeSpeech({
        text: cleanText,
        voiceType,
      })

      const rawAudio = res?.data?.audio
      if (!rawAudio) {
        console.error('TTS 返回里没有 audio 字段:', res)
        return
      }

      const normalized = normalizeBase64Audio(rawAudio)
      if (!normalized.base64) {
        console.error('TTS audio 无法解析:', rawAudio)
        return
      }

      const mimeType = normalized.mimeType
      const audioUrl = base64ToBlobUrl(normalized.base64, mimeType)

      const audio = new Audio()
      audio.src = audioUrl
      audio.preload = 'auto'
      currentAudio = audio

      audio.addEventListener('play', () => {
        isAiSpeaking.value = true
      })

      const stopSpeaking = () => {
        isAiSpeaking.value = false
        if (currentAudio === audio) {
          currentAudio = null
        }
        URL.revokeObjectURL(audioUrl)
      }

      audio.addEventListener('ended', stopSpeaking)
      audio.addEventListener('pause', stopSpeaking)
      audio.addEventListener('error', (e) => {
        console.error('Audio 元素播放失败:', e, {
          mimeType,
          rawAudioPrefix:String(rawAudio).slice(0, 80),
          normalizedPrefix: String(normalized.base64).slice(0, 30),
        })
        stopSpeaking()
      })

      await audio.play()
    } catch (error) {
      console.error('TTS 播放失败:', error)
      isAiSpeaking.value = false
    }
  }

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      selectedImageBase64.value = reader.result
    }
    reader.readAsDataURL(file)
  }

  const toggleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('当前浏览器不支持语音识别')
      return
    }

    if (isRecording.value && recognition) {
      recognition.stop()
      isRecording.value = false
      return
    }

    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      isRecording.value = true
    }

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      playerInput.value = transcript
      isRecording.value = false
      onSubmit?.()
    }

    recognition.onerror = () => {
      isRecording.value = false
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.start()
  }

  return {
    isVoiceOn,
    toggleVoice,
    isAiSpeaking,
    speakerColorClass,
    fileInput,
    selectedImageBase64,
    handleImageSelected,
    isRecording,
    toggleRecording,
    speakCharacterText,
  }
}