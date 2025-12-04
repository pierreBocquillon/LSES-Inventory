<template>
  <div class="mt-3">
    <div>
      <template v-for="note in expenseNotes" :key="note.id">
        <v-card class="mb-3 pa-3 pl-5 rounded-xl" variant="tonal" color="primary" >
          <div class="d-flex flex-row align-center justify-start flex-wrap">
            <h2>Le {{ new Date(note.date).toLocaleString() }}</h2>
            <v-spacer></v-spacer>
            <v-btn variant="tonal" color="error" class="ml-3 rounded-xl" @click="refuseNote(note)">❌ Refuser</v-btn>
            <v-btn variant="tonal" color="success" class="ml-3 rounded-xl" @click="payNote(note)">💵 Payer</v-btn>
          </div>
          <h2 class="pl-3 text-white">
            <span>{{ getProfileInfo(note.user).name }} - </span>
            <span v-if="note.reason == 'buy'">{{ getCompagnyInfo(getHystoryInfo(note.data))?.icon }} {{ getCompagnyInfo(getHystoryInfo(note.data))?.name }} : ({{formatMoney(note.price)}})</span>
            <span v-else-if="note.reason == 'vehicle'">🚗 Fourière : ({{formatMoney(note.price)}})</span>
            <span v-else>❓ Autre dépense : ({{formatMoney(note.price)}})</span>
          </h2>
          <div class="py-2 pl-5">
            <template v-if="note.reason == 'buy'">
              <div class="py-3" style="border-left: 2px #FFFFFF33 solid;">
                <div class="pl-3 d-flex flex-row align-center justify-start mb-2 text-white" v-for="item in getHystoryInfo(note.data).items">
                  {{ getItemInfo(item.id)?.icon }} {{ getItemInfo(item.id)?.name }} - {{ item.amount }}
                </div>
              </div>
              <div class="mt-3 text-white">
                <h4>Commande du {{ new Date(getHystoryInfo(note.data)?.payDate).toLocaleString().slice(0, 16) }} - {{getHystoryInfo(note.data)?.weight}} Kg</h4>
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
          <h3>En cours de traitement</h3>
        </v-card>
      </template>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Swal, { swal } from 'sweetalert2/dist/sweetalert2.js'
import logger from '../../functions/logger'

import Profile from '@/classes/Profile.js'
import History from '@/classes/History.js'
import Item from '@/classes/Item.js'
import Company from '@/classes/Company.js'
import ExpenseNote from '@/classes/ExpenseNote.js'
import VehicleHistory from '@/classes/VehicleHistory.js'
import Vehicle from '@/classes/Vehicle.js'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      histories: [],
      userStore: useUserStore(),

      profiles: [],
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
    this.unsub.push(Profile.listenAll(profiles => {
      this.profiles = profiles
    }))
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
      this.vehicleHistories = vehicleHistories
    }))
    this.unsub.push(History.listenAll(histories => {
      this.histories = histories
    }))
    this.unsub.push(ExpenseNote.listenAll(expenseNotes => {
      this.expenseNotes = expenseNotes.filter(en => (!en.isPaid && !en.isRefused))
      this.expenseNotes.sort((a, b) => {
        return b.date - a.date
      })
    }))
  },
  methods: {
    formatMoney(value){
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '$').replace(",00", "")
    },
    getProfileInfo(id){
      if (!id) return null
      return this.profiles.find(p => p.id == id)
    },
    getCompagnyInfo(history){
      if (!history) return null
      return this.companies.find(c => c.id == history.company)
    },
    getVehichleInfo(history){
      return this.vehicles.find(v => v.id == history.vehicle)
    },
    getVehichleHistoryInfo(history){
      return this.vehicleHistories.find(h => h.id == history)
    },
    getHystoryInfo(history){
      if (!history) return null
      return this.histories.find(h => h.id == history)
    },
    getItemInfo(item){
      if (!item) return null
      return this.items.find(i => i.id == item)
    },
    refuseNote(note){
      Swal.fire({
        title: 'Raison du refus',
        input: 'text',
        inputLabel: 'Veuillez indiquer la raison du refus',
        inputPlaceholder: 'Raison du refus',
        showCancelButton: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          note.isRefused = true
          note.refusalComment = result.value
          note.closeDate = new Date().getTime()
          logger.log(this.userStore.profile.id, 'NOTES DE FRAIS', `Refus d'une note de frais à ${this.getProfileInfo(note.user)?.name} pour ${this.reasonlist.find(r => r.value === note.reason)?.title} (${this.formatMoney(note.price)})`)
          await note.save()
        }
      })
    },
    async payNote(note) {
      Swal.fire({
        title: 'Confirmer le paiement',
        text: "Êtes-vous sûr de vouloir marquer cette note de frais comme payée ?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, payer !',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          note.isPaid = true
          note.payDate = new Date().getTime()
          note.closeDate = new Date().getTime()
          logger.log(this.userStore.profile.id, 'NOTES DE FRAIS', `Paiement d'une note de frais à ${this.getProfileInfo(note.user)?.name} pour ${this.reasonlist.find(r => r.value === note.reason)?.title} (${this.formatMoney(note.price)})`)
          await note.save()
        }
      })
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