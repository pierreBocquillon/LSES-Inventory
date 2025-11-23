<template>
  <div class="mt-5 d-flex flex-column align-center justify-center h-100">
    <v-data-table :headers="headers" :items="users" items-per-page="-1" no-data-text="Aucun utilisateur">
      <template v-slot:bottom />

      <template v-slot:item.role="{ item }">
        <span>{{ roles.find(role => role.role === item.role)?.name || 'Inconnu' }}</span>
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn icon color="primary" variant="text" @click="resetPassword(item)" v-if="['Admin'].includes(this.userStore.profile.role)">
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
          <v-select label="Rôle" v-model="currentUser.role" :items="roles" item-title="name" item-value="role"></v-select>
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

import roles from '@/config/roles.js'

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
        { title: 'Role', key: 'role', sortable: true, align: 'start' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
      roles,
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

      await this.currentUser.save()
      this.closeUserDialog()

      logger.log(this.userStore.profile.id, 'UTILISATEURS', `Modification du role de l'utilisateur ${this.currentUser.name} (${this.currentUser.role})`)

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