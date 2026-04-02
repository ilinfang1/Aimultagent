import { reactive } from 'vue'
import { DEFAULT_BADGES, createBadgeRules } from '../constants/achievements'

export function useAchievements() {
  const stats = reactive({
    focusCount: 0,
    teaCount: 0,
  })

  const badgeRules = createBadgeRules(stats)

  const achievementState = reactive({
    isOpen: false,
    stats,
    badges: DEFAULT_BADGES.map((badge) => ({
      ...badge,
      unlocked: false,
      req: badgeRules[badge.id],
    })),
  })

  const checkAchievements = ({ chatHistory, saveGameData, scrollToBottom } = {}) => {
    let newlyUnlocked = false

    achievementState.badges.forEach((badge) => {
      if (!badge.unlocked && badge.req()) {
        badge.unlocked = true
        newlyUnlocked = true
        chatHistory?.value.push({
          role: 'system',
          name: 'SYS',
          text: `🏆 解锁隐藏成就：【${badge.name}】`,
        })
      }
    })

    if (newlyUnlocked) {
      saveGameData?.()
      scrollToBottom?.()
    }
  }

  return {
    achievementState,
    checkAchievements,
  }
}
