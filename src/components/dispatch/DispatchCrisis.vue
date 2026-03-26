<template>
  <div class="crises-bottom-section" style="border-top: 2px solid #334155; background: #0f172a; padding: 6px; width: 100%; box-sizing: border-box; flex-shrink: 0;">
    <div class="slot-section-title" style="background: #b91c1c; cursor: pointer; height: 32px; padding: 0 10px; font-size: 0.85rem;" @click="crisisExpanded = !crisisExpanded">
      🚨 Dispatch de crises
      <span class="cnt ml-2">
        {{ treatedInjured }} / {{ totalInjured }}
      </span>
      <div v-if="dispatch" class="ml-4 d-flex align-center" @click.stop style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 8px; box-shadow: 0 0 5px rgba(0,0,0,0.5);">
          <v-icon size="12" class="mr-1 text-white">mdi-map-marker</v-icon>
          <input 
              v-model="localCrisisZip" 
              @change="onZipChange"
              @focus="$event.target.select()"
              class="location-input crisis-zip-input" 
              style="width: 70px; font-weight: 900; background: transparent; border: none; outline: none; color: #fff; text-align: center; text-transform: uppercase;" 
              placeholder="ZIP" 
          />
      </div>
      <div v-if="averageTreatmentTime > 0" class="ml-2 d-flex align-center" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; font-weight: bold; color: #fff;" title="Temps moyen entre l'arrivée à l'hôpital et la fin des soins">
        <v-icon size="12" class="mr-1">mdi-timer-outline</v-icon>
        Soin moyen : <span class="ml-1 text-amber-lighten-2">{{ formatDuration(averageTreatmentTime) }}</span>
      </div>
      <div v-if="anyPatientArrived" class="ml-2 d-flex align-center" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; font-weight: bold; color: #fff;" title="Durée totale de la prise en charge des patients">
        <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
        Durée totale : <span class="ml-1 text-cyan-lighten-2">{{ formatDuration(totalCrisisDuration) }}</span>
      </div>
      <v-icon size="14" class="ml-auto">{{ crisisExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      <v-btn size="x-small" variant="plain" color="white" class="ml-1" @click.stop="addCrisisSlot">
        <v-icon size="13">mdi-plus</v-icon>
      </v-btn>
      <v-btn size="x-small" variant="plain" color="white" class="ml-1" @click.stop="confirmClearCrises" title="Réinitialiser le dispatch de crise">
        <v-icon size="13">mdi-refresh</v-icon>
      </v-btn>

      <v-menu v-model="showFilterMenu" :close-on-content-click="false" location="bottom end" offset="5">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" size="x-small" variant="tonal" :color="isFiltered ? 'amber' : 'white'" class="ml-4" @click.stop style="height: 24px; text-transform: none; font-size: 0.7rem;">
            <v-badge v-if="isFiltered" color="amber" dot floating offset-x="-4" offset-y="2">
              <div class="d-flex align-center">
                <v-icon size="12" class="mr-1">mdi-filter-variant</v-icon>
                Filtres
              </div>
            </v-badge>
            <div v-else class="d-flex align-center">
              <v-icon size="12" class="mr-1">mdi-filter-variant</v-icon>
              Filtres
            </div>
          </v-btn>
        </template>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; min-width: 200px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);">
          <div class="mb-3">
            <label style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Groupe / Affiliation</label>
            <select v-model="filterAffiliation" class="location-input" style="width: 100%; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; color: #fff; height: 32px; outline: none;">
              <option :value="null" style="background:#1a1f35">Tous les groupes</option>
              <option v-for="aff in affiliations" :key="aff.id" :value="aff.id" style="background:#1a1f35">{{ aff.label }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Qui rapatrie</label>
            <select v-model="filterRepatriatedBy" class="location-input" style="width: 100%; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; color: #fff; height: 32px; outline: none;">
              <option :value="null" style="background:#1a1f35">Tous</option>
              <option value="none" style="background:#1a1f35">-- Aucun --</option>
              <option v-for="emp in getCrisisEmployeeOptions()" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Qui soigne</label>
            <select v-model="filterTreatedBy" class="location-input" style="width: 100%; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; color: #fff; height: 32px; outline: none;">
              <option :value="null" style="background:#1a1f35">Tous</option>
              <option value="none" style="background:#1a1f35">-- Personne --</option>
              <option v-for="emp in getCrisisEmployeeOptions(null, 'treatment')" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Canal check centrale</label>
            <select v-model="filterCanalCheck" class="location-input" style="width: 100%; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; color: #fff; height: 32px; outline: none;">
              <option value="all" style="background:#1a1f35">Tous</option>
              <option value="checked" style="background:#1a1f35">Coché</option>
              <option value="unchecked" style="background:#1a1f35">Non coché</option>
            </select>
          </div>

          <div class="mb-3 d-flex align-center">
            <label class="d-flex align-center cursor-pointer" style="font-size: 0.8rem; color: #e2e8f0; user-select: none;">
              <input type="checkbox" v-model="hideCompleted" class="mr-2" style="width: 14px; height: 14px;" />
              Masquer les patients terminés
            </label>
          </div>
          <v-divider class="mb-2" color="white" style="opacity: 0.1"></v-divider>
          <div class="d-flex justify-space-between align-center">
            <v-btn variant="text" size="x-small" color="grey-lighten-1" @click="resetFilters" style="text-transform: none;">Réinitialiser</v-btn>
            <v-btn variant="tonal" size="x-small" color="blue" @click="showFilterMenu = false" style="text-transform: none;">Fermer</v-btn>
          </div>
        </div>
      </v-menu>

      <v-btn v-if="isDirection" icon variant="text" size="x-small" class="ml-1" @click.stop="showAffiliationManager = true" style="color: #94a3b8;" title="Gérer les affiliations">
        <v-icon size="14">mdi-cog</v-icon>
      </v-btn>
    </div>

    <v-dialog v-model="showAffiliationManager" max-width="500">
      <v-card class="rounded-xl" style="background: #1e293b; color: #fff;">
        <v-card-title class="pa-4 d-flex align-center bg-amber-darken-3 text-white">
          <v-icon class="mr-2">mdi-cog</v-icon>
          Gestion des affiliations
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <div style="max-height: 600px; overflow-y: auto; padding-right: 8px;" class="custom-scrollbar">
            <div v-for="aff in affiliations" :key="aff.id" class="d-flex align-center mb-2 pa-2 rounded" style="background: rgba(0,0,0,0.2); border: 1px solid #334155;">
              <div :style="`width: 12px; height: 12px; border-radius: 50%; background: ${aff.color}; margin-right: 12px;`" title="Couleur"></div>
              <div class="flex-grow-1 font-weight-bold">{{ aff.label }}</div>
              <v-btn icon variant="plain" size="x-small" color="blue" @click="promptEditAffiliation(aff)" class="mr-1">
                <v-icon size="14">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon variant="plain" size="x-small" color="error" @click="confirmDeleteAffiliation(aff)">
                <v-icon size="14">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          <v-btn block color="amber-darken-2" variant="tonal" class="mt-4" @click="promptAddAffiliation">
            <v-icon class="mr-2">mdi-plus</v-icon> Ajouter une affiliation
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAffiliationManager = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="crisisExpanded" class="crises-list" style="margin-top: 10px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 0.75rem;">
            <th style="padding: 8px; font-weight: 500; text-align: center; width: 40px;">Coma</th>
            <th style="padding: 8px; font-weight: 500; text-align: center; width: 60px;">Lourd / Inconscient</th>
            <th style="padding: 8px; font-weight: 500;">
              <div class="d-flex align-center">
                <div style="width: 20px; flex-shrink: 0;" class="mr-1"></div>
                Nom et prénom
              </div>
            </th>
            <th style="padding: 8px; font-weight: 500;">Détails</th>
            <th style="padding: 8px; font-weight: 500;">Appartenance</th>
            <th style="padding: 8px; font-weight: 500;">Qui rapatrie</th>
            <th style="padding: 8px; font-weight: 500;">Arrivée hôpital</th>
            <th style="padding: 8px; font-weight: 500;">Qui soigne</th>
            <th style="padding: 8px; font-weight: 500;">Statut médical</th>
            <th style="padding: 8px; font-weight: 500;">Lit</th>
            <th style="padding: 8px; font-weight: 500;">Canal check centrale</th>
            <th style="padding: 8px; width: 40px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="crisis in filteredCrises" :key="crisis.id" 
            :style="[
              { borderBottom: '1px solid #1e293b' },
              crisis.canalCheckCentrale 
                ? { background: crisisRowColors.canalCheckCentrale.bg, borderLeft: `3px solid ${crisisRowColors.canalCheckCentrale.border}` } 
                : crisis.medicalStatus
                  ? { background: crisisRowColors.medicalStatus.bg, borderLeft: `3px solid ${crisisRowColors.medicalStatus.border}` }
                  : crisis.treatedBy 
                    ? { background: crisisRowColors.treatedBy.bg, borderLeft: `3px solid ${crisisRowColors.treatedBy.border}` }
                    : crisis.isHeavyInjured 
                      ? { background: crisisRowColors.isHeavyInjured.bg, borderLeft: `3px solid ${crisisRowColors.isHeavyInjured.border}` } 
                      : crisis.isComa 
                        ? { background: crisisRowColors.isComa.bg, borderLeft: `3px solid ${crisisRowColors.isComa.border}` } 
                        : { background: crisisRowColors.default.bg }
            ]">
            
            <td style="padding: 6px; text-align: center;">
              <input type="checkbox" v-model="crisis.isComa" @change="Dispatch.updateCrisis(crisis.id, { isComa: crisis.isComa })" style="width: 16px; height: 16px; accent-color: #ef4444;" />
            </td>

            <td style="padding: 6px; text-align: center;">
              <input type="checkbox" v-model="crisis.isHeavyInjured" @change="Dispatch.updateCrisis(crisis.id, { isHeavyInjured: crisis.isHeavyInjured })" style="width: 16px; height: 16px; accent-color: #f97316;" />
            </td>

            <td style="padding: 6px;">
              <div class="d-flex align-center">
                <div style="width: 20px; flex-shrink: 0; display: flex; justify-content: center;" class="mr-1">
                  <v-icon v-if="crisis.treatedBy && crisis.treatedBy === currentUserEmployeeId && !crisis.medicalStatus" size="14" color="orange" class="pulse-orange" title="En cours de soin">mdi-stethoscope</v-icon>
                </div>
                <input :value="localBuffers[`${crisis.id}-name`] ?? crisis.name" @input="onCrisisNameInput(crisis, $event.target.value)" class="location-input font-weight-bold text-red-lighten-2" style="font-size: 0.85rem; width: 100%; border-bottom: 1px solid transparent;" placeholder="Nom et prénom" />
              </div>
            </td>

            <td style="padding: 6px;">
              <input :value="localBuffers[`${crisis.id}-reason`] ?? crisis.reason" @input="onCrisisReasonInput(crisis, $event.target.value)" class="location-input" placeholder="Calibre // GPB // Blessures // ZIP" style="font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 5px 8px; border-radius: 4px; width: 100%; border: 1px solid #334155;" />
            </td>

            <td style="padding: 6px;">
              <select v-model="crisis.affiliation" @change="Dispatch.updateCrisis(crisis.id, { affiliation: crisis.affiliation })" class="location-input font-weight-bold" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); width: 100%; font-size: 0.8rem;" :style="{ color: affiliations.find(a => a.id === crisis.affiliation)?.color || '#fff' }">
                <option :value="null" style="background:#1a1f35; color:#94a3b8;">Aucune</option>
                <option v-for="aff in affiliations" :key="aff.id" :value="aff.id" style="background:#1a1f35" :style="{ color: aff.color || '#e2e8f0' }">{{ aff.label }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.repatriatedBy" @change="Dispatch.updateCrisis(crisis.id, { repatriatedBy: crisis.repatriatedBy })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600; font-size: 0.8rem;">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Sélectionner --</option>
                <option v-for="emp in getCrisisEmployeeOptions(crisis.repatriatedBy)" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
              </select>
            </td>

            <td style="padding: 6px;">
              <label class="d-flex align-center cursor-pointer">
                <input type="checkbox" v-model="crisis.arrivedAtHospital" @change="onCrisisArrivalChange(crisis)" class="mr-1" style="width: 14px; height: 14px;" />
                <span v-if="crisis.arrivedAtHospital" class="text-caption ml-1 font-weight-bold" :class="crisis.id === nextCrisisIdToTreat ? 'text-red' : 'text-white'">{{ formatTime(crisis.arrivalTime) }}</span>
              </label>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.treatedBy" @change="Dispatch.updateCrisis(crisis.id, { treatedBy: crisis.treatedBy })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600; font-size: 0.8rem;">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Sélectionner --</option>
                <option v-for="emp in getCrisisEmployeeOptions(crisis.treatedBy, 'treatment')" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.medicalStatus" @change="onMedicalStatusChange(crisis)" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); font-weight: 600; font-size: 0.85rem;" :style="{ color: crisisMedicalStatuses.find(s => s.value === crisis.medicalStatus)?.color || '#fff' }">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Statut --</option>
                <option v-for="stat in crisisMedicalStatuses" :key="stat.value" :value="stat.value" style="background:#1a1f35" :style="{ color: stat.color || '#e2e8f0' }">{{ stat.emoji ? stat.emoji + ' ' : '' }}{{ stat.label }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.bed" @change="Dispatch.updateCrisis(crisis.id, { bed: crisis.bed })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600; font-size: 0.8rem;">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Lit --</option>
                <option v-for="bed in crisisBeds" :key="bed.value" :value="bed.value" style="background:#1a1f35">{{ bed.label }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <label class="d-flex align-center cursor-pointer">
                <input type="checkbox" v-model="crisis.canalCheckCentrale" @change="Dispatch.updateCrisis(crisis.id, { canalCheckCentrale: crisis.canalCheckCentrale })" class="mr-1" style="width: 14px; height: 14px;" />
              </label>
            </td>

            <td style="padding: 6px; text-align: center;">
              <v-btn icon variant="plain" size="small" color="error" @click="removeCrisisSlot(crisis.id)" title="Supprimer" style="height: 28px; width: 28px; background: rgba(255,0,0,0.1); border-radius: 4px;">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </td>
          </tr>
          <tr v-if="!dispatch?.crises?.length">
            <td colspan="7" class="text-caption text-grey pa-2" style="font-style: italic;">
              Aucun patient à soigner. Cliquez sur le + pour ajouter une personne.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import DispatchLib from '@/classes/Dispatch.js'
import Swal from 'sweetalert2'
import {
  crisisRowColors,
  crisisMedicalStatuses,
  crisisBeds
} from '@/config/dispatch.js'

export default {
  name: 'DispatchCrisis',
  props: {
    dispatch: { type: Object, required: false },
    isLightTheme: { type: Boolean, default: false },
    currentTime: { type: Number, required: true },
    allEmployees: { type: Array, required: true },
    currentUserEmployeeId: { type: String, required: false },
    affiliations: { type: Array, default: () => [] },
    isDirection: { type: Boolean, default: false }
  },
  data() {
    return {
      crisisExpanded: localStorage.getItem('dispatch_crisis_expanded') !== 'false',
      localCrisisZip: '',
      localBuffers: {},
      _timeouts: {},
      Dispatch: DispatchLib,
      crisisRowColors,
      crisisMedicalStatuses,
      crisisBeds,
      filterAffiliation: null,
      hideCompleted: false,
      showFilterMenu: false,
      filterRepatriatedBy: null,
      filterTreatedBy: null,
      filterCanalCheck: 'all',
      showAffiliationManager: false
    }
  },
  computed: {
    nextCrisisIdToTreat() {
      if (!this.dispatch || !this.dispatch.crises) return null
      const untreated = this.dispatch.crises.filter(c => c.arrivedAtHospital && !c.medicalStatus && !c.treatedBy)
      if (untreated.length === 0) return null
      return untreated.sort((a,b) => a.arrivalTime - b.arrivalTime)[0].id
    },
    sortedCrises() {
      if (!this.dispatch || !this.dispatch.crises) return []
      return [...this.dispatch.crises].sort((a, b) => {
        const getAffIdx = (val) => {
          const idx = this.affiliations.findIndex(aff => aff.id === val)
          return idx === -1 ? 999 : idx
        }
        const affDiff = getAffIdx(a.affiliation) - getAffIdx(b.affiliation)
        if (affDiff !== 0) return affDiff
        const getBedIdx = (val) => {
          const idx = this.crisisBeds.findIndex(bed => bed.value === val)
          return idx === -1 ? 999 : idx
        }
        const bedDiff = getBedIdx(a.bed) - getBedIdx(b.bed)
        if (bedDiff !== 0) return bedDiff

        // Secondary sort by arrival time
        return (a.arrivalTime || 0) - (b.arrivalTime || 0)
      })
    },
    filteredCrises() {
      let list = this.sortedCrises
      if (this.filterAffiliation) {
        list = list.filter(c => c.affiliation === this.filterAffiliation)
      }
      if (this.hideCompleted) {
        list = list.filter(c => !c.medicalStatus)
      }
      if (this.filterRepatriatedBy) {
        if (this.filterRepatriatedBy === 'none') list = list.filter(c => !c.repatriatedBy)
        else list = list.filter(c => c.repatriatedBy === this.filterRepatriatedBy)
      }
      if (this.filterTreatedBy) {
        if (this.filterTreatedBy === 'none') list = list.filter(c => !c.treatedBy)
        else list = list.filter(c => c.treatedBy === this.filterTreatedBy)
      }
      if (this.filterCanalCheck !== 'all') {
        const wantChecked = this.filterCanalCheck === 'checked'
        list = list.filter(c => !!c.canalCheckCentrale === wantChecked)
      }
      return list
    },
    isFiltered() {
      return this.filterAffiliation !== null || this.hideCompleted || this.filterRepatriatedBy !== null || this.filterTreatedBy !== null || this.filterCanalCheck !== 'all'
    },
    averageTreatmentTime() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      const validCrises = this.dispatch.crises.filter(c => c.arrivalTime && c.statusTime)
      if (validCrises.length === 0) return 0
      const totalMs = validCrises.reduce((sum, c) => sum + (c.statusTime - c.arrivalTime), 0)
      return totalMs / validCrises.length
    },
    totalCrisisDuration() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      const crises = this.dispatch.crises
      const withArrival = crises.filter(c => c.arrivalTime)
      if (withArrival.length === 0) return 0
      
      const firstArrival = Math.min(...withArrival.map(c => c.arrivalTime))
      const isOngoing = crises.some(c => !c.medicalStatus && (c.arrivalTime || (c.name && c.name.trim() !== '')))
      
      if (isOngoing) {
        return this.currentTime - firstArrival
      } else {
        const withStatus = crises.filter(c => c.statusTime)
        const lastStatus = withStatus.length > 0 ? Math.max(...withStatus.map(c => c.statusTime)) : this.currentTime
        return lastStatus - firstArrival
      }
    },
    totalInjured() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      return this.dispatch.crises.filter(c => c.name && c.name.trim() !== '').length
    },
    treatedInjured() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      return this.dispatch.crises.filter(c => c.name && c.name.trim() !== '' && c.medicalStatus).length
    },
    anyPatientArrived() {
      return this.dispatch?.crises?.some(c => c.arrivedAtHospital && c.arrivalTime) || false
    }
  },
  watch: {
    crisisExpanded(val) { localStorage.setItem('dispatch_crisis_expanded', val) },
    'dispatch.crisisZip': {
      handler(newVal) {
        if (!this.localCrisisZip && !document.activeElement?.classList.contains('crisis-zip-input')) {
          this.localCrisisZip = newVal || ''
        } else if (newVal && this.localCrisisZip !== newVal && !document.activeElement?.classList.contains('crisis-zip-input')) {
          this.localCrisisZip = newVal || ''
        }
      },
      immediate: true
    }
  },
  methods: {
    debounceUpdate(id, field, callback, delay = 500) {
      const key = `${id}-${field}`
      if (this._timeouts[key]) clearTimeout(this._timeouts[key])
      this._timeouts[key] = setTimeout(() => {
        callback()
        delete this._timeouts[key]
      }, delay)
    },
    getCrisisEmployeeOptions(currentId, type = 'repatriation') {
      if (!this.dispatch) return []
      const ids = new Set()
      if (this.dispatch.centrale?.employees)
        this.dispatch.centrale.employees.forEach(e => ids.add(e.employeeId))
      ;(this.dispatch.interventions || []).forEach(s => (s.employees || []).forEach(e => ids.add(e.employeeId)))
      ;(this.dispatch.patates || []).forEach(p => { if (p.employeeId) ids.add(p.employeeId) })
      
      const actives = this.allEmployees.filter(e => ids.has(e.id))
      
      const specialIds = type === 'repatriation' 
        ? ['BCES', 'Unité X', 'Consultation']
        : ['BCES']
        
      const options = [...actives]
      specialIds.forEach(id => {
        options.push({ id, name: id, phone: '', role: '' })
      })

      if (currentId && !options.find(o => o.id === currentId)) {
        const existing = this.allEmployees.find(e => e.id === currentId)
        if (existing) options.push(existing)
        else if (!specialIds.includes(currentId)) options.push({ id: currentId, name: 'Inconnu', phone: '', role: '' })
      }

      return options.sort((a,b) => {
        const aSpec = specialIds.indexOf(a.id)
        const bSpec = specialIds.indexOf(b.id)
        
        if (aSpec !== -1 && bSpec !== -1) return aSpec - bSpec
        if (aSpec !== -1) return 1
        if (bSpec !== -1) return -1
        
        return (a.name || '').localeCompare(b.name || '')
      })
    },
    onCrisisNameInput(crisis, val) {
      this.localBuffers[`${crisis.id}-name`] = val
      this.debounceUpdate(crisis.id, 'name', () => {
        DispatchLib.updateCrisis(crisis.id, { name: val }).then(() => {
          if (this.localBuffers[`${crisis.id}-name`] === val) delete this.localBuffers[`${crisis.id}-name`]
        })
      })
    },
    onCrisisReasonInput(crisis, val) {
      this.localBuffers[`${crisis.id}-reason`] = val
      this.debounceUpdate(crisis.id, 'reason', () => {
        DispatchLib.updateCrisis(crisis.id, { reason: val }).then(() => {
          if (this.localBuffers[`${crisis.id}-reason`] === val) delete this.localBuffers[`${crisis.id}-reason`]
        })
      })
    },
    async addCrisisSlot() {
      if (!this.dispatch) return
      if ((this.dispatch.crises || []).length >= 50) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 50 patients en crise.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
      const newCrisis = {
        name: '',
        isComa: false,
        isHeavyInjured: false,
        affiliation: null,
        reason: '',
        repatriatedBy: null,
        treatedBy: null,
        arrivedAtHospital: false,
        medicalStatus: null,
        bed: null,
        canalCheckCentrale: false,
        arrivalTime: null,
      }
      await DispatchLib.addCrisis(newCrisis)
    },
    async removeCrisisSlot(slotId) {
      await DispatchLib.removeCrisis(slotId)
    },
    async confirmClearCrises() {
      if (!this.dispatch) return
      const r = await Swal.fire({
        title: 'Vider le dispatch de crise ?',
        text: 'Tous les patients seront supprimés.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, vider',
        cancelButtonText: 'Annuler',
        background: '#1e293b',
        color: '#fff'
      })
      if (r.isConfirmed) {
        this.localCrisisZip = ''
        await DispatchLib.clearAllCrises()
        await DispatchLib.updateField('crisisZip', '')
      }
    },
    async onCrisisArrivalChange(crisis) {
      if (crisis.arrivedAtHospital && !crisis.arrivalTime) {
        crisis.arrivalTime = Date.now()
      } else if (!crisis.arrivedAtHospital) {
        crisis.arrivalTime = null
      }
      await DispatchLib.updateCrisis(crisis.id, { 
        arrivedAtHospital: crisis.arrivedAtHospital, 
        arrivalTime: crisis.arrivalTime 
      })
    },
    async onMedicalStatusChange(crisis) {
      if (!this.dispatch) return
      
      let statusTime = crisis.statusTime
      if (crisis.medicalStatus) {
        if (!statusTime) statusTime = Date.now()
      } else {
        statusTime = null
      }

      await DispatchLib.updateCrisis(crisis.id, { 
        medicalStatus: crisis.medicalStatus || null,
        statusTime
      })
    },
    formatDuration(ms) {
      if (!ms || ms < 0) return '0s'
      const totalSeconds = Math.floor(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      if (minutes > 0) return `${minutes}m ${seconds}s`
      return `${seconds}s`
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const d = new Date(timestamp)
      const hrs = d.getHours().toString().padStart(2, '0')
      const mins = d.getMinutes().toString().padStart(2, '0')
      const secs = d.getSeconds().toString().padStart(2, '0')
      return `${hrs}:${mins}:${secs}`
    },
    onZipChange() {
      if (!this.dispatch) return
      DispatchLib.updateField('crisisZip', this.localCrisisZip.toUpperCase())
    },
    resetFilters() {
      this.filterAffiliation = null
      this.hideCompleted = false
      this.filterRepatriatedBy = null
      this.filterTreatedBy = null
      this.filterCanalCheck = 'all'
    },
    async promptAddAffiliation() {
      const { value: formValues } = await Swal.fire({
        title: 'Ajoute une affiliation',
        html:
          `<div style="text-align: left; padding: 0 5px;">
            <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">NOM DU GROUPE / AFFILIATION</label>
            <input id="swal-input1" class="swal2-input" placeholder="ex: Ballas" style="margin: 0 0 15px 0; width: 100%; height: 45px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #334155;">
            
            <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">COULEUR DISTINCTIVE</label>
            <input id="swal-input2" class="swal2-input" type="color" value="#3b82f6" style="margin: 0; width: 100%; height: 45px; cursor: pointer; background: rgba(0,0,0,0.2); border: 1px solid #334155; padding: 4px;">
          </div>`,
        focusConfirm: false,
        background: '#1e293b',
        color: '#fff',
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
        preConfirm: () => {
          const label = document.getElementById('swal-input1').value.trim()
          const color = document.getElementById('swal-input2').value
          if (!label) {
            Swal.showValidationMessage("Le nom est obligatoire")
            return false
          }
          return { label, color }
        }
      })
      if (formValues) {
        await DispatchLib.addAffiliation({ ...formValues, order: Date.now() })
      }
    },
    async promptEditAffiliation(aff) {
      const { value: formValues } = await Swal.fire({
        title: 'Modifier l\'affiliation',
        html:
          `<div style="text-align: left; padding: 0 5px;">
            <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">NOM DU GROUPE / AFFILIATION</label>
            <input id="swal-input1" class="swal2-input" placeholder="Label" value="${aff.label}" style="margin: 0 0 15px 0; width: 100%; height: 45px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #334155;">
            
            <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">COULEUR DISTINCTIVE</label>
            <input id="swal-input2" class="swal2-input" type="color" value="${aff.color}" style="margin: 0; width: 100%; height: 45px; cursor: pointer; background: rgba(0,0,0,0.2); border: 1px solid #334155; padding: 4px;">
          </div>`,
        focusConfirm: false,
        background: '#1e293b',
        color: '#fff',
        showCancelButton: true,
        confirmButtonText: 'Sauvegarder',
        cancelButtonText: 'Annuler',
        preConfirm: () => {
          const label = document.getElementById('swal-input1').value.trim()
          const color = document.getElementById('swal-input2').value
          if (!label) {
            Swal.showValidationMessage("Le nom est obligatoire")
            return false
          }
          return { label, color }
        }
      })
      if (formValues) {
        await DispatchLib.updateAffiliation(aff.id, formValues)
      }
    },
    async confirmDeleteAffiliation(aff) {
      const r = await Swal.fire({
        title: 'Supprimer l\'affiliation ?',
        text: `Voulez-vous vraiment supprimer "${aff.label}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        background: '#1e293b',
        color: '#fff'
      })
      if (r.isConfirmed) {
        await DispatchLib.deleteAffiliation(aff.id)
      }
    }
  }
}
</script>

<style>
.crises-bottom-section .slot-section-title {
  margin-bottom: 0;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-primary));
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
