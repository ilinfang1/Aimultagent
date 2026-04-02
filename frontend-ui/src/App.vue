<template>
  <div class="apple-os" :class="themeClass" :style="{ '--lamp-focus-color': currentLampColor }">
    <div class="sys-base-bg"></div>
    <div
      class="dynamic-time-bg"
      :style="{ background: envState.skyStyle }"
      v-if="appState.isLoggedIn && gameState.baseLevel === 1"
    ></div>
    <div class="aurora-bg" v-if="appState.isLoggedIn && gameState.baseLevel >= 3"></div>
    <div class="auth-aurora-bg" v-if="!appState.isLoggedIn"></div>

    <div class="lamp-auth-wrapper" v-if="!appState.isLoggedIn">
      <div class="lamp-card apple-glass">
        <div class="card-header">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" class="app-icon">
            <path
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
            />
          </svg>
          <h1 class="card-title">学伴 OS</h1>
          <p class="card-subtitle">数字自律避难所</p>
        </div>

        <div class="lamp-visual-area">
          <svg viewBox="0 0 400 280" class="lamp-svg">
            <defs>
              <linearGradient id="lightBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="currentLampColor" stop-opacity="0.6" />
                <stop offset="100%" :stop-color="currentLampColor" stop-opacity="0.0" />
              </linearGradient>

              <filter id="neonGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.4" />
              </filter>

              <linearGradient id="lampOff" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#48484a" />
                <stop offset="100%" stop-color="#2c2c2e" />
              </linearGradient>
            </defs>

            <line x1="200" y1="0" x2="200" y2="40" stroke="#3a3a3c" stroke-width="4" />
            <polygon
              points="160,105 240,105 380,280 20,280"
              fill="url(#lightBeam)"
              class="light-beam"
              :class="{ 'is-on': isLampOn }"
            />
            <rect
              x="120"
              y="40"
              width="160"
              height="70"
              rx="35"
              :fill="isLampOn ? currentLampColor : 'url(#lampOff)'"
              class="lamp-shade"
              :style="isLampOn ? 'filter: url(#neonGlow);' : ''"
            />

            <g v-if="!isLampOn" stroke="#1c1c1e" stroke-width="3.5" fill="none" stroke-linecap="round">
              <path d="M 175 75 Q 185 82 195 75" />
              <path d="M 205 75 Q 215 82 225 75" />
            </g>

            <g v-else fill="#1c1c1e">
              <circle cx="182" cy="70" r="5" />
              <circle cx="218" cy="70" r="5" />
              <path d="M 195 82 Q 200 90 205 82" stroke="#1c1c1e" stroke-width="3" fill="none" stroke-linecap="round" />
            </g>

            <g class="string-group">
              <path
                :d="`M 200 110 Q ${200 + pullDx * 0.4} ${140 + pullDy * 0.4} ${200 + pullDx} ${170 + pullDy}`"
                stroke="#636366"
                stroke-width="3"
                fill="none"
                stroke-linecap="round"
              />
              <circle
                :cx="200 + pullDx"
                :cy="170 + pullDy"
                r="14"
                fill="#ffffff"
                filter="url(#dropShadow)"
                class="pull-handle"
                @mousedown="startPull"
                @touchstart.prevent="startPull"
              />
            </g>
          </svg>
        </div>

        <div class="auth-form-glow" :class="{ 'is-visible': isLampOn }">
          <form class="apple-inputs-group" @submit.prevent="handleAuth">
            <div class="input-wrapper">
              <input v-model="authForm.username" type="text" placeholder="你的代号" class="apple-input-modern" />
            </div>
            <div class="input-wrapper">
              <input v-model="authForm.password" type="password" placeholder="专属密码" class="apple-input-modern" />
            </div>
          </form>

          <p v-if="authError" class="apple-error-msg">{{ authError }}</p>

          <button
            class="apple-submit-btn"
            :class="isLoginMode ? 'btn-blue' : 'btn-white'"
            @click="handleAuth"
            :disabled="isAuthLoading"
          >
            <span v-if="isAuthLoading" class="loader"></span>
            <span v-else>{{ isLoginMode ? '接 入' : '注 册' }}</span>
          </button>

          <p class="toggle-mode-text" @click="toggleAuthMode">
            {{ isLoginMode ? '没有通行证？点击注册' : '已有通行证？点击登录' }}
          </p>
        </div>
      </div>
    </div>

    <div class="game-wrapper" :class="{ 'ui-shake': isShaking }" v-else>
      <nav class="apple-nav">
        <div class="nav-content">
          <div class="logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
              />
            </svg>
            <span>学伴 OS <span class="user-badge">{{ appState.currentUsername }}</span></span>
          </div>

          <div class="nav-actions">
            <button class="icon-btn" @click="toggleAgentMonitor" :class="{ 'active-icon': agentMonitor.isOpen }" title="神经监控矩阵">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            <span class="weather" :title="envState.desc">{{ envState.temp }} {{ envState.icon }}</span>

            <div class="audio-station-wrapper">
              <button class="icon-btn" @click="toggleAudioPanel" :class="{ 'active-icon': audioState.isOpen || audioState.isPlaying }" title="环境白噪音">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                <span v-if="audioState.isPlaying" class="playing-dot dot-red"></span>
              </button>

              <transition name="fade-scale">
                <div v-if="audioState.isOpen" class="audio-panel apple-glass">
                  <div class="audio-header">
                    <h4>频率同调</h4>
                    <button class="close-btn-small" @click="audioState.isOpen = false">×</button>
                  </div>

                  <div class="track-list">
                    <div
                      v-for="track in audioState.tracks"
                      :key="track.id"
                      class="track-item"
                      :class="{ active: audioState.currentTrack?.id === track.id && audioState.isPlaying }"
                      @click="playTrack(track)"
                    >
                      <span class="track-icon">{{ track.icon }}</span>
                      <span class="track-name">{{ track.name }}</span>
                      <div v-if="audioState.currentTrack?.id === track.id && audioState.isPlaying" class="wave-anim">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>

                  <div class="volume-control" v-if="audioState.currentTrack">
                    <span class="vol-icon">🔉</span>
                    <input type="range" min="0" max="1" step="0.05" :value="audioState.volume" @input="updateVolume" class="apple-slider" />
                    <span class="vol-icon">🔊</span>
                  </div>
                </div>
              </transition>
            </div>

            <span class="time">{{ currentTime }}</span>

            <button class="icon-btn" @click="toggleVoice" :class="{ muted: !isVoiceOn }" title="语音开关">
              <svg
                v-if="isVoiceOn"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              </svg>
            </button>

            <button class="icon-btn logout-btn" @click="handleLogout" title="退出登录">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div class="main-layout-row">
        <aside class="left-sidebar apple-glass">
          <div class="sidebar-section music-section">
            <div class="sidebar-header">
              <h4>🎵 音乐矩阵</h4>
            </div>

            <div class="search-bar">
            <select v-model="musicState.source" class="source-select">
              <option
                v-for="option in musicState.sourceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <input
              v-model="musicState.query"
              @keyup.enter="handleMusicSearch"
              :placeholder="getSourcePlaceholder(musicState.source)"
              class="apple-input-modern music-search-input"
            />

            <button
              @click="handleMusicSearch"
              class="search-btn"
              :disabled="musicState.isLoading"
              :title="getSourceButtonTitle(musicState.source)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

            <div class="search-results">
              <div v-if="musicState.isLoading" class="data-loading">连接全球音源中...</div>
              <div v-else-if="musicState.results.length === 0" class="empty-state">输入关键字寻找心流旋律</div>
              <div v-for="song in musicState.results" :key="song.id" class="song-row" @click="playSongInline(song)">
                <div class="song-info-mini">
                  <span class="song-name">{{ song.name }}</span>
                  <span class="song-artist">{{ song.artist }}</span>
                </div>
                <span class="play-icon">▶</span>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <div
              v-if="questState.quests && questState.quests.length > 0"
              class="sidebar-section quest-section"
            >
              <div class="sidebar-header">
                <h4>📋 每日悬赏令</h4>
              </div>

              <div class="quest-list">
                <div
                  v-for="quest in questState.quests"
                  :key="quest.id"
                  class="quest-item"
                  :class="{ 'is-completed': quest.completed }"
                >
                  <button
                    class="check-circle"
                    @click.stop="completeQuest(quest)"
                    :disabled="quest.completed"
                    :title="quest.completed ? '已完成' : '点击完成任务'"
                  >
                    <svg
                      v-if="quest.completed"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>

                  <div class="quest-info">
                    <span class="quest-title">{{ quest.title }}</span>
                    <span class="quest-reward">💎 +{{ quest.reward }}</span>
                    <span v-if="quest.completed" class="quest-status-text">已完成</span>
                  </div>
                </div>
              </div>
            </div>

          <div class="mini-player" v-if="musicState.activeSong">
            <div class="mini-player-top">
              <div class="mini-player-info">
                <img :src="musicState.activeSong.cover" class="mini-cover" :class="{ 'is-playing': musicState.isPlaying }" />
                <div class="mini-text">
                  <span class="mini-name">{{ musicState.activeSong.name }}</span>
                  <span class="mini-artist">{{ musicState.activeSong.artist }}</span>
                </div>
              </div>

              <div class="mini-player-actions">
                <!-- <button
                  @click="toggleShuffle"
                  class="mini-expand-btn"
                  :class="{ active: musicState.isShuffle }"
                  title="随机播放"
                >
                  🔀
                </button> -->

                <!-- <button @click="playPrevSong" class="mini-expand-btn" title="上一首">
                  ⏮
                </button> -->

                <button @click="toggleMusic" class="mini-play-btn" title="播放 / 暂停">
                  <svg v-if="musicState.isPlaying" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                <button @click="playNextSong" class="mini-expand-btn" title="下一首">
                  ⏭
                </button>

                <button
                  @click="cycleRepeatMode"
                  class="mini-expand-btn"
                  :class="{ active: musicState.repeatMode !== 'off' }"
                  :title="`循环模式：${musicState.repeatMode}`"
                >
                  {{ musicState.repeatMode === 'one' ? '🔂' : '🔁' }}
                </button>

                <button @click="musicState.isPlayerOpen = true" class="mini-expand-btn" title="展开播放器">
                  ⤢
                </button>
              </div>
            </div>

            <div class="mini-progress-wrap">
              <input
                class="mini-progress-slider"
                type="range"
                min="0"
                max="100"
                step="0.1"
                :value="musicState.progress"
                @input="onMiniProgressChange"
              />
              <div class="mini-progress-time">
                <span>{{ formatAudioTime(musicState.currentTime) }}</span>
                <span>{{ formatAudioTime(musicState.duration) }}</span>
              </div>
            </div>
          </div>

          <!-- <div class="lyrics-panel apple-card" v-if="musicState.activeSong">
            <div class="lyrics-header">
              <div class="lyrics-title-wrap">
                <span class="lyrics-title">歌词滚动</span>
                <span class="lyrics-subtitle">{{ musicState.activeSong.name }} · {{ musicState.activeSong.artist }}</span>
              </div>
            </div>

            <div class="lyrics-marquee" v-if="musicState.parsedLyrics && musicState.parsedLyrics.length">
              <div
                v-for="(line, index) in visibleLyrics"
                :key="`${musicState.currentLyricIndex}-${index}-${line}`"
                class="lyric-line"
                :class="{ active: index === 2 }"
              >
                {{ line }}
              </div>
            </div>

            <div class="lyrics-empty" v-else>
              当前歌曲暂无歌词。你可以先看控制台里打印的“歌词原始返回”，确认接口字段结构。
            </div>
          </div> -->
        </aside>
        

        <main class="main-container">
          <transition name="slide-down">
            <div v-if="agentMonitor.isOpen" class="agent-monitor-panel apple-glass">
              <div class="monitor-header">
                <h3>🖥️ 多智能体监控矩阵</h3>
                <button class="close-btn" @click="agentMonitor.isOpen = false">×</button>
              </div>

              <div class="master-thought-box">
                <span class="label">🧠 总管家决策流：</span>
                <p class="thought-text">{{ agentMonitor.masterThought }}</p>
              </div>

              <div class="agent-list">
                <div
                  v-for="agent in agentMonitor.agents"
                  :key="agent.id"
                  class="agent-item"
                  :class="{ 'is-active': agent.status.includes('活跃') }"
                >
                  <img :src="agent.avatar" :class="['mini-avatar', 'avatar-' + agent.id]" />
                  <div class="agent-details">
                    <div class="agent-name">
                      {{ agent.name }}
                      <span class="badge" :class="{ 'bg-red': agent.id === 'Ling', 'bg-purple': agent.id === 'Rou', 'bg-blue': agent.id === 'Zhi' }">
                        {{ agent.id }}
                      </span>
                    </div>
                    <div class="agent-action">{{ agent.activity }}</div>
                  </div>
                  <div class="status-indicator">
                    <span class="dot" :class="{ blink: agent.status.includes('活跃') }"></span>
                    <span class="status-text">{{ agent.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          
          
          <section class="hero-section">
            <h1 class="hero-title">保持专注，心无旁骛。</h1>
            <p class="hero-subtitle">掌控你的时间，进入极致心流。</p>

            <div class="timer-wrapper">
              <div class="timer-circle" :class="{ 'is-running': timerState.isRunning }">
                <span class="time-display">
                  {{ formatTime(timerState.isRunning ? timerState.remainingTime : targetDuration) }}
                </span>
              </div>
            </div>

            <div class="hero-actions">
              <input
                v-model="gameState.currentTask"
                placeholder="今天想完成什么挑战？ (例如：写论文)"
                class="apple-input hero-input"
                :disabled="timerState.isRunning"
              />

              <div class="ai-estimate" v-if="gameState.currentTask && !timerState.isRunning">
                <button class="adjust-btn" @click="adjustTime(-300)" :disabled="targetDuration <= 300">-</button>
                <span>✨ AI 评估：设定为 {{ targetDuration / 60 }} 分钟</span>
                <button class="adjust-btn" @click="adjustTime(300)">+</button>
              </div>

              <div class="btn-group">
                <button v-if="!timerState.isRunning" @click="startTimer" class="apple-btn btn-primary" :disabled="!gameState.currentTask">
                  开始专注
                </button>
                <button v-else @click="stopTimer" class="apple-btn btn-danger">结束专注</button>
              </div>
            </div>
          </section>

          <section class="companion-section">
            <div class="chat-container apple-card">
              <div class="chat-header">
                <div class="avatars">
                  <img
                    v-if="currentSpeaker === '林夏'"
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=Lily&backgroundColor=fce4ec"
                    class="avatar-img"
                  />
                  <img
                    v-else-if="currentSpeaker === '苏婉'"
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=Sophia&backgroundColor=f3e8ff"
                    class="avatar-img"
                  />
                  <img
                    v-else-if="currentSpeaker === '智'"
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=e0f2fe"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">OS</div>
                </div>

                <div class="contact-info">
                  <div class="contact-name-row">
                    <span class="contact-name">{{ currentSpeaker }}</span>
                    <div class="voice-visualizer" v-if="isAiSpeaking" :class="speakerColorClass">
                      <span class="bar bar-1"></span>
                      <span class="bar bar-2"></span>
                      <span class="bar bar-3"></span>
                      <span class="bar bar-4"></span>
                      <span class="bar bar-5"></span>
                    </div>
                  </div>
                  <span class="contact-status">{{ isAiSpeaking ? '正在语音回复...' : 'iMessage' }}</span>
                </div>
              </div>

              <div class="chat-window" ref="chatLog">
                <transition-group name="msg-pop">
                  <div v-for="(msg, index) in chatHistory" :key="index" class="msg-wrapper" :class="msg.role">
                    <div v-if="msg.role === 'system'" class="timestamp">{{ msg.text }}</div>
                    <div v-else class="bubble">
                      <img v-if="msg.image" :src="msg.image" class="chat-img-display" alt="上传的图片" />
                      {{ msg.text }}
                    </div>
                  </div>
                </transition-group>

                <div v-if="isLoading" class="msg-wrapper linxia">
                  <div class="bubble typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>

              <div class="image-preview-area" v-if="selectedImageBase64">
                <img :src="selectedImageBase64" class="preview-img" />
                <button class="remove-img-btn" @click="selectedImageBase64 = null">×</button>
              </div>

              <div class="chat-input-area">
                <input type="file" ref="fileInput" @change="handleImageSelected" accept="image/*" style="display: none" />
                <button class="icon-btn action-btn" @click="$refs.fileInput.click()" title="上传作业/截图">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                <button class="icon-btn action-btn mic-btn" :class="{ 'is-recording': isRecording }" @click="toggleRecording" title="语音识别对线">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>

                <input
                  v-model="playerInput"
                  @keyup.enter="handleUserMessage"
                  :disabled="isLoading"
                  :placeholder="isRecording ? '正在倾听您的声音...' : '汇报进度或发图验收...'"
                  class="apple-input chat-input"
                />
                <button
                  @click="handleUserMessage"
                  :disabled="isLoading || (!playerInput.trim() && !selectedImageBase64)"
                  class="send-btn"
                  :class="{ active: playerInput.trim() || selectedImageBase64 }"
                >
                  ↑
                </button>
              </div>
            </div>
          </section>

          <section class="stats-section">
            <div class="stats-grid">
              <div class="apple-card stat-card">
                <div class="stat-icon bg-blue">💎</div>
                <div class="stat-info">
                  <h3>专注水晶</h3>
                  <p class="stat-value">{{ gameState.focusCrystals }}</p>
                </div>
              </div>

              <div class="apple-card stat-card hoverable" @click="gameState.showShop = true">
                <div class="stat-icon bg-orange">🛠️</div>
                <div class="stat-info">
                  <h3>基地等级</h3>
                  <p class="stat-value">Lv.{{ gameState.baseLevel }}</p>
                </div>
                <div class="chevron">›</div>
              </div>

              <div class="apple-card stat-card hoverable" @click="openDataCenter">
                <div class="stat-icon bg-green">📊</div>
                <div class="stat-info">
                  <h3>数据洞察</h3>
                  <p class="stat-value" style="font-size: 16px; margin-top: 6px; color: var(--ai-blue)">查看热力图</p>
                </div>
                <div class="chevron">›</div>
              </div>

              <div class="apple-card stat-card hoverable" @click="achievementState.isOpen = true">
                <div class="stat-icon bg-purple">🏆</div>
                <div class="stat-info">
                  <h3>荣誉殿堂</h3>
                  <p class="stat-value" style="font-size: 16px; margin-top: 6px; color: #af52de">成就徽章</p>
                </div>
                <div class="chevron">›</div>
              </div>
            </div>
          </section>
        </main>
        <section class="boxoffice-section apple-card">
            <div class="boxoffice-header">
              <div>
                <h3>🎬 实时电影票房</h3>
                <p class="boxoffice-date" v-if="boxOfficeState.date">更新时间：{{ boxOfficeState.date }}</p>
              </div>
              <button class="boxoffice-refresh-btn" @click="loadBoxOffice">刷新</button>
            </div>

            <div v-if="boxOfficeState.isLoading" class="boxoffice-loading">
              正在获取实时票房...
            </div>

            <div v-else-if="boxOfficeState.error" class="boxoffice-error">
              {{ boxOfficeState.error }}
            </div>

            <div v-else class="boxoffice-list">
              <div
                v-for="movie in boxOfficeState.list.slice(0, 8)"
                :key="movie.rank"
                class="boxoffice-item"
              >
                <div class="boxoffice-rank">#{{ movie.rank }}</div>

                <div class="boxoffice-main">
                  <div class="boxoffice-name">{{ movie.name }}</div>
                  <div class="boxoffice-meta">{{ movie.release_info }}</div>
                </div>

                <div class="boxoffice-right">
                  <div class="boxoffice-money">{{ movie.box_office }}</div>
                  <div class="boxoffice-rate">票房占比 {{ movie.box_rate }}</div>
                </div>
              </div>
            </div>
          </section>
      </div>

      <transition name="full-screen-pop">
        <div v-if="musicState.isPlayerOpen" class="music-full-screen">
          <div class="music-bg" :style="{ backgroundImage: `url(${musicState.activeSong?.cover})` }"></div>
          <div class="music-overlay"></div>

          <div class="music-content">
            <button class="close-player" @click="closeMusicPlayer" title="收起播放器">↓</button>
            <div class="disk-area" :class="{ 'is-playing': musicState.isPlaying }">
              <div class="disk-vinyl"></div>
              <img :src="musicState.activeSong?.cover" class="disk-cover" />
            </div>
            <div class="song-meta-large">
              <h2>{{ musicState.activeSong?.name }}</h2>
              <p>{{ musicState.activeSong?.artist }}</p>
            </div>

            <div class="fullscreen-lyrics" v-if="musicState.parsedLyrics && musicState.parsedLyrics.length">
              <div
                v-for="(line, index) in visibleLyrics"
                :key="`fs-${musicState.currentLyricIndex}-${index}-${line}`"
                class="fullscreen-lyric-line"
                :class="{ active: index === 2 }"
              >
                {{ line }}
              </div>
            </div>

            <div class="player-controls-large">
              <button @click="toggleShuffle" class="mini-expand-btn" :class="{ active: musicState.isShuffle }" title="随机播放">
                🔀
              </button>

              <button @click="playPrevSong" class="mini-expand-btn" title="上一首">
                ⏮
              </button>

              <button @click="toggleMusic" class="play-btn-large">
                <svg v-if="musicState.isPlaying" viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              <button @click="playNextSong" class="mini-expand-btn" title="下一首">
                ⏭
              </button>

              <button
                @click="cycleRepeatMode"
                class="mini-expand-btn"
                :class="{ active: musicState.repeatMode !== 'off' }"
                :title="`循环模式：${musicState.repeatMode}`"
              >
                {{ musicState.repeatMode === 'one' ? '🔂' : '🔁' }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade-scale">
        <div v-if="gameState.showShop" class="modal-overlay" @click.self="gameState.showShop = false">
          <div class="apple-modal">
            <div class="modal-header">
              <h2>基建升级与商城</h2>
              <button class="close-btn" @click="gameState.showShop = false">×</button>
            </div>

            <p class="balance-text">当前余额: <strong>{{ gameState.focusCrystals }} 颗水晶</strong></p>

            <div class="store-list">
              <div class="store-item" :class="{ disabled: gameState.baseLevel >= 2 }">
                <div class="item-text">
                  <h4>专业工作站 (Lv.2)</h4>
                  <p>永久深色模式，专注护眼。</p>
                </div>
                <button @click="buyItem('base2', 100)" class="apple-btn btn-small" :disabled="gameState.baseLevel >= 2">
                  {{ gameState.baseLevel >= 2 ? '已拥有' : '100 水晶' }}
                </button>
              </div>

              <div class="store-item" :class="{ disabled: gameState.baseLevel >= 3 }">
                <div class="item-text">
                  <h4>量子沉浸舱 (Lv.3)</h4>
                  <p>解锁顶级极光沉浸背景。</p>
                </div>
                <button
                  @click="buyItem('base3', 300)"
                  class="apple-btn btn-small"
                  :disabled="gameState.baseLevel >= 3 || gameState.baseLevel < 2"
                >
                  {{ gameState.baseLevel >= 3 ? '已拥有' : gameState.baseLevel < 2 ? '需先达 Lv.2' : '300 水晶' }}
                </button>
              </div>

              <div class="store-item">
                <div class="item-text">
                  <h4>冰镇珍珠奶茶</h4>
                  <p>送给学伴触发感激剧情。</p>
                </div>
                <button @click="buyItem('gift_tea', 25)" class="apple-btn btn-small btn-secondary">25 水晶</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade-scale">
        <div v-if="dataCenter.isOpen" class="modal-overlay" @click.self="dataCenter.isOpen = false">
          <div class="apple-modal data-modal">
            <div class="modal-header">
              <h2>神经档案洞察</h2>
              <button class="close-btn" @click="dataCenter.isOpen = false">×</button>
            </div>

            <div v-if="dataCenter.isLoading" class="data-loading">正在读取神经矩阵...</div>

            <div v-else class="data-content">
              <div class="heatmap-section">
                <h4 class="section-title">最近 35 天专注轨迹</h4>
                <div class="heatmap-container">
                  <div class="heatmap-grid">
                    <div
                      v-for="(day, index) in dataCenter.heatmap"
                      :key="index"
                      class="heat-cell"
                      :class="`level-${day.level}`"
                      :title="`${day.date}: 专注 ${day.minutes} 分钟`"
                    ></div>
                  </div>

                  <div class="heatmap-legend">
                    <span>少</span>
                    <div class="heat-cell level-0"></div>
                    <div class="heat-cell level-1"></div>
                    <div class="heat-cell level-2"></div>
                    <div class="heat-cell level-3"></div>
                    <span>多</span>
                  </div>
                </div>
              </div>

              <div class="timeline-section">
                <h4 class="section-title">近期专注明细</h4>
                <div class="timeline-list" v-if="dataCenter.recentRecords.length > 0">
                  <div class="timeline-item" v-for="record in dataCenter.recentRecords" :key="record.id">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="record-head">
                        <span class="record-task">{{ record.taskName }}</span>
                        <span class="record-time">+{{ record.durationMinutes }} 分钟</span>
                      </div>
                      <div class="record-date">{{ formatDate(record.createTime) }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-state">尚未留下任何专注痕迹，去完成一个挑战吧！</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade-scale">
        <div v-if="achievementState.isOpen" class="modal-overlay" @click.self="achievementState.isOpen = false">
          <div class="apple-modal badge-modal">
            <div class="modal-header">
              <h2>荣誉殿堂</h2>
              <button class="close-btn" @click="achievementState.isOpen = false">×</button>
            </div>

            <div class="badge-grid">
              <div v-for="badge in achievementState.badges" :key="badge.id" class="badge-card" :class="{ locked: !badge.unlocked }">
                <div class="badge-icon-wrapper"><span class="badge-icon">{{ badge.icon }}</span></div>
                <h4 class="badge-name">{{ badge.name }}</h4>
                <p class="badge-desc">{{ badge.desc }}</p>
                <div class="badge-status">{{ badge.unlocked ? '已解锁' : '未达成' }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed ,onMounted ,reactive } from 'vue'
import { useStudyCompanionApp } from './composables/useStudyCompanionApp'
import { getRealtimeBoxOffice } from './services/api'

const {
  appState,
  isLoginMode,
  isAuthLoading,
  authError,
  authForm,
  toggleAuthMode,
  handleAuth,
  handleLogout,
  agentMonitor,
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
  questState,
  completeQuest,
  toggleAudioPanel,
  toggleAgentMonitor,
  isLampOn,
  pullDx,
  pullDy,
  currentLampColor,
  startPull,
  audioState,
  playTrack,
  updateVolume,
  achievementState,
  dataCenter,
  openDataCenter,
  formatDate,
  playerInput,
  isLoading,
  chatLog,
  currentSpeaker,
  currentTime,
  gameState,
  isShaking,
  envState,
  themeClass,
  targetDuration,
  adjustTime,
  chatHistory,
  timerState,
  formatTime,
  startTimer,
  stopTimer,
  buyItem,
  isVoiceOn,
  toggleVoice,
  isAiSpeaking,
  speakerColorClass,
  fileInput,
  selectedImageBase64,
  handleImageSelected,
  isRecording,
  toggleRecording,
  handleUserMessage,
} = useStudyCompanionApp()


const boxOfficeState = reactive({
  isLoading: false,
  error: '',
  date: '',
  list: [],
})

const loadBoxOffice = async () => {
  boxOfficeState.isLoading = true
  boxOfficeState.error = ''

  try {
    const res = await getRealtimeBoxOffice()
    const data = res?.data || {}

    boxOfficeState.date = data?.date || ''
    boxOfficeState.list = Array.isArray(data?.list) ? data.list : []
  } catch (error) {
    console.error('获取实时票房失败:', error)
    boxOfficeState.error = error.message || '加载失败'
    boxOfficeState.list = []
  } finally {
    boxOfficeState.isLoading = false
  }
}

onMounted(() => {
  loadBoxOffice()
})

const playSongInline = async (song) => {
  await openMusicPlayer(song)
  setTimeout(() => {
    musicState.isPlayerOpen = false
  }, 20)
}

const visibleLyrics = computed(() => {
  const lines = musicState.parsedLyrics || []
  const currentIndex = musicState.currentLyricIndex || 0

  if (!lines.length) return []

  const result = []
  for (let i = -2; i <= 2; i += 1) {
    const line = lines[currentIndex + i]
    result.push(line ? line.text : ' ')
  }
  return result
})

const onMiniProgressChange = (event) => {
  const percent = Number(event.target.value || 0)
  seekMusic(percent)
}
</script>

<style src="./styles/app.css"></style>