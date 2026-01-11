import { reactive, computed } from 'vue'
import { useUserStore } from '@/store/user.js'

import Profile from '@/classes/Profile.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import Order from '@/classes/Order.js'
import Storage from '@/classes/Storage.js'
import SaveDate from '@/classes/SaveDate.js'
import ExpenseNote from '@/classes/ExpenseNote.js'
import Vehicle from '@/classes/Vehicle.js'

export const notifState = reactive({
  waitingUsers: [],
  waitingExpenseNotes: [],
  companies: [],
  items: [],
  orders: [],
  storages: [],
  saveDates: {},
  vehicles: [],
  lastVehicleSaveDate: null,
  unsubscribers: []
})

let initCount = 0

export function initNotifManager() {
  initCount++
  if (initCount > 1) return

  notifState.unsubscribers.push(Profile.listenByActivated(false, users => {
    notifState.waitingUsers = users.filter(user => !user.rejected)
  }))
  notifState.unsubscribers.push(ExpenseNote.listenAll(notes => {
    notifState.waitingExpenseNotes = notes.filter(note => !note.isPaid && !note.isRefused)
  }))
  notifState.unsubscribers.push(SaveDate.listenAll(dates => {
    notifState.saveDates = {}
    dates.forEach(date => {
      notifState.saveDates[date.id] = date
    })
  }))
  notifState.unsubscribers.push(SaveDate.listenById('repa_flotte', saveDate => {
    notifState.lastVehicleSaveDate = saveDate
    if(!notifState.lastVehicleSaveDate) {
      let newDate = SaveDate.initOne()
      newDate.id = 'repa_flotte'
      newDate.date = new Date().getTime()
      newDate.save()
    }
  }))
  notifState.unsubscribers.push(Vehicle.listenAll(vehicles => {
    notifState.vehicles = vehicles.filter(vehicle => vehicle.where !== "dead")
    notifState.vehicles.sort((a, b) => a.name.localeCompare(b.name))
  }))
  notifState.unsubscribers.push(Storage.listenAll(storages => {
    notifState.storages = storages
    notifState.storages.sort((a, b) => a.name.localeCompare(b.name))
  }))
  notifState.unsubscribers.push(Company.listenAll(companies => {
    notifState.companies = companies
    notifState.companies.sort((a, b) => a.name.localeCompare(b.name))
  }))
  notifState.unsubscribers.push(Item.listenAll(items => {
    notifState.items = items
    notifState.items.sort((a, b) => a.id.localeCompare(b.id))
  }))
  notifState.unsubscribers.push(Order.listenAll(orders => {
    notifState.orders = orders
  }))
}

export function stopNotifManager() {
  initCount--
  if (initCount > 0) return

  notifState.unsubscribers.forEach(unsub => {
    if (typeof unsub === 'function') unsub()
  })
  notifState.unsubscribers = []
  initCount = 0
}

export const storageDeltaTime = computed(() => {
  let deltaTime = {}
  for(let storage of notifState.storages){
    if(notifState.saveDates[storage.id] == undefined){
      deltaTime[storage.id] = 9999
    }
    if(notifState.saveDates[storage.id]){
      deltaTime[storage.id] = (new Date().getTime() - new Date(notifState.saveDates[storage.id].date).getTime()) / (1000 * 60 * 60)
    }
  }
  return deltaTime
})

export const storagesOutdated = computed(() => {
  let amount = 0
  for(let storage of notifState.storages){
    if(storageDeltaTime.value[storage.id] >= 12){
      amount += 1
    }
  }
  return amount
})

export const garageNotif = computed(() => {
  let deltaTime = 0
  if (!notifState.lastVehicleSaveDate) return Infinity
  const now = new Date().getTime()
  const last = notifState.lastVehicleSaveDate.date
  const diff = now - last
  deltaTime = Math.floor(diff / (1000 * 60 * 60))

  let count = 0
  
  if (deltaTime >= 24) {
    count += 1
  }
  notifState.vehicles.forEach(vehicle => {
    if(vehicle.where == "dead") return;
    if (vehicle.insurance) {
      count += 1
    }
    if (!vehicle.insurance && ((vehicle.underGuard && parseInt(vehicle.recupDate) < new Date().getTime()) || vehicle.needRepair) ) {
      count += 1
    }
    if (!vehicle.insurance && !vehicle.underGuard && !vehicle.hideAlert && (parseInt(vehicle.lastRepairDate) < new Date().getTime() - (24 * 60 * 60 * 1000))) {
      count += 1
    }
  })

  return count
})

function getItemInfo(item) {
  if(item.id.includes('#')) {
    let id = item.id.split('#')[0]
    let info = notifState.items.find(i => i.id === id) || {}
    if(info) {
      info = JSON.parse(JSON.stringify(info))
      info.alert = false

      info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
      info.name = info.name + ' ' + item.id.split('#')[1]

      info.old = false
      if(new Date(item.id.split('#')[1]) < new Date().setDate(new Date().getDate())) {
        info.old = true
      }

      info.sellerName = notifState.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
      return info
    }
  }else{
    let info = notifState.items.find(i => i.id === item.id) || {}
    info.alert = false
    info.old = false
    info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    info.sellerName = notifState.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
    return info
  }
  return {}
}

export const alerts = computed(() => {
  const userStore = useUserStore()
  let alerts = {}
  notifState.companies.forEach(comp => {
    alerts[comp.id] = {
      company: comp,
      items: [],
      maxAlertLevel: 0,
      totalAlertLevel: 0,
      totalItemCount: 0,
      totalWeight: 0,
    }
  })
  notifState.items.forEach(item => {
    let tmp_alert = {
      item: item,
      info: getItemInfo(item),
      orderNeeded: 0,  
      alertLevel: 0,          
    }

    let threshold = 10
    if(parseInt(item.wanted) <= 10) threshold = 1
    if(parseInt(item.amount) <= 50) threshold = 5

    if(parseInt(item.wanted) > 0 && parseInt(item.amount) < parseInt(item.wanted) && (!item.isSecure || userStore.profile.permissions.some(p => ['dev', 'admin', 'security'].includes(p)))) {
      if(parseInt(item.amount) <= parseInt(item.wanted) * 0.25){
        tmp_alert.alertLevel = 2
      }else if(parseInt(item.amount) <= parseInt(item.wanted) * 0.5){
        tmp_alert.alertLevel = 1
      }else{
        tmp_alert.alertLevel = 0
      }

      tmp_alert.orderNeeded = Math.ceil((parseInt(item.wanted) - parseInt(item.amount)) / threshold) * threshold
      if(tmp_alert.orderNeeded > 0){
        alerts[tmp_alert.info.seller].items.push(tmp_alert)
        
        alerts[tmp_alert.info.seller].maxAlertLevel = Math.max(alerts[tmp_alert.info.seller].maxAlertLevel, tmp_alert.alertLevel)
        alerts[tmp_alert.info.seller].totalAlertLevel += tmp_alert.alertLevel
        alerts[tmp_alert.info.seller].totalItemCount += tmp_alert.orderNeeded
        alerts[tmp_alert.info.seller].totalWeight += tmp_alert.orderNeeded * tmp_alert.info.weight
      }
    }
  })
  alerts = Object.values(alerts)
  alerts.sort((a, b) => {
    if (b.maxAlertLevel == a.maxAlertLevel) {
      return b.totalWeight - a.totalWeight
    }else{
      return b.maxAlertLevel - a.maxAlertLevel
    }
  })
  alerts = alerts.filter(comp => comp.maxAlertLevel > 0)
  return alerts
})
