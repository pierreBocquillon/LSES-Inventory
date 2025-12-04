<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" class="mt-5" background-color="#0f0e22" color="primary" slider-color="primary" align-tabs="center" justify-center>
        <v-tab value="garage">
          Garage
          <v-badge color="primary" v-if="notifAmount > 0" :content="notifAmount" offset-x="-5" floating></v-badge>
        </v-tab>
        <v-tab value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          Historique
        </v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="tab">

        <v-tabs-window-item value="garage">
          <GarageTab />
        </v-tabs-window-item>

        <v-tabs-window-item value="history" v-if="this.userStore.profile.permissions.some(p => ['dev', 'admin', 'cash'].includes(p))">
          <HistoryTab />
        </v-tabs-window-item>

      </v-tabs-window>

    </v-card>

  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../functions/logger'

import Vehicle from '../classes/Vehicle'
import SaveDate from '../classes/SaveDate'

import GarageTab from '@/components/garage/GarageTab.vue'
import HistoryTab from '@/components/garage/HistoryTab.vue'

export default {
  props : [],
  components: {
    GarageTab,
    HistoryTab,
  },
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      tab: 'garage',
      vehicles: [],
      lastSaveDate: null,
    }
  },

  mounted() {
    this.unsub.push(SaveDate.listenById('repa_flotte', saveDate => {
      this.lastSaveDate = saveDate
      if(!this.lastSaveDate) {
        let newDate = SaveDate.initOne()
        newDate.id = 'repa_flotte'
        newDate.date = new Date().getTime()
        newDate.save()
      }
    }))
    this.unsub.push(Vehicle.listenAll(vehicles => {
      this.vehicles = vehicles.filter(vehicle => vehicle.where !== "dead")
      this.vehicles.sort((a, b) => a.name.localeCompare(b.name))
    }))
  },

  computed: {
    deltaTime() {
      if (!this.lastSaveDate) return Infinity
      const now = new Date().getTime()
      const last = this.lastSaveDate.date
      const diff = now - last
      return Math.floor(diff / (1000 * 60 * 60))
    },
    notifAmount() {
      let count = 0
      
      if (this.deltaTime >= 24) {
        count += 1
      }

      this.vehicles.forEach(vehicle => {
        if(vehicle.where == "dead") return;
        if (vehicle.insurance) {
          count += 1
        }
        if (!vehicle.insurance && ((vehicle.underGuard && parseInt(vehicle.recupDate) < new Date().getTime()) || vehicle.needRepair) ) {
          count += 1
        }
        if (!vehicle.insurance && !vehicle.underGuard && !vehicle.hideAlert && (parseInt(vehicle.lastRepairDate) < new Date().getTime() - (24 * 60 * 60 * 1000))) {
          count += 1
        }
      })

      return count
    }
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
