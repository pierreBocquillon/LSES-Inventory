<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="garage">
          Garage
          <v-badge color="primary" v-if="notifAmount > 0" :content="notifAmount" offset-x="-5" floating></v-badge>
        </v-tab>
        <v-tab value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          Historique
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="garage">
          <GarageTab />
        </v-tabs-window-item>

        <v-tabs-window-item value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          <HistoryTab />
        </v-tabs-window-item>

      </v-tabs-window>

    </v-card>

  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../functions/logger'

import GarageTab from '@/components/garage/GarageTab.vue'
import HistoryTab from '@/components/garage/HistoryTab.vue'

import { initNotifManager, stopNotifManager, garageNotif } from '@/functions/nofifManager.js'

export default {
  props : [],
  components: {
    GarageTab,
    HistoryTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      tab: 'garage',
    }
  },

  mounted() {
    initNotifManager()
  },

  computed: {
    notifAmount() {
      return garageNotif.value
    }
  },

  beforeUnmount() {
    stopNotifManager()
  },
}
</script>
