<template>
  <div>
    <v-card class="mt-10 rounded-xl" style="max-width: 600px; margin: auto;">
      <v-card-text class="pa-5 d-flex flex-column align-center">
        <div>
          <h2 class="text-center mb-2">Nom : <span class=" text-h5 font-weight-regular">{{ userStore.profile.name }}</span></h2>
          <h2 class="text-center mb-2">Permissions :
            <span v-if="!userStore.profile.permissions || userStore.profile.permissions.length == 0">Aucune</span> 
            <v-tooltip location="bottom" content-class="bg-background" text="string" v-for="item in userStore.profile.permissions">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="text-h6">{{ permissions.find(permission => permission.value == item)?.icon }}</span>
              </template>
              <h4>{{permissions.find(permission => permission.value == item)?.name}}</h4>
            </v-tooltip>
          </h2>
        </div>

        <div class="my-3 w-100">
          <v-divider class="border-opacity-75"></v-divider>
        </div>
        
        <h2>Accés rapide :</h2>
        <div class="d-flex flex-wrap justify-center mt-4" v-for="group in filteredNavItems">
          <v-btn v-for="item in group" :key="item.link" style="width: 150px; height: 150px;" class="rounded-lg ma-2" @click="$router.push(item.link)">
            <div class="d-flex flex-column align-center justify-center mb-4">
              <v-icon size="64">{{ item.icon }}</v-icon>
              <v-badge color="primary" v-if="item.notif > 0" :content="item.notif" floating offset-x="-30" offset-y="-50"></v-badge>
              <h3 class="font-weight-regular w-100 text-center mt-3" style="height: 16px;white-space: normal;">{{ item.title }}</h3>
            </div>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'
import permissions from '@/config/permissions'

import Profile from '@/classes/Profile.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import Order from '@/classes/Order.js'
import Storage from '@/classes/Storage.js'
import SaveDate from '@/classes/SaveDate.js'
import ExpenseNote from '@/classes/ExpenseNote.js'
import { el } from 'vuetify/locale'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      permissions,
      navItems,
      unsub: [],
      waitingUsers: [],
      waitingExpenseNotes: [],
      companies: [],
      items: [],
      orders: [],
      storages: [],
      saveDates: [],
    }
  },
  created() {
    this.unsub.push(Profile.listenByActivated(false, users => {
      this.waitingUsers = users.filter(user => !user.rejected)
    }))
    this.unsub.push(ExpenseNote.listenAll(notes => {
      this.waitingExpenseNotes = notes.filter(note => !note.isPaid && !note.isRefused)
    }))
    this.unsub.push(SaveDate.listenAll(dates => {
      this.saveDates = {}
      dates.forEach(date => {
        this.saveDates[date.id] = date
      })
    }))
    this.unsub.push(Storage.listenAll(storages => {
      this.storages = storages
      this.storages.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Item.listenAll(items => {
      this.items = items
      this.items.sort((a, b) => a.id.localeCompare(b.id))
    }))
    this.unsub.push(Order.listenAll(orders => {
      this.orders = orders
    }))
  },
  computed: {
    storageDeltaTime(){
      let deltaTime = {}
      for(let storage of this.storages){
        if(this.saveDates[storage.id] == undefined){
          deltaTime[storage.id] = 9999
        }
        if(this.saveDates[storage.id]){
          deltaTime[storage.id] = (new Date().getTime() - new Date(this.saveDates[storage.id].date).getTime()) / (1000 * 60 * 60)
        }
      }
      return deltaTime
    },
    StoragesOutdated(){
      let amount = 0
      for(let storage of this.storages){
        if(this.storageDeltaTime[storage.id] >= 12){
          amount += 1
        }
      }
      return amount
    },
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for(let group of this.navItems) {
        for(let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []
          tmp_item.notif = 0

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if(itemRoute && itemRoute.meta && itemRoute.meta.permissions){
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if(tmp_item.permissions.length <= 0) hasAccess = true
          else if(userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if(userPerms && tmp_item.permissions.every(p => userPerms.includes(p))) hasAccess = true

          if(hasAccess && tmp_item.link != this.$route.path) {
            if(tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if(tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if(tmp_item.link == '/inventory') {
              tmp_item.notif = this.StoragesOutdated
            }
            currentGroup.push(tmp_item)
          }
        }
        if(currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    },
    alerts() {
      let alerts = {}
      this.companies.forEach(comp => {
        alerts[comp.id] = {
          company: comp,
          items: [],
          maxAlertLevel: 0,
          totalAlertLevel: 0,
          totalItemCount: 0,
          totalWeight: 0,
        }
      })
      this.items.forEach(item => {
        let tmp_alert = {
          item: item,
          info: this.getItemInfo(item),
          orderNeeded: 0,  
          alertLevel: 0,          
        }

        let threshold = 10
        if(parseInt(item.wanted) <= 10) threshold = 1
        if(parseInt(item.amount) <= 50) threshold = 5

        if(parseInt(item.wanted) > 0 && parseInt(item.amount) < parseInt(item.wanted) && (!item.isSecure || this.userStore.profile.permissions.some(p => ['dev', 'admin', 'security'].includes(p)))) {
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
      alerts = Object.values(alerts)//.filter(comp => comp.totalAlertLevel > 0)
      alerts.sort((a, b) => {
        if (b.maxAlertLevel == a.maxAlertLevel) {
          return b.totalWeight - a.totalWeight
        }else{
          return b.maxAlertLevel - a.maxAlertLevel
        }
      })
      alerts = alerts.filter(comp => comp.maxAlertLevel > 0)
      return alerts
    },
  },

  methods: {
    getItemInfo(item) {
      if(item.id.includes('#')) {
        let id = item.id.split('#')[0]
        let info = this.items.find(i => i.id === id) || {}
        if(info) {
          info = JSON.parse(JSON.stringify(info))
          info.alert = false

          info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
          info.name = info.name + ' ' + item.id.split('#')[1]

          info.old = false
          if(new Date(item.id.split('#')[1]) < new Date().setDate(new Date().getDate())) {
            info.old = true
          }

          info.sellerName = this.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
          return info
        }
      }else{
        let info = this.items.find(i => i.id === item.id) || {}
        info.alert = false
        info.old = false
        info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
        info.sellerName = this.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
        return info
      }
    },
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub()
    })
  },
}
</script>