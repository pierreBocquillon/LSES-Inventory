<template>
  <v-app-bar app color="surface" dark class="header">
    <h1 class="d-flex align-center pointer" @click="$router.push('/')">
      <img :src="require('@/assets/images/logo.png')" height="52" />
      <span class="ml-2 text-h5 text-primary">LSES Inventory</span>
    </h1>
    <v-spacer></v-spacer>
    <div>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon variant="plain" v-bind="props">
            <v-icon size="32">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list style="min-width:250px">
          <template v-for="group in filteredNavItems">
            <template v-for="item in group">
              <v-list-item @click="$router.push(item.link)">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">{{ item.icon }}</v-icon>
                  <h3 class="font-weight-regular">{{ item.title }}</h3>
                  <v-badge color="primary" v-if="item.notif > 0" :content="item.notif" inline offset-x="-5"></v-badge>
                </div>
              </v-list-item>
            </template>
            <v-divider color="white" class="my-2 border-opacity-75" thickness="1"></v-divider>
          </template>

          <v-list-item @click="logout">
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-logout</v-icon>
              <h3 class="font-weight-regular text-error">Se déconnecter</h3>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>
<script>
import { getAuth, signOut } from "firebase/auth"
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'
import roles from '@/config/roles.js'

import Profile from '@/classes/Profile.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import Order from '@/classes/Order.js'
import Storage from '@/classes/Storage.js'
import SaveDate from '@/classes/SaveDate.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      navItems,
      roles,
      unsub: [],
      waitingUsers: [],
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
          let itemRoute = this.$router.resolve({ path: item.link })
          if(itemRoute && itemRoute.meta && itemRoute.meta.roles){
            item.roles = itemRoute.meta.roles
          }else{
            item.roles = this.roles.map(r => r.role)
          }

          if(item.roles.includes(this.userStore.profile.role) && item.link != this.$route.path) {
            item.notif = 0
            if(item.link == '/users') {
              item.notif = this.waitingUsers.length
            }
            if(item.link == '/orders') {
              item.notif = this.orders.length + this.alerts.length
            }
            if(item.link == '/inventory') {
              item.notif = this.StoragesOutdated
            }
            currentGroup.push(item)
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

        if(parseInt(item.wanted) > 0 && parseInt(item.amount) < parseInt(item.wanted) && (!item.isSecure || ['Direction','Admin'].includes(this.userStore.profile.role))) {
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
    logout() {
      signOut(getAuth()).then(() => {
        this.$router.push('/login');
      }).catch(error => {
        console.error("Error signing out: ", error);
      });
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub()
    })
  },
}
</script>