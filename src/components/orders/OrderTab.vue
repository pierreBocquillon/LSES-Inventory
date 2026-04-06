<template>
  <div>
    <template v-for="order in orders" :key="order.id">
      <v-card v-if="getCompagnyInfo(order)" class="mb-4 rounded-xl" variant="tonal" :style="{ backgroundColor: getStatusBgColor(order.status) }">

        <!-- En-tête -->
        <v-card-title class="d-flex flex-wrap align-center ga-2 pt-3 px-4">
          <v-select
            v-model="order.status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            density="compact"
            hide-details
            variant="tonal"
            :base-color="getStatusColor(order.status)"
            :color="getStatusColor(order.status)"
            class="rounded-lg flex-grow-0"
            style="min-width: 200px; max-width: 200px;"
            @update:modelValue="updateOrderStatus(order)"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color" size="x-small" class="mr-1">mdi-circle</v-icon>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <div class="d-flex align-center ga-1">
                <v-icon :color="item.raw.color" size="x-small">mdi-circle</v-icon>
                <span class="text-body-2 font-weight-medium">{{ item.raw.label }}</span>
              </div>
            </template>
          </v-select>
          <span class="text-h6 font-weight-bold">
            {{ getCompagnyInfo(order).icon }} {{ getCompagnyInfo(order).name }}
          </span>
          <v-spacer />
          <v-tooltip text="Copier le message" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="tonal" color="info" size="small" @click="copyMessage(order)">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Modifier" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="tonal" color="deep-orange" size="small" @click="openEditOrder(order)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Modifier le prix" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="tonal" color="success" size="small" @click="openPriceDialog(order)">
                <v-icon>mdi-currency-usd</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Annuler la commande" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="tonal" color="error" size="small" @click="deleteOrder(order)">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn variant="tonal" color="success" size="small" class="rounded-lg" @click="payOrder(order)">
            <v-icon start>mdi-check</v-icon>
            Valider
          </v-btn>
        </v-card-title>

        <v-divider class="mx-4" />

        <!-- Contenu -->
        <v-card-text class="px-5 pb-2 pt-3">
          <v-expansion-panels variant="accordion" class="rounded-lg">
            <v-expansion-panel elevation="0" style="background: transparent;">
              <v-expansion-panel-title class="px-2 py-1 text-body-1 text-medium-emphasis" style="min-height: 36px;">
                <div class="d-flex align-center ga-6 w-100">
                  <span>{{ order.items.filter(i => i && i.amount > 0 && i.id && getItemInfo(i.id)).length + (order.destroy && order.destroy > 0 ? 1 : 0) }} article(s)</span>
                  <span>
                    <v-icon size="x-small" class="mr-1">mdi-weight</v-icon>{{ Math.round(order.weight * 100) / 100 }} kg
                  </span>
                  <span>
                    <v-icon size="x-small" class="mr-1">mdi-cash</v-icon>
                    <span v-if="order.price !== null && order.price !== ''">{{ order.price }} $</span>
                    <span v-else class="font-italic">Inconnue</span>
                  </span>
                  <v-spacer />
                  <span v-if="order.updatedAt" class="mr-2">
                    <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>{{ formatDate(order.updatedAt) }}
                  </span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="px-2 pb-2">
                <table style="border-collapse: collapse;">
                  <tbody>
                    <tr
                      v-for="orderItem in order.items.filter(i => i && i.amount > 0 && i.id && getItemInfo(i.id))"
                      :key="orderItem.id"
                    >
                      <td class="text-body-2 py-1 pr-4" style="white-space: nowrap;">
                        {{ getItemInfo(orderItem.id).icon }} {{ getItemInfo(orderItem.id).name }}
                      </td>
                      <td class="text-body-2 font-weight-medium py-1" style="white-space: nowrap;">
                        × {{ orderItem.amount }}
                      </td>
                    </tr>
                    <tr v-if="order.destroy && order.destroy > 0">
                      <td class="text-body-2 text-error py-1 pr-4" style="white-space: nowrap;">
                        🗑️ Destruction
                      </td>
                      <td class="text-body-2 font-weight-medium text-error py-1" style="white-space: nowrap;">
                        × {{ order.destroy }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>



      </v-card>
    </template>

    <!-- Dialog prix -->
    <v-dialog v-model="priceDialog" max-width="360px">
      <v-card class="rounded-xl">
        <v-card-title class="text-center pt-5 pb-1">Modifier le prix</v-card-title>
        <v-card-subtitle class="text-center pb-3" v-if="priceOrder">
          {{ getCompagnyInfo(priceOrder)?.icon }} {{ getCompagnyInfo(priceOrder)?.name }}
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="pt-4">
          <v-text-field
            v-model="priceValue"
            type="number"
            density="comfortable"
            variant="outlined"
            label="Prix ($)"
            class="rounded-lg"
            hide-details
            autofocus
            @keyup.enter="savePriceDialog"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-center pa-4 ga-2">
          <v-btn color="error" variant="tonal" class="rounded-lg" @click="priceDialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="tonal" class="rounded-lg" @click="savePriceDialog">Valider</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog édition -->
    <v-dialog v-model="editOrderDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title class="text-center pt-5 pb-1">
          Modifier la commande
        </v-card-title>
        <v-card-subtitle class="text-center pb-3">
          {{ Math.round(currentWeight * 100) / 100 }} kg
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="pt-4">
          <table class="w-100">
            <tbody>
              <template v-for="itemData of editOrder.items" :key="itemData.id">
                <tr v-if="!getItemInfo(itemData.id).isSecure || userStore.profile.permissions.some(p => ['dev', 'admin', 'security'].includes(p))">
                  <td>{{ getItemInfo(itemData.id).icon }} {{ getItemInfo(itemData.id).name }} ({{ Math.max(getItemInfo(itemData.id).wanted - getItemInfo(itemData.id).amount, 0) }})</td>
                  <td style="width: 100px;">
                    <v-text-field hide-details variant="plain" type="number" density="compact" v-model="itemData.amount" />
                  </td>
                  <td style="width: 110px;" class="text-medium-emphasis text-caption">
                    {{ Math.round(itemData.amount * getItemInfo(itemData.id).weight * 100) / 100 }} kg
                  </td>
                </tr>
              </template>
              <tr v-if="getCompagnyInfo(editOrder).canDestroy"><td colspan="3" class="py-2" /></tr>
              <tr v-if="getCompagnyInfo(editOrder).canDestroy">
                <td>🗑️ Destruction ({{ needToBeTrashed }})</td>
                <td colspan="2" style="width: 100px;">
                  <v-text-field hide-details variant="plain" type="number" density="compact" v-model="editOrder.destroy" />
                </td>
              </tr>
            </tbody>
          </table>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-center pa-4 ga-2">
          <v-btn color="error" variant="tonal" class="rounded-lg" @click="cancelEditOrder">Annuler</v-btn>
          <v-btn color="primary" variant="tonal" class="rounded-lg" @click="saveEditOrder">Valider</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import { useAchievementStore } from '@/store/achievements.js'

import Order from '@/classes/Order.js'
import History from '@/classes/History.js'
import Instance from '@/classes/Instance.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../../functions/logger'

export default {
  props: ['items', 'storages', 'companies'],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      achievementStore: useAchievementStore(),
      orders: [],
      instances: [],
      editOrderDialog: false,
      editOrder: null,
      priceDialog: false,
      priceOrder: null,
      priceValue: null,
      statusOptions: [
        { label: 'A faire',             value: 'A faire',             color: 'error'   },
        { label: 'Message envoyé',      value: 'Message envoyé',      color: 'blue'    },
        { label: 'A relancer',          value: 'A relancer',          color: 'orange'  },
        { label: 'Attente de réception',value: 'Attente de réception',color: 'success' },
      ],
    }
  },
  mounted() {
    this.unsub.push(Order.listenAll(orders => { this.orders = orders }))
    this.unsub.push(Instance.listenAll(instances => { this.instances = instances }))
  },
  computed: {
    needToBeTrashed() {
      let total = 0
      for (const item of this.items) {
        if (item.amount > 0 && item.isInstantiated && item.instanceByDate) {
          const instance = this.instances.find(i => i.id === item.id)
          if (instance) {
            for (const contentItem of instance.content) {
              if (
                new Date(contentItem.date.split('/').reverse().join('-')).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
                !contentItem.locked
              ) {
                total += parseInt(contentItem.amount)
              }
            }
          }
        }
      }
      return total
    },
    currentWeight() {
      let weight = 0
      this.editOrder.items.forEach(orderItem => {
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          weight += this.getItemInfo(orderItem.id).weight * orderItem.amount
        }
      })
      return weight
    },
  },
  methods: {
    getCompagnyInfo(order) {
      return this.companies.find(c => c.id == order.company)
    },
    getItemInfo(id) {
      return this.items.find(i => i.id == id)
    },
    getStatusColor(status) {
      const map = {
        'A faire':              'error',
        'Message envoyé':       'blue',
        'A relancer':           'orange',
        'Attente de réception': 'success',
      }
      return map[status] || 'error'
    },
    getStatusBgColor(status) {
      const map = {
        'A faire':              'rgba(229,57,53,0.12)',
        'Message envoyé':       'rgba(33,150,243,0.12)',
        'A relancer':           'rgba(255,152,0,0.12)',
        'Attente de réception': 'rgba(76,175,80,0.12)',
      }
      return map[status] || 'rgba(229,57,53,0.12)'
    },
    formatDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    },

    // --- Statut ---
    updateOrderStatus(order) {
      order.save().catch(() => Swal.fire('Erreur !', 'Impossible de mettre à jour le statut.', 'error'))
    },

    // --- Prix ---
    openPriceDialog(order) {
      this.priceOrder = order
      this.priceValue = order.price ?? null
      this.priceDialog = true
    },
    savePriceDialog() {
      const val = parseFloat(this.priceValue)
      if (!isNaN(val) && val >= 0) {
        this.priceOrder.price = val
        this.priceOrder.save().catch(() => Swal.fire('Erreur !', 'Impossible de mettre à jour le prix.', 'error'))
      }
      this.priceDialog = false
    },

    // --- Édition ---
    openEditOrder(order) {
      this.editOrder = Object.assign(new Order(), order)
      const orderItems = []
      this.items.sort((a, b) => a.name.localeCompare(b.name))
      for (const item of this.items) {
        if (item.seller == order.company) {
          orderItems.push({
            id: item.id,
            amount: order.items.find(oi => oi.id == item.id)?.amount || 0,
          })
        }
      }
      this.editOrder.items = orderItems
      this.editOrderDialog = true
    },
    cancelEditOrder() {
      this.editOrderDialog = false
    },
    saveEditOrder() {
      this.editOrder.weight = 0
      this.editOrder.items.forEach(orderItem => {
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          this.editOrder.weight += this.getItemInfo(orderItem.id).weight * orderItem.amount
        }
      })
      const company = this.getCompagnyInfo(this.editOrder)
      logger.log(this.userStore.profile.id, 'COMMANDES', `Modification d'une commande chez ${company.icon}${company.name} (${Math.round(this.editOrder.weight * 100) / 100} kg)`)
      this.editOrder.save()
        .then(() => {
          this.editOrderDialog = false
          Swal.fire('Modifié !', 'La commande a été modifiée.', 'success')
        })
        .catch(() => Swal.fire('Erreur !', 'Une erreur est survenue lors de la modification.', 'error'))
    },

    // --- Copie ---
    copyMessage(order) {
      const company = this.getCompagnyInfo(order)
      let message = `Commande - ${company.icon} ${company.name} :\n\n`
      order.items.forEach(orderItem => {
        if (orderItem && orderItem.amount > 0 && orderItem.id && this.getItemInfo(orderItem.id)) {
          const item = this.getItemInfo(orderItem.id)
          message += `${item.icon} ${item.name} - ${orderItem.amount}\n`
        }
      })
      if (order.destroy && order.destroy > 0) {
        message += `\n🗑️ Destruction - ${order.destroy}\n`
      }
      message += `\n(${Math.round(order.weight * 100) / 100} kg)`
      navigator.clipboard.writeText(message).then(() => {
        Swal.fire({ title: 'Copié !', text: 'Le message a été copié dans le presse-papier.', icon: 'success', timer: 2000, showConfirmButton: false })
      })
    },

    // --- Validation ---
    payOrder(order) {
      const doValidate = (price) => {
        const orderData = JSON.parse(JSON.stringify(order))
        const company = this.getCompagnyInfo(order)
        const history = History.initOne()

        history.company  = orderData.company
        history.items    = orderData.items
        history.weight   = orderData.weight
        history.destroy  = orderData.destroy
        history.price    = price
        history.payDate  = new Date().getTime()

        let showWarning = false
        const warningItems = []

        for (const item of orderData.items) {
          const currentItem = this.items.find(i => i.id == item.id)
          if (currentItem && !currentItem.isInstantiated) {
            currentItem.amount = parseInt(currentItem.amount) + parseInt(item.amount)
            currentItem.save()
          } else if (currentItem && currentItem.isInstantiated) {
            showWarning = true
            warningItems.push(item)
          }
        }

        history.save()
          .then(() => {
            logger.log(this.userStore.profile.id, 'COMMANDES', `Validation d'une commande chez ${company.icon}${company.name} (${Math.round(orderData.weight * 100) / 100} kg) pour ${price}$`)
            this.achievementStore.incrementStat('orders_completed', 1, 1)
            order.delete()
            if (showWarning) {
              Swal.fire(
                'Attention !',
                'Certains items contiennent des instances à mettre à jour manuellement : ' +
                  warningItems.map(i => `${this.getItemInfo(i.id)?.icon} ${this.getItemInfo(i.id)?.name}`).join(', '),
                'warning'
              )
            } else {
              Swal.fire('Commande validée !', "La commande a été enregistrée dans l'historique.", 'success')
            }
          })
          .catch(() => Swal.fire('Erreur !', "Une erreur est survenue lors de l'enregistrement.", 'error'))
      }

      const priceVal = parseFloat(order.price)
      const priceAlreadySet = !isNaN(priceVal) && priceVal >= 0 && order.price !== null && order.price !== ''

      if (priceAlreadySet) {
        doValidate(priceVal)
      } else {
        Swal.fire({
          title: 'Montant total de la commande',
          input: 'number',
          inputAttributes: { min: 0, step: 0.01 },
          showCancelButton: true,
          confirmButtonText: 'Valider',
          cancelButtonText: 'Annuler',
        }).then(result => {
          if (!result.isConfirmed) return
          const price = parseFloat(result.value)
          if (isNaN(price) || price < 0) {
            Swal.fire('Erreur !', 'Le montant entré est invalide.', 'error')
            return
          }
          doValidate(price)
        })
      }
    },

    // --- Suppression ---
    deleteOrder(order) {
      // On capture les infos avant tout appel asynchrone
      const company = this.getCompagnyInfo(order)
      const weight  = order.weight
      const orderId = order.id

      Swal.fire({
        title: `Annuler la commande ?`,
        html: `<b>${company?.icon} ${company?.name}</b><br><span class="text-caption">${Math.round(weight * 100) / 100} kg</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Oui, annuler',
        cancelButtonText: 'Non, garder',
      }).then(result => {
        if (!result.isConfirmed) return
        order.delete()
          .then(() => {
            logger.log(this.userStore.profile.id, 'COMMANDES', `Annulation d'une commande chez ${company?.icon}${company?.name} (${Math.round(weight * 100) / 100} kg)`)
            Swal.fire('Annulée !', 'La commande a été annulée.', 'success')
          })
          .catch(() => Swal.fire('Erreur !', "Une erreur est survenue lors de l'annulation.", 'error'))
      })
    },
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => { if (typeof unsub === 'function') unsub() })
  },
}
</script>
