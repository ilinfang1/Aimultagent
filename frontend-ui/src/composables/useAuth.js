import { reactive, ref } from 'vue'
import { authLogin, authRegister } from '../services/api'

export function useAuth({ onLoginSuccess, onLogout } = {}) {
  const appState = reactive({
    isLoggedIn: false,
    currentUserId: null,
    currentUsername: '',
  })

  const isLoginMode = ref(true)
  const isAuthLoading = ref(false)
  const authError = ref('')
  const authForm = reactive({ username: '', password: '' })

  const toggleAuthMode = () => {
    isLoginMode.value = !isLoginMode.value
    authError.value = ''
  }

  const handleAuth = async () => {
    if (!authForm.username || !authForm.password) {
      authError.value = '请填写完整信息！'
      return
    }

    isAuthLoading.value = true
    authError.value = ''

    try {
      const result = isLoginMode.value
        ? await authLogin({ ...authForm })
        : await authRegister({ ...authForm })

      if (result?.code === 200) {
        appState.currentUserId = result.data
        appState.currentUsername = authForm.username
        appState.isLoggedIn = true
        await onLoginSuccess?.(result.data)
        return
      }

      authError.value = result?.msg || '认证失败'
    } catch (error) {
      authError.value = '服务器离线'
    } finally {
      isAuthLoading.value = false
    }
  }

  const handleLogout = () => {
    appState.isLoggedIn = false
    appState.currentUserId = null
    appState.currentUsername = ''
    authForm.password = ''
    authError.value = ''
    onLogout?.()
  }

  return {
    appState,
    isLoginMode,
    isAuthLoading,
    authError,
    authForm,
    toggleAuthMode,
    handleAuth,
    handleLogout,
  }
}
