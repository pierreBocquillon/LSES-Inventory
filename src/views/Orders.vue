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
        <v-tab value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'stock'].includes(p))">
          Historique
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="orders">
          <OrderTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

        <v-tabs-window-item value="alert">
          <AlertTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

        <v-tabs-window-item value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
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

import { initNotifManager, stopNotifManager, alerts, notifState } from '@/functions/nofifManager.js'

export default {
  props : [],
  components: {
    AlertTab,
    OrderTab,
    HistoryTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      
      tab: "orders",
    }
  },

  mounted() {
    initNotifManager()
  },

  computed:{
    alerts() {
      return alerts.value
    },
    orders() {
      return notifState.orders
    },
    storages() {
      return notifState.storages
    },
    companies() {
      return notifState.companies
    },
    items() {
      return notifState.items
    },
  },

  methods: {
  },

  beforeUnmount() {
    stopNotifManager()
  }
}
</script>
