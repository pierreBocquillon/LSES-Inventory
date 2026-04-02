<template>
  <div class="dispatch-root" :class="{ 'is-dragging': !!draggingEmployee, 'theme--light': isLightTheme }">

        <div class="dispatch-top-headers">
      <div class="th-cell th-left d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon size="13" class="mr-1">mdi-headset</v-icon>Status Centrale & Interventions
        </div>
        <v-btn v-if="isDirection" icon variant="text" size="x-small" @click.stop="showAffiliationManager = true" style="color: #94a3b8;" title="Gérer les affiliations">
          <v-icon size="14">mdi-cog</v-icon>
        </v-btn>
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
              <div class="pc-validations" v-if="(validationBadgesMap.get(emp.employeeId || emp.id) || []).length">
                <span v-for="b in (validationBadgesMap.get(emp.employeeId || emp.id) || [])" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
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
          <v-btn v-if="hasLsesPerm" size="x-small" variant="plain" color="white" class="ml-auto" @click="handleAddInterventionSlot">
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
                  <div class="pc-validations" v-if="(validationBadgesMap.get(emp.employeeId || emp.id) || []).length">
                    <span v-for="b in (validationBadgesMap.get(emp.employeeId || emp.id) || [])" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
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
                <div class="pc-validations" v-if="(validationBadgesMap.get(p.employeeId || p.id) || []).length">
                  <span v-for="b in (validationBadgesMap.get(p.employeeId || p.id) || [])" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
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
                  <div class="pc-validations" v-if="(validationBadgesMap.get(p.employeeId || p.id) || []).length">
                    <span v-for="b in (validationBadgesMap.get(p.employeeId || p.id) || [])" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
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
              <div class="pc-validations" v-if="(validationBadgesMap.get(emp.id || emp.employeeId) || []).length">
                <span v-for="b in (validationBadgesMap.get(emp.id || emp.employeeId) || [])" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
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
                     <option v-for="emp in (radioEmployeeOptionsMap.get(radio.id) || [])" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
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

    <v-dialog v-model="showAffiliationManager" max-width="500" :retain-focus="false">
      <v-card class="rounded-xl" style="background: #1e293b; color: #fff;">
        <v-card-title class="pa-0">
          <v-tabs v-model="activeTab" grow bg-color="amber-darken-3" theme="dark">
            <v-tab :value="0"><v-icon class="mr-2">mdi-account-group</v-icon> Affiliations</v-tab>
            <v-tab :value="1"><v-icon class="mr-2">mdi-history</v-icon> Auto-Reset</v-tab>
          </v-tabs>
        </v-card-title>
        
        <v-window v-model="activeTab">
          <v-window-item :value="0">
            <v-card-text class="pa-4 pt-2">
              <div style="max-height: 600px; overflow-y: auto; padding-right: 8px;" class="custom-scrollbar">
                <div v-for="aff in affiliations" :key="aff.id" class="d-flex align-center mb-2 pa-2 rounded" style="background: rgba(0,0,0,0.2); border: 1px solid #334155;">
                  <div class="d-flex flex-column mr-2 align-center justify-center">
                    <v-btn icon variant="plain" size="x-small" color="grey" @click="moveAffiliationUpTemplate(aff)" :disabled="isFirstAffiliationTemplate(aff)" style="height: 16px; width: 16px;">
                      <v-icon size="16">mdi-chevron-up</v-icon>
                    </v-btn>
                    <v-btn icon variant="plain" size="x-small" color="grey" @click="moveAffiliationDownTemplate(aff)" :disabled="isLastAffiliationTemplate(aff)" style="height: 16px; width: 16px; margin-top: 2px;">
                      <v-icon size="16">mdi-chevron-down</v-icon>
                    </v-btn>
                  </div>
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
          </v-window-item>

          <v-window-item :value="1">
            <v-card-text class="pa-4">
              <div class="mb-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-subtitle-2 font-weight-bold text-amber-lighten-2">Activer le reset auto quotidien</div>
                  <v-switch :model-value="dispatch.autoResetEnabled" @update:model-value="handleAutoResetToggle($event)" color="amber-darken-2" hide-details density="compact"></v-switch>
                </div>
                <div class="text-caption text-grey">Si activé, le dispatch sera réinitialisé chaque jour à l'heure indiquée.</div>
              </div>

              <v-divider class="mb-4" color="white" style="opacity: 0.1"></v-divider>

              <div class="mb-4">
                <div class="text-subtitle-2 font-weight-bold mb-1">Heure du reset (format 24h)</div>
                <div class="d-flex align-center">
                  <v-icon size="18" color="grey" class="mr-2">mdi-clock-outline</v-icon>
                  <input 
                    type="time" 
                    :value="dispatch?.autoResetTime || '03:00'" 
                    @change="handleAutoResetTimeChange($event.target.value)"
                    class="location-input" 
                    style="width: 120px; font-size: 1.1rem; letter-spacing: 1px; font-weight: bold; background: rgba(0,0,0,0.2); border: 1px solid #334155; padding: 5px 10px; border-radius: 4px;"
                  />
                </div>
              </div>

              <v-divider class="mb-4" color="white" style="opacity: 0.1"></v-divider>

              <div class="mb-2">
                <div class="text-subtitle-2 font-weight-bold mb-1">Prochain reset prévu</div>
                <div class="d-flex align-center justify-space-between pa-3 rounded" style="background: rgba(0,0,0,0.2); border: 1px solid #334155;">
                  <div class="d-flex flex-column">
                    <div class="text-body-2" :class="dispatch?.nextResetCancelled ? 'text-decoration-line-through text-grey' : 'text-white'">
                      Demain à <span class="font-weight-black">{{ dispatch?.autoResetTime || '03:00' }}</span>
                    </div>
                    <div v-if="dispatch?.nextResetCancelled" class="text-caption text-error font-weight-bold">ANNULÉ PAR LA DIRECTION</div>
                  </div>
                  <v-btn 
                    :color="dispatch?.nextResetCancelled ? 'success' : 'error'" 
                    variant="tonal" 
                    size="small" 
                    class="ml-2"
                    @click="Dispatch.updateField('nextResetCancelled', !dispatch.nextResetCancelled)"
                  >
                    <v-icon size="16" class="mr-1">{{ dispatch?.nextResetCancelled ? 'mdi-check' : 'mdi-close-circle' }}</v-icon>
                    {{ dispatch?.nextResetCancelled ? 'Réactiver' : 'Annuler le prochain' }}
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-window-item>
        </v-window>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAffiliationManager = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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


  </div>
</template>

<script setup>
import { nextTick, ref, watch, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user.js'
import {
  allCategories,
  interventionTypes,
  returnStatuses,
  centralRoles,
  hospitalStatuses,
  safdStatusConfig,
  bcesStatusConfig,
  complements,
  crisisMedicalStatuses,
  crisisBeds,
  crisisBedGroups,
  crisisRowColors
} from '@/config/dispatch.js'
import Dispatch from '@/classes/Dispatch.js'

import DispatchMorgue from '@/components/dispatch/DispatchMorgue.vue'
import DispatchBeds from '@/components/dispatch/DispatchBeds.vue'
import DispatchCrisis from '@/components/dispatch/DispatchCrisis.vue'

import { useDispatchState } from '@/composables/dispatch/useDispatchState.js'
import { useDispatchActions } from '@/composables/dispatch/useDispatchActions.js'
import { useDispatchDragAndDrop } from '@/composables/dispatch/useDispatchDragAndDrop.js'
import { useDispatchStatus } from '@/composables/dispatch/useDispatchStatus.js'

const userStore = useUserStore()

// -- State --
const state = useDispatchState()
const {
  dispatch,
  affiliations,
  currentTime,
  isLightTheme,
  localBuffers,

  isDirection,
  currentUserEmployeeId,
  hasLsesPerm,
  allLocations,
  allEmployees,
  sortedUnassignedEmployees,
  directionRadios,
  standardRadios,
  lastRepairDateStr,
  lastRepairColorClass,
  fouriereVehicles,
  guardVehicles,
  insuranceVehicles,
  needRepairVehicles,
  storageUpdates,
  todoOrders,
  radioEmployeeOptionsMap,
  validationBadgesMap,
} = state


const { safdStatus, bcesStatus } = useDispatchStatus()


const hospitalStatusMeta = computed(() => {
  if (!dispatch.value) return hospitalStatuses[0]
  return hospitalStatuses.find(s => s.value === dispatch.value.hospitalStatus) || hospitalStatuses[0]
})

const hospitalStatusStyle = computed(() => {
  const meta = hospitalStatusMeta.value
  if (isLightTheme.value) {
    return { color: meta.lightColor || meta.color, background: meta.lightBg || 'rgba(255,255,255,0.1)', borderColor: 'rgba(0,0,0,0.1)' }
  }
  return { color: meta.color, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
})

const safdStatusStyle = computed(() => {
  const status = (safdStatus.value || '').toLowerCase()
  const mode = isLightTheme.value ? 'light' : 'dark'
  let key = 'default'
  if (status.includes('dispo') && !status.includes('indispo')) key = 'dispo'
  else if (status.includes('indispo')) key = 'indispo'
  const config = safdStatusConfig[key][mode]
  return { wrapper: { borderColor: config.border, background: config.bg }, brand: { background: safdStatusConfig.brand.color }, status: { color: config.color } }
})

const bcesStatusStyle = computed(() => {
  const status = (bcesStatus.value || '').toLowerCase()
  const mode = isLightTheme.value ? 'light' : 'dark'
  let key = 'default'
  if (status.includes('dispo') && !status.includes('indispo')) key = 'dispo'
  else if (status.includes('indispo')) key = 'indispo'
  else if (status.includes('nuit')) key = 'nuit'
  const config = bcesStatusConfig[key][mode]
  return { wrapper: { borderColor: config.border, background: config.bg }, brand: { background: bcesStatusConfig.brand.color }, status: { color: config.color } }
})

const bottomCategories = computed(() => allCategories.filter(c => c.value !== 'en_service'))


const actions = useDispatchActions({ ...state, userStore })
const {

  quickAddDialog, quickAddEmployee, quickMoveSourceKey,
  showAffiliationManager, activeTab,


  toggleTheme,
  handleAutoResetToggle, handleAutoResetTimeChange,
  setHospitalStatus,
  autoTurnOffRadio, toggleRadioStatus, onRadioAssign, removeRadio, addRadio,
  addInterventionSlot, setInterSlotType, setInterSlotStatus, removeInterventionSlot, onInterSlotLocationInput,
  setCentraleType, setCentraleReturnStatus, clearCentrale, onCentraleLocationInput, setCentraleEmpRole,
  onNotepadInput, confirmResetDispatch,
  confirmAddPatate, openQuickMoveDialog, confirmQuickAdd,
  promptAddTemporaryEmployee, promptEditTemporaryEmployee,
  promptAddAffiliation, promptEditAffiliation, confirmDeleteAffiliation,
  isFirstAffiliation, isLastAffiliation, moveAffiliationUp, moveAffiliationDown,
  formatDateTime,
  getSpecialtyIcon, getSpecialtyName,
  getInterType, getReturnStatus, getCentralRole, getRoleColor,
  getEmployeeEmoji, getEmployeeEmojis, hasHelicopterTraining,
  patatesForCategory,
  cleanup,
} = actions


const handleAddInterventionSlot = () => addInterventionSlot(nextTick)


const isFirstAffiliationTemplate = (aff) => isFirstAffiliation(aff, affiliations.value)
const isLastAffiliationTemplate = (aff) => isLastAffiliation(aff, affiliations.value)
const moveAffiliationUpTemplate = (aff) => moveAffiliationUp(aff, affiliations.value)
const moveAffiliationDownTemplate = (aff) => moveAffiliationDown(aff, affiliations.value)


const {
  draggingEmployee, draggingSource, dragOver,
  startDrag, onDragEnd, onDragLeave, dropOn,
} = useDispatchDragAndDrop(hasLsesPerm, dispatch, autoTurnOffRadio)


const localCrisisZip = ref('')
watch(() => dispatch.value?.crisisZip, (newVal) => {
  if (document.activeElement?.classList.contains('crisis-zip-input')) return
  localCrisisZip.value = newVal || ''
})

onUnmounted(() => cleanup())

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