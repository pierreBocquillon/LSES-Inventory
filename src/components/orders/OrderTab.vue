<template>
  <div>
    <template v-for="order in orders" :key="order.id">
      <v-card class="mb-5 pa-3 pl-5 rounded-xl" variant="tonal" color="white" v-if="getCompagnyInfo(order)">
        <div class="d-flex flex-row align-center justify-start flex-wrap">
          <h2>Commande - {{ getCompagnyInfo(order).icon }} {{ getCompagnyInfo(order).name }} :</h2>
          <v-spacer></v-spacer>
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
          <h3 class="mt-5">({{ order.weight }} kg)</h3>
        </div>
      </v-card>
    </template>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Order from '@/classes/Order.js'
import History from '@/classes/History.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../../functions/logger'

export default {
  props: ["items", "storages", "companies"],
  data() {
    return {
      unsub: [],

      userStore: useUserStore(),

      orders: [],
    }
  },
  mounted() {
    this.unsub.push(Order.listenAll(orders => {
      this.orders = orders
    }))
  },
  methods: {
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
            logger.log(this.userStore.profile.id, 'COMMANDES', `Validation d'une commande chez ${this.getCompagnyInfo(order).icon}${this.getCompagnyInfo(order).name} (${order.weight} kg) pour un montant de ${price}$`)
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
            logger.log(this.userStore.profile.id, 'COMMANDES', `Annulation d'une commande chez ${this.getCompagnyInfo(order).icon}${this.getCompagnyInfo(order).name} (${order.weight} kg)`)
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