<template>
  <div>
    <template v-for="companyAlert in alerts" :key="companyAlert.company.id">
      <v-card class="mb-5 pa-3 rounded-xl" :color="(companyAlert.maxAlertLevel >= 2 ? 'error' : 'warning')" variant="tonal">
        <div class="d-flex flex-row align-center justify-start flex-wrap">
          <h2>{{ companyAlert.company.icon }} {{ companyAlert.company.name }} :</h2>
          <h3 class="pl-3">{{ companyAlert.totalItemCount }} item(s) ({{ companyAlert.totalWeight }} kg)</h3>
          <v-spacer></v-spacer>
          <v-btn color="accent" class="ml-3 rounded-xl" @click="openOrderCreationDialog(companyAlert.company)" v-if="!companyOrders.includes(companyAlert.company.id)">🛒Faire une commande</v-btn>
          <v-chip color="primary" class="py-5" v-else><h3 class="font-weight-regular">Une commande est en cours</h3></v-chip>
        </div>
        <div class="py-3 pl-5">
          <div v-for="itemAlert in companyAlert.items" :key="itemAlert.id" class="d-flex flex-row align-center justify-start mb-2" :class="(itemAlert.alertLevel >= 2 ? 'text-error' : (itemAlert.alertLevel >= 1 ? 'text-warning' : 'text-white'))">
            {{ itemAlert.info.icon }} {{ itemAlert.info.name }} - {{itemAlert.orderNeeded}} ({{ itemAlert.item.amount }}/{{ itemAlert.item.wanted }})
          </div>
          <div v-if="companyAlert.company.canDestroy && needToBeTrashed > 0" class="d-flex flex-row align-center justify-start mt-5 mb-2 text-white">
            🗑️ Destruction - ({{needToBeTrashed}})
          </div>
        </div>
      </v-card>
    </template>

    <v-dialog v-model="orderCreationDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-text>
          <h3 class="text-center mb-5">Choisir un mode de commande</h3>
          <div class="d-flex flex-row align-center justify-center flex-wrap">
            <v-btn variant="tonal" class="mx-2" @click="openOrderDialog(0)">Vide</v-btn>
            <v-btn variant="tonal" class="mx-2" @click="openOrderDialog(200)">200Kg max</v-btn>
            <v-btn variant="tonal" class="mx-2" @click="openOrderDialog(600)">600Kg max</v-btn>
            <v-btn variant="tonal" class="mx-2" @click="openOrderDialog(null)">Illimité</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="orderDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-text>
          <h3 class="text-center mb-5">Commande ({{ orderWeight }}kg):</h3>
          <table class="w-100">
            <tbody>
              <tr v-for="item in orderData.items" :key="item.id">
                <td>{{ item.info.icon }} {{ item.info.name }} ({{ Math.max(item.item.wanted - item.item.amount, 0) }})</td>
                <td style="width: 100px;">
                  <v-text-field hide-details variant="plain" type="number" density="compact" v-model="item.orderNeeded"></v-text-field>
                </td>
                <td style="width: 100px;">({{ Math.round(item.orderNeeded * item.info.weight * 100)/100 }}kg)</td>
              </tr>
              <tr v-if="needToBeTrashed > 0 && orderData.company.canDestroy">
                <td colspan="3">&nbsp;</td>
              </tr>
              <tr v-if="needToBeTrashed > 0 && orderData.company.canDestroy">
                <td  class="text-white">🗑️ Destruction ({{needToBeTrashed}})</td>
                <td colspan="2" style="width: 100px;">
                  <v-text-field hide-details variant="plain" type="number" density="compact" v-model="orderData.destroy"></v-text-field>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="d-flex flex-row align-center justify-center flex-wrap">
            <v-btn color="primary" class="mx-2" @click="saveOrder">Valider</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Order from '@/classes/Order.js'
import Instance from '@/classes/Instance.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../../functions/logger'

export default {
  props: ["items", "storages", "companies"],
  data() {
    return {
      unsub: [],

      userStore: useUserStore(),

      orders: [],
      companyOrders: [],
      instances: [],

      orderData: {
        company: null,
        mode: null,
        items: [],
        destroy: 0,
        weight: 0,
      },

      orderCreationDialog: false,
      orderDialog: false,
    }
  },
  mounted() {
    this.unsub.push(Order.listenAll(orders => {
      this.orders = orders
      this.companyOrders = this.orders.map(order => order.company)
    }))
    this.unsub.push(Instance.listenAll(instances => {
      this.instances = instances
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

        if(parseInt(item.wanted) > 0 && parseInt(item.amount) < parseInt(item.wanted)){
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
      alerts = Object.values(alerts).filter(comp => comp.totalAlertLevel > 0)
      alerts.sort((a, b) => b.totalAlertLevel - a.totalAlertLevel)
      return alerts
    },
    orderWeight() {
      return this.orderData.items.reduce((total, item) => total + (item.orderNeeded * item.info.weight), 0)
    },
    needToBeTrashed() {
      let needToBeTrashed = 0
      for(let item of this.items) {
        if(item.amount > 0 && item.isInstantiated && item.instanceByDate) {
          let instance = this.instances.find(i => i.id === item.id)
          if(instance) {
            for(let contentItem of instance.content) {
              if(new Date(contentItem.date) < new Date(new Date().toLocaleDateString()) && !contentItem.locked) {
                needToBeTrashed += parseInt(contentItem.amount)
              }
            }
          }
        }
      }
      return needToBeTrashed
    }
  },
  methods: {
    openOrderCreationDialog(company) {
      this.orderData = {
        company: company,
        mode: null,
        items: [],
        destroy: 0,
        weight: 0,
      }
      if( this.needToBeTrashed > 0 && company.canDestroy) {
        this.orderData.destroy = this.needToBeTrashed
      }
      this.orderCreationDialog = true
    },
    openOrderDialog(mode) {
      this.orderData.mode = mode
      this.computeOrderItems()
      this.orderCreationDialog = false
      this.orderDialog = true
    },
    computeOrderItems() {
      this.orderData.items = []
      this.orderData.weight = 0
      
      let currentAlert = this.alerts.find(alert => alert.company.id === this.orderData.company.id)
      if(!currentAlert) return

      if(this.orderData.mode == null || this.orderData.mode > currentAlert.totalWeight) {
        currentAlert.items.forEach(itemAlert => {
          if(itemAlert.orderNeeded > 0) {
            this.orderData.items.push(itemAlert)
            this.orderData.weight += (itemAlert.orderNeeded * itemAlert.info.weight)
          }
        })
      }else{
        let maxWeight = this.orderData.mode
        let ratio = maxWeight / currentAlert.totalWeight
        let currentWeight = 0

        let sortedItems = JSON.parse(JSON.stringify(currentAlert.items)).sort((a, b) => {
          if (b.alertLevel !== a.alertLevel) {
            return b.alertLevel - a.alertLevel
          }
          return b.orderNeeded - a.orderNeeded
        })

        for(let itemAlert of sortedItems) {

          let threshold = 10
          if(itemAlert.orderNeeded <= 10) threshold = 1
          if(itemAlert.orderNeeded <= 50) threshold = 5

          let amount = Math.floor((itemAlert.orderNeeded * ratio) / threshold) * threshold

          if(amount > 0) {
            let itemToOrder = JSON.parse(JSON.stringify(itemAlert))
            itemToOrder.orderNeeded = amount
            this.orderData.items.push(itemToOrder)
          }
          
          currentWeight += (amount * itemAlert.info.weight)
        }
        let remainingWeight = maxWeight - currentWeight
        if(remainingWeight > 0) {
          let noSolution = false
          while(!noSolution) {
            noSolution = true
            for(let itemAlert of sortedItems) {
              let currentItem = this.orderData.items.find(i => i.item.id === itemAlert.item.id)
              if(currentItem) {
                let threshold = 10
                if(itemAlert.orderNeeded <= 10) threshold = 1
                if(itemAlert.orderNeeded <= 50) threshold = 5

                if((currentItem.orderNeeded + threshold) <= itemAlert.orderNeeded && (currentWeight + (threshold * itemAlert.info.weight)) <= maxWeight) {
                  currentItem.orderNeeded += threshold
                  currentWeight += (threshold * itemAlert.info.weight)
                  noSolution = false
                }
              }
            }
          }
        }
        this.orderData.weight = currentWeight
      }

      let itemsToCheck = JSON.parse(JSON.stringify(this.items)).filter(i => this.getItemInfo(i).seller === this.orderData.company.id)
      for(let item of itemsToCheck){
        if(!this.orderData.items.some(i => i.info.id === item.id)) {
          let itemInfo = this.getItemInfo(item)
          if(itemInfo) {
            let itemData = {
              item: item,
              info: itemInfo,
              orderNeeded: 0,
              alertLevel: 0,
            }
            let currentItem = this.items.find(i => i.id === item.id)
            if(currentItem) {
              itemData.item.amount = currentItem.amount
              itemData.item.wanted = currentItem.wanted
            }else{
              itemData.item.amount = 0
              itemData.item.wanted = 0
            }
              
            this.orderData.items.push(itemData)
          }
        }
      }
    },
    async saveOrder(){
      let order = Order.initOne()
      order.company = this.orderData.company.id
      let tmp_items = this.orderData.items.map(item => {
        return {
          id: item.item.id,
          amount: item.orderNeeded,
        }
      })
      tmp_items = tmp_items.filter(i => i.amount > 0)
      
      order.items = tmp_items
      order.weight = this.orderWeight
      order.destroy = this.orderData.destroy

      await order.save()
      this.orderDialog = false
      
      logger.log(this.userStore.profile.id, 'COMMANDES', `Création d'une commande chez ${this.orderData.company.icon}${this.orderData.company.name} (${this.orderWeight} kg)`)
      
      Swal.fire({
        title: 'Commande enregistrée',
        text: `La commande chez ${this.orderData.company.name} a été enregistrée avec succès.`,
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        this.$emit('refreshOrders')
      })
    },
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
        unsub()
      }
    })
  }
}
</script>