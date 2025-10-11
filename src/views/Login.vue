<template>
  <div class="d-flex flex-column align-center justify-center" style="height: 100vh;">
    <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%;">
      <v-card-title class="text-center">
        <img :src="require('@/assets/images/logo.png')" height="150" />
        <h1 class="text-h4 mb-8 text-primary">LSES inventory</h1>
      </v-card-title>
      <v-card-text>
        <v-autocomplete v-model="name" :items="nameList" label="Nom" variant="outlined" color="primary" base-color="primary"></v-autocomplete>
        <v-text-field v-model="password" label="Mot de passe" type="password" variant="outlined" color="primary" base-color="primary"></v-text-field>
        <div class="d-flex flex-column justify-center align-center">
          <v-btn @click="login" color="primary" class="mt-3">Se connecter</v-btn>
          <span class="text-secondary mt-3">ou</span>
          <v-btn @click="askAccess" color="secondary" variant="text">Demande d'accès</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Profile from "@/classes/Profile.js"
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      name: '',
      password: '',
      profileList: [],
      nameList: [],
    }
  },
  async mounted(){
    signOut(getAuth()).then(() => {
      this.userStore.isLoggedIn = false
      this.userStore.profile = null
      this.userStore.uid = null
    })

    this.unsub.push(Profile.listenByActivated(true,async profiles => {
      this.profileList = profiles
      this.nameList = profiles.map(profile => profile.name)
    }))
  },
  methods: {
    askAccess() {
      this.$router.push('/askAccess')
    },
    login() {
      let selectedProfile = this.profileList.find(profile => profile.name === this.name)
      if(!selectedProfile) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le profil sélectionné n\'existe pas.',
          timer: 3000,
        })
        return
      }

      if(!this.password || this.password.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le mot de passe est requis.',
          timer: 3000,
        })
        return
      }

      let email = `${this.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@lses.ls`

      signInWithEmailAndPassword(getAuth(), email, this.password)
        .then(() => {
          this.userStore.profile = selectedProfile
          this.userStore.uid = getAuth().currentUser.uid
          this.userStore.isLoggedIn = true
          this.$router.push('/')
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Echec',
            text: 'Echec de la connexion. Vérifiez votre mot de passe.',
            timer: 3000,
          })
        })      
    }
  },
}
</script>