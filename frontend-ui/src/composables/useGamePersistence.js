import { loadGameArchive, saveGameArchive } from '../services/api'

export function useGamePersistence({ appState, gameState, achievementState, questState, chatHistory, scrollToBottom }) {
  const loadGameData = async (userId) => {
    try {
      const result = await loadGameArchive(userId)

      if (result?.code !== 200 || !result.data) return

      const data = result.data
      gameState.focusCrystals = data.focusCrystals || 0
      gameState.baseLevel = data.baseLevel || 1

      if (data.stats) {
        Object.assign(achievementState.stats, data.stats)
      }

      if (Array.isArray(data.badges)) {
        data.badges.forEach((unlocked, index) => {
          if (achievementState.badges[index]) {
            achievementState.badges[index].unlocked = unlocked
          }
        })
      }

      if (Array.isArray(data.quests)) {
        data.quests.forEach((completed, index) => {
          if (questState.quests[index]) {
            questState.quests[index].completed = completed
          }
        })
      }

      chatHistory.value.push({
        role: 'system',
        name: 'SYS',
        text: `欢迎回来，${appState.currentUsername}。云端神经记忆已 100% 同步。`,
      })
      scrollToBottom()
    } catch (error) {
      console.error('加载云端数据失败', error)
    }
  }

  const saveGameData = async () => {
    if (!appState.currentUserId) return

    const payload = {
      id: appState.currentUserId,
      focusCrystals: gameState.focusCrystals,
      baseLevel: gameState.baseLevel,
      stats: { ...achievementState.stats },
      badges: achievementState.badges.map((badge) => badge.unlocked),
      quests: questState.quests.map((quest) => quest.completed),
    }

    try {
      await saveGameArchive(payload)
    } catch (error) {
      console.error('同步云端失败', error)
    }
  }

  return {
    loadGameData,
    saveGameData,
  }
}
