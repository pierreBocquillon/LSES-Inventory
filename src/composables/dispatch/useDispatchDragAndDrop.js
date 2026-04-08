import { ref, onBeforeUnmount } from 'vue'
import Dispatch from '@/classes/Dispatch.js'
import { useAchievementStore } from '@/store/achievements.js'

export function useDispatchDragAndDrop(hasLsesPerm, dispatch, autoTurnOffRadio, employees) {
  const achievementStore = useAchievementStore()
  const draggingEmployee = ref(null)
  const draggingSource = ref(null)
  const dragOver = ref(null)
  const lastDragX = ref(0)
  const lastDragY = ref(0)

  const _handleGlobalDragOver = (e) => {
    lastDragX.value = e.clientX
    lastDragY.value = e.clientY

    const threshold = 80
    const speed = 20

    if (e.clientY < threshold && e.clientY > 0) {
      window.scrollBy(0, -speed)
    } else if (window.innerHeight - e.clientY < threshold && e.clientY > 0) {
      window.scrollBy(0, speed)
    }

    const path = e.composedPath ? e.composedPath() : []
    for (let el of path) {
      if (el && el.nodeType === 1 && el.scrollHeight > el.clientHeight) {
        const style = window.getComputedStyle(el)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          const rect = el.getBoundingClientRect()
          if (e.clientY - rect.top < 60 && e.clientY - rect.top > 0) {
            el.scrollBy(0, -speed)
          } else if (rect.bottom - e.clientY < 60 && rect.bottom - e.clientY > 0) {
            el.scrollBy(0, speed)
          }
          break
        }
      }
    }
  }

  const _handleGlobalWheel = (e) => {
    if (!lastDragX.value || !lastDragY.value) return

    let el = document.elementFromPoint(lastDragX.value, lastDragY.value)
    let scrolled = false

    while (el && el !== document.body && el !== document.documentElement) {
      if (el.nodeType === 1 && el.scrollHeight > el.clientHeight) {
        const style = window.getComputedStyle(el)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          el.scrollBy(0, e.deltaY)
          scrolled = true
          break
        }
      }
      el = el.parentElement
    }

    if (!scrolled) {
      window.scrollBy(0, e.deltaY)
    }
  }

  const startDrag = (employee, sourceKey) => {
    if (!hasLsesPerm.value) return
    draggingEmployee.value = employee
    draggingSource.value = sourceKey
    document.addEventListener('dragover', _handleGlobalDragOver, { capture: true })
    document.addEventListener('wheel', _handleGlobalWheel, { capture: true, passive: false })
  }

  const onDragEnd = () => {
    draggingEmployee.value = null
    draggingSource.value = null
    dragOver.value = null
    document.removeEventListener('dragover', _handleGlobalDragOver, { capture: true })
    document.removeEventListener('wheel', _handleGlobalWheel, { capture: true })
  }

  const onDragLeave = (key) => {
    if (dragOver.value === key) dragOver.value = null
  }

  const dropOn = async (targetKey) => {
    if (!hasLsesPerm.value) return
    dragOver.value = null
    const emp = draggingEmployee.value
    const src = draggingSource.value
    if (!emp || !dispatch.value) return
    if (src === targetKey) return

    const empId = emp.employeeId || emp.id
    if (!empId) {
      console.warn("Drop ignored: missing employee identifier", emp)
      return
    }

    if (targetKey === 'hs') autoTurnOffRadio(empId)

    await Dispatch.migrateEmployee(empId, src, targetKey === 'hs' ? null : targetKey, {
      name: emp.name || '',
      phone: emp.phone || '',
      allSpecialties: emp.allSpecialties || [],
      role: emp.role || ''
    })

    if (src === 'hs' && targetKey === 'cat:astreinte')
      achievementStore.incrementStat('dispatch_hs_to_astreinte', 1, 2)
    if (targetKey === 'centrale' && !(dispatch.value?.centrale?.employees || []).length)
      achievementStore.incrementStat('dispatch_centrale_lead', 1, 1)

    if (targetKey === 'cat:sans_permis') {
      const realEmp = employees.value.find(e => e.id === empId)
      if (realEmp?.userId)
        achievementStore.unlockAchievementForUser(realEmp.userId, 'dispatch_tout_pt')
    }
  }

  onBeforeUnmount(() => {
    document.removeEventListener('dragover', _handleGlobalDragOver, { capture: true })
    document.removeEventListener('wheel', _handleGlobalWheel, { capture: true })
  })

  return {
    draggingEmployee,
    draggingSource,
    dragOver,
    startDrag,
    onDragEnd,
    onDragLeave,
    dropOn
  }
}
