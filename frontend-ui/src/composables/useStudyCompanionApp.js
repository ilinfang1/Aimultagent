import { nextTick, reactive, ref } from 'vue'
import { useAchievements } from './useAchievements'
import { useAgentMonitor } from './useAgentMonitor'
import { useAmbientAudio } from './useAmbientAudio'
import { useAuth } from './useAuth'
import { useChatGateway } from './useChatGateway'
import { useDataCenter } from './useDataCenter'
import { useEnvironment } from './useEnvironment'
import { useGamePersistence } from './useGamePersistence'
import { useLampControl } from './useLampControl'
import { useMusicSearch } from './useMusicSearch'
import { useQuestSystem } from './useQuestSystem'
import { useTaskTimer } from './useTaskTimer'
import { useVoiceMedia } from './useVoiceMedia'

export function useStudyCompanionApp() {
  const gameState = reactive({
    focusCrystals: 0,
    baseLevel: 1,
    showShop: false,
    currentTask: '',
  })

  const playerInput = ref('')
  const chatHistory = ref([])
  const chatLog = ref(null)
  const currentSpeaker = ref('系统')
  const isShaking = ref(false)

  const scrollToBottom = async () => {
    await nextTick()
    if (chatLog.value) {
      chatLog.value.scrollTop = chatLog.value.scrollHeight
    }
  }

  const lamp = useLampControl()

  let loadGameData = async () => {}
  let handleUserMessage = () => {}
  let processAIResponse = async () => {}

  const {
    appState,
    isLoginMode,
    isAuthLoading,
    authError,
    authForm,
    toggleAuthMode,
    handleAuth,
    handleLogout,
  } = useAuth({
    onLoginSuccess: async (userId) => {
      await loadGameData(userId)
    },
    onLogout: () => {
      chatHistory.value = []
      lamp.resetLamp()
    },
  })

  const agentMonitorApi = useAgentMonitor()
  const music = useMusicSearch()
  const ambientAudio = useAmbientAudio()
  const { achievementState, checkAchievements } = useAchievements()

  const questSystem = useQuestSystem({
    gameState,
    chatHistory,
    saveGameData: () => persistence.saveGameData(),
    scrollToBottom,
  })

  const persistence = useGamePersistence({
    appState,
    gameState,
    achievementState,
    questState: questSystem.questState,
    chatHistory,
    scrollToBottom,
  })
  loadGameData = persistence.loadGameData

  const dataCenterApi = useDataCenter({ appState })
  const environment = useEnvironment({ appState, gameState })

  const voiceMedia = useVoiceMedia({
    currentSpeaker,
    playerInput,
    onSubmit: () => handleUserMessage(),
  })

  const startTimerRef = { current: null }

  const timer = useTaskTimer({
    appState,
    gameState,
    audioState: ambientAudio.audioState,
    audioPlayer: ambientAudio.audioPlayer,
    chatHistory,
    saveGameData: persistence.saveGameData,
    achievementState,
    checkAchievements,
    scrollToBottom,
    getProcessAIResponse: () => processAIResponse,
  })

  const chatGateway = useChatGateway({
    agentMonitorApi,
    chatHistory,
    currentSpeaker,
    timerState: timer.timerState,
    gameState,
    targetDuration: timer.targetDuration,
    isShaking,
    speakCharacterText: voiceMedia.speakCharacterText,
    scrollToBottom,
    startTimerRef,
    playerInput,
    selectedImageBase64: voiceMedia.selectedImageBase64,
    fileInput: voiceMedia.fileInput,
  })

  handleUserMessage = chatGateway.handleUserMessage
  processAIResponse = chatGateway.processAIResponse
  startTimerRef.current = timer.startTimer

  const toggleAudioPanel = () => {
    ambientAudio.audioState.isOpen = !ambientAudio.audioState.isOpen
    if (ambientAudio.audioState.isOpen) {
      agentMonitorApi.agentMonitor.isOpen = false
    }
  }

  const toggleAgentMonitor = () => {
    agentMonitorApi.agentMonitor.isOpen = !agentMonitorApi.agentMonitor.isOpen
    if (agentMonitorApi.agentMonitor.isOpen) {
      ambientAudio.audioState.isOpen = false
    }
  }

  const buyItem = (type, cost) => {
    if (gameState.focusCrystals < cost) return

    gameState.focusCrystals -= cost
    gameState.showShop = false

    if (type === 'base2') {
      gameState.baseLevel = 2
      chatHistory.value.push({ role: 'system', text: '已升级至 专业工作站。' })
    } else if (type === 'base3') {
      gameState.baseLevel = 3
      chatHistory.value.push({ role: 'system', text: '已升级至 量子沉浸舱。' })
    } else if (type === 'gift_tea') {
      chatHistory.value.push({ role: 'system', text: '礼物已送达：冰镇珍珠奶茶。' })
      achievementState.stats.teaCount += 1
      checkAchievements({ chatHistory, saveGameData: persistence.saveGameData, scrollToBottom })
      processAIResponse('[指令：玩家给你买了冰镇珍珠奶茶！请开心感谢。]')
    }

    persistence.saveGameData()
  }

  return {
    appState,
    isLoginMode,
    isAuthLoading,
    authError,
    authForm,
    toggleAuthMode,
    handleAuth,
    handleLogout,

    agentMonitor: agentMonitorApi.agentMonitor,

    musicState: music.musicState,
    handleMusicSearch: music.handleMusicSearch,
    openMusicPlayer: music.openMusicPlayer,
    toggleMusic: music.toggleMusic,
    closeMusicPlayer: music.closeMusicPlayer,
    seekMusic: music.seekMusic,
    formatAudioTime: music.formatAudioTime,
    getSourcePlaceholder: music.getSourcePlaceholder,
    getSourceButtonTitle: music.getSourceButtonTitle,

    questState: questSystem.questState,
    completeQuest: questSystem.completeQuest,

    toggleAudioPanel,
    toggleAgentMonitor,

    isLampOn: lamp.isLampOn,
    pullDx: lamp.pullDx,
    pullDy: lamp.pullDy,
    currentLampColor: lamp.currentLampColor,
    startPull: lamp.startPull,

    audioState: ambientAudio.audioState,
    playTrack: ambientAudio.playTrack,
    updateVolume: ambientAudio.updateVolume,

    achievementState,

    dataCenter: dataCenterApi.dataCenter,
    openDataCenter: dataCenterApi.openDataCenter,
    formatDate: dataCenterApi.formatDate,

    playerInput,
    isLoading: chatGateway.isLoading,
    chatLog,
    currentSpeaker,
    currentTime: environment.currentTime,
    gameState,
    isShaking,

    envState: environment.envState,
    themeClass: environment.themeClass,

    targetDuration: timer.targetDuration,
    adjustTime: timer.adjustTime,
    chatHistory,
    timerState: timer.timerState,
    formatTime: timer.formatTime,
    startTimer: timer.startTimer,
    stopTimer: timer.stopTimer,
    buyItem,

    isVoiceOn: voiceMedia.isVoiceOn,
    toggleVoice: voiceMedia.toggleVoice,
    isAiSpeaking: voiceMedia.isAiSpeaking,
    speakerColorClass: voiceMedia.speakerColorClass,
    fileInput: voiceMedia.fileInput,
    selectedImageBase64: voiceMedia.selectedImageBase64,
    handleImageSelected: voiceMedia.handleImageSelected,
    isRecording: voiceMedia.isRecording,
    toggleRecording: voiceMedia.toggleRecording,

    handleUserMessage: chatGateway.handleUserMessage,
  }
}