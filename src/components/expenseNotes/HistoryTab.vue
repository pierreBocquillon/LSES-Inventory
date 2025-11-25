<template>
  <div class="mt-3">
    <v-expansion-panels class="mt-3" v-model="monthPanel">
      <v-expansion-panel v-for="(monthYear, index) in Object.keys(monthGroupedHistories)" :key="index" >
        <v-expansion-panel-title >
          <div class="w-100 d-flex flex-row align-center justify-space-between pr-5">
            <h1 class="mx-3 text-primary">
              {{ monthGroupedHistories[monthYear].month[0].toUpperCase() + monthGroupedHistories[monthYear].month.slice(1) }} {{ monthGroupedHistories[monthYear].year }}
            </h1>
            <h2 class="font-weight-regular text-primary">
              ( {{ monthGroupedHistories[monthYear].expenseNotes.length }} Note{{ monthGroupedHistories[monthYear].expenseNotes.length > 1 ? 's' : '' }} de frais : {{ formatMoney(monthGroupedHistories[monthYear].totalPaid) }} )
            </h2>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>

          <v-expansion-panels class="mt-3 d-flex flex-column">
            <template v-for="note in expenseNotes" :key="note.id">
              <v-card class="mb-3 pa-3 pl-5 rounded-xl" variant="tonal" :color="note.isPaid ? 'success' : (note.isRefused ? 'error' : 'primary')" >
                <div class="d-flex flex-row align-center justify-start flex-wrap">
                  <h2>Le {{ new Date(note.date).toLocaleString().slice(0, 16) }}</h2>
                </div>
                <h2 class="pl-3 text-white">
                  <span>{{ getProfileInfo(note.user).name }} - </span>
                  <span v-if="note.reason == 'buy'">{{ getCompagnyInfo(getHystoryInfo(note.data)).icon }} {{ getCompagnyInfo(getHystoryInfo(note.data)).name }} : ({{formatMoney(note.price)}})</span>
                  <span v-else-if="note.reason == 'vehicle'">🚗 Fourière : ({{formatMoney(note.price)}})</span>
                  <span v-else>❓ Autre dépense : ({{formatMoney(note.price)}})</span>
                </h2>
                <div class="py-2 pl-5">
                  <template v-if="note.reason == 'buy'">
                    <div class="py-3" style="border-left: 2px #FFFFFF33 solid;">
                      <div class="pl-3 d-flex flex-row align-center justify-start mb-2 text-white">
                        📱 Téléphone - 40
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
          </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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

      monthPanel: null,

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
    this.monthPanel = 0
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
      this.vehicles = vehicles
    }))
    this.unsub.push(VehicleHistory.listenAll(vehicleHistories => {
      this.vehicleHistories = vehicleHistories
    }))
    this.unsub.push(History.listenAll(histories => {
      this.histories = histories
    }))
    this.unsub.push(ExpenseNote.listenAll(expenseNotes => {
      this.expenseNotes = expenseNotes.filter(en => (en.isPaid || en.isRefused))
      this.expenseNotes.sort((a, b) => {
        return b.closeDate - a.closeDate
      })
    }))
  },
  computed: {
    monthGroupedHistories() {
      let grouped = {}
      this.expenseNotes.forEach(note => {
        let date = new Date(note.closeDate)
        let monthYear = `${date.getMonth()+1}-${date.getFullYear()}`
        if (!grouped[monthYear]) {
          grouped[monthYear] = {
            month: date.toLocaleString('default', { month: 'long' }),
            year: date.getFullYear(),
            totalPaid: 0,
            expenseNotes: []
          }
        }
        grouped[monthYear].expenseNotes.push(note)
        if (!note.isRefused){
          grouped[monthYear].totalPaid += parseFloat(note.price)
        }
      })
      return grouped
    }
  },
  methods: {
    formatMoney(value){
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '$').replace(",00", "")
    },
    getProfileInfo(id){
      return this.profiles.find(p => p.id == id)
    },
    getCompagnyInfo(history){
      return this.companies.find(c => c.id == history.company)
    },
    getVehichleInfo(history){
      return this.vehicles.find(v => v.id == history.vehicle)
    },
    getVehichleHistoryInfo(history){
      return this.vehicleHistories.find(h => h.id == history)
    },
    getHystoryInfo(history){
      return this.histories.find(h => h.id == history)
    },
    getItemInfo(item){
      return this.items.find(i => i.id == item)
    },
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