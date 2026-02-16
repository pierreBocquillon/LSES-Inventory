<template>
  <div>
    
    <div class="d-flex justify-center align-center mt-5">
      <v-btn color="primary" variant="tonal" @click="openRepaDialog">
        <h3 class="font-weight-regular">Faire une repa flotte</h3>
      </v-btn>
    </div>

    <h3 class="my-5 text-center font-weight-regular text-success" v-if="deltaTime < 24">🚑 Dernière réparation flotte : {{ new Date(lastSaveDate?.date).toLocaleString().slice(0, 16) }}</h3>
    <h3 class="my-5 text-center font-weight-regular text-primary" v-else-if="deltaTime < 36">🚑 Dernière réparation flotte : {{ new Date(lastSaveDate?.date).toLocaleString().slice(0, 16) }}</h3>
    <h3 class="my-5 text-center font-weight-regular text-error" v-else>🚑 Dernière réparation flotte : {{ new Date(lastSaveDate?.date).toLocaleString().slice(0, 16) }}</h3>

    <v-data-table :headers="headers" :items="vehicles" items-per-page="-1" no-data-text="Aucun véhicule">
      <template v-slot:bottom />

      <template v-slot:item.status="{ item }" >
        <h3 :class="'font-weight-regular text-' + (item.underGuard ? 'primary' : (item.needRepair ? 'error' : 'white'))"style="width: 30px;">
          <v-tooltip location="top" content-class="bg-background" text="string" v-if="item.needRepair">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" color="error">mdi-hazard-lights</v-icon>
            </template>
            <h4>Attention ce véhicule doit être réparé avant utilisation</h4>
          </v-tooltip>
          <v-tooltip location="top" content-class="bg-background" text="string" v-if="item.insurance">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" color="deep-orange">mdi-file-certificate-outline</v-icon>
            </template>
            <h4>En attente d'une réponse de l'assurance</h4>
          </v-tooltip>
          <v-tooltip location="top" content-class="bg-background" text="string" v-if="item.underGuard">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" color="warning">mdi-tow-truck</v-icon>
            </template>
            <h4>Ce véhicule est en gardiennage/fourrière</h4>
          </v-tooltip>

          <v-tooltip location="top" content-class="bg-background" text="string" v-else-if="!item.hideAlert && new Date().getTime() - parseInt(item.lastRepairDate) > (24 * 60 * 60 * 1000)">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" color="error">mdi-alert-octagon-outline</v-icon>
            </template>
            <h4>Attention ce véhicule n'a pas été réparé depuis le {{ new Date(parseInt(item.lastRepairDate)).toLocaleString().slice(0, 16) }}</h4>
          </v-tooltip>
        </h3>
      </template>

      <template v-slot:item.name="{ item }">
        <h3 :class="'font-weight-regular text-' + (item.underGuard ? 'primary' : (item.needRepair ? 'error' : (item.insurance ? 'deep-orange' : 'white')))">
          {{ item.icon }} {{ item.name }}
        </h3>
      </template>

      <template v-slot:item.imat="{ item }">
        <h3 :class="'font-weight-regular text-' + (item.underGuard ? 'primary' : (item.needRepair ? 'error' : (item.insurance ? 'deep-orange' : 'white')))">
          {{ item.imat }}
        </h3>
      </template>

      <template v-slot:item.where="{ item }">
        <h3 class="font-weight-regular">
          {{ allLocations.find(loc => loc.value === item.where)?.text || item.where }}
        </h3>
      </template>

      <template v-slot:item.recupDate="{ item }">
        <h2 class="font-weight-regular">
          <span class="text-primary" v-if="item.underGuard && parseInt(item.recupDate) > currentTimestamp">
            (A recupérer<span> le {{ new Date(parseInt(item.recupDate)).toLocaleDateString() }} à {{ new Date(parseInt(item.recupDate)).toLocaleTimeString() }}</span>)
          </span>
          <span class="text-success" v-else-if="item.underGuard">
            (A recupérer dès que possible)
          </span>
          <span class="text-error" v-else-if="item.needRepair">
            (A réparer avant utilisation)
          </span>
          <span class="text-deep-orange" v-else-if="item.insurance">
            (En attente de retour de l'assurance)
          </span>
        </h2>
      </template>

      <template v-slot:item.actions="{ item }">
        
        <v-tooltip location="top" content-class="bg-background" text="string" v-if="!item.underGuard && !item.insurance">
          <template v-slot:activator="{ props }">
          <v-btn v-bind="props" color="cyan" variant="text" icon @click="repairNow(item)"><v-icon>mdi-tools</v-icon></v-btn>
          </template>
          <h4>Vient d'être réparé</h4>
        </v-tooltip>
        
        <v-tooltip location="top" content-class="bg-background" text="string" v-if="!item.underGuard && !item.insurance && !item.needRepair">
          <template v-slot:activator="{ props }">
          <v-btn v-bind="props" color="error" variant="text" icon @click="needRepair(item)"><v-icon>mdi-hazard-lights</v-icon></v-btn>
          </template>
          <h4>Besoin de réparation</h4>
        </v-tooltip>
        
        <v-tooltip location="top" content-class="bg-background" text="string" v-if="!item.underGuard && !item.insurance">
          <template v-slot:activator="{ props }">
          <v-btn v-bind="props" color="deep-orange" variant="text" icon @click="insurance(item)"><v-icon>mdi-file-certificate-outline</v-icon></v-btn>
          </template>
          <h4>Demande d'assurance</h4>
        </v-tooltip>
        
        <v-tooltip location="top" content-class="bg-background" text="string" v-if="!item.underGuard">
          <template v-slot:activator="{ props }">
          <v-btn v-bind="props" color="primary" variant="text" icon @click="openGuardDialog(item)"><v-icon>mdi-tow-truck</v-icon></v-btn>
          </template>
          <h4>Envoyer en gardiennage/fourrière</h4>
        </v-tooltip>
        
        <v-tooltip location="top" content-class="bg-background" text="string" v-if="(item.underGuard && parseInt(item.recupDate) < new Date().getTime()) || item.insurance">
          <template v-slot:activator="{ props }">
          <v-btn v-bind="props" color="success" variant="text" icon @click="openRecupDialog(item)"><v-icon>mdi-garage-variant</v-icon></v-btn>
          </template>
          <h4>Récupérer le véhicule</h4>
        </v-tooltip>
      </template>

    </v-data-table>

    <v-dialog v-model="repaDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">Faire une répa flotte</h3>

          <v-select v-model="selectedGarage" :items="companies.filter(company => company.isGarage)" label="Garage" item-title="name" item-value="id">

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

          <v-table>
            <tbody>
              <tr v-for="vehicle in vehicles" :key="vehicle.id">
                <td style="width: 50px;">
                  <v-switch color="primary" hide-details v-model="selectedVehicles[vehicle.id]"></v-switch>
                </td>
                <td>
                  {{ vehicle.icon }} {{ vehicle.name }} ({{ vehicle.imat }})
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="repaFlotte">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeRepaDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="recupDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">Récupérer le véhicule</h3>
          <v-select v-model="newLocation" :items="availableLocations" label="Nouvelle localisation" item-title="text" item-value="value" />
          <v-text-field v-model="price" label="Coût" suffix="$" />

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="recupVehicle">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeRecupDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="guardDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">Envoyer en gardiennage</h3>
          <v-select v-model="newLocation" :items="availableLocations" label="Nouvelle localisation" item-title="text" item-value="value" />
          <v-text-field type="datetime-local" v-model="recupDate" label="Date de récupération" />

          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="guardVehicle">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeGuardDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Company from '../../classes/Company'
import Vehicle from '../../classes/Vehicle'
import VehicleHistory from '../../classes/VehicleHistory'
import SaveDate from '../../classes/SaveDate'

import vehiclesLocations from '@/config/vehiclesLocations.js'

import logger from '../../functions/logger'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: '', key: 'status', align: 'end', sortable: false  },
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'Immatriculation', key: 'imat', align: 'start' },
        { title: 'Localisation', key: 'where', align: 'start' },
        { title: 'Date de récupération', key: 'recupDate', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      lastSaveDate: null,
      locations: vehiclesLocations,
      companies: [],
      vehicles: [],
      selectedVehicles: {},
      selectedGarage: null,
      repaDialog: false,
      guardDialog: false,
      recupDialog: false,
      newLocation: null,
      recupDate: null,
      price: null,
      currentVehicle: null,
      currentTimestamp: new Date().getTime(),
    }
  },

  mounted() {
    setInterval(() => {
      this.currentTimestamp = new Date().getTime()
    }, 10000)

    this.unsub.push(SaveDate.listenById('repa_flotte', saveDate => {
      this.lastSaveDate = saveDate
      if(!this.lastSaveDate) {
        let newDate = SaveDate.initOne()
        newDate.id = 'repa_flotte'
        newDate.date = new Date().getTime()
        newDate.save()
      }
    }))
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Vehicle.listenAll(vehicles => {
      this.vehicles = vehicles.filter(vehicle => vehicle.where !== "dead")
      this.vehicles.sort((a, b) => {
        if (a.insurance && !b.insurance) return -1
        if (!a.insurance && b.insurance) return 1

        if (a.needRepair && !b.needRepair) return -1
        if (!a.needRepair && b.needRepair) return 1

        if (a.underGuard && !b.underGuard) return -1
        if (!a.underGuard && b.underGuard) return 1
        
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
    deltaTime() {
      if (!this.lastSaveDate) return Infinity
      const now = new Date().getTime()
      const last = this.lastSaveDate.date
      const diff = now - last
      return Math.floor(diff / (1000 * 60 * 60))
    },
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
    availableLocations() {
      return this.allLocations//.filter(loc => loc.value !== this.currentVehicle.where)
    },
  },

  methods: {
    openRepaDialog(){
      this.selectedVehicles = {}
      this.vehicles.forEach(vehicle => {
        if (!this.selectedVehicles[vehicle.id]) {
          this.selectedVehicles[vehicle.id] = !vehicle.underGuard && !vehicle.hideAlert
        }
      })

      this.repaDialog = true
    },
    closeRepaDialog(){
      this.repaDialog = false
    },
    repairNow(vehicle) {
      Swal.fire({
        title: 'Confirmer',
        text: `Confirmer que le véhicule ${vehicle.icon}${vehicle.name} (${vehicle.imat}) vient d'être réparé ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          logger.log(this.userStore.profile.id, 'VEHICULES', `${vehicle.icon}${vehicle.name} (${vehicle.imat}) vient d'etre réparé`)

          vehicle.needRepair = false
          vehicle.lastRepairDate = new Date().getTime()
          vehicle.save()

          fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        }
      })
    },
    needRepair(vehicle) {
      Swal.fire({
        title: 'Confirmer',
        text: `Confirmer que le véhicule ${vehicle.icon}${vehicle.name} (${vehicle.imat}) a besoin de réparation ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          logger.log(this.userStore.profile.id, 'VEHICULES', `${vehicle.icon}${vehicle.name} (${vehicle.imat}) a besoin de réparation`)
          
          vehicle.needRepair = true
          vehicle.save()

          fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        }
      })
    },
    async insurance(vehicle) {
      Swal.fire({
        title: 'Confirmer',
        text: `Confirmer qu'une demande d'assurance a été faite pour le véhicule ${vehicle.icon}${vehicle.name} (${vehicle.imat}) ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          logger.log(this.userStore.profile.id, 'VEHICULES', `demande d'assurance pour ${vehicle.icon}${vehicle.name} (${vehicle.imat})`)

          const history = VehicleHistory.initOne()
          history.date = new Date().getTime()
          history.vehicle = vehicle.id
          history.message = `Demande d'assurance pour ${vehicle.icon}${vehicle.name} (${vehicle.imat})`
          history.price = 0
          await history.save()
          
          vehicle.insurance = true
          await vehicle.save()

          fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        }
      })
    },
    async repaFlotte(){
      if (!this.selectedGarage) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez sélectionner un garage',
        })
        return
      }
      let garage = this.companies.find(c => c.id === this.selectedGarage)
      if (!garage) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Garage invalide',
        })
        return
      }
      logger.log(this.userStore.profile.id, 'VEHICULES', `Réparation de la flotte de véhicules - ${garage.icon} ${garage.name} (${Object.values(this.selectedVehicles).filter(v => v).length}/${this.vehicles.length} véhicules réparés)`)
      
      this.lastSaveDate.date = new Date().getTime()
      this.lastSaveDate.save()

      for (const vehicleId in this.selectedVehicles) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId)
        if (vehicle) {
          vehicle.lastRepairDate = new Date().getTime()
          vehicle.needRepair = false
          await vehicle.save()
        }
      }

      const history = VehicleHistory.initOne()
      history.date = new Date().getTime()
      history.vehicle = "all"
      history.message = `Réparation de la flotte de véhicules - ${garage.icon} ${garage.name} (${Object.values(this.selectedVehicles).filter(v => v).length}/${this.vehicles.length} véhicules réparés)`
      history.price = 0
      await history.save()

      fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      this.closeRepaDialog()      
    },
    openGuardDialog(vehicle) {
      this.guardDialog = true
      this.currentVehicle = vehicle
      this.newLocation = null
      this.recupDate = new Date().toISOString().slice(0,11)+new Date().toLocaleTimeString().slice(0,5)
      this.price = 0
    },
    closeGuardDialog() {
      this.guardDialog = false
    },
    openRecupDialog(vehicle) {
      if( vehicle.insurance){
        Swal.fire({
          title: 'Confirmer',
          text: `Confirmer que la demande d'assurance a été acceptée et que vous avez récupéré le véhicule ${vehicle.icon}${vehicle.name} (${vehicle.imat}) ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui',
          cancelButtonText: 'Annuler',
        }).then(async (result) => {
          if (result.isConfirmed) {
            logger.log(this.userStore.profile.id, 'VEHICULES', `Assurance acceptée et récupération pour ${vehicle.icon}${vehicle.name} (${vehicle.imat})`)

            const history = VehicleHistory.initOne()
            history.date = new Date().getTime()
            history.vehicle = vehicle.id
            history.message = `Assurance acceptée et récupération pour ${vehicle.icon}${vehicle.name} (${vehicle.imat})`
            history.price = 0
            await history.save()

            vehicle.insurance = false
            await vehicle.save()

            fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/json'
              }
            })
          }
        })
        return
      }
      this.recupDialog = true
      this.currentVehicle = vehicle
      this.newLocation = null
      this.recupDate = new Date().toISOString().slice(0,11)+new Date().toLocaleTimeString().slice(0,5)
      this.price = 0
    },
    closeRecupDialog() {
      this.recupDialog = false
    },
    async guardVehicle() {
      if (!this.newLocation || !this.recupDate) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez remplir tous les champs',
        })
        return
      }

      logger.log(this.userStore.profile.id, 'VEHICULES', `${this.currentVehicle.icon}${this.currentVehicle.name} (${this.currentVehicle.imat}) a etait envoyé depuis ${this.allLocations.find(loc => loc.value === this.currentVehicle.where)?.text || this.currentVehicle.where} vers ${this.allLocations.find(loc => loc.value === this.newLocation)?.text || this.newLocation} (récupération le ${new Date(this.recupDate).toLocaleString()})`)

      const history = VehicleHistory.initOne()
      history.date = new Date().getTime()
      history.vehicle = this.currentVehicle.id
      history.message = `${this.currentVehicle.icon}${this.currentVehicle.name} (${this.currentVehicle.imat}) a etait envoyé depuis ${this.allLocations.find(loc => loc.value === this.currentVehicle.where)?.text || this.currentVehicle.where} vers ${this.allLocations.find(loc => loc.value === this.newLocation)?.text || this.newLocation} (récupération le ${new Date(this.recupDate).toLocaleString()})`
      history.price = 0
      await history.save()

      this.currentVehicle.insurance = false
      this.currentVehicle.where = this.newLocation
      this.currentVehicle.underGuard = true
      this.currentVehicle.recupDate = new Date(this.recupDate).getTime()

      await this.currentVehicle.save()

      fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      this.closeGuardDialog()
    },
    async recupVehicle() {
      if (!this.newLocation || isNaN(parseFloat(this.price))) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez remplir tous les champs',
        })
        return
      }

      if (parseFloat(this.price) < 0) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le coût ne peut pas être négatif',
        })
        return
      }

      logger.log(this.userStore.profile.id, 'VEHICULES', `Récupération de ${this.currentVehicle.icon}${this.currentVehicle.name} (${this.currentVehicle.imat}) pour ${this.price}$ (depuis ${this.allLocations.find(loc => loc.value === this.currentVehicle.where)?.text || this.currentVehicle.where} vers ${this.allLocations.find(loc => loc.value === this.newLocation)?.text || this.newLocation})`)

      const history = VehicleHistory.initOne()
      history.date = new Date().getTime()
      history.vehicle = this.currentVehicle.id
      history.message = `Récupération de ${this.currentVehicle.icon}${this.currentVehicle.name} (${this.currentVehicle.imat}) depuis ${this.allLocations.find(loc => loc.value === this.currentVehicle.where)?.text || this.currentVehicle.where} vers ${this.allLocations.find(loc => loc.value === this.newLocation)?.text || this.newLocation} pour ${this.price}$`
      history.price = this.price
      await history.save()

      this.currentVehicle.where = this.newLocation
      this.currentVehicle.underGuard = false
      this.currentVehicle.recupDate = null

      await this.currentVehicle.save()

      fetch('https://script.google.com/macros/s/AKfycbwf0AveLsdLMQMMzR-0flSwVP-VE9Hd8OCF5pmfDBMiCkiDKN0wJhMwXxvnUmAgGx8Z/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      this.closeRecupDialog()
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
