<template>
  <div>
    <v-card class="mt-10 rounded-xl" :style="'max-width: '+ (filteredNavItems.length > 1 ? '720px' : '380px') + '; margin: auto;'">
      <v-card-text class="pa-5 d-flex flex-column align-center">
        <div>
          <h2 class="text-center mb-2">Nom : <span class=" text-h5 font-weight-regular">{{ userStore.profile.name }}</span></h2>
          <h2 class="text-center mb-2">Permissions :
            <span v-if="!userStore.profile.permissions || userStore.profile.permissions.length == 0">Aucune</span> 
            <v-tooltip location="bottom" content-class="bg-background" text="string" v-for="item in userStore.profile.permissions">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="text-h6">{{ permissions.find(permission => permission.value == item)?.icon }}</span>
              </template>
              <h4>{{permissions.find(permission => permission.value == item)?.name}}</h4>
            </v-tooltip>
          </h2>
        </div>

        <div class="my-3 w-100">
          <v-divider class="border-opacity-75"></v-divider>
        </div>
        
        <h2>Accés rapide :</h2>
          <div class="d-flex align-center justify-center flex-wrap">
            <div v-for="group in filteredNavItems" class="d-flex align-center justify-center flex-wrap">
              <v-btn v-for="item in group" :key="item.link" style="width: 150px; height: 150px;" class="rounded-lg ma-2" @click="$router.push(item.link)">
                <div class="d-flex flex-column align-center justify-center mb-4">
                  <v-icon size="64">{{ item.icon }}</v-icon>
                  <v-badge color="primary" v-if="item.notif > 0" :content="item.notif" floating offset-x="-30" offset-y="-50"></v-badge>
                  <h3 class="font-weight-regular w-100 text-center mt-3" style="height: 16px;white-space: normal;">{{ item.title }}</h3>
                </div>
              </v-btn>
            </div>
          </div>
  
          <div class="mt-4">
               <v-btn color="primary" prepend-icon="mdi-plus" @click="openRequestDialog">
                  Demande de formation
               </v-btn>
               <v-btn color="deep-purple" class="ml-2" prepend-icon="mdi-account-plus" @click="openCandidatureForm">
                  Candidature
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
                  <v-select
                      v-model="newRequest.training"
                      :items="availableTrainings"
                      label="Formation demandée"
                      variant="outlined"
                      :disabled="!newRequest.employee"
                  ></v-select>
              </v-card-text>
              <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="grey" variant="text" @click="requestDialog = false">Annuler</v-btn>
                  <v-btn color="primary" variant="text" @click="saveRequest">Enregistrer</v-btn>
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
import Candidature from '@/classes/Candidature'
import Swal from 'sweetalert2/dist/sweetalert2.js'

import navItems from '@/config/navItems.js'
import permissions from '@/config/permissions'

import { initNotifManager, stopNotifManager, notifState, storagesOutdated, garageNotif, alerts } from '@/functions/nofifManager.js'
import { TRAININGS_CONFIG } from '@/config/trainings'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      permissions,
      navItems,
      employees: [],
      requestDialog: false,
      newRequest: {
          employee: null,
          training: TRAININGS_CONFIG[0]?.title || ''
      },
      unsub: null,
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
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for(let group of this.navItems) {
        for(let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []
          tmp_item.notif = 0

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if(itemRoute && itemRoute.meta && itemRoute.meta.permissions){
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if(tmp_item.permissions.length <= 0) hasAccess = true
          else if(userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if(userPerms && tmp_item.permissions.every(p => userPerms.includes(p))) hasAccess = true

          if(hasAccess && tmp_item.link != this.$route.path) {
            if(tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if(tmp_item.link == '/expenseNotes') {
              tmp_item.notif = this.waitingExpenseNotes.length
            }
            if(tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if(tmp_item.link == '/inventory') {
              tmp_item.notif = this.storagesOutdated
            }
            if(tmp_item.link == '/garage') {
              tmp_item.notif = this.garageNotif
            }
            if(tmp_item.link == '/rh') {
              tmp_item.notif = this.waitingCandidatures.length
            }
            currentGroup.push(tmp_item)
          }
        }
        if(currentGroup.length > 0) {
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
    },
}
</script>