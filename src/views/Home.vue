<template>
  <div>
    <v-card class="mt-10 rounded-xl" :style="'max-width: '+ (filteredNavItems.length > 1 ? '720px' : '380px') + '; margin: auto;'">
      <v-card-text class="pa-5 d-flex flex-column align-center">
        <div>
          <h2 class="text-center mb-2">Nom : <span class=" text-h5 font-weight-regular">{{ userStore.profile.name }}</span></h2>
          <h2 class="text-center mb-2">Permissions :
            <span v-if="!userStore.profile.permissions || userStore.profile.permissions.length == 0">Aucune</span> 
            <v-tooltip location="bottom" content-class="bg-background" text="string" v-for="item in userStore.profile.permissions">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="text-h6">{{ permissions.find(permission => permission.value == item)?.icon }}</span>
              </template>
              <h4>{{permissions.find(permission => permission.value == item)?.name}}</h4>
            </v-tooltip>
          </h2>
        </div>

        <div class="my-3 w-100">
          <v-divider class="border-opacity-75"></v-divider>
        </div>
        
        <h2>Accés rapide :</h2>
        <div class="d-flex align-center justify-center flex-wrap">
          <div v-for="group in filteredNavItems" class="d-flex align-center justify-center flex-wrap">
            <v-btn v-for="item in group" :key="item.link" style="width: 150px; height: 150px;" class="rounded-lg ma-2" @click="$router.push(item.link)">
              <div class="d-flex flex-column align-center justify-center mb-4">
                <v-icon size="64">{{ item.icon }}</v-icon>
                <v-badge color="primary" v-if="item.notif > 0" :content="item.notif" floating offset-x="-30" offset-y="-50"></v-badge>
                <h3 class="font-weight-regular w-100 text-center mt-3" style="height: 16px;white-space: normal;">{{ item.title }}</h3>
              </div>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'
import permissions from '@/config/permissions'

import { initNotifManager, stopNotifManager, notifState, storagesOutdated, garageNotif, alerts } from '@/functions/nofifManager.js'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      permissions,
      navItems,
    }
  },
  created() {
    initNotifManager()
  },
  computed: {
    storagesOutdated() {
      return storagesOutdated.value
    },
    garageNotif() {
      return garageNotif.value
    },
    alerts() {
      return alerts.value
    },
    waitingUsers() {
      return notifState.waitingUsers
    },
    waitingExpenseNotes() {
      return notifState.waitingExpenseNotes
    },
    orders() {
      return notifState.orders
    },
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for(let group of this.navItems) {
        for(let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []
          tmp_item.notif = 0

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if(itemRoute && itemRoute.meta && itemRoute.meta.permissions){
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if(tmp_item.permissions.length <= 0) hasAccess = true
          else if(userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if(userPerms && tmp_item.permissions.every(p => userPerms.includes(p))) hasAccess = true

          if(hasAccess && tmp_item.link != this.$route.path) {
            if(tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if(tmp_item.link == '/expenseNotes') {
              tmp_item.notif = this.waitingExpenseNotes.length
            }
            if(tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if(tmp_item.link == '/inventory') {
              tmp_item.notif = this.storagesOutdated
            }
            if(tmp_item.link == '/garage') {
              tmp_item.notif = this.garageNotif
            }
            currentGroup.push(tmp_item)
          }
        }
        if(currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    },
  },

  methods: {
  },
  beforeUnmount() {
    stopNotifManager()
  },
}
</script>