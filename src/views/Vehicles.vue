<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Vehicles :</h3>

      <v-data-table :headers="headers" :items="vehicles" items-per-page="-1" no-data-text="Aucun vehicle">
        <template v-slot:bottom />

        <template v-slot:item.name="{ item }">
          <h3 class="font-weight-regular">{{ item.icon }} {{ item.name }}</h3>
        </template>

        <template v-slot:item.where="{ item }">
          <h3 class="font-weight-regular">
            {{ allLocations.find(loc => loc.value === item.where)?.text || item.where }}
          </h3>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="primary" variant="text" icon @click="openEditVehicleDialog(item)"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn color="secondary" variant="text" icon @click="isDestroy(item)"><v-icon>mdi-grave-stone</v-icon></v-btn>
          <v-btn color="error" variant="text" icon @click="deleteVehicle(item)"><v-icon>mdi-delete</v-icon></v-btn>
        </template>

      </v-data-table>
      
      <div class="d-flex justify-center align-center mt-5">
        <v-btn color="accent" variant="flat" @click="openNewVehicleDialog">
          <h3 class="font-weight-regular">Ajouter un véhicule</h3>
        </v-btn>
      </div>

    </v-card>

    <v-dialog v-model="vehicleDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">{{ currentVehicle ? 'Modifier un véhicule' : 'Ajouter un véhicule' }}</h3>
          <v-text-field v-model="currentVehicle.icon" label="Icone" />
          <v-text-field v-model="currentVehicle.name" label="Nom" />
          <v-text-field v-model="currentVehicle.imat" label="Immatriculation" />
          <v-select v-model="currentVehicle.where" :items="allLocations" label="Localisation" item-title="text" item-value="value" />
          <v-switch color="primary" v-model="currentVehicle.hideAlert" label="Réparation facultative" />

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="save">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeVehicleDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Company from '../classes/Company'
import Vehicle from '../classes/Vehicle'
import VehicleHistory from '../classes/VehicleHistory'

import vehiclesLocations from '@/config/vehiclesLocations.js'

import logger from '../functions/logger'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'Immatriculation', key: 'imat', align: 'start' },
        { title: 'Localisation', key: 'where', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      locations: vehiclesLocations,
      companies: [],
      vehicles: [],
      vehicleDialog: false,
      currentVehicle: null,
    }
  },

  mounted() {
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Vehicle.listenAll(vehicles => {
      this.vehicles = vehicles.filter(vehicle => vehicle.where !== "dead")
      this.vehicles.sort((a, b) => {        
        if(a.hideAlert && !b.hideAlert) return 1
        if(!a.hideAlert && b.hideAlert) return -1

        if (a.where !=  b.where) {
          return a.where.localeCompare(b.where)
        }

        const iconOrder = ['🚑', '⛰️', '🚨']
        
        const aIconIndex = iconOrder.findIndex(icon => a.icon.startsWith(icon))
        const bIconIndex = iconOrder.findIndex(icon => b.icon.startsWith(icon))
        if (aIconIndex !== -1 && bIconIndex !== -1) {
          return aIconIndex - bIconIndex
        } else if (aIconIndex !== -1) {
          return -1
        } else if (bIconIndex !== -1) {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
    }))
  },

  computed: {
    allLocations() {
      let locs = [...this.locations]
      this.companies.forEach(company => {
        if (company.isGarage) {
          locs.push({
            value: company.id,
            text: `${company.icon} ${company.name}`,
            home : false,
          })
        }
      })
      return locs
    },
  },

  methods: {
    openNewVehicleDialog() {
      this.vehicleDialog = true
      this.currentVehicle = Vehicle.initOne()
    },
    openEditVehicleDialog(vehicle) {
      this.vehicleDialog = true
      this.currentVehicle = vehicle
    },
    closeVehicleDialog() {
      this.vehicleDialog = false
    },
    async save() {
      if(this.currentVehicle.id) {
        logger.log(this.userStore.profile.id, 'VEHICULES', `Modification du véhicule ${this.currentVehicle.icon}${this.currentVehicle.name}`)
      }else{
        logger.log(this.userStore.profile.id, 'VEHICULES', `Création du véhicule ${this.currentVehicle.icon}${this.currentVehicle.name}`)
      }

      await this.currentVehicle.save()
      this.closeVehicleDialog()
    },
    async isDestroy(vehicle) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous marquer le véhicule "${vehicle.name}" comme détruit ? Cela le retirera de la liste des véhicules disponibles.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      })

      if (result.isConfirmed) {
        logger.log(this.userStore.profile.id, 'VEHICULES', `Marquage du véhicule ${vehicle.icon}${vehicle.name} comme détruit`)
        vehicle.where = "dead"

        const history = VehicleHistory.initOne()
        history.date = new Date().getTime()
        history.vehicle = vehicle.id
        history.message = `Destruction du véhicule : ${vehicle.icon}${vehicle.name} (${vehicle.imat})`
        history.price = 0
        await history.save()

        await vehicle.save()

        fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
    },
    async deleteVehicle(vehicle) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer l'vehicle "${vehicle.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      })

      if (result.isConfirmed) {
        logger.log(this.userStore.profile.id, 'VEHICULES', `Suppression du véhicule ${vehicle.icon}${vehicle.name}`)
        await vehicle.delete()
        Swal.fire(
          'Supprimé !',
          `Le véhicule "${vehicle.name}" a bien été supprimé.`,
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
