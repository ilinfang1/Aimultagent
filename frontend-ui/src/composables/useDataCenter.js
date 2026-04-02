import { reactive } from 'vue'
import { fetchFocusStats } from '../services/api'

export function useDataCenter({ appState }) {
  const dataCenter = reactive({
    isOpen: false,
    isLoading: false,
    heatmap: [],
    recentRecords: [],
  })

  const openDataCenter = async () => {
    dataCenter.isOpen = true
    dataCenter.isLoading = true

    try {
      const result = await fetchFocusStats(appState.currentUserId)

      if (result?.code !== 200) return

      dataCenter.recentRecords = Array.isArray(result?.data?.recentRecords) ? result.data.recentRecords : []

      const statsMap = new Map()
      if (Array.isArray(result?.data?.heatmapData)) {
        result.data.heatmapData.forEach((item) => {
          const date = new Date(item.date).toISOString().split('T')[0]
          statsMap.set(date, Number(item.totalMinutes))
        })
      }

      const grid = []
      for (let index = 34; index >= 0; index -= 1) {
        const date = new Date()
        date.setDate(date.getDate() - index)
        const dateString = date.toISOString().split('T')[0]
        const minutes = statsMap.get(dateString) || 0

        let level = 0
        if (minutes > 0 && minutes <= 25) level = 1
        else if (minutes > 25 && minutes <= 60) level = 2
        else if (minutes > 60) level = 3

        grid.push({ date: dateString, minutes, level })
      }

      dataCenter.heatmap = grid
    } catch (error) {
      console.error(error)
    } finally {
      dataCenter.isLoading = false
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return {
    dataCenter,
    openDataCenter,
    formatDate,
  }
}
