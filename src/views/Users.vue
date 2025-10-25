<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="users">
          Utilisateurs
        </v-tab>
        <v-tab value="ask">
          <span>Demandes en attente</span>
          <v-badge color="primary" v-if="waitingUsers.length > 0" :content="waitingUsers.length" offset-x="-5" floating></v-badge>
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="users">
          <UsersTab />
        </v-tabs-window-item>
        <v-tabs-window-item value="ask">
          <AskTab />
        </v-tabs-window-item>

      </v-tabs-window>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import UsersTab from '@/components/users/UsersTab.vue'
import AskTab from '@/components/users/AskTab.vue'

import Profile from '@/classes/Profile.js'

export default {
  props : [],
  components: {
    UsersTab,
    AskTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      tab: 'users',
      unsub: [],
      waitingUsers: [],
    }
  },
  created() {
    this.unsub.push(Profile.listenByActivated(false, users => {
      this.waitingUsers = users.filter(user => !user.rejected)
    }))
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub()
    })
  },
}
</script>
