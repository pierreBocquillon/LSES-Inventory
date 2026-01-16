<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Stockages :</h3>

      <v-data-table :headers="headers" :items="storages" items-per-page="-1" no-data-text="Aucun stockage">
        <template v-slot:bottom />

        <template v-slot:item.name="{ item }">
          <h3 class="font-weight-regular">{{ item.icon }} {{ item.name }}</h3>
        </template>

        <template v-slot:item.maxWeight="{ item }">
          <span class="font-weight-regular">{{ item.maxWeight }} Kg</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="primary" variant="text" icon @click="openEditStorageDialog(item)"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn color="error" variant="text" icon @click="deleteStorage(item)"><v-icon>mdi-delete</v-icon></v-btn>
        </template>

      </v-data-table>
      
      <div class="d-flex justify-center align-center mt-5">
        <v-btn color="accent" @click="openNewStorageDialog">
          <h3 class="font-weight-regular">Ajouter un stockage</h3>
        </v-btn>
      </div>

    </v-card>

    <v-dialog v-model="storageDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">{{ currentStorage ? 'Modifier un stockage' : 'Ajouter un stockage' }}</h3>

          <v-text-field v-model="currentStorage.icon" label="Icone" />
          <v-text-field v-model="currentStorage.name" label="Nom" />
          <v-text-field v-model="currentStorage.maxWeight" label="Poids max (Kg)" type="number" />

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="save">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeStorageDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Storage from '../../classes/Storage'

import logger from '../../functions/logger'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'Poids max', key: 'maxWeight', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      storages: [],
      storageDialog: false,
      currentStorage: null,
    }
  },

  mounted() {
    this.unsub.push(Storage.listenAll(storages => {
      this.storages = storages
    }))
  },

  computed: {
    trashableItems() {
      return this.userStore.items.filter(i => !i.isTrash)
    },
  },

  methods: {
    openNewStorageDialog() {
      this.storageDialog = true
      this.currentStorage = Storage.initOne()
    },
    openEditStorageDialog(storage) {
      this.storageDialog = true
      this.currentStorage = storage
    },
    closeStorageDialog() {
      this.storageDialog = false
    },
    async save() {
      if(this.currentStorage.id) {
        logger.log(this.userStore.profile.id, 'STOCKAGES', `Modification du stockage ${this.currentStorage.icon}${this.currentStorage.name}`)
      }else{
        logger.log(this.userStore.profile.id, 'STOCKAGES', `Création du stockage ${this.currentStorage.icon}${this.currentStorage.name}`)
      }
  
      await this.currentStorage.save()
      this.closeStorageDialog()
    },
    async deleteStorage(storage) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer le stockage "${storage.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      })

      if (result.isConfirmed) {
        logger.log(this.userStore.profile.id, 'STOCKAGES', `Suppression du stockage ${storage.icon}${storage.name}`)
        await storage.delete()
        Swal.fire(
          'Supprimé !',
          `Le stockage "${storage.name}" a bien été supprimé.`,
          'success'
        )
      }
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
