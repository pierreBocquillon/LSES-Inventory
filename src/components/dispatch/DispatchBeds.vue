<template>
  <div class="beds-bottom-section" style="border-top: 2px solid #334155; background: #0f172a; padding: 10px; width: 100%; box-sizing: border-box; flex-shrink: 0;">
      <div class="slot-section-title" style="background: #3b82f6; cursor: pointer;" @click="bedsExpanded = !bedsExpanded">
        🛌 Chambres LSES
        <v-icon size="14" class="ml-auto">{{ bedsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </div>

      <div v-if="bedsExpanded" :style="{ marginTop: '10px' }">
        <div v-for="(group, gIdx) in crisisBedGroups" :key="group.id" :style="{ marginBottom: gIdx === crisisBedGroups.length - 1 ? '0' : '24px' }" style="border: 1px solid #1e293b; background: rgba(0,0,0,0.15);">
        <div class="slot-section-title" :style="{ background: group.color }" style="justify-content: center; font-size: 0.8rem; padding: 8px; letter-spacing: 1px; color: #fff;">
          <span style="margin-right: 8px;">{{ group.icon }}</span> {{ group.label }}
        </div>

        <div class="pa-2">
          <template v-for="(bedSubarray, idx) in getBedSubarrays(group)" :key="group.id + '-' + idx">
            <table style="border-collapse: collapse; text-align: center; width: 100%; table-layout: fixed; margin-top: 8px; margin-bottom: 8px;">
              <tbody>
                <!-- Row 1: Bed Names -->
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-header-' + i" style="padding: 4px; font-weight: bold; border: 1px solid #1e293b; color: #cbd5e1; font-size: 0.8rem;" :style="bedId === '' ? 'background: rgba(0,0,0,0.3)' : 'background: rgba(255,255,255,0.05)'">
                    {{ bedId === '' ? '' : getBedLabel(bedId) }}
                  </td>
                </tr>
                <!-- Row 2: Nom Prénom -->
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.75rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Nom Prénom</td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-name-' + i" style="padding: 2px; border: 1px solid #1e293b; height: 32px;" :style="bedId === '' ? 'background: rgba(0,0,0,0.3); pointer-events: none;' : (getBedData(bedId).patientName ? 'background: rgba(56, 189, 248, 0.1)' : 'background: rgba(0,0,0,0.2)')">
                    <input v-if="bedId !== ''"
                      :value="localBuffers[`${bedId}-patientName`] ?? getBedData(bedId).patientName" 
                      @input="updateBedPatientName(bedId, $event.target.value)"
                      class="location-input font-weight-bold text-center" 
                      :class="getBedData(bedId).patientName ? 'text-blue-lighten-2' : ''"
                      style="font-size: 0.8rem; width: 100%; border: none; background: transparent; outline: none; padding: 4px;" 
                    />
                  </td>
                </tr>
                <!-- Row 3: Date d'admission -->
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.75rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Date d'admission</td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-time-' + i" style="padding: 2px; border: 1px solid #1e293b; font-size: 0.75rem; color: #94a3b8; height: 28px;" :style="bedId === '' ? 'background: rgba(0,0,0,0.3);' : (getBedData(bedId).patientName ? 'background: rgba(56, 189, 248, 0.1)' : 'background: rgba(0,0,0,0.2)')">
                    {{ bedId !== '' && getBedData(bedId).admissionTime ? formatDateTime(getBedData(bedId).admissionTime) : '' }}
                  </td>
                </tr>
                <!-- Row 4: Raison -->
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.75rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Raison</td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-reason-' + i" style="padding: 0; border: 1px solid #1e293b; height: 32px;" :style="bedId === '' ? 'background: rgba(0,0,0,0.3); pointer-events: none;' : (getBedData(bedId).patientName ? 'background: rgba(56, 189, 248, 0.1)' : 'background: rgba(0,0,0,0.2)')">
                    <select v-if="bedId !== ''"
                      :value="getBedData(bedId).reason || ''" 
                      @change="updateBedReason(bedId, $event.target.value)"
                      class="location-input text-center w-100 h-100" 
                      style="font-size: 0.75rem; font-weight: 600; border: none; outline: none; background: transparent; cursor: pointer; text-align-last: center;"
                      :style="{ color: crisisMedicalStatuses.find(s => s.value === getBedData(bedId).reason)?.color || '#fff' }"
                    >
                      <option value="" style="background:#1a1f35; color: #fff;"></option>
                      <option v-for="stat in crisisMedicalStatuses" :key="stat.value" :value="stat.value" style="background:#1a1f35" :style="{ color: stat.color || '#e2e8f0' }">{{ stat.emoji ? stat.emoji + ' ' : '' }}{{ stat.label }}</option>
                    </select>
                  </td>
                </tr>
                <!-- Row 5: FDO / Contact -->
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.7rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02); padding: 0 4px;">
                    FDO / Contact urgence à prévenir
                  </td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-fdo-' + i" style="padding: 0; border: 1px solid #1e293b; height: 32px;" :style="bedId === '' ? 'background: rgba(0,0,0,0.3); pointer-events: none;' : 'background: rgba(0,0,0,0.2);'">
                    <div v-if="bedId !== ''" class="d-flex w-100 h-100">
                      <label class="d-flex align-center justify-center flex-1-1 cursor-pointer" style="border-right: 1px solid #1e293b;" :style="getBedData(bedId).fdoNotified ? 'background: rgba(239, 68, 68, 0.15)' : ''">
                        <input 
                          type="checkbox" 
                          :checked="getBedData(bedId).fdoNotified" 
                          @change="updateBedFdo(bedId, $event.target.checked)"
                          style="width: 14px; height: 14px; accent-color: #ef4444; cursor: pointer;" 
                        />
                      </label>
                      <label class="d-flex align-center justify-center flex-1-1 cursor-pointer" :style="getBedData(bedId).emergencyContactsNotified ? 'background: rgba(245, 158, 11, 0.15)' : ''">
                        <input 
                          type="checkbox" 
                          :checked="getBedData(bedId).emergencyContactsNotified" 
                          @change="updateBedEmergencyContacts(bedId, $event.target.checked)"
                          style="width: 14px; height: 14px; accent-color: #f59e0b; cursor: pointer;" 
                        />
                      </label>
                    </div>
                  </td>
                </tr>
                <!-- Row 6: Actions (Clear Bed) -->
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="(bedId, i) in bedSubarray" :key="bedId + '-action-' + i" style="height: 38px; border: 1px solid transparent; padding-top: 4px;">
                    <v-btn v-if="bedId !== '' && getBedData(bedId).patientName" variant="tonal" size="x-small" color="error" @click="clearBed(bedId)" title="Libérer le lit">
                      <v-icon size="12" class="mr-1">mdi-bed-empty</v-icon> Libérer
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
        </div>
      </div>
    </div>
</template>

<script>
import DispatchLib from '@/classes/Dispatch.js'
import {
  crisisMedicalStatuses,
  crisisBeds,
  crisisBedGroups
} from '@/config/dispatch.js'

export default {
  name: 'DispatchBeds',
  props: {
    dispatch: { type: Object, required: false },
    isLightTheme: { type: Boolean, default: false }
  },
  data() {
    return {
      bedsExpanded: localStorage.getItem('dispatch_beds_expanded') !== 'false',
      crisisMedicalStatuses,
      crisisBeds,
      crisisBedGroups,
      localBuffers: {},
      _timeouts: {}
    }
  },
  watch: {
    bedsExpanded(val) { localStorage.setItem('dispatch_beds_expanded', val) }
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
    getBedSubarrays(group) {
      if (group.type === 'clockwise' && group.beds.length > 2) {
        const half = Math.ceil(group.beds.length / 2)
        return [
          group.beds.slice(0, half),
          group.beds.slice(half).reverse()
        ]
      }
      return [group.beds]
    },
    getBedLabel(bedValue) {
      const bed = this.crisisBeds.find(b => b.value === bedValue)
      return bed ? bed.label : bedValue
    },
    formatDateTime(timestamp) {
      if (!timestamp) return ''
      const d = new Date(timestamp)
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const hrs = d.getHours().toString().padStart(2, '0')
      const mins = d.getMinutes().toString().padStart(2, '0')
      return `${day}/${month} ${hrs}:${mins}`
    },
    getBedData(bedValue) {
      if (!this.dispatch || !this.dispatch.beds) return { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      return this.dispatch.beds[bedValue] || { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
    },
    async updateBedPatientName(bedId, name) {
      if (!this.dispatch) return
      if (!this.dispatch.beds) this.dispatch.beds = {}
      
      this.localBuffers[`${bedId}-patientName`] = name
      
      this.debounceUpdate(bedId, 'patientName', async () => {
        const bedData = this.getBedData(bedId)
        let admissionTime = bedData.admissionTime
        if (name && !bedData.patientName) admissionTime = Date.now()
        else if (!name) admissionTime = null
        
        await DispatchLib.updateBed(bedId, { patientName: name, admissionTime }).then(() => {
          if (this.localBuffers[`${bedId}-patientName`] === name) delete this.localBuffers[`${bedId}-patientName`]
        })
      })
    },
    async updateBedReason(bedValue, reason) {
      await DispatchLib.updateBed(bedValue, { reason })
    },
    async updateBedFdo(bedValue, checked) {
      await DispatchLib.updateBed(bedValue, { fdoNotified: checked })
    },
    async updateBedEmergencyContacts(bedValue, checked) {
      await DispatchLib.updateBed(bedValue, { emergencyContactsNotified: checked })
    },
    async clearBed(bedValue) {
      await DispatchLib.updateBed(bedValue, { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null })
    }
  }
}
</script>

<style>
.theme--light .beds-bottom-section {
  background: #f1f5f9 !important;
  border-top-color: #cbd5e1 !important;
}

.theme--light .beds-bottom-section > div > div {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important; 
}

.beds-bottom-section .slot-section-title {
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

.theme--light .beds-bottom-section .slot-section-title {
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
  text-shadow: none;
}
</style>
