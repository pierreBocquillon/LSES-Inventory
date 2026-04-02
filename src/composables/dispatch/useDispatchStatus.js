import { ref, onMounted, onUnmounted } from 'vue'

export function useDispatchStatus() {
  const safdStatus = ref(null)
  const bcesStatus = ref(null)
  const _isUnmountedRef = ref(false)

  const fetchSafdStatus = () => {
    fetch('https://docs.google.com/spreadsheets/d/1A1gxOho_roNwxTtcbiEpLGSWbD8JUasMDu4NL-zdcbw/export?format=csv&gid=0')
      .then(res => res.text())
      .then(text => {
        if (_isUnmountedRef.value) return
        const rows = text.split('\n')
        if (rows.length >= 3) {
          const cols = rows[2].split(',')
          if (cols.length >= 4) {
            safdStatus.value = cols[3].trim()
          }
        }
      })
      .catch(err => {
        if (!_isUnmountedRef.value) console.error("Erreur gsheet SAFD", err)
      })
  }

  const fetchBcesStatus = () => {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec?action=bcesDispatchDoGet'
    const script = document.createElement('script')
    const callbackName = 'jsonpCallback_' + Math.round(100000 * Math.random())

    window[callbackName] = (data) => {
      if (_isUnmountedRef.value) {
        delete window[callbackName]
        if (script.parentNode) script.parentNode.removeChild(script)
        return
      }
      if (data && data.status) {
        bcesStatus.value = data.status.replace(/['"]/g, '').trim()
      }
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    script.src = `${WEB_APP_URL}&callback=${callbackName}`
    script.onerror = () => {
      console.error("Erreur Web App BCES (JSONP)")
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    document.body.appendChild(script)
  }

  let safdInterval = null
  let bcesInterval = null

  onMounted(() => {
    fetchSafdStatus()
    safdInterval = setInterval(fetchSafdStatus, 60000)

    fetchBcesStatus()
    bcesInterval = setInterval(fetchBcesStatus, 60000)
  })

  onUnmounted(() => {
    _isUnmountedRef.value = true
    if (safdInterval) clearInterval(safdInterval)
    if (bcesInterval) clearInterval(bcesInterval)
  })

  return {
    safdStatus,
    bcesStatus,
    fetchSafdStatus,
    fetchBcesStatus
  }
}
