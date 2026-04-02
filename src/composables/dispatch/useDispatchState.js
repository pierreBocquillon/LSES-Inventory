import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useUserStore } from '@/store/user.js'
import Dispatch from '@/classes/Dispatch.js'
import Employee from '@/classes/Employee.js'
import Specialty from '@/classes/Specialty.js'
import Vehicle from '@/classes/Vehicle.js'
import Company from '@/classes/Company.js'
import vehiclesLocations from '@/config/vehiclesLocations.js'
import { roleOrder } from '@/config/roles.js'
import { trainingCompetencies } from '@/config/training_competencies.js'
import { initNotifManager, stopNotifManager, notifState, alerts } from '@/functions/nofifManager.js'

export function useDispatchState() {
  const userStore = useUserStore()
  

  const dispatch = ref(null)
  const employees = shallowRef([])
  const specialties = shallowRef([])
  const vehicles = shallowRef([])
  const companies = shallowRef([])
  const affiliations = shallowRef([])
  const currentTime = ref(Date.now())
  const isLightTheme = ref(localStorage.getItem('dispatch_light_theme') === 'true')
  const localBuffers = ref({})
  const lastSyncedCentrale = ref({ name: '', phone: '' })


  let unsub = null
  let unsubEmployees = null
  let unsubSpecialties = null
  let unsubVehicles = null
  let unsubCompanies = null
  let unsubAffiliations = null
  let timeInterval = null


  const isDirection = computed(() => {
    const currentUserId = userStore.profile?.id
    if (!currentUserId || !employees.value) return false
    const currentEmployee = employees.value.find(e => e.userId === currentUserId)
    if (!currentEmployee) return false
    return ['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)
  })

  const currentUserEmployeeId = computed(() => {
    const currentUserId = userStore.profile?.id
    const currentEmployee = employees.value.find(e => e.userId === currentUserId)
    return currentEmployee ? currentEmployee.id : null
  })

  const hasLsesPerm = computed(() => {
    return (userStore.profile?.permissions || []).some(p => ['lses', 'dev', 'admin'].includes(p))
  })

  const allLocations = computed(() => {
    let locs = [...vehiclesLocations]
    ;(companies.value || []).forEach(company => {
      if (company.isGarage) {
        locs.push({
          value: company.id,
          text: `${company.icon} ${company.name}`,
          home: false,
        })
      }
    })
    return Object.freeze(locs)
  })

  const allEmployees = computed(() => {
    const dbEmps = employees.value.map(e => ({
      id: e.id,
      employeeId: e.id,
      name: e.name || '',
      phone: e.phone || '',
      role: e.role || '',
      allSpecialties: e.specialties || [],
      displayLabel: e.phone ? `${e.name || ''} — ${e.phone}` : (e.name || ''),
    }))
    const tempEmps = (dispatch.value?.temporaryEmployees || []).map(e => ({
      id: e.id,
      employeeId: e.id,
      name: e.name || '',
      phone: e.phone || '',
      role: 'Temporaire',
      allSpecialties: [],
      displayLabel: e.phone ? `${e.name || ''} — ${e.phone}` : (e.name || ''),
    }))
    return Object.freeze([...dbEmps, ...tempEmps])
  })

  const usedEmployeeIds = computed(() => {
    if (!dispatch.value) return new Set()
    const ids = []
    ;(dispatch.value.interventions || []).forEach(s => { (s.employees || []).forEach(e => ids.push(e.employeeId)) })
    dispatch.value.patates.forEach(p => { if (p.employeeId) ids.push(p.employeeId) })
    if (dispatch.value.centrale && dispatch.value.centrale.employees)
      dispatch.value.centrale.employees.forEach(e => { if (e.employeeId) ids.push(e.employeeId) })
    return new Set(ids)
  })

  const sortedUnassignedEmployees = computed(() => {
    return allEmployees.value
      .filter(e => !usedEmployeeIds.value.has(e.id))
      .sort((a, b) => {
        const ia = roleOrder.indexOf(a.role), ib = roleOrder.indexOf(b.role)
        const ra = ia === -1 ? 99 : ia, rb = ib === -1 ? 99 : ib
        if (ra !== rb) return ra - rb
        return (a.name || '').localeCompare(b.name || '')
      })
  })

  const directionRadios = computed(() => (dispatch.value?.radios || []).filter(r => r.category === 'direction'))
  const standardRadios = computed(() => (dispatch.value?.radios || []).filter(r => r.category !== 'direction'))

  const lastRepairDateStr = computed(() => {
    const globalTs = notifState.lastVehicleSaveDate?.date
    if (globalTs) {
      const date = new Date(globalTs)
      return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    return 'Aucune'
  })

  const lastRepairColorClass = computed(() => {
    const globalTs = notifState.lastVehicleSaveDate?.date || 0
    if (!globalTs) return isLightTheme.value ? 'text-grey-darken-3' : 'text-white'
    const diff = currentTime.value - globalTs
    const hours = diff / (1000 * 60 * 60)
    if (hours >= 48) return 'text-red-lighten-1'
    if (hours >= 24) return 'text-orange-lighten-1'
    return isLightTheme.value ? 'text-grey-darken-3' : 'text-white'
  })

  const fouriereVehicles = computed(() => (vehicles.value || []).filter(v => v.where === 'fouriere'))
  const guardVehicles = computed(() => (vehicles.value || []).filter(v => v.underGuard))
  const insuranceVehicles = computed(() => (vehicles.value || []).filter(v => v.insurance))
  const needRepairVehicles = computed(() => (vehicles.value || []).filter(v => v.needRepair))

  const storageUpdates = computed(() => {
    if (!notifState.storages || !notifState.saveDates) return []
    return notifState.storages.map(storage => {
      const saveDate = notifState.saveDates[storage.id]
      const ts = saveDate ? saveDate.date : 0
      let dateStr = 'Aucune'
      let colorClass = isLightTheme.value ? 'text-grey-darken-3' : 'text-white'

      if (ts) {
        const date = new Date(ts)
        dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const diff = currentTime.value - ts
        const hours = diff / (1000 * 60 * 60)
        if (hours >= 24) colorClass = 'text-red-lighten-1'
        else if (hours >= 12) colorClass = 'text-orange-lighten-1'
      }

      return {
        id: storage.id,
        name: (storage.icon ? storage.icon + ' ' : '') + storage.name,
        dateStr,
        colorClass
      }
    })
  })

  const todoOrders = computed(() => {
    return (alerts.value || []).filter(a => a.maxAlertLevel >= 1)
      .map(a => ({
        id: 'alert-' + a.company.id,
        companyName: a.company.name,
        icon: '⚠️',
        label: 'Préparation',
        totalWeight: a.totalWeight,
        colorClass: a.maxAlertLevel >= 2 ? 'text-red-lighten-1' : 'text-primary'
      }))
  })

  const radioEmployeeOptionsMap = computed(() => {
    const map = new Map()
    if (!dispatch.value) return map
    const dt = dispatch.value
    const radios = dt.radios || []
    if (!radios.length) return map

    const dirEmps = employees.value.filter(e => ['Directeur', 'Directeur Adjoint'].includes(e.role))
    const inServiceIds = new Set()
    if (dt.centrale?.employees) dt.centrale.employees.forEach(e => inServiceIds.add(e.employeeId))
    ;(dt.interventions || []).forEach(s => (s.employees || []).forEach(e => inServiceIds.add(e.employeeId)))
    ;(dt.patates || []).forEach(p => { if (p.employeeId) inServiceIds.add(p.employeeId) })

    const inServiceEmps = allEmployees.value.filter(e => inServiceIds.has(e.id))

    for (const radio of radios) {
      if (radio.category === 'direction') {
        if (radio.employeeId && !dirEmps.find(e => e.id === radio.employeeId)) {
          const current = allEmployees.value.find(e => e.id === radio.employeeId)
          map.set(radio.id, current ? [...dirEmps, current] : dirEmps)
        } else {
          map.set(radio.id, dirEmps)
        }
      } else {
        if (radio.employeeId && !inServiceEmps.find(e => e.id === radio.employeeId)) {
          const current = allEmployees.value.find(e => e.id === radio.employeeId)
          map.set(radio.id, current ? [...inServiceEmps, current] : inServiceEmps)
        } else {
          map.set(radio.id, inServiceEmps)
        }
      }
    }
    return map
  })

  const validationBadgesMap = computed(() => {
    const map = new Map()
    if (!employees.value) return map

    const processEmp = (e, isTemp) => {
      const badges = []
      if (isTemp || e.role === 'Temporaire') {
        const valIds = e.validations || []
        trainingCompetencies.forEach(cat => {
          cat.competencies.forEach(comp => {
            if (valIds.includes(comp.id)) badges.push({ emoji: comp.emoji || '✅', title: comp.title })
          })
        })
      } else if (e.competencyProgress) {
        const progress = e.competencyProgress
        const isIntern = e.role === 'Interne'
        const isResident = e.role === 'Résident'
        if (isIntern || isResident) {
          trainingCompetencies.forEach(cat => {
            cat.competencies.forEach(comp => {
              const isInternComp = isIntern && ['dds', 'vc', 'vm', 'avp_airbag'].includes(comp.id)
              const isResidentComp = isResident && ['central', 'folder_writing'].includes(comp.id)
              if (isInternComp || isResidentComp) {
                const total = comp.subCompetencies?.length || 0
                const validated = comp.subCompetencies?.filter(sub => progress[sub.id] === 'validated').length || 0
                if (total > 0 && validated === total) badges.push({ emoji: comp.emoji || '✅', title: comp.title })
              }
            })
          })
        }
      }
      map.set(e.employeeId || e.id, badges)
    }

    employees.value.forEach(e => processEmp(e, false))
    if (dispatch.value?.temporaryEmployees) {
      dispatch.value.temporaryEmployees.forEach(e => processEmp(e, true))
    }
    return map
  })


  onMounted(() => {
    unsub = Dispatch.listenGlobal(d => {
      dispatch.value = Object.freeze(d)
    })
    unsubEmployees = Employee.listenAll(list => {
      employees.value = Object.freeze([...list].sort((a,b) => (a.name||'').localeCompare(b.name||'')))
    })
    unsubSpecialties = Specialty.listenAll(list => { specialties.value = Object.freeze(list) })
    unsubVehicles = Vehicle.listenAll(list => { vehicles.value = Object.freeze(list) })
    unsubCompanies = Company.listenAll(list => { companies.value = Object.freeze(list) })
    unsubAffiliations = Dispatch.listenAffiliations(list => { affiliations.value = Object.freeze(list) })

    initNotifManager()

    currentTime.value = Date.now()
    timeInterval = setInterval(() => {
      currentTime.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (unsub) unsub()
    if (unsubEmployees) unsubEmployees()
    if (unsubSpecialties) unsubSpecialties()
    if (unsubVehicles) unsubVehicles()
    if (unsubCompanies) unsubCompanies()
    if (unsubAffiliations) unsubAffiliations()
    stopNotifManager()
    if (timeInterval) clearInterval(timeInterval)
  })

  return {
    dispatch,
    employees,
    specialties,
    vehicles,
    companies,
    affiliations,
    currentTime,
    isLightTheme,
    localBuffers,
    lastSyncedCentrale,
    
    isDirection,
    currentUserEmployeeId,
    hasLsesPerm,
    allLocations,
    allEmployees,
    usedEmployeeIds,
    sortedUnassignedEmployees,
    directionRadios,
    standardRadios,
    lastRepairDateStr,
    lastRepairColorClass,
    fouriereVehicles,
    guardVehicles,
    insuranceVehicles,
    needRepairVehicles,
    storageUpdates,
    todoOrders,
    radioEmployeeOptionsMap,
    validationBadgesMap
  }
}
