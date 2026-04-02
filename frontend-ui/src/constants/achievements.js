export const DEFAULT_BADGES = [
  { id: 'novice', name: '初入心流', desc: '累计完成 1 次专注', icon: '🌱' },
  { id: 'master', name: '绝对专注', desc: '累计完成 5 次专注', icon: '🔥' },
  { id: 'tea', name: '奶茶神豪', desc: '给学伴买过 1 杯奶茶', icon: '🧋' },
]

export const createBadgeRules = (stats) => ({
  novice: () => stats.focusCount >= 1,
  master: () => stats.focusCount >= 5,
  tea: () => stats.teaCount >= 1,
})
