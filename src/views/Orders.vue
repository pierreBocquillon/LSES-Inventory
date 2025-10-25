<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="orders">
          En cours
          <v-badge color="primary" v-if="orders.length > 0" :content="orders.length" offset-x="-5" floating></v-badge>
        </v-tab>
        <v-tab value="alert">
          Préparation
          <v-badge color="primary" v-if="alerts.length > 0" :content="alerts.length" offset-x="-5" floating></v-badge>
        </v-tab>
        <v-tab value="history" v-if="['PoleStock','Direction','Admin'].includes(this.userStore.profile.role)">
          Historique
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="orders">
          <OrderTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

        <v-tabs-window-item value="alert" v-if="['User','PoleStock','Direction','Admin'].includes(this.userStore.profile.role)">
          <AlertTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

        <v-tabs-window-item value="history" v-if="['Direction','Admin'].includes(this.userStore.profile.role)">
          <HistoryTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

      </v-tabs-window>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import AlertTab from '@/components/orders/AlertTab.vue'
import OrderTab from '@/components/orders/OrderTab.vue'
import HistoryTab from '@/components/orders/HistoryTab.vue'

import Storage from '@/classes/Storage.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import Order from '@/classes/Order.js'

export default {
  props : [],
  components: {
    AlertTab,
    OrderTab,
    HistoryTab,
  },
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      
      tab: "orders",

      storages: [],
      companies: [],
      items: [],
      orders: [],
    }
  },

  mounted() {
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

  computed:{
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
  },

  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub();
      }
    });
  }
}
</script>
