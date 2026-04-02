import { reactive } from 'vue'

export function useAmbientAudio() {
  const audioPlayer = new Audio()
  audioPlayer.loop = true
  audioPlayer.preload = 'auto'
  audioPlayer.crossOrigin = 'anonymous'

  const audioState = reactive({
    isOpen: false,
    isPlaying: false,
    currentTrack: null,
    volume: 0.55,
    tracks: [
      {
        id: 'rain',
        name: '淅沥细雨',
        icon: '🌧️',
        url: '/audio/rain.mp3',
      },
      {
        id: 'forest',
        name: '晨间森林',
        icon: '🌲',
        url: '/audio/forest.mp3',
      },
      {
        id: 'fire',
        name: '深夜篝火',
        icon: '🔥',
        url: '/audio/fire.mp3',
      },
    ],
  })

  audioPlayer.volume = audioState.volume

  const playTrack = async (track) => {
    if (!track?.url) return

    try {
      if (audioState.currentTrack?.id === track.id && audioState.isPlaying) {
        audioPlayer.pause()
        audioState.isPlaying = false
        return
      }

      audioPlayer.src = track.url
      audioPlayer.volume = audioState.volume
      await audioPlayer.play()

      audioState.currentTrack = track
      audioState.isPlaying = true
    } catch (error) {
      console.error('播放白噪音失败:', error)
      audioState.isPlaying = false
    }
  }

  const updateVolume = (event) => {
    const value = Number(event.target.value)
    audioState.volume = value
    audioPlayer.volume = value
  }

  audioPlayer.addEventListener('pause', () => {
    audioState.isPlaying = false
  })

  audioPlayer.addEventListener('play', () => {
    audioState.isPlaying = true
  })

  return {
    audioState,
    audioPlayer,
    playTrack,
    updateVolume,
  }
}