<template>
  <div class="morgue-section" style="border-top: 2px solid #334155; background: #080c14; padding: 10px; width: 100%; box-sizing: border-box; flex-shrink: 0;">
    <div class="slot-section-title" style="background: linear-gradient(90deg, #374151 0%, #1f2937 100%); cursor: pointer;" @click="morgueExpanded = !morgueExpanded">
      ⚰️ Gestion Morgue
      <span class="ml-2" style="font-size:0.75rem; font-weight:400; opacity:0.7;">
        {{ morgueConfig.lockerCount }} casiers · {{ morgueConfig.urnShelfCount }} urnes · {{ morgueConfig.burialSlotCount }} enterrements
      </span>
      <v-icon size="14" class="ml-auto">{{ morgueExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </div>

    <div v-if="morgueExpanded" style="margin-top: 10px;">

      <div style="margin-bottom: 20px; border: 1px solid #1f2937; background: rgba(0,0,0,0.2);">
        <div class="slot-section-title" style="background: linear-gradient(90deg, #1f2937 0%, #111827 100%); font-size: 0.78rem; padding: 6px 10px; letter-spacing: 1px;">
          <span style="margin-right: 6px;">🪦</span> CASIERS MORTUAIRES
          <span class="cnt ml-2">{{ morgueLockersFilled }} / {{ morgueConfig.lockerCount }}</span>
        </div>
        <div class="pa-2">
          <template v-for="(chunk, chunkIdx) in getMorgueChunks(morgueConfig.lockerCount)" :key="'lk-chunk-'+chunkIdx">
            <table style="border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 8px;">
              <tbody>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'lk-h-'+chunkIdx+'-'+i"
                    style="padding: 4px; font-weight: bold; border: 1px solid #1f2937; color: #9ca3af; font-size: 0.78rem; text-align: center; background: rgba(255,255,255,0.04);">
                    Casier {{ i }}
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Prénom NOM</td>
                  <td v-for="i in chunk" :key="'lk-name-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="localBuffers[`morgue-lockers-${i}-name`] ?? getMorgueSlot('lockers', i).name ?? ''"
                      @input="updateMorgueSlot('lockers', i, 'name', $event.target.value)"
                      class="location-input font-weight-bold text-center"
                      :class="getMorgueSlot('lockers', i).name ? 'text-grey-lighten-2' : ''"
                      style="font-size: 0.78rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Date du décès</td>
                  <td v-for="i in chunk" :key="'lk-date-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('lockers', i).date || ''"
                      @change="updateMorgueSlot('lockers', i, 'date', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #9ca3af;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Appartenance</td>
                  <td v-for="i in chunk" :key="'lk-aff-'+chunkIdx+'-'+i"
                    style="padding: 1px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <select :value="getMorgueSlot('lockers', i).affiliation || ''"
                      @change="updateMorgueSlot('lockers', i, 'affiliation', $event.target.value)"
                      class="location-input w-100 h-100 text-center"
                      style="font-size: 0.72rem; font-weight: 600; border: none; outline: none; background: transparent; cursor: pointer; text-align-last: center;"
                      :style="{ color: affiliations.find(a => a.id === getMorgueSlot('lockers', i).affiliation)?.color || '#6b7280' }">
                      <option value="" style="background:#111827; color:#6b7280;">—</option>
                      <option v-for="aff in affiliations" :key="aff.id" :value="aff.id" style="background:#111827" :style="{ color: aff.color }">{{ aff.label }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Contact d'urgence</td>
                  <td v-for="i in chunk" :key="'lk-urg-'+chunkIdx+'-'+i"
                    style="padding: 0; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).emergencyContacted ? 'background: rgba(99, 102, 241, 0.4)' : (getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)')">
                    <div class="d-flex w-100 h-100 align-center justify-center">
                      <label class="d-flex align-center justify-center flex-1-1 cursor-pointer" style="height:100%;">
                        <input type="checkbox" :checked="getMorgueSlot('lockers', i).emergencyContacted"
                          @change="updateMorgueSlot('lockers', i, 'emergencyContacted', $event.target.checked)"
                          style="width: 14px; height: 14px; accent-color: #6366f1;" />
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Nom du légiste</td>
                  <td v-for="i in chunk" :key="'lk-leg-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('lockers', i).legist || ''"
                      @change="updateMorgueSlot('lockers', i, 'legist', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #d1d5db;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Demande d'enterrement</td>
                  <td v-for="i in chunk" :key="'lk-bur-'+chunkIdx+'-'+i"
                    style="padding: 0; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).burialRequested ? 'background: rgba(139, 92, 246, 0.4)' : (getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)')">
                    <div class="d-flex w-100 h-100 align-center justify-center">
                      <label class="d-flex align-center justify-center flex-1-1 cursor-pointer" style="height:100%;">
                        <input type="checkbox" :checked="getMorgueSlot('lockers', i).burialRequested"
                          @change="updateMorgueSlot('lockers', i, 'burialRequested', $event.target.checked)"
                          style="width: 14px; height: 14px; accent-color: #8b5cf6;" />
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Commentaire</td>
                  <td v-for="i in chunk" :key="'lk-com-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('lockers', i).comment || ''"
                      @change="updateMorgueSlot('lockers', i, 'comment', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.72rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #9ca3af;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Recup corps possible</td>
                  <td v-for="i in chunk" :key="'lk-rec-'+chunkIdx+'-'+i"
                    style="padding: 0; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('lockers', i).bodyRecoverable ? 'background: rgba(16, 185, 129, 0.4)' : (getMorgueSlot('lockers', i).name ? 'background: rgba(107,114,128,0.25)' : 'background: rgba(0,0,0,0.3)')">
                    <div class="d-flex w-100 h-100 align-center justify-center">
                      <label class="d-flex align-center justify-center flex-1-1 cursor-pointer" style="height:100%;">
                        <input type="checkbox" :checked="getMorgueSlot('lockers', i).bodyRecoverable"
                          @change="updateMorgueSlot('lockers', i, 'bodyRecoverable', $event.target.checked)"
                          style="width: 14px; height: 14px; accent-color: #10b981;" />
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'lk-act-'+chunkIdx+'-'+i"
                    style="height: 34px; border: 1px solid transparent; padding-top: 4px; text-align: center;">
                    <v-btn v-if="getMorgueSlot('lockers', i).name" variant="tonal" size="x-small" color="error"
                      @click="clearMorgueSlot('lockers', i)" title="Libérer le casier">
                      <v-icon size="11" class="mr-1">mdi-close</v-icon> Libérer
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>

      <div style="margin-bottom: 20px; border: 1px solid #1f2937; background: rgba(0,0,0,0.2);">
        <div class="slot-section-title" style="background: linear-gradient(90deg, #292240 0%, #1a1730 100%); font-size: 0.78rem; padding: 6px 10px; letter-spacing: 1px;">
          <span style="margin-right: 6px;">🏺</span> ÉTAGÈRE À URNES
          <span class="cnt ml-2">{{ morgueUrnsFilled }} / {{ morgueConfig.urnShelfCount }}</span>
        </div>
        <div class="pa-2">
          <template v-for="(chunk, chunkIdx) in getMorgueChunks(morgueConfig.urnShelfCount)" :key="'urn-chunk-'+chunkIdx">
            <table style="border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 8px;">
              <tbody>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'urn-h-'+chunkIdx+'-'+i"
                    style="padding: 4px; font-weight: bold; border: 1px solid #1f2937; color: #9ca3af; font-size: 0.78rem; text-align: center; background: rgba(255,255,255,0.04);">
                    Urne {{ i }}
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Prénom NOM</td>
                  <td v-for="i in chunk" :key="'urn-name-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('urnShelves', i).name ? 'background: rgba(88,28,135,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('urnShelves', i).name || ''"
                      @change="updateMorgueSlot('urnShelves', i, 'name', $event.target.value)"
                      class="location-input font-weight-bold text-center"
                      :class="getMorgueSlot('urnShelves', i).name ? 'text-purple-lighten-3' : ''"
                      style="font-size: 0.78rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Date d'incinération</td>
                  <td v-for="i in chunk" :key="'urn-date-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('urnShelves', i).name ? 'background: rgba(88,28,135,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('urnShelves', i).date || ''"
                      @change="updateMorgueSlot('urnShelves', i, 'date', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #9ca3af;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Contact pour l'enterrement</td>
                  <td v-for="i in chunk" :key="'urn-con-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('urnShelves', i).name ? 'background: rgba(88,28,135,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('urnShelves', i).contact || ''"
                      @change="updateMorgueSlot('urnShelves', i, 'contact', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #d1d5db;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Nom du légiste</td>
                  <td v-for="i in chunk" :key="'urn-leg-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('urnShelves', i).name ? 'background: rgba(88,28,135,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('urnShelves', i).legist || ''"
                      @change="updateMorgueSlot('urnShelves', i, 'legist', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #d1d5db;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Commentaire</td>
                  <td v-for="i in chunk" :key="'urn-com-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('urnShelves', i).name ? 'background: rgba(88,28,135,0.25)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('urnShelves', i).comment || ''"
                      @change="updateMorgueSlot('urnShelves', i, 'comment', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.72rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #9ca3af;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'urn-act-'+chunkIdx+'-'+i"
                    style="height: 34px; border: 1px solid transparent; padding-top: 4px; text-align: center;">
                    <v-btn v-if="getMorgueSlot('urnShelves', i).name" variant="tonal" size="x-small" color="error"
                      @click="clearMorgueSlot('urnShelves', i)" title="Libérer l'étagère">
                      <v-icon size="11" class="mr-1">mdi-close</v-icon> Libérer
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>

      <div style="margin-bottom: 10px; border: 1px solid #1f2937; background: rgba(0,0,0,0.2);">
        <div class="slot-section-title" style="background: linear-gradient(90deg, #1c2a1c 0%, #111a11 100%); font-size: 0.78rem; padding: 6px 10px; letter-spacing: 1px;">
          <span style="margin-right: 6px;">✝️</span> ENTERREMENTS
          <span class="cnt ml-2">{{ morgueBurialsFilled }} / {{ morgueConfig.burialSlotCount }}</span>
        </div>
        <div class="pa-2">
          <template v-for="(chunk, chunkIdx) in getMorgueChunks(morgueConfig.burialSlotCount)" :key="'bur-chunk-'+chunkIdx">
            <table style="border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 8px;">
              <tbody>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'bur-h-'+chunkIdx+'-'+i"
                    style="padding: 4px; font-weight: bold; border: 1px solid #1f2937; color: #9ca3af; font-size: 0.78rem; text-align: center; background: rgba(255,255,255,0.04);">
                    Enterrement {{ i }}
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Prénom NOM</td>
                  <td v-for="i in chunk" :key="'bur-name-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('burials', i).name ? 'background: rgba(20,83,45,0.35)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('burials', i).name || ''"
                      @change="updateMorgueSlot('burials', i, 'name', $event.target.value)"
                      class="location-input font-weight-bold text-center"
                      :class="getMorgueSlot('burials', i).name ? 'text-green-lighten-3' : ''"
                      style="font-size: 0.78rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Date Enterrement</td>
                  <td v-for="i in chunk" :key="'bur-date-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('burials', i).name ? 'background: rgba(20,83,45,0.35)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('burials', i).date || ''"
                      @change="updateMorgueSlot('burials', i, 'date', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #9ca3af;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Conducteur Corbillard</td>
                  <td v-for="i in chunk" :key="'bur-cond-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('burials', i).name ? 'background: rgba(20,83,45,0.35)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('burials', i).driver || ''"
                      @change="updateMorgueSlot('burials', i, 'driver', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #d1d5db;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; text-align: center; font-weight: bold; color: #94a3b8; font-size: 0.72rem; border: 1px solid #1e293b; background: rgba(255,255,255,0.02);">Contact Référent</td>
                  <td v-for="i in chunk" :key="'bur-ref-'+chunkIdx+'-'+i"
                    style="padding: 2px; border: 1px solid #1f2937; height: 30px;"
                    :style="getMorgueSlot('burials', i).name ? 'background: rgba(20,83,45,0.35)' : 'background: rgba(0,0,0,0.3)'">
                    <input :value="getMorgueSlot('burials', i).contact || ''"
                      @change="updateMorgueSlot('burials', i, 'contact', $event.target.value)"
                      class="location-input text-center"
                      style="font-size: 0.75rem; width: 100%; border: none; background: transparent; outline: none; padding: 3px; color: #d1d5db;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 130px; border: 1px solid transparent;"></td>
                  <td v-for="i in chunk" :key="'bur-act-'+chunkIdx+'-'+i"
                    style="height: 34px; border: 1px solid transparent; padding-top: 4px; text-align: center;">
                    <v-btn v-if="getMorgueSlot('burials', i).name" variant="tonal" size="x-small" color="error"
                      @click="clearMorgueSlot('burials', i)" title="Effacer ce slot">
                      <v-icon size="11" class="mr-1">mdi-close</v-icon> Effacer
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
  morgueConfig,
} from '@/config/dispatch.js'

export default {
  name: 'DispatchMorgue',
  props: {
    dispatch: {
      type: Object,
      required: false,
      default: null
    },
    affiliations: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      morgueExpanded: localStorage.getItem('dispatch_morgue_expanded') === 'true',
      morgueConfig,
      localBuffers: {},
      _timeouts: {}
    }
  },
  computed: {
    morgueLockersFilled() {
      if (!this.dispatch?.morgue?.lockers) return 0
      return Object.values(this.dispatch.morgue.lockers).filter(s => s?.name).length
    },
    morgueUrnsFilled() {
      if (!this.dispatch?.morgue?.urnShelves) return 0
      return Object.values(this.dispatch.morgue.urnShelves).filter(s => s?.name).length
    },
    morgueBurialsFilled() {
      if (!this.dispatch?.morgue?.burials) return 0
      return Object.values(this.dispatch.morgue.burials).filter(s => s?.name).length
    }
  },
  watch: {
    morgueExpanded(val) { 
      localStorage.setItem('dispatch_morgue_expanded', val) 
    }
  },
  methods: {
    getMorgueSlot(section, index) {
      if (!this.dispatch?.morgue) return {}
      const slots = this.dispatch.morgue[section] || {}
      return slots[`slot_${index}`] || {}
    },
    getMorgueChunks(count) {
      const maxPerRow = this.morgueConfig?.maxPerRow || 6
      const chunks = []
      for (let start = 1; start <= count; start += maxPerRow) {
        const chunk = []
        for (let i = start; i < start + maxPerRow && i <= count; i++) {
          chunk.push(i)
        }
        chunks.push(chunk)
      }
      return chunks
    },
    debounceUpdate(id, field, callback, delay = 500) {
      const key = `${id}-${field}`
      if (this._timeouts[key]) clearTimeout(this._timeouts[key])
      this._timeouts[key] = setTimeout(() => {
        callback()
        delete this._timeouts[key]
      }, delay)
    },
    async updateMorgueSlot(section, index, field, value) {
      if (field === 'name') {
        const key = `morgue-${section}-${index}-name`
        this.localBuffers[key] = value
        this.debounceUpdate(key, 'name', () => {
          DispatchLib.updateMorgue(section, `slot_${index}`, { [field]: value }).then(() => {
            if (this.localBuffers[key] === value) delete this.localBuffers[key]
          })
        })
      } else {
        await DispatchLib.updateMorgue(section, `slot_${index}`, { [field]: value })
      }
    },
    async clearMorgueSlot(section, index) {
      await DispatchLib.updateMorgue(section, `slot_${index}`, {
        patientName: '',
        admissionTime: null,
        lockerNumber: '',
        items: '',
        status: ''
      })
    }
  }
}
</script>

<style>

</style>
