<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="my">
          Mes notes de frais
        </v-tab>
        <v-tab value="waiting" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          En attente
          <v-badge color="primary" v-if="waitingExpenseNotes.length > 0" :content="waitingExpenseNotes.length" floating offset-x="-5"></v-badge>
        </v-tab>
        <v-tab value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          Historique
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="my">
          <MyTab />
        </v-tabs-window-item>

        <v-tabs-window-item value="waiting" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          <WaitingTab />
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

import MyTab from '@/components/expenseNotes/MyTab.vue'
import WaitingTab from '@/components/expenseNotes/WaitingTab.vue'
import HistoryTab from '@/components/expenseNotes/HistoryTab.vue'

import { initNotifManager, stopNotifManager, notifState } from '@/functions/nofifManager.js'

export default {
  props : [],
  components: {
    MyTab,
    WaitingTab,
    HistoryTab
  },
  data() {
    return {
      userStore: useUserStore(),
      
      tab: "my",
    }
  },

  mounted() {
    initNotifManager()
  },

  computed:{
    waitingExpenseNotes() {
      return notifState.waitingExpenseNotes
    }
  },

  methods: {
  },

  beforeUnmount() {
    stopNotifManager()
  }
}
</script>
