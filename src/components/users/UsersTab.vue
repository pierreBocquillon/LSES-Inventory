<template>
  <div class="mt-5 d-flex flex-column align-center justify-center h-100">
    
    <v-data-table :headers="headers" :items="users" items-per-page="-1" no-data-text="Aucun utilisateur">
      <template v-slot:bottom />

      <template v-slot:item.permissions="{ item }">
        <span v-if="item.permissions && item.permissions.length > 0">
          <v-tooltip location="top" content-class="bg-background" text="string" v-for="perm in item.permissions">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="mx-1 text-h5">{{ allPermissions.find(p => p.value === perm)?.icon }}</span>
            </template>
            <h4>{{allPermissions.find(p => p.value === perm)?.name}}</h4>
          </v-tooltip>
        </span>
        <span v-else>Aucune</span>
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn icon color="primary" variant="text" @click="resetPassword(item)" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin'].includes(p))">
          <v-icon>mdi-lock-reset</v-icon>
        </v-btn>
        <v-btn icon color="accent" variant="text" @click="editItem(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>

    </v-data-table>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Modifier un utilisateur</v-card-title>
        <v-card-text>
          <h3 class="mb-3">{{ currentUser.name }}</h3>
          <v-select label="Permissions" v-model="currentUser.permissions" :items="myPermissions" item-title="fullname" item-value="value" multiple>
            <template v-slot:selection="{ item, index }">
              <div>
                <h3 class="font-weight-regular">{{ item.raw.icon }}</h3>
              </div>
            </template>
          </v-select>
          <v-btn color="error" variant="outlined" class="w-100" @click="deleteItem(currentUser)">Supprimer cet utilisateur</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="addItem">{{ currentUser.id ? 'Modifier' : 'Ajouter' }}</v-btn>
          <v-btn text @click="closeUserDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { getFunctions, httpsCallable } from 'firebase/functions'

import { useUserStore } from '@/store/user.js'

import permissions from '@/config/permissions.js'

import Profile from '@/classes/Profile.js'

import logger from '@/functions/logger.js'

export default {
  data() {
    return {
      unsub: [],
      functions: getFunctions(),
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', sortable: true, align: 'start' },
        { title: 'Permissions', key: 'permissions', sortable: true, align: 'start' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
      allPermissions: permissions,
      users: [],

      dialog: false,
      currentUser: null,
    }
  },
  mounted() {
    this.unsub.push(Profile.listenByActivated(true, users => {
      this.users = users
    }))
  },
  computed: {
    myPermissions() {
      let permissions = []
      for(let perm of this.allPermissions) {
        if(this.userStore.profile.permissions.includes(perm.value) || this.userStore.profile.permissions.includes('dev') || this.userStore.profile.permissions.includes('admin')) {
          permissions.push(perm)
        }
      }
      return permissions
    },
  },
  methods: {
    async resetPassword(user) {
      Swal.fire({
        title: 'Confirmer la réinitialisation',
        text: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de "${user.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz" +
            "0123456789"

          let password = ""
          for (let i = 0; i < 24; i++) {
              const randomIndex = Math.floor(Math.random() * chars.length)
              password += chars[randomIndex]
          }
          let tmp_password = password
          
          httpsCallable(this.functions, 'changePassword')({
            userId: user.id,
            hash: btoa(tmp_password),
          })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: `Mot de passe réinitialisé avec succès. Nouveau mot de passe temporaire : ${tmp_password} (En validant, il sera copié dans votre presse-papier.)`,
            }).then(() => {
              logger.log(this.userStore.profile.id, 'PASSWORD', `Réinitialisation du mot de passe pour l'utilisateur ${user.name}`)
              navigator.clipboard.writeText(tmp_password)
            })
          })
          .catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.',
              timer: 3000,
            })
          })
        }
      })
    },
    closeUserDialog() {
      this.dialog = false
    },
    async addItem() {
      if (!this.currentUser || !this.currentUser.name) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez remplir tous les champs correctement.',
          timer: 3000,
        })
        return
      }

      this.currentUser.permissions.sort((a, b) => {
        const permAIndex = this.allPermissions.findIndex(p => p.value === a)
        const permBIndex = this.allPermissions.findIndex(p => p.value === b)
        return permAIndex - permBIndex
      })

      await this.currentUser.save()
      this.closeUserDialog()

      let permString = ''

      if(this.currentUser.permissions.length > 0){
        for(let perm of this.currentUser.permissions){
          let permObj = this.allPermissions.find(p => p.value === perm)
          if(permObj){
            permString += permObj.icon + ' '
          }
        }
      }else{
        permString = 'Aucune'
      }

      logger.log(this.userStore.profile.id, 'UTILISATEURS', `Modification des permissions de l'utilisateur ${this.currentUser.name} (${permString})`)

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Utilisateur sauvegardé avec succès.',
        timer: 3000,
      })
    },
    editItem(item) {
      this.currentUser = item
      this.dialog = true
    },
    deleteItem(item) {
      Swal.fire({
        title: 'Confirmer la suppression',
        text: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${item.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.activated = false
          item.rejected = true
          item.role = 'User'
          item.permissions = []
          await item.save()

          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Utilisateur supprimé avec succès.',
            timer: 3000,
          }).then(() => {
            this.closeUserDialog()
          })
        }
      })
    },
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  },
}
</script>