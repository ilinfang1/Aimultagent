import { reactive } from 'vue'

function createAgents() {
  return {
    Ling: {
      name: '林夏',
      id: 'Ling',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Lily&backgroundColor=fce4ec',
      status: '待命',
      activity: '监控专注数据',
    },
    Rou: {
      name: '苏婉',
      id: 'Rou',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sophia&backgroundColor=f3e8ff',
      status: '待命',
      activity: '整理心情日志',
    },
    Zhi: {
      name: '智',
      id: 'Zhi',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=e0f2fe',
      status: '待命',
      activity: '推演高维模型',
    },
  }
}

export function useAgentMonitor() {
  const agentMonitor = reactive({
    isOpen: false,
    masterThought: '系统休眠中，等待主宰下达指令...',
    agents: createAgents(),
  })

  const markSyncing = () => {
    agentMonitor.masterThought = '神经信号传输中...'
    Object.keys(agentMonitor.agents).forEach((key) => {
      agentMonitor.agents[key].status = '同步中'
      agentMonitor.agents[key].activity = '接收环境变量...'
    })
  }

  const applyAiState = (aiData) => {
    agentMonitor.masterThought = aiData.master_thought || '已完成决策路线。'

    const activeId = aiData.active_speaker === 'Rou'
      ? 'Rou'
      : aiData.active_speaker === 'Zhi'
        ? 'Zhi'
        : 'Ling'

    Object.keys(agentMonitor.agents).forEach((key) => {
      if (key === activeId) {
        agentMonitor.agents[key].status = '活跃'
        agentMonitor.agents[key].activity = `以 [${aiData.speaker_emotion}] 回应`
      } else {
        agentMonitor.agents[key].status = '待命'
        agentMonitor.agents[key].activity = '后台静默运转'
      }
    })
  }

  const markDisconnected = () => {
    agentMonitor.masterThought = '连接中断。'
  }

  return {
    agentMonitor,
    markSyncing,
    applyAiState,
    markDisconnected,
  }
}
