<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Ressources Humaines</h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Ajouter un employé
      </v-btn>
      <v-btn color="secondary" class="ml-2" prepend-icon="mdi-cog" @click="openSpecialtiesDialog">
        Spécialités
      </v-btn>
      <v-btn color="info" class="ml-2" prepend-icon="mdi-clipboard-list" @click="openChecklistsDialog">
        Procédures
      </v-btn>
      <v-btn color="success" class="ml-2" prepend-icon="mdi-contacts" @click="openDirectoryDialog">
        Annuaire
      </v-btn>
      <v-btn color="indigo" class="ml-2" prepend-icon="mdi-google-drive" @click="syncEmployees">
        Drive
      </v-btn>
    </div>

    <v-card class="flex-grow-1">
      <v-data-table
        :headers="headers"
        :items="employees"
        :search="search"
        class="h-100"
        :sort-by="[{ key: 'role', order: 'asc' }]"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="blue" v-if="item.sex === 'Homme'" class="mr-2">mdi-gender-male</v-icon>
            <v-icon color="pink" v-else-if="item.sex === 'Femme'" class="mr-2">mdi-gender-female</v-icon>
            <v-icon v-else class="mr-2">mdi-account</v-icon>
            {{ item.name }}
            <v-tooltip location="top" v-if="isBirthday(item.birthDate)">
              <template v-slot:activator="{ props }">
                 <v-icon color="amber" class="ml-2" v-bind="props" size="small">mdi-cake-variant</v-icon>
              </template>
              <span>C'est son anniversaire !</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="needsHeliReimbursement(item)">
                <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" density="compact" color="red" class="ml-2" v-bind="props" @click="confirmReimbursement(item)">
                        <v-icon>mdi-helicopter</v-icon>
                    </v-btn>
                </template>
                <span>Remboursement formation hélico dû ! Cliquer pour valider.</span>
            </v-tooltip>
          </div>
        </template>
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Liste des employés</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              @click="showAllEmails = !showAllEmails"
              class="mr-2"
              :title="showAllEmails ? 'Cacher les emails' : 'Afficher les emails'"
            >
              <v-icon>{{ showAllEmails ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            </v-btn>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Rechercher"
              single-line
              hide-details
              density="compact"
              class="mr-4"
              style="max-width: 300px"
            ></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.email="{ item }">
          <span :class="{ 'blurred-email': !showAllEmails }">
            {{ item.email }}
          </span>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
          >
            {{ item.role }}
          </v-chip>
        </template>

        <template v-slot:item.specialties="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="spec in item.specialties"
              :key="spec"
              size="x-small"
              class="mr-1 mb-1"
              :color="item.chiefSpecialties && item.chiefSpecialties.includes(spec) ? 'amber-darken-3' : undefined"
              :variant="item.chiefSpecialties && item.chiefSpecialties.includes(spec) ? 'flat' : 'tonal'"
            >
              <v-icon v-if="item.chiefSpecialties && item.chiefSpecialties.includes(spec)" start size="x-small">mdi-crown</v-icon>
              {{ getSpecialtyIcon(spec) }} {{ getSpecialtyName(spec) }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon variant="text" size="small" color="primary" @click="editEmployee(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" color="error" @click="deleteEmployee(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" color="info" @click="openDetails(item)">
            <v-icon>mdi-calendar</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Nom complet"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.sex"
                  :items="['Homme', 'Femme']"
                  label="Sexe"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  label="Email (Gmail)"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.phone"
                  label="Téléphone"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.role"
                  :items="['Interne', 'Résident', 'Titulaire', 'Spécialiste', 'Responsable de Service', 'Assistant RH', 'Directeur Adjoint', 'Directeur']"
                  label="Rôle"
                  variant="outlined"
                  @update:model-value="onRoleChange"
                ></v-select>
              </v-col>
              <v-col cols="12">
                 <v-select
                  v-model="editedItem.specialties"
                  :items="specialties"
                  item-title="name"
                  item-value="value"
                  label="Spécialités"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :prepend-icon="null">
                      <template v-slot:prepend>
                        <span class="mr-2">{{ item.raw.icon }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <v-chip size="small">
                      <span class="mr-2">{{ item.raw.icon }}</span>
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" v-if="editedItem.specialties && editedItem.specialties.length > 0">
                <v-select
                  v-model="editedItem.chiefSpecialties"
                  :items="getAvailableChiefSpecialties()"
                  item-title="name"
                  item-value="value"
                  label="Spécialité Admin"
                  variant="outlined"
                  clearable
                  multiple
                  chips
                  closable-chips
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
           <v-container>
             <v-row>
                <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.birthDate" label="Date de naissance" type="date" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.arrivalDate" label="Date d'arrivée" type="date" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.cdiDate" label="Date CDI" type="date" variant="outlined"></v-text-field>
                </v-col>
                 <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.lastPromotionDate" label="Dernière promotion" type="date" variant="outlined"></v-text-field>
                </v-col>
                 <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.medicalDegreeDate" label="Diplôme Médecine" type="date" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field v-model="editedItem.helicopterTrainingDate" label="Formation Hélico" type="date" variant="outlined"></v-text-field>
                </v-col>
                 <v-col cols="12" md="6">
                    <v-checkbox v-model="editedItem.helicopterTrainingReimbursed" label="Hélico Remboursé" density="compact" hide-details></v-checkbox>
                </v-col>
             </v-row>
           </v-container>
          </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">
            Annuler
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save">
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailsDialog" max-width="500px">
      <v-card v-if="selectedEmployee">
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">Dossier de {{ selectedEmployee.name }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
            <v-list density="compact">
                <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-cake" color="pink"></v-icon></template>
                    <v-list-item-title>Date de naissance</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(selectedEmployee.birthDate) }} ({{ calculateAge(selectedEmployee.birthDate) }} ans)</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-school" color="teal"></v-icon></template>
                    <v-list-item-title>Obtention Diplôme Médecine</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(selectedEmployee.medicalDegreeDate) }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-2"></v-divider>
                <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-clock-outline" color="blue"></v-icon></template>
                    <v-list-item-title>Ancienneté Service</v-list-item-title>
                     <v-list-item-subtitle>{{ calculateSeniority(selectedEmployee.arrivalDate) }}</v-list-item-subtitle>
                </v-list-item>
                 <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-calendar-check" color="green"></v-icon></template>
                    <v-list-item-title>Jours depuis l'arrivée</v-list-item-title>
                    <v-list-item-subtitle>{{ calculateDays(selectedEmployee.arrivalDate) }} jours</v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-2"></v-divider>
                 <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-file-document-edit-outline" color="orange"></v-icon></template>
                    <v-list-item-title>Signature CDI</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(selectedEmployee.cdiDate) }}</v-list-item-subtitle>
                </v-list-item>
                 <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-trending-up" color="purple"></v-icon></template>
                    <v-list-item-title>Dernière promotion</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(selectedEmployee.lastPromotionDate) }}</v-list-item-subtitle>
                </v-list-item>
                 <v-list-item>
                    <template v-slot:prepend><v-icon icon="mdi-medal" color="amber"></v-icon></template>
                    <v-list-item-title>Jours au grade</v-list-item-title>
                    <v-list-item-subtitle>{{ calculateDays(selectedEmployee.lastPromotionDate) }} jours</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="detailsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="specialtiesDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-secondary text-white">
          <span class="text-h5">Gérer les spécialités</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row class="align-center">
              <v-col cols="3">
                <v-text-field
                  v-model="newSpecialty.icon"
                  label="Emoji"
                  variant="outlined"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="newSpecialty.name"
                  label="Nom de la spécialité"
                  variant="outlined"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="2">
                <v-btn color="primary" icon="mdi-plus" @click="addSpecialty"></v-btn>
              </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
             <v-list density="compact">
                <v-list-item v-for="spec in specialties" :key="spec.id">
                    <template v-slot:prepend>
                        <span class="text-h6 mr-4">{{ spec.icon }}</span>
                    </template>
                    <v-list-item-title>{{ spec.name }}</v-list-item-title>
                    <template v-slot:append>
                        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeSpecialty(spec)"></v-btn>
                    </template>
                </v-list-item>
             </v-list>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="specialtiesDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="checklistDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-info text-white">
          <span class="text-h5">Procédures RH</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-select
            v-model="selectedChecklistId"
            :items="rhChecklists"
            item-title="title"
            item-value="id"
            label="Choisir une procédure"
            variant="outlined"
            @update:model-value="resetChecklist"
          >
             <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :prepend-icon="item.raw.icon"></v-list-item>
             </template>
              <template v-slot:selection="{ item }">
                <v-icon start>{{ item.raw.icon }}</v-icon>
                {{ item.title }}
              </template>
          </v-select>

          <div v-if="currentChecklist">
            <div class="d-flex align-center mb-2">
                <v-progress-linear
                    v-model="checklistProgress"
                    color="success"
                    height="20"
                    striped
                >
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>
            </div>
            <v-divider class="mb-3"></v-divider>
            <v-list density="compact">
                <template v-for="(step, index) in currentChecklist.steps" :key="index">
                    <!-- Header -->
                    <v-list-subheader v-if="typeof step === 'object' && step.header" class="font-weight-bold text-uppercase mt-2">
                        {{ step.header }}
                    </v-list-subheader>

                    <!-- Checklist Item -->
                    <v-list-item v-else>
                        <template v-slot:prepend>
                            <v-checkbox-btn v-model="checkedSteps[index]" color="success"></v-checkbox-btn>
                        </template>
                        <v-list-item-title class="text-wrap" :class="{'text-decoration-line-through text-grey': checkedSteps[index]}">
                            <span v-if="typeof step === 'string'">{{ step }}</span>
                            <span v-else>
                                {{ step.text }}
                                <a v-if="step.link" :href="step.link.url" target="_blank" class="ml-1 text-decoration-none" @click.stop>
                                    <v-icon size="small" color="primary">mdi-open-in-new</v-icon> {{ step.link.text }}
                                </a>
                            </span>
                        </v-list-item-title>
                    </v-list-item>
                </template>
            </v-list>
          </div>
          <div v-else class="text-center text-grey my-4">
            Sélectionnez une procédure pour voir les étapes.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" @click="resetChecklist" v-if="currentChecklist">Tout décocher</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="checklistDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">Confirmer la suppression</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">Êtes-vous sûr de vouloir supprimer l'employé "{{ itemToDelete?.name }}" ?</p>
          <v-select
            v-model="deleteReason"
            :items="['Abandon de poste', 'Licenciement', 'Démission', 'Autre']"
            label="Raison de la suppression"
            variant="outlined"
            hide-details="auto"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Annuler</v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="directoryDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-success text-white">
          <span class="text-h5">Annuaire</span>
        </v-card-title>
        <v-card-text class="pt-4">
             <v-data-table
                :headers="directoryHeaders"
                :items="sortedDirectoryEmployees"
                density="compact"
                items-per-page="-1"
                class="elevation-1"
                :row-props="directoryRowProps"
             >
                <template v-slot:bottom></template>
             </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="directoryDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Employee from '@/classes/Employee'
import Specialty from '@/classes/Specialty'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { rhChecklists } from '@/config/rh_checklists'
import { useUserStore } from '@/store/user.js'
import logger from '@/functions/logger.js'

export default {
  name: 'RH',
  data: () => ({

    userStore: useUserStore(),
    dialog: false,
    deleteDialog: false,
    itemToDelete: null,
    deleteReason: null,
    specialtiesDialog: false,
    search: '',
    specialties: [],
    newSpecialty: {
      name: '',
      icon: ''
    },
    
    // Checklists
    checklistDialog: false,
    
    // Directory
    directoryDialog: false,
    directoryHeaders: [
      { title: 'Nom', key: 'name', align: 'start' },
      { title: 'Téléphone', key: 'phone', align: 'start' },
    ],

    rhChecklists: rhChecklists,
    selectedChecklistId: null,
    checkedSteps: [],
    headers: [
      { title: 'Nom', key: 'name' },
      { title: 'Email', key: 'email' },
      { title: 'Téléphone', key: 'phone' },
      { 
        title: 'Rôle', 
        key: 'role',
        sort: (a, b) => {
          const roleOrder = ['Directeur', 'Directeur Adjoint', 'Assistant RH', 'Responsable de Service', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']
          return roleOrder.indexOf(a) - roleOrder.indexOf(b)
        }
      },
      { title: 'Spécialités', key: 'specialties' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],
    employees: [],
    editedItem: {
      name: '',
      email: '',
      phone: '',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialties: [],
      birthDate: null,
      arrivalDate: null,
      cdiDate: null,
      lastPromotionDate: null,
      lastPromotionDate: null,
      medicalDegreeDate: null,
      helicopterTrainingDate: null,
      helicopterTrainingReimbursed: false,
    },
    defaultItem: {
      name: '',
      email: '',
      phone: '555-',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialties: [],
      birthDate: null,
      arrivalDate: null,
      cdiDate: null,
      lastPromotionDate: null,
      medicalDegreeDate: null,
      helicopterTrainingDate: null,
      helicopterTrainingReimbursed: false,
    },
    detailsDialog: false,
    selectedEmployee: null,

    unsub: [],
    showAllEmails: false,
  }),

  computed: {
    formTitle() {
      return this.editedItem.id ? 'Modifier l\'employé' : 'Nouvel employé'
    },
    currentChecklist() {
        return this.rhChecklists.find(c => c.id === this.selectedChecklistId)
    },
    checklistProgress() {
        if (!this.checkedSteps.length) return 0
        
        // Count actual actionable items (not headers)
        let totalItems = 0
        let completedItems = 0
        
        this.currentChecklist.steps.forEach((step, index) => {
            if (typeof step === 'object' && step.header) {
                // It's a header, ignore
            } else {
                totalItems++
                if (this.checkedSteps[index]) completedItems++
            }
        })
        
        if (totalItems === 0) return 0
        return (completedItems / totalItems) * 100
    },

    sortedDirectoryEmployees() {
        const roleOrder = ['Directeur', 'Directeur Adjoint', 'Assistant RH', 'Responsable de Service', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']
        
        return [...this.employees].sort((a, b) => {
            // 1. Sort by Role Priority
            const roleDiff = roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
            if (roleDiff !== 0) return roleDiff
            
            // 2. Sort by Seniority (Arrival Date) - Ascending (Earliest date = Most senior)
            if (!a.arrivalDate) return 1
            if (!b.arrivalDate) return -1
            return new Date(a.arrivalDate) - new Date(b.arrivalDate)
        })
    }
  },

  mounted() {
    this.unsub.push(Employee.listenAll((employees) => {
      this.employees = employees
    }))
    this.unsub.push(Specialty.listenAll((list) => {
      this.specialties = list
    }))
  },

  beforeUnmount() {
    this.unsub.forEach(u => {
      if (typeof u === 'function') u()
    })
  },

  methods: {
    getRoleColor(role) {
      if (['Directeur', 'Directeur Adjoint'].includes(role)) return 'red'
      if (['Responsable de Service'].includes(role)) return 'purple'
      if (['Assistant RH'].includes(role)) return 'orange'
      if (['Résident', 'Titulaire', 'Spécialiste'].includes(role)) return 'blue'
      return 'green'
    },

    getSpecialtyIcon(value) {
      const spec = this.specialties.find(s => s.value === value)
      return spec ? spec.icon : ''
    },

    getSpecialtyName(value) {
      const spec = this.specialties.find(s => s.value === value)
      return spec ? spec.name : value
    },

    isBirthday(dateString) {
      if (!dateString) return false
      const date = new Date(dateString)
      const today = new Date()
      return date.getDate() === today.getDate() && date.getMonth() === today.getMonth()
    },

    needsHeliReimbursement(item) {
        if (!item.helicopterTrainingDate || item.helicopterTrainingReimbursed) return false
        const trainingDate = new Date(item.helicopterTrainingDate)
        const oneMonthLater = new Date(trainingDate)
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
        
        const today = new Date()
        return today >= oneMonthLater
    },

    confirmReimbursement(item) {
        Swal.fire({
            title: 'Confirmer le remboursement',
            text: `Avez-vous remboursé la formation hélico pour ${item.name} ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, validé',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                     item.helicopterTrainingReimbursed = true
                     await item.save()
                     
                     Swal.fire({
                        icon: 'success',
                        title: 'Remboursement validé',
                        text: 'Le statut a été mis à jour',
                        timer: 1500,
                        showConfirmButton: false
                     })
                } catch(e) {
                    console.error(e)
                     Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: 'Impossible de mettre à jour le statut'
                     })
                }
            }
        })
    },

    getAvailableChiefSpecialties() {
      if (!this.editedItem.specialties) return []
      return this.specialties.filter(s => this.editedItem.specialties.includes(s.value))
    },

    openAddDialog() {
      this.editedItem = Object.assign({}, this.defaultItem)
      const today = new Date().toISOString().substr(0, 10)
      this.editedItem.arrivalDate = today
      this.editedItem.lastPromotionDate = today
      this.dialog = true
    },

    editEmployee(item) {
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    close() {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
      })
    },

    async save() {
      if (!this.editedItem.name || !this.editedItem.email) {
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Veuillez remplir tous les champs',
            timer: 2000
        })
        return
      }

      try {
        let profile
        let isNew = false
        let oldRole = null

        if (this.editedItem.id) {
           const original = this.employees.find(e => e.id === this.editedItem.id)
           if (original) oldRole = original.role
           profile = new Employee(
             this.editedItem.id,
             this.editedItem.name,
             this.editedItem.email,
             this.editedItem.role,
             this.editedItem.sex,
             this.editedItem.phone,
             this.editedItem.specialties,
             this.editedItem.chiefSpecialties,
             this.editedItem.birthDate,
             this.editedItem.arrivalDate,
             this.editedItem.cdiDate,
             this.editedItem.lastPromotionDate,
             this.editedItem.medicalDegreeDate,
             this.editedItem.helicopterTrainingDate,
             this.editedItem.helicopterTrainingReimbursed
           )
        } else {
          // Creating new
          isNew = true
          profile = new Employee(
            null,
            this.editedItem.name,
            this.editedItem.email,
            this.editedItem.role,
            this.editedItem.sex,
            this.editedItem.phone,
            this.editedItem.specialties,
            this.editedItem.chiefSpecialties,
            this.editedItem.birthDate,
            this.editedItem.arrivalDate,
            this.editedItem.cdiDate,
            this.editedItem.lastPromotionDate,
            this.editedItem.medicalDegreeDate,
            this.editedItem.helicopterTrainingDate,
            this.editedItem.helicopterTrainingReimbursed
          )
        }

        await profile.save()
        
        if (isNew) {
            logger.log(this.userStore.profile.name, "Ajout employés", `Ajout de l'employé ${this.editedItem.name} en tant que ${this.editedItem.role}`)
        } else if (oldRole && oldRole !== this.editedItem.role) {
            logger.log(this.userStore.profile.name, "Changement de grade", `Passage de ${this.editedItem.name} de ${oldRole} à ${this.editedItem.role}`)
        }

        Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Employé enregistré',
            timer: 2000
        })
        this.syncEmployees(true)
        this.close()
      } catch (e) {
        console.error(e)
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Erreur lors de l'enregistrement",
        })
      }
    },

    deleteEmployee(item) {
      this.itemToDelete = item
      this.deleteReason = null
      this.deleteDialog = true
    },

    closeDeleteDialog() {
      this.deleteDialog = false
      this.itemToDelete = null
      this.deleteReason = null
    },

    async confirmDelete() {
      if (!this.deleteReason) {
         Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Vous devez sélectionner une raison',
            timer: 2000
        })
        return
      }

      try {
        await this.itemToDelete.delete()
        logger.log(this.userStore.profile.name, "Suppression employé", `Suppression de ${this.itemToDelete.name} pour ${this.deleteReason}`)
        Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Employé supprimé',
            timer: 2000
        })
        this.syncEmployees(true)
        this.closeDeleteDialog()
      } catch (e) {
        console.error(e)
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Erreur lors de la suppression",
        })
      }
    },

    openDetails(item) {
      this.selectedEmployee = item
      this.detailsDialog = true
    },

    formatDate(dateString) {
      if (!dateString) return 'Non renseigné'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },

    calculateAge(dateString) {
      if (!dateString) return '?'
      const birthDate = new Date(dateString)
      const ageDifMs = Date.now() - birthDate.getTime()
      const ageDate = new Date(ageDifMs)
      return Math.abs(ageDate.getUTCFullYear() - 1970)
    },

    calculateSeniority(dateString) {
        if (!dateString) return 'Non renseigné'
        const date = new Date(dateString + 'T00:00:00')
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        
        let years = now.getFullYear() - date.getFullYear()
        let months = now.getMonth() - date.getMonth()
        if (months < 0 || (months === 0 && now.getDate() < date.getDate())) {
            years--
            months += 12
        }
        return `${years} ans, ${months} mois`
    },

    calculateDays(dateString) {
       if (!dateString) return '?'
       const oneDay = 24 * 60 * 60 * 1000
       const firstDate = new Date(dateString + 'T00:00:00')
       const secondDate = new Date()
       secondDate.setHours(0, 0, 0, 0)
       
       return Math.round(Math.abs((firstDate - secondDate) / oneDay))
    },

    onRoleChange() {
        this.editedItem.lastPromotionDate = new Date().toISOString().substr(0, 10)
    },

    openSpecialtiesDialog() {
        this.specialtiesDialog = true
    },

    async addSpecialty() {
        if (!this.newSpecialty.name || !this.newSpecialty.icon) return
        try {
            const spec = new Specialty(null, this.newSpecialty.name, this.newSpecialty.icon)
            await spec.save()
            this.newSpecialty = { name: '', icon: '' }
        } catch (e) {
            console.error(e)
            Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de l'ajout" })
        }
    },

    async removeSpecialty(item) {
        try {
             // Reconstruct instance to delete
             const spec = new Specialty(item.id, item.name, item.icon, item.value)
             await spec.delete()
        } catch (e) {
             console.error(e)
             Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de la suppression" })
        }
    },

    openChecklistsDialog() {
        this.checklistDialog = true
    },
    
    resetChecklist() {
        if (this.currentChecklist) {
            this.checkedSteps = new Array(this.currentChecklist.steps.length).fill(false)
        } else {
            this.checkedSteps = []
        }
    },

    openDirectoryDialog() {
        this.directoryDialog = true
    },

    directoryRowProps({ item }) {
        const color = this.getRoleColor(item.role)
        return { class: `bg-${color}-lighten-4` }
    },

    async syncEmployees(silent = false) {
        if (typeof silent !== 'boolean') silent = false
        if (silent) {
             try {
                const payload = this.sortedDirectoryEmployees.map(e => ({
                    name: e.name || '',
                    arrivalDate: e.arrivalDate ? new Date(e.arrivalDate).toLocaleDateString('fr-FR') : '',
                    phone: e.phone || '',
                    cdiDate: e.cdiDate ? new Date(e.cdiDate).toLocaleDateString('fr-FR') : '-',
                    role: e.role || ''
                }))

                await fetch('https://script.google.com/macros/s/AKfycbznvu7vOZ3NwkJ4QAKcJPBENOPns9n72zQOYiOI3Oqo_p2IjsZ7DUzoSAHfjUSlOTMDpg/exec', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                })

                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    }
                });
                Toast.fire({
                    icon: "success",
                    title: "Drive synchronisé"
                });
            } catch (e) {
                console.error("Auto-sync failed", e)
            }
            return
        }

        Swal.fire({
            title: 'Synchronisation',
            text: 'Voulez-vous synchroniser la liste des employés avec le Google Sheet de la Mairie ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, synchroniser',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Loading state
                Swal.fire({
                    title: 'Synchronisation en cours...',
                    didOpen: () => { Swal.showLoading() },
                    allowOutsideClick: false
                })

                try {
                    // Prepare data
                    const payload = this.sortedDirectoryEmployees.map(e => ({
                        name: e.name || '',
                        arrivalDate: e.arrivalDate ? new Date(e.arrivalDate).toLocaleDateString('fr-FR') : '',
                        phone: e.phone || '',
                        cdiDate: e.cdiDate ? new Date(e.cdiDate).toLocaleDateString('fr-FR') : '-',
                        role: e.role || ''
                    }))

                    // Send to Google Apps Script
                    await fetch('https://script.google.com/macros/s/AKfycbznvu7vOZ3NwkJ4QAKcJPBENOPns9n72zQOYiOI3Oqo_p2IjsZ7DUzoSAHfjUSlOTMDpg/exec', {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        body: JSON.stringify(payload)
                    })

                     Swal.fire({
                        icon: 'success',
                        title: 'Synchronisé !',
                        text: 'Les données ont été envoyées au Google Sheet.',
                        timer: 2000
                    })
                    
                } catch (e) {
                    console.error(e)
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: 'Impossible de synchroniser avec le Drive.'
                    })
                }
            }
        })
    }
  },
}
</script>

<style scoped>
.blurred-email {
  filter: blur(4px);
  transition: filter 0.3s ease;
  user-select: none;
  cursor: default;
}

.blurred-email:hover {
  filter: blur(0);
  user-select: text;
  cursor: text;
}
</style>
