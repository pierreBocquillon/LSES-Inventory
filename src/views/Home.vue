<template>
  <div class="home-page pa-6">

    <!-- Profil -->
    <v-card class="mx-auto mb-6 rounded-xl" max-width="1000px" elevation="2">
      <v-card-text class="pa-6">
        <div class="d-flex align-center justify-center" style="gap: 20px;">
          <div class="text-center">
            <div class="text-h5 font-weight-bold">{{ userStore.profile.name }}</div>
            <!-- Dispatch info -->
            <div class="mt-3 d-flex align-center justify-center flex-wrap" style="gap: 10px;" v-if="dispatch">
              <v-chip
                v-if="myDispatchPosition"
                :color="myDispatchPosition.color"
                variant="tonal"
                size="default"
                prepend-icon="mdi-map-marker"
              >
                {{ myDispatchPosition.emoji }} {{ myDispatchPosition.label }}
              </v-chip>
              <v-chip
                v-if="myRadio"
                :color="myRadio.status === 'on' ? 'success' : 'error'"
                variant="tonal"
                size="default"
                prepend-icon="mdi-radio-handheld"
              >
                Radio {{ myRadio.serial || '—' }} &nbsp;·&nbsp;
                <strong>{{ myRadio.status === 'on' ? 'ON' : 'OFF' }}</strong>
              </v-chip>
              <v-chip v-else-if="dispatch" color="grey" variant="tonal" size="default" prepend-icon="mdi-radio-handheld">
                Pas de radio
              </v-chip>
            </div>
            <div class="mt-5 d-flex align-center justify-center flex-wrap" style="gap: 6px;">
              <h3 class="text-medium-emphasis mr-1">Permissions :</h3>
              <h3 v-if="!userStore.profile.permissions || userStore.profile.permissions.length == 0" class="text-medium-emphasis">Aucune</h3>
              <v-tooltip location="bottom" content-class="bg-background" v-for="item in userStore.profile.permissions" :key="item">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="text-h5 cursor-pointer">{{permissions.find(p => p.value == item)?.icon}}</span>
                </template>
                <h4>{{permissions.find(p => p.value == item)?.name}}</h4>
              </v-tooltip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Accès rapide -->
    <v-card class="mx-auto mb-6 rounded-xl" max-width="1000px" elevation="2" v-if="filteredNavItems.length > 0">
      <v-card-title class="pa-5 pb-2 d-flex align-center justify-center text-subtitle-1 font-weight-bold text-medium-emphasis text-uppercase d-flex align-center justify-center" style="letter-spacing: 1px;">
        <v-icon size="18" class="mr-2">mdi-lightning-bolt</v-icon>Accès rapide
      </v-card-title>
      <v-card-text class="pa-4 pt-2">
        <div class="d-flex flex-wrap justify-center" style="gap: 10px;">
          <template v-for="group in filteredNavItems">
            <v-card v-for="item in group" :key="item.link" class="nav-card rounded-xl d-flex align-center justify-center flex-column" width="150" height="150" variant="tonal" hover @click="$router.push(item.link)" style="cursor: pointer; position: relative;">
              <v-badge v-if="item.notif > 0" color="error" :content="item.notif" style="position: absolute; top: 20px; right: 20px;"></v-badge>
              <v-icon size="64" class="mb-2">{{ item.icon }}</v-icon>
              <h3 class="font-weight-medium text-center px-2" style="white-space: normal; line-height: 1.5;">{{ item.title }}</h3>
            </v-card>
          </template>
        </div>
      </v-card-text>
    </v-card>

    <!-- Actions rapides -->
    <v-card class="mx-auto rounded-xl" max-width="1000px" elevation="2">
      <v-card-title class="pa-5 pb-2 d-flex align-center justify-center text-subtitle-1 font-weight-bold text-medium-emphasis text-uppercase" style="letter-spacing: 1px;">
        <v-icon size="18" class="mr-2">mdi-cursor-default-click</v-icon>Actions
      </v-card-title>
      <v-card-text class="pa-4 pt-2">
        <div class="d-flex flex-wrap justify-center" style="gap: 10px;">
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-school" @click="openRequestDialog">
            Demande de formation
          </v-btn>
          <v-btn color="deep-purple" variant="tonal" prepend-icon="mdi-account-plus" @click="openCandidatureForm">
            Candidature
          </v-btn>
          <v-btn color="amber" variant="tonal" prepend-icon="mdi-medal" @click="openPromotionDialog">
            Demande de promotion
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="requestDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">Faire une demande de formation</v-card-title>
        <v-card-text class="pt-4">
          <div class="text-subtitle-1 mb-2">
            Demandeur : <strong>{{ userStore.profile.name }}</strong>
          </div>
          <v-select v-model="newRequest.training" :items="availableTrainings" label="Formation demandée" variant="outlined" :disabled="!newRequest.employee"></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="requestDialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="text" @click="saveRequest">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="promotionDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-amber text-white">Faire une demande de promotion</v-card-title>
        <v-card-text class="pt-4">
          <div class="text-subtitle-1 mb-2">
            Demandeur : <strong>{{ userStore.profile.name }}</strong>
          </div>
          <v-radio-group v-model="newPromotion.type" inline>
            <v-radio label="Devenir Responsable de pôle" value="specialist"></v-radio>
            <v-radio label="Intégrer les RH" value="rh"></v-radio>
          </v-radio-group>

          <v-expand-transition>
            <v-select v-if="newPromotion.type === 'specialist'" v-model="newPromotion.specialty" :items="availableSpecialties" item-title="name" item-value="value" label="Spécialité visée" variant="outlined" :disabled="!newPromotion.employee">
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :prepend-icon="null">
                  <template v-slot:prepend>
                    <span class="mr-2">{{ item.raw.icon }}</span>
                  </template>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                <span class="mr-2">{{ item.raw.icon }}</span>
                {{ item.title }}
              </template>
            </v-select>
          </v-expand-transition>
          <v-textarea v-model="newPromotion.motivation" label="Motivations" variant="outlined" rows="3" auto-grow></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="promotionDialog = false">Annuler</v-btn>
          <v-btn color="amber" variant="text" @click="savePromotionRequest">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="candidatureFormDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-deep-purple text-white">
          <span class="text-h5">Nouvelle Candidature</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedCandidature.name" label="Nom complet" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedCandidature.phone" label="Téléphone" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedCandidature.email" label="Email (@discord.gg)" variant="outlined" hint="Doit finir par @discord.gg"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedCandidature.availabilities" label="Disponibilités" variant="outlined" rows="3"></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="candidatureFormDialog = false">Annuler</v-btn>
          <v-btn color="deep-purple" variant="text" @click="saveCandidature">Sauvegarder</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Employee from '@/classes/Employee'
import Specialty from '@/classes/Specialty'
import Candidature from '@/classes/Candidature'
import Swal from 'sweetalert2/dist/sweetalert2.js'

import navItems from '@/config/navItems.js'
import permissions from '@/config/permissions'

import { initNotifManager, stopNotifManager, notifState, storagesOutdated, garageNotif, alerts, rhNotif } from '@/functions/nofifManager.js'
import { TRAININGS_CONFIG } from '@/config/trainings'
import logger from '@/functions/logger.js'
import Dispatch from '@/classes/Dispatch'
import { allCategories } from '@/config/dispatch'

export default {
  props: [],
  data() {
    return {
      userStore: useUserStore(),
      permissions,
      navItems,
      employees: [],
      specialties: [],
      requestDialog: false,
      newRequest: {
        employee: null,
        training: TRAININGS_CONFIG[0]?.title || ''
      },
      promotionDialog: false,
      newPromotion: {
        employee: null,
        type: 'specialist',
        specialty: null,
        motivation: ''
      },
      unsub: null,
      unsubSpecialties: null,
      unsubDispatch: null,
      dispatch: null,
      candidatureFormDialog: false,
      editedCandidature: {
        id: null,
        name: '',
        phone: '555-',
        email: '',
        availabilities: '',
        status: 'Candidature reçue',
        votes: {},
        answers: {}
      }
    }
  },
  created() {
    initNotifManager()
  },
  mounted() {
    this.unsub = Employee.listenAll((employees) => {
      this.employees = [...employees].sort((a, b) => a.name.localeCompare(b.name))
    })
    this.unsubSpecialties = Specialty.listenAll((list) => {
      this.specialties = list
    })
    this.unsubDispatch = Dispatch.listenGlobal((data) => {
      this.dispatch = data
    })
  },
  computed: {
    storagesOutdated() {
      return storagesOutdated.value
    },
    garageNotif() {
      return garageNotif.value
    },
    alerts() {
      return alerts.value
    },
    waitingUsers() {
      return notifState.waitingUsers
    },
    waitingExpenseNotes() {
      return notifState.waitingExpenseNotes
    },
    orders() {
      return notifState.orders
    },
    waitingCandidatures() {
      return notifState.waitingCandidatures
    },
    rhNotif() {
      return rhNotif.value
    },
    currentEmployeeId() {
      const profileName = this.userStore.profile?.name?.toLowerCase().trim()
      return this.employees.find(e => e.name?.toLowerCase().trim() === profileName)?.id || null
    },
    myDispatchPosition() {
      if (!this.dispatch || !this.currentEmployeeId) return null
      const id = this.currentEmployeeId
      // Centrale
      if ((this.dispatch.centrale?.employees || []).some(e => e.employeeId === id))
        return { type: 'centrale', label: 'Centrale', emoji: '🎧', color: 'blue' }
      // Interventions
      for (const slot of (this.dispatch.interventions || [])) {
        if ((slot.employees || []).some(e => e.employeeId === id)) {
          const type = slot.type || 'intervention'
          const interTypes = [
            { value: 'intervention', label: 'Intervention', emoji: '🚑' },
            { value: 'primo_inter', label: 'Primo Inter', emoji: '🔥' },
            { value: 'patrouille', label: 'Patrouille', emoji: '🚔' },
            { value: 'event', label: 'Event', emoji: '🎪' },
            { value: 'rdv', label: 'Rendez-Vous', emoji: '📅' },
            { value: 'psy', label: 'Psy', emoji: '🧠' },
            { value: 'otage', label: 'Banque/Bijouterie', emoji: '💰' },
            { value: 'bureau_admin', label: 'Bureau/Admin', emoji: '🖥️' },
            { value: 'formation', label: 'Formation', emoji: '📚' },
            { value: 'operation', label: 'Opération', emoji: '⚙️' },
            { value: 'vm', label: 'VM', emoji: '🩺' },
            { value: 'hopital', label: "Dans l'hopital", emoji: '🏥' },
          ]
          const meta = interTypes.find(t => t.value === type) || { label: 'Intervention', emoji: '🚑' }
          const loc = slot.location ? ` — ${slot.location}` : ''
          return { type: 'intervention', label: meta.label + loc, emoji: meta.emoji, color: 'red' }
        }
      }
      // Patates
      const patate = (this.dispatch.patates || []).find(p => p.employeeId === id)
      if (patate) {
        const cats = [
          { value: 'en_service', label: 'En service', emoji: '🟢', color: 'green' },
          { value: 'astreinte', label: 'En astreinte', emoji: '⏰', color: 'orange' },
          { value: 'conges', label: 'En congés', emoji: '🏖️', color: 'blue' },
          { value: 'fin_service', label: 'Fin de service', emoji: '🔴', color: 'red' },
          { value: 'sans_permis', label: 'Tout PT / Sans Permis', emoji: '🚶', color: 'grey' },
        ]
        const cat = cats.find(c => c.value === patate.category) || { label: patate.category, emoji: '🥔', color: 'grey' }
        return { type: 'patate', label: cat.label, emoji: cat.emoji, color: cat.color }
      }
      // Hors service
      return { type: 'hs', label: 'Hors service', emoji: '😴', color: 'grey' }
    },
    myRadio() {
      if (!this.dispatch || !this.currentEmployeeId) return null
      return (this.dispatch.radios || []).find(r => r.employeeId === this.currentEmployeeId) || null
    },
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for (let group of this.navItems) {
        for (let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []
          tmp_item.notif = 0

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if (itemRoute && itemRoute.meta && itemRoute.meta.permissions) {
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if (tmp_item.permissions.length <= 0) hasAccess = true
          else if (userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if (userPerms && tmp_item.permissions.some(p => userPerms.includes(p))) hasAccess = true

          if (tmp_item.link == '/appointments') {
            const profileName = this.userStore.profile?.name?.toLowerCase().trim()
            const currentEmployee = this.employees.find(e => e.name?.toLowerCase().trim() === profileName)

            if (!currentEmployee) {
              hasAccess = false
            } else if (['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)) {
              hasAccess = true
            } else {
              const allSpecs = [
                ...(currentEmployee.specialties || []),
                ...(currentEmployee.chiefSpecialties || [])
              ]
              hasAccess = allSpecs.some(s => {
                const spec = this.specialties.find(sp => sp.value === s || sp.name === s)
                return spec && spec.canTakeAppointments
              })
            }
          }

          if (hasAccess && tmp_item.link != this.$route.path) {
            if (tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if (tmp_item.link == '/expenseNotes') {
              tmp_item.notif = this.waitingExpenseNotes.length
            }
            if (tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if (tmp_item.link == '/inventory') {
              tmp_item.notif = this.storagesOutdated
            }
            if (tmp_item.link == '/garage') {
              tmp_item.notif = this.garageNotif
            }
            if (tmp_item.link == '/rh') {
              tmp_item.notif = this.rhNotif
            }
            currentGroup.push(tmp_item)
          }
        }
        if (currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    },
    availableTrainings() {
      if (!this.newRequest.employee) return []
      const emp = this.newRequest.employee
      const allTrainings = TRAININGS_CONFIG.map(t => t.title)
      if (!emp.trainingRequests) return allTrainings
      return allTrainings.filter(t => !emp.trainingRequests.includes(t))
    },
    availableSpecialties() {
      if (!this.newPromotion.employee) return []
      return this.specialties
    },
  },

  methods: {
    openRequestDialog() {
      const currentEmployee = this.employees.find(e => e.name === this.userStore.profile.name)

      if (!currentEmployee) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible de trouver votre dossier employé."
        })
        return
      }

      this.newRequest = { employee: currentEmployee, training: TRAININGS_CONFIG[0]?.title || '' }
      this.requestDialog = true
    },

    async saveRequest() {
      if (!this.newRequest.employee || !this.newRequest.training) return

      try {
        const emp = this.newRequest.employee
        if (!emp.trainingRequests) emp.trainingRequests = []

        // Avoid duplicates
        if (!emp.trainingRequests.includes(this.newRequest.training)) {
          emp.trainingRequests.push(this.newRequest.training)
          await emp.save()

          Swal.fire({
            icon: 'success',
            title: 'Demande enregistrée',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          })
          logger.log(this.userStore.profile.id, 'FORMATION', `Ajout de la formation "${this.newRequest.training}" pour ${this.newRequest.employee.name}`)
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Demande déjà existante',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          })
        }
        this.requestDialog = false
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible d'enregistrer la demande"
        })
      }
    },

    openPromotionDialog() {
      const currentEmployee = this.employees.find(e => e.name === this.userStore.profile.name)

      if (!currentEmployee) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible de trouver votre dossier employé."
        })
        return
      }

      this.newPromotion = { employee: currentEmployee, type: 'specialist', specialty: null, motivation: '' }
      this.promotionDialog = true
    },

    async savePromotionRequest() {
      if (!this.newPromotion.employee) return
      if (this.newPromotion.type === 'specialist' && !this.newPromotion.specialty) return
      if (!this.newPromotion.motivation) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Les motivations sont obligatoires"
        })
        return
      }

      try {
        const emp = this.newPromotion.employee

        if (emp.promotionRequest) {
          Swal.fire({
            icon: 'warning',
            title: 'Attention',
            text: "Vous avez déjà une demande en cours."
          })
          return
        }

        emp.promotionRequest = {
          value: this.newPromotion.type === 'rh' ? 'Intégration RH' : this.newPromotion.specialty,
          motivation: this.newPromotion.motivation
        }
        await emp.save()

        Swal.fire({
          icon: 'success',
          title: 'Demande envoyée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })

        this.promotionDialog = false
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible d'enregistrer la demande"
        })
      }
    },

    openCandidatureForm() {
      this.editedCandidature = {
        id: null,
        name: '',
        phone: '555-',
        email: '',
        availabilities: '',
        status: 'Candidature reçue',
        votes: {},
        answers: {}
      }
      this.candidatureFormDialog = true
    },

    async saveCandidature() {
      if (!this.editedCandidature.name || !this.editedCandidature.email || !this.editedCandidature.phone) {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: 'Veuillez remplir les champs obligatoires'
        })
        return
      }

      if (!this.editedCandidature.email.endsWith('@discord.gg')) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "L'email doit se terminer par @discord.gg"
        })
        return
      }

      try {
        const cand = new Candidature(
          this.editedCandidature.id,
          this.editedCandidature.name,
          this.editedCandidature.phone,
          this.editedCandidature.email,
          this.editedCandidature.availabilities,
          this.editedCandidature.status,
          this.editedCandidature.votes,
          this.editedCandidature.answers
        )
        await cand.save()
        this.candidatureFormDialog = false
        Swal.fire({
          icon: 'success',
          title: 'Candidature enregistrée',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors de l'enregistrement"
        })
      }
    },
  },
  beforeUnmount() {
    stopNotifManager()
    if (this.unsub) this.unsub()
    if (this.unsubSpecialties) this.unsubSpecialties()
    if (this.unsubDispatch) this.unsubDispatch()
  },
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.nav-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: visible !important;
}

.nav-card:hover {
  transform: translateY(-3px);
}
</style>