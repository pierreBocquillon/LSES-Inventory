<template>
  <v-app-bar app color="surface" dark class="header">
    <h1 class="d-flex align-center pointer" @click="$router.push('/')">
      <img :src="require('@/assets/images/logo.png')" height="52" />
      <span class="ml-2 text-h5 text-primary">LSES Inventory</span>
    </h1>
    <v-spacer></v-spacer>
    <div>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon variant="plain" v-bind="props">
            <v-icon size="32">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <template v-for="group in filteredNavItems">
            <template v-for="item in group">
              <v-list-item @click="$router.push(item.link)">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">{{ item.icon }}</v-icon>
                  <h3 class="font-weight-regular">{{ item.title }}</h3>
                </div>
              </v-list-item>
            </template>
            <v-divider color="white" class="my-2 border-opacity-75" thickness="1"></v-divider>
          </template>

          <v-list-item @click="logout">
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-logout</v-icon>
              <h3 class="font-weight-regular text-error">Se déconnecter</h3>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>
<script>
import { getAuth, signOut } from "firebase/auth"
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
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
    logout() {
      signOut(getAuth()).then(() => {
        this.$router.push('/login');
      }).catch(error => {
        console.error("Error signing out: ", error);
      });
    }
  }
}
</script>