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

        <span v-if="safdStatus" class="hosp-btn ml-3" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; pointer-events: none;">
          <v-icon size="13" class="mr-1">mdi-fire-truck</v-icon>
          Status SAFD : <strong :style="(safdStatus.toLowerCase().includes('dispo') && !safdStatus.toLowerCase().includes('indispo')) ? 'color: #34d399;' : 'color: #f87171;'">{{ safdStatus }}</strong>
        </span>

        <span class="hosp-btn ml-3" style="background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #93c5fd; pointer-events: none;">
          <v-icon size="13" class="mr-1">mdi-shield-cross</v-icon>
          Status BCES : <strong :style="((bcesStatus || '').toLowerCase().includes('dispo') && !(bcesStatus || '').toLowerCase().includes('indispo')) ? 'color: #34d399;' : ((bcesStatus || '').toLowerCase().includes('nuit') ? 'color: #60a5fa;' : 'color: #f87171;')">{{ bcesStatus || 'Inconnu' }}</strong>
        </span>

      </div>
      <div class="th-cell">
        😴 Hors service <span class="cnt ml-1">{{ sortedUnassignedEmployees.length }}</span>
        <v-btn v-if="isDirection" icon variant="plain" size="x-small" color="error" class="ml-auto" @click="confirmResetDispatch" title="Réinitialiser le dispatch">
          <v-icon size="14">mdi-refresh</v-icon>
        </v-btn>
      </div>
      <div class="th-cell th-right">📻 Radios & Notes</div>
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
          <v-menu location="bottom start" :close-on-content-click="true">
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
          <v-btn icon variant="plain" size="x-small" color="error" class="ml-auto"
            @click="clearCentrale" title="Vider la centrale">
            <v-icon size="11">mdi-delete-sweep</v-icon>
          </v-btn>
        </div>
        <div class="inter-location-row d-flex align-center">
          <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
          <input
            class="location-input"
            style="flex: 1;"
            :value="dispatch?.centrale?.location || ''"
            placeholder="Code ZIP / Position"
            @change="setCentraleLocation($event.target.value)"
            @keyup.enter="$event.target.blur()"
          />
          <select
            v-if="dispatch?.centrale"
            v-model="dispatch.centrale.complement"
            @change="dispatch.save()"
            class="location-input ml-2"
            style="width: 85px; border-left: 2px solid #64748b; padding-left: 8px;"
            :style="{ color: dispatch?.centrale?.complement ? (complements.find(c => c.value === dispatch?.centrale?.complement)?.color || '#fff') : '#64748b' }"
            title="Complément"
          >
            <option :value="null" style="background:#1a1f35; color:#64748b">Complément</option>
            <option v-for="c in complements" :key="c.value" :value="c.value" style="background:#1a1f35">{{ c.label }}</option>
          </select>
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
              <v-icon v-if="hasHelicopterTraining(emp.employeeId || emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
              <div class="pc-name">{{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}</div>
              <div class="pc-phone">{{ emp.phone }}</div>
              <div class="pc-validations" v-if="getValidationBadges(emp.employeeId).length">
                <span v-for="b in getValidationBadges(emp.employeeId)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
              </div>
              <div class="pc-specs">
                <span v-for="sv in (emp.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
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

        <div class="interventions-list" style="flex: 1; min-height: 0; overflow-y: auto;">
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
            <div class="inter-location-row d-flex align-center">
              <v-icon size="11" color="#90a4ae" class="mr-1">mdi-map-marker</v-icon>
              <input
                class="location-input"
                style="flex: 1;"
                :value="slot.location || ''"
                placeholder="Code ZIP / Position"
                @change="setInterSlotLocation(slot, $event.target.value)"
                @keyup.enter="$event.target.blur()"
              />
              <select
                v-model="slot.complement"
                @change="dispatch.save()"
                class="location-input ml-2"
                style="width: 85px; border-left: 2px solid #64748b; padding-left: 8px;"
                :style="{ color: slot.complement ? (complements.find(c => c.value === slot.complement)?.color || '#fff') : '#64748b' }"
                title="Complément"
              >
                <option :value="null" style="background:#1a1f35; color:#64748b">Complément</option>
                <option v-for="c in complements" :key="c.value" :value="c.value" style="background:#1a1f35">{{ c.label }}</option>
              </select>
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
                  <v-icon v-if="hasHelicopterTraining(emp.employeeId || emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                  <div class="pc-name">{{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}</div>
                  <div class="pc-phone">{{ emp.phone }}</div>
                  <div class="pc-validations" v-if="getValidationBadges(emp.employeeId).length">
                    <span v-for="b in getValidationBadges(emp.employeeId)" :key="b.title" class="val-emoji" :title="b.title">{{ b.emoji }}</span>
                  </div>
                  <div class="pc-specs">
                    <span v-for="sv in (emp.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
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
              <v-icon v-if="hasHelicopterTraining(p.employeeId || p.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
              <div class="pc-name">{{ getEmployeeEmoji(p.employeeId || p.id) }} {{ p.name?.split(' ')[0] }}</div>
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
          <div v-if="draggingSource && !patatesForCategory('en_service').find(p=>p.employeeId===draggingSource.employeeId)" class="drop-hint-card">
            Déposer ici
          </div>
        </div>

        <div class="inner-bottom-categories mt-auto" style="border-top: 1px solid #334155; padding-top: 6px; min-height:300px;"
          @dragover.stop
          @dragleave.stop
          @drop.stop
        >
          <div
            v-for="cat in bottomCategories"
            :key="cat.value"
            class="inner-bottom-panel"
            :class="{ 'drop-over': dragOver===`cat:${cat.value}` }"
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
                :class="{ dragging: draggingSource?.employeeId===p.employeeId }"
                :style="`border-left:3px solid ${getRoleColor(p.role)};background:${getRoleColor(p.role)}15`"
                draggable="true"
                @dragstart="startDrag(p, `cat:${cat.value}`)"
                @dragend="onDragEnd"
              >
                <div class="pc-info">
                  <v-icon v-if="hasHelicopterTraining(p.employeeId || p.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
                  <div class="pc-name">{{ getEmployeeEmoji(p.employeeId || p.id) }} {{ p.name?.split(' ')[0] }}</div>
                  <div class="pc-phone">{{ p.phone }}</div>
                  <div class="pc-specs">
                    <span v-for="sv in (p.allSpecialties||[])" :key="sv" class="spec-emoji" :title="getSpecialtyName(sv)">{{ getSpecialtyIcon(sv) }}</span>
                  </div>
                  <div class="pc-role" :style="`color:${getRoleColor(p.role)}`">{{ p.role }}</div>
                </div>
                <div v-if="draggingSource && !patatesForCategory(cat.value).find(pp=>pp.employeeId===draggingSource.employeeId)" class="drop-hint-sm">↓</div>
              </div>
            </div>
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
              <v-icon v-if="hasHelicopterTraining(emp.id)" size="12" class="pc-helico-icon" title="Médicoptère">mdi-helicopter</v-icon>
              <div class="pc-name">{{ getEmployeeEmoji(emp.employeeId || emp.id) }} {{ emp.name?.split(' ')[0] }}</div>
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
            Dernière répa flotte : <span class="text-white font-weight-bold">{{ lastRepairDateStr }}</span>
          </div>
          
          <div v-if="guardVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-orange-lighten-2" style="font-size: 0.65rem;">🛡️ Gardiennage</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in guardVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #ffb74d; color: #ffb74d; background: rgba(255,183,77,0.1)">
                {{ v.name }}
              </span>
            </div>
          </div>
          
          <div v-if="fouriereVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-red-lighten-2 mt-1" style="font-size: 0.65rem;">⛔ Fourrière</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in fouriereVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #e57373; color: #e57373; background: rgba(229,115,115,0.1)">
                {{ v.name }}
              </span>
            </div>
          </div>
          
          <div v-if="insuranceVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-blue-lighten-2 mt-1" style="font-size: 0.65rem;">📄 Demande Assurance</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in insuranceVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #64b5f6; color: #64b5f6; background: rgba(100,181,246,0.1)">
                {{ v.name }}
              </span>
            </div>
          </div>
          
          <div v-if="needRepairVehicles?.length" class="mb-1">
            <div class="text-caption font-weight-bold text-purple-lighten-2 mt-1" style="font-size: 0.65rem;">🔧 À Réparer</div>
            <div class="d-flex flex-wrap mt-1" style="gap: 4px;">
              <span v-for="v in needRepairVehicles" :key="v.id" class="vehicle-badge" style="font-size: 0.55rem; padding: 1px 4px; border-color: #ce93d8; color: #ce93d8; background: rgba(206,147,216,0.1)">
                {{ v.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="far-right-panel">

                <div class="radios-wrapper mt-auto pa-2" style="border-top: 1px solid #334155; background: rgba(0,0,0,0.15)">
          <div class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-flex align-center flex-shrink-0">
            <v-icon size="14" class="mr-1">mdi-radio-handheld</v-icon> Stock Radios
            <span class="cnt ml-2" title="Radios standards prises / total">{{ standardRadios.filter(r => r.employeeId).length }} / {{ standardRadios.length }}</span>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn v-if="isDirection" v-bind="props" size="x-small" variant="plain" color="white" class="ml-auto" title="Ajouter une radio">
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
          <div class="mb-2 d-flex align-center bg-transparent flex-shrink-0" v-if="(dispatch?.radios||[]).length">
             <span class="text-caption font-weight-bold text-grey-lighten-1 mr-2"><v-icon size="12" class="mr-1">mdi-weather-night</v-icon> Nuit:</span>
             <select v-if="isDirection" v-model="dispatch.nuitRadioId" @change="dispatch.save()" class="location-input mx-1" style="border: 1px solid #334155; padding:2px; border-radius:4px; max-width:130px; font-weight:bold;">
                <option :value="null" style="background:#1a1f35">-- Aucune --</option>
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
                  <input v-if="isDirection" v-model="radio.serial" @change="dispatch.save()" class="location-input" style="width:50px; font-weight:bold" placeholder="# Série" />
                  <span v-else class="text-caption font-weight-bold mx-1" style="width:50px; display:inline-block; color:#94a3b8; text-align:center;">{{ radio.serial || '---' }}</span>
                  <select :value="radio.employeeId" @change="onRadioAssign(radio, $event.target.value)" class="location-input mx-1" style="border-left:1px solid #334155; padding-left:4px; max-width: 120px;">
                    <option :value="''" style="background:#1a1f35">-- Assigner --</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
                  </select>
                  <v-btn size="x-small" :color="radio.status === 'on' ? 'success' : 'error'" variant="tonal" class="ml-auto px-1" style="min-width: 32px; height: 18px; font-size: 0.6rem;" @click="toggleRadioStatus(radio)">
                    {{ radio.status === 'on' ? 'ON' : 'OFF' }}
                  </v-btn>
                  <v-btn v-if="isDirection" icon variant="plain" size="x-small" color="error" class="ml-1" @click="removeRadio(radio)" style="height:18px; width:18px">
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

    <div class="crises-bottom-section" style="border-top: 2px solid #334155; background: #0f172a; padding: 10px; width: 100%; box-sizing: border-box; flex-shrink: 0;">
      <div class="slot-section-title" style="background: linear-gradient(90deg, #ef4444 0%, #b91c1c 100%);">
        🚨 Dispatch de crises
        <span class="cnt ml-2">
          {{ treatedInjured }} / {{ totalInjured }}
        </span>
        <v-btn size="x-small" variant="plain" color="white" class="ml-auto" @click="addCrisisSlot">
          <v-icon size="13">mdi-plus</v-icon>
        </v-btn>
      </div>

      <div class="crises-list" style="margin-top: 10px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 0.75rem;">
              <th style="padding: 8px; font-weight: 500; text-align: center; width: 40px;">Coma</th>
              <th style="padding: 8px; font-weight: 500; text-align: center; width: 60px;">Lourd / Inconscient</th>
              <th style="padding: 8px; font-weight: 500;">Nom du patient</th>
              <th style="padding: 8px; font-weight: 500;">Appartenance</th>
              <th style="padding: 8px; font-weight: 500;">Raison</th>
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
            <tr v-for="crisis in (dispatch?.crises||[])" :key="crisis.id" 
              :style="[
                { borderBottom: '1px solid #1e293b' },
                crisis.canalCheckCentrale 
                  ? { background: 'rgba(128, 90, 213, 0.2)', borderLeft: '3px solid #9333ea' } 
                  : crisis.medicalStatus
                    ? { background: 'rgba(56, 189, 248, 0.15)', borderLeft: '3px solid #38bdf8' }
                    : crisis.treatedBy 
                      ? { background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }
                      : crisis.isHeavyInjured 
                        ? { background: 'rgba(239, 68, 68, 0.3)', borderLeft: '3px solid #ef4444' } 
                        : crisis.isComa 
                          ? { background: 'rgba(249, 115, 22, 0.2)', borderLeft: '3px solid #f97316' } 
                          : { background: 'rgba(255,0,0,0.05)' }
              ]">
              
              <td style="padding: 6px; text-align: center;">
                <input type="checkbox" v-model="crisis.isComa" @change="dispatch.save()" style="width: 16px; height: 16px; accent-color: #ef4444;" />
              </td>

              <td style="padding: 6px; text-align: center;">
                <input type="checkbox" v-model="crisis.isHeavyInjured" @change="dispatch.save()" style="width: 16px; height: 16px; accent-color: #f97316;" />
              </td>

              <td style="padding: 6px;">
                <input v-model="crisis.name" @change="dispatch.save()" class="location-input font-weight-bold text-red-lighten-2" style="font-size: 0.8rem; width: 100%; border-bottom: 1px solid transparent;" placeholder="Nom" />
              </td>

              <td style="padding: 6px;">
                <select v-model="crisis.affiliation" @change="onCrisisMetadataChange(crisis)" class="location-input font-weight-bold" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); width: 100%;" :style="{ color: crisisAffiliations.find(a => a.value === crisis.affiliation)?.color || '#fff' }">
                  <option v-for="aff in crisisAffiliations" :key="aff.value" :value="aff.value" style="background:#1a1f35" :style="{ color: aff.color || '#e2e8f0' }">{{ aff.label }}</option>
                </select>
              </td>

              <td style="padding: 6px;">
                <input v-model="crisis.reason" @change="dispatch.save()" class="location-input" placeholder="Raison" style="font-size: 0.75rem; background: rgba(0,0,0,0.2); padding: 5px 8px; border-radius: 4px; width: 100%; border: 1px solid #334155;" />
              </td>
              
              <td style="padding: 6px;">
                <select v-model="crisis.repatriatedBy" @change="dispatch.save()" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
                  <option :value="null" style="background:#1a1f35; color: #fff;">-- Sélectionner --</option>
                  <option v-for="emp in employees" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
                </select>
              </td>

              <td style="padding: 6px;">
                <label class="d-flex align-center cursor-pointer">
                  <input type="checkbox" v-model="crisis.arrivedAtHospital" @change="onCrisisArrivalChange(crisis)" class="mr-1" style="width: 14px; height: 14px;" />
                  <span v-if="crisis.arrivedAtHospital" class="text-caption ml-1 font-weight-bold" :class="crisis.id === nextCrisisIdToTreat ? 'text-red' : 'text-white'">{{ formatTime(crisis.arrivalTime) }}</span>
                </label>
              </td>
              
              <td style="padding: 6px;">
                <select v-model="crisis.treatedBy" @change="dispatch.save()" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; width: 100%; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
                  <option :value="null" style="background:#1a1f35; color: #fff;">-- Sélectionner --</option>
                  <option v-for="emp in employees" :key="emp.id" :value="emp.id" style="background:#1a1f35">{{ emp.name }}</option>
                </select>
              </td>
              
              <td style="padding: 6px;">
                <select v-model="crisis.medicalStatus" @change="dispatch.save()" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); font-weight: 600;" :style="{ color: crisisMedicalStatuses.find(s => s.value === crisis.medicalStatus)?.color || '#fff' }">
                  <option :value="null" style="background:#1a1f35; color: #fff;">-- Statut --</option>
                  <option v-for="stat in crisisMedicalStatuses" :key="stat.value" :value="stat.value" style="background:#1a1f35" :style="{ color: stat.color || '#e2e8f0' }">{{ stat.emoji ? stat.emoji + ' ' : '' }}{{ stat.label }}</option>
                </select>
              </td>
              
              <td style="padding: 6px;">
                <select v-model="crisis.bed" @change="dispatch.save()" class="location-input" style="border: 1px solid #334155; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.02); color: #fff; font-weight: 600;">
                  <option :value="null" style="background:#1a1f35; color: #fff;">-- Lit --</option>
                  <option v-for="bed in crisisBeds" :key="bed.value" :value="bed.value" style="background:#1a1f35">{{ bed.label }}</option>
                </select>
              </td>
              
              <td style="padding: 6px;">
                <label class="d-flex align-center cursor-pointer">
                  <input type="checkbox" v-model="crisis.canalCheckCentrale" @change="dispatch.save()" class="mr-1" style="width: 14px; height: 14px;" />
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

    <div class="beds-bottom-section" style="border-top: 2px solid #334155; background: #0f172a; padding: 10px; max-height: 800px; overflow-y: auto; width: 100%; box-sizing: border-box; flex-shrink: 0;">
      <div v-for="group in crisisBedGroups" :key="group.id" style="margin-bottom: 24px; border: 1px solid #1e293b; background: rgba(0,0,0,0.15);">
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
                      :value="getBedData(bedId).patientName" 
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
import Vehicle from '@/classes/Vehicle.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import {
  allCategories,
  interventionTypes,
  returnStatuses,
  centralRoles,
  hospitalStatuses,
  crisisMedicalStatuses,
  crisisAffiliations,
  crisisBeds,
  crisisBedGroups,
  complements
} from '@/config/dispatch.js'
import { trainingCompetencies } from '@/config/training_competencies.js'
import { roleOrder, getRoleColor as getRoleColorConfig } from '@/config/roles.js'
import logger from '@/functions/logger.js'

export default {
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
      unsub: null,
      unsubEmployees: null,
      unsubSpecialties: null,
      unsubVehicles: null,

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
      crisisMedicalStatuses,
      crisisAffiliations,
      crisisBeds,
      crisisBedGroups,
      complements,
    }
  },

  computed: {
    nextCrisisIdToTreat() {
      if (!this.dispatch || !this.dispatch.crises) return null
      const untreated = this.dispatch.crises.filter(c => c.arrivedAtHospital && !c.medicalStatus && !c.treatedBy)
      if (untreated.length === 0) return null
      return untreated.sort((a,b) => a.arrivalTime - b.arrivalTime)[0].id
    },
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
        allSpecialties: e.specialties || [],
        displayLabel: e.phone ? `${e.name} — ${e.phone}` : e.name,
      }))
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
    totalInjured() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      return this.dispatch.crises.filter(c => c.name && c.name.trim() !== '').length
    },
    treatedInjured() {
      if (!this.dispatch || !this.dispatch.crises) return 0
      return this.dispatch.crises.filter(c => c.name && c.name.trim() !== '' && c.medicalStatus).length
    },
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
    }
  },

  mounted() {
    this.fetchSafdStatus()
    this.safdInterval = setInterval(this.fetchSafdStatus, 60000)

    this.fetchBcesStatus()
    this.bcesInterval = setInterval(this.fetchBcesStatus, 60000)

    this.unsub = Dispatch.listenGlobal(data => { this.dispatch = data })
    this.unsubEmployees = Employee.listenAll(list => {
      this.employees = [...list].sort((a,b) => (a.name||'').localeCompare(b.name||''))
    })
    this.unsubSpecialties = Specialty.listenAll(list => { this.specialties = list })
    Vehicle.listenAll(list => { this.vehicles = list }).then(unsub => { this.unsubVehicles = unsub })
  },

  beforeUnmount() {
    if (this.safdInterval) clearInterval(this.safdInterval)
    if (this.bcesInterval) clearInterval(this.bcesInterval)
    if (this.unsub) this.unsub()
    if (this.unsubEmployees) this.unsubEmployees()
    if (this.unsubSpecialties) this.unsubSpecialties()
    if (this.unsubVehicles) this.unsubVehicles()
  },

  methods: {
    confirmResetDispatch() {
      Swal.fire({
        title: 'Réinitialiser le dispatch ?',
        text: 'Tout le monde sera mis en "Hors service", les interventions seront vidées, et toutes les radios seront éteintes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, réinitialiser',
        cancelButtonText: 'Annuler',
        background: '#1e293b',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetDispatch();
        }
      });
    },
    resetDispatch() {
      if (!this.dispatch) return;
      
      this.dispatch.patates = [];
      
      if (this.dispatch.centrale) {
        this.dispatch.centrale.employees = [];
      }
      
      if (this.dispatch.interventions) {
        this.dispatch.interventions.forEach(slot => {
          slot.employees = [];
        });
      }
      
      if (this.dispatch.radios) {
        this.dispatch.radios.forEach(radio => {
          radio.status = 'off';
        });
      }
      
      this.dispatch.save();
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
      const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby-YE2huHmXe9apJoz6jvkoZ3QY1e0LNPbrRr9EO6Yfgjo7z0klBo2Q-ok-SrFzk1tP/exec?action=bcesDispatchDoGet'
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
      const e = this.employees.find(e => e.id === empId)
      if (!e || !e.competencyProgress || !e.role) return []
      
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
        if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, complement: null, type: null, returnStatus: null, employees: [] }
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
      this.dispatch.centrale = { location: null, complement: null, type: null, returnStatus: null, employees: [] }
      await this.dispatch.save()
    },

    async removeEmpFromCentrale(employeeId) {
      if (!this.dispatch?.centrale) return
      this.dispatch.centrale.employees = (this.dispatch.centrale.employees||[]).filter(e => e.employeeId !== employeeId)
      await this.dispatch.save()
    },

    async setCentraleType(typeValue) {
      if (!this.dispatch) return
      if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, complement: null, type: null, returnStatus: null, employees: [] }
      this.dispatch.centrale.type = typeValue
      await this.dispatch.save()
    },

    async setCentraleReturnStatus(statusValue) {
      if (!this.dispatch) return
      if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, complement: null, type: null, returnStatus: null, employees: [] }
      this.dispatch.centrale.returnStatus = statusValue || null
      await this.dispatch.save()
    },

    async setCentraleLocation(loc) {
      if (!this.dispatch) return
      if (!this.dispatch.centrale) this.dispatch.centrale = { location: null, complement: null, type: null, returnStatus: null, employees: [] }
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

    getEmployeeEmoji(empId) {
      if (!empId) return '';
      const emp = this.employees.find(e => e.id === empId);
      if (!emp) return '';
      if (emp.role === 'Interne') return '🐣';
      return emp.emoji || '';
    },

    async addInterventionSlot() {
      if (!this.dispatch) return
      if ((this.dispatch.interventions || []).length >= 25) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 25 interventions.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
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

    async addCrisisSlot() {
      if (!this.dispatch) return
      if ((this.dispatch.crises || []).length >= 50) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 50 patients en crise.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
      this.dispatch.crises = [...(this.dispatch.crises||[]), {
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
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
      }]
      await this.dispatch.save()
    },

    async removeCrisisSlot(slotId) {
      this.dispatch.crises = this.dispatch.crises.filter(s=>s.id!==slotId)
      await this.dispatch.save()
    },

    async onCrisisArrivalChange(crisis) {
      if (crisis.arrivedAtHospital && !crisis.arrivalTime) {
        crisis.arrivalTime = Date.now()
      } else if (!crisis.arrivedAtHospital) {
        crisis.arrivalTime = null
      }
      await this.onCrisisMetadataChange(crisis)
    },

    async onCrisisMetadataChange(crisis) {
      if (!this.dispatch) return
      this.dispatch.crises = [...this.dispatch.crises].sort((a, b) => {
        const getAffIdx = (val) => {
          const idx = this.crisisAffiliations.findIndex(aff => aff.value === val)
          return idx === -1 ? 999 : idx
        }
        return getAffIdx(a.affiliation) - getAffIdx(b.affiliation)
      })
      await this.dispatch.save()
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const d = new Date(timestamp)
      const hrs = d.getHours().toString().padStart(2, '0')
      const mins = d.getMinutes().toString().padStart(2, '0')
      const secs = d.getSeconds().toString().padStart(2, '0')
      return `${hrs}:${mins}:${secs}`
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
    updateBedPatientName(bedValue, name) {
      if (!this.dispatch) return
      if (!this.dispatch.beds) this.dispatch.beds = {}
      if (!this.dispatch.beds[bedValue]) this.dispatch.beds[bedValue] = { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      
      const oldName = this.dispatch.beds[bedValue].patientName
      this.dispatch.beds[bedValue].patientName = name
      
      if (name && !oldName) {
        this.dispatch.beds[bedValue].admissionTime = Date.now()
      } else if (!name) {
        this.dispatch.beds[bedValue].admissionTime = null
      }
      this.dispatch.beds = { ...this.dispatch.beds }
      this.dispatch.save()
    },
    updateBedReason(bedValue, reason) {
      if (!this.dispatch) return
      if (!this.dispatch.beds) this.dispatch.beds = {}
      if (!this.dispatch.beds[bedValue]) this.dispatch.beds[bedValue] = { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      this.dispatch.beds[bedValue].reason = reason
      this.dispatch.beds = { ...this.dispatch.beds }
      this.dispatch.save()
    },
    updateBedFdo(bedValue, checked) {
      if (!this.dispatch) return
      if (!this.dispatch.beds) this.dispatch.beds = {}
      if (!this.dispatch.beds[bedValue]) this.dispatch.beds[bedValue] = { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      this.dispatch.beds[bedValue].fdoNotified = checked
      this.dispatch.beds = { ...this.dispatch.beds }
      this.dispatch.save()
    },
    updateBedEmergencyContacts(bedValue, checked) {
      if (!this.dispatch) return
      if (!this.dispatch.beds) this.dispatch.beds = {}
      if (!this.dispatch.beds[bedValue]) this.dispatch.beds[bedValue] = { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      this.dispatch.beds[bedValue].emergencyContactsNotified = checked
      this.dispatch.beds = { ...this.dispatch.beds }
      this.dispatch.save()
    },
    clearBed(bedValue) {
      if (!this.dispatch || !this.dispatch.beds) return
      this.dispatch.beds[bedValue] = { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }
      this.dispatch.beds = { ...this.dispatch.beds }
      this.dispatch.save()
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
        allSpecialties: emp ? (emp.specialties || []) : [],
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
        allSpecialties: emp ? (emp.specialties || []) : [],
        category: categoryValue,
      }]
      await this.dispatch.save()
      this.quickAddDialog = false
    },

    async addRadio(category = 'standard') {
      if (!this.dispatch) return
      if ((this.dispatch.radios || []).length >= 30) {
        Swal.fire({ title: 'Limite atteinte', text: 'Vous ne pouvez pas ajouter plus de 30 radios.', icon: 'warning', background: '#1e293b', color: '#fff' })
        return
      }
      this.dispatch.radios = [...(this.dispatch.radios||[]), {
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        serial: '',
        employeeId: null,
        status: 'on',
        category
      }]
      await this.dispatch.save()
    },
    async onRadioAssign(radio, newEmpId) {
      const oldEmpId = radio.employeeId
      if (!radio.employeeId && newEmpId) {
        radio.status = 'on'
      } else if (radio.employeeId && !newEmpId) {
        radio.status = 'off'
      }
      radio.employeeId = newEmpId || null
      this.dispatch.radios = [...this.dispatch.radios]
      await this.dispatch.save()

      if (oldEmpId !== newEmpId) {
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

      this.dispatch.radios = (this.dispatch.radios||[]).filter(r => r.id !== radio.id)
      await this.dispatch.save()
    },
    async toggleRadioStatus(radio) {
      radio.status = radio.status === 'on' ? 'off' : 'on'
      this.dispatch.radios = [...this.dispatch.radios]
      await this.dispatch.save()
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
  grid-template-columns: 230px 1fr 350px 280px;
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
  grid-template-columns: 230px 1fr 350px 280px;
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
.pc-name { font-size: 0.7rem; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-phone { font-size: 0.62rem; color: #cbd5e1; }
.pc-validations { margin-top: 1px; font-size: 11px; display: flex; flex-wrap: wrap; gap: 2px; }
.val-emoji { cursor: default; }
.pc-specs { font-size: 0.6rem; line-height: 1.1; margin-top: 1px; }
.pc-role  { font-size: 0.58rem; font-weight: 700; margin-top: 1px; letter-spacing: 0.02em; }
.spec-emoji { cursor: default; }
.pc-helico-icon { position: absolute; top: 4px; right: 4px; color: #ffb74d; }

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
}
.inner-bottom-panel:nth-child(2n) { border-right: none; }
.inner-bottom-panel:nth-child(n+3) { border-top: 1px solid #334155; }
.inner-bottom-panel.drop-over { filter: brightness(1.1); }
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
</style>

