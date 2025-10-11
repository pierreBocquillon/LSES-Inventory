<template>
  <v-app>
      <v-dialog v-model="showLoader" persistent max-width="500px">
        <v-card class="pa-10 d-flex flex-column align-center justify-center" style="border-radius: 20px; opacity: .9; overflow: hidden;">
          <h1 class="text-primary mb-3">Chargement ...</h1>
          <v-progress-circular color="primary" indeterminate :size="200" :width="10">
            <v-img class="mx-2" height="125" width="125" :src="require('@/assets/images/logo.png')"></v-img>
          </v-progress-circular>
        </v-card>
      </v-dialog>
    
      <Header v-if="ready && $route.meta.showNav && canAccess"></Header>
      <v-main v-if="ready && canAccess">
        <router-view class="w-100"/>
      </v-main>

      <v-main v-else-if="ready">
        <div class="d-flex flex-column justify-center align-center" style="height: 100vh;">
          <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%; overflow: auto;">
            <v-card-title class="text-center">
              <img :src="require('@/assets/images/logo.png')" height="150" />
              <h1 class="text-h4 mb-3 text-primary">Accès refusé</h1>
            </v-card-title>
            <v-card-text>
              <p class="text-center mb-3">Vous devez être connecté pour accéder à cette page.</p>
              <div class="d-flex flex-column justify-center align-center">
                <v-btn @click="$router.push('/login')" color="primary" class="mt-3">Aller à la page de connexion</v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-main>


      <footer class="pa-3 text-center header" v-if="ready && $route.meta.showNav">
        COPYRIGHT &copy; {{ new Date().getFullYear() }} T&T, All rights Reserved
      </footer>

  </v-app>
</template>

<script>
import { useDisplay } from 'vuetify'
import { useTheme } from 'vuetify'

import { getAuth, signOut, deleteUser } from '@firebase/auth'

import { useUserStore } from '@/store/user.js'

import Profile from "@/classes/Profile.js"

import Header from "@/components/common/Header.vue"

export default {
  components: {
    Header
  },
  setup() {
    const { mdAndUp } = useDisplay()
    const theme = useTheme()

    return { mdAndUp, theme }
  },
  data() {
    return {
      unsub: [],

      userStore: useUserStore(),

      loginModalIsOpen: false,

      ready: false,
    }
  },
  async mounted() {
    setTimeout(() => {
      this.ready = true
    }, 3000)

    getAuth().onAuthStateChanged(async (user) => {
      if(user) {
        this.unsub.push(await Profile.listenById(user.uid, async profile => {
          if(profile) {
            this.userStore.profile = profile
            this.userStore.uid = user.uid
            this.userStore.isLoggedIn = true

            this.ready = true

          }else{
            deleteUser(user).then(() => {
              this.userStore.isLoggedIn = false
              this.userStore.profile = null
              this.userStore.uid = null
            }).catch((error) => {
              console.log(error)
            })
          }
        }))
      }else{
        this.userStore.profile = null
        this.userStore.uid = null
      }
    })
  },
  computed: {
    showLoader() {
      return !this.ready
    },
    canAccess() {
      if(!this.$route.meta.needAccount){
        return true
      }else{
        if(this.userStore.isLoggedIn && this.userStore.profile && this.userStore.profile.activated){
          return true
        }else{
          return false
        }
      }
    }
  },
}
</script>