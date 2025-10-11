<template>
  <div>
    <v-card class="mt-10 rounded-xl" style="max-width: 600px; margin: auto;">
      <v-card-text class="pa-5 d-flex flex-column align-center">
        <div>
          <h2>Nom : <span class="font-weight-regular">{{ userStore.profile.name }}</span></h2>
          <h2>Rôle : <span class="font-weight-regular">{{ roles.find(role => role.role === userStore.profile.role)?.name }}</span></h2>
        </div>

        <div class="my-3 w-100">
          <v-divider class="border-opacity-75"></v-divider>
        </div>
        
        <h2>Accés rapide :</h2>
        <div class="d-flex flex-wrap justify-center mt-4" v-for="group in filteredNavItems">
          <v-btn v-for="item in group" :key="item.name" style="width: 150px; height: 150px;" class="rounded-lg ma-2" @click="$router.push(item.link)">
            <div class="d-flex flex-column align-center justify-center mb-4">
              <v-icon size="64">{{ item.icon }}</v-icon>
              <h3 class="font-weight-regular w-100 text-center pa-1">{{ item.title }}</h3>
            </div>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'
import roles from '@/config/roles.js'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      roles,
      navItems,
    }
  },
  computed: {
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for(let group of this.navItems) {
        for(let item of group) {
          if(item.roles.includes(this.userStore.profile.role) && item.link != this.$route.path) {
            currentGroup.push(item)
          }
        }
        if(currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    }
  },
  methods: {
  },
}
</script>