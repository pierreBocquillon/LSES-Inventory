import { ref, computed, watch } from 'vue'
import Dispatch from '@/classes/Dispatch.js'
import logger from '@/functions/logger.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useAchievementStore } from '@/store/achievements.js'
import {
  hospitalStatuses,
  allCategories,
  interventionTypes,
  returnStatuses,
  centralRoles,
} from '@/config/dispatch.js'
import { getRoleColor as getRoleColorConfig } from '@/config/roles.js'

export function useDispatchActions(state) {
  const {
    dispatch,
    userStore,
    localBuffers,
    currentTime,
    isDirection,
    hasLsesPerm,
    employees,
    specialties,
    allEmployees,
    lastSyncedCentrale,
    isLightTheme
  } = state

  const _timeouts = {}
  let _isResetting = false
  let _isUnmounted = false

  const achievementStore = useAchievementStore()

  const quickAddDialog = ref(false)
  const quickAddEmployee = ref(null)
  const quickMoveSourceKey = ref(null)
  const showAffiliationManager = ref(false)
  const activeTab = ref(0)




  const debounceUpdate = (id, field, callback, delay = 500) => {
    const key = `${id}-${field}`
    if (_timeouts[key]) clearTimeout(_timeouts[key])
    _timeouts[key] = setTimeout(() => {
      if (_isUnmounted) return
      callback()
      delete _timeouts[key]
    }, delay)
  }


  const toggleTheme = () => {
    isLightTheme.value = !isLightTheme.value
    if (isLightTheme.value)
      achievementStore.unlockAchievement('dispatch_light_mode_secret')
  }


  const handleAutoResetToggle = async (val) => {
    if (!dispatch.value) return
    const updates = { autoResetEnabled: val }
    if (val) {
      const now = new Date()
      const currentHHmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
      const currentDate = now.toISOString().split('T')[0]
      const resetTime = dispatch.value.autoResetTime || '03:00'
      if (currentHHmm >= resetTime) updates.lastResetDate = currentDate
    }
    await Dispatch.updateFields(updates)
  }

  const handleAutoResetTimeChange = async (newTime) => {
    if (!dispatch.value) return
    const updates = { autoResetTime: newTime }
    const now = new Date()
    const currentHHmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    const currentDate = now.toISOString().split('T')[0]
    if (dispatch.value.autoResetEnabled && currentHHmm >= newTime) {
      updates.lastResetDate = currentDate
    }
    await Dispatch.updateFields(updates)
  }

  let _lastCheckedMinute = -1
  const checkAutoReset = async () => {
    if (!dispatch.value?.autoResetEnabled || !dispatch.value?.autoResetTime) return
    const now = new Date(currentTime.value)
    const currentMinute = now.getMinutes()

    if (currentMinute === _lastCheckedMinute) return
    _lastCheckedMinute = currentMinute

    const [targetH, targetM] = dispatch.value.autoResetTime.split(':').map(Number)
    const resetTimeToday = new Date(now)
    resetTimeToday.setHours(targetH, targetM, 0, 0)

    const currentDateStr = now.toISOString().split('T')[0]

    if (now >= resetTimeToday && dispatch.value.lastResetDate !== currentDateStr) {
      if (_isResetting) return
      _isResetting = true

      const jitter = Math.random() * 5000
      setTimeout(async () => {
        if (_isUnmounted || (dispatch.value && dispatch.value.lastResetDate === currentDateStr)) {
          if (!_isUnmounted) _isResetting = false
          return
        }
        const result = await Dispatch.tryAutoReset(currentDateStr)
        if (_isUnmounted) return
        if (result === 'skipped')
          logger.log(userStore.profile?.id, 'DISPATCH', 'La réinitialisation automatique a été annulée.')
        else if (result === 'reset')
          logger.log(userStore.profile?.id, 'DISPATCH', 'Le dispatch a été réinitialisé automatiquement.')
        setTimeout(() => { if (!_isUnmounted) _isResetting = false }, 5000)
      }, jitter)
    }
  }


  const syncCentraleGSheet = (d) => {
    const data = d || dispatch.value
    if (!data?.centrale?.employees) return
    const emps = data.centrale.employees
    let name = '', phone = ''
    if (emps && emps.length > 0) {
      name = emps[0].name || ''
      phone = emps[0].phone || ''
    }
    if (lastSyncedCentrale.value.name === name && lastSyncedCentrale.value.phone === phone) return
    lastSyncedCentrale.value = { name, phone }
    try {
      const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec'
      fetch(`${WEB_APP_URL}?action=updateCentrale&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`, { mode: 'no-cors' })
    } catch (err) {
      console.error("Erreur synchro GSheet Centrale", err)
    }
  }


  const setHospitalStatus = async (value) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    await Dispatch.updateField('hospitalStatus', value)
    const meta = hospitalStatuses.find(s => s.value === value) || hospitalStatuses[0]
    const label = meta.gsheet
    try {
      const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec'
      fetch(`${WEB_APP_URL}?action=updateHospitalStatus&status=${encodeURIComponent(label)}`, { mode: 'no-cors' })
    } catch (err) {
      console.error("Erreur de synchro GSheet Hospital Status", err)
    }
  }


  const autoTurnOffRadio = (employeeId) => {
    if (!dispatch.value?.radios || !employeeId) return
    const radios = JSON.parse(JSON.stringify(dispatch.value.radios))
    const radio = radios.find(r => r.employeeId === employeeId)
    if (radio) {
      radio.status = 'off'
      Dispatch.updateField('radios', radios)
    }
  }

  const toggleRadioStatus = async (radio) => {
    if (!hasLsesPerm.value) return
    const radios = JSON.parse(JSON.stringify(dispatch.value.radios))
    const r = radios.find(x => x.id === radio.id)
    if (r) {
      r.status = r.status === 'on' ? 'off' : 'on'
      await Dispatch.updateField('radios', radios)
    }
  }

  const onRadioAssign = async (radio, newEmpId) => {
    if (!hasLsesPerm.value) return
    if (radio.category === 'direction' && !isDirection.value) {
      Swal.fire({ title: 'Accès refusé', text: 'Seules les personnes de la Direction peuvent modifier ces radios.', icon: 'error', background: '#1e293b', color: '#fff' })
      return
    }
    const oldEmpId = radio.employeeId
    if (oldEmpId !== newEmpId) {
      const radios = JSON.parse(JSON.stringify(dispatch.value.radios || []))
      const r = radios.find(x => x.id === radio.id)
      if (r) {
        r.employeeId = newEmpId || null
        if (!oldEmpId && newEmpId) r.status = 'on'
        else if (oldEmpId && !newEmpId) r.status = 'off'
        await Dispatch.updateField('radios', radios)
      }
      const serialStr = radio.serial || 'sans matricule'
      if (!oldEmpId && newEmpId) {
        const emp = employees.value.find(e => e.id === newEmpId)
        if (emp) logger.log(userStore.profile.id, 'RADIOS', `${emp.name} a pris la radio ${serialStr}`)
      } else if (oldEmpId && !newEmpId) {
        const emp = employees.value.find(e => e.id === oldEmpId)
        if (emp) logger.log(userStore.profile.id, 'RADIOS', `${emp.name} a déposé la radio ${serialStr}`)
      } else if (oldEmpId && newEmpId) {
        const oldEmp = employees.value.find(e => e.id === oldEmpId)
        const newEmp = employees.value.find(e => e.id === newEmpId)
        if (oldEmp && newEmp) logger.log(userStore.profile.id, 'RADIOS', `${oldEmp.name} a transféré la radio ${serialStr} à ${newEmp.name}`)
      }
    }
  }

  const removeRadio = async (radio) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    const r = await Swal.fire({
      icon: 'warning', title: 'Supprimer cette radio ?',
      text: `Es-tu sûr de vouloir supprimer la radio ${radio.serial || 'sans matricule'} ?`,
      showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#d33', background: '#1e293b', color: '#fff'
    })
    if (!r.isConfirmed) return
    const radios = JSON.parse(JSON.stringify(dispatch.value.radios || []))
    const idx = radios.findIndex(x => x.id === radio.id)
    if (idx !== -1) {
      const serial = radios[idx].serial || 'sans matricule'
      radios.splice(idx, 1)
      await Dispatch.updateField('radios', radios)
      logger.log(userStore.profile.id, 'RADIOS', `Radio ${serial} supprimée`)
    }
  }

  const addRadio = async (category = 'standard') => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    if ((dispatch.value.radios || []).length >= 30) {
      Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 30 radios.', icon: 'warning', background: '#1e293b', color: '#fff' })
      return
    }
    const radios = JSON.parse(JSON.stringify(dispatch.value.radios || []))
    radios.push({ id: Date.now().toString() + Math.random().toString(36).slice(2, 6), serial: '', employeeId: null, status: 'on', category })
    await Dispatch.updateField('radios', radios)
    logger.log(userStore.profile.id, 'RADIOS', `Nouvelle radio ajoutée (${category === 'direction' ? 'Direction' : 'Standard'})`)
  }


  const addInterventionSlot = async (nextTick) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    if ((dispatch.value.interventions || []).length >= 25) {
      Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 25 interventions.', icon: 'warning', background: '#1e293b', color: '#fff' })
      return
    }
    const newSlotId = Date.now().toString() + Math.random().toString(36).slice(2, 6)
    await Dispatch.addInterventionSlot({ id: newSlotId, type: 'intervention', employees: [], returnStatus: null, location: null, complement: null })
    achievementStore.incrementStat('dispatch_interventions_created', 1, 1)
    if (nextTick) {
      nextTick(() => {
        const el = document.getElementById(`zip-input-${newSlotId}`)
        if (el) el.focus()
      })
    }
  }

  const setInterSlotType = async (slot, typeValue) => {
    if (!hasLsesPerm.value) return
    await Dispatch.updateIntervention(slot.id, { type: typeValue })
  }

  const setInterSlotStatus = async (slot, statusValue) => {
    if (!hasLsesPerm.value) return
    await Dispatch.updateIntervention(slot.id, { returnStatus: statusValue || null })
  }

  const removeInterventionSlot = async (slot) => {
    if (!hasLsesPerm.value || !slot) return
    const hasContent = (slot.employees?.length || slot.location || slot.complement || slot.returnStatus || slot.type !== 'intervention')
    if (hasContent) {
      const locKey = `${slot.id}-location`
      if (localBuffers.value[locKey] !== undefined) delete localBuffers.value[locKey]
      if (_timeouts[locKey]) {
        clearTimeout(_timeouts[locKey])
        delete _timeouts[locKey]
      }
      await Dispatch.resetInterventionSlot(slot.id)
    } else {
      await Dispatch.deleteInterventionSlot(slot.id)
    }
  }

  const onInterSlotLocationInput = (slot, val) => {
    if (!hasLsesPerm.value) return
    localBuffers.value[`${slot.id}-location`] = val
    debounceUpdate(slot.id, 'location', () => {
      Dispatch.updateIntervention(slot.id, { location: val.trim() || null }).then(() => {
        if (localBuffers.value[`${slot.id}-location`] === val) delete localBuffers.value[`${slot.id}-location`]
      })
    })
  }


  const setCentraleType = async (typeValue) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    await Dispatch.updateCentrale({ type: typeValue })
  }

  const setCentraleReturnStatus = async (statusValue) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    await Dispatch.updateCentrale({ returnStatus: statusValue || null })
  }

  const clearCentrale = async () => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value?.centrale) return
    const c = dispatch.value.centrale
    const hasFields = !!(c.location || c.complement || c.type || c.returnStatus)
    if (hasFields) {
      const locKey = 'centrale-location'
      if (localBuffers.value[locKey] !== undefined) delete localBuffers.value[locKey]
      if (_timeouts[locKey]) { clearTimeout(_timeouts[locKey]); delete _timeouts[locKey] }
      await Dispatch.updateCentrale({ location: null, complement: null, type: null, returnStatus: null })
    } else {
      const emps = c.employees || []
      for (const emp of emps) {
        await Dispatch.migrateEmployee(emp.employeeId || emp.id, 'centrale', 'cat:en_service', { name: emp.name, phone: emp.phone, role: emp.role, allSpecialties: emp.allSpecialties || [] })
      }
    }
  }

  const onCentraleLocationInput = (val) => {
    if (!hasLsesPerm.value) return
    localBuffers.value['centrale-location'] = val
    debounceUpdate('centrale', 'location', () => {
      Dispatch.updateCentrale({ location: val.trim() || null }).then(() => {
        if (localBuffers.value['centrale-location'] === val) delete localBuffers.value['centrale-location']
      })
    })
  }

  const setCentraleEmpRole = async (empId, role) => {
    if (!hasLsesPerm.value) return
    await Dispatch.updateCentraleEmployeeRole(empId, role)
  }


  const onNotepadInput = (val) => {
    if (!isDirection.value) return
    localBuffers.value['global-notepad'] = val
    debounceUpdate('global', 'notepad', () => {
      Dispatch.updateField('notepad', val).then(() => {
        if (localBuffers.value['global-notepad'] === val) delete localBuffers.value['global-notepad']
      })
    })
  }

  const onLsesRadioInput = (val) => {
    if (!isDirection.value) return
    localBuffers.value['lses-radio'] = val
    debounceUpdate('global', 'lsesRadio', () => {
      Dispatch.updateField('lsesRadio', val).then(() => {
        if (localBuffers.value['lses-radio'] === val) delete localBuffers.value['lses-radio']
      })
    })
  }

  const onCommuneRadioInput = (val) => {
    if (!isDirection.value) return
    localBuffers.value['commune-radio'] = val
    debounceUpdate('global', 'communeRadio', () => {
      Dispatch.updateField('communeRadio', val).then(() => {
        if (localBuffers.value['commune-radio'] === val) delete localBuffers.value['commune-radio']
      })
    })
  }


  const resetDispatch = async () => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    await Dispatch.resetAll()
    logger.log(userStore.profile.id, 'DISPATCH', 'Le dispatch a été réinitialisé')
    achievementStore.incrementStat('dispatch_resets', 1, 1)
  }

  const confirmResetDispatch = () => {
    if (!hasLsesPerm.value) return
    Swal.fire({
      title: 'Réinitialiser le dispatch ?',
      text: 'Tout le monde sera mis en "Hors service", les interventions seront vidées, et toutes les radios seront éteintes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, réinitialiser',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) resetDispatch()
    })
  }


  const formatDateTime = (ts) => {
    if (!ts) return ''
    const date = new Date(ts)
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const getSpecialtyIcon = (v) => specialties.value.find(s => s.value === v || s.name === v)?.icon || ''
  const getSpecialtyName = (v) => specialties.value.find(s => s.value === v || s.name === v)?.name || v
  const getInterType = (v) => interventionTypes.find(it => it.value === v) || null
  const getReturnStatus = (v) => returnStatuses.find(rs => rs.value === v) || null
  const getCentralRole = (v) => centralRoles.find(cr => cr.value === v) || null
  const getRoleColor = (role) => getRoleColorConfig(role)

  const getEmployeeEmoji = (empId) => {
    if (!empId) return ''
    const emp = employees.value.find(e => e.id === empId)
    if (!emp) return ''
    if (emp.role === 'Interne') return '🐣'
    return emp.emoji || ''
  }

  const getEmployeeEmojis = (empId) => {
    const e = employees.value.find(e => e.id === empId)
    return e ? [...(e.specialties || []), ...(e.chiefSpecialties || [])].map(v => getSpecialtyIcon(v)).filter(Boolean).join(' ') : ''
  }

  const hasHelicopterTraining = (empId) => {
    const e = employees.value.find(e => e.id === empId)
    return e ? !!e.helicopterTrainingDate : false
  }

  const patatesForCategory = (cat) => dispatch.value?.patates.filter(p => p.category === cat) || []



  const openQuickMoveDialog = (emp, sourceKey) => {
    if (!hasLsesPerm.value) return
    quickAddEmployee.value = emp
    quickMoveSourceKey.value = sourceKey
    quickAddDialog.value = true
  }

  const confirmQuickAdd = async (categoryValue) => {
    if (!hasLsesPerm.value) return
    if (!quickAddEmployee.value || !dispatch.value) return
    quickAddDialog.value = false
    const empId = quickAddEmployee.value.employeeId || quickAddEmployee.value.id
    const src = quickMoveSourceKey.value
    const emp = employees.value.find(e => e.id === empId)
    const userId = emp?.userId
    const role = emp?.role || quickAddEmployee.value.role || ''
    const specs = emp ? (emp.specialties || []) : (quickAddEmployee.value.allSpecialties || [])
    if (categoryValue === 'hs') autoTurnOffRadio(empId)
    await Dispatch.migrateEmployee(empId, src, categoryValue === 'hs' ? null : `cat:${categoryValue}`, {
      name: quickAddEmployee.value.name || '',
      phone: quickAddEmployee.value.phone || '',
      allSpecialties: specs,
      role,
    })

    if (src === 'hs' && categoryValue === 'astreinte')
      achievementStore.incrementStat('dispatch_hs_to_astreinte', 1, 2)
    if (categoryValue === 'centrale' && !(dispatch.value?.centrale?.employees || []).length)
      achievementStore.incrementStat('dispatch_centrale_lead', 1, 1)

    if (categoryValue === 'sans_permis' && userId)
      achievementStore.unlockAchievementForUser(userId, 'dispatch_tout_pt')

    quickAddDialog.value = false
  }


  const promptAddTemporaryEmployee = () => {
    if (!hasLsesPerm.value) return
    Swal.fire({
      title: 'Ajout temporaire',
      html: `
        <input id="swal-temp-name" class="swal2-input" placeholder="Prénom/Nom" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
        <input id="swal-temp-phone" class="swal2-input" placeholder="Téléphone" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
        <div style="text-align: left; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; font-size: 0.9rem; margin-top: 10px;">
          <div style="margin-bottom: 5px; color: #94a3b8; font-weight: bold;">Validations :</div>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-dds" style="accent-color: #3b82f6; width: 14px; height: 14px;"> DDS (🩸)</label>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vc" style="accent-color: #3b82f6; width: 14px; height: 14px;"> VC (🩺)</label>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vm" style="accent-color: #3b82f6; width: 14px; height: 14px;"> VM (⚕️)</label>
          <label style="display: block; cursor: pointer;"><input type="checkbox" id="swal-temp-airbag" style="accent-color: #3b82f6; width: 14px; height: 14px;"> Airbag (🚔)</label>
        </div>
      `,
      focusConfirm: false, background: '#1e293b', color: '#fff', showCancelButton: true, confirmButtonText: 'Ajouter', cancelButtonText: 'Annuler',
      preConfirm: () => {
        const name = document.getElementById('swal-temp-name').value.trim()
        const phone = document.getElementById('swal-temp-phone').value.trim()
        if (!name) { Swal.showValidationMessage("Le nom est obligatoire"); return false }
        const validations = []
        if (document.getElementById('swal-temp-dds').checked) validations.push('dds')
        if (document.getElementById('swal-temp-vc').checked) validations.push('vc')
        if (document.getElementById('swal-temp-vm').checked) validations.push('vm')
        if (document.getElementById('swal-temp-airbag').checked) validations.push('avp_airbag')
        return { name, phone, validations }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await Dispatch.addTemporaryEmployee({ name: result.value.name, phone: result.value.phone || '', validations: result.value.validations || [] })
      }
    })
  }

  const promptEditTemporaryEmployee = (empInfo) => {
    if (!hasLsesPerm.value) return
    if (!dispatch.value) return
    const realId = empInfo.employeeId || empInfo.id
    const tEmp = (dispatch.value.temporaryEmployees || []).find(e => e.id === realId)
    if (!tEmp) return
    Swal.fire({
      title: 'Modifier / Supprimer',
      html: `
        <input id="swal-temp-name" class="swal2-input" value="${tEmp.name}" placeholder="Prénom/Nom" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
        <input id="swal-temp-phone" class="swal2-input" value="${tEmp.phone || ''}" placeholder="Téléphone" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
        <div style="text-align: left; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; font-size: 0.9rem; margin-top: 10px;">
          <div style="margin-bottom: 5px; color: #94a3b8; font-weight: bold;">Validations :</div>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-dds" ${tEmp.validations?.includes('dds') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> DDS (🩸)</label>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vc" ${tEmp.validations?.includes('vc') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> VC (🩺)</label>
          <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vm" ${tEmp.validations?.includes('vm') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> VM (⚕️)</label>
          <label style="display: block; cursor: pointer;"><input type="checkbox" id="swal-temp-airbag" ${tEmp.validations?.includes('avp_airbag') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> Airbag (🚔)</label>
        </div>
      `,
      focusConfirm: false, background: '#1e293b', color: '#fff', showCancelButton: true, showDenyButton: true, confirmButtonText: 'Sauvegarder', cancelButtonText: 'Annuler', denyButtonText: 'Supprimer', confirmButtonColor: '#3b82f6', denyButtonColor: '#ef4444',
      preConfirm: () => {
        const name = document.getElementById('swal-temp-name').value.trim()
        const phone = document.getElementById('swal-temp-phone').value.trim()
        if (!name) { Swal.showValidationMessage("Le nom est obligatoire"); return false }
        const validations = []
        if (document.getElementById('swal-temp-dds').checked) validations.push('dds')
        if (document.getElementById('swal-temp-vc').checked) validations.push('vc')
        if (document.getElementById('swal-temp-vm').checked) validations.push('vm')
        if (document.getElementById('swal-temp-airbag').checked) validations.push('avp_airbag')
        return { name, phone, validations }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await Dispatch.updateTemporaryEmployee(realId, { name: result.value.name, phone: result.value.phone || '', validations: result.value.validations || [] })
      } else if (result.isDenied) {
        const r = await Swal.fire({ title: "Supprimer l'employé ?", text: 'Il sera retiré de toutes les sections.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Oui, supprimer', background: '#1e293b', color: '#fff' })
        if (r.isConfirmed) await Dispatch.removeTemporaryEmployee(realId)
      }
    })
  }

  const promptAddAffiliation = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Ajoute une affiliation',
      html: `<div style="text-align: left; padding: 0 5px;"><label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">NOM DU GROUPE / AFFILIATION</label><input id="swal-input1" class="swal2-input" placeholder="ex: Ballas" style="margin: 0 0 15px 0; width: 100%; height: 45px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #334155;"><label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">COULEUR DISTINCTIVE</label><input id="swal-input2" class="swal2-input" type="color" value="#3b82f6" style="margin: 0; width: 100%; height: 45px; cursor: pointer; background: rgba(0,0,0,0.2); border: 1px solid #334155; padding: 4px;"></div>`,
      focusConfirm: false, background: '#1e293b', color: '#fff', target: '#app', didOpen: () => { document.getElementById('swal-input1')?.focus() },
      showCancelButton: true, confirmButtonText: 'Ajouter', cancelButtonText: 'Annuler',
      preConfirm: () => {
        const label = document.getElementById('swal-input1').value.trim()
        const color = document.getElementById('swal-input2').value
        if (!label) { Swal.showValidationMessage("Le nom est obligatoire"); return false }
        return { label, color }
      }
    })
    if (formValues) await Dispatch.addAffiliation({ ...formValues, order: Date.now() })
  }

  const promptEditAffiliation = async (aff) => {
    let safeColor = aff.color || '#3b82f6'
    if (safeColor.startsWith('#') && safeColor.length > 7) safeColor = safeColor.substring(0, 7)
    else if (!safeColor.startsWith('#')) safeColor = '#3b82f6'
    const { value: formValues } = await Swal.fire({
      title: "Modifier l'affiliation",
      html: `<div style="text-align: left; padding: 0 5px;"><label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">NOM DU GROUPE / AFFILIATION</label><input id="swal-input1" class="swal2-input" placeholder="Label" value="${aff.label}" style="margin: 0 0 15px 0; width: 100%; height: 45px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #334155;"><label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">COULEUR DISTINCTIVE</label><input id="swal-input2" class="swal2-input" type="color" value="${safeColor}" style="margin: 0; width: 100%; height: 45px; cursor: pointer; background: rgba(0,0,0,0.2); border: 1px solid #334155; padding: 4px;"></div>`,
      focusConfirm: false, background: '#1e293b', color: '#fff', target: '#app', didOpen: () => { document.getElementById('swal-input1')?.focus() },
      showCancelButton: true, confirmButtonText: 'Sauvegarder', cancelButtonText: 'Annuler',
      preConfirm: () => {
        const label = document.getElementById('swal-input1').value.trim()
        const color = document.getElementById('swal-input2').value
        if (!label) { Swal.showValidationMessage("Le nom est obligatoire"); return false }
        return { label, color }
      }
    })
    if (formValues) await Dispatch.updateAffiliation(aff.id, formValues)
  }

  const confirmDeleteAffiliation = async (aff) => {
    const r = await Swal.fire({ title: "Supprimer l'affiliation ?", text: `Voulez-vous vraiment supprimer "${aff.label}" ?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler', background: '#1e293b', color: '#fff', target: '#app' })
    if (r.isConfirmed) await Dispatch.deleteAffiliation(aff.id)
  }

  const isFirstAffiliation = (aff, affiliationsList) => affiliationsList && affiliationsList.length > 0 && affiliationsList[0].id === aff.id
  const isLastAffiliation = (aff, affiliationsList) => affiliationsList && affiliationsList.length > 0 && affiliationsList[affiliationsList.length - 1].id === aff.id

  const moveAffiliationUp = async (aff, affiliationsList) => {
    const idx = affiliationsList.findIndex(a => a.id === aff.id)
    if (idx > 0) {
      const list = [...affiliationsList]
      const temp = list[idx]; list[idx] = list[idx - 1]; list[idx - 1] = temp
      await Promise.all(list.map((a, i) => Dispatch.updateAffiliation(a.id, { order: i })))
    }
  }

  const moveAffiliationDown = async (aff, affiliationsList) => {
    const idx = affiliationsList.findIndex(a => a.id === aff.id)
    if (idx < affiliationsList.length - 1) {
      const list = [...affiliationsList]
      const temp = list[idx]; list[idx] = list[idx + 1]; list[idx + 1] = temp
      await Promise.all(list.map((a, i) => Dispatch.updateAffiliation(a.id, { order: i })))
    }
  }


  watch(() => dispatch.value, (d) => {
    if (d) syncCentraleGSheet(d)
  }, { immediate: true })

  watch(() => currentTime.value, () => {
    checkAutoReset()
  })

  watch(isLightTheme, (val) => {
    localStorage.setItem('dispatch_light_theme', val)
  })


  const cleanup = () => {
    _isUnmounted = true
    Object.values(_timeouts).forEach(t => clearTimeout(t))
  }

  return {

    quickAddDialog,
    quickAddEmployee,
    quickMoveSourceKey,
    showAffiliationManager,
    activeTab,


    toggleTheme,
    handleAutoResetToggle,
    handleAutoResetTimeChange,
    checkAutoReset,
    syncCentraleGSheet,
    setHospitalStatus,
    autoTurnOffRadio,
    toggleRadioStatus,
    onRadioAssign,
    removeRadio,
    addRadio,
    addInterventionSlot,
    setInterSlotType,
    setInterSlotStatus,
    removeInterventionSlot,
    onInterSlotLocationInput,
    setCentraleType,
    setCentraleReturnStatus,
    clearCentrale,
    onCentraleLocationInput,
    setCentraleEmpRole,
    onNotepadInput,
    onLsesRadioInput,
    onCommuneRadioInput,
    resetDispatch,
    confirmResetDispatch,

    openQuickMoveDialog,
    confirmQuickAdd,


    promptAddTemporaryEmployee,
    promptEditTemporaryEmployee,
    promptAddAffiliation,
    promptEditAffiliation,
    confirmDeleteAffiliation,
    isFirstAffiliation,
    isLastAffiliation,
    moveAffiliationUp,
    moveAffiliationDown,


    formatDateTime,
    getSpecialtyIcon,
    getSpecialtyName,
    getInterType,
    getReturnStatus,
    getCentralRole,
    getRoleColor,
    getEmployeeEmoji,
    getEmployeeEmojis,
    hasHelicopterTraining,
    patatesForCategory,

    cleanup
  }
}
