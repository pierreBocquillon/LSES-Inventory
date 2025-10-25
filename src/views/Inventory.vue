<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab v-for="storage in storages" :key="storage.id" :value="storage.id">
          {{ storage.icon }} {{ storage.name }}
          <v-badge color="primary" v-if="deltaTime[storage.id] >= 12" :content="1" offset-x="-5" floating></v-badge>
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">
        <v-tabs-window-item v-for="storage in storages" :key="storage.id" :value="storage.id">

          <h3 class="my-5 text-center font-weight-regular text-success" v-if="deltaTime[storage.id] < 6">💾 Derniere mise à jour : {{ new Date(saveDates[storage.id]?.date).toLocaleString().slice(0, 16) }}</h3>
          <h3 class="my-5 text-center font-weight-regular text-warning" v-else-if="deltaTime[storage.id] < 12">💾 Derniere mise à jour : {{ new Date(saveDates[storage.id]?.date).toLocaleString().slice(0, 16) }}</h3>
          <h3 class="my-5 text-center font-weight-regular text-error" v-else>💾 Derniere mise à jour : {{ new Date(saveDates[storage.id]?.date).toLocaleString().slice(0, 16) }}</h3>

          <v-row>
            <v-col cols="12" md="6">
              <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title collapse-icon="mdi-minus" expand-icon="mdi-plus">
                      <template v-slot:actions="{ expanded }">
                        <v-icon color="primary" :icon="expanded ? 'mdi-minus' : 'mdi-plus'"></v-icon>
                      </template>

                      <h4 class="text-primary">
                        <span>Filtres</span>
                      </h4>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field label="Nom" color="primary" base-color="primary" variant="outlined" v-model="filter.name" class="ma-0 pa-0 mb-3" hide-details />

                      <v-select color="primary" base-color="primary" variant="outlined" hide-details="boolean" :items="companies" v-model="filter.seller" item-value="id" label="Vendeur" clearable>
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
                    </v-expansion-panel-text>
                  </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
            <v-col cols="12" md="6">
              <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title collapse-icon="mdi-minus" expand-icon="mdi-plus">
                      <template v-slot:actions="{ expanded }">
                        <v-icon color="primary" :icon="expanded ? 'mdi-minus' : 'mdi-plus'"></v-icon>
                      </template>

                      <h4 class="text-primary">
                        <span>Statistiques</span>
                      </h4>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <h3 class="font-weight-regular">Nombre d'items : {{ currentStorageItems.reduce((total, item) => total + parseFloat(item.amount), 0) }}</h3>
                      <h3 class="font-weight-regular">Poids total : {{ currentStorageItems.reduce((total, item) => total + Math.round((parseFloat(item.weight) * parseFloat(item.amount))*1000)/1000, 0) }} Kg</h3>
                      <h3 class="font-weight-regular">Poids restant : {{ storage.maxWeight - currentStorageItems.reduce((total, item) => total + Math.round((parseFloat(item.weight) * parseFloat(item.amount))*1000)/1000, 0) }} Kg</h3>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>


          <v-data-table class="mt-5" :headers="headers" :items="filteredItems" items-per-page="-1" no-data-text="Aucun item">
            <template v-slot:bottom />

            <template v-slot:item.name="{ item }">
              <h3 class="font-weight-regular">{{ item.icon }} {{ item.name }}</h3>
            </template>

            <template v-slot:item.seller="{ item }">
              <span class="font-weight-regular">{{ companies.find(company => company.id === item.seller)?.icon }} {{ companies.find(company => company.id === item.seller)?.name }}</span>
            </template>

            <template v-slot:item.weight="{ item }">
              <h3 class="font-weight-regular">{{ item.weight }} Kg</h3>
            </template>

            <template v-slot:item.amount="{ item }">
              <template v-if="item.isInstantiated">
                <div class="d-flex align-center justify-space-between" style="max-width: 100px;">
                  <h3 class="pl-3 font-weight-regular">{{item.amount}}</h3><v-btn color="pink" icon variant="text" size="small" @click="openInstanceDialog(item)" ><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
                </div>
              </template>
              <template v-else>
                <v-text-field type="number" variant="solo-filled" v-model="item.amount" class="ma-0 pa-0" hide-details style="max-width: 100px;" @change="updateItem(item)"/>
              </template>
            </template>

            <template v-slot:item.wanted="{ item }">
              <h3 class="font-weight-regular">{{ item.wanted }}</h3>
            </template>

            <template v-slot:item.needed="{ item }">
              <h3 class="font-weight-regular text-success" v-if="parseInt(item.amount) >= parseInt(item.wanted)">0</h3>
              <h3 class="font-weight-regular text-white" v-else-if="parseInt(item.amount) >= (parseInt(item.wanted) * 0.5)">{{ parseInt(item.wanted) - parseInt(item.amount) }}</h3>
              <h3 class="font-weight-regular text-warning" v-else-if="parseInt(item.amount) >= (parseInt(item.wanted) * 0.25)">{{ parseInt(item.wanted) - parseInt(item.amount) }}</h3>
              <h3 class="font-weight-regular text-error" v-else>{{ parseInt(item.wanted) - parseInt(item.amount) }}</h3>
            </template>

          </v-data-table>
        </v-tabs-window-item>
      </v-tabs-window>

    </v-card>

    <v-dialog v-model="dialogInstance" max-width="600px">
      <v-card>
        <v-card-text>
          <h3 class="text-center">{{ currentItem.icon }} {{ currentItem.name }}</h3>

          <v-data-table :headers="currentItem.instanceByDate ? instanceDateHeader : instanceNameHeader" :items="currentInstance?.content" items-per-page="-1" no-data-text="Aucune instance">
            <template v-slot:bottom />
            <template v-slot:item.date="{ item }">
              <h3 class="font-weight-regular text-error" v-if="new Date(item.date) < new Date()">{{ item.date }}</h3>
              <h3 class="font-weight-regular" v-else>{{ item.date }}</h3>
            </template>
            <template v-slot:item.amount="{ item }">
              <v-text-field type="number" variant="solo-filled" v-model="item.amount" class="ma-0 pa-0" hide-details style="max-width: 100px;" @change="currentInstance.save(); updateItem(currentItem)"/>
            </template>
            <template v-slot:item.locked="{ item }" v-if="currentItem.instanceByDate">
              <template v-if="['PoleStock','Direction','Admin'].includes(this.userStore.profile.role)">
                <v-icon class="cursor-pointer" color="primary" @click="item.locked = false" v-if="item.locked">mdi-lock</v-icon>
                <v-icon class="cursor-pointer" color="secondary" @click="item.locked = true" v-else>mdi-lock-open-variant</v-icon>
              </template>
              <template v-else>
                <v-icon color="primary" v-if="item.locked">mdi-lock</v-icon>
                <v-icon color="secondary" v-else>mdi-lock-open-variant</v-icon>
              </template>
            </template>
            <template v-slot:item.actions="{ item }" v-else>
              <template v-if="['PoleStock','Direction','Admin'].includes(this.userStore.profile.role)">
                <v-icon class="cursor-pointer" color="error" @click="currentInstance.content = currentInstance.content.filter(i => i.name != item.name)" >mdi-delete</v-icon>
              </template>
            </template>
          </v-data-table>
          
          <div class="d-flex justify-center align-center mt-5" v-if="!currentItem.instanceByDate && ['PoleStock','Direction','Admin'].includes(this.userStore.profile.role)">
            <v-btn variant="tonal" color="success" @click="openNameDialog">Ajouter une instance</v-btn>
          </div>

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="saveInstance">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeInstanceDialog">Annuler</v-btn>
          </div>       
        </v-card-text>
      </v-card>
    </v-dialog>

    
    <v-dialog v-model="dialogName" max-width="600px">
      <v-card>
        <v-card-text>
          <v-text-field label="Nom" color="primary" base-color="primary" variant="outlined" v-model="instanceName" class="ma-0 pa-0 mb-3" hide-details />

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="addInstance">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeNameDialog">Annuler</v-btn>
          </div>       
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Storage from '@/classes/Storage.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import SaveDate from '@/classes/SaveDate.js'
import Instance from '@/classes/Instance.js'

import logger from '@/functions/logger.js'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      nestedUnsub: [],
      userStore: useUserStore(),

      tab: null,

      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'Vendeur', key: 'seller', align: 'start' },
        { title: 'Poids', key: 'weight', align: 'start' },
        { title: 'Stock actuel', key: 'amount', align: 'start' },
        { title: 'Stock souhaité', key: 'wanted', align: 'start' },
        { title: 'Besoin', key: 'needed', align: 'start' },
      ],

      filter: {
        name: '',
        seller: null,
      },
      
      storages: [],
      companies: [],
      items: [],
      saveDates: [],

      dialogInstance: false,
      currentItem: null,
      currentInstance: null,

      dialogName: false,
      instanceName: '',

      instanceDateHeader: [{ title: 'Date', key: 'date', align: 'start' }, { title: 'Quantité', key: 'amount', align: 'start' }, { title: '', key: 'locked', align: 'end', sortable: false }],
      instanceNameHeader: [{ title: 'Nom', key: 'name', align: 'start' }, { title: 'Quantité', key: 'amount', align: 'start' }, { title: '', key: 'actions', align: 'end', sortable: false }],
    }
  },

  mounted() {
    this.unsub.push(SaveDate.listenAll(dates => {
      this.saveDates = {}
      dates.forEach(date => {
        this.saveDates[date.id] = date
      })
    }))
    this.unsub.push(Storage.listenAll(storages => {
      this.storages = storages
      this.storages.sort((a, b) => a.name.localeCompare(b.name))
      if (this.storages.length > 0 && !this.tab) {
        this.tab = this.storages[0].id
      }
    }))
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Item.listenAll(items => {
      this.items = items
      this.items.sort((a, b) => a.id.localeCompare(b.id))
    }))
  },

  computed: {
    currentStorageItems(){
      let currentStorageItems = this.items.filter(item => item.storage == this.tab)
      return currentStorageItems
    },
    filteredItems(){
      let filteredItems = this.currentStorageItems

      if(this.filter.name && this.filter.name.trim() != ''){
        filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(this.filter.name.toLowerCase().trim()))
      }
      if(this.filter.seller){
        filteredItems = filteredItems.filter(item => item.seller == this.filter.seller)
      }

      return filteredItems
    },
    deltaTime(){
      let deltaTime = {}
      for(let storage of this.storages){
        if(this.saveDates[storage.id] == undefined){
          deltaTime[storage.id] = 9999
        }
        if(this.saveDates[storage.id]){
          deltaTime[storage.id] = (new Date().getTime() - new Date(this.saveDates[storage.id].date).getTime()) / (1000 * 60 * 60)
        }
      }
      return deltaTime
    },
  },

  methods: {
    updateItem(item) {
      item.save()
      if (this.saveDates[item.storage]) {
        this.saveDates[item.storage].date = new Date().getTime()
        this.saveDates[item.storage].save()
      } else {
        let newDate = SaveDate.initOne()
        newDate.id = item.storage
        newDate.date = new Date().getTime()
        newDate.save()
      }
      logger.log(this.userStore.profile.id, 'INVENTAIRE', `Mise à jour de l'item ${item.icon}${item.name} dans ${this.storages.find(storage => storage.id === item.storage)?.icon}${this.storages.find(storage => storage.id === item.storage)?.name}. (Nouvelle quantité : ${item.amount})`)
    },
    openInstanceDialog(item) {
      this.dialogInstance = true
      this.currentItem = item

      this.nestedUnsub.push(Instance.listenById(item.id, instance => {
        this.currentInstance = instance

        if (!this.currentInstance) {
          this.currentInstance = Instance.initOne()
          this.currentInstance.id = item.id
          this.currentInstance.save()
        }
        if(item.instanceByDate){
          this.currentInstance.content = this.currentInstance.content.filter(instance => instance.amount > 0)
          for(let i = 0; i < 7; i++){
            let date = new Date()
            date.setDate(date.getDate() + i)
            if(!this.currentInstance.content.find(instance => instance.date == date.toLocaleDateString())){
              this.currentInstance.content.push({ date: date.toLocaleDateString(), amount: 0, locked: false })
            }
          }
          this.currentInstance.content.sort((a, b) => new Date(a.date) - new Date(b.date))
          this.currentInstance.save()
        }
      }))
    },
    closeInstanceDialog() {
      this.dialogInstance = false
      this.nestedUnsub.forEach(unsub => {
        if (typeof unsub == 'function') {
          unsub()
        }
      })
    },
    saveInstance() {
      let totalAmount = this.currentInstance.content.reduce((total, instance) => total + parseFloat(instance.amount), 0)
      this.currentItem.amount = totalAmount
      this.updateItem(this.currentItem)
      this.currentInstance.save()
      this.closeInstanceDialog()
    },
    openNameDialog() {
      this.dialogName = true
      this.instanceName = ""
    },
    closeNameDialog() {
      this.dialogName = false
    },
    addInstance() {
      if(!this.instanceName || this.instanceName.trim() == ''){
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le nom de l\'instance ne peut pas être vide.',
        })
        return
      }
      if(this.currentInstance.content.find(instance => instance.name == this.instanceName.trim())){
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une instance avec ce nom existe déjà.',
        })
        return
      }

      this.currentInstance.content.push({ name: this.instanceName.trim(), amount: 0, locked: false })
      this.currentInstance.content.sort((a, b) => a.name.localeCompare(b.name))
      this.closeNameDialog()
    }
  },

  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
    this.nestedUnsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  }
}
</script>
