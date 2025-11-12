<template>
  <div>
    <v-expansion-panels class="mt-3" v-model="monthPanel">
      <v-expansion-panel v-for="(monthYear, index) in Object.keys(monthGroupedHistories)" :key="index" >
        <v-expansion-panel-title >
          <div class="w-100 d-flex flex-row align-center justify-space-between pr-5">
            <h1 class="mx-3 text-primary">
              {{ monthGroupedHistories[monthYear].month[0].toUpperCase() + monthGroupedHistories[monthYear].month.slice(1) }} {{ monthGroupedHistories[monthYear].year }}
            </h1>
            <h2 class="font-weight-regular text-primary">
              ( {{ monthGroupedHistories[monthYear].histories.length }} commande{{ monthGroupedHistories[monthYear].histories.length > 1 ? 's' : '' }} : {{ formatMoney(monthGroupedHistories[monthYear].totalPaid) }} )
            </h2>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>

          <v-expansion-panels class="mt-3">
            <template v-for="history in monthGroupedHistories[monthYear].histories" :key="history.id">
              <v-expansion-panel v-if="getCompagnyInfo(history)">
                <v-expansion-panel-title>
                  <div class="d-flex flex-row align-center justify-start flex-wrap w-100">
                    <h2>Le {{ new Date(history.payDate).toLocaleDateString() }} à {{ new Date(history.payDate).toLocaleTimeString().slice(0, 5) }}</h2>
                    <h1 class="mx-3">|</h1>
                    <h2>{{ getCompagnyInfo(history).icon }} {{ getCompagnyInfo(history).name }}</h2>
                    <h1 class="mx-3">|</h1>
                    <h2>( {{ Math.round(history.weight*100)/100 }} kg - {{ formatMoney(history.price) }} )</h2>
                    <v-spacer></v-spacer>
                    <v-btn color="error" variant="text" @click.prevent.stop="deleteHistory(history)" v-if="['Direction','Admin'].includes(this.userStore.profile.role)"><v-icon>mdi-delete-outline</v-icon> &nbsp; Supprimer</v-btn>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="py-3" style="border-left: 2px #FFFFFF33 solid;">
                    <template v-for="historyItem in history.items" :key="historyItem.id">
                      <div class="pl-3 d-flex flex-row align-center justify-start mb-2" v-if="historyItem && historyItem.amount > 0 && historyItem.id && getItemInfo(historyItem.id)">
                        {{ getItemInfo(historyItem.id).icon }} {{ getItemInfo(historyItem.id).name }} - {{historyItem.amount}}
                      </div>
                    </template>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </template>     
          </v-expansion-panels>

        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import History from '@/classes/History.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../../functions/logger'

export default {
  props: ["items", "storages", "companies"],
  data() {
    return {
      unsub: [],
      histories: [],
      userStore: useUserStore(),
      monthPanel: null,
    }
  },
  mounted() {
    this.monthPanel = 0
    this.unsub.push(History.listenAll(histories => {
      this.histories = histories
      this.histories.sort((a, b) => {
        return b.payDate - a.payDate
      })  
    }))
  },
  computed: {
    monthGroupedHistories() {
      let grouped = {}
      this.histories.forEach(history => {
        let date = new Date(history.payDate)
        let monthYear = `${date.getMonth()+1}-${date.getFullYear()}`
        if (!grouped[monthYear]) {
          grouped[monthYear] = {
            month: date.toLocaleString('default', { month: 'long' }),
            year: date.getFullYear(),
            totalPaid: 0,
            histories: []
          }
        }
        grouped[monthYear].histories.push(history)
        grouped[monthYear].totalPaid += parseFloat(history.price)
      })
      return grouped
    }
  },
  methods: {
    formatMoney(value){
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '$').replace(",00", "")
    },
    getCompagnyInfo(history){
      return this.companies.find(c => c.id == history.company)
    },
    getItemInfo(item){
      return this.items.find(i => i.id == item)
    },
    deleteHistory(history) {
      Swal.fire({
        title: 'Êtes-vous sûr de vouloir supprimer cette commande ?',
        text: "Cette action est irréversible !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui !',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          history.delete().then(() => {
            logger.log(this.userStore.profile.id, 'COMMANDES', `Suppression de l'historique d'une commande du ${new Date(history.payDate).toLocaleDateString()} à ${new Date(history.payDate).toLocaleTimeString().slice(0, 5)} chez ${this.getCompagnyInfo(history).icon}${this.getCompagnyInfo(history).name} (${history.weight} kg | ${history.price}$) `)
            Swal.fire(
              'Annulé !',
              'La commande a été annulée.',
              'success'
            )
          }).catch(err => {
            Swal.fire(
              'Erreur !',
              'Une erreur est survenue lors de l\'annulation de la commande.',
              'error'
            )
          })
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