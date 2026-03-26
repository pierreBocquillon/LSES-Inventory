<template>
  <div class="dispatch-root" :class="{ 'is-dragging': !!draggingEmployee, 'theme--light': isLightTheme }">

        <div class="dispatch-top-headers">
      <div class="th-cell th-left">
        <v-icon size="13" class="mr-1">mdi-headset</v-icon>Status Centrale & Interventions
      </div>
      <div class="th-cell th-center d-flex align-center justify-space-between w-100 px-3">
        <div class="d-flex align-center" style="gap: 15px;">
           <div class="d-flex align-center">
             <v-icon size="13" color="cyan" class="mr-1">mdi-radio-handheld</v-icon>
             <span class="mr-1 text-grey-lighten-1">LSES:</span>
             <input v-if="isDirection && dispatch" :value="dispatch.lsesRadio" @change="Dispatch.updateField('lsesRadio', $event.target.value)" class="freq-input" placeholder="---" />
             <span v-else class="freq-display text-cyan font-weight-bold">{{ dispatch?.lsesRadio || '---' }}</span>
           </div>
           <div class="d-flex align-center">
             <v-icon size="13" color="orange" class="mr-1">mdi-radio-tower</v-icon>
             <span class="mr-1 text-grey-lighten-1">Commune:</span>
             <input v-if="isDirection && dispatch" :value="dispatch.communeRadio" @change="Dispatch.updateField('communeRadio', $event.target.value)" class="freq-input" placeholder="---" />
             <span v-else class="freq-display text-orange font-weight-bold">{{ dispatch?.communeRadio || '---' }}</span>
           </div>
        </div>

        <v-menu location="bottom" :disabled="!hasLsesPerm">
          <template v-slot:activator="{ props }">
            <span v-bind="props" class="hosp-btn" :class="`hosp-${dispatch?.hospitalStatus||'gestion_normale'}`"  :style="[hospitalStatusStyle, !hasLsesPerm ? { cursor: 'default' } : {}]">
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

        <div class="status-pill ml-3" :style="safdStatusStyle.wrapper">
          <div class="pill-icon" :style="safdStatusStyle.brand">
            <v-icon size="14" color="white" class="mr-1">{{ safdStatusConfig.brand.icon }}</v-icon>
            <span class="text-white font-weight-black" style="font-size: 0.65rem;">{{ safdStatusConfig.brand.label }}</span>
          </div>
          <div class="pill-text" :style="safdStatusStyle.status">
            {{ safdStatus || 'Inconnu' }}
          </div>
        </div>

        <a href="https://docs.google.com/spreadsheets/d/1Vho76MbebIo4d1RgpVL0wGFqbMjeK1e3HcirZV_C7Uk/edit?pli=1&gid=1466825062#gid=1466825062" target="_blank" style="text-decoration: none;" title="Ouvrir le suivi BCES">
          <div class="status-pill ml-3" :style="bcesStatusStyle.wrapper" style="cursor: pointer;">
            <div class="pill-icon" :style="bcesStatusStyle.brand">
              <v-icon size="14" color="white" class="mr-1">{{ bcesStatusConfig.brand.icon }}</v-icon>
              <span class="text-white font-weight-black" style="font-size: 0.65rem;">{{ bcesStatusConfig.brand.label }}</span>
            </div>
            <div class="pill-text" :style="bcesStatusStyle.status">
              {{ bcesStatus || 'Inconnu' }}
            </div>
          </div>
        </a>

      </div>
      <div class="th-cell">
        😴 Hors service <span class="cnt ml-1">{{ sortedUnassignedEmployees.length }}</span>
        <v-btn v-if="hasLsesPerm" icon variant="plain" size="x-small" color="warning" class="ml-2" @click="promptAddTemporaryEmployee" title="Ajouter un médecin temporaire">
          <v-icon size="14">mdi-account-plus</v-icon>
        </v-btn>
        <v-btn v-if="isDirection && hasLsesPerm" icon variant="plain" size="x-small" color="error" class="ml-auto" @click="confirmResetDispatch" title="Réinitialiser le dispatch">
          <v-icon size="14">mdi-refresh</v-icon>
        </v-btn>
      </div>
      <div class="th-cell th-right d-flex align-center justify-space-between">
        <span>📻 Radios & Notes</span>
        <v-btn icon variant="plain" size="x-small" @click="toggleTheme" title="Changer de thème">
          <v-icon size="14" :color="isLightTheme ? undefined : 'amber'">{{ isLightTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
        </v-btn>
      </div>
    </div>

        <div class="dispatch-body" style="height: 88vh; overflow: hidden; grid-template-rows: 1fr;">

            <div class="left-panel" style="height: 0; min-height: 100%; overflow: hidden;">

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
          <v-menu location="bottom start" :close-on-content-click="true" :disabled="!hasLsesPerm">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="return-badge"
                :style="dispatch?.centrale?.returnStatus ? `background:${getReturnStatus(dispatch.centrale.returnStatus)?.color}22;border-color:${getReturnStatus(dispatch.centrale.returnStatus)?.color};color:${getReturnStatus(dispatch.centrale.returnStatus)?.color}` : ''"
                @click.stop>
                {{ dispatch?.centrale?.returnStatus ? (getReturnStatus(dispatch.centrale.returnStatus)?.emoji + ' ' + getReturnStatus(dispatch.centrale.returnStatus)?.label) : '＋ Statut' }}
              </span>
            </template>
            <v-list density="compact" style="min-width:170px">
              <v-list-subheader>Statut de la centrale</v-list-subheader>
              <v-list-item v-for="rs in returnStatuses" :key="rs.value"
                :active="dispatch?.centrale?.returnStatus===rs.value"
                @click="setCentraleReturnStatus(rs.value)">
                <template v-slot:prepend><span class="mr-1">{{ rs.emoji }}</span></template>
                <v-list-item-title :style="`color:${rs.color}`">{{ rs.label }}</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item v-if="dispatch?.centrale?.returnStatus" @click="setCentraleReturnStatus(null)">
                <template v-slot:prepend><v-icon size="13" color="grey">mdi-close</v-icon></template>
                <v-list-item-title class="text-grey">Effacer</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn v-if="hasLsesPerm" icon variant="plain" size="x-small" color="error" class="ml-auto"
            @click="clearCentrale" title="Vider la centrale">
            <v-icon size="11">mdi-refresh</v-icon>
          </v-btn>
        </div>
        <div class="inter-location-row d-flex align-center">
          <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
          <input
            class="location-input"
            style="flex: 1;"
            :value="localBuffers['centrale-location'] ?? dispatch?.centrale?.location ?? ''"
            placeholder="Code ZIP / Position"
            :disabled="!hasLsesPerm"
            @input="onCentraleLocationInput($event.target.value)"
            @change="onCentraleLocationInput($event.target.value)"
            @keyup.enter="$event.target.blur()"
          />
          <select
            v-if="dispatch?.centrale"
            :value="dispatch.centrale.complement || ''"
            @change="Dispatch.updateCentrale({ complement: $event.target.value || null })"
            class="location-input ml-2"
            style="width: 85px; border-left: 2px solid #64748b; padding-left: 8px;"
            :style="{ color: dispatch?.centrale?.complement ? (complements.find(c => c.value === dispatch?.centrale?.complement)?.color || '#fff') : '#64748b' }"
            :disabled="!hasLsesPerm"
            title="Complément"
          >
            <option value="" style="background:#1a1f35; color:#64748b">Complément</option>
            <option v-for="c in complements" :key="c.value" :value="c.value" style="background:#1a1f35">{{ c.label }}</option>
          </select>
        </div>
                <div
          class="drop-slot drop-slot--inter"
          :class="{ 'drop-slot--over': dragOver==='centrale' && draggingSource !== 'centrale', 'drop-slot--filled': !!(dispatch?.centrale?.employees||[]).length }"
          @dragover.prevent="dragOver='centrale'"
          @dragleave="onDragLeave('centrale')"
          @drop.prevent="dropOn('centrale')"
        >

          <v-menu
            v-for="emp in (dispatch?.centrale?.employees||[])"
            :key="emp.employeeId"
            open-on-hover
            location="bottom"
            :disabled="!!draggingEmployee"
            offset="5"
          >
            <template #activator="{ props }">
              <div
                v-bind="props"
                class="person-card"
                :class="{ dragging: draggingEmployee?.employeeId === emp.employeeId }"
                :style="`border-left:3px solid ${getRoleColor(emp.role)};background:${getRoleColor(emp.role)}15`"
                :draggable="hasLsesPerm"
                @dragstart="startDrag(emp, 'centrale')"
                @dragend="onDragEnd"
                @click="openQuickMoveDialog(emp, 'centrale')"
              >
                <div class="pc-grip">⠿</div>
                <div class="pc-info">
                  <div class="pc-name-header">
                    <div class="pc-name">
                      {{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}
                      <v-icon
                        v-if="emp.role === 'Temporaire'"
                        size="12"
                        class="ml-1 cursor-pointer text-amber-lighten-2"
                        title="Modifier temporaire"
                        @click.stop="promptEditTemporaryEmployee(emp)"
                      >mdi-pencil</v-icon>
                    </div>
                    <v-icon v-if="hasHelicopterTraining(emp.employeeId || emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                  </div>
                  <div class="pc-phone">{{ emp.phone }}</div>
                </div>
              </div>
            </template>

            <div class="pc-popover-content" @mouseenter.stop @mouseleave.stop>
              <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`"><span class="mr-1">{{ getEmployeeEmoji(emp.employeeId || emp.id) }}</span> {{ emp.role }}</div>
              <div class="pc-validations" v-if="getValidationBadges(emp.employeeId).length">
                <span v-for="b in getValidationBadges(emp.employeeId)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
              </div>
              <div class="pc-specs">
                <span v-for="sv in (emp.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
              </div>

              <template v-if="(dispatch?.centrale?.employees||[]).indexOf(emp) > 0">
                <v-menu location="top start" :close-on-content-click="true" :disabled="!hasLsesPerm">
                  <template v-slot:activator="{ props: roleProps }">
                    <span v-bind="roleProps" class="return-badge mt-1"
                      :style="emp.centralRole ? `background:${getCentralRole(emp.centralRole)?.color}22;border-color:${getCentralRole(emp.centralRole)?.color};color:${getCentralRole(emp.centralRole)?.color}` : ''"
                      @click.stop>
                      {{ emp.centralRole ? (getCentralRole(emp.centralRole)?.emoji + ' ' + getCentralRole(emp.centralRole)?.label) : '＋ Rôle' }}
                    </span>
                  </template>
                  <v-list density="compact" style="min-width:185px">
                    <v-list-subheader>Rôle à la centrale</v-list-subheader>
                    <v-list-item v-for="cr in centralRoles" :key="cr.value"
                      :active="emp.centralRole===cr.value"
                      @click="setCentraleEmpRole(emp.employeeId || emp.id, cr.value)">
                      <template v-slot:prepend><span class="mr-1">{{ cr.emoji }}</span></template>
                      <v-list-item-title :style="`color:${cr.color}`">{{ cr.label }}</v-list-item-title>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item v-if="emp.centralRole" @click="setCentraleEmpRole(emp.employeeId || emp.id, null)">
                      <template v-slot:prepend><v-icon size="13" color="grey">mdi-close</v-icon></template>
                      <v-list-item-title class="text-grey">Effacer</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </div>
          </v-menu>
        </div>

                <div class="slot-section-title mt-2">
          🚑 Interventions
          <v-btn v-if="hasLsesPerm" size="x-small" variant="plain" color="white" class="ml-auto" @click="addInterventionSlot">
            <v-icon size="13">mdi-plus</v-icon>
          </v-btn>
        </div>

        <div class="interventions-list" style="flex: 1; min-height: 0; overflow-y: auto;">
          <div v-for="slot in (dispatch?.interventions||[])" :key="slot.id" class="inter-slot">
                        <div class="inter-type-row">
                            <v-menu location="bottom start" :close-on-content-click="true" :disabled="!hasLsesPerm">
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
                            <v-menu location="bottom start" :close-on-content-click="true" :disabled="!hasLsesPerm">
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
              <v-btn v-if="hasLsesPerm" icon variant="plain" size="x-small" color="error" class="ml-auto"
                :key="`btn-${slot.id}-${(slot.employees?.length || slot.location || slot.complement || slot.returnStatus || slot.type !== 'intervention') ? 'reset' : 'delete'}`"
                @click="removeInterventionSlot(slot)" :title="(slot.employees?.length || slot.location || slot.complement || slot.returnStatus || slot.type !== 'intervention') ? 'Réinitialiser ce slot' : 'Supprimer ce slot'">
                <v-icon size="11">{{ (slot.employees?.length || slot.location || slot.complement || slot.returnStatus || slot.type !== 'intervention') ? 'mdi-refresh' : 'mdi-close' }}</v-icon>
              </v-btn>
            </div>
            <div class="inter-location-row d-flex align-center">
              <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
              <input
                :id="`zip-input-${slot.id}`"
                class="location-input"
                style="flex: 1;"
                :value="localBuffers[`${slot.id}-location`] ?? slot.location ?? ''"
                placeholder="Code ZIP / Position"
                :disabled="!hasLsesPerm"
                @input="onInterSlotLocationInput(slot, $event.target.value)"
                @change="onInterSlotLocationInput(slot, $event.target.value)"
                @keyup.enter="$event.target.blur()"
              />
              <select
                :value="slot.complement || ''"
                @change="Dispatch.updateIntervention(slot.id, { complement: $event.target.value || null })"
                class="location-input ml-2"
                style="width: 85px; border-left: 2px solid #64748b; padding-left: 8px;"
                :style="{ color: slot.complement ? (complements.find(c => c.value === slot.complement)?.color || '#fff') : '#64748b' }"
                :disabled="!hasLsesPerm"
                title="Complément"
              >
                <option value="" style="background:#1a1f35; color:#64748b">Complément</option>
                <option v-for="c in complements" :key="c.value" :value="c.value" style="background:#1a1f35">{{ c.label }}</option>
              </select>
            </div>
                        <div
              class="drop-slot drop-slot--inter"
              :class="{ 'drop-slot--over': dragOver===`inter:${slot.id}` && draggingSource !== `inter:${slot.id}`, 'drop-slot--filled': !!(slot.employees||[]).length }"
              @dragover.prevent="dragOver=`inter:${slot.id}`"
              @dragleave="onDragLeave(`inter:${slot.id}`)"
              @drop.prevent="dropOn(`inter:${slot.id}`)"
            >

              <v-menu
                v-for="emp in (slot.employees||[])"
                :key="emp.employeeId"
                open-on-hover
                location="bottom"
                :disabled="!!draggingEmployee"
                offset="5"
              >
                <template #activator="{ props }">
                  <div
                    v-bind="props"
                    class="person-card person-card--inter"
                    :class="{ dragging: draggingEmployee?.employeeId === emp.employeeId }"
                    :style="`border-left:3px solid ${getRoleColor(emp.role)};background:${getRoleColor(emp.role)}15`"
                    draggable="true"
                    @dragstart="startDrag(emp, `inter:${slot.id}`)"
                    @dragend="onDragEnd"
                    @contextmenu.prevent="openQuickMoveDialog(emp, `inter:${slot.id}`)"
                  >
                    <div class="pc-grip">⠿</div>
                    <div class="pc-info">
                      <div class="pc-name-header">
                        <div class="pc-name">
                          {{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}
                          <v-icon
                            v-if="emp.role === 'Temporaire'"
                            size="12"
                            class="ml-1 cursor-pointer text-amber-lighten-2"
                            title="Modifier temporaire"
                            @click.stop="promptEditTemporaryEmployee(emp)"
                          >mdi-pencil</v-icon>
                        </div>
                        <v-icon v-if="hasHelicopterTraining(emp.employeeId || emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                      </div>
                      <div class="pc-phone">{{ emp.phone }}</div>
                    </div>
                  </div>
                </template>

                <div class="pc-popover-content" @mouseenter.stop @mouseleave.stop>
                  <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`"><span class="mr-1">{{ getEmployeeEmoji(emp.employeeId || emp.id) }}</span> {{ emp.role }}</div>
                  <div class="pc-validations" v-if="getValidationBadges(emp.employeeId).length">
                    <span v-for="b in getValidationBadges(emp.employeeId)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
                  </div>
                  <div class="pc-specs">
                    <span v-for="sv in (emp.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
                  </div>
                </div>
              </v-menu>
                            <div v-if="slot.location && !(slot.employees || []).length" class="to-take-indicator">
                <v-icon size="14" class="mr-1 pulse-animation">mdi-alert-circle</v-icon>
                À PRENDRE
              </div>
            </div>
          </div>

          <div v-if="!dispatch?.interventions?.length" class="text-caption text-grey pa-2">
            Appuyez sur + pour ajouter un slot
          </div>
        </div>
      </div>

      <div class="center-panel">
        <div 
          class="patate-content-area" 
          :class="{ 'drop-over': dragOver==='cat:en_service' && draggingSource !== 'cat:en_service' }"
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
              :class="{ dragging: draggingEmployee?.id === p.id }"
              :style="`border-left:3px solid ${getRoleColor(p.role)};background:${getRoleColor(p.role)}15`"
              :draggable="hasLsesPerm"
              @dragstart="startDrag(p, `cat:en_service`)"
              @dragend="onDragEnd"
              @click="openQuickMoveDialog(p, `cat:en_service`)"
            >
              <div class="pc-grip">⠿</div>
                <div class="pc-info">
                  <div class="pc-name-header">
                    <div class="pc-name">
                      {{ getEmployeeEmoji(p.employeeId || p.id) }} {{ p.name?.split(' ')[0] }}
                      <v-icon
                        v-if="p.role === 'Temporaire'"
                        size="12"
                        class="ml-1 cursor-pointer text-amber-lighten-2"
                        title="Modifier temporaire"
                        @click.stop="promptEditTemporaryEmployee(p)"
                      >mdi-pencil</v-icon>
                    </div>
                    <v-icon v-if="hasHelicopterTraining(p.employeeId || p.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                  </div>
                <div class="pc-phone">{{ p.phone }}</div>
                <div class="pc-validations" v-if="getValidationBadges(p.employeeId).length">
                  <span v-for="b in getValidationBadges(p.employeeId)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
                </div>
                <div class="pc-specs">
                  <span v-for="sv in (p.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
                </div>
                <div class="pc-role" :style="`color:${getRoleColor(p.role)}`">{{ p.role }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="inner-bottom-categories mt-auto" style="border-top: 1px solid #334155; min-height:300px;"
          @dragover.stop
          @dragleave.stop
          @drop.stop
        >
          <div
            v-for="cat in bottomCategories"
            :key="cat.value"
            class="inner-bottom-panel"
            :class="{ 'drop-over': dragOver===`cat:${cat.value}` && draggingSource !== `cat:${cat.value}` }"
            @dragover.stop.prevent="dragOver=`cat:${cat.value}`"
            @dragleave.stop="onDragLeave(`cat:${cat.value}`)"
            @drop.stop.prevent="dropOn(`cat:${cat.value}`)"
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
                :class="{ dragging: draggingEmployee?.employeeId === p.employeeId }"
                :style="`border-left:3px solid ${getRoleColor(p.role)};background:${getRoleColor(p.role)}15`"
                :draggable="hasLsesPerm"
                @dragstart="startDrag(p, `cat:${cat.value}`)"
                @dragend="onDragEnd"
                @click="openQuickMoveDialog(p, `cat:${cat.value}`)"
              >
                <div class="pc-info">
                  <div class="pc-name-header">
                    <div class="pc-name">
                      {{ getEmployeeEmoji(p.employeeId || p.id) }} {{ p.name?.split(' ')[0] }}
                      <v-icon
                        v-if="p.role === 'Temporaire'"
                        size="12"
                        class="ml-1 cursor-pointer text-amber-lighten-2"
                        title="Modifier temporaire"
                        @click.stop="promptEditTemporaryEmployee(p)"
                      >mdi-pencil</v-icon>
                    </div>
                    <v-icon v-if="hasHelicopterTraining(p.employeeId || p.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                  </div>
                  <div class="pc-phone">{{ p.phone }}</div>
                  <div class="pc-validations" v-if="getValidationBadges(p.employeeId || p.id).length">
                    <span v-for="b in getValidationBadges(p.employeeId || p.id)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
                  </div>
                  <div class="pc-specs">
                    <span v-for="sv in (p.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
                  </div>
                <div class="pc-role" :style="`color:${getRoleColor(p.role)}`">{{ p.role }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

            <div
        class="right-panel"
        :class="{ 'drop-over': dragOver==='hs' && draggingSource !== 'hs' }"
        @dragover.prevent="dragOver='hs'"
        @dragleave="onDragLeave('hs')"
        @drop.prevent="dropOn('hs')"
      >

        <div class="hs-grid">
          <div
            v-for="emp in sortedUnassignedEmployees"
            :key="emp.id"
            class="person-card person-card--hs"
            :class="{ dragging: draggingEmployee?.id === emp.id }"
            :style="`border-left: 3px solid ${getRoleColor(emp.role)}; background: ${getRoleColor(emp.role)}15`"
            :draggable="hasLsesPerm"
            @dragstart="startDrag(emp, 'hs')"
            @dragend="onDragEnd"
            @click="openQuickMoveDialog(emp, 'hs')"
          >
            <div class="pc-info">
              <div class="pc-name-header">
                <div class="pc-name">
                  {{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}
                  <v-icon
                    v-if="emp.role === 'Temporaire'"
                    size="12"
                    class="ml-1 cursor-pointer text-amber-lighten-2"
                    title="Modifier temporaire"
                    @click.stop="promptEditTemporaryEmployee(emp)"
                  >mdi-pencil</v-icon>
                </div>
                <v-icon v-if="hasHelicopterTraining(emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
              </div>
              <div class="pc-phone">{{ emp.phone }}</div>
              <div class="pc-validations" v-if="getValidationBadges(emp.id).length">
                <span v-for="b in getValidationBadges(emp.id)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
              </div>
              <div class="pc-specs">
                <span v-for="sv in (emp.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
              </div>
              <div class="pc-role" :style="`color:${getRoleColor(emp.role)}`">{{ emp.role }}</div>
            </div>
          </div>
        </div>
        <div v-if="!sortedUnassignedEmployees.length" class="text-center text-grey text-caption pa-3">Tous assignés</div>
        
        <div class="vehicles-info-wrapper mt-auto pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-1 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-car-wrench</v-icon> État Flotte
          </div>
          <div class="text-caption text-grey-lighten-2 mb-2 ml-1" style="font-size: 0.65rem;">
            Dernière répa flotte : <span :class="['font-weight-bold', lastRepairColorClass]">{{ lastRepairDateStr }}</span>
          </div>
          
          <div v-if="guardVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-orange-lighten-2" style="font-size: 0.65rem;">🛡️ Gardiennage</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in guardVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #ffb74d; color: #ffb74d; background: rgba(255,183,77,0.1)">
                {{ v.name }} {{ allLocations.find(l => l.value === v.where)?.text || v.where }}{{ v.recupDate ? ` - ${formatDateTime(v.recupDate)}` : '' }}
              </span>
            </div>
          </div>
          
          <div v-if="fouriereVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-red-lighten-2 mt-1" style="font-size: 0.65rem;">⛔ Fourrière</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in fouriereVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #e57373; color: #e57373; background: rgba(229,115,115,0.1)">
                {{ v.name }}{{ v.recupDate ? ` - ${formatDateTime(v.recupDate)}` : '' }}
              </span>
            </div>
          </div>
          
          <div v-if="insuranceVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-blue-lighten-2 mt-1" style="font-size: 0.65rem;">📄 Demande Assurance</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in insuranceVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #64b5f6; color: #64b5f6; background: rgba(100,181,246,0.1)">
                {{ v.name }}{{ v.recupDate ? ` (🗓️ ${formatDateTime(v.recupDate)})` : '' }}
              </span>
            </div>
          </div>
          
          <div v-if="needRepairVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-purple-lighten-2 mt-1" style="font-size: 0.65rem;">🔧 À Réparer</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in needRepairVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #ce93d8; color: #ce93d8; background: rgba(206,147,216,0.1)">
                {{ v.name }}{{ v.recupDate ? ` (🗓️ ${formatDateTime(v.recupDate)})` : '' }}
              </span>
            </div>
          </div>
        </div>

        <div class="stock-info-wrapper pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-1 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-clipboard-text-outline</v-icon> TODO
          </div>
          <div v-for="storage in storageUpdates" :key="storage.id" class="text-caption text-grey-lighten-2 ml-1" style="font-size: 0.65rem; line-height: 1.2;">
            Dernière MAJ {{ storage.name }} : <span :class="['font-weight-bold', storage.colorClass]">{{ storage.dateStr }}</span>
          </div>
          <div v-for="item in todoOrders" :key="item.id" class="text-caption ml-1" :class="item.colorClass" style="font-size: 0.65rem; line-height: 1.2;">
            {{ item.icon }} {{ item.label }} {{ item.companyName }} : <span class="font-weight-bold">{{ Math.round(item.totalWeight * 10) / 10 }} kg</span>
          </div>
        </div>
      </div>

      <div class="far-right-panel">

        <div class="radios-wrapper pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-flex align-center flex-shrink-0">
            <v-icon size="14" class="mr-1">mdi-radio-handheld</v-icon> Stock Radios
            <span class="cnt ml-2" title="Radios standards prises / total">{{ standardRadios.filter(r => r.employeeId).length }} / {{ standardRadios.length }}</span>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn v-if="isDirection && hasLsesPerm" v-bind="props" size="x-small" variant="plain" color="white" class="ml-auto" title="Ajouter une radio">
                  <v-icon size="13">mdi-plus</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" style="min-width: 150px">
                <v-list-item @click="addRadio('standard')">
                  <template v-slot:prepend><v-icon size="14" class="mr-2">mdi-radio-handheld</v-icon></template>
                  <v-list-item-title>Radio Standard</v-list-item-title>
                </v-list-item>
                <v-list-item @click="addRadio('direction')">
                  <template v-slot:prepend><v-icon size="14" class="mr-2" color="amber">mdi-star</v-icon></template>
                  <v-list-item-title>Radio Direction</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div class="mb-2 d-flex align-center bg-transparent flex-shrink-0" v-if="(dispatch?.radios||[]).length && isDirection">
             <span class="text-caption font-weight-bold text-grey-lighten-1 mr-2"><v-icon size="12" class="mr-1">mdi-weather-night</v-icon> Nuit:</span>
             <select v-if="isDirection && dispatch" :value="dispatch.nuitRadioId || ''" @change="Dispatch.updateField('nuitRadioId', $event.target.value || null)" class="location-input mx-1" style="border: 1px solid #334155; padding:2px; border-radius:4px; max-width:130px; font-weight:bold;">
                <option value="" style="background:#1a1f35">-- Aucune --</option>
                <option v-for="rad in dispatch?.radios||[]" :key="rad.id" :value="rad.id" style="background:#1a1f35">{{ rad.serial || rad.id.slice(0,4) }}</option>
             </select>
             <span v-else class="text-caption font-weight-bold text-amber-lighten-2 mx-1 px-2 py-1" style="border: 1px solid #334155; border-radius:4px;">
                {{ (dispatch?.radios||[]).find(r => r.id === dispatch?.nuitRadioId)?.serial || 'Aucune' }}
             </span>
          </div>
          <div class="radios-list" style="flex: 1; overflow-y: auto;">
            <template v-for="group in [
              { title: 'Direction', radios: directionRadios, color: 'text-amber-lighten-2' },
              { title: 'Standard', radios: standardRadios, color: 'text-grey-lighten-1' }
            ]" :key="group.title">
              <template v-if="group.radios.length">
                <div :class="['text-caption font-weight-bold mt-1 mb-1', group.color]" style="font-size: 0.65rem; letter-spacing: 0.05em;">{{ group.title.toUpperCase() }}</div>
                <div v-for="radio in group.radios" :key="radio.id" class="radio-item d-flex align-center mb-1 pa-1" :style="['background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid', radio.id === dispatch?.nuitRadioId ? '#f59e0b' : '#334155'].join(' ')">
                  <input v-if="isDirection && hasLsesPerm" :value="radio.serial" @change="Dispatch.updateRadio(radio.id, { serial: $event.target.value })" class="location-input" style="width:50px; font-weight:bold" placeholder="# Série" />
                  <span v-else class="text-caption font-weight-bold mx-1" style="width:50px; display:inline-block; color:#94a3b8; text-align:center;">{{ radio.serial || '---' }}</span>
                   <select :disabled="radio.category === 'direction' && !isDirection" :value="radio.employeeId" @change="onRadioAssign(radio, $event.target.value)" class="location-input mx-1" style="border-left:1px solid #334155; padding-left:4px; max-width: 120px;">
                     <option :value="''" style="background:#1a1f35">-- Assigner --</option>
                     <option v-for="emp in getRadioEmployeeOptions(radio)" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
                   </select>
                  <v-btn size="x-small" :color="radio.status === 'on' ? 'success' : 'error'" variant="tonal" class="ml-auto px-1" style="min-width: 32px; height: 18px; font-size: 0.6rem;" :style="!hasLsesPerm ? 'pointer-events: none;' : ''" @click="toggleRadioStatus(radio)">
                    {{ radio.status === 'on' ? 'ON' : 'OFF' }}
                  </v-btn>
                  <v-btn v-if="isDirection && hasLsesPerm" icon variant="plain" size="x-small" color="error" class="ml-1" @click="removeRadio(radio)" style="height:18px; width:18px">
                    <v-icon size="12">mdi-close</v-icon>
                  </v-btn>
                </div>
              </template>
            </template>
            <div v-if="!(dispatch?.radios||[]).length" class="text-center text-grey text-caption mt-2">Aucune radio.</div>
          </div>
        </div>

        <div class="notepad-wrapper pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-notebook</v-icon> Bloc-notes
          </div>
          <textarea
            v-if="isDirection && dispatch"
            :value="localBuffers['global-notepad'] ?? dispatch.notepad"
            @input="onNotepadInput($event.target.value)"
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

    <DispatchCrisis
      :dispatch="dispatch"
      :isLightTheme="isLightTheme"
      :currentTime="currentTime"
      :allEmployees="allEmployees"
      :currentUserEmployeeId="currentUserEmployeeId"
      :currentUserProfileId="userStore.profile?.id"
      :affiliations="affiliations"
      :isDirection="isDirection"
    />

    <DispatchBeds :dispatch="dispatch" :isLightTheme="isLightTheme" />

    <DispatchMorgue :dispatch="dispatch" :affiliations="affiliations" />


    <v-dialog v-model="quickAddDialog" max-width="360">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4">Déplacer {{ quickAddEmployee?.name }}</v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-2 mb-3">Choisir un nouveau statut :</p>
          <div class="d-flex flex-wrap" style="gap:8px">
            <template v-for="cat in allCategories" :key="cat.value">
              <v-btn v-if="quickMoveSourceKey !== 'cat:' + cat.value"
                :color="cat.color" variant="tonal" size="small"
                @click="confirmQuickAdd(cat.value)">
                {{ cat.emoji }} {{ cat.label }}
              </v-btn>
            </template>
            <v-btn v-if="quickMoveSourceKey !== 'hs'" color="error" variant="tonal" size="small" @click="confirmQuickAdd('hs')">
              😴 Hors service
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
import Company from '@/classes/Company.js'
import Dispatch from '@/classes/Dispatch.js'
import Employee from '@/classes/Employee.js'
import Specialty from '@/classes/Specialty.js'
import Vehicle from '@/classes/Vehicle.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import {
  allCategories,
  interventionTypes,
  returnStatuses,
  centralRoles,
  hospitalStatuses,
  safdStatusConfig,
  bcesStatusConfig,
  crisisMedicalStatuses,
  crisisBeds,
  crisisBedGroups,
  complements,
  crisisRowColors
} from '@/config/dispatch.js'
import { trainingCompetencies } from '@/config/training_competencies.js'
import { roleOrder, getRoleColor as getRoleColorConfig } from '@/config/roles.js'
import logger from '@/functions/logger.js'
import vehiclesLocations from '@/config/vehiclesLocations.js'
import { initNotifManager, stopNotifManager, notifState, alerts } from '@/functions/nofifManager.js'

import DispatchMorgue from '@/components/dispatch/DispatchMorgue.vue'
import DispatchBeds from '@/components/dispatch/DispatchBeds.vue'
import DispatchCrisis from '@/components/dispatch/DispatchCrisis.vue'

export default {
  components: { DispatchMorgue, DispatchBeds, DispatchCrisis },
  data() {
    return {
      userStore: useUserStore(),
      dispatch: null,
      employees: [],
      safdStatus: null,
      safdInterval: null,
      bcesStatus: null,
      bcesInterval: null,
      specialties: [],
      vehicles: [],
      companies: [],
      unsub: null,
      unsubEmployees: null,
      unsubSpecialties: null,
      unsubVehicles: null,
      unsubCompanies: null,
      unsubAffiliations: null,
      currentTime: Date.now(),
      timeInterval: null,

      draggingEmployee: null,
      draggingSource: null,   
      dragOver: null,         

      addDialog: false,
      addDialogCategoryValue: null,
      selectedEmployee: null,
      quickAddDialog: false,
      quickAddEmployee: null,
      quickMoveSourceKey: null,

      isLightTheme: localStorage.getItem('dispatch_light_theme') === 'true',
      affiliations: [],
      _timeouts: {},
      localBuffers: {},
      lastSyncedCentrale: { name: '', phone: '' },
    }
  },

  computed: {
    isDirection() {
      const currentUserId = this.userStore.profile?.id
      if (!currentUserId || !this.employees) return false
      const currentEmployee = this.employees.find(e => e.userId === currentUserId)

      if (!currentEmployee) return false
      return ['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)
    },

    currentUserEmployeeId() {
      const currentUserId = this.userStore.profile?.id
      const currentEmployee = this.employees.find(e => e.userId === currentUserId)
      return currentEmployee ? currentEmployee.id : null
    },

    hasLsesPerm() {
      return (this.userStore.profile?.permissions || []).some(p => ['lses', 'dev', 'admin'].includes(p))
    },

    bottomCategories() { return this.allCategories.filter(c => c.value !== 'en_service') },

    hospitalStatusMeta() {
      if (!this.dispatch) return this.hospitalStatuses[0]
      return this.hospitalStatuses.find(s => s.value === this.dispatch.hospitalStatus) || this.hospitalStatuses[0]
    },
    allLocations() {
      let locs = [...this.locations]
      ;(this.companies || []).forEach(company => {
        if (company.isGarage) {
          locs.push({
            value: company.id,
            text: `${company.icon} ${company.name}`,
            home: false,
          })
        }
      })
      return Object.freeze(locs)
    },
    hospitalStatusStyle() {
      const meta = this.hospitalStatusMeta
      if (this.isLightTheme) {
        return {
          color: meta.lightColor || meta.color,
          background: meta.lightBg || 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(0,0,0,0.1)'
        }
      }
      return {
        color: meta.color,
        background: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)'
      }
    },
    safdStatusStyle() {
      const status = (this.safdStatus || '').toLowerCase()
      const mode = this.isLightTheme ? 'light' : 'dark'
      let key = 'default'
      if (status.includes('dispo') && !status.includes('indispo')) key = 'dispo'
      else if (status.includes('indispo')) key = 'indispo'
      
      const config = this.safdStatusConfig[key][mode]
      const brandColor = this.safdStatusConfig.brand.color
      
      return {
        wrapper: { borderColor: config.border, background: config.bg },
        brand: { background: brandColor },
        status: { color: config.color }
      }
    },
    bcesStatusStyle() {
      const status = (this.bcesStatus || '').toLowerCase()
      const mode = this.isLightTheme ? 'light' : 'dark'
      let key = 'default'
      if (status.includes('dispo') && !status.includes('indispo')) key = 'dispo'
      else if (status.includes('indispo')) key = 'indispo'
      else if (status.includes('nuit')) key = 'nuit'
      
      const config = this.bcesStatusConfig[key][mode]
      const brandColor = this.bcesStatusConfig.brand.color
      
      return {
        wrapper: { borderColor: config.border, background: config.bg },
        brand: { background: brandColor },
        status: { color: config.color }
      }
    },

    allEmployees() {
      const dbEmps = this.employees.map(e => ({
        id: e.id,
        employeeId: e.id,
        name: e.name || '',
        phone: e.phone || '',
        role: e.role || '',
        allSpecialties: e.specialties || [],
        displayLabel: e.phone ? `${e.name || ''} — ${e.phone}` : (e.name || ''),
      }))
      const tempEmps = (this.dispatch?.temporaryEmployees || []).map(e => ({
        id: e.id,
        employeeId: e.id,
        name: e.name || '',
        phone: e.phone || '',
        role: 'Temporaire',
        allSpecialties: [],
        displayLabel: e.phone ? `${e.name || ''} — ${e.phone}` : (e.name || ''),
      }))
      return Object.freeze([...dbEmps, ...tempEmps])
    },

    usedEmployeeIds() {
      if (!this.dispatch) return new Set()
      const ids = []
      
      ;(this.dispatch.interventions||[]).forEach(s => { (s.employees||[]).forEach(e => ids.push(e.employeeId)) })
      this.dispatch.patates.forEach(p => { if (p.employeeId) ids.push(p.employeeId) })
      if (this.dispatch.centrale && this.dispatch.centrale.employees)
        this.dispatch.centrale.employees.forEach(e => { if (e.employeeId) ids.push(e.employeeId) })
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
    directionRadios() { return (this.dispatch?.radios||[]).filter(r => r.category === 'direction') },
    standardRadios() { return (this.dispatch?.radios||[]).filter(r => r.category !== 'direction') },
    addDialogCategory()   { return this.allCategories.find(c => c.value === this.addDialogCategoryValue) || null },
    lastRepairDateStr() {
      if (!this.vehicles || !this.vehicles.length) return 'Aucune'
      const withDates = this.vehicles.filter(v => v.lastRepairDate)

      if (!withDates || !withDates.length) return 'Aucune'
      const latest = withDates.sort((a,b) => b.lastRepairDate - a.lastRepairDate)[0]

      if (!latest || !latest.lastRepairDate) return 'Aucune'
      const date = new Date(latest.lastRepairDate)

      return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    },
    lastRepairColorClass() {
      if (!this.vehicles || !this.vehicles.length) return this.isLightTheme ? 'text-grey-darken-3' : 'text-white'
      const withDates = this.vehicles.filter(v => v.lastRepairDate)
      if (!withDates || !withDates.length) return this.isLightTheme ? 'text-grey-darken-3' : 'text-white'

      const latest = withDates.sort((a,b) => b.lastRepairDate - a.lastRepairDate)[0]
      if (!latest || !latest.lastRepairDate) return this.isLightTheme ? 'text-grey-darken-3' : 'text-white'

      const diff = this.currentTime - latest.lastRepairDate
      const hours = diff / (1000 * 60 * 60)

      if (hours >= 48) return 'text-red-lighten-1'
      if (hours >= 24) return 'text-orange-lighten-1'
      return this.isLightTheme ? 'text-grey-darken-3' : 'text-white'
    },
    fouriereVehicles() {
      return (this.vehicles || []).filter(v => v.where === 'fouriere')
    },
    guardVehicles() {
      return (this.vehicles || []).filter(v => v.underGuard)
    },
    insuranceVehicles() {
      return (this.vehicles || []).filter(v => v.insurance)
    },
    needRepairVehicles() {
      return (this.vehicles || []).filter(v => v.needRepair)
    },

    directionEmployeesForRadio() {
      return this.employees.filter(e => ['Directeur', 'Directeur Adjoint'].includes(e.role))
    },


    storageUpdates() {
      if (!notifState.storages || !notifState.saveDates) return []
      return notifState.storages.map(storage => {
        const saveDate = notifState.saveDates[storage.id]
        const ts = saveDate ? saveDate.date : 0
        let dateStr = 'Aucune'
        let colorClass = this.isLightTheme ? 'text-grey-darken-3' : 'text-white'

        if (ts) {
          const date = new Date(ts)
          dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const diff = this.currentTime - ts
          const hours = diff / (1000 * 60 * 60)
          if (hours >= 24) colorClass = 'text-red-lighten-1'
          else if (hours >= 12) colorClass = 'text-orange-lighten-1'
        }

        return {
          id: storage.id,
          name: (storage.icon ? storage.icon + ' ' : '') + storage.name,
          dateStr,
          colorClass
        }
      })
    },
    todoOrders() {
      return (alerts.value || []).filter(a => a.maxAlertLevel >= 1)
        .map(a => ({
          id: 'alert-' + a.company.id,
          companyName: a.company.name,
          icon: '⚠️',
          label: 'Préparation',
          totalWeight: a.totalWeight,
          colorClass: a.maxAlertLevel >= 2 ? 'text-red-lighten-1' : 'text-primary'
        }))
    },
  },

  watch: {
    'dispatch.crisisZip'(newVal) {
      if (document.activeElement?.classList.contains('crisis-zip-input')) return
      this.localCrisisZip = newVal || ''
    },
    isLightTheme(val) { localStorage.setItem('dispatch_light_theme', val) },
  },

  created() {
    this.Dispatch = Dispatch;
    this.allCategories = allCategories;
    this.interventionTypes = interventionTypes;
    this.returnStatuses = returnStatuses;
    this.centralRoles = centralRoles;
    this.hospitalStatuses = hospitalStatuses;
    this.crisisMedicalStatuses = crisisMedicalStatuses;
    this.crisisBeds = crisisBeds;
    this.crisisBedGroups = crisisBedGroups;
    this.complements = complements;
    this.crisisRowColors = crisisRowColors;
    this.safdStatusConfig = safdStatusConfig;
    this.bcesStatusConfig = bcesStatusConfig;
    this.locations = vehiclesLocations;
  },

  mounted() {
    this.fetchSafdStatus()
    this.safdInterval = setInterval(this.fetchSafdStatus, 60000)

    this.fetchBcesStatus()
    this.bcesInterval = setInterval(this.fetchBcesStatus, 60000)

    this.unsub = Dispatch.listenGlobal(d => {
      this.dispatch = Object.freeze(d)
      if (d && !this.localCrisisZip && !document.activeElement?.classList.contains('crisis-zip-input')) {
        this.localCrisisZip = d.crisisZip || ''
      }
      this.syncCentraleGSheet(d)
    })
    this.unsubEmployees = Employee.listenAll(list => {
      this.employees = Object.freeze([...list].sort((a,b) => (a.name||'').localeCompare(b.name||'')))
    })
    this.unsubSpecialties = Specialty.listenAll(list => { this.specialties = Object.freeze(list) })
    this.unsubVehicles = Vehicle.listenAll(list => { this.vehicles = Object.freeze(list) })
    this.unsubCompanies = Company.listenAll(list => { this.companies = Object.freeze(list) })
    this.unsubAffiliations = Dispatch.listenAffiliations(list => { this.affiliations = Object.freeze(list) })

    initNotifManager()

    this.currentTime = Date.now()
    this.timeInterval = setInterval(() => {
      this.currentTime = Date.now()
    }, 1000)
  },

  beforeUnmount() {
    if (this.safdInterval) clearInterval(this.safdInterval)
    if (this.bcesInterval) clearInterval(this.bcesInterval)
    if (this.unsub) this.unsub()
    if (this.unsubEmployees) this.unsubEmployees()
    if (this.unsubSpecialties) this.unsubSpecialties()
    if (this.unsubVehicles) this.unsubVehicles()
    if (this.unsubCompanies) this.unsubCompanies()
    if (this.unsubAffiliations) this.unsubAffiliations()
    stopNotifManager()
    if (this.timeInterval) clearInterval(this.timeInterval)
  },

  methods: {
    toggleTheme() {
      this.isLightTheme = !this.isLightTheme;
    },

    syncCentraleGSheet(d) {
      const data = d || this.dispatch
      if (!data?.centrale?.employees) return

      const employees = data.centrale.employees
      let name = '';
      let phone = '';
      if (employees && employees.length > 0) {
        name = employees[0].name || '';
        phone = employees[0].phone || '';
      }

      if (this.lastSyncedCentrale.name === name && this.lastSyncedCentrale.phone === phone) return
      this.lastSyncedCentrale = { name, phone }
      
      try {
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec';
        fetch(`${WEB_APP_URL}?action=updateCentrale&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`, { mode: 'no-cors' });
      } catch (err) {
        console.error("Erreur synchro GSheet Centrale", err);
      }
    },


    getRadioEmployeeOptions(radio) {
      if (!this.dispatch) return []

      if (radio.category === 'direction') {
        const dirEmps = this.employees.filter(e => ['Directeur', 'Directeur Adjoint'].includes(e.role))
        if (radio.employeeId && !dirEmps.find(e => e.id === radio.employeeId)) {
          const current = this.allEmployees.find(e => e.id === radio.employeeId)
          if (current) return [...dirEmps, current]
        }
        return dirEmps
      }

      const ids = new Set()
      if (this.dispatch.centrale?.employees)
        this.dispatch.centrale.employees.forEach(e => ids.add(e.employeeId))
      ;(this.dispatch.interventions || []).forEach(s => (s.employees || []).forEach(e => ids.add(e.employeeId)))
      ;(this.dispatch.patates || []).forEach(p => { if (p.employeeId) ids.add(p.employeeId) })

      const inService = this.allEmployees.filter(e => ids.has(e.id))

      if (radio.employeeId && !inService.find(e => e.id === radio.employeeId)) {
        const current = this.allEmployees.find(e => e.id === radio.employeeId)
        if (current) return [...inService, current]
      }
      return inService
    },

    confirmResetDispatch() {
      if (!this.hasLsesPerm) return
      Swal.fire({
        title: 'Réinitialiser le dispatch ?',
        text: 'Tout le monde sera mis en "Hors service", les interventions seront vidées, et toutes les radios seront éteintes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, réinitialiser',
        cancelButtonText: 'Annuler',
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetDispatch();
        }
      });
    },

    promptAddTemporaryEmployee() {
      if (!this.hasLsesPerm) return
      Swal.fire({
        title: 'Ajout temporaire',
        html: `
          <input id="swal-temp-name" class="swal2-input" placeholder="Prénom/Nom" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
          <input id="swal-temp-phone" class="swal2-input" placeholder="Téléphone" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
          <div style="text-align: left; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; font-size: 0.9rem; margin-top: 10px;">
            <div style="margin-bottom: 5px; color: #94a3b8; font-weight: bold;">Validations :</div>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-dds" style="accent-color: #3b82f6; width: 14px; height: 14px;"> DDS (🩸)</label>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vc" style="accent-color: #3b82f6; width: 14px; height: 14px;"> VC (🩺)</label>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vm" style="accent-color: #3b82f6; width: 14px; height: 14px;"> VM (⚕️)</label>
            <label style="display: block; cursor: pointer;"><input type="checkbox" id="swal-temp-airbag" style="accent-color: #3b82f6; width: 14px; height: 14px;"> Airbag (🚔)</label>
          </div>
        `,
        focusConfirm: false,
        background: '#1e293b',
        color: '#fff',
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
        preConfirm: () => {
          const name = document.getElementById('swal-temp-name').value.trim()
          const phone = document.getElementById('swal-temp-phone').value.trim()
          if (!name) {
            Swal.showValidationMessage("Le nom est obligatoire")
            return false
          }
          const validations = []
          if (document.getElementById('swal-temp-dds').checked) validations.push('dds')
          if (document.getElementById('swal-temp-vc').checked) validations.push('vc')
          if (document.getElementById('swal-temp-vm').checked) validations.push('vm')
          if (document.getElementById('swal-temp-airbag').checked) validations.push('avp_airbag')

          return { name, phone, validations }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          await Dispatch.addTemporaryEmployee({
            name: result.value.name,
            phone: result.value.phone || '',
            validations: result.value.validations || []
          });
        }
      })
    },

    promptEditTemporaryEmployee(empInfo) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return;
      
      const realId = empInfo.employeeId || empInfo.id;
      const tEmp = (this.dispatch.temporaryEmployees || []).find(e => e.id === realId);
      if (!tEmp) return;

      Swal.fire({
        title: 'Modifier / Supprimer',
        html: `
          <input id="swal-temp-name" class="swal2-input" value="${tEmp.name}" placeholder="Prénom/Nom" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
          <input id="swal-temp-phone" class="swal2-input" value="${tEmp.phone || ''}" placeholder="Téléphone" style="background: rgba(0,0,0,0.2); color:#fff; margin-bottom: 10px;">
          <div style="text-align: left; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; font-size: 0.9rem; margin-top: 10px;">
            <div style="margin-bottom: 5px; color: #94a3b8; font-weight: bold;">Validations :</div>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-dds" ${tEmp.validations?.includes('dds') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> DDS (🩸)</label>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vc" ${tEmp.validations?.includes('vc') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> VC (🩺)</label>
            <label style="display: block; cursor: pointer; margin-bottom: 4px;"><input type="checkbox" id="swal-temp-vm" ${tEmp.validations?.includes('vm') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> VM (⚕️)</label>
            <label style="display: block; cursor: pointer;"><input type="checkbox" id="swal-temp-airbag" ${tEmp.validations?.includes('avp_airbag') ? 'checked' : ''} style="accent-color: #3b82f6; width: 14px; height: 14px;"> Airbag (🚔)</label>
          </div>
        `,
        focusConfirm: false,
        background: '#1e293b',
        color: '#fff',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Sauvegarder',
        cancelButtonText: 'Annuler',
        denyButtonText: 'Supprimer',
        confirmButtonColor: '#3b82f6',
        denyButtonColor: '#ef4444',
        preConfirm: () => {
          const name = document.getElementById('swal-temp-name').value.trim()
          const phone = document.getElementById('swal-temp-phone').value.trim()
          if (!name) {
            Swal.showValidationMessage("Le nom est obligatoire")
            return false
          }
          const validations = []
          if (document.getElementById('swal-temp-dds').checked) validations.push('dds')
          if (document.getElementById('swal-temp-vc').checked) validations.push('vc')
          if (document.getElementById('swal-temp-vm').checked) validations.push('vm')
          if (document.getElementById('swal-temp-airbag').checked) validations.push('avp_airbag')

          return { name, phone, validations }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          const wasInCentrale = this.dispatch.centrale?.employees?.some(e => e.employeeId === realId);
          await Dispatch.updateTemporaryEmployee(realId, {
            name: result.value.name,
            phone: result.value.phone || '',
            validations: result.value.validations || []
          })
        } else if (result.isDenied) {
          const r = await Swal.fire({
            title: 'Supprimer l\'employé ?',
            text: 'Il sera retiré de toutes les sections.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer',
            background: '#1e293b',
            color: '#fff'
          })
          if (r.isConfirmed) {
            const wasInCentrale = this.dispatch.centrale?.employees?.some(e => e.employeeId === realId);
            await Dispatch.removeTemporaryEmployee(realId)
          }
        }
      })
    },
    async resetDispatch() {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return;
      await Dispatch.resetAll()
      logger.log(this.userStore.profile.id, 'DISPATCH', 'Le dispatch a été réinitialisé')
    },


    debounceUpdate(id, field, callback, delay = 500) {
      const key = `${id}-${field}`
      if (this._timeouts[key]) clearTimeout(this._timeouts[key])
      this._timeouts[key] = setTimeout(() => {
        callback()
        delete this._timeouts[key]
      }, delay)
    },
    fetchSafdStatus() {
      fetch('https://docs.google.com/spreadsheets/d/1A1gxOho_roNwxTtcbiEpLGSWbD8JUasMDu4NL-zdcbw/export?format=csv&gid=0')
        .then(res => res.text())
        .then(text => {
          const rows = text.split('\n')
          if (rows.length >= 3) {
            const cols = rows[2].split(',')
            if (cols.length >= 4) {
              this.safdStatus = cols[3].trim()
            }
          }
        })
        .catch(err => {
          console.error("Erreur gsheet SAFD", err)
        })
    },
    fetchBcesStatus() {
      const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec?action=bcesDispatchDoGet'
      const script = document.createElement('script')
      const callbackName = 'jsonpCallback_' + Math.round(100000 * Math.random())
      
      window[callbackName] = (data) => {
        if (data && data.status) {
          this.bcesStatus = data.status.replace(/['"]/g, '').trim()
        }
        delete window[callbackName]
        document.body.removeChild(script)
      }

      script.src = `${WEB_APP_URL}&callback=${callbackName}`
      script.onerror = () => {
        console.error("Erreur Web App BCES (JSONP)")
        delete window[callbackName]
        document.body.removeChild(script)
      }

      document.body.appendChild(script)
    },
    hasHelicopterTraining(empId) {
      const e = this.employees.find(e => e.id === empId)
      return e ? !!e.helicopterTrainingDate : false
    },
    
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
    getValidationBadges(empId) {
      let isTemp = false;
      let e = this.employees.find(e => e.id === empId)
      if (!e) {
        e = (this.dispatch?.temporaryEmployees || []).find(e => e.id === empId)
        if (e) isTemp = true;
      }
      if (!e || (!e.role && !isTemp)) return []

      if (isTemp || e.role === 'Temporaire') {
        const badges = []
        const valIds = e.validations || []
        trainingCompetencies.forEach(cat => {
          cat.competencies.forEach(comp => {
            if (valIds.includes(comp.id)) {
              badges.push({ emoji: comp.emoji || '✅', title: comp.title })
            }
          })
        })
        return badges
      }
      
      if (!e.competencyProgress) return []
      
      const badges = []
      const progress = e.competencyProgress
      
      const isIntern = e.role === 'Interne'
      const isResident = e.role === 'Résident'
      
      if (!isIntern && !isResident) return []
      
      trainingCompetencies.forEach(cat => {
        cat.competencies.forEach(comp => {
          if (isIntern && ['dds', 'vc', 'vm', 'avp_airbag'].includes(comp.id)) {
            const total = comp.subCompetencies.length
            const validated = comp.subCompetencies.filter(sub => progress[sub.id] === 'validated').length
            if (total > 0 && validated === total) {
              badges.push({ emoji: comp.emoji || '✅', title: comp.title })
            }
          }
          if (isResident && ['central', 'folder_writing'].includes(comp.id)) {
            const total = comp.subCompetencies.length
            const validated = comp.subCompetencies.filter(sub => progress[sub.id] === 'validated').length
            if (total > 0 && validated === total) {
              badges.push({ emoji: comp.emoji || '✅', title: comp.title })
            }
          }
        })
      })
      
      return badges
    },

    patatesForCategory(cat) { return this.dispatch?.patates.filter(p=>p.category===cat)||[] },

    async setHospitalStatus(value) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return

      await Dispatch.updateField('hospitalStatus', value)

      const meta = this.hospitalStatuses.find(s => s.value === value) || this.hospitalStatuses[0]
      const label = meta.gsheet
      
      try {
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDWdQakJgJ22wYz2-uo6LRheJSFX7_-kox8oGBSxe808QXr9ryMg74LNDc5ufgNgKp/exec'

        fetch(`${WEB_APP_URL}?action=updateHospitalStatus&status=${encodeURIComponent(label)}`, { mode: 'no-cors' })
      } catch (err) {
        console.error("Erreur de synchro GSheet Hospital Status", err)
      }
    },

    startDrag(employee, sourceKey) {
      if (!this.hasLsesPerm) return
      this.draggingEmployee = employee
      this.draggingSource = sourceKey
      document.addEventListener('dragover', this._handleGlobalDragOver, { capture: true })
      document.addEventListener('wheel', this._handleGlobalWheel, { capture: true, passive: false })
    },
    onDragEnd() { 
      this.draggingEmployee = null; 
      this.draggingSource = null; 
      this.dragOver = null;
      document.removeEventListener('dragover', this._handleGlobalDragOver, { capture: true })
      document.removeEventListener('wheel', this._handleGlobalWheel, { capture: true })
    },
    onDragLeave(key) { if (this.dragOver === key) this.dragOver = null },

    _handleGlobalDragOver(e) {
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;

      const threshold = 80;
      const speed = 20;

      if (e.clientY < threshold && e.clientY > 0) {
        window.scrollBy(0, -speed);
      } else if (window.innerHeight - e.clientY < threshold && e.clientY > 0) {
        window.scrollBy(0, speed);
      }

      const path = e.composedPath ? e.composedPath() : [];
      for (let el of path) {
        if (el && el.nodeType === 1 && el.scrollHeight > el.clientHeight) {
          const style = window.getComputedStyle(el);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            const rect = el.getBoundingClientRect();

            if (e.clientY - rect.top < 60 && e.clientY - rect.top > 0) {
              el.scrollBy(0, -speed);
            } else if (rect.bottom - e.clientY < 60 && rect.bottom - e.clientY > 0) {
              el.scrollBy(0, speed);
            }
            break;
          }
        }
      }
    },

    _handleGlobalWheel(e) {
      if (!this.lastDragX || !this.lastDragY) return;

      let el = document.elementFromPoint(this.lastDragX, this.lastDragY);
      let scrolled = false;
      
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.nodeType === 1 && el.scrollHeight > el.clientHeight) {
          const style = window.getComputedStyle(el);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            el.scrollBy(0, e.deltaY);
            scrolled = true;
            break;
          }
        }
        el = el.parentElement;
      }

      if (!scrolled) {
        window.scrollBy(0, e.deltaY);
      }
    },

    async dropOn(targetKey) {
      if (!this.hasLsesPerm) return
      this.dragOver = null
      const emp = this.draggingEmployee
      const src = this.draggingSource
      if (!emp || !this.dispatch) return
      if (src === targetKey) return   

      const empId = emp.employeeId || emp.id
      if (!empId) {
        console.warn("Drop ignored: missing employee identifier", emp)
        return
      }
      
      if (targetKey === 'hs') this.autoTurnOffRadio(empId)

      await Dispatch.migrateEmployee(empId, src, targetKey === 'hs' ? null : targetKey, {
        name: emp.name || '',
        phone: emp.phone || '',
        allSpecialties: emp.allSpecialties||[],
        role: emp.role||''
      })
    },

    async removeFromDispatch(employeeId) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      
      let wasInCentrale = this.dispatch.centrale?.employees?.some(e => e.employeeId === employeeId)
      
      this.autoTurnOffRadio(employeeId)
      
      await Dispatch.removeFromBoard(employeeId)
    },

    async clearCentrale() {
      if (!this.hasLsesPerm) return
      if (!this.dispatch?.centrale) return

      const c = this.dispatch.centrale
      const hasFields = !!(c.location || c.complement || c.type || c.returnStatus)

      if (hasFields) {
        const locKey = 'centrale-location'
        if (this.localBuffers[locKey] !== undefined) delete this.localBuffers[locKey]
        if (this._timeouts[locKey]) {
          clearTimeout(this._timeouts[locKey])
          delete this._timeouts[locKey]
        }
        await Dispatch.updateCentrale({ location: null, complement: null, type: null, returnStatus: null })
      } else {
        const emps = c.employees || []
        if (emps.length === 0) return
        
        for (const emp of emps) {
          await Dispatch.migrateEmployee(emp.employeeId || emp.id, 'centrale', 'cat:en_service', {
            name: emp.name,
            phone: emp.phone,
            role: emp.role,
            allSpecialties: emp.allSpecialties || []
          })
        }
      }
    },

    async removeEmpFromCentrale(empId) {
      if (!this.hasLsesPerm) return
      const r = await Swal.fire({ icon:'warning', title:'Retirer de la centrale ?',
        showCancelButton:true, confirmButtonText:'Retirer' })
      if (!r.isConfirmed || !this.dispatch) return
      
      await Dispatch.migrateEmployee(empId, 'centrale', null, {})
    },
    async setCentraleEmpRole(empId, role) {
      if (!this.hasLsesPerm) return
      await Dispatch.updateCentraleEmployee(empId, { centralRole: role })
    },

    async setCentraleType(typeValue) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      await Dispatch.updateCentrale({ type: typeValue })
    },

    async setCentraleReturnStatus(statusValue) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      await Dispatch.updateCentrale({ returnStatus: statusValue || null })
    },

    async setCentraleLocation(loc) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      await Dispatch.updateCentrale({ location: loc })
    },
    onCentraleLocationInput(val) {
      if (!this.hasLsesPerm) return
      this.localBuffers['centrale-location'] = val
      this.debounceUpdate('centrale', 'location', () => {
        Dispatch.updateCentrale({ location: val.trim() || null }).then(() => {
          if (this.localBuffers['centrale-location'] === val) delete this.localBuffers['centrale-location']
        })
      })
    },

    getCentralRole(v) { return this.centralRoles.find(cr => cr.value === v) || null },

    getEmployeeEmoji(empId) {
      if (!empId) return '';
      const emp = this.employees.find(e => e.id === empId);
      if (!emp) return '';
      if (emp.role === 'Interne') return '🐣';
      return emp.emoji || '';
    },

    async addInterventionSlot() {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      if ((this.dispatch.interventions || []).length >= 25) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 25 interventions.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
      const newSlotId = Date.now().toString()+Math.random().toString(36).slice(2,6)
      await Dispatch.addInterventionSlot({
        id: newSlotId,
        type: 'intervention',
        employees: [],
        returnStatus: null,
        location: null,
        complement: null,
      })
      
      this.$nextTick(() => {
        const el = document.getElementById(`zip-input-${newSlotId}`)
        if (el) el.focus()
      })
    },

    async setInterSlotType(slot, typeValue) {
      if (!this.hasLsesPerm) return
      await Dispatch.updateIntervention(slot.id, { type: typeValue })
    },

    async setInterSlotLocation(slot, value) {
      if (!this.hasLsesPerm) return
      await Dispatch.updateIntervention(slot.id, { location: value.trim() || null })
    },
    onInterSlotLocationInput(slot, val) {
      if (!this.hasLsesPerm) return
      this.localBuffers[`${slot.id}-location`] = val
      this.debounceUpdate(slot.id, 'location', () => {
        Dispatch.updateIntervention(slot.id, { location: val.trim() || null }).then(() => {
          if (this.localBuffers[`${slot.id}-location`] === val) delete this.localBuffers[`${slot.id}-location`]
        })
      })
    },

    async setInterSlotStatus(slot, statusValue) {
      if (!this.hasLsesPerm) return
      await Dispatch.updateIntervention(slot.id, { returnStatus: statusValue || null })
    },

    async removeEmployeeFromSlot(slotId, employeeId) {
      const slot = this.dispatch.interventions.find(s=>s.id===slotId)
      if (slot) {
        const emps = (slot.employees||[]).filter(e => e.employeeId !== employeeId)
        await Dispatch.updateIntervention(slotId, { employees: emps })
      }
    },

    async removeInterventionSlot(slot) {
      if (!this.hasLsesPerm || !slot) return
      const hasContent = (slot.employees?.length || slot.location || slot.complement || slot.returnStatus || slot.type !== 'intervention')
      if (hasContent) {
        const locKey = `${slot.id}-location`
        if (this.localBuffers[locKey] !== undefined) delete this.localBuffers[locKey]
        if (this._timeouts[locKey]) {
          clearTimeout(this._timeouts[locKey])
          delete this._timeouts[locKey]
        }

        await Dispatch.resetInterventionSlot(slot.id)
      } else {
        await Dispatch.deleteInterventionSlot(slot.id)
      }
    },





    openAddDialog(categoryValue) {
      this.addDialogCategoryValue = categoryValue
      this.selectedEmployee = null
      this.addDialog = true
    },
    async confirmAddPatate() {
      if (!this.hasLsesPerm) return
      if (!this.selectedEmployee || !this.dispatch) return
      this.addDialog = false
      const empId = this.selectedEmployee.id
      const emp = this.employees.find(e=>e.id===empId)

      const role = emp?.role || this.selectedEmployee.role || ''
      const specs = emp ? (emp.specialties || []) : (this.selectedEmployee.allSpecialties || [])

      await Dispatch.migrateEmployee(empId, null, `cat:${this.addDialogCategoryValue}`, {
        name: this.selectedEmployee.name || '',
        phone: this.selectedEmployee.phone || '',
        allSpecialties: specs,
        role,
      })
      this.addDialog = false
    },

    openQuickMoveDialog(emp, sourceKey) { 
      if (!this.hasLsesPerm) return
      this.quickAddEmployee = emp; 
      this.quickMoveSourceKey = sourceKey;
      this.quickAddDialog = true 
    },
    async confirmQuickAdd(categoryValue) {
      if (!this.hasLsesPerm) return
      if (!this.quickAddEmployee || !this.dispatch) return
      this.quickAddDialog = false
      
      const empId = this.quickAddEmployee.employeeId || this.quickAddEmployee.id
      const src = this.quickMoveSourceKey
      const emp = this.employees.find(e=>e.id===empId)

      const role = emp?.role || this.quickAddEmployee.role || ''
      const specs = emp ? (emp.specialties || []) : (this.quickAddEmployee.allSpecialties || [])

      if (categoryValue === 'hs') {
        this.autoTurnOffRadio(empId)
      }
      
      await Dispatch.migrateEmployee(empId, src, categoryValue === 'hs' ? null : `cat:${categoryValue}`, {
        name: this.quickAddEmployee.name || '',
        phone: this.quickAddEmployee.phone || '',
        allSpecialties: specs,
        role,
      })

      this.quickAddDialog = false
    },

    async addRadio(category = 'standard') {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      if ((this.dispatch.radios || []).length >= 30) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 30 radios.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
      const radios = JSON.parse(JSON.stringify(this.dispatch.radios || []))
      radios.push({
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        serial: '',
        employeeId: null,
        status: 'on',
        category
      })
      await Dispatch.updateField('radios', radios)
      logger.log(this.userStore.profile.id, 'RADIOS', `Nouvelle radio ajoutée (${category === 'direction' ? 'Direction' : 'Standard'})`)
    },
    async onRadioAssign(radio, newEmpId) {
      if (!this.hasLsesPerm) return
      if (radio.category === 'direction' && !this.isDirection) {
        Swal.fire({ title: 'Accès refusé', text: 'Seules les personnes de la Direction peuvent modifier ces radios.', icon: 'error', background: '#1e293b', color: '#fff' })
        return
      }
      const oldEmpId = radio.employeeId
      if (oldEmpId !== newEmpId) {
        const radios = JSON.parse(JSON.stringify(this.dispatch.radios || []))
        const r = radios.find(x => x.id === radio.id)
        if (r) {
          r.employeeId = newEmpId || null
          if (!oldEmpId && newEmpId) r.status = 'on'
          else if (oldEmpId && !newEmpId) r.status = 'off'
          await Dispatch.updateField('radios', radios)
        }

        const serialStr = radio.serial || 'sans matricule'
        if (!oldEmpId && newEmpId) {
          const emp = this.employees.find(e => e.id === newEmpId)
          if (emp) logger.log(this.userStore.profile.id, 'RADIOS', `${emp.name} a pris la radio ${serialStr}`)
        } else if (oldEmpId && !newEmpId) {
          const emp = this.employees.find(e => e.id === oldEmpId)
          if (emp) logger.log(this.userStore.profile.id, 'RADIOS', `${emp.name} a déposé la radio ${serialStr}`)
        } else if (oldEmpId && newEmpId) {
          const oldEmp = this.employees.find(e => e.id === oldEmpId)
          const newEmp = this.employees.find(e => e.id === newEmpId)
          if (oldEmp && newEmp) logger.log(this.userStore.profile.id, 'RADIOS', `${oldEmp.name} a transféré la radio ${serialStr} à ${newEmp.name}`)
        }
      }
    },
    async removeRadio(radio) {
      if (!this.hasLsesPerm) return
      if (!this.dispatch) return
      const r = await Swal.fire({ 
        icon: 'warning', 
        title: 'Supprimer cette radio ?',
        text: `Es-tu sûr de vouloir supprimer la radio ${radio.serial || 'sans matricule'} ?`,
        showCancelButton: true, 
        confirmButtonText: 'Supprimer', 
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33'
      })
      if (!r.isConfirmed) return
      
      const radios = JSON.parse(JSON.stringify(this.dispatch.radios || []))
      const idx = radios.findIndex(x => x.id === radio.id)
      if (idx !== -1) {
        const serial = radios[idx].serial || 'sans matricule'
        radios.splice(idx, 1)
        await Dispatch.updateField('radios', radios)
        logger.log(this.userStore.profile.id, 'RADIOS', `Radio ${serial} supprimée`)
      }
    },
    autoTurnOffRadio(employeeId) {
      if (!this.dispatch?.radios || !employeeId) return
      const radios = JSON.parse(JSON.stringify(this.dispatch.radios))
      const radio = radios.find(r => r.employeeId === employeeId)
      if (radio) {
        radio.status = 'off'
        Dispatch.updateField('radios', radios)
      }
    },
    async toggleRadioStatus(radio) {
      if (!this.hasLsesPerm) return
      const radios = JSON.parse(JSON.stringify(this.dispatch.radios))
      const r = radios.find(x => x.id === radio.id)
      if (r) {
        r.status = r.status === 'on' ? 'off' : 'on'
        await Dispatch.updateField('radios', radios)
      }
    },
    onNotepadInput(val) {
      if (!this.isDirection) return
      this.localBuffers['global-notepad'] = val
      this.debounceUpdate('global', 'notepad', () => {
        Dispatch.updateField('notepad', val).then(() => {
          if (this.localBuffers['global-notepad'] === val) delete this.localBuffers['global-notepad']
        })
      })
    },
    formatDateTime(ts) {
      if (!ts) return ''
      const date = new Date(ts)
      return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    },


  },
}
</script>

<style scoped>
.dispatch-root {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  font-family: 'Roboto', sans-serif;
  font-size: 0.8rem;
  background: #0f172a;
}

.dispatch-top-headers {
  display: grid;
  grid-template-columns: 320px 1fr 350px 280px;
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

.status-pill {
  display: flex;
  align-items: stretch;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid transparent;
  height: 20px;
  pointer-events: none;
  font-size: 0.73rem;
}
.pill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
.pill-text {
  display: flex;
  align-items: center;
  padding: 0 6px;
  font-weight: 700;
  white-space: nowrap;
}

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
  grid-template-columns: 320px 1fr 350px 280px;
  overflow: hidden;
  border-bottom: 2px solid #334155;
}

.left-panel {
  background: #1e293b;
  border-right: 2px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 6px;
  gap: 4px;
}



.drop-slot {
  border: 2px dashed #334155;
  border-radius: 6px;
  min-height: 44px;
  background: rgba(255,255,255,.04);
  transition: border-color .15s, background .15s;
  display: flex;
  position: relative;
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
  flex: 1;
  min-height: 0;
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
  text-overflow: ellipsis;
}
.inter-type-badge:hover { opacity: .8; }

.center-panel {
  background: #162032;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.patate-content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  transition: background .15s;
  overflow: hidden;
  position: relative;
}
.patate-content-area.drop-over { background: #1a2f4a; }

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
  position: relative;
}

.far-right-panel {
  background: #1e293b;
  border-left: 2px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.radios-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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
.pc-name { font-size: 0.75rem; font-weight: 700; color: #f8fafc; white-space: nowrap; }
.pc-phone { font-size: 0.62rem; color: #cbd5e1; }
.pc-validations { margin-top: 1px; font-size: 11px; display: flex; flex-wrap: wrap; gap: 2px; }
.val-emoji { cursor: default; }
.pc-specs { font-size: 0.6rem; line-height: 1.1; margin-top: 1px; }
.pc-role  { font-size: 0.6rem; font-weight: 700; margin-top: 1px; letter-spacing: 0.02em; }
.spec-emoji { cursor: default; }
.pc-name-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.pc-helico-icon { color: #ffb74d; flex-shrink: 0; }

.dispatch-bottom {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  flex-shrink: 0;
  min-height: 180px;
  max-height: 300px;
  border-top: 2px solid #334155;
  background: #0f172a;
}

.inner-bottom-categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  flex-shrink: 0;
  border-top: 1px solid #334155;
  background: rgba(0, 0, 0, 0.2);
}

.inner-bottom-panel {
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background .15s;
  position: relative;
}
.inner-bottom-panel:nth-child(2n) { border-right: none; }
.inner-bottom-panel:nth-child(n+3) { border-top: 1px solid #334155; }
.inner-bottom-panel.drop-over { background: #1a2f4a; }
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
.drop-hint-sm { 
  border: 1px dashed #475569;
  color: #94a3b8;
  border-radius: 4px;
  font-size: 0.65rem;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  font-style: italic;
}

.inter-location-row {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  background: rgba(255,255,255,.06);
  border: 1px solid #334155;
  border-radius: 4px;
  margin-bottom: 2px;
}


.return-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #b0bec5;
  font-size: 0.63rem;
  font-weight: 700;
  cursor: pointer;
  color: #90a4ae;
  background: #f5f5f5;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity .15s;
}
.return-badge:hover { opacity: .8; }

.vehicle-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 3px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #b0bec5;
  font-size: 0.6rem;
  font-weight: 700;
  cursor: default;
  color: #90a4ae;
  background: #f5f5f5;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Light Theme Overrides */
.theme--light {
  background: #f8fafc;
  color: #334155;
}
.theme--light .dispatch-top-headers {
  background: #e2e8f0;
  color: #1e293b;
  border-bottom-color: #cbd5e1;
}



.theme--light .th-cell { border-right-color: #cbd5e1; }
.theme--light .left-panel { background: #e2e8f0; border-right-color: #cbd5e1; }
.theme--light .center-panel { background: #f8fafc; border-right-color: #cbd5e1; }
.theme--light .right-panel { background: #f1f5f9; border-left-color: #cbd5e1; }
.theme--light .far-right-panel { background: #e2e8f0; border-left-color: #cbd5e1; }

.theme--light .dispatch-body { border-bottom-color: #cbd5e1; }

.theme--light .person-card {
  background: #ffffff;
  border-color: rgba(0,0,0,0.1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.theme--light .person-card:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.theme--light .person-card--hs { background: #ffffff; border-color: rgba(0,0,0,0.15); }
.theme--light .pc-name { color: #1e293b; }
.theme--light .pc-phone { color: #64748b; }

.theme--light .freq-input { background: #ffffff; border-color: #cbd5e1; color: #1e293b; }
.theme--light .inter-type-badge { background: #ffffff; border-color: #cbd5e1; color: #475569;}
.theme--light .return-badge { background: #ffffff; border-color: #cbd5e1; color: #475569; }



.theme--light .inner-bottom-categories { background: #f1f5f9; border-top-color: #cbd5e1; }
.theme--light .inner-bottom-panel { border-right-color: #cbd5e1; border-top-color: #cbd5e1; }
.theme--light .bottom-panel { border-right-color: #cbd5e1; }

.theme--light .radios-wrapper, .theme--light .notepad-wrapper, .theme--light .vehicles-info-wrapper, .theme--light .stock-info-wrapper {
  background: #f8fafc !important;
  border-top-color: #cbd5e1 !important;
}
.theme--light .radio-item { background: #ffffff !important; border-color: #cbd5e1 !important; }
.theme--light .text-grey-lighten-1, .theme--light .text-grey-lighten-2, .theme--light .text-grey { color: #475569 !important; }
.theme--light .notepad-input { background: #ffffff; border-color: #cbd5e1; color: #1e293b; }
.theme--light .notepad-display { background: #ffffff; border-color: #cbd5e1; color: #1e293b; }
.theme--light .drop-slot { background: rgba(0,0,0,0.03); border-color: #cbd5e1; }
.theme--light .drop-slot--over { background: rgba(59,130,246,0.1); border-color: #3b82f6; }
.theme--light .inter-location-row { background: #ffffff; border-color: #cbd5e1; }

/* Enhanced Table & Inputs color contrast for Light Theme (Crisis, Beds) */


.theme--light .patate-content-area.drop-over { background: #e2e8f0; }
.theme--light .right-panel.drop-over { background: #cbd5e1; }
.theme--light .inner-bottom-panel.drop-over { background: #cbd5e1; }
.theme--light .bottom-panel.drop-over { filter: brightness(0.95); }




.theme--light td[style*="background: rgba(0,0,0,0.3)"] { background: rgba(0,0,0,0.06) !important; color: #334155 !important; }
.theme--light td[style*="background: rgba(0,0,0,0.2)"] { background: rgba(0,0,0,0.03) !important; color: #334155 !important; }
.theme--light td[style*="background: rgba(255,255,255,0.02)"] { background: rgba(0,0,0,0.04) !important; color: #334155 !important; }
.theme--light td[style*="background: rgba(255,255,255,0.04)"] { background: rgba(0,0,0,0.05) !important; color: #334155 !important; }
.theme--light td[style*="background: rgba(255,255,255,0.05)"] { background: rgba(0,0,0,0.05) !important; color: #334155 !important; }

.theme--light td[style*="background: rgba(56, 189, 248, 0.1)"] { background: rgba(56, 189, 248, 0.2) !important; color: #0f172a !important; }
.theme--light input.text-blue-lighten-2 { color: #0369a1 !important; font-weight: 700 !important; }

.theme--light td[style*="background: rgba(107,114,128,0.25)"] { background: rgba(107,114,128,0.2) !important; }
.theme--light td[style*="background: rgba(88,28,135,0.25)"] { background: rgba(147,51,234,0.15) !important; }
.theme--light td[style*="background: rgba(20,83,45,0.35)"] { background: rgba(34,197,94,0.15) !important; }



.theme--light input[style*="color: #9ca3af"], 
.theme--light input[style*="color: #d1d5db"],
.theme--light td[style*="color: #cbd5e1"],
.theme--light td[style*="color: #94a3b8"],
.theme--light td[style*="color: #9ca3af"] { color: #1e293b !important; font-weight: 700 !important; }

.theme--light .text-purple-lighten-3 { color: #6b21a8 !important; }
.theme--light .text-green-lighten-3 { color: #15803d !important; }
.theme--light .text-blue-lighten-2 { color: #0369a1 !important; }
.theme--light .text-red-lighten-2 { color: #b91c1c !important; }
.pc-popover-content {
  background: #1e293b;
  border: 1.5px solid #334155;
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  min-width: 140px;
}

.drop-slot--over::after,
.patate-content-area.drop-over::after,
.inner-bottom-panel.drop-over::after,
.right-panel.drop-over::after {
  content: "⬇️ DÉPOSER ICI";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  font-size: 0.75rem;
  z-index: 1000;
  pointer-events: auto !important;
  border: 4px solid #3b82f6;
  border-radius: inherit;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  backdrop-filter: blur(1px);
}

.is-dragging .drop-slot *,
.is-dragging .patate-content-area *,
.is-dragging .inner-bottom-panel *,
.is-dragging .right-panel *,
.is-dragging .inter-type-row *,
.is-dragging .inter-location-row *,
.is-dragging .to-take-indicator {
  pointer-events: none !important;
}

.person-card.dragging, .person-card.dragging * {
  pointer-events: auto !important;
  opacity: 0.5;
}

.theme--light .pc-popover-content {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.to-take-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  color: #f87171;
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  pointer-events: none;
}


</style>

