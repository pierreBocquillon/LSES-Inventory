<template>
  <div class="pa-4" v-if="hasAccess && isLoaded">
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4 text-primary">Gestion des Rendez-vous</h1>
      <div class="d-flex align-center">
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          mandatory
          class="mr-4"
          density="compact"
        >
          <v-btn value="list" prepend-icon="mdi-format-list-bulleted">Liste</v-btn>
          <v-btn value="agenda" prepend-icon="mdi-calendar">Agenda</v-btn>
          <v-btn value="demandes" prepend-icon="mdi-google-spreadsheet">
            Demandes
            <v-badge v-if="newRequestsCount > 0" :content="newRequestsCount" color="error" floating />
          </v-btn>
        </v-btn-toggle>
        <v-btn color="primary" @click="openAddModal" prepend-icon="mdi-plus" v-if="viewMode !== 'demandes'">Nouveau RDV</v-btn>
      </div>
    </div>

    <v-card class="mb-4 rounded-xl" theme="dark" v-if="viewMode !== 'demandes'">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filterSpecialty"
              :items="specialtiesList"
              item-title="name"
              item-value="name"
              label="Filtrer par spécialité"
              clearable
              hide-details
              density="compact"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <span class="mr-2">{{ item.raw.icon }}</span>
                  </template>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                <span class="mr-1">{{ item.raw.icon }}</span>
                {{ item.raw.name }}
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filterStatus"
              :items="['Tous', 'En attente', 'Programmé', 'Terminé', 'Annulé']"
              label="Filtrer par statut"
              hide-details
              density="compact"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="rounded-xl" theme="dark" v-if="viewMode === 'list'">
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="filteredAppointments"
        class="elevation-0 transparent"
        hover
      >
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template v-slot:item.specialty="{ item }">
          {{ getSpecialtyIcon(item.specialty) }} {{ item.specialty }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            class="text-uppercase font-weight-bold"
          >
            {{ item.status }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" color="warning" @click="openRecapModal(item)"></v-btn>
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openEditModal(item)"></v-btn>
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-card class="rounded-xl pa-4" theme="dark" v-else-if="viewMode === 'agenda'">
      <FullCalendar :options="calendarOptions" />
    </v-card>

    <v-card class="rounded-xl" theme="dark" v-else-if="viewMode === 'demandes'">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2">mdi-google-spreadsheet</v-icon>
        Demandes Google Forms
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-refresh"
          :loading="isLoadingRequests"
          @click="loadFormRequests"
          color="primary"
        ></v-btn>
      </v-card-title>
      <v-card-text v-if="isLoadingRequests" class="text-center pa-8">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-4 text-grey">Chargement des demandes...</div>
      </v-card-text>
      <v-card-text v-else-if="formRequestsError" class="text-center pa-8">
        <v-icon color="error" size="48" class="mb-2">mdi-alert-circle</v-icon>
        <div class="text-error">{{ formRequestsError }}</div>
        <v-btn color="primary" variant="text" class="mt-2" @click="loadFormRequests">Réessayer</v-btn>
      </v-card-text>
      <v-data-table
        v-else
        v-model:sort-by="requestSortBy"
        :headers="requestHeaders"
        :items="formRequests"
        class="elevation-0 transparent"
        hover
        items-per-page="15"
      >
        <template v-slot:item.createdAt="{ item }">
          <span class="text-caption">{{ formatTimestamp(item.horodateur) }}</span>
        </template>
        <template v-slot:item.patientName="{ item }">
          <span :class="{ 'text-grey': isAlreadyImported(item) }">{{ item.patientName }}</span>
        </template>
        <template v-slot:item.specialty="{ item }">
          {{ item.specialty }}
        </template>
        <template v-slot:item.availability="{ item }">
          <span class="text-caption">{{ item.availability }}</span>
        </template>
        <template v-slot:item.notes="{ item }">
          <span class="text-caption" :title="item.notes">{{ truncate(item.notes, 40) }}</span>
        </template>
        <template v-slot:item.sheetComment="{ item }">
          <span class="text-caption" :title="item.sheetComment">{{ truncate(item.sheetComment, 40) }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            v-if="!isAlreadyImported(item)"
            size="small"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="importRequest(item)"
          >
            Créer RDV
          </v-btn>
          <v-chip v-else size="small" color="success" variant="tonal" prepend-icon="mdi-check">
            Importé
          </v-chip>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="isModalOpen" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4">
          <span class="text-h5">{{ isEditing ? 'Modifier le RDV' : 'Nouveau RDV' }}</span>
        </v-card-title>
        
        <v-card-text class="pa-4 mt-2">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="currentAppointment.patientName" label="Nom du patient *" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="currentAppointment.patientPhone" label="Numéro de téléphone"></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="currentAppointment.specialty"
                  :items="specialtiesList"
                  item-title="name"
                  item-value="name"
                  label="Spécialité demandée *"
                  required
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <span class="mr-2">{{ item.raw.icon }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span class="mr-1">{{ item.raw.icon }}</span>
                    {{ item.raw.name }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12" sm="4">
                <v-text-field v-model="currentAppointment.date" label="Date (JJ/MM/AAAA) *" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="currentAppointment.time" label="Heure (HH:MM)" type="time"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model.number="currentAppointment.duration"
                  :items="[30, 45, 60, 90, 120]"
                  label="Durée estimée (min)"
                  suffix="min"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="currentAppointment.reason" label="Motif du RDV *" rows="3" required></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="currentAppointment.availability" label="Disponibilités du patient" rows="2"></v-textarea>
              </v-col>

              <template v-if="isEditing">
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="currentAppointment.status"
                    :items="['En attente', 'Programmé', 'Terminé', 'Annulé']"
                    label="Statut"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" v-if="currentAppointment.specialty">
                  <v-autocomplete
                    v-model="currentAppointment.doctor"
                    :items="doctorsForSpecialty"
                    label="Médecin en charge"
                    clearable
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-autocomplete
                    v-model="currentAppointment.companion"
                    :items="allDoctors"
                    label="Médecin accompagnant"
                    clearable
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="currentAppointment.notes" label="Notes du médecin / Compte-rendu" rows="4"></v-textarea>
                </v-col>
              </template>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeModal">Annuler</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveAppointment" :loading="isSaving">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRecapOpen" max-width="560px">
      <v-card class="rounded-xl" v-if="recapAppointment">
        <v-card-title class="bg-info text-white pa-4 d-flex align-center">
          <v-icon class="mr-2">mdi-calendar-check</v-icon>
          <span class="text-h6">Récapitulatif du rendez-vous</span>
          <v-spacer></v-spacer>
          <v-chip :color="getStatusColor(recapAppointment.status)" size="small" class="text-uppercase font-weight-bold">
            {{ recapAppointment.status }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="12">
              <div class="text-overline text-grey mb-1">Patient</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-account</v-icon>
                <span class="text-body-1 font-weight-medium">{{ recapAppointment.patientName }}</span>
              </div>
              <div class="d-flex align-center mt-1" v-if="recapAppointment.patientPhone">
                <v-icon class="mr-2" color="grey" size="18">mdi-phone</v-icon>
                <span class="text-body-2 text-grey">{{ recapAppointment.patientPhone }}</span>
              </div>
            </v-col>

            <v-divider class="my-3"></v-divider>

            <v-col cols="12" sm="4">
              <div class="text-overline text-grey mb-1">Date</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary" size="18">mdi-calendar</v-icon>
                <span>{{ formatDate(recapAppointment.date) || '—' }}</span>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="text-overline text-grey mb-1">Heure</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary" size="18">mdi-clock-outline</v-icon>
                <span>{{ recapAppointment.time || '—' }}</span>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="text-overline text-grey mb-1">Durée</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary" size="18">mdi-timer-outline</v-icon>
                <span>{{ recapAppointment.duration }} min</span>
              </div>
            </v-col>

            <v-divider class="my-3"></v-divider>

            <v-col cols="12" sm="6">
              <div class="text-overline text-grey mb-1">Spécialité</div>
              <div class="d-flex align-center">
                <span class="mr-2 text-h6">{{ getSpecialtyIcon(recapAppointment.specialty) }}</span>
                <span>{{ recapAppointment.specialty || '—' }}</span>
              </div>
            </v-col>

            <v-col cols="12" sm="6">
              <div class="text-overline text-grey mb-1">Médecin en charge</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary" size="18">mdi-doctor</v-icon>
                <span>{{ recapAppointment.doctor || '—' }}</span>
              </div>
            </v-col>

            <v-col cols="12" v-if="recapAppointment.companion">
              <div class="text-overline text-grey mb-1">Médecin accompagnant</div>
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="grey" size="18">mdi-account-plus</v-icon>
                <span>{{ recapAppointment.companion }}</span>
              </div>
            </v-col>

            <v-divider class="my-3"></v-divider>

            <v-col cols="12">
              <div class="text-overline text-grey mb-1">Motif</div>
              <v-sheet rounded="lg" color="surface" class="pa-3">
                <span class="text-body-2">{{ recapAppointment.reason || '—' }}</span>
              </v-sheet>
            </v-col>

            <v-col cols="12" v-if="recapAppointment.availability">
              <div class="text-overline text-grey mb-1">Disponibilités</div>
              <v-sheet rounded="lg" color="surface" class="pa-3">
                <span class="text-body-2">{{ recapAppointment.availability }}</span>
              </v-sheet>
            </v-col>

            <v-col cols="12" v-if="recapAppointment.notes">
              <div class="text-overline text-grey mb-1">Notes / Compte-rendu</div>
              <v-sheet rounded="lg" color="surface" class="pa-3">
                <span class="text-body-2">{{ recapAppointment.notes }}</span>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn variant="text" color="primary" prepend-icon="mdi-pencil" @click="isRecapOpen = false; openEditModal(recapAppointment)">Modifier</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="elevated" color="info" @click="isRecapOpen = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
  <div v-else-if="isLoaded" class="pa-4 text-center mt-15">
    <v-icon color="error" size="100" class="mb-4">mdi-lock</v-icon>
    <h1 class="text-h4 text-error mb-4">Accès refusé</h1>
    <p class="text-h6">Vous n'avez pas les spécialités requises pour accéder à cette page.</p>
    <v-btn color="primary" class="mt-8" @click="$router.push('/')">Retour à l'accueil</v-btn>
  </div>
  <div v-else class="pa-4 text-center mt-15 d-flex flex-column align-center">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <div class="mt-4 text-h6 text-grey">Vérification des accès...</div>
  </div>
</template>

<script>
import Appointment from '@/classes/Appointment.js'
import Specialty from '@/classes/Specialty.js'
import Employee from '@/classes/Employee.js'
import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { fetchFormResponses } from '@/functions/googleFormService.js'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'

export default {
  components: {
    FullCalendar
  },
  data() {
    return {
      userStore: useUserStore(),
      appointments: [],
      specialties: [],
      employees: [],
      unsubAppointments: null,
      unsubSpecialties: null,
      unsubEmployee: null,
      specialtiesLoaded: false,
      employeesLoaded: false,
      
      viewMode: 'list',
      calendarOptions: {
        plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ],
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [],
        locales: [frLocale],
        locale: 'fr',
        height: 'auto',
        slotMinTime: '08:00:00',
        slotMaxTime: '24:00:00',
        allDaySlot: false,
        displayEventEnd: true,
        selectable: false,
        editable: false,
        eventClick: this.handleEventClick,
      },

      filterSpecialty: null,
      filterStatus: 'Tous',
      
      sortBy: [{ key: 'date', order: 'desc' }, { key: 'time', order: 'desc' }],
      requestSortBy: [{ key: 'createdAt', order: 'desc' }],

      isModalOpen: false,
      isEditing: false,
      isSaving: false,
      isRecapOpen: false,
      recapAppointment: null,

      formRequests: [],
      isLoadingRequests: false,
      formRequestsError: null,
      
      currentAppointment: {
        id: null,
        patientName: '',
        patientPhone: '',
        specialty: '',
        date: '',
        time: '',
        reason: '',
        status: 'En attente',
        doctor: '',
        companion: '',
        duration: 30,
        notes: '',
        availability: ''
      },
      
      headers: [
        { title: 'Date', key: 'date', sortable: true },
        { title: 'Heure', key: 'time', sortable: true },
        { title: 'Patient', key: 'patientName', sortable: true },
        { title: 'Téléphone', key: 'patientPhone', sortable: false },
        { title: 'Spécialité', key: 'specialty', sortable: true },
        { title: 'Médecin', key: 'doctor', sortable: true },
        { title: 'Accompagnant', key: 'companion', sortable: true },
        { title: 'Statut', key: 'status', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
      ],

      requestHeaders: [
        { title: 'Date demande', key: 'createdAt', sortable: true },
        { title: 'Patient', key: 'patientName', sortable: true },
        { title: 'Téléphone', key: 'patientPhone', sortable: false },
        { title: 'Spécialité', key: 'specialty', sortable: true },
        { title: 'Disponibilités', key: 'availability', sortable: false },
        { title: 'Divers', key: 'notes', sortable: false },
        { title: 'Commentaire', key: 'sheetComment', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' }
      ]
    }
  },
  
  watch: {
    filteredAppointments: {
      handler() {
        this.updateCalendarEvents()
      },
      deep: true
    },
    viewMode(val) {
      if (val === 'demandes' && this.formRequests.length === 0) {
        this.loadFormRequests()
      }
    }
  },
  
  computed: {
    newRequestsCount() {
      if (this.formRequests.length === 0) return 0
      return this.formRequests.filter(r => !this.isAlreadyImported(r)).length
    },
    isLoaded() {
      return this.specialtiesLoaded && this.employeesLoaded
    },
    hasAccess() {
      let userPerms = this.userStore.profile?.permissions
      if(userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) return true

      const profileName = this.userStore.profile?.name?.toLowerCase().trim()
      const currentEmployee = this.employees.find(e => e.name?.toLowerCase().trim() === profileName)
      if (!currentEmployee) return false

      if (['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)) return true

      const allSpecs = [
        ...(currentEmployee.specialties || []),
        ...(currentEmployee.chiefSpecialties || [])
      ]
      return allSpecs.some(s => {
        const spec = this.specialties.find(sp => sp.value === s || sp.name === s)
        return spec && spec.canTakeAppointments
      })
    },
    specialtiesList() {
      return this.specialties.filter(s => s.canTakeAppointments)
    },
    
    doctorsForSpecialty() {
      if (!this.currentAppointment.specialty) return []
      
      const specName = this.currentAppointment.specialty
      const spec = this.specialties.find(s => s.name === specName)
      if (!spec) return []
        
      return this.employees
        .filter(e => e.specialties && e.specialties.includes(spec.value))
        .map(e => e.name)
        .sort((a, b) => a.localeCompare(b))
    },
    
    allDoctors() {
      return this.employees
        .filter(e => e.specialties && e.specialties.length > 0)
        .map(e => e.name)
        .sort((a, b) => a.localeCompare(b))
    },
    
    filteredAppointments() {
      let appointments = this.appointments
      
      const profileName = this.userStore.profile?.name?.toLowerCase().trim()
      const currentEmployee = this.employees.find(e => e.name?.toLowerCase().trim() === profileName)
      let userPerms = this.userStore.profile?.permissions
      
      const isGlobalAdmin = userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))
      const isDirector = currentEmployee && ['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)
      
      if (!isGlobalAdmin && !isDirector && currentEmployee) {
        // Filtre sur specialties + chiefSpecialties
        const allSpecs = [
          ...(currentEmployee.specialties || []),
          ...(currentEmployee.chiefSpecialties || [])
        ]
        if (allSpecs.length > 0) {
          const specNames = this.specialties
            .filter(sp => allSpecs.includes(sp.value) || allSpecs.includes(sp.name))
            .map(sp => sp.name)
          appointments = appointments.filter(app => specNames.includes(app.specialty))
        }
      }

      return appointments.filter(app => {
        let matchSpecialty = true
        let matchStatus = true
        
        if (this.filterSpecialty) matchSpecialty = app.specialty === this.filterSpecialty
        if (this.filterStatus && this.filterStatus !== 'Tous') matchStatus = app.status === this.filterStatus
        
        return matchSpecialty && matchStatus
      })
    }
  },
  
  created() {
    this.unsubAppointments = Appointment.listenAll(data => {
      this.appointments = data
    })
    this.unsubSpecialties = Specialty.listenAll(data => {
      this.specialties = data || []
      this.specialtiesLoaded = true
    })
    this.unsubEmployee = Employee.listenAll(data => {
      this.employees = data || []
      this.employeesLoaded = true
    })
  },
  
  unmounted() {
    if (this.unsubAppointments) this.unsubAppointments()
    if (this.unsubSpecialties) this.unsubSpecialties()
    if (this.unsubEmployee) this.unsubEmployee()
  },
  
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return ''
      const [y, m, d] = dateStr.split('-')
      if (!y || !m || !d) return dateStr
      return `${d}/${m}/${y}`
    },

    getSpecialtyIcon(name) {
      const spec = this.specialties.find(s => s.name === name)
      return spec ? spec.icon : ''
    },

    getHexColor(statusColorName) {
      const colors = {
        'warning': '#FB8C00',
        'info': '#2196F3',
        'success': '#4CAF50',
        'error': '#F44336',
        'grey': '#9E9E9E'
      }
      return colors[statusColorName] || colors['grey']
    },
    
    updateCalendarEvents() {
      this.calendarOptions.events = this.filteredAppointments.map(app => {
          let startStr = `${app.date}T${app.time}`
          if (!app.time) startStr = app.date
          
          let endStr = null
          
          if (app.time) {
            let endDate = new Date(startStr)
            if (!isNaN(endDate.getTime())) {
                endDate.setMinutes(endDate.getMinutes() + (app.duration || 30))
                const y = endDate.getFullYear()
                const m = String(endDate.getMonth() + 1).padStart(2, '0')
                const d = String(endDate.getDate()).padStart(2, '0')
                const hh = String(endDate.getHours()).padStart(2, '0')
                const mm = String(endDate.getMinutes()).padStart(2, '0')
                endStr = `${y}-${m}-${d}T${hh}:${mm}`
            }
          }

          let eventTitle = `${app.patientName} (${app.specialty})`
          if (app.doctor) {
            eventTitle += ` - ${app.doctor}`
          }

          return {
              id: app.id,
              title: eventTitle,
              start: startStr,
              end: endStr,
              backgroundColor: this.getHexColor(this.getStatusColor(app.status)),
              extendedProps: { appointment: app }
          }
      })
    },

    handleEventClick(info) {
      const app = info.event.extendedProps.appointment
      if (app) {
        this.openEditModal(app)
      }
    },

    getStatusColor(status) {
      if (status === 'En attente') return 'warning'
      if (status === 'Programmé') return 'info'
      if (status === 'Terminé') return 'success'
      if (status === 'Annulé') return 'error'
      return 'grey'
    },
    
    openRecapModal(appointment) {
      this.recapAppointment = { ...appointment }
      this.isRecapOpen = true
    },

    openAddModal() {
      this.isEditing = false
      this.currentAppointment = {
        id: null,
        patientName: '',
        patientPhone: '',
        specialty: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: '',
        status: 'En attente',
        doctor: '',
        companion: '',
        duration: 30,
        notes: '',
        availability: ''
      }
      this.isModalOpen = true
    },
    
    openEditModal(appointment) {
      this.isEditing = true
      this.currentAppointment = { ...appointment }
      this.isModalOpen = true
    },
    
    closeModal() {
      this.isModalOpen = false
    },
    
    async saveAppointment() {
      if (!this.currentAppointment.patientName || !this.currentAppointment.specialty || !this.currentAppointment.date || !this.currentAppointment.reason) {
        Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires (*)', 'error')
        return
      }
      
      this.isSaving = true
      try {
        let app = new Appointment(
          this.currentAppointment.id,
          this.currentAppointment.patientName,
          this.currentAppointment.patientPhone,
          this.currentAppointment.specialty,
          this.currentAppointment.date,
          this.currentAppointment.time,
          this.currentAppointment.duration,
          this.currentAppointment.reason,
          this.currentAppointment.status,
          this.currentAppointment.doctor,
          this.currentAppointment.companion,
          this.currentAppointment.notes,
          this.currentAppointment.createdAt || undefined,
          this.currentAppointment.availability
        )
        
        await app.save()
        
        Swal.fire('Succès', 'Le rendez-vous a été enregistré.', 'success')
        this.closeModal()
      } catch (err) {
        console.error(err)
        Swal.fire('Erreur', 'Impossible de sauvegarder le rendez-vous.', 'error')
      } finally {
        this.isSaving = false
      }
    },
    
    confirmDelete(appointment) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Voulez-vous vraiment supprimer ce rendez-vous ?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            let app = new Appointment(appointment.id)
            await app.delete()
            Swal.fire('Supprimé !', 'Le rendez-vous a été supprimé.', 'success')
          } catch (err) {
            console.error(err)
            Swal.fire('Erreur', 'Impossible de supprimer le rendez-vous.', 'error')
          }
        }
      })
    },

    async loadFormRequests() {
      this.isLoadingRequests = true
      this.formRequestsError = null
      try {
        this.formRequests = await fetchFormResponses()
      } catch (err) {
        console.error(err)
        this.formRequestsError = 'Impossible de charger les demandes Google Forms.'
      } finally {
        this.isLoadingRequests = false
      }
    },

    isAlreadyImported(request) {
      return this.appointments.some(app =>
        app.patientName && request.patientName &&
        app.patientName.toLowerCase().trim() === request.patientName.toLowerCase().trim() &&
        app.createdAt === request.createdAt
      )
    },

    importRequest(request) {
      this.isEditing = false
      let matchedSpecialty = ''
      if (request.specialty) {
        const specMatch = this.specialtiesList.find(s => 
          request.specialty.includes(s.name) || request.specialty.includes(s.icon)
        )
        if (specMatch) matchedSpecialty = specMatch.name
      }

      this.currentAppointment = {
        id: null,
        patientName: request.patientName,
        patientPhone: request.patientPhone,
        specialty: matchedSpecialty,
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: request.reason || request.notes || '',
        status: 'En attente',
        doctor: '',
        companion: '',
        duration: 30,
        notes: request.notes || '',
        availability: request.availability,
        createdAt: request.createdAt
      }
      this.isModalOpen = true
    },

    formatTimestamp(ts) {
      if (!ts) return '—'
      try {
        const d = new Date(ts)
        if (isNaN(d.getTime())) return ts
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      } catch { return ts }
    },

    truncate(text, max) {
      if (!text) return '—'
      return text.length > max ? text.substring(0, max) + '...' : text
    }
  }
}
</script>

<style scoped>
:deep(.fc) {
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #2E2E2E;
  --fc-neutral-text-color: #FFF;
  --fc-border-color: rgba(255, 255, 255, 0.12);
  --fc-button-text-color: #FFF;
  --fc-button-bg-color: #2C3E50;
  --fc-button-border-color: #2C3E50;
  --fc-button-hover-bg-color: #34495E;
  --fc-button-hover-border-color: #34495E;
  --fc-button-active-bg-color: #1976D2;
  --fc-button-active-border-color: #1976D2;
  --fc-event-bg-color: #1976D2;
  --fc-event-border-color: #1976D2;
  --fc-today-bg-color: rgba(255, 255, 255, 0.05);

  color: #FFF;
}

:deep(.fc .fc-button .fc-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

:deep(.fc-event-title), :deep(.fc-event-time) {
  color: white !important;
  font-weight: 500;
}

:deep(.fc-event) {
  cursor: pointer;
}

:deep(.fc-timegrid-body) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}

:deep(.fc-scroller.fc-scroller-liquid-absolute) {
  overflow-y: hidden !important;
}
</style>

<style>
.swal2-styled:focus {
  box-shadow: none !important;
  outline: none !important;
}
.v-btn:focus-visible {
  outline: none !important;
}
.v-btn::after {
  display: none !important;
}
</style>
