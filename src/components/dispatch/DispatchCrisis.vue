<template>
  <div class="crises-bottom-section" style="border-top: 2px solid #334155; background: #0f172a; padding: 10px; width: 100%; box-sizing: border-box; flex-shrink: 0;">
    <div class="slot-section-title" style="background: #b91c1c; cursor: pointer;" @click="crisisExpanded = !crisisExpanded">
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
    </div>

    <div v-if="crisisExpanded" class="crises-list" style="margin-top: 10px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 0.75rem;">
            <th style="padding: 8px; font-weight: 500; text-align: center; width: 40px;">Coma</th>
            <th style="padding: 8px; font-weight: 500; text-align: center; width: 60px;">Lourd / Inconscient</th>
            <th style="padding: 8px; font-weight: 500;">Nom et prénom</th>
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
          <tr v-for="crisis in sortedCrises" :key="crisis.id" 
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
              <input :value="localBuffers[`${crisis.id}-name`] ?? crisis.name" @input="onCrisisNameInput(crisis, $event.target.value)" class="location-input font-weight-bold text-red-lighten-2" style="font-size: 0.8rem; width: 100%; border-bottom: 1px solid transparent;" placeholder="Nom" />
            </td>

            <td style="padding: 6px;">
              <input :value="localBuffers[`${crisis.id}-reason`] ?? crisis.reason" @input="onCrisisReasonInput(crisis, $event.target.value)" class="location-input" placeholder="Calibre // GPB // Blessures // ZIP" style="font-size: 0.75rem; background: rgba(0,0,0,0.2); padding: 5px 8px; border-radius: 4px; width: 100%; border: 1px solid #334155;" />
            </td>

            <td style="padding: 6px;">
              <select v-model="crisis.affiliation" @change="Dispatch.updateCrisis(crisis.id, { affiliation: crisis.affiliation })" class="location-input font-weight-bold" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); width: 100%;" :style="{ color: crisisAffiliations.find(a => a.value === crisis.affiliation)?.color || '#fff' }">
                <option v-for="aff in crisisAffiliations" :key="aff.value" :value="aff.value" style="background:#1a1f35" :style="{ color: aff.color || '#e2e8f0' }">{{ aff.label }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.repatriatedBy" @change="Dispatch.updateCrisis(crisis.id, { repatriatedBy: crisis.repatriatedBy })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
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
              <select v-model="crisis.treatedBy" @change="Dispatch.updateCrisis(crisis.id, { treatedBy: crisis.treatedBy })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Sélectionner --</option>
                <option v-for="emp in getCrisisEmployeeOptions(crisis.treatedBy, 'treatment')" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.medicalStatus" @change="onMedicalStatusChange(crisis)" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); font-weight: 600;" :style="{ color: crisisMedicalStatuses.find(s => s.value === crisis.medicalStatus)?.color || '#fff' }">
                <option :value="null" style="background:#1a1f35; color: #fff;">-- Statut --</option>
                <option v-for="stat in crisisMedicalStatuses" :key="stat.value" :value="stat.value" style="background:#1a1f35" :style="{ color: stat.color || '#e2e8f0' }">{{ stat.emoji ? stat.emoji + ' ' : '' }}{{ stat.label }}</option>
              </select>
            </td>
            
            <td style="padding: 6px;">
              <select v-model="crisis.bed" @change="Dispatch.updateCrisis(crisis.id, { bed: crisis.bed })" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
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
  crisisAffiliations,
  crisisBeds
} from '@/config/dispatch.js'

export default {
  name: 'DispatchCrisis',
  props: {
    dispatch: { type: Object, required: false },
    isLightTheme: { type: Boolean, default: false },
    currentTime: { type: Number, required: true },
    allEmployees: { type: Array, required: true }
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
      crisisAffiliations,
      crisisBeds
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
          const idx = this.crisisAffiliations.findIndex(aff => aff.value === val)
          return idx === -1 ? 999 : idx
        }
        const affDiff = getAffIdx(a.affiliation) - getAffIdx(b.affiliation)
        if (affDiff !== 0) return affDiff
        const getBedIdx = (val) => {
          const idx = this.crisisBeds.findIndex(bed => bed.value === val)
          return idx === -1 ? 999 : idx
        }
        return getBedIdx(a.bed) - getBedIdx(b.bed)
      })
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
        affiliation: 'civil',
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
    }
  }
}
</script>

<style>
.crises-bottom-section .slot-section-title {
  margin-bottom: 0;
}
</style>
