<template>
  <div class="pa-4">
    <div class="d-flex justify-space-between align-center mb-4 gap-2">
      <h1 class="text-h4 text-primary">Emploi du temps</h1>
      <div class="d-flex gap-3 align-center">
        <v-badge v-if="isManagement && pendingRequests.length > 0" :content="pendingRequests.length" color="red" overlap>
          <v-btn 
            color="warning" 
            variant="tonal" 
            @click="isPendingModalOpen = true" 
            prepend-icon="mdi-bell-outline"
            class="text-none font-weight-bold"
            rounded="lg"
          >
            Demandes
          </v-btn>
        </v-badge>
        
        <v-btn v-else-if="isManagement" color="grey-lighten-2" variant="tonal" disabled prepend-icon="mdi-bell-off-outline" class="text-none" rounded="lg">
          Aucune demande
        </v-btn>

        <v-btn color="primary" @click="openAddModal('absence')" prepend-icon="mdi-calendar-plus" class="text-none font-weight-bold ml-6" rounded="lg" elevation="2">
          Signaler une absence / congé
        </v-btn>

        <v-btn v-if="isDirection" color="deep-purple-darken-1" @click="openAddModal('event')" prepend-icon="mdi-star" class="text-none font-weight-bold ml-2" rounded="lg" elevation="2">
          Créer un évènement
        </v-btn>
      </div>
    </div>

    <v-card class="rounded-xl pa-4" theme="dark">
      <FullCalendar :options="calendarOptions" />
    </v-card>

    <v-dialog v-model="isModalOpen" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4 d-flex align-center">
          <span class="text-h5" v-if="currentAbsence.type === 'event'">Évènement</span>
          <span class="text-h5" v-else>{{ currentAbsence.id ? 'Détails' : 'Signaler une absence / congé' }}</span>
          <v-spacer></v-spacer>
          <v-chip v-if="currentAbsence.userId && currentAbsence.userId !== userStore.profile.id" color="white" variant="outlined" size="small">
             {{ getEmployeeName(currentAbsence.userId) }}
          </v-chip>
        </v-card-title>
        
        <v-card-text class="pa-4 mt-2">
          <v-container>
            <v-row>
              <v-col cols="12" v-if="currentAbsence.type !== 'event'">
                  <v-label class="mb-2 d-block">Type de signalement</v-label>
                  <v-btn-toggle v-model="currentAbsence.type" color="primary" mandatory density="compact" class="mb-2">
                    <v-btn value="absence">Absence</v-btn>
                    <v-btn value="leave">Congé</v-btn>
                  </v-btn-toggle>
              </v-col>
              <v-col cols="12" v-else>
                 <div class="text-h6 text-primary mb-2">Nouvel Évènement</div>
              </v-col>
            </v-row>

            <v-row v-if="currentAbsence.type === 'event'">
              <v-col cols="12">
                  <v-select
                    v-model="currentAbsence.recurrence"
                    :items="[
                      { title: 'Une seule fois', value: 'none' },
                      { title: 'Chaque semaine', value: 'weekly' },
                      { title: 'Chaque mois', value: 'monthly' }
                    ]"
                    label="Récurrence"
                    variant="outlined"
                    density="compact"
                  ></v-select>
              </v-col>
              <v-col cols="12" :sm="currentAbsence.isFullDay ? 12 : 6">
                <v-text-field v-model="currentAbsence.startDate" label="Date de début" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" v-if="!currentAbsence.isFullDay">
                <v-text-field v-model="currentAbsence.startTime" label="Heure de début" type="time" variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" :sm="currentAbsence.isFullDay ? 12 : 6">
                <v-text-field v-model="currentAbsence.endDate" label="Date de fin" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" v-if="!currentAbsence.isFullDay">
                <v-text-field v-model="currentAbsence.endTime" label="Heure de fin" type="time" variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12">
                  <v-checkbox v-model="currentAbsence.isFullDay" label="Journée complète" hide-details density="compact"></v-checkbox>
              </v-col>
            </v-row>

            <v-row v-else-if="currentAbsence.type === 'absence'">
              <v-col cols="12">
                <v-checkbox v-model="currentAbsence.isFullDay" label="Journée(s) complète(s)" hide-details></v-checkbox>
              </v-col>

              <v-col cols="12" :sm="currentAbsence.isFullDay ? 12 : 6">
                <v-text-field v-model="currentAbsence.startDate" label="Date de début *" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" v-if="!currentAbsence.isFullDay">
                <v-text-field v-model="currentAbsence.startTime" label="Heure de début *" type="time" required></v-text-field>
              </v-col>

              <v-col cols="12" :sm="currentAbsence.isFullDay ? 12 : 6">
                <v-text-field v-model="currentAbsence.endDate" label="Date de fin *" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" v-if="!currentAbsence.isFullDay">
                <v-text-field v-model="currentAbsence.endTime" label="Heure de fin *" type="time" required></v-text-field>
              </v-col>
            </v-row>

            <v-row v-else-if="currentAbsence.type === 'leave'">
              <v-col cols="12">
                <v-select
                  v-model="currentAbsence.slot"
                  :items="[
                    { title: 'Journée complète', value: 'full' },
                    { title: 'Matin (06h-12h)', value: 'morning' },
                    { title: 'Après-midi (12h-19h)', value: 'afternoon' },
                    { title: 'Soir (19h-00h)', value: 'evening' }
                  ]"
                  label="Créneau *"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="currentAbsence.startDate" label="Date du congé *" type="date" required></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" v-if="isManagement && currentAbsence.id && currentAbsence.type !== 'event'">
                <v-select
                  v-model="currentAbsence.status"
                  :items="[
                    { title: 'En attente', value: 'pending' },
                    { title: 'Approuvé', value: 'approved' },
                    { title: 'Refusé', value: 'refused' }
                  ]"
                  label="Statut de la demande (Management) *"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea 
                  v-model="currentAbsence.reason" 
                  :label="currentAbsence.type === 'event' ? 'Titre de l\'évènement *' : 'Motif'" 
                  rows="2" 
                  hide-details
                  :required="currentAbsence.type === 'event'"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn v-if="currentAbsence.id" color="error" variant="text" @click="deleteOwnAbsence" prepend-icon="mdi-delete">Supprimer</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeModal">Annuler</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveAbsence" :loading="isSaving">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isPendingModalOpen" max-width="800px">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-warning text-white pa-4">
          <span class="text-h5">Demandes de congés en attente</span>
        </v-card-title>
        
        <v-card-text class="pa-0">
          <v-list v-if="pendingRequests.length > 0" lines="three" class="py-0 bg-transparent" theme="dark">
             <v-list-item v-for="req in pendingRequests" :key="req.id" class="px-4 py-3 border-b border-white-12">

                
                <v-list-item-title class="text-h6 font-weight-medium mb-1">
                   {{ getEmployeeName(req.userId) }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-body-2 opacity-80">
                   <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                   {{ req.startDate.split('T')[0] }} • <span class="text-primary font-weight-bold">{{ getSlotLabel(req.slot) }}</span>
                   <div v-if="req.reason" class="mt-1 italic text-grey-lighten-1">
                      <v-icon size="x-small" class="mr-1">mdi-comment-text-outline</v-icon>{{ req.reason }}
                   </div>
                </v-list-item-subtitle>
                
                <template v-slot:append>
                   <div class="d-flex flex-column gap-4 ml-6">
                      <v-btn color="success" size="small" variant="tonal" @click="quickManage(req, 'approved')" prepend-icon="mdi-check" class="text-none font-weight-bold px-4">
                        Accepter
                      </v-btn>
                      <v-btn color="error" size="small" variant="tonal" @click="quickManage(req, 'refused')" prepend-icon="mdi-close" class="text-none font-weight-bold px-4">
                        Refuser
                      </v-btn>
                   </div>
                </template>
             </v-list-item>
          </v-list>
          <div v-else class="pa-10 text-center text-grey">
             <v-icon size="64" color="grey-lighten-2">mdi-calendar-check</v-icon>
             <div class="mt-4 text-h6">Aucune demande en attente</div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isPendingModalOpen = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'

import Absence from '@/classes/Absence.js'
import Employee from '@/classes/Employee.js'
import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { SCHEDULE_COLORS } from '@/config/schedule.js'

export default {
  components: {
    FullCalendar
  },
  data() {
    return {
      userStore: useUserStore(),
      absences: [],
      employees: [],
      unsubAbsences: null,
      unsubEmployee: null,

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
        height: 'calc(100vh - 180px)',
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        slotEventOverlap: false,
        eventOrder: "start,-duration,allDay,title",
        eventClick: this.handleEventClick,
        eventDidMount: (info) => {
          info.el.title = info.event.title;
        },
        nowIndicator: true,
        dayMaxEvents: true,
        allDayText: 'Journée',
        stickyHeaderDates: true,
      },

      isModalOpen: false,
      isPendingModalOpen: false,
      isSaving: false,

      currentAbsence: {
        id: null,
        type: 'absence',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        isFullDay: true,
        slot: 'full',
        recurrence: 'none',
      },
      userPerms: [],
      isManagement: false,
    }
  },
  mounted() {
    this.userPerms = this.userStore.profile?.permissions || []
    this.isManagement = this.userPerms.some(p => ['dev', 'admin', 'rh'].includes(p))
  },
  watch: {
    absences: {
      handler() {
        this.updateCalendarEvents()
      },
      deep: true
    },
    employees: {
      handler() {
        this.updateCalendarEvents()
      },
      deep: true
    }
  },
  computed: {
    pendingRequests() {
      return this.absences.filter(a => a.type === 'leave' && a.status === 'pending')
    },
    isDirection() {
      const currentUserId = this.userStore.profile?.id
      const emp = this.employees.find(e => e.userId === currentUserId)
      return emp && ['Directeur', 'Directeur Adjoint'].includes(emp.role)
    }
  },
  created() {
    this.unsubAbsences = Absence.listenAll(data => {
      this.absences = data
    })
    this.unsubEmployee = Employee.listenAll(data => {
      this.employees = data || []
    })
  },
  unmounted() {
    if (this.unsubAbsences) this.unsubAbsences()
    if (this.unsubEmployee) this.unsubEmployee()
  },
  methods: {
    getDefaultDate() {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    getEmployeeName(userId) {
      const emp = this.employees.find(e => e.userId === userId)
      return emp ? emp.name : 'Employé inconnu'
    },
    updateCalendarEvents() {
      const eventList = []
      
      this.absences.forEach(abs => {
        let startStr = abs.startDate
        let endStr = abs.endDate
        let endDisplayStr = endStr
        
        let color = SCHEDULE_COLORS.ABSENCE
        let opacity = abs.status === 'pending' ? 0.7 : 1
        let eventTitle = `${this.getEmployeeName(abs.userId)} ABS`

        if (abs.type === 'leave') {
          if (abs.status === 'pending') color = SCHEDULE_COLORS.LEAVE_PENDING
          else if (abs.status === 'refused') color = SCHEDULE_COLORS.LEAVE_REFUSED
          else color = SCHEDULE_COLORS.LEAVE_APPROVED
          
          const slotLabel = {
            'morning': 'MATIN',
            'afternoon': 'APREM',
            'evening': 'SOIR',
            'full': 'JOUR'
          }[abs.slot] || ''
          eventTitle = `${this.getEmployeeName(abs.userId)} (${slotLabel})`
        } else if (abs.type === 'event') {
          color = SCHEDULE_COLORS.EVENT
          opacity = 1
          eventTitle = `📅 ${abs.reason || 'Évènement'}`
        }

        if (abs.recurrence === 'none' || !abs.recurrence) {
           if (!abs.isFullDay) {
              if (abs.startDate.includes('T')) startStr = abs.startDate
              if (abs.endDate && abs.endDate.includes('T')) endDisplayStr = abs.endDate
           } else if (endStr && endStr.length === 10) {
              const d = new Date(endStr)
              d.setDate(d.getDate() + 1)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              endDisplayStr = `${y}-${m}-${day}`
           }
           
           eventList.push({
              id: abs.id,
              title: eventTitle,
              start: startStr,
              end: endDisplayStr,
              allDay: abs.isFullDay,
              backgroundColor: color,
              opacity: opacity,
              extendedProps: { absence: abs }
           })
        } 
        else if (abs.recurrence === 'weekly') {
           const baseStart = new Date(abs.startDate)
           const baseEnd = abs.endDate ? new Date(abs.endDate) : baseStart
           const diffInMs = baseEnd - baseStart
           
           for (let i = 0; i < 52; i++) {
              const dStart = new Date(baseStart)
              dStart.setDate(baseStart.getDate() + (i * 7))
              const dEnd = new Date(dStart.getTime() + diffInMs)
              
              const yS = dStart.getFullYear()
              const mS = String(dStart.getMonth() + 1).padStart(2, '0')
              const dayS = String(dStart.getDate()).padStart(2, '0')
              let occStart = `${yS}-${mS}-${dayS}`
              
              const yE = dEnd.getFullYear()
              const mE = String(dEnd.getMonth() + 1).padStart(2, '0')
              const dayE = String(dEnd.getDate()).padStart(2, '0')
              let occEnd = `${yE}-${mE}-${dayE}`

              if (!abs.isFullDay) {
                  occStart += `T${abs.startTime || '00:00'}:00`
                  occEnd += `T${abs.endTime || abs.startTime || '23:59'}:00`
              }
              else {
                  const de = new Date(occEnd)
                  de.setDate(de.getDate() + 1)
                  occEnd = `${de.getFullYear()}-${String(de.getMonth()+1).padStart(2, '0')}-${String(de.getDate()).padStart(2, '0')}`
              }

              eventList.push({
                id: `${abs.id}_w_${i}`,
                title: eventTitle,
                start: occStart,
                end: occEnd,
                allDay: abs.isFullDay,
                backgroundColor: color,
                opacity: opacity,
                extendedProps: { absence: abs }
              })
           }
        }
        else if (abs.recurrence === 'monthly') {
            const baseDate = new Date(abs.startDate)
            const baseEnd = abs.endDate ? new Date(abs.endDate) : baseDate
            const diffInDays = Math.floor((baseEnd - baseDate) / (1000 * 60 * 60 * 24))

            for (let i = 0; i < 12; i++) {
               const d = new Date(baseDate)
               d.setMonth(baseDate.getMonth() + i)
               
               const y = d.getFullYear()
               const m = String(d.getMonth() + 1).padStart(2, '0')
               const day = String(d.getDate()).padStart(2, '0')
               let occStart = `${y}-${m}-${day}`
               
               let occEnd = occStart
               if (diffInDays > 0) {
                 const de = new Date(d)
                 de.setDate(de.getDate() + diffInDays)
                 occEnd = `${de.getFullYear()}-${String(de.getMonth()+1).padStart(2, '0')}-${String(de.getDate()).padStart(2, '0')}`
               }

               if (!abs.isFullDay) {
                   occStart += `T${abs.startTime || '00:00'}:00`
                   occEnd += `T${abs.endTime || abs.startTime || '23:59'}:00`
               }
               else {
                   const de = new Date(occEnd)
                   de.setDate(de.getDate() + 1)
                   occEnd = `${de.getFullYear()}-${String(de.getMonth()+1).padStart(2, '0')}-${String(de.getDate()).padStart(2, '0')}`
               }

               eventList.push({
                 id: `${abs.id}_${i}`,
                 title: eventTitle,
                 start: occStart,
                 end: occEnd,
                 allDay: abs.isFullDay,
                 backgroundColor: color,
                 opacity: opacity,
                 extendedProps: { absence: abs }
               })
            }
        }
      })
      
      this.calendarOptions.events = eventList
    },

    handleEventClick(info) {
      const abs = info.event.extendedProps.absence
      if (abs) {
         let sDate = abs.startDate
         let sTime = ''
         if (sDate.includes('T')) {
            const parts = sDate.split('T')
            sDate = parts[0]
            sTime = parts[1].substring(0, 5)
         }
         
         let eDate = abs.endDate
         let eTime = ''
         if (eDate && eDate.includes('T')) {
            const parts = eDate.split('T')
            eDate = parts[0]
            eTime = parts[1].substring(0, 5)
         }

        this.currentAbsence = {
          id: abs.id,
          type: abs.type || 'absence',
          startDate: sDate,
          startTime: sTime,
          endDate: eDate || sDate,
          endTime: eTime,
          isFullDay: abs.isFullDay,
          reason: abs.reason,
          userId: abs.userId,
          status: abs.status,
          slot: abs.slot || 'full',
          recurrence: abs.recurrence || 'none'
        }
        
        const currentUserId = this.userStore.profile?.id
        const isEventOwner = abs.userId === currentUserId && abs.type !== 'event'
        
        if (!this.isManagement && !isEventOwner) {
             let prefix = 'a signalé un(e)'
             if (abs.type === 'event') prefix = 'a organisé un'
             
             let detailsText = `${this.getEmployeeName(abs.userId)} ${prefix} ${abs.type === 'leave' ? 'congé' : (abs.type === 'event' ? 'évènement' : 'absence')}.`
             if (abs.type === 'leave') {
                detailsText += ` Date: ${sDate}, Créneau: ${this.getSlotLabel(abs.slot)}.`
             } else {
                detailsText += ` Du ${sDate} au ${eDate || sDate}.`
                if (!abs.isFullDay) detailsText += ` De ${sTime} à ${eTime}.`
             }
             
             if (abs.recurrence && abs.recurrence !== 'none') {
                detailsText += ` (Répétition: ${abs.recurrence === 'weekly' ? 'Hébdomadaire' : 'Mensuelle'})`
             }
             
             detailsText += ` Motif : ${abs.reason || 'Non précisé'}`

             Swal.fire({
                icon: 'info',
                title: abs.type === 'event' ? 'Détails Évènement' : 'Détails',
                text: detailsText,
                confirmButtonText: 'Fermer',
                target: '#app'
             })
             return
        }

        if (abs.type === 'event' && !this.isDirection) {
             Swal.fire({
               icon: 'info',
               title: 'Évènement',
               text: `${abs.reason}\n${abs.recurrence !== 'none' ? '(Récurrent)' : ''}`,
               confirmButtonText: 'Fermer',
               target: '#app'
             })
             return
        }

        this.isModalOpen = true
      }
    },
    openAddModal(type = 'absence') {
      this.currentAbsence = {
        id: null,
        type: type,
        startDate: this.getDefaultDate(),
        startTime: '',
        endDate: this.getDefaultDate(),
        endTime: '',
        isFullDay: true,
        reason: '',
        slot: 'full',
        recurrence: 'none',
      }
      this.isModalOpen = true
    },
    closeModal() {
      this.isModalOpen = false
    },
    async deleteOwnAbsence() {
         const confirmDel = await Swal.fire({
             title: 'Êtes-vous sûr ?',
             text: 'Voulez-vous vraiment supprimer cette absence/congé ?',
             icon: 'warning',
             showCancelButton: true,
             confirmButtonText: 'Oui, supprimer',
             cancelButtonText: 'Annuler',
             confirmButtonColor: '#d33',
             target: '#app'
         })
         if (confirmDel.isConfirmed) {
             const abs = new Absence(this.currentAbsence.id)
             await abs.delete()
             this.closeModal()
             Swal.fire({
                 icon: 'success',
                 title: 'Supprimée',
                 text: 'Votre absence/congé a été supprimée.',
                 timer: 1500,
                 showConfirmButton: false,
                 target: '#app'
             })
         }
    },
    getSlotLabel(slot) {
      const labels = {
        'morning': 'Matin (06h-12h)',
        'afternoon': 'Après-midi (12h-19h)',
        'evening': 'Soir (19h-00h)',
        'full': 'Toute la journée'
      }
      return labels[slot] || slot
    },
    async quickManage(req, status) {
       try {
          req.status = status
          await req.save()
          Swal.fire({
            icon: 'success',
            title: status === 'approved' ? 'Approuvé' : 'Refusé',
            timer: 1000,
            showConfirmButton: false,
            target: '#app'
          })
       } catch (error) {
          console.error(error)
       }
    },
    async saveAbsence() {
      if (!this.currentAbsence.startDate && this.currentAbsence.type !== 'event') {
        Swal.fire({ icon: 'error', title: 'Oups', text: 'La date de début est obligatoire.', target: '#app' })
        return
      }

      this.isSaving = true
      try {
        const currentUserId = this.userStore.profile?.id
        let finalStart = this.currentAbsence.startDate
        let finalEnd = this.currentAbsence.endDate || finalStart
        let isFullDay = this.currentAbsence.isFullDay

        if (this.currentAbsence.type === 'event') {
          if (!isFullDay) {
            finalStart = `${this.currentAbsence.startDate}T${this.currentAbsence.startTime || '00:00'}`
            if (!finalStart.includes(':00', 11)) finalStart += ':00'

            if (this.currentAbsence.endTime) {
              finalEnd = `${this.currentAbsence.endDate || this.currentAbsence.startDate}T${this.currentAbsence.endTime}`
              if (!finalEnd.includes(':00', 11)) finalEnd += ':00'
            } else if (this.currentAbsence.endDate && this.currentAbsence.endDate !== this.currentAbsence.startDate) {
              finalEnd = `${this.currentAbsence.endDate}T23:59:59`
            } else {
              finalEnd = finalStart
            }
          } else {
            finalStart = this.currentAbsence.startDate
            finalEnd = this.currentAbsence.endDate || finalStart
          }
        } else if (this.currentAbsence.type === 'leave') {
          isFullDay = this.currentAbsence.slot === 'full'
          if (!isFullDay) {
            const times = {
              morning: { start: '06:00', end: '12:00' },
              afternoon: { start: '12:00', end: '19:00' },
              evening: { start: '19:00', end: '23:59' }
            }
            const { start, end } = times[this.currentAbsence.slot]
            finalStart = `${this.currentAbsence.startDate}T${start}:00`
            finalEnd = `${this.currentAbsence.startDate}T${end}:00`
          }
        } else {
          if (!this.currentAbsence.isFullDay) {
             if (this.currentAbsence.startTime) {
               finalStart += `T${this.currentAbsence.startTime}`
               if (!this.currentAbsence.startTime.includes(':00', 5)) finalStart += ':00'
             }
             if (this.currentAbsence.endTime) {
               finalEnd += `T${this.currentAbsence.endTime}`
               if (!this.currentAbsence.endTime.includes(':00', 5)) finalEnd += ':00'
             }
             else finalEnd = finalStart
          }
        }

        if (this.currentAbsence.type !== 'event') {
          const overlapping = this.absences.filter(a => {
            if (a.id === this.currentAbsence.id) return false
            if (a.userId === currentUserId) return false
            if (a.status === 'refused') return false

            const aStartDay = a.startDate.split('T')[0]
            if (aStartDay !== this.currentAbsence.startDate) return false

            if (this.currentAbsence.type === 'leave') {
              if (this.currentAbsence.slot === 'full') return true
              return a.slot === 'full' || a.slot === this.currentAbsence.slot
            }
            return true
          })

          if (overlapping.length >= 4) {
            const confirm = await Swal.fire({
              title: 'Attention',
              text: `Il y a déjà ${overlapping.length} personnes absentes sur ce créneau. Continuer ?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Oui',
              cancelButtonText: 'Annuler',
              target: '#app'
            })
            if (!confirm.isConfirmed) {
              this.isSaving = false
              return
            }
          }
        }

        const abs = new Absence(
          this.currentAbsence.id,
          this.userStore.profile.id,
          finalStart,
          finalEnd,
          isFullDay,
          this.currentAbsence.reason,
          this.currentAbsence.id ? this.currentAbsence.status : (this.currentAbsence.type === 'event' || this.currentAbsence.type === 'absence' ? 'approved' : 'pending'),
          this.currentAbsence.type,
          this.currentAbsence.slot,
          this.currentAbsence.recurrence
        )

        await abs.save()
        Swal.fire({
          icon: 'success',
          title: 'Enregistré',
          text: 'Opération réussie.',
          timer: 1500,
          showConfirmButton: false,
          target: '#app'
        })
        this.closeModal()
      } catch (error) {
        console.error(error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible d\'enregistrer.',
          target: '#app'
        })
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
:deep(.fc) {
  font-family: inherit;
  color: rgba(255, 255, 255, 0.87);
}
:deep(.fc-theme-standard td), :deep(.fc-theme-standard th) {
  border-color: rgba(255, 255, 255, 0.12);
}
:deep(.fc-header-toolbar) {
  margin-bottom: 1.5em !important;
  text-transform: capitalize;
}
:deep(.fc-toolbar-title) {
  font-size: 1.5rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.0125em !important;
}
:deep(.fc-button-primary) {
  background-color: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.87) !important;
  text-transform: none !important;
  font-weight: 500 !important;
  transition: all 0.2s;
  border-radius: 6px !important;
  padding: 0 16px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 36px !important;
  vertical-align: middle !important;
}
:deep(.fc-button-primary.fc-prev-button), 
:deep(.fc-button-primary.fc-next-button) {
  padding: 0 8px !important;
}
:deep(.fc-button .fc-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1.3rem !important;
}
:deep(.fc-button-group) {
  display: inline-flex !important;
  align-items: center !important;
  vertical-align: middle !important;
}
:deep(.fc-button-primary:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
}
:deep(.fc-button-active) {
  background-color: rgba(var(--v-theme-primary), 0.15) !important;
  color: rgb(var(--v-theme-primary)) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}
:deep(.fc-daygrid-day-number) {
  padding: 8px !important;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.87);
  text-decoration: none !important;
}
:deep(.fc-day-today) {
  background-color: transparent !important;
}
:deep(.fc-day-today .fc-daygrid-day-number) {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  margin: 4px;
}
:deep(.fc-event) {
  border: none !important;
  border-radius: 4px !important;
  padding: 2px 4px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  margin: 1px 2px !important;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: transform 0.1s, box-shadow 0.1s;
}
:deep(.fc-event:hover) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 5 !important;
}
:deep(.fc-event-main) {
  white-space: normal !important;
  word-break: break-word;
  line-height: 1.2;
}
:deep(.fc-timegrid-event) {
  min-height: 20px;
}
:deep(.fc-v-event) {
  background-color: var(--fc-event-bg-color);
  border: 1px solid rgba(255,255,255,0.1) !important;
}
:deep(.fc-daygrid-event-dot) {
  display: none;
}
:deep(.fc-timegrid-event .fc-event-main) {
  padding: 2px 4px;
}
:deep(.fc-col-header-cell-cushion) {
  display: inline-block;
  padding: 8px 0 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none !important;
}
:deep(.fc-theme-standard .fc-scrollgrid) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}
:deep(.fc-scrollgrid-section-header > th) {
  background-color: rgb(var(--v-theme-surface));
  z-index: 4 !important;
}
:deep(.fc-scrollgrid-section-all-day) {
  position: sticky;
  top: 0;
  z-index: 3 !important;
  background-color: rgb(var(--v-theme-surface));
}
:deep(.fc-scrollgrid-section-all-day > td) {
  background-color: rgb(var(--v-theme-surface));
}
:deep(.fc-timegrid-axis-cushion) {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 4px;
}
:deep(.fc-timegrid-divider) {
  display: none !important;
}
</style>
