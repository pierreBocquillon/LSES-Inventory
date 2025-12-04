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
              ( {{ monthGroupedHistories[monthYear].histories.length }} opération{{ monthGroupedHistories[monthYear].histories.length > 1 ? 's' : '' }} : {{ formatMoney(monthGroupedHistories[monthYear].totalPaid) }} )
            </h2>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>

          <v-expansion-panels class="mt-3">
            <template v-for="history in monthGroupedHistories[monthYear].histories" :key="history.id">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex flex-row align-center justify-start flex-wrap w-100">
                    <h2>
                      <span v-if="history.vehicle == 'all'">🚑</span>
                      <span v-else-if="history.message.includes('Récupération de')">🔙</span>
                      <span v-else-if="history.message.includes('a etait envoyé')">🛠️</span>
                      Le {{ new Date(history.date).toLocaleDateString() }} à {{ new Date(history.date).toLocaleTimeString().slice(0, 5) }}
                      <span v-if="history.vehicle == 'all'">( Repa flotte - {{ history.message.split(' - ')[1].split('(')[0] }})</span>
                      <span v-if="this.vehicles.find(vehicle => vehicle.id === history.vehicle)">( {{ this.vehicles.find(vehicle => vehicle.id === history.vehicle).icon }}{{ this.vehicles.find(vehicle => vehicle.id === history.vehicle).name }} )</span>
                    </h2>
                    <v-spacer></v-spacer>
                    <h2 class="font-weight-regular" v-if="parseInt(history.price) > 0">( {{ formatMoney(parseInt(history.price)) }} )</h2>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="py-3" style="border-left: 2px #FFFFFF33 solid;">
                    <h3 class="pl-3 font-weight-regular">{{ history.message }}</h3>
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

import VehicleHistory from '@/classes/VehicleHistory.js'
import Vehicle from '@/classes/Vehicle.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../../functions/logger'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      histories: [],
      vehicles: [],
      userStore: useUserStore(),
      monthPanel: null,
    }
  },
  mounted() {
    this.monthPanel = 0

    this.unsub.push(Vehicle.listenAll(vehicles => {
      this.vehicles = vehicles
    }))

    this.unsub.push(VehicleHistory.listenAll(histories => {
      this.histories = histories
      this.histories.sort((a, b) => {
        return b.date - a.date
      })  
    }))
  },
  computed: {
    monthGroupedHistories() {
      let grouped = {}
      this.histories.forEach(history => {
        let date = new Date(history.date)
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