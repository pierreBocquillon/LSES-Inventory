<template>
  <div class="mt-3">
    <div style="height: calc(100vh - 350px); overflow-y: auto;">
      <template v-for="note in expenseNotes" :key="note.id">
        <v-card class="mb-3 pa-3 pl-5 rounded-xl" variant="tonal" :color="note.isPaid ? 'success' : (note.isRefused ? 'error' : 'primary')" >
          <div class="d-flex flex-row align-center justify-start flex-wrap">
            <h2>
              <span>Le {{ new Date(note.date).toLocaleString().slice(0, 16) }} - </span>
              <span v-if="note.reason == 'buy'">{{ getCompagnyInfo(getHystoryInfo(note.data)).icon }} {{ getCompagnyInfo(getHystoryInfo(note.data)).name }} : ({{formatMoney(note.price)}})</span>
              <span v-else-if="note.reason == 'vehicle'">🚗 Fourière : ({{formatMoney(note.price)}})</span>
              <span v-else>❓ Autre dépense : ({{formatMoney(note.price)}})</span>
            </h2>
            <v-spacer></v-spacer>
          </div>
          <div class="py-2 pl-5">
            <template v-if="note.reason == 'buy'">
              <div class="py-3" style="border-left: 2px #FFFFFF33 solid;">
                <div class="pl-3 d-flex flex-row align-center justify-start mb-2 text-white" v-for="item in getHystoryInfo(note.data).items">
                  {{ getItemInfo(item.id)?.icon }} {{ getItemInfo(item.id)?.name }} - {{ item.amount }}
                </div>
              </div>
              <div class="mt-3 text-white">
                <h4>Commande du {{ new Date(getHystoryInfo(note.data).payDate).toLocaleString().slice(0, 16) }} - {{getHystoryInfo(note.data).weight}} Kg</h4>
              </div>
            </template>
            <div class="py-3" style="border-left: 2px #FFFFFF33 solid;" v-else-if="note.reason == 'vehicle'">
              <div class="pl-3 d-flex flex-row align-center justify-start mb-2 text-white">
                {{getVehichleInfo(getVehichleHistoryInfo(note.data)).icon + ' ' + getVehichleInfo(getVehichleHistoryInfo(note.data)).name}}
              </div>
            </div>
            <div class="py-3" style="border-left: 2px #FFFFFF33 solid;" v-else>
              <div class="pl-3 d-flex flex-row align-center justify-start mb-2 text-white">
                ❓ {{note.data}}
              </div>
            </div>
          </div>

          <h3 v-if="note.isRefused">Refusée le {{ new Date(note.closeDate).toLocaleString().slice(0, 16) }}</h3>
          <h3 v-else-if="!note.isPaid">En cours de traitement</h3>
          <h3 v-else-if="note.isPaid">Payé le {{ new Date(note.closeDate).toLocaleString().slice(0, 16) }}</h3>
                <h3 class="text-white font-weight-regular" v-if="note.isRefused">Motif du refus : {{note.refusalComment}}</h3>
        </v-card>
      </template>
    </div>
    <div class="mt-5 d-flex flex-row align-center justify-end">
      <v-btn color="primary" variant="outlined" icon @click="openNewDialog">
        <v-icon left>mdi-plus</v-icon>
      </v-btn>
    </div>
    
    <v-dialog v-model="newExpenseNoteDialog" max-width="600px">
      <v-card>
        <v-card-text>
          <v-select :items="reasonlist" v-model="selectedReason" label="Motif de la note de frais" item-title="title" item-value="value"></v-select>

            <div v-if="selectedReason == 'buy'">
              <v-select :items="AvailableHistories" v-model="expenseNoteData.buy" label="Commande" item-value="id">
                <template v-slot:selection="{ item, index }">
                  <div>
                    <h3 class="font-weight-regular">{{ new Date(item.raw.payDate).toLocaleString().slice(0, 16) }} - {{ getCompagnyInfo(item.raw).icon + ' ' + getCompagnyInfo(item.raw).name }} - {{ formatMoney(item.raw.price) }}</h3>
                  </div>
                </template>
                <template v-slot:item="{ props: itemProps, item}">
                  <v-list-item v-bind="itemProps" title>
                    <div>
                      <h3 class="font-weight-regular">{{ new Date(item.raw.payDate).toLocaleString().slice(0, 16) }} - {{ getCompagnyInfo(item.raw).icon + ' ' + getCompagnyInfo(item.raw).name }} - {{ formatMoney(item.raw.price) }}</h3>
                    </div>
                  </v-list-item>
                </template>
              </v-select>
          </div>
          <div v-if="selectedReason == 'vehicle'">
            <v-select :items="AvailableVehicleHistories" v-model="expenseNoteData.vehicle" label="Récuperation(s)" item-value="id">
              <template v-slot:selection="{ item, index }">
                <div>
                  <h3 class="font-weight-regular" v-if="item.raw">{{ new Date(item.raw.date).toLocaleString().slice(0, 16) }} - {{ getVehichleInfo(item.raw).icon + ' ' + getVehichleInfo(item.raw).name }} - {{ formatMoney(item.raw.price) }}</h3>
                </div>
              </template>
              <template v-slot:item="{ props: itemProps, item}">
                <v-list-item v-bind="itemProps" title>
                  <div>
                    <h3 class="font-weight-regular">{{ new Date(item.raw.date).toLocaleString().slice(0, 16) }} - {{ getVehichleInfo(item.raw).icon + ' ' + getVehichleInfo(item.raw).name }} - {{ formatMoney(item.raw.price) }}</h3>
                  </div>
                </v-list-item>
              </template>
            </v-select>
          </div>
          <div v-if="selectedReason == 'other'">
            <v-text-field label="Raison de la note de frais" v-model="expenseNoteData.other"></v-text-field>
            <v-text-field label="Montant" v-model="expenseNotePrice" type="number" suffix=" $"></v-text-field>
          </div>

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="sendExpenseNote">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeNewDialog">Annuler</v-btn>
          </div>       
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import logger from '../../functions/logger'

import History from '@/classes/History.js'
import VehicleHistory from '@/classes/VehicleHistory.js'
import Vehicle from '@/classes/Vehicle.js'
import Item from '@/classes/Item.js'
import Company from '@/classes/Company.js'
import ExpenseNote from '@/classes/ExpenseNote.js'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      histories: [],
      userStore: useUserStore(),

      histories: [],
      expenseNotes: [],
      items: [],
      companies: [],
      vehicles: [],
      vehicleHistories: [],

      newExpenseNoteDialog: false,  
      reasonlist: [
        {
          title : "Achat de matériel",
          value : "buy"
        },
        {
          title : "Vehicule en fourrière",
          value : "vehicle"
        },
        {
          title : "Autre dépense",
          value : "other"
        },
      ],
      selectedReason: null,
      expenseNotePrice: null,
      expenseNoteData: {
        buy : null,
        vehicle : '',
        other : ''
      },
    }
  },
  mounted() {
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
    }))
    this.unsub.push(Item.listenAll(items => {
      this.items = items
    }))
    this.unsub.push(Vehicle.listenAll(vehicles => {
      this.vehicles = vehicles.filter(vehicle => vehicle.where !== "dead")
    }))
    this.unsub.push(VehicleHistory.listenAll(vehicleHistories => {
      this.vehicleHistories = vehicleHistories.filter(h => (h.date > new Date().getTime() - 7*24*60*60*1000 && h.price > 0))
    }))
    this.unsub.push(History.listenAll(histories => {
      this.histories = histories.filter(h => (h.payDate > new Date().getTime() - 7*24*60*60*1000 && h.price > 0))
    }))
    this.unsub.push(ExpenseNote.listenByUser(this.userStore.profile.id, expenseNotes => {
      this.expenseNotes = expenseNotes
      this.expenseNotes.sort((a, b) => {
        return b.date - a.date
      })
    }))
  },
  computed: {
    CompanyCanMakeExpenseNotes() {
      return this.companies.filter(c => c.canExpenseNote)
    },
    AvailableHistories() {
      let history = []
      this.histories.forEach(h => {
        let company = this.companies.find(c => c.id == h.company)
        if (company && company.canExpenseNote) {
          history.push(h)
        }
      })
      return history
    },
    AvailableVehicleHistories() {
      let vehicleHistory = []
      this.vehicleHistories.forEach(vh => {
        if (!vh.vehicle || vh.vehicle == 'all') return
        let vehicle = this.vehicles.find(v => v.id == vh.vehicle)
        if (vh.message.includes('Fourrière') && vehicle) {
          vehicleHistory.push(vh)
        }
      })
      return vehicleHistory
    }
  },
  methods: {
    formatMoney(value){
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '$').replace(",00", "")
    },
    getCompagnyInfo(history){
      return this.companies.find(c => c.id == history.company)
    },
    getHystoryInfo(history){
      return this.histories.find(h => h.id == history)
    },
    getVehichleInfo(history){
      return this.vehicles.find(v => v.id == history.vehicle)
    },
    getVehichleHistoryInfo(history){
      return this.vehicleHistories.find(h => h.id == history)
    },
    getItemInfo(item){
      return this.items.find(i => i.id == item)
    },
    openNewDialog() {
      this.newExpenseNoteDialog = true
    },
    closeNewDialog() {
      this.newExpenseNoteDialog = false
    },
    async sendExpenseNote() {
      let newExpenseNote = ExpenseNote.initOne()
      newExpenseNote.user = this.userStore.profile.id
      newExpenseNote.date = new Date().getTime()
      newExpenseNote.reason = this.selectedReason
      newExpenseNote.data = this.expenseNoteData[this.selectedReason]
      
      if(this.selectedReason == 'buy') {
        let relatedHistory = this.histories.find(h => h.id == this.expenseNoteData.buy)
        newExpenseNote.price = relatedHistory ? relatedHistory.price : 0
      } else if(this.selectedReason == 'vehicle') {
        let relatedHistory = this.vehicleHistories.find(h => h.id == this.expenseNoteData.vehicle)
        newExpenseNote.price = relatedHistory ? relatedHistory.price : 0
      }else{
        newExpenseNote.price = this.expenseNotePrice ? parseFloat(this.expenseNotePrice) : 0
      }
      logger.log(this.userStore.profile.id, 'NOTES DE FRAIS', `Création d'une note de frais pour ${this.reasonlist.find(r => r.value === this.selectedReason)?.title} (${this.formatMoney(newExpenseNote.price)})`)
      await newExpenseNote.save()

      Swal.fire({
        icon: 'success',
        title: 'Note de frais envoyée !',
        showConfirmButton: false,
        timer: 1500
      })
      this.closeNewDialog()
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  }
}
</script>