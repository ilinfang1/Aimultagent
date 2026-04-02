import { reactive } from 'vue'

const DEFAULT_QUESTS = [
  { id: 1, title: '背诵 50 个英语单词', reward: 10, completed: false },
  { id: 2, title: '完成一次深度代码重构', reward: 30, completed: false },
  { id: 3, title: '运动打卡 30 分钟', reward: 15, completed: false },
]

function getTodayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function cloneDailyQuests() {
  return DEFAULT_QUESTS.map((item) => ({ ...item }))
}

export function useQuestSystem({ gameState, chatHistory, saveGameData, scrollToBottom }) {
  const questState = reactive({
    dateKey: getTodayKey(),
    quests: cloneDailyQuests(),
  })

  const resetDailyQuestsIfNeeded = () => {
    const today = getTodayKey()
    if (questState.dateKey !== today) {
      questState.dateKey = today
      questState.quests = cloneDailyQuests()
      saveGameData?.()
    }
  }

  const completeQuest = (quest) => {
    resetDailyQuestsIfNeeded()

    const index = questState.quests.findIndex((item) => item.id === quest.id)
    if (index === -1) return

    const target = questState.quests[index]
    if (target.completed) return

    target.completed = true
    gameState.focusCrystals += target.reward

    chatHistory?.value?.push?.({
      role: 'system',
      text: `已完成悬赏令「${target.title}」，获得 ${target.reward} 颗专注水晶。`,
    })

    questState.quests.splice(index, 1)

    saveGameData?.()
    scrollToBottom?.()
  }

  return {
    questState,
    completeQuest,
    resetDailyQuestsIfNeeded,
  }
}