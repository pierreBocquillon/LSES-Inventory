<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="orders">Commandes</v-tab>
        <v-tab value="alert" v-if="['User','Agent','Direction','Admin'].includes(this.userStore.profile.role)">Alertes</v-tab>
        <v-tab value="history" v-if="['Agent','Direction','Admin'].includes(this.userStore.profile.role)">Historique</v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="orders">
          <OrderTab :items="items" :storages="storages" :companies="companies" />
        </v-tabs-window-item>

        <v-tabs-window-item value="alert" v-if="['User','Agent','Direction','Admin'].includes(this.userStore.profile.role)">
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
