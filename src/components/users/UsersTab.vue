<template>
  <div class="mt-5 d-flex flex-column align-center justify-center h-100">
    <v-data-table :headers="headers" :items="users" items-per-page="-1" no-data-text="Aucun utilisateur">
      <template v-slot:bottom />

      <template v-slot:item.role="{ item }">
        <span>{{ roles.find(role => role.role === item.role)?.name || 'Inconnu' }}</span>
      </template>
      
      <template v-slot:item.actions="{ item }">
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

import { useUserStore } from '@/store/user.js'

import roles from '@/config/roles.js'

import Profile from '@/classes/Profile.js'

import logger from '@/functions/logger.js'

export default {
  data() {
    return {
      unsub: [],
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