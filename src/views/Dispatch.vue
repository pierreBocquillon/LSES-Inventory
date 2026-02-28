<template>
  <div class="dispatch-root">

        <div class="dispatch-top-headers">
      <div class="th-cell th-left">
        <v-icon size="13" class="mr-1">mdi-headset</v-icon>Status Centrale
        <span class="ml-1">🎧</span>
        &nbsp;|&nbsp;
        <span style="opacity:.7">Interventions</span>
      </div>
      <div class="th-cell th-center d-flex align-center justify-space-between w-100 px-3">
        <div class="d-flex align-center" style="gap: 15px;">
           <div class="d-flex align-center">
             <v-icon size="13" color="cyan" class="mr-1">mdi-radio-handheld</v-icon>
             <span class="mr-1 text-grey-lighten-1">LSES:</span>
             <input v-if="isDirection && dispatch" v-model="dispatch.lsesRadio" @change="dispatch.save()" class="freq-input" placeholder="---" />
             <span v-else class="freq-display text-cyan font-weight-bold">{{ dispatch?.lsesRadio || '---' }}</span>
           </div>
           <div class="d-flex align-center">
             <v-icon size="13" color="orange" class="mr-1">mdi-radio-tower</v-icon>
             <span class="mr-1 text-grey-lighten-1">Commune:</span>
             <input v-if="isDirection && dispatch" v-model="dispatch.communeRadio" @change="dispatch.save()" class="freq-input" placeholder="---" />
             <span v-else class="freq-display text-orange font-weight-bold">{{ dispatch?.communeRadio || '---' }}</span>
           </div>
        </div>

        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <span v-bind="props" class="hosp-btn" :class="`hosp-${dispatch?.hospitalStatus||'gestion_normale'}`">
              <v-icon size="13" class="mr-1">mdi-hospital-building</v-icon>
              Status hôpital : <strong>{{ hospitalStatusMeta.label }}</strong>
              <v-icon size="13" class="ml-1">mdi-chevron-down</v-icon>
            </span>
          </template>
          <v-list density="compact" style="min-width:240px">
            <v-list-subheader>Statut de l'hôpital</v-list-subheader>
            <v-list-item v-for="s in hospitalStatuses" :key="s.value"
              :active="dispatch?.hospitalStatus===s.value"
              @click="setHospitalStatus(s.value)">
              <template v-slot:prepend><v-icon :color="s.color" size="15">{{ s.icon }}</v-icon></template>
              <v-list-item-title :style="`color:${s.color}`" class="font-weight-bold">{{ s.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <div class="th-cell th-right">😴 Hors service</div>
    </div>

        <div class="dispatch-body">

            <div class="left-panel">

                <div class="slot-section-title">🎧 Centrale</div>
                <div class="inter-type-row">
          <v-menu location="bottom start" :close-on-content-click="true">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="inter-type-badge"
                :style="dispatch?.centrale?.type ? `background:${getInterType(dispatch.centrale.type)?.color}22;border-color:${getInterType(dispatch.centrale.type)?.color};color:${getInterType(dispatch.centrale.type)?.color}` : ''">
                {{ dispatch?.centrale?.type ? (getInterType(dispatch.centrale.type)?.emoji + ' ' + getInterType(dispatch.centrale.type)?.label) : '+ Type' }}
                <v-icon size="10" class="ml-1">mdi-chevron-down</v-icon>
              </span>
            </template>
            <v-list density="compact" style="min-width:170px">
              <v-list-item v-for="it in interventionTypes" :key="it.value"
                :active="dispatch?.centrale?.type===it.value"
                @click="setCentraleType(it.value)">
                <template v-slot:prepend><span class="mr-1">{{ it.emoji }}</span></template>
                <v-list-item-title :style="`color:${it.color}`">{{ it.label }}</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item v-if="dispatch?.centrale?.type" @click="setCentraleType(null)">
                <template v-slot:prepend><v-icon size="13" color="grey">mdi-close</v-icon></template>
                <v-list-item-title class="text-grey">Effacer</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn icon variant="plain" size="x-small" color="error" class="ml-auto"
            @click="clearCentrale" title="Vider la centrale">
            <v-icon size="11">mdi-delete-sweep</v-icon>
          </v-btn>
        </div>
                <div class="inter-location-row">
          <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
          <input
            class="location-input"
            :value="dispatch?.centrale?.location || ''"
            placeholder="Position / Code ZIP"
            @change="setCentraleLocation($event.target.value)"
            @keyup.enter="$event.target.blur()"
          />
        </div>
                <div
          class="drop-slot drop-slot--inter"
          :class="{ 'drop-slot--over': dragOver==='centrale', 'drop-slot--filled': !!(dispatch?.centrale?.employees||[]).length }"
          @dragover.prevent="dragOver='centrale'"
          @dragleave="onDragLeave('centrale')"
          @drop.prevent="dropOn('centrale')"
        >
          <div v-for="emp in (dispatch?.centrale?.employees||[])" :key="emp.employeeId" class="person-card"
            :class="{ dragging: draggingSource?.employeeId===emp.employeeId }"
            :style="`border-left:3px solid ${getRoleColor(emp.role)};background:${getRoleColor(emp.role)}15`"
            draggable="true"
            @dragstart="startDrag(emp, 'centrale')"
            @dragend="onDragEnd"
          >
            <div class="pc-grip">⠿</div>
            <div class="pc-info">
              <div class="pc-name">{{ emp.name }}</div>
              <div class="pc-phone">{{ emp.phone }}</div>
              <div class="pc-specs">
                <v-tooltip v-for="sv in (emp.allSpecialties||[])" :key="sv" :text="getSpecialtyName(sv)" location="top">
                  <template v-slot:activator="{ props }"><span v-bind="props" class="spec-emoji">{{ getSpecialtyIcon(sv) }}</span></template>
                </v-tooltip>
              </div>
              <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`">{{ emp.role }}</div>
                            <template v-if="(dispatch?.centrale?.employees||[]).indexOf(emp) > 0">
                <v-menu location="top start" :close-on-content-click="true">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="return-badge"
                      :style="emp.centralRole ? `background:${getCentralRole(emp.centralRole)?.color}22;border-color:${getCentralRole(emp.centralRole)?.color};color:${getCentralRole(emp.centralRole)?.color}` : ''"
                      @click.stop>
                      {{ emp.centralRole ? (getCentralRole(emp.centralRole)?.emoji + ' ' + getCentralRole(emp.centralRole)?.label) : '＋ Rôle' }}
                    </span>
                  </template>
                  <v-list density="compact" style="min-width:185px">
                    <v-list-subheader>Rôle à la centrale</v-list-subheader>
                    <v-list-item v-for="cr in centralRoles" :key="cr.value"
                      :active="emp.centralRole===cr.value"
                      @click="setCentraleEmpRole(emp, cr.value)">
                      <template v-slot:prepend><span class="mr-1">{{ cr.emoji }}</span></template>
                      <v-list-item-title :style="`color:${cr.color}`">{{ cr.label }}</v-list-item-title>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item v-if="emp.centralRole" @click="setCentraleEmpRole(emp, null)">
                      <template v-slot:prepend><v-icon size="13" color="grey">mdi-close</v-icon></template>
                      <v-list-item-title class="text-grey">Effacer</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </div>
          </div>
          <div class="drop-empty">
            <v-icon size="12" color="#90a4ae">mdi-arrow-down</v-icon> Déposer ici
          </div>
        </div>

                <div class="slot-section-title mt-2">
          🚑 Interventions
          <v-btn size="x-small" variant="plain" color="white" class="ml-auto" @click="addInterventionSlot">
            <v-icon size="13">mdi-plus</v-icon>
          </v-btn>
        </div>

        <div class="interventions-list">
          <div v-for="slot in (dispatch?.interventions||[])" :key="slot.id" class="inter-slot">
                        <div class="inter-type-row">
                            <v-menu location="bottom start" :close-on-content-click="true">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="inter-type-badge"
                    :style="slot.type ? `background:${getInterType(slot.type)?.color}22;border-color:${getInterType(slot.type)?.color};color:${getInterType(slot.type)?.color}` : ''">
                    {{ slot.type ? (getInterType(slot.type)?.emoji + ' ' + getInterType(slot.type)?.label) : '+ Type' }}
                    <v-icon size="10" class="ml-1">mdi-chevron-down</v-icon>
                  </span>
                </template>
                <v-list density="compact" style="min-width:170px">
                  <v-list-item v-for="it in interventionTypes" :key="it.value"
                    :active="slot.type===it.value"
                    @click="setInterSlotType(slot, it.value)">
                    <template v-slot:prepend><span class="mr-1">{{ it.emoji }}</span></template>
                    <v-list-item-title :style="`color:${it.color}`">{{ it.label }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
                            <v-menu location="bottom start" :close-on-content-click="true">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="return-badge"
                    :style="slot.returnStatus ? `background:${getReturnStatus(slot.returnStatus)?.color}22;border-color:${getReturnStatus(slot.returnStatus)?.color};color:${getReturnStatus(slot.returnStatus)?.color}` : ''"
                    @click.stop>
                    {{ slot.returnStatus ? (getReturnStatus(slot.returnStatus)?.emoji + ' ' + getReturnStatus(slot.returnStatus)?.label) : '＋ Statut' }}
                  </span>
                </template>
                <v-list density="compact" style="min-width:170px">
                  <v-list-subheader>Statut de l'intervention</v-list-subheader>
                  <v-list-item v-for="rs in returnStatuses" :key="rs.value"
                    :active="slot.returnStatus===rs.value"
                    @click="setInterSlotStatus(slot, rs.value)">
                    <template v-slot:prepend><span class="mr-1">{{ rs.emoji }}</span></template>
                    <v-list-item-title :style="`color:${rs.color}`">{{ rs.label }}</v-list-item-title>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item v-if="slot.returnStatus" @click="setInterSlotStatus(slot, null)">
                    <template v-slot:prepend><v-icon size="13" color="grey">mdi-close</v-icon></template>
                    <v-list-item-title class="text-grey">Effacer</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
                            <v-btn icon variant="plain" size="x-small" color="error" class="ml-auto"
                @click="removeInterventionSlot(slot.id)" title="Supprimer ce slot">
                <v-icon size="11">mdi-close</v-icon>
              </v-btn>
            </div>
                        <div class="inter-location-row">
              <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
              <input
                class="location-input"
                :value="slot.location || ''"
                placeholder="Code ZIP / Position"
                @change="setInterSlotLocation(slot, $event.target.value)"
                @keyup.enter="$event.target.blur()"
              />
            </div>
                        <div
              class="drop-slot drop-slot--inter"
              :class="{ 'drop-slot--over': dragOver===`inter:${slot.id}`, 'drop-slot--filled': !!(slot.employees||[]).length }"
              @dragover.prevent="dragOver=`inter:${slot.id}`"
              @dragleave="onDragLeave(`inter:${slot.id}`)"
              @drop.prevent="dropOn(`inter:${slot.id}`)"
            >
                            <div
                v-for="emp in (slot.employees||[])"
                :key="emp.employeeId"
                class="person-card"
                :class="{ dragging: draggingSource?.employeeId===emp.employeeId }"
                :style="`border-left:3px solid ${getRoleColor(emp.role)};background:${getRoleColor(emp.role)}15`"
                draggable="true"
                @dragstart="startDrag(emp, `inter:${slot.id}`)"
                @dragend="onDragEnd"
              >
                <div class="pc-grip">⠿</div>
                <div class="pc-info">
                  <div class="pc-name">{{ emp.name }}</div>
                  <div class="pc-phone">{{ emp.phone }}</div>
                  <div class="pc-specs">
                    <v-tooltip v-for="sv in (emp.allSpecialties||[])" :key="sv" :text="getSpecialtyName(sv)" location="top">
                      <template v-slot:activator="{ props }"><span v-bind="props" class="spec-emoji">{{ getSpecialtyIcon(sv) }}</span></template>
                    </v-tooltip>
                  </div>
                  <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`">{{ emp.role }}</div>
                </div>
              </div>
                            <div class="drop-empty">
                <v-icon size="12" color="#90a4ae">mdi-arrow-down</v-icon> Déposer ici
              </div>
            </div>
          </div>

          <div v-if="!dispatch?.interventions?.length" class="text-caption text-grey pa-2">
            Appuyez sur + pour ajouter un slot
          </div>
        </div>
      </div>

            <div
        class="center-panel"
        :class="{ 'drop-over': dragOver==='cat:en_service' }"
        @dragover.prevent="dragOver='cat:en_service'"
        @dragleave="onDragLeave('cat:en_service')"
        @drop.prevent="dropOn('cat:en_service')"
      >
        <div class="section-title">
          🥔 La Patate
          <span class="cnt">{{ patatesForCategory('en_service').length }}</span>
        </div>
        <div class="cards-grid">
          <div
            v-for="p in patatesForCategory('en_service')"
            :key="p.id"
            class="person-card"
            :class="{ dragging: draggingSource?.id===p.id }"
            :style="`border-left:3px solid ${getRoleColor(p.role)};background:${getRoleColor(p.role)}15`"
            draggable="true"
            @dragstart="startDrag(p, `cat:en_service`)"
            @dragend="onDragEnd"
          >
            <div class="pc-grip">⠿</div>
              <div class="pc-info">
              <div class="pc-name">{{ p.name }}</div>
              <div class="pc-phone">{{ p.phone }}</div>
              <div class="pc-specs">
                <v-tooltip v-for="sv in (p.allSpecialties||[])" :key="sv" :text="getSpecialtyName(sv)" location="top">
                  <template v-slot:activator="{ props }"><span v-bind="props" class="spec-emoji">{{ getSpecialtyIcon(sv) }}</span></template>
                </v-tooltip>
              </div>
              <div class="pc-role" :style="`color:${getRoleColor(p.role)}`">{{ p.role }}</div>
            </div>
          </div>
          <div v-if="draggingSource && !patatesForCategory('en_service').find(p=>p.employeeId===draggingSource.employeeId)" class="drop-hint-card">
            Déposer ici
          </div>
        </div>
      </div>

            <div
        class="right-panel"
        :class="{ 'drop-over': dragOver==='hs' }"
        @dragover.prevent="dragOver='hs'"
        @dragleave="onDragLeave('hs')"
        @drop.prevent="dropOn('hs')"
      >
        <div class="hs-grid">
          <div
            v-for="emp in sortedUnassignedEmployees"
            :key="emp.id"
            class="person-card person-card--hs"
            :style="`border-left: 3px solid ${getRoleColor(emp.role)}; background: ${getRoleColor(emp.role)}15`"
            draggable="true"
            @dragstart="startDrag({ employeeId: emp.id, name: emp.name, phone: emp.phone, allSpecialties: emp.allSpecialties, role: emp.role }, 'hs')"
            @dragend="onDragEnd"
            @click="quickAddFromHorsService(emp)"
          >
            <div class="pc-info">
              <div class="pc-name">{{ emp.name }}</div>
              <div class="pc-phone">{{ emp.phone }}</div>
              <div class="pc-specs">
                <v-tooltip v-for="sv in (emp.allSpecialties||[])" :key="sv" :text="getSpecialtyName(sv)" location="top">
                  <template v-slot:activator="{ props }"><span v-bind="props" class="spec-emoji">{{ getSpecialtyIcon(sv) }}</span></template>
                </v-tooltip>
              </div>
              <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`">{{ emp.role }}</div>
            </div>
          </div>
        </div>
        <div v-if="!sortedUnassignedEmployees.length" class="text-center text-grey text-caption pa-3">Tous assignés</div>

                <div class="notepad-wrapper mt-auto pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-notebook</v-icon> Bloc-notes
          </div>
          <textarea
            v-if="isDirection && dispatch"
            v-model="dispatch.notepad"
            @change="dispatch.save()"
            class="notepad-input"
            placeholder="Bloc notes (modifiable par la direction)"
            rows="6"
          ></textarea>
          <div v-else class="notepad-display">
            {{ dispatch?.notepad || 'Aucune note.' }}
          </div>
        </div>
      </div>

    </div>
        <div class="dispatch-bottom">
      <div
        v-for="cat in bottomCategories"
        :key="cat.value"
        class="bottom-panel"
        :class="{ 'drop-over': dragOver===`cat:${cat.value}` }"
        @dragover.prevent="dragOver=`cat:${cat.value}`"
        @dragleave="onDragLeave(`cat:${cat.value}`)"
        @drop.prevent="dropOn(`cat:${cat.value}`)"
      >
        <div class="bottom-header" :style="`background:${cat.color}`">
          {{ cat.emoji }} {{ cat.label }}
          <span class="cnt ml-1">{{ patatesForCategory(cat.value).length }}</span>
        </div>
        <div class="bottom-cards">
          <div
            v-for="p in patatesForCategory(cat.value)"
            :key="p.id"
            class="person-card person-card--sm"
            :class="{ dragging: draggingSource?.employeeId===p.employeeId }"
            :style="`border-left:3px solid ${getRoleColor(p.role)};background:${getRoleColor(p.role)}15`"
            draggable="true"
            @dragstart="startDrag(p, `cat:${cat.value}`)"
            @dragend="onDragEnd"
          >
              <div class="pc-info">
              <div class="pc-name">{{ p.name }}</div>
              <div class="pc-phone">{{ p.phone }}</div>
              <div class="pc-specs">
                <v-tooltip v-for="sv in (p.allSpecialties||[])" :key="sv" :text="getSpecialtyName(sv)" location="top">
                  <template v-slot:activator="{ props }"><span v-bind="props" class="spec-emoji">{{ getSpecialtyIcon(sv) }}</span></template>
                </v-tooltip>
              </div>
              <div class="pc-role" :style="`color:${getRoleColor(p.role)}`">{{ p.role }}</div>
            </div>
          </div>
          <div v-if="draggingSource && !patatesForCategory(cat.value).find(p=>p.employeeId===draggingSource.employeeId)" class="drop-hint-sm">↓</div>
        </div>
      </div>
    </div>

        <v-dialog v-model="quickAddDialog" max-width="360">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4">Ajouter {{ quickAddEmployee?.name }}</v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-2 mb-3">Choisir un statut :</p>
          <div class="d-flex flex-wrap" style="gap:8px">
            <v-btn v-for="cat in allCategories" :key="cat.value"
              :color="cat.color" variant="tonal" size="small"
              @click="confirmQuickAdd(cat.value)">
              {{ cat.emoji }} {{ cat.label }}
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="quickAddDialog=false">Annuler</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

        <v-dialog v-model="addDialog" max-width="460">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 d-flex align-center"
          :style="`background:${addDialogCategory?.color}22;color:${addDialogCategory?.color}`">
          <v-icon :color="addDialogCategory?.color" class="mr-2">{{ addDialogCategory?.icon }}</v-icon>
          Ajouter — {{ addDialogCategory?.label }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-autocomplete v-model="selectedEmployee" :items="availableEmployees"
            item-title="displayLabel" item-value="id" label="Choisir un employé"
            variant="outlined" autofocus clearable return-object no-data-text="Aucun employé disponible">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.phone||'Pas de tél.'">
                <template v-slot:prepend><v-icon class="mr-1">mdi-account</v-icon></template>
                <template v-slot:append><span style="font-size:1rem;letter-spacing:2px">{{ getEmployeeEmojis(item.raw.id) }}</span></template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog=false">Annuler</v-btn>
          <v-btn color="primary" variant="tonal" @click="confirmAddPatate" :disabled="!selectedEmployee">Ajouter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import Dispatch from '@/classes/Dispatch.js'
import Employee from '@/classes/Employee.js'
import Specialty from '@/classes/Specialty.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import {
  allCategories,
  interventionTypes,
  returnStatuses,
  centralRoles,
  hospitalStatuses
} from '@/config/dispatch.js'
import { roleOrder, getRoleColor as getRoleColorConfig } from '@/config/roles.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      dispatch: null,
      employees: [],
      specialties: [],
      unsub: null,
      unsubEmployees: null,
      unsubSpecialties: null,

      draggingEmployee: null,
      draggingSource: null,   
      dragOver: null,         

      addDialog: false,
      addDialogCategoryValue: null,
      selectedEmployee: null,
      quickAddDialog: false,
      quickAddEmployee: null,

      allCategories,
      interventionTypes,
      returnStatuses,
      centralRoles,
      hospitalStatuses,
    }
  },

  computed: {
    isDirection() {
      const profileName = this.userStore.profile?.name?.toLowerCase().trim()
      const currentEmployee = this.employees.find(e => e.name?.toLowerCase().trim() === profileName)

      if (!currentEmployee) return false
      return ['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)
    },

    bottomCategories() { return this.allCategories.filter(c => c.value !== 'en_service') },

    hospitalStatusMeta() {
      if (!this.dispatch) return this.hospitalStatuses[0]
      return this.hospitalStatuses.find(s => s.value === this.dispatch.hospitalStatus) || this.hospitalStatuses[0]
    },

        allEmployees() {
      return this.employees.map(e => ({
        id: e.id, name: e.name, phone: e.phone || '', role: e.role || '',
        allSpecialties: [...(e.specialties||[])],
        displayLabel: e.phone ? `${e.name} — ${e.phone}` : e.name,
      }))
    },

        usedEmployeeIds() {
      if (!this.dispatch) return new Set()
      const ids = []
      
      ;(this.dispatch.interventions||[]).forEach(s => { (s.employees||[]).forEach(e => ids.push(e.employeeId)) })
      this.dispatch.patates.forEach(p => { if (p.employeeId) ids.push(p.employeeId) })
      return new Set(ids)
    },

        sortedUnassignedEmployees() {
      const order = roleOrder
      return this.allEmployees
        .filter(e => !this.usedEmployeeIds.has(e.id))
        .sort((a, b) => {
          const ia = order.indexOf(a.role), ib = order.indexOf(b.role)
          const ra = ia === -1 ? 99 : ia, rb = ib === -1 ? 99 : ib
          if (ra !== rb) return ra - rb
          return (a.name||'').localeCompare(b.name||'')
        })
    },
    addDialogCategory()   { return this.allCategories.find(c => c.value === this.addDialogCategoryValue) || null },
  },

  mounted() {
    this.unsub = Dispatch.listenGlobal(data => { this.dispatch = data })
    this.unsubEmployees = Employee.listenAll(list => {
      this.employees = [...list].sort((a,b) => (a.name||'').localeCompare(b.name||''))
    })
    this.unsubSpecialties = Specialty.listenAll(list => { this.specialties = list })
  },

  beforeUnmount() {
    if (this.unsub) this.unsub()
    if (this.unsubEmployees) this.unsubEmployees()
    if (this.unsubSpecialties) this.unsubSpecialties()
  },

  methods: {
    
    getSpecialtyIcon(v) { return this.specialties.find(s=>s.value===v||s.name===v)?.icon||'' },
    getSpecialtyName(v) { return this.specialties.find(s=>s.value===v||s.name===v)?.name||v },
    getInterType(v)     { return this.interventionTypes.find(it=>it.value===v)||null },
    getReturnStatus(v)  { return this.returnStatuses.find(rs=>rs.value===v)||null },
    getRoleColor(role) {
      return getRoleColorConfig(role)
    },
    getEmployeeEmojis(empId) {
      const e = this.employees.find(e=>e.id===empId)
      return e ? [...(e.specialties||[]),...(e.chiefSpecialties||[])].map(v=>this.getSpecialtyIcon(v)).filter(Boolean).join(' ') : ''
    },

    patatesForCategory(cat) { return this.dispatch?.patates.filter(p=>p.category===cat)||[] },

    async setHospitalStatus(value) {
      if (!this.dispatch) return
      this.dispatch.hospitalStatus = value
      await this.dispatch.save()
    },

        startDrag(employee, sourceKey) {
      this.draggingEmployee = employee
      this.draggingSource = sourceKey
    },
    onDragEnd() { this.draggingEmployee = null; this.draggingSource = null; this.dragOver = null },
    onDragLeave(key) { if (this.dragOver === key) this.dragOver = null },

    async dropOn(targetKey) {
      this.dragOver = null
      const emp = this.draggingEmployee
      const src = this.draggingSource
      if (!emp || !this.dispatch) return
      if (src === targetKey) return   

      this._removeFromSource(src, emp.employeeId)

      if (targetKey === 'centrale') {
        if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, type: null, employees: [] }
        if (!this.dispatch.centrale.employees) this.dispatch.centrale.employees = []
        if (!this.dispatch.centrale.employees.find(e => e.employeeId === emp.employeeId)) {
          this.dispatch.centrale.employees.push({ employeeId: emp.employeeId, name: emp.name, phone: emp.phone, allSpecialties: emp.allSpecialties||[], role: emp.role||'', centralRole: null })
        }
      } else if (targetKey.startsWith('inter:')) {
        const slotId = targetKey.slice(6)
        const slot = this.dispatch.interventions.find(s=>s.id===slotId)
        if (slot) {
          if (!slot.employees) slot.employees = []
          
          if (!slot.employees.find(e => e.employeeId === emp.employeeId)) {
            slot.employees.push({ employeeId: emp.employeeId, name: emp.name, phone: emp.phone, allSpecialties: emp.allSpecialties||[], role: emp.role || '' })
          }
        }
      } else if (targetKey.startsWith('cat:')) {
        const category = targetKey.slice(4)
        this.dispatch.patates.push({
          id: Date.now().toString()+Math.random().toString(36).slice(2,6),
          employeeId: emp.employeeId,
          name: emp.name,
          phone: emp.phone,
          role: emp.role || '',
          allSpecialties: emp.allSpecialties||[],
          category,
        })
      }

      this.dispatch.patates = [...this.dispatch.patates]
      await this.dispatch.save()
    },

        _removeFromSource(sourceKey, employeeId) {
      if (!this.dispatch) return
      if (sourceKey === 'centrale') {
        this.dispatch.centrale.employees = (this.dispatch.centrale?.employees||[]).filter(e => e.employeeId !== employeeId)
      } else if (sourceKey?.startsWith('inter:')) {
        const slotId = sourceKey.slice(6)
        const slot = this.dispatch.interventions.find(s=>s.id===slotId)
        if (slot) slot.employees = (slot.employees||[]).filter(e => e.employeeId !== employeeId)
      } else if (sourceKey?.startsWith('cat:')) {
        this.dispatch.patates = this.dispatch.patates.filter(p=>p.employeeId!==employeeId)
      }
      
    },

        async removeFromDispatch(employeeId) {
      if (!this.dispatch) return
      
      if (this.dispatch.centrale?.employees) {
        this.dispatch.centrale.employees = this.dispatch.centrale.employees.filter(e => e.employeeId !== employeeId)
      }
      
      ;(this.dispatch.interventions||[]).forEach(s => {
        s.employees = (s.employees||[]).filter(e => e.employeeId !== employeeId)
      })
      
      this.dispatch.patates = this.dispatch.patates.filter(p=>p.employeeId!==employeeId)
      await this.dispatch.save()
    },

    async clearCentrale() {
      const r = await Swal.fire({ icon:'question', title:'Vider la centrale ?',
        showCancelButton:true, confirmButtonText:'Vider', cancelButtonText:'Annuler' })
      if (!r.isConfirmed) return
      this.dispatch.centrale = { location: null, type: null, employees: [] }
      await this.dispatch.save()
    },

    async removeEmpFromCentrale(employeeId) {
      if (!this.dispatch?.centrale) return
      this.dispatch.centrale.employees = (this.dispatch.centrale.employees||[]).filter(e => e.employeeId !== employeeId)
      await this.dispatch.save()
    },

    async setCentraleType(typeValue) {
      if (!this.dispatch) return
      if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, type: null, employees: [] }
      this.dispatch.centrale.type = typeValue
      await this.dispatch.save()
    },

    async setCentraleLocation(loc) {
      if (!this.dispatch) return
      if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, type: null, employees: [] }
      this.dispatch.centrale.location = loc
      await this.dispatch.save()
    },

    async setCentraleEmpRole(emp, roleValue) {
      if (!this.dispatch?.centrale?.employees) return
      const found = this.dispatch.centrale.employees.find(e => e.employeeId === emp.employeeId)
      if (found) {
        found.centralRole = roleValue
        await this.dispatch.save()
      }
    },

    getCentralRole(v) { return this.centralRoles.find(cr => cr.value === v) || null },

    async addInterventionSlot() {
      if (!this.dispatch) return
      this.dispatch.interventions = [...(this.dispatch.interventions||[]), {
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        type: 'intervention',
        employees: [],
        returnStatus: null,
      }]
      await this.dispatch.save()
    },

    async setInterSlotType(slot, typeValue) {
      slot.type = typeValue
      this.dispatch.interventions = [...this.dispatch.interventions]
      await this.dispatch.save()
    },

    async setInterSlotLocation(slot, value) {
      slot.location = value.trim() || null
      this.dispatch.interventions = [...this.dispatch.interventions]
      await this.dispatch.save()
    },

    async setInterSlotStatus(slot, statusValue) {
      slot.returnStatus = statusValue || null
      this.dispatch.interventions = [...this.dispatch.interventions]
      await this.dispatch.save()
    },

    async removeEmployeeFromSlot(slotId, employeeId) {
      const slot = this.dispatch.interventions.find(s=>s.id===slotId)
      if (slot) slot.employees = (slot.employees||[]).filter(e => e.employeeId !== employeeId)
      this.dispatch.interventions = [...this.dispatch.interventions]
      await this.dispatch.save()
    },

    async removeInterventionSlot(slotId) {
      this.dispatch.interventions = this.dispatch.interventions.filter(s=>s.id!==slotId)
      await this.dispatch.save()
    },

    openAddDialog(categoryValue) {
      this.addDialogCategoryValue = categoryValue
      this.selectedEmployee = null
      this.addDialog = true
    },
    async confirmAddPatate() {
      if (!this.selectedEmployee || !this.dispatch) return
      const emp = this.employees.find(e=>e.id===this.selectedEmployee.id)
      this.dispatch.patates = [...this.dispatch.patates, {
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        employeeId: this.selectedEmployee.id,
        name: this.selectedEmployee.name,
        phone: this.selectedEmployee.phone || '',
        role: emp?.role || '',
        allSpecialties: emp ? [...(emp.specialties||[])] : [],
        category: this.addDialogCategoryValue,
      }]
      await this.dispatch.save()
      this.addDialog = false
    },

    quickAddFromHorsService(emp) { this.quickAddEmployee = emp; this.quickAddDialog = true },
    async confirmQuickAdd(categoryValue) {
      if (!this.quickAddEmployee || !this.dispatch) return
      const emp = this.employees.find(e=>e.id===this.quickAddEmployee.id)
      this.dispatch.patates = [...this.dispatch.patates, {
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        employeeId: this.quickAddEmployee.id,
        name: this.quickAddEmployee.name,
        phone: this.quickAddEmployee.phone || '',
        role: emp?.role || '',
        allSpecialties: emp ? [...(emp.specialties||[])] : [],
        category: categoryValue,
      }]
      await this.dispatch.save()
      this.quickAddDialog = false
    },
  },
}
</script>

<style scoped>
.dispatch-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
  font-size: 0.8rem;
  background: #0f172a;
}

.dispatch-top-headers {
  display: grid;
  grid-template-columns: 230px 1fr 370px;
  background: linear-gradient(90deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
  color: #e2e8f0;
  font-size: 0.73rem;
  font-weight: 700;
  flex-shrink: 0;
  border-bottom: 2px solid #334155;
}
.th-cell { display: flex; align-items: center; padding: 5px 10px; border-right: 1px solid #334155; }
.th-right { border-right: none; }

.hosp-btn {
  cursor: pointer; padding: 2px 6px; border-radius: 4px;
  transition: background .15s; font-size: 0.73rem;
  display: flex; align-items: center;
}
.hosp-btn:hover { background: rgba(255,255,255,.12); }
.hosp-gestion_normale { color: #a5d6a7; }
.hosp-hopital_ferme   { color: #ef9a9a; }
.hosp-coups_de_feu    { color: #ffcc80; }

.freq-input {
  background: rgba(0,0,0,0.2);
  border: 1px solid #334155;
  border-radius: 3px;
  color: #e2e8f0;
  width: 60px;
  padding: 0 4px;
  font-size: 0.73rem;
  text-align: center;
}
.freq-input:focus {
  outline: none;
  border-color: #3b82f6;
}
.freq-display {
  display: inline-block;
  min-width: 40px;
  text-align: center;
}

.dispatch-body {
  display: grid;
  grid-template-columns: 230px 1fr 370px;
  flex: 1;
  overflow: hidden;
  border-bottom: 2px solid #334155;
}

.left-panel {
  background: #1e293b;
  border-right: 2px solid #334155;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 6px;
  gap: 4px;
}

.slot-section-title {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 3px rgba(0,0,0,.4);
}

.drop-slot {
  border: 2px dashed #334155;
  border-radius: 6px;
  min-height: 44px;
  background: rgba(255,255,255,.04);
  transition: border-color .15s, background .15s;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  align-items: flex-start;
}
.drop-slot--inter { min-height: 38px; }
.drop-slot--over  { border-color: #3b82f6; background: rgba(59,130,246,.12); }
.drop-slot--filled { border-style: solid; border-color: #475569; }

.drop-empty {
  color: #475569;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  width: 100%;
  cursor: default;
  font-style: italic;
}

.interventions-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
}
.inter-slot { display: flex; flex-direction: column; gap: 2px; }
.inter-type-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.inter-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-size: 0.63rem;
  font-weight: 700;
  cursor: pointer;
  color: #94a3b8;
  background: rgba(255,255,255,.06);
  transition: opacity .15s;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
}
.inter-type-badge:hover { opacity: .8; }

.center-panel {
  background: #162032;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background .15s;
}
.center-panel.drop-over { background: #1a2f4a; }

.section-title {
  background: linear-gradient(90deg, #14532d 0%, #166534 100%);
  color: #d1fae5;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}
.cnt {
  background: rgba(255,255,255,.25);
  border-radius: 10px;
  padding: 0 5px;
  font-size: 0.65rem;
  font-weight: 700;
  margin-left: 5px;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 8px;
  overflow-y: auto;
  align-content: flex-start;
  flex: 1;
}

.drop-hint-card {
  border: 2px dashed #90a4ae;
  color: #90a4ae;
  border-radius: 7px;
  font-size: 0.68rem;
  padding: 6px 10px;
  display: flex;
  align-items: center;
}

.right-panel {
  background: #1a1f35;
  border-left: 2px solid #334155;
  overflow-y: auto;
  transition: background .15s;
  display: flex;
  flex-direction: column;
}

.notepad-input {
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  padding: 8px;
  font-size: 0.75rem;
  resize: none;
  min-height: 80px;
}
.notepad-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255,255,255,0.08);
}
.notepad-display {
  width: 100%;
  background: rgba(0,0,0,0.2);
  border: 1px dashed #334155;
  border-radius: 4px;
  color: #cbd5e1;
  padding: 8px;
  font-size: 0.75rem;
  min-height: 80px;
  white-space: pre-wrap;
  word-break: break-word;
}
.right-panel.drop-over { background: #1e2a48; }
.hs-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 7px;
}

.person-card {
  background: rgba(255,255,255,.94);
  border: 1.5px solid rgba(255,255,255,.2);
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  align-items: flex-start;
  gap: 3px;
  cursor: grab;
  user-select: none;
  min-width: 90px;
  width: max-content;
  max-width: 100%;
  transition: box-shadow .15s, opacity .15s, transform .1s;
  position: relative;
  box-shadow: 0 1px 4px rgba(0,0,0,.35);
}
.person-card:hover     { box-shadow: 0 4px 12px rgba(0,0,0,.45); transform: translateY(-1px); }
.person-card.dragging  { opacity: .3; }
.person-card--hs       { background: rgba(255,255,255,.9); cursor: pointer; }
.person-card--sm       { min-width: 82px; }

.pc-grip { color: #bdbdbd; font-size: 11px; flex-shrink: 0; margin-top: 2px; }
.pc-info { flex: 1; min-width: 0; }
.pc-name { font-size: 0.7rem; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-phone { font-size: 0.62rem; color: #cbd5e1; }
.pc-specs { font-size: 0.82rem; line-height: 1.1; margin-top: 1px; }
.pc-role  { font-size: 0.58rem; font-weight: 700; margin-top: 1px; letter-spacing: 0.02em; }
.spec-emoji { cursor: default; }

.dispatch-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  flex-shrink: 0;
  min-height: 180px;
  max-height: 300px;
  border-top: 2px solid #334155;
  background: #0f172a;
}
.bottom-panel {
  border-right: 2px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background .15s;
}
.bottom-panel:last-child { border-right: none; }
.bottom-panel.drop-over  { filter: brightness(1.1); }

.bottom-header {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.bottom-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px;
  overflow-y: auto;
  align-content: flex-start;
  flex: 1;
}
.drop-hint-sm { color: #b0bec5; display: flex; align-items: center; padding: 3px; }

.inter-location-row {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  background: rgba(255,255,255,.06);
  border: 1px solid #334155;
  border-radius: 4px;
  margin-bottom: 2px;
}
.location-input {
  border: none;
  outline: none;
  font-size: 0.63rem;
  color: #cbd5e1;
  width: 100%;
  background: transparent;
  min-width: 0;
}
.location-input::placeholder { color: #475569; }

.return-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 3px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #b0bec5;
  font-size: 0.6rem;
  font-weight: 700;
  cursor: pointer;
  color: #90a4ae;
  background: #f5f5f5;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity .15s;
}
.return-badge:hover { opacity: .8; }
</style>

