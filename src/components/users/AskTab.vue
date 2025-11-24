<template>
  <div class="mt-5 d-flex flex-column align-center justify-center h-100">
    <v-data-table :headers="headers" :items="users" items-per-page="-1" no-data-text="Aucune demande en attente">
      <template v-slot:bottom />
      
      <template v-slot:item.actions="{ item }">
        <v-btn icon color="success" variant="text" @click="accept(item)">
          <v-icon>mdi-check-bold</v-icon>
        </v-btn>
        <v-btn icon color="error" variant="text" @click="reject(item)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

    </v-data-table>

  </div>
</template>
<script>
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { useUserStore } from '@/store/user.js'

import Profile from '@/classes/Profile.js'

import logger from '@/functions/logger.js'

export default {
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', sortable: true, align: 'start' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
      users: [],
    }
  },
  mounted() {
    this.unsub.push(Profile.listenByActivated(false, users => {
      this.users = users.filter(user => !user.rejected)
    }))
  },
  methods: {
    accept(item) {
      Swal.fire({
        title: 'Confirmer l\'acceptation',
        text: `Êtes-vous sûr de vouloir accepter la demande de l'utilisateur "${item.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, accepter',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.activated = true
          await item.save()
          logger.log(this.userStore.profile.id, 'UTILISATEURS', `Acceptation de la demande de l'utilisateur ${item.name}`)
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Utilisateur accepté avec succès.',
            timer: 3000,
          })
        }
      })
    },
    
    reject(item) {
      Swal.fire({
        title: 'Confirmer le rejet',
        text: `Êtes-vous sûr de vouloir rejeter la demande de l'utilisateur "${item.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, rejeter',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.activated = false
          item.rejected = true
          item.role = 'User'
          item.permissions = []
          await item.save()
          logger.log(this.userStore.profile.id, 'UTILISATEURS', `Rejet de la demande de l'utilisateur ${item.name}`)
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Utilisateur rejeté avec succès.',
            timer: 3000,
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