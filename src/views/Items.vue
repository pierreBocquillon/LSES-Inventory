<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Items :</h3>

      <v-data-table :headers="headers" :items="items" items-per-page="-1" no-data-text="Aucun item">
        <template v-slot:bottom />

        <template v-slot:item.name="{ item }">
          <h3 class="font-weight-regular">{{ item.icon }} {{ item.name }} 
            <v-icon class="ml-3" size="small" v-if="item.isSecure" color="error">mdi-lock</v-icon></h3>
        </template>

        <template v-slot:item.weight="{ item }">
          <h3 class="font-weight-regular">{{ item.weight }} Kg</h3>
        </template>

        <template v-slot:item.storage="{ item }">
          <span class="font-weight-regular">{{ storages.find(storage => storage.id === item.storage)?.icon }} {{ storages.find(storage => storage.id === item.storage)?.name }}</span>
        </template>

        <template v-slot:item.seller="{ item }">
          <span class="font-weight-regular">{{ companies.find(company => company.id === item.seller)?.icon }} {{ companies.find(company => company.id === item.seller)?.name }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="primary" variant="text" icon @click="openEditItemDialog(item)"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn color="error" variant="text" icon @click="deleteItem(item)"><v-icon>mdi-delete</v-icon></v-btn>
        </template>

      </v-data-table>
      
      <div class="d-flex justify-center align-center mt-5">
        <v-btn color="accent" @click="openNewItemDialog">
          <h3 class="font-weight-regular">Ajouter un item</h3>
        </v-btn>
      </div>

    </v-card>

    <v-dialog v-model="itemDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">{{ currentItem ? 'Modifier un item' : 'Ajouter un item' }}</h3>
          <v-text-field v-model="currentItem.icon" label="Icone" />
          <v-text-field v-model="currentItem.name" label="Nom" />
          <v-text-field type="number" v-model="currentItem.weight" label="Poids" suffix="Kg"/>

          <v-select :items="storages" v-model="currentItem.storage" item-value="id" label="Stockage">
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="null">
                <template #default>
                  {{ item.raw.icon }} {{ item.raw.name }}
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item, index }">
              {{ item.raw.icon }} {{ item.raw.name }}
            </template>
          </v-select>

          <v-select :items="companies" v-model="currentItem.seller" item-value="id" label="Vendeur">
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="null">
                <template #default>
                  {{ item.raw.icon }} {{ item.raw.name }}
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item, index }">
              {{ item.raw.icon }} {{ item.raw.name }}
            </template>
          </v-select>

          <v-text-field type="number" v-model="currentItem.wanted" label="Stock souhaité"/>

          <v-switch hide-details color="primary" label="Commande sécurisée" v-model="currentItem.isSecure"></v-switch>
          <v-switch hide-details color="primary" label="Contient des instances" v-model="currentItem.isInstantiated"></v-switch>
          <v-switch v-if="currentItem.isInstantiated" hide-details color="primary" label="Instances par date" v-model="currentItem.instanceByDate"></v-switch>

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="save">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeItemDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Storage from '../classes/Storage'
import Company from '../classes/Company'
import Item from '../classes/Item'

import logger from '../functions/logger'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'Poids', key: 'weight', align: 'start' },
        { title: 'Stockage', key: 'storage', align: 'start' },
        { title: 'Vendeur', key: 'seller', align: 'start' },
        { title: 'Stock souhaité', key: 'wanted', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      storages: [],
      companies: [],
      items: [],
      itemDialog: false,
      currentItem: null,
    }
  },

  mounted() {
    this.unsub.push(Storage.listenAll(storages => {
      this.storages = storages
      this.storages.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Item.listenAll(items => {
      this.items = items
      this.items.sort((a, b) => a.name.localeCompare(b.name))
    }))
  },

  methods: {
    openNewItemDialog() {
      this.itemDialog = true
      this.currentItem = Item.initOne()
    },
    openEditItemDialog(item) {
      this.itemDialog = true
      this.currentItem = item
    },
    closeItemDialog() {
      this.itemDialog = false
    },
    async save() {
      if(this.currentItem.id) {
        logger.log(this.userStore.profile.id, 'ITEMS', `Modification de l'item ${this.currentItem.icon}${this.currentItem.name}`)
      }else{
        logger.log(this.userStore.profile.id, 'ITEMS', `Création de l'item ${this.currentItem.icon}${this.currentItem.name}`)
      }

      await this.currentItem.save()
      this.closeItemDialog()
    },
    async deleteItem(item) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer l'item "${item.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      })

      if (result.isConfirmed) {
        logger.log(this.userStore.profile.id, 'ITEMS', `Suppression de l'item ${item.icon}${item.name}`)
        await item.delete()
        Swal.fire(
          'Supprimé !',
          `L'item "${item.name}" a bien été supprimée.`,
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
