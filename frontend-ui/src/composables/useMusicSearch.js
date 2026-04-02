import { reactive } from 'vue'
import { buildDirectStreamUrl, getSongDetail, searchMusic } from '../services/api'

function normalizeSearchPayload(payload, source, keyword) {
  if (source === 'kuwo') {
  const rawList = Array.isArray(payload?.data) ? payload.data : []
  return rawList.map((item, index) => ({
    id: item.rid || item.id || `kw_${index}_${Date.now()}`,
    source: 'kuwo',
    sourceId: item.rid || item.id || '',
    sourceIndex: index + 1,
    sourceKeyword: keyword,
    name: item.name || '未知歌曲',
    artist: item.artist || '未知歌手',
    album: item.album || '',
    duration: item.duration || 0,
    cover:
      item.pic ||
      'https://dummyimage.com/300x300/eaeaea/999999.png&text=Music',
    url: '',
    lyric: '',
    lyrics: '',
    lrc: '',
    parsedLyrics: [],
  }))
}

  if (source === 'migu') {
    const rawList =
      (Array.isArray(payload?.data) && payload.data) ||
      payload?.data?.list ||
      payload?.list ||
      []

    return rawList.map((item, index) => ({
      id: `mg_${item.n || index + 1}_${keyword}`,
      source: 'migu',
      sourceId: '',
      sourceIndex: item.n || index + 1,
      sourceKeyword: keyword,
      name: item.title || item.name || '未知歌曲',
      artist: item.singer || item.artist || '未知歌手',
      album: item.album || '',
      duration: item.durationSec || item.duration || 0,
      cover:
        item.cover ||
        'https://dummyimage.com/300x300/eaeaea/999999.png&text=Music',
      url: '',
      lyric: '',
      lyrics: '',
      lrc: '',
      parsedLyrics: [],
    }))
  }

  if (source === '5sing') {
    const rawList = payload?.data?.list || []
    return rawList.map((item, index) => ({
      id: `5sing_${item.song_id || index + 1}_${keyword}`,
      source: '5sing',
      sourceId: item.song_id || '',
      sourceIndex: item.id || index + 1,
      sourceKeyword: keyword,
      name: item.title || '未知歌曲',
      artist: item.singer || '未知歌手',
      album: item.song_type || '',
      duration: 0,
      cover: '',
      url: '',
      lyric: '',
      lyrics: '',
      lrc: '',
      parsedLyrics: [],
    }))
  }

  if (source === 'soda') {
    const data = payload?.data
    if (!data?.url) return []
    return [
      {
        id: `soda_${Date.now()}`,
        source: 'soda',
        sourceId: '',
        sourceIndex: 1,
        sourceKeyword: keyword,
        name: data.title || '汽水音乐',
        artist: data.artistName || '未知歌手',
        album: data.genre || '',
        duration: data.durationSec || 0,
        cover:
          data.cover ||
          'https://dummyimage.com/300x300/eaeaea/999999.png&text=Music',
        url: buildDirectStreamUrl(data.url),
        rawUrl: data.url,
        lyric: '',
        lyrics: '',
        lrc: '',
        parsedLyrics: [],
      },
    ]
  }

  if (source === 'singduck') {
    const data = payload?.data
    if (!data?.audio_url) return []
    return [
      {
        id: `singduck_${data.ugc_id || Date.now()}`,
        source: 'singduck',
        sourceId: data.ugc_id || '',
        sourceIndex: 1,
        sourceKeyword: '',
        name: '随机作品',
        artist: data.nickname || '唱鸭作者',
        album: '',
        duration: 0,
        cover:
          data.avatar ||
          'https://dummyimage.com/300x300/eaeaea/999999.png&text=Music',
        url: buildDirectStreamUrl(data.audio_url),
        rawUrl: data.audio_url,
        lyric: data.lyrics || '',
        lyrics: data.lyrics || '',
        lrc: data.lyrics || '',
        parsedLyrics: [],
      },
    ]
  }

  return []
}

function parseLrc(rawLyric) {
  if (!rawLyric || typeof rawLyric !== 'string') return []

  const lines = rawLyric.split('\n')
  const result = []

  lines.forEach((line) => {
    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g)]
    const text = line.replace(/\[[^\]]+\]/g, '').trim()

    if (!matches.length && text) {
      result.push({ time: 0, text })
      return
    }

    matches.forEach((match) => {
      const minute = Number(match[1] || 0)
      const second = Number(match[2] || 0)
      const msRaw = match[3] || '0'
      const ms = Number(msRaw.padEnd(3, '0'))
      result.push({
        time: minute * 60 + second + ms / 1000,
        text: text || '…',
      })
    })
  })

  return result.sort((a, b) => a.time - b.time)
}

function getSourcePlaceholder(source) {
  if (source === 'soda') return '粘贴汽水音乐分享链接'
  if (source === 'singduck') return '无需输入，点击搜索获取随机作品'
  return '搜索单曲、歌手...'
}

function getSourceButtonTitle(source) {
  if (source === 'singduck') return '获取随机音乐'
  if (source === 'soda') return '解析链接'
  return '搜索歌曲'
}

export function useMusicSearch() {
  const audioEl = new Audio()
  audioEl.preload = 'auto'

  const musicState = reactive({
    source: 'kuwo',
    sourceOptions: [
      { value: 'kuwo', label: '酷我' },
      { value: 'migu', label: '咪咕' },
      { value: '5sing', label: '5sing' },
      { value: 'soda', label: '汽水' },
      { value: 'singduck', label: '唱鸭' },
    ],
    query: '',
    isLoading: false,
    results: [],
    activeSong: null,
    isPlaying: false,
    isPlayerOpen: false,
    error: '',
    currentTime: 0,
    duration: 0,
    progress: 0,
    parsedLyrics: [],
    currentLyricIndex: 0,
    repeatMode: 'off',
    isShuffling: false,
    currentIndex: -1,
  })

  const updateProgressState = () => {
    const current = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0
    const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0

    musicState.currentTime = current
    musicState.duration = duration
    musicState.progress = duration > 0 ? (current / duration) * 100 : 0

    if (musicState.parsedLyrics.length > 0) {
      let activeIndex = 0
      for (let i = 0; i < musicState.parsedLyrics.length; i += 1) {
        if (current >= musicState.parsedLyrics[i].time) activeIndex = i
        else break
      }
      musicState.currentLyricIndex = activeIndex
    }
  }

  const handleMusicSearch = async () => {
    const source = musicState.source
    const keyword = musicState.query.trim()

    if (source !== 'singduck' && !keyword) {
      musicState.results = []
      return
    }

    musicState.isLoading = true
    musicState.error = ''

    try {
      const payload = await searchMusic({
        source,
        keyword,
        size: 12,
      })

      musicState.results = normalizeSearchPayload(payload, source, keyword)
    } catch (error) {
      console.error('搜索音乐失败:', error)
      musicState.results = []
      musicState.error = error.message || '搜索失败'
    } finally {
      musicState.isLoading = false
    }
  }

  const setCurrentIndexBySong = (song) => {
  const index = musicState.results.findIndex(
    (item) =>
      item.id === song.id ||
      item.sourceId === song.sourceId
  )
  musicState.currentIndex = index
}

const getNextIndex = () => {
  const total = musicState.results.length
  if (!total) return -1

  if (musicState.isShuffle) {
    if (total === 1) return 0
    let next = musicState.currentIndex
    while (next === musicState.currentIndex) {
      next = Math.floor(Math.random() * total)
    }
    return next
  }

  const next = musicState.currentIndex + 1
  if (next < total) return next

  if (musicState.repeatMode === 'all') return 0
  return -1
}

const getPrevIndex = () => {
  const total = musicState.results.length
  if (!total) return -1

  if (musicState.isShuffle) {
    if (total === 1) return 0
    let prev = musicState.currentIndex
    while (prev === musicState.currentIndex) {
      prev = Math.floor(Math.random() * total)
    }
    return prev
  }

  const prev = musicState.currentIndex - 1
  if (prev >= 0) return prev

  if (musicState.repeatMode === 'all') return total - 1
  return -1
}

const playNextSong = async () => {
  if (!musicState.results.length) return

  if (musicState.repeatMode === 'one' && musicState.activeSong) {
    audioEl.currentTime = 0
    await audioEl.play()
    return
  }

  const nextIndex = getNextIndex()
  if (nextIndex === -1) {
    musicState.isPlaying = false
    return
  }

  await openMusicPlayer(musicState.results[nextIndex])
}

const playPrevSong = async () => {
  if (!musicState.results.length) return
  const prevIndex = getPrevIndex()
  if (prevIndex === -1) return
  await openMusicPlayer(musicState.results[prevIndex])
}

const toggleShuffle = () => {
  musicState.isShuffle = !musicState.isShuffle
}

const cycleRepeatMode = () => {
  if (musicState.repeatMode === 'off') {
    musicState.repeatMode = 'all'
  } else if (musicState.repeatMode === 'all') {
    musicState.repeatMode = 'one'
  } else {
    musicState.repeatMode = 'off'
  }
}

  const enrichSongData = async (song) => {
  if (song.url && (song.source === 'soda' || song.source === 'singduck')) {
    const lyric = song.lyric || song.lyrics || song.lrc || ''
    return {
      ...song,
      lyric,
      lyrics: lyric,
      lrc: lyric,
      parsedLyrics: parseLrc(lyric),
    }
  }

  const detail = await getSongDetail({
    source: song.source,
    keyword: song.sourceKeyword || '',
    musicId: song.sourceId || song.rid || song.id || '',
    index: song.sourceIndex || '',
    quality: 'p',
  })

  const data = detail?.data || {}
  const lyric = data.lyric || data.lrc || ''

  return {
    ...song,
    name: data.title || data.name || song.name,
    artist: data.artist || data.singer || song.artist,
    cover: data.cover || song.cover,
    album: data.album || song.album,
    url: data.url || '',
    lyric,
    lyrics: lyric,
    lrc: lyric,
    parsedLyrics: parseLrc(lyric),
  }
}

  const openMusicPlayer = async (song) => {
    if (!song) return

    musicState.isLoading = true
    musicState.error = ''

    try {
      const fullSong = await enrichSongData(song)

      if (!fullSong.url) {
        throw new Error('未获取到可播放地址')
      }

      audioEl.pause()
      audioEl.src = fullSong.url
      audioEl.currentTime = 0
      await audioEl.play()

      musicState.activeSong = fullSong
      musicState.parsedLyrics = fullSong.parsedLyrics || []
      musicState.currentLyricIndex = 0
      musicState.isPlaying = true
      musicState.isPlayerOpen = true
      updateProgressState()
    } catch (error) {
      console.error('打开播放器失败:', error)
      musicState.error = error.message || '播放失败'
      musicState.isPlaying = false
    } finally {
      musicState.isLoading = false
    }
  }

  const toggleMusic = async () => {
    if (!musicState.activeSong) return

    try {
      if (musicState.isPlaying) {
        audioEl.pause()
        musicState.isPlaying = false
      } else {
        await audioEl.play()
        musicState.isPlaying = true
      }
    } catch (error) {
      console.error('切换播放状态失败:', error)
      musicState.error = error.message || '播放失败'
    }
  }

  const closeMusicPlayer = () => {
    musicState.isPlayerOpen = false
  }

  const seekMusic = (percent) => {
    if (!Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return
    audioEl.currentTime = Math.max(
      0,
      Math.min(audioEl.duration, (percent / 100) * audioEl.duration)
    )
    updateProgressState()
  }

  const formatAudioTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
    const minute = Math.floor(seconds / 60)
    const second = Math.floor(seconds % 60)
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  }

  audioEl.addEventListener('play', () => {
    musicState.isPlaying = true
  })

  audioEl.addEventListener('pause', () => {
    musicState.isPlaying = false
  })

  audioEl.addEventListener('ended', async () => {
    musicState.progress = 100
    await playNextSong()
  })

  audioEl.addEventListener('loadedmetadata', updateProgressState)
  audioEl.addEventListener('timeupdate', updateProgressState)
  audioEl.addEventListener('durationchange', updateProgressState)

  return {
    musicState,
    handleMusicSearch,
    openMusicPlayer,
    toggleMusic,
    closeMusicPlayer,
    seekMusic,
    formatAudioTime,
    getSourcePlaceholder,
    getSourceButtonTitle,
    playNextSong,
    playPrevSong,
    toggleShuffle,
    cycleRepeatMode,
  }
}