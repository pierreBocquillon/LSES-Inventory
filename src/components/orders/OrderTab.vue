<template>
  <div>
    <template v-for="order in orders" :key="order.id">
      <v-card class="mb-5 pa-3 pl-5 rounded-xl" variant="tonal" color="white" v-if="getCompagnyInfo(order)">
        <div class="d-flex flex-row align-center justify-start flex-wrap">
          <h2>Commande - {{ getCompagnyInfo(order).icon }} {{ getCompagnyInfo(order).name }} :</h2>
          <v-spacer></v-spacer>
          <v-btn variant="tonal" color="info" class="ml-3 rounded-xl" @click="copyMessage(order)">📄 Copier</v-btn>
          <v-btn variant="tonal" color="deep-orange" class="ml-3 rounded-xl" @click="openEditOrder(order)">✏️ Modifier</v-btn>
          <v-btn variant="tonal" color="error" class="ml-3 rounded-xl" @click="deleteOrder(order)">❌ Annuler</v-btn>
          <v-btn variant="tonal" color="success" class="ml-3 rounded-xl" @click="payOrder(order)">💵 Valider</v-btn>
        </div>
        <div class="py-3">
          <template v-for="orderItem in order.items" :key="orderItem.id">
            <div class="pl-3 d-flex flex-row align-center justify-start mb-2" v-if="orderItem && orderItem.amount > 0 && orderItem.id && getItemInfo(orderItem.id)">
              {{ getItemInfo(orderItem.id).icon }} {{ getItemInfo(orderItem.id).name }} - {{orderItem.amount}}
            </div>
          </template>
          <div class="pl-3 d-flex flex-row align-center justify-start mt-5 mb-2" v-if="order.destroy && order.destroy > 0">
            🗑️ Destruction - {{ order.destroy }}
          </div>
          <h3 class="mt-5">({{ Math.round(order.weight*100)/100 }} kg)</h3>
        </div>
      </v-card>
    </template>

    <v-dialog v-model="editOrderDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-text>
          <h3 class="text-center mb-5">Commande ({{ Math.round(this.currentWeight*100)/100 }}kg):</h3>
          <table class="w-100">
            <tbody>
              <template v-for="itemData of editOrder.items" :key="itemData.id">
                <tr v-if="!getItemInfo(itemData.id).isSecure || ['Direction','Admin'].includes(this.userStore.profile.role)">
                  <td>{{ getItemInfo(itemData.id).icon }} {{ getItemInfo(itemData.id).name }} ({{ Math.max(getItemInfo(itemData.id).wanted - getItemInfo(itemData.id).amount, 0) }})</td>
                  <td style="width: 100px;">
                    <v-text-field hide-details variant="plain" type="number" density="compact" v-model="itemData.amount"></v-text-field>
                  </td>
                  <td style="width: 100px;">({{ Math.round(itemData.amount * getItemInfo(itemData.id).weight * 100)/100 }}kg)</td>
                </tr>
              </template>
              <tr v-if="getCompagnyInfo(editOrder).canDestroy">
                <td colspan="3">&nbsp;</td>
              </tr>
              <tr v-if="getCompagnyInfo(editOrder).canDestroy">
                <td  class="text-white">🗑️ Destruction ({{needToBeTrashed}})</td>
                <td colspan="2" style="width: 100px;">
                  <v-text-field hide-details variant="plain" type="number" density="compact" v-model="editOrder.destroy"></v-text-field>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-3 d-flex flex-row align-center justify-center flex-wrap">
            <v-btn color="error" variant="tonal" class="mx-2" @click="cancelEditOrder">Annuler</v-btn>
            <v-btn color="primary" variant="tonal" class="mx-2" @click="saveEditOrder">Valider</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Order from '@/classes/Order.js'
import History from '@/classes/History.js'
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
      instances: [],

      editOrderDialog: false,
      editOrder: null,
    }
  },
  mounted() {
    this.unsub.push(Order.listenAll(orders => {
      this.orders = orders
    }))
    this.unsub.push(Instance.listenAll(instances => {
      this.instances = instances
    }))
  },
  computed: {
    needToBeTrashed() {
      let needToBeTrashed = 0
      for(let item of this.items) {
        if(item.amount > 0 && item.isInstantiated && item.instanceByDate) {
          let instance = this.instances.find(i => i.id === item.id)
          if(instance) {
            for(let contentItem of instance.content) {
              if(new Date(contentItem.date.split('/').reverse().join('-')).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && !contentItem.locked) {
                needToBeTrashed += parseInt(contentItem.amount)
              }
            }
          }
        }
      }
      return needToBeTrashed
    },
    currentWeight(){
      let weight = 0
      this.editOrder.items.forEach(orderItem => {  
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          weight += this.getItemInfo(orderItem.id).weight * orderItem.amount
        }
      })
      return weight
    }
  },
  methods: {
    openEditOrder(order) {
      this.editOrder = Object.assign(new Order(), order)
      let orderItems = []
      this.items.sort((a, b) => a.name.localeCompare(b.name))
      for(let item of this.items) {
        if(item.seller == order.company) {
          orderItems.push({
            id: item.id,
            amount: order.items.find(oi => oi.id == item.id)?.amount || 0
          })
        }
      }
      this.editOrder.items = orderItems
      this.editOrderDialog = true
    },
    cancelEditOrder() {
      this.editOrderDialog = false
    },
    saveEditOrder(){
      this.editOrder.weight = 0
      this.editOrder.items.forEach(orderItem => {
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          this.editOrder.weight += this.getItemInfo(orderItem.id).weight * orderItem.amount
        }
      })
      logger.log(this.userStore.profile.id, 'COMMANDES', `Modification d'une commande chez ${this.getCompagnyInfo(this.editOrder).icon}${this.getCompagnyInfo(this.editOrder).name} (${Math.round(this.editOrder.weight*100)/100} kg)`)
      this.editOrder.save().then(() => {
        Swal.fire(
          'Modifié !',
          'La commande a été modifiée.',
          'success'
        )
        this.editOrderDialog = false
      }).catch(err => {
        Swal.fire(
          'Erreur !',
          'Une erreur est survenue lors de la modification de la commande.',
          'error'
        )
      })
    },
    copyMessage(order){
      let message = "Commande - " + this.getCompagnyInfo(order).icon + " " + this.getCompagnyInfo(order).name + " :\n\n"
      order.items.forEach(orderItem => {  
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          message += this.getItemInfo(orderItem.id).icon + " " + this.getItemInfo(orderItem.id).name + " - " + orderItem.amount + "\n"
        }
      })
      if (order.destroy && order.destroy > 0) {
        message += "\n" + "🗑️ Destruction - " + order.destroy + "\n"
      }
      message += "\n(" + Math.round(order.weight*100)/100 + " kg)"
      navigator.clipboard.writeText(message).then(() => {
        Swal.fire({
          title: 'Copié !',
          text: `Le message de la commande a été copié dans le presse-papier.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      })
    },
    getCompagnyInfo(order){
      return this.companies.find(c => c.id == order.company)
    },
    getItemInfo(item){
      return this.items.find(i => i.id == item)
    },
    payOrder(order) {
      Swal.fire({
        title: 'Entrer le montant total de cette commande',
        input: 'number',
        inputAttributes: {
          step: 0.01
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const price = result.value

          if (isNaN(parseInt(price)) || parseInt(price) < 0) {
            Swal.fire(
              'Erreur !',
              'Le montant entré est invalide.',
              'error'
            )
            return
          }

          let orderData = JSON.parse(JSON.stringify(order))
          let history = History.initOne()
          
          history.company = orderData.company
          history.items = orderData.items
          history.weight = orderData.weight
          history.destroy = orderData.destroy
          history.price = price
          history.payDate = new Date().getTime()

          let showWarning = false
          let warningItems = []

          for (let item of orderData.items) {
            let currentItem = this.items.find(i => i.id == item.id)
            if (currentItem && !currentItem.isInstantiated) {
              currentItem.amount = parseInt(currentItem.amount) + parseInt(item.amount)
              currentItem.save()
            }else if (currentItem.isInstantiated) {
              showWarning = true
              warningItems.push(item)
            }
          }

          history.save().then(() => {
            logger.log(this.userStore.profile.id, 'COMMANDES', `Validation d'une commande chez ${this.getCompagnyInfo(order).icon}${this.getCompagnyInfo(order).name} (${Math.round(order.weight*100)/100} kg) pour un montant de ${price}$`)
            order.delete()
            if (showWarning) {
              Swal.fire(
                'Attention !',
                'Certains items de cette commande contiennent des instances qui devrons etre mis a jour a la main! ( ' + warningItems.map(i => this.getItemInfo(i.id)?.icon + ' ' + this.getItemInfo(i.id)?.name).join(', ') + ' )',
                'warning'
              )
            }else{
              Swal.fire(
                'Commande validée !',
                'La commande a été enregistrée dans l\'historique.',
                'success'
              )
            }
          }).catch(err => {
            Swal.fire(
              'Erreur !',
              'Une erreur est survenue lors de l\'enregistrement de la commande.',
              'error'
            )
          })
        }
      })
    },
    deleteOrder(order) {
      Swal.fire({
        title: 'Êtes-vous sûr de vouloir annuler cette commande ?',
        text: "Cette action est irréversible !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui !',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          order.delete().then(() => {
            logger.log(this.userStore.profile.id, 'COMMANDES', `Annulation d'une commande chez ${this.getCompagnyInfo(order).icon}${this.getCompagnyInfo(order).name} (${Math.round(order.weight*100)/100} kg)`)
            Swal.fire(
              'Annulé !',
              'La commande a été annulée.',
              'success'
            )
          }).catch(err => {
            Swal.fire(
              'Erreur !',
              'Une erreur est survenue lors de l\'annulation de la commande.',
              'error'
            )
          })
        }
      })
    }
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