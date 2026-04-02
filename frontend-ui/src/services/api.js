const API_BASE_URL = 'http://localhost:8080'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.msg || `Request failed: ${response.status}`
    throw new Error(message)
  }

  return payload
}

export const authLogin = (body) =>
  request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const authRegister = (body) =>
  request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const loadGameArchive = (userId) => request(`/api/game/load?userId=${userId}`)

export const saveGameArchive = (body) =>
  request('/api/game/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const fetchFocusStats = (userId) => request(`/api/record/stats?userId=${userId}`)

export const addFocusRecord = (body) =>
  request('/api/record/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const sendGameChat = (body) =>
  request('/api/game/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

/* =========================
 * 音乐统一代理接口
 * ========================= */

export const searchMusic = ({
  source,
  keyword,
  size = 12,
}) =>
  request(
    `/api/music/search?source=${encodeURIComponent(source)}&keyword=${encodeURIComponent(
      keyword || ''
    )}&size=${size}`
  )

export const getSongDetail = ({
  source,
  keyword = '',
  musicId = '',
  index = '',
  quality = 'p',
}) =>
  request(
    `/api/music/detail?source=${encodeURIComponent(source)}&keyword=${encodeURIComponent(
      keyword
    )}&musicId=${encodeURIComponent(musicId)}&index=${encodeURIComponent(
      index
    )}&quality=${encodeURIComponent(quality)}`
  )

export const buildDirectStreamUrl = (remoteUrl) =>
  `${API_BASE_URL}/api/music/stream/direct?url=${encodeURIComponent(remoteUrl)}`

export const getRealtimeBoxOffice = () => request('/api/boxoffice/realtime')
export const synthesizeSpeech = ({ text, voiceType = 'female_zhubo' }) =>
  request(
    `/api/tts/speak?text=${encodeURIComponent(text)}&voiceType=${encodeURIComponent(voiceType)}`
  )