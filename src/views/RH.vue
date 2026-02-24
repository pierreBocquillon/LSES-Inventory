<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Ressources Humaines</h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Ajouter un employé
      </v-btn>
      <v-btn color="secondary" class="ml-2" prepend-icon="mdi-cog" @click="openSpecialtiesDialog">
        Spécialités
      </v-btn>
      <v-btn color="info" class="ml-2" prepend-icon="mdi-clipboard-list" @click="openChecklistsDialog">
        Procédures
      </v-btn>
      <v-btn color="deep-purple" class="ml-2" prepend-icon="mdi-school" @click="openTrackingSelection">
        Formation RH
      </v-btn>
      <v-btn color="success" class="ml-2" prepend-icon="mdi-contacts" @click="openDirectoryDialog">
        Annuaire
      </v-btn>
      <v-badge color="error" :content="waitingCandidaturesCount" :model-value="waitingCandidaturesCount > 0" class="ml-2">
        <v-btn color="deep-purple" prepend-icon="mdi-file-document-edit" @click="openCandidatureDialog">
          Candidatures
        </v-btn>
      </v-badge>
      <v-badge color="amber" :content="promotionRequests.length" :model-value="promotionRequests.length > 0" class="ml-2">
        <v-btn color="amber-darken-2" prepend-icon="mdi-medal" @click="openPromotionRequestsDialog">
          Promotions
        </v-btn>
      </v-badge>


    </div>

    <v-row class="mb-2">
      <!-- Weekly Checklist -->
      <v-col cols="12" md="6">
        <v-expansion-panels multiple>
          <v-expansion-panel>
            <v-expansion-panel-title class="bg-blue-lighten-4 font-weight-bold">
              <div class="d-flex flex-grow-1 align-center justify-space-between mr-2">
                <div class="d-flex align-center">
                  <v-icon start class="mr-2">mdi-checkbox-marked-outline</v-icon>
                  Hebdomadaire
                  <v-chip v-if="weeklyOverdueCount > 0" color="red" size="x-small" class="ml-2 font-weight-bold" variant="flat">
                    {{ weeklyOverdueCount }} à faire
                  </v-chip>
                </div>

              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="d-flex align-center mb-2">
                <v-text-field v-model="newWeeklyTask" label="Nouvelle tâche" density="compact" hide-details variant="outlined" class="mr-2" style="flex: 2;" @keyup.enter="addWeeklyTask"></v-text-field>
                <v-text-field v-model="newWeeklyTaskLink" label="Lien (optionnel)" density="compact" hide-details variant="outlined" class="mr-2" style="flex: 1;" prepend-inner-icon="mdi-link" @keyup.enter="addWeeklyTask"></v-text-field>
                <v-btn color="success" size="small" icon="mdi-plus" @click="addWeeklyTask"></v-btn>

              </div>
              <v-list density="compact" style="max-height: 200px; overflow-y: auto;">
                <v-list-item v-for="task in weeklyTasks" :key="task.id" :value="task">

                  <div class="d-flex align-center w-100">
                    <span :class="{ 'text-grey': task.done, 'text-red font-weight-bold': isTaskOverdue(task, 'weekly') }">{{ task.text }}</span>
                    <a v-if="task.link" :href="task.link" target="_blank" class="ml-1 text-decoration-none" @click.stop>
                      <v-icon size="small" color="primary">mdi-open-in-new</v-icon>
                    </a>
                    <span v-if="task.done" class="text-caption ml-2 text-no-wrap" :class="isTaskOverdue(task, 'weekly') ? 'text-red font-weight-bold' : 'text-grey'">{{ getCheckDate(task.doneAt) }}</span>

                    <v-btn icon="mdi-update" size="x-small" variant="text" color="primary" class="ml-1" title="Actualiser la date" @click.stop="updateWeeklyTaskDate(task.id)"></v-btn>

                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="grey" class="ml-2" @click="removeWeeklyTask(task.id)"></v-btn>
                  </div>
                </v-list-item>
                <div v-if="weeklyTasks.length === 0" class="text-caption text-grey text-center">Aucune tâche.</div>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <!-- Monthly Checklist -->
      <v-col cols="12" md="6">
        <v-expansion-panels multiple>
          <v-expansion-panel>
            <v-expansion-panel-title class="bg-indigo-lighten-4 font-weight-bold">
              <div class="d-flex flex-grow-1 align-center justify-space-between mr-2">
                <div class="d-flex align-center">
                  <v-icon start class="mr-2">mdi-calendar-month</v-icon>
                  Mensuelle
                  <v-chip v-if="monthlyOverdueCount > 0" color="red" size="x-small" class="ml-2 font-weight-bold" variant="flat">
                    {{ monthlyOverdueCount }} à faire
                  </v-chip>
                </div>

              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="d-flex align-center mb-2">
                <v-text-field v-model="newMonthlyTask" label="Nouvelle tâche" density="compact" hide-details variant="outlined" class="mr-2" style="flex: 2;" @keyup.enter="addMonthlyTask"></v-text-field>
                <v-text-field v-model="newMonthlyTaskLink" label="Lien (optionnel)" density="compact" hide-details variant="outlined" class="mr-2" style="flex: 1;" prepend-inner-icon="mdi-link" @keyup.enter="addMonthlyTask"></v-text-field>
                <v-btn color="success" size="small" icon="mdi-plus" @click="addMonthlyTask"></v-btn>

              </div>
              <v-list density="compact" style="max-height: 200px; overflow-y: auto;">
                <v-list-item v-for="task in monthlyTasks" :key="task.id" :value="task">

                  <div class="d-flex align-center w-100">
                    <span :class="{ 'text-grey': task.done, 'text-red font-weight-bold': isTaskOverdue(task, 'monthly') }">{{ task.text }}</span>
                    <a v-if="task.link" :href="task.link" target="_blank" class="ml-1 text-decoration-none" @click.stop>
                      <v-icon size="small" color="primary">mdi-open-in-new</v-icon>
                    </a>
                    <span v-if="task.done" class="text-caption ml-2 text-no-wrap" :class="isTaskOverdue(task, 'monthly') ? 'text-red font-weight-bold' : 'text-grey'">{{ getCheckDate(task.doneAt) }}</span>

                    <v-btn icon="mdi-update" size="x-small" variant="text" color="primary" class="ml-1" title="Actualiser la date" @click.stop="updateMonthlyTaskDate(task.id)"></v-btn>

                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="grey" class="ml-2" @click="removeMonthlyTask(task.id)"></v-btn>
                  </div>
                </v-list-item>
                <div v-if="monthlyTasks.length === 0" class="text-caption text-grey text-center">Aucune tâche.</div>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <v-card class="flex-grow-1">
      <v-data-table :headers="headers" :items="employees" :search="search" class="h-100" :sort-by="[{ key: 'role', order: 'asc' }]">
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="blue" v-if="item.sex === 'Homme'" class="mr-2">mdi-gender-male</v-icon>
            <v-icon color="pink" v-else-if="item.sex === 'Femme'" class="mr-2">mdi-gender-female</v-icon>
            <v-icon v-else class="mr-2">mdi-account</v-icon>
            {{ item.name }}
            <v-tooltip location="top" v-if="isBirthday(item.birthDate)">
              <template v-slot:activator="{ props }">
                <v-icon color="amber" class="ml-2" v-bind="props" size="small">mdi-cake-variant</v-icon>
              </template>
              <span>C'est son anniversaire !</span>
            </v-tooltip>

            <v-tooltip location="top" v-if="needsHeliReimbursement(item)">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" density="compact" color="red" class="ml-2" v-bind="props" @click="confirmReimbursement(item)">
                  <v-icon>mdi-helicopter</v-icon>
                </v-btn>
              </template>
              <span>Remboursement formation hélico dû ! Cliquer pour valider.</span>
            </v-tooltip>


            <v-tooltip location="top" v-if="item.simpleFault">
              <template v-slot:activator="{ props }">
                <v-icon color="error" class="ml-2 cursor-pointer" v-bind="props" @click="showFaultDetails(item)">
                  mdi-alert-circle
                </v-icon>
              </template>
              <div class="text-center">
                <strong>Faute simple</strong><br>
                {{ item.simpleFault.reason }}<br>
                <span class="text-caption">Expire le : {{ formatDate(item.simpleFault.expireDate) }}</span>
              </div>
            </v-tooltip>

            <v-tooltip location="top" v-if="item.suspension">
              <template v-slot:activator="{ props }">
                <v-icon color="deep-purple" class="ml-2 cursor-pointer" v-bind="props" @click="showSuspensionDetails(item)">
                  mdi-shoe-print
                </v-icon>
              </template>
              <div class="text-center">
                <strong>Mise à pied</strong><br>
                Début : {{ formatDate(item.suspension.startDate) }}<br>
                <span class="text-caption">Durée : {{ item.suspension.duration }} jour(s)</span>
              </div>
            </v-tooltip>
          </div>
        </template>
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Liste des employés</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-tooltip text="Synchroniser avec le Drive" location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" color="grey-darken-1" class="mr-2" v-bind="props" @click="syncEmployees">
                  <v-icon>mdi-sync</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip :text="showAllEmails ? 'Cacher les emails' : 'Afficher les emails'" location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" color="grey-darken-1" @click="showAllEmails = !showAllEmails" class="mr-2" v-bind="props">
                  <v-icon>{{ showAllEmails ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Statistiques" location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon variant="text" color="grey-darken-1" class="mr-2" v-bind="props" @click="openStatisticsDialog">
                  <v-icon>mdi-chart-bar</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" single-line hide-details density="compact" class="mr-4" style="max-width: 300px"></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.email="{ item }">
          <span :class="{ 'blurred-email': !showAllEmails }">
            {{ item.email }}
          </span>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" size="small">
            {{ item.role }}
          </v-chip>
        </template>

        <template v-slot:item.specialties="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip v-for="spec in item.specialties" :key="spec" size="x-small" class="mr-1 mb-1" :color="item.chiefSpecialties && item.chiefSpecialties.includes(spec) ? 'amber-darken-3' : undefined" :variant="item.chiefSpecialties && item.chiefSpecialties.includes(spec) ? 'flat' : 'tonal'">
              <v-icon v-if="item.chiefSpecialties && item.chiefSpecialties.includes(spec)" start size="x-small">mdi-crown</v-icon>
              {{ getSpecialtyIcon(spec) }} {{ getSpecialtyName(spec) }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip text="Modifier l'employé" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="primary" v-bind="props" @click="editEmployee(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Supprimer l'employé" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="error" v-bind="props" @click="deleteEmployee(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Voir le dossier" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="info" v-bind="props" @click="openDetails(item)">
                <v-icon>mdi-calendar</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip v-if="!item.simpleFault" text="Ajouter une faute" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="orange-darken-4" v-bind="props" @click="openFaultDialog(item)">
                <v-icon>mdi-alert-plus</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip v-else text="Supprimer la faute" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="green" v-bind="props" @click="deleteFault(item)">
                <v-icon>mdi-alert-remove</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip v-if="!item.suspension" text="Mise à pied" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="deep-purple" v-bind="props" @click="openSuspensionDialog(item)">
                <v-icon>mdi-shoe-print</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip v-else text="Supprimer la mise à pied" location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" color="teal" v-bind="props" @click="deleteSuspension(item)">
                <v-icon>mdi-account-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="editedItem.name" label="Nom complet" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select v-model="editedItem.sex" :items="['Homme', 'Femme']" label="Sexe" variant="outlined"></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedItem.email" label="Email (Gmail)" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedItem.phone" label="Téléphone" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select v-model="editedItem.role" :items="['Interne', 'Résident', 'Titulaire', 'Spécialiste', 'Responsable de Service', 'Assistant RH', 'Directeur Adjoint', 'Directeur']" label="Rôle" variant="outlined" @update:model-value="onRoleChange"></v-select>
              </v-col>
              <v-col cols="12">
                <v-select v-model="editedItem.specialties" :items="specialties" item-title="name" item-value="value" label="Spécialités" multiple chips closable-chips variant="outlined">
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :prepend-icon="null">
                      <template v-slot:prepend>
                        <span class="mr-2">{{ item.raw.icon }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <v-chip size="small">
                      <span class="mr-2">{{ item.raw.icon }}</span>
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" v-if="editedItem.specialties && editedItem.specialties.length > 0">
                <v-select v-model="editedItem.chiefSpecialties" :items="getAvailableChiefSpecialties()" item-title="name" item-value="value" label="Spécialité Admin" variant="outlined" clearable multiple chips closable-chips></v-select>
              </v-col>
            </v-row>
          </v-container>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.birthDate" label="Date de naissance" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.arrivalDate" label="Date d'arrivée" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.cdiDate" label="Date CDI" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.lastPromotionDate" label="Dernière promotion" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.medicalDegreeDate" label="Diplôme Médecine" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.helicopterTrainingDate" label="Formation Hélico" type="date" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox v-model="editedItem.helicopterTrainingReimbursed" label="Hélico Remboursé" density="compact" hide-details></v-checkbox>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">
            Annuler
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save">
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailsDialog" max-width="500px">
      <v-card v-if="selectedEmployee">
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">Dossier de {{ selectedEmployee.name }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-cake" color="pink"></v-icon></template>
              <v-list-item-title>Date de naissance</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEmployee.birthDate) }} ({{ calculateAge(selectedEmployee.birthDate) }} ans)</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-school" color="teal"></v-icon></template>
              <v-list-item-title>Obtention Diplôme Médecine</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEmployee.medicalDegreeDate) }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-clock-outline" color="blue"></v-icon></template>
              <v-list-item-title>Ancienneté Service</v-list-item-title>
              <v-list-item-subtitle>{{ calculateSeniority(selectedEmployee.arrivalDate) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-calendar-check" color="green"></v-icon></template>
              <v-list-item-title>Jours depuis l'arrivée</v-list-item-title>
              <v-list-item-subtitle>{{ calculateDays(selectedEmployee.arrivalDate) }} jours</v-list-item-subtitle>
            </v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-file-document-edit-outline" color="orange"></v-icon></template>
              <v-list-item-title>Signature CDI</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEmployee.cdiDate) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-trending-up" color="purple"></v-icon></template>
              <v-list-item-title>Dernière promotion</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEmployee.lastPromotionDate) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend><v-icon icon="mdi-medal" color="amber"></v-icon></template>
              <v-list-item-title>Jours au grade</v-list-item-title>
              <v-list-item-subtitle>{{ calculateDays(selectedEmployee.lastPromotionDate) }} jours</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="detailsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="specialtiesDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-secondary text-white">
          <span class="text-h5">Gérer les spécialités</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row class="align-center">
              <v-col cols="3">
                <v-text-field v-model="newSpecialty.icon" label="Emoji" variant="outlined" hide-details></v-text-field>
              </v-col>
              <v-col cols="7">
                <v-text-field v-model="newSpecialty.name" label="Nom de la spécialité" variant="outlined" hide-details></v-text-field>
              </v-col>
              <v-col cols="2">
                <v-btn color="primary" icon="mdi-plus" @click="addSpecialty"></v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-checkbox v-model="newSpecialty.canTakeAppointments" label="Peut prendre des RDV" density="compact" hide-details></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
            <v-list density="compact">
              <v-list-item v-for="spec in specialties" :key="spec.id">
                <template v-slot:prepend>
                  <span class="text-h6 mr-4">{{ spec.icon }}</span>
                </template>
                <v-list-item-title>
                  {{ spec.name }}
                  <v-chip v-if="spec.canTakeAppointments" size="x-small" color="success" class="ml-2">Gère RDV</v-chip>
                </v-list-item-title>
                <template v-slot:append>
                  <v-btn icon="mdi-calendar-check" size="small" variant="text" :color="spec.canTakeAppointments ? 'success' : 'grey'" class="mr-2" @click="toggleSpecialtyAppointments(spec)" title="Activer/Désactiver RDV"></v-btn>
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeSpecialty(spec)"></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="specialtiesDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="checklistDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-info text-white">
          <span class="text-h5">Procédures RH</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-select v-model="selectedChecklistId" :items="rhChecklists" item-title="title" item-value="id" label="Choisir une procédure" variant="outlined" @update:model-value="resetChecklist">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :prepend-icon="item.raw.icon"></v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <v-icon start>{{ item.raw.icon }}</v-icon>
              {{ item.title }}
            </template>
          </v-select>

          <div v-if="currentChecklist">
            <div class="d-flex align-center mb-2">
              <v-progress-linear v-model="checklistProgress" color="success" height="20" striped>
                <template v-slot:default="{ value }">
                  <strong>{{ Math.ceil(value) }}%</strong>
                </template>
              </v-progress-linear>
            </div>
            <v-divider class="mb-3"></v-divider>
            <v-list density="compact">
              <template v-for="(step, index) in currentChecklist.steps" :key="index">
                <!-- Header -->
                <v-list-subheader v-if="typeof step === 'object' && step.header" class="font-weight-bold text-uppercase mt-2">
                  {{ step.header }}
                </v-list-subheader>

                <!-- Checklist Item -->
                <v-list-item v-else>
                  <template v-slot:prepend>
                    <v-checkbox-btn v-model="checkedSteps[index]" color="success"></v-checkbox-btn>
                  </template>
                  <v-list-item-title class="text-wrap" :class="{ 'text-decoration-line-through text-grey': checkedSteps[index] }">
                    <span v-if="typeof step === 'string'">{{ step }}</span>
                    <span v-else>
                      {{ step.text }}
                      <a v-if="step.link" :href="step.link.url" target="_blank" class="ml-1 text-decoration-none" @click.stop>
                        <v-icon size="small" color="primary">mdi-open-in-new</v-icon> {{ step.link.text }}
                      </a>
                    </span>
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </div>
          <div v-else class="text-center text-grey my-4">
            Sélectionnez une procédure pour voir les étapes.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" @click="resetChecklist" v-if="currentChecklist">Tout décocher</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="checklistDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span class="text-h5">Confirmer la suppression</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">Êtes-vous sûr de vouloir supprimer l'employé "{{ itemToDelete?.name }}" ?</p>
          <v-select v-model="deleteReason" :items="['Abandon de poste', 'Licenciement', 'Démission', 'Autre']" label="Raison de la suppression" variant="outlined" hide-details="auto"></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Annuler</v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <v-dialog v-model="trackingSelectionDialog" max-width="900px" scrollable persistent>
      <v-card>
        <v-card-title class="bg-deep-purple text-white d-flex align-center">
          <span class="text-h5">Formation RH</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="trackingSelectionDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-4" style="max-height: 80vh;">
          <v-autocomplete
            :items="rhEmployees"
            item-title="name"
            label="Ajouter un employé au suivi"
            variant="outlined"
            return-object
            prepend-inner-icon="mdi-account-plus"
            density="compact"
            class="mb-4"
            @update:model-value="addRHTrainee"
          ></v-autocomplete>

          <div v-if="rhTrainees.length > 0">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel v-for="emp in rhTrainees" :key="emp.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center flex-grow-1 mr-4">
                    <v-avatar color="deep-purple" size="32" class="text-white mr-3">{{ emp.name.charAt(0) }}</v-avatar>
                    <div class="flex-grow-1">
                      <div class="font-weight-medium">{{ emp.name }}</div>
                      <v-progress-linear
                        :model-value="getEmployeeOverallProgress(emp)"
                        :color="getCompetencyColor(getEmployeeOverallProgress(emp))"
                        height="4"
                        rounded
                        class="mt-1"
                        style="max-width: 200px;"
                      ></v-progress-linear>
                    </div>
                    <span class="text-caption ml-2">{{ getEmployeeOverallProgress(emp) }}%</span>
                    <v-btn icon size="x-small" variant="text" color="error" class="ml-2" @click.stop="toggleRHTrainee(emp)">
                      <v-icon size="small">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-table density="compact">
                    <tbody>
                      <template v-for="category in rhValidation" :key="category.id">
                        <tr>
                          <td colspan="2" class="text-subtitle-2 font-weight-bold text-white bg-deep-purple">
                            {{ category.title }}
                            <v-progress-circular
                              :model-value="getEmployeeCategoryProgress(emp, category)"
                              :color="getCompetencyColor(getEmployeeCategoryProgress(emp, category))"
                              size="20"
                              width="3"
                              class="ml-2"
                            ></v-progress-circular>
                          </td>
                        </tr>
                        <tr v-for="item in category.items" :key="item.id">
                          <td class="pl-4">{{ item.title }}</td>
                          <td class="text-center" style="width: 150px;">
                            <v-chip
                              :color="getEmployeeItemStatusColor(emp, item.id)"
                              size="small"
                              variant="flat"
                              class="cursor-pointer"
                              @click="toggleEmployeeItemStatus(emp, item.id)"
                            >
                              {{ getEmployeeItemStatusLabel(emp, item.id) }}
                            </v-chip>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </v-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div v-else class="text-center text-grey my-4">
            Aucun employé en formation. Utilisez le champ ci-dessus pour en ajouter.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>


    <v-dialog v-model="directoryDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-success text-white">
          <span class="text-h5">Annuaire ({{ sortedDirectoryEmployees.length }})</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <div ref="directoryTableContainer">
            <v-data-table :headers="directoryHeaders" :items="sortedDirectoryEmployees" density="compact" items-per-page="-1" class="elevation-1" :row-props="directoryRowProps">
              <template v-slot:bottom></template>
            </v-data-table>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="pink" prepend-icon="mdi-camera" variant="text" @click="captureDirectoryImage">
            Screenshot
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="directoryDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <v-dialog v-model="statisticsDialog" max-width="850px">
      <v-card>
        <v-toolbar color="blue-grey" title="Statistiques RH">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="statisticsDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4 bg-grey-lighten-4">
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-card class="py-4 text-center" elevation="2">
                <div class="text-h3 font-weight-bold text-primary">
                  <AnimatedCounter :key="statsKey" :value="employees.length" :duration="2000" />
                </div>
                <div class="text-subtitle-1 text-grey-darken-1">Employés Total</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="py-4 text-center" elevation="2">
                <div class="text-h3 font-weight-bold text-blue">
                  <AnimatedCounter :key="statsKey" :value="employees.filter(e => e.sex === 'Homme').length" :duration="2000" />
                </div>
                <div class="text-subtitle-1 text-grey-darken-1">Hommes</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="py-4 text-center" elevation="2">
                <div class="text-h3 font-weight-bold text-pink">
                  <AnimatedCounter :key="statsKey" :value="employees.filter(e => e.sex === 'Femme').length" :duration="2000" />
                </div>
                <div class="text-subtitle-1 text-grey-darken-1">Femmes</div>
              </v-card>
            </v-col>
          </v-row>
          <div v-if="showCharts">
            <v-row>
              <v-col cols="12" md="6">
                <v-card class="h-100 pa-4" elevation="2">
                  <v-card-title class="text-center">Répartition des Grades</v-card-title>
                  <div style="height: 180px; position: relative;">
                    <Pie :data="rankChartData" :options="chartOptions" />
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card class="h-100 pa-4" elevation="2">
                  <v-card-title class="text-center">Parité Hommes / Femmes</v-card-title>
                  <div style="height: 180px; position: relative;">
                    <Pie :data="genderChartData" :options="chartOptions" />
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card class="h-100 pa-4" elevation="2">
                  <v-card-title class="text-center">Répartition des Spécialités</v-card-title>
                  <div style="height: 180px; position: relative;">
                    <Bar :data="specialtyChartData" :options="barChartOptions" />
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card class="h-100 pa-4" elevation="2">
                  <v-card-title class="text-center">Stagnation Moyenne (Jours)</v-card-title>
                  <div style="height: 180px; position: relative;">
                    <Bar :data="promotionChartData" :options="barChartOptions" />
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
          <div v-else class="d-flex justify-center align-center" style="height: 220px;">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="candidatureDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="bg-deep-purple text-white d-flex align-center">
          <span class="text-h5">Gestion des Candidatures</span>
          <v-spacer></v-spacer>
          <v-btn color="white" variant="text" prepend-icon="mdi-plus" @click="openCandidatureForm()">
            Ajouter
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-data-table class="candidature-table" :headers="candidatureHeaders" :items="candidatures" items-per-page="5">
            <template v-slot:item.status="{ item }">
              <v-chip :color="getCandidatureStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="mr-2" color="primary" @click="openCandidatureForm(item)">mdi-pencil</v-icon>
              <v-icon size="small" color="error" @click="deleteCandidature(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="candidatureDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="candidatureFormDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-deep-purple text-white">
          <span class="text-h5">{{ editedCandidature.id ? 'Modifier' : 'Nouvelle' }} Candidature</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedCandidature.name" label="Nom complet" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedCandidature.phone" label="Téléphone" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedCandidature.email" label="Email (@discord.gg)" variant="outlined" hint="Doit finir par @discord.gg"></v-text-field>
              </v-col>
              <v-col cols="12">
                <div class="text-subtitle-2 mb-1">Statut</div>
                <v-select v-model="editedCandidature.status" :items="['Candidature reçue', 'Appel pour entretien', 'Entretien planifié', 'Entretien en cours d\'analyse', 'Recrutement planifié', 'Refusé']" variant="outlined" hide-details></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedCandidature.availabilities" label="Disponibilités" variant="outlined" rows="3"></v-textarea>
              </v-col>
            </v-row>

            <v-expand-transition>
              <div v-if="editedCandidature.status === 'Entretien en cours d\'analyse'">
                <v-divider class="my-4"></v-divider>
                <div class="text-h6 mb-2 text-center">Avis des RH</div>
                <div class="d-flex justify-center mb-4">
                  <v-btn :color="editedCandidature.votes && editedCandidature.votes[userStore.profile.id] === 'pour' ? 'success' : 'grey-lighten-2'" class="mr-4" prepend-icon="mdi-thumb-up" @click="vote('pour')">
                    POUR ({{Object.values(editedCandidature.votes || {}).filter(v => v === 'pour').length}})
                  </v-btn>
                  <v-btn :color="editedCandidature.votes && editedCandidature.votes[userStore.profile.id] === 'contre' ? 'error' : 'grey-lighten-2'" prepend-icon="mdi-thumb-down" @click="vote('contre')">
                    CONTRE ({{Object.values(editedCandidature.votes || {}).filter(v => v === 'contre').length}})
                  </v-btn>
                </div>
              </div>
            </v-expand-transition>
            <v-expand-transition>
              <div v-if="['Entretien planifié', 'Entretien en cours d\'analyse', 'Recrutement planifié', 'Refusé'].includes(editedCandidature.status)">
                <v-divider class="my-4"></v-divider>
                <div class="text-h6 mb-2">Questionnaire Entretien</div>
                <v-row>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Motivations</div>
                    <v-textarea v-model="editedCandidature.answers.motivations" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Que faisiez-vous avant d'arriver sur l'île ?</div>
                    <v-textarea v-model="editedCandidature.answers.background_before" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Qu'avez-vous fait depuis ?</div>
                    <v-textarea v-model="editedCandidature.answers.background_since" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Pourquoi pas le BCES ?</div>
                    <v-textarea v-model="editedCandidature.answers.why_not_bces" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Êtes-vous stressé au naturel ? Quand vous l'êtes, comment le gérez vous ?</div>
                    <v-textarea v-model="editedCandidature.answers.stress_management" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Quelles sont, pour vous, les sources de stress d'un médecin ?</div>
                    <v-textarea v-model="editedCandidature.answers.stress_sources" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Avez-vous des soucis avec l'hélico, la conduite, la plongée ou les fusillades/armes ?</div>
                    <v-textarea v-model="editedCandidature.answers.specific_issues" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-1">3 qualités</div>
                    <v-textarea v-model="editedCandidature.answers.qualities" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-1">3 défauts</div>
                    <v-textarea v-model="editedCandidature.answers.flaws" variant="outlined" rows="2" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-1">Commentaires du RH</div>
                    <v-textarea v-model="editedCandidature.answers.rh_comments" variant="outlined" rows="3" auto-grow hide-details :readonly="!['Entretien planifié'].includes(editedCandidature.status)" :class="{ 'text-medium-emphasis': !['Entretien planifié'].includes(editedCandidature.status) }"></v-textarea>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </v-container>
        </v-card-text>

        <v-card-actions class="d-flex flex-column align-center">
          <div class="d-flex mb-2">
            <v-btn color="grey" variant="text" @click="candidatureFormDialog = false">Annuler</v-btn>
            <v-btn color="deep-purple" variant="text" @click="saveCandidature">Sauvegarder</v-btn>
          </div>
          <template v-if="editedCandidature.status === 'Entretien en cours d\'analyse'">
            <div class="d-flex">
              <v-btn color="error" variant="text" prepend-icon="mdi-close" @click="confirmFinalize('reject')">Refuser</v-btn>
              <v-btn color="success" variant="text" prepend-icon="mdi-check" @click="confirmFinalize('accept')">Embaucher</v-btn>
            </div>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="promotionRequestsDialog" max-width="700px">
      <v-card>
        <v-card-title class="bg-amber-darken-2 text-white">
          <span class="text-h5">Demandes de promotion</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-list v-if="promotionRequests.length > 0">
            <v-list-item v-for="emp in promotionRequests" :key="emp.id">
              <template v-slot:prepend>
                <v-avatar color="primary" class="text-white">{{ emp.name.charAt(0) }}</v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">{{ emp.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ (emp.promotionRequest.value || emp.promotionRequest) === 'Intégration RH' ? 'Demande :' : 'Candidature Responsable Pôle :' }}
                <v-chip size="small" class="ml-2">
                  {{ getSpecialtyIcon(emp.promotionRequest.value || emp.promotionRequest) }} {{ getSpecialtyName(emp.promotionRequest.value || emp.promotionRequest) }}
                </v-chip>
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="emp.promotionRequest.motivation" class="mt-2 text-wrap">
                <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>
                <i>"{{ emp.promotionRequest.motivation }}"</i>
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn color="success" icon="mdi-check" size="small" variant="text" @click="acceptPromotion(emp)" class="mr-2"></v-btn>
                <v-btn color="error" icon="mdi-close" size="small" variant="text" @click="rejectPromotion(emp)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center text-grey my-4">
            Aucune demande en attente.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="promotionRequestsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="faultDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-error text-white">
          <span class="text-h5">Ajouter une faute simple</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-2">Employé : <strong>{{ faultEmployee?.name }}</strong></p>
          <v-textarea v-model="faultReason" label="Raison de la faute" variant="outlined" rows="3" auto-grow></v-textarea>
          <p class="text-caption text-grey">Cette faute s'effacera automatiquement dans 30 jours.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="faultDialog = false">Annuler</v-btn>
          <v-btn color="error" variant="text" @click="saveFault">Ajouter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="suspensionDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-deep-purple text-white">
          <span class="text-h5">Mise à pied</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">Employé : <strong>{{ suspensionEmployee?.name }}</strong></p>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="suspensionStartDate" label="Date de début" type="date" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="suspensionDuration" label="Durée (jours)" type="number" min="1" variant="outlined"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="suspensionDialog = false">Annuler</v-btn>
          <v-btn color="deep-purple" variant="text" @click="saveSuspension">Appliquer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Employee from '@/classes/Employee'
import Specialty from '@/classes/Specialty'
import SharedChecklist from '@/classes/SharedChecklist'
import Candidature from '@/classes/Candidature'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { rhChecklists } from '@/config/rh_checklists'
import { rhValidation } from '@/config/rh_validation'
import { useUserStore } from '@/store/user.js'
import logger from '@/functions/logger.js'
import html2canvas from 'html2canvas'
import {
  Chart as ChartJS,
  registerables
} from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'
import AnimatedCounter from '@/components/AnimatedCounter.vue'

ChartJS.register(...registerables)

export default {
  name: 'RH',
  components: { Pie, Bar, AnimatedCounter },
  data: () => ({

    userStore: useUserStore(),
    dialog: false,

    // Checklists
    weeklyTasks: [],
    lastWeekReset: null,
    newWeeklyTask: '',
    newWeeklyTaskLink: '',

    monthlyTasks: [],
    lastMonthReset: null,
    newMonthlyTask: '',
    newMonthlyTaskLink: '',

    deleteDialog: false,
    statisticsDialog: false,
    showCharts: false,
    statsKey: 0,
    chartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    },
    barChartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    },
    itemToDelete: null,
    deleteReason: null,
    specialtiesDialog: false,
    search: '',
    specialties: [],
    newSpecialty: {
      name: '',
      icon: ''
    },

    // Checklists
    checklistDialog: false,

    // Tracking
    trackingSelectionDialog: false,
    selectedEmployeeForTracking: null,
    trackingDialog: false,
    selectedTrackingEmployee: null,
    rhValidation: rhValidation,
    rhStatuses: [
        { value: 'not_seen', label: 'Non vue', color: 'grey', icon: 'mdi-eye-off' },
        { value: 'seen', label: 'Vue', color: 'blue', icon: 'mdi-eye' },
        { value: 'in_progress', label: 'En cours', color: 'orange', icon: 'mdi-progress-clock' },
        { value: 'mastered', label: 'Maîtrisée', color: 'success', icon: 'mdi-check-circle' }
    ],

    // Directory
    directoryDialog: false,
    directoryHeaders: [
      { title: 'Nom', key: 'name', align: 'start' },
      { title: 'Téléphone', key: 'phone', align: 'start' },
    ],

    // Candidatures
    candidatures: [],
    candidatureDialog: false,
    candidatureFormDialog: false,
    promotionRequestsDialog: false,
    editedCandidature: {
      id: null,
      name: '',
      phone: '',
      email: '',
      availabilities: '',
      status: 'Appel pour entretien',
      availabilities: '',
      status: 'Candidature reçue',
      votes: {},
      answers: {}
    },
    candidatureHeaders: [
      { title: 'Nom', key: 'name' },
      { title: 'Statut', key: 'status' },
      { title: 'Téléphone', key: 'phone' },
      { title: 'Email', key: 'email' },
      { title: 'Disponibilités', key: 'availabilities' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],

    rhChecklists: rhChecklists,
    selectedChecklistId: null,
    checkedSteps: [],
    headers: [
      { title: 'Nom', key: 'name' },
      { title: 'Email', key: 'email' },
      { title: 'Téléphone', key: 'phone' },
      {
        title: 'Rôle',
        key: 'role',
        sort: (a, b) => {
          const roleOrder = ['Directeur', 'Directeur Adjoint', 'Assistant RH', 'Responsable de Service', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']
          return roleOrder.indexOf(a) - roleOrder.indexOf(b)
        }
      },
      { title: 'Spécialités', key: 'specialties' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],
    employees: [],
    editedItem: {
      name: '',
      email: '',
      phone: '',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialties: [],
      birthDate: null,
      arrivalDate: null,
      cdiDate: null,
      lastPromotionDate: null,
      lastPromotionDate: null,
      medicalDegreeDate: null,
      helicopterTrainingDate: null,
      helicopterTrainingReimbursed: false,
    },
    defaultItem: {
      name: '',
      email: '',
      phone: '555-',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialties: [],
      birthDate: null,
      arrivalDate: null,
      cdiDate: null,
      lastPromotionDate: null,
      medicalDegreeDate: null,
      helicopterTrainingDate: null,
      helicopterTrainingReimbursed: false,
    },
    detailsDialog: false,
    selectedEmployee: null,

    faultDialog: false,
    faultReason: '',
    faultEmployee: null,

    suspensionDialog: false,
    suspensionEmployee: null,
    suspensionStartDate: '',
    suspensionDuration: 1,

    unsub: [],
    unsub: [],
    unsub: [],
    unsub: [],
    unsub: [],
    unsub: [],
    showAllEmails: false,
    showCharts: false,
    visibleCharts: {
      rank: false,
      gender: false,
      specialty: false,
      promotion: false
    }
  }),

  computed: {
    rhEmployees() {
      return this.employees.filter(e => !e.isRHTrainee).sort((a, b) => a.name.localeCompare(b.name))
    },
    rhTrainees() {
      return this.employees.filter(e => e.isRHTrainee).sort((a, b) => a.name.localeCompare(b.name))
    },
    weeklyOverdueCount() {
      return this.weeklyTasks.filter(t => this.isTaskOverdue(t, 'weekly')).length
    },
    monthlyOverdueCount() {
      return this.monthlyTasks.filter(t => this.isTaskOverdue(t, 'monthly')).length
    },
    formTitle() {
      return this.editedItem.id ? 'Modifier l\'employé' : 'Nouvel employé'
    },
    currentChecklist() {
      return this.rhChecklists.find(c => c.id === this.selectedChecklistId)
    },
    checklistProgress() {
      if (!this.checkedSteps.length) return 0

      const { total, completed } = this.currentChecklist.steps.reduce((acc, step, index) => {
        if (step?.header) return acc

        acc.total++
        if (this.checkedSteps[index]) acc.completed++
        return acc
      }, { total: 0, completed: 0 })

      if (total === 0) return 0
      return (completed / total) * 100
    },

    waitingCandidaturesCount() {
      return this.candidatures.filter(c => c.status === 'Candidature reçue').length
    },
    sortedDirectoryEmployees() {
      const roleOrder = ['Directeur', 'Directeur Adjoint', 'Assistant RH', 'Responsable de Service', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']

      return [...this.employees].sort((a, b) => {
        // 1. Sort by Role Priority
        const roleDiff = roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
        if (roleDiff !== 0) return roleDiff

        // 2. Sort by Seniority (Arrival Date) - Ascending (Earliest date = Most senior)
        if (!a.arrivalDate) return 1
        if (!b.arrivalDate) return -1
        return new Date(a.arrivalDate) - new Date(b.arrivalDate)
      })
    },

    promotionRequests() {
      return this.employees.filter(e => e.promotionRequest)
    },

    rankChartData() {
      const counts = {}
      const roles = ['Directeur', 'Directeur Adjoint', 'Responsable de Service', 'Assistant RH', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']
      const bgColors = ['#ed2618', '#F44336', '#9C27B0', '#FF9800', '#5585d9', '#2196F3', '#306bd1', '#4CAF50']

      roles.forEach(r => counts[r] = 0)
      this.employees.forEach(e => {
        if (counts[e.role] !== undefined) counts[e.role]++
        else counts[e.role] = 1
      })

      return {
        labels: roles,
        datasets: [{
          backgroundColor: bgColors,
          data: roles.map(r => counts[r])
        }]
      }
    },

    rhEmployees() {
        return this.employees.filter(e => {
            if (!e.specialties || !Array.isArray(e.specialties)) return false
            return e.specialties.some(s => {
                if (!s) return false
                const val = typeof s === 'string' ? s : (s.value || '')
                if (typeof val !== 'string') return false
                const lower = val.toLowerCase()
                return lower.includes('rh') || lower.includes('ressources')
            })
        })
    },

    genderChartData() {
      let males = 0
      let females = 0
      this.employees.forEach(e => {
        if (e.sex === 'Homme') males++
        else if (e.sex === 'Femme') females++
      })
      return {
        labels: ['Hommes', 'Femmes'],
        datasets: [{
          backgroundColor: ['#2196F3', '#E91E63'],
          data: [males, females]
        }]
      }
    },
    specialtyChartData() {
      const counts = {}
      this.employees.forEach(e => {
        if (e.specialties) {
          e.specialties.forEach(s => {
            const name = this.getSpecialtyName(s)
            counts[name] = (counts[name] || 0) + 1
          })
        }
      })

      return {
        labels: Object.keys(counts),
        datasets: [{
          label: 'Effectifs',
          backgroundColor: '#FFC107',
          data: Object.values(counts)
        }]
      }
    },
    promotionChartData() {
      const roles = ['Interne', 'Résident', 'Titulaire', 'Spécialiste']
      const data = []

      roles.forEach(role => {
        const relevant = this.employees.filter(e => e.role === role && e.lastPromotionDate)
        if (relevant.length === 0) {
          data.push(0)
        } else {
          let totalDays = 0
          relevant.forEach(e => {
            totalDays += this.calculateDays(e.lastPromotionDate)
          })
          data.push(Math.round(totalDays / relevant.length))
        }
      })

      return {
        labels: roles,
        datasets: [{
          label: 'Jours moyens depuis dernière promotion',
          backgroundColor: '#9C27B0',
          data: data
        }]
      }
    },

    isOverdue() {
      if (!this.lastWeekReset) return false
      const resetDate = new Date(this.lastWeekReset)
      const diffTime = Math.abs(Date.now() - resetDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 7
    },


  },

  mounted() {
    this.weeklyChecklistManager = new SharedChecklist('weekly_rh')
    this.unsub.push(this.weeklyChecklistManager.listen((data) => {
      this.weeklyTasks = data.tasks
      this.lastWeekReset = data.lastReset
    }))

    this.monthlyChecklistManager = new SharedChecklist('monthly_rh')
    this.unsub.push(this.monthlyChecklistManager.listen((data) => {
      this.monthlyTasks = data.tasks
      this.lastMonthReset = data.lastReset
    }))

    this.unsub.push(Employee.listenAll((employees) => {
      this.employees = employees
    }))
    this.unsub.push(Specialty.listenAll((list) => {
      this.specialties = list
    }))
    this.unsub.push(Candidature.listenAll((list) => {
      this.candidatures = list
    }))
  },

  beforeUnmount() {
    this.unsub.forEach(u => {
      if (typeof u === 'function') u()
    })
  },

  methods: {
    getCheckDate(timestamp) {
      if (!timestamp) return '(Date inconnue)'
      return `(Fait le ${new Date(timestamp).toLocaleDateString('fr-FR')})`
    },

    openStatisticsDialog() {
      this.statisticsDialog = true
      this.showCharts = false
      this.statsKey++

      // Wait for dialog to fully open, then use requestAnimationFrame for reliable DOM paint
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.showCharts = true
            // Force Chart.js to recalculate dimensions
            this.$nextTick(() => {
              window.dispatchEvent(new Event('resize'))
            })
          })
        })
      }, 400)
    },


    getRoleColor(role) {
      if (['Directeur', 'Directeur Adjoint'].includes(role)) return 'red'
      if (['Responsable de Service'].includes(role)) return 'purple'
      if (['Assistant RH'].includes(role)) return 'orange'
      if (['Résident', 'Titulaire', 'Spécialiste'].includes(role)) return 'blue'
      return 'green'
    },

    isTaskOverdue(task, type) {
      if (!task.doneAt) return true
      const doneDate = new Date(task.doneAt)
      const diffTime = Math.abs(Date.now() - doneDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (type === 'weekly') return diffDays > 7
      if (type === 'monthly') return diffDays > 30
      return false
    },

    getSpecialtyIcon(value) {
      const spec = this.specialties.find(s => s.value === value)

      return spec ? spec.icon : ''
    },

    getSpecialtyName(value) {
      const spec = this.specialties.find(s => s.value === value)

      return spec ? spec.name : value
    },

    isBirthday(dateString) {
      if (!dateString) return false
      const date = new Date(dateString)
      const today = new Date()

      return date.getDate() === today.getDate() && date.getMonth() === today.getMonth()
    },

    needsHeliReimbursement(item) {
      if (!item.helicopterTrainingDate || item.helicopterTrainingReimbursed) return false
      const trainingDate = new Date(item.helicopterTrainingDate)
      const oneMonthLater = new Date(trainingDate)
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

      const today = new Date()
      return today >= oneMonthLater
    },

    confirmReimbursement(item) {
      Swal.fire({
        title: 'Confirmer le remboursement',
        text: `Avez-vous remboursé la formation hélico pour ${item.name} ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, validé',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            item.helicopterTrainingReimbursed = true
            await item.save()

            Swal.fire({
              icon: 'success',
              title: 'Remboursement validé',
              text: 'Le statut a été mis à jour',
              timer: 1500,
              showConfirmButton: false
            })
          } catch (e) {
            console.error(e)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de mettre à jour le statut'
            })
          }
        }
      })
    },

    getAvailableChiefSpecialties() {
      if (!this.editedItem.specialties) return []
      return this.specialties.filter(s => this.editedItem.specialties.includes(s.value))
    },

    openAddDialog() {
      this.editedItem = Object.assign({}, this.defaultItem)
      const today = new Date().toISOString().substr(0, 10)
      this.editedItem.arrivalDate = today
      this.editedItem.lastPromotionDate = today
      this.dialog = true
    },

    editEmployee(item) {
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    close() {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
      })
    },

    async save() {
      if (!this.editedItem.name || !this.editedItem.email) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez remplir tous les champs',
          timer: 2000
        })
        return
      }

      try {
        let profile
        let isNew = false
        let oldRole = null

        if (this.editedItem.id) {
          const original = this.employees.find(e => e.id === this.editedItem.id)
          if (original) oldRole = original.role

          let promReq = this.editedItem.promotionRequest
          if (oldRole && oldRole !== this.editedItem.role)
            promReq = null

          profile = new Employee(
            this.editedItem.id,
            this.editedItem.name,
            this.editedItem.email,
            this.editedItem.role,
            this.editedItem.sex,
            this.editedItem.phone,
            this.editedItem.specialties,
            this.editedItem.chiefSpecialties,
            this.editedItem.birthDate,
            this.editedItem.arrivalDate,
            this.editedItem.cdiDate,
            this.editedItem.lastPromotionDate,
            this.editedItem.medicalDegreeDate,
            this.editedItem.helicopterTrainingDate,
            this.editedItem.helicopterTrainingReimbursed,
            this.editedItem.trainingRequests,
            promReq,
            this.editedItem.rankPromotionRequest,
            this.editedItem.validatedSubCompetencies,
            this.editedItem.competencyProgress,
            this.editedItem.lastFollowUpDate,
            this.editedItem.simpleFault,
            this.editedItem.suspension,
            this.editedItem.isTrainerTrainee,
            this.editedItem.simulations
          )
        } else {
          // Creating new
          isNew = true
          profile = new Employee(
            null,
            this.editedItem.name,
            this.editedItem.email,
            this.editedItem.role,
            this.editedItem.sex,
            this.editedItem.phone,
            this.editedItem.specialties,
            this.editedItem.chiefSpecialties,
            this.editedItem.birthDate,
            this.editedItem.arrivalDate,
            this.editedItem.cdiDate,
            this.editedItem.lastPromotionDate,
            this.editedItem.medicalDegreeDate,
            this.editedItem.helicopterTrainingDate,
            this.editedItem.helicopterTrainingReimbursed,
            [], // new employee has no requests
            null // new employee has no promotion request
          )
        }

        await profile.save()

        if (isNew)
          logger.log(this.userStore.profile.id, "Ajout employés", `Ajout de l'employé ${this.editedItem.name} en tant que ${this.editedItem.role}`)
        else if (oldRole && oldRole !== this.editedItem.role)
          logger.log(this.userStore.profile.id, "Changement de grade", `Passage de ${this.editedItem.name} de ${oldRole} à ${this.editedItem.role}`)

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Employé enregistré',
          timer: 2000
        })
        this.syncEmployees(true)
        this.close()
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors de l'enregistrement",
        })
      }
    },

    deleteEmployee(item) {
      this.itemToDelete = item
      this.deleteReason = null
      this.deleteDialog = true
    },

    closeDeleteDialog() {
      this.deleteDialog = false
      this.itemToDelete = null
      this.deleteReason = null
    },

    async confirmDelete() {
      if (!this.deleteReason) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Vous devez sélectionner une raison',
          timer: 2000
        })
        return
      }

      try {
        await this.itemToDelete.delete()
        logger.log(this.userStore.profile.id, "Suppression employé", `Suppression de ${this.itemToDelete.name} pour ${this.deleteReason}`)
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Employé supprimé',
          timer: 2000
        })
        this.syncEmployees(true)
        this.closeDeleteDialog()
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors de la suppression",
        })
      }
    },

    openDetails(item) {
      this.selectedEmployee = item
      this.detailsDialog = true
    },

    formatDate(dateString) {
      if (!dateString) return 'Non renseigné'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },

    calculateAge(dateString) {
      if (!dateString) return '?'
      const birthDate = new Date(dateString)
      const ageDifMs = Date.now() - birthDate.getTime()
      const ageDate = new Date(ageDifMs)
      return Math.abs(ageDate.getUTCFullYear() - 1970)
    },

    calculateSeniority(dateString) {
      if (!dateString) return 'Non renseigné'
      const date = new Date(dateString + 'T00:00:00')
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      let years = now.getFullYear() - date.getFullYear()
      let months = now.getMonth() - date.getMonth()
      if (months < 0 || (months === 0 && now.getDate() < date.getDate())) {
        years--
        months += 12
      }
      return `${years} ans, ${months} mois`
    },

    calculateDays(dateString) {
      if (!dateString) return '?'
      const oneDay = 24 * 60 * 60 * 1000
      const firstDate = new Date(dateString + 'T00:00:00')
      const secondDate = new Date()
      secondDate.setHours(0, 0, 0, 0)

      return Math.round(Math.abs((firstDate - secondDate) / oneDay))
    },

    onRoleChange() {
      this.editedItem.lastPromotionDate = new Date().toISOString().substr(0, 10)
    },

    openSpecialtiesDialog() {
      this.specialtiesDialog = true
    },

    async addSpecialty() {
      if (!this.newSpecialty.name || !this.newSpecialty.icon) return
      try {
        const spec = new Specialty(null, this.newSpecialty.name, this.newSpecialty.icon, null, this.newSpecialty.canTakeAppointments)
        await spec.save()
        this.newSpecialty = { name: '', icon: '', canTakeAppointments: false }
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de l'ajout" })
      }
    },

    async toggleSpecialtyAppointments(spec) {
      try {
        const updatedSpec = new Specialty(spec.id, spec.name, spec.icon, spec.value, !spec.canTakeAppointments)
        await updatedSpec.save()
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de la modification" })
      }
    },



    async addWeeklyTask() {
      if (!this.newWeeklyTask) return
      try {
        await this.weeklyChecklistManager.addTask(this.weeklyTasks, this.lastWeekReset, this.newWeeklyTask, this.newWeeklyTaskLink || null)
        this.newWeeklyTask = ''
        this.newWeeklyTaskLink = ''
      } catch (e) { console.error(e) }
    },
    async removeWeeklyTask(taskId) {
      Swal.fire({
        title: 'Supprimer la tâche ?',
        text: "Cette action est irréversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33',
        focusConfirm: false,
        customClass: {
          confirmButton: 'no-focus-outline',
          cancelButton: 'no-focus-outline'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await this.weeklyChecklistManager.removeTask(this.weeklyTasks, this.lastWeekReset, taskId)
          } catch (e) { console.error(e) }
        }
      })
    },
    async toggleWeeklyTask(taskId) {
      try {
        await this.weeklyChecklistManager.toggleTask(this.weeklyTasks, this.lastWeekReset, taskId)
      } catch (e) { console.error(e) }
    },
    async updateWeeklyTaskDate(taskId) {
      try {
        await this.weeklyChecklistManager.updateTaskDate(this.weeklyTasks, this.lastWeekReset, taskId)
      } catch (e) { console.error(e) }
    },


    // Monthly Logic
    async addMonthlyTask() {
      if (!this.newMonthlyTask) return
      try {
        await this.monthlyChecklistManager.addTask(this.monthlyTasks, this.lastMonthReset, this.newMonthlyTask, this.newMonthlyTaskLink || null)
        this.newMonthlyTask = ''
        this.newMonthlyTaskLink = ''
      } catch (e) { console.error(e) }
    },
    async removeMonthlyTask(taskId) {
      Swal.fire({
        title: 'Supprimer la tâche ?',
        text: "Cette action est irréversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33',
        focusConfirm: false,
        customClass: {
          confirmButton: 'no-focus-outline',
          cancelButton: 'no-focus-outline'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await this.monthlyChecklistManager.removeTask(this.monthlyTasks, this.lastMonthReset, taskId)
          } catch (e) { console.error(e) }
        }
      })
    },
    async toggleMonthlyTask(taskId) {
      try {
        await this.monthlyChecklistManager.toggleTask(this.monthlyTasks, this.lastMonthReset, taskId)
      } catch (e) { console.error(e) }
    },
    async updateMonthlyTaskDate(taskId) {
      try {
        await this.monthlyChecklistManager.updateTaskDate(this.monthlyTasks, this.lastMonthReset, taskId)
      } catch (e) { console.error(e) }
    },


    async removeSpecialty(item) {
      try {
        // Reconstruct instance to delete
        const spec = new Specialty(item.id, item.name, item.icon, item.value)
        await spec.delete()
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de la suppression" })
      }
    },

    openChecklistsDialog() {
      this.checklistDialog = true
    },

    resetChecklist() {
      if (this.currentChecklist) {
        this.checkedSteps = new Array(this.currentChecklist.steps.length).fill(false)
      } else {
        this.checkedSteps = []
      }
    },

    openDirectoryDialog() {
      this.directoryDialog = true
    },

    directoryRowProps({ item }) {
      const color = this.getRoleColor(item.role)
      return { class: `bg-${color}-lighten-4` }
    },

    async captureDirectoryImage() {
      const container = this.$refs.directoryTableContainer
      if (!container) return

      // Hide headers
      const thead = container.querySelector('thead')
      if (thead) thead.style.display = 'none'

      try {
        const canvas = await html2canvas(container, {
          backgroundColor: null // Transparent background if possible, or white
        })
        
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ])
            Swal.fire({
              icon: 'success',
              title: 'Copié dans le presse-papier',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000
            })
          } catch (e) {
            console.error('Clipboard write failed', e)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Échec de la copie (navigateur incompatible ?)'
            })
          }
        })

      } catch (err) {
        console.error('Erreur lors de la capture :', err)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de générer l\'image'
        })
      } finally {
        // Restore headers
        if (thead) thead.style.display = ''
      }
    },

    async syncEmployees(silent = false) {
      if (typeof silent !== 'boolean') silent = false
      if (silent) {
        try {
          const payload = this.sortedDirectoryEmployees.map(e => ({
            name: e.name || '',
            arrivalDate: e.arrivalDate ? new Date(e.arrivalDate).toLocaleDateString('fr-FR') : '',
            phone: e.phone || '',
            cdiDate: e.cdiDate ? new Date(e.cdiDate).toLocaleDateString('fr-FR') : '-',
            role: e.role || ''
          }))

          await fetch('https://script.google.com/macros/s/AKfycbznvu7vOZ3NwkJ4QAKcJPBENOPns9n72zQOYiOI3Oqo_p2IjsZ7DUzoSAHfjUSlOTMDpg/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
          })

          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          Toast.fire({
            icon: "success",
            title: "Drive synchronisé"
          });
        } catch (e) {
          console.error("Auto-sync failed", e)
        }
        return
      }

      Swal.fire({
        title: 'Synchronisation',
        text: 'Voulez-vous synchroniser la liste des employés avec le Google Sheet de la Mairie ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, synchroniser',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Loading state
          Swal.fire({
            title: 'Synchronisation en cours...',
            didOpen: () => { Swal.showLoading() },
            allowOutsideClick: false
          })

          try {
            // Prepare data
            const payload = this.sortedDirectoryEmployees.map(e => ({
              name: e.name || '',
              arrivalDate: e.arrivalDate ? new Date(e.arrivalDate).toLocaleDateString('fr-FR') : '',
              phone: e.phone || '',
              cdiDate: e.cdiDate ? new Date(e.cdiDate).toLocaleDateString('fr-FR') : '-',
              role: e.role || ''
            }))

            // Send to Google Apps Script
            await fetch('https://script.google.com/macros/s/AKfycbznvu7vOZ3NwkJ4QAKcJPBENOPns9n72zQOYiOI3Oqo_p2IjsZ7DUzoSAHfjUSlOTMDpg/exec', {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'text/plain'
              },
              body: JSON.stringify(payload)
            })

            Swal.fire({
              icon: 'success',
              title: 'Synchronisé !',
              text: 'Les données ont été envoyées au Google Sheet.',
              timer: 2000
            })

          } catch (e) {
            console.error(e)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de synchroniser avec le Drive.'
            })
          }
        }
      })
    },

    openCandidatureDialog() {
      this.candidatureDialog = true
    },

    openCandidatureForm(item = null) {
      if (item) {
        this.editedCandidature = {
          ...item,
          votes: item.votes || {},
          answers: item.answers || {}
        }
      } else {
        this.editedCandidature = {
          id: null,
          name: '',
          phone: '555-',
          email: '',
          availabilities: '',
          status: 'Candidature reçue',
          votes: {},
          answers: {}
        }
      }
      this.candidatureFormDialog = true
    },

    vote(type) {
      const userId = this.userStore.profile.id
      if (this.editedCandidature.votes[userId] === type)
        delete this.editedCandidature.votes[userId]
      else
        this.editedCandidature.votes[userId] = type
      this.editedCandidature = { ...this.editedCandidature }
    },

    getCandidatureStatusColor(status) {
      switch (status) {
        case 'Candidature reçue': return 'grey-lighten-1'
        case 'Appel pour entretien': return 'grey'
        case 'Entretien planifié': return 'info'
        case 'Entretien en cours d\'analyse': return 'warning'
        case 'Recrutement planifié': return 'success'
        case 'Refusé': return 'error'
        default: return 'grey'
      }
    },

    async confirmFinalize(decision) {
      const actionText = decision === 'accept' ? 'Embaucher' : 'Refuser'
      const confirmText = decision === 'accept' ? 'Oui, embaucher' : 'Oui, refuser'
      const icon = decision === 'accept' ? 'question' : 'warning'
      const confirmColor = decision === 'accept' ? '#4CAF50' : '#d33'

      Swal.fire({
        title: `${actionText} le candidat ?`,
        text: `Êtes-vous sûr de vouloir ${actionText.toLowerCase()} ${this.editedCandidature.name} ?`,
        icon: icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Annuler',
        confirmButtonColor: confirmColor,
        focusConfirm: false
      }).then((result) => {
        if (result.isConfirmed) {
          this.finalizeCandidature(decision)
        }
      })
    },

    async finalizeCandidature(decision) {
      if (decision === 'accept') {
        const created = await this.createEmployeeFromCandidature(this.editedCandidature)
        if (created) {
          this.editedCandidature.status = 'Recrutement planifié'
        } else
          return
      } else {
        this.editedCandidature.status = 'Refusé'
      }
      this.saveCandidature()
    },

    async createEmployeeFromCandidature(candidature) {
      const exists = this.employees.some(e => e.name.toLowerCase() === candidature.name.toLowerCase())
      if (exists) {
        Swal.fire({
          icon: 'warning',
          title: 'Déjà employé',
          text: `${candidature.name} est déjà dans la liste des employés !`,
        })
        return false
      }

      const today = new Date().toISOString().split('T')[0]

      const newEmployee = new Employee(
        null,
        candidature.name,
        '',
        'Interne',
        null,
        candidature.phone,
        [],
        [],
        null,
        today,
        null,
        today,
        null,
        null,
        false
      )

      try {
        await newEmployee.save()
        Swal.fire({
          icon: 'info',
          title: 'Employé créé',
          text: `${candidature.name} a été ajouté(e) à la liste des employés en tant qu'Interne.`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
        return true
      } catch (e) {
        console.error('Erreur lors de la création de l\'employé:', e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "L'employé n'a pas pu être créé automatiquement."
        })
        return false
      }
    },

    async saveCandidature() {
      if (!this.editedCandidature.name || !this.editedCandidature.email || !this.editedCandidature.phone) {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: 'Veuillez remplir les champs obligatoires'
        })
        return
      }

      if (!this.editedCandidature.email.endsWith('@discord.gg')) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "L'email doit se terminer par @discord.gg"
        })
        return
      }

      try {
        const cand = new Candidature(
          this.editedCandidature.id,
          this.editedCandidature.name,
          this.editedCandidature.phone,
          this.editedCandidature.email,
          this.editedCandidature.availabilities,
          this.editedCandidature.status,
          this.editedCandidature.votes,
          this.editedCandidature.answers
        )
        await cand.save()
        this.candidatureFormDialog = false
        Swal.fire({
          icon: 'success',
          title: 'Candidature enregistrée',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors de l'enregistrement"
        })
      }
    },

    openPromotionRequestsDialog() {
      this.promotionRequestsDialog = true
    },

    async acceptPromotion(emp) {
      try {
        const requestValue = emp.promotionRequest.value || emp.promotionRequest
        if (!emp.specialties) emp.specialties = []

        const specName = typeof requestValue === 'string' ? requestValue : requestValue.value

        // Only add if not already present
        const alreadyHas = emp.specialties.some(s => s === specName || s.value === specName)
        if (!alreadyHas) {
          emp.specialties.push(requestValue)
        }

        emp.promotionRequest = null
        await emp.save()

        Swal.fire({
          icon: 'success',
          title: 'Promotion validée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de la validation" })
      }
    },

    async rejectPromotion(emp) {
      try {
        emp.promotionRequest = null
        await emp.save()

        Swal.fire({
          icon: 'info',
          title: 'Promotion refusée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors du refus" })
      }
    },

    async deleteCandidature(item) {
      Swal.fire({
        title: 'Supprimer ?',
        text: `Voulez-vous supprimer la candidature de ${item.name} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await item.delete()
            Swal.fire({
              icon: 'success',
              title: 'Supprimée',
              timer: 1500,
              showConfirmButton: false
            })
          } catch (e) {
            console.error(e)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: "Erreur lors de la suppression"
            })
          }
        }
      })
    },

    openPromotionRequestsDialog() {
      this.promotionRequestsDialog = true
    },

    async acceptPromotion(emp) {
      try {
        const requestValue = emp.promotionRequest.value || emp.promotionRequest
        if (!emp.specialties) emp.specialties = []
        if (!emp.specialties.includes(requestValue)) {
          emp.specialties.push(requestValue)
        }
        emp.promotionRequest = null
        await emp.save()

        Swal.fire({
          icon: 'success',
          title: 'Promotion validée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de la validation" })
      }
    },

    async rejectPromotion(emp) {
      try {
        emp.promotionRequest = null
        await emp.save()

        Swal.fire({
          icon: 'info',
          title: 'Promotion refusée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors du refus" })
      }
    },

    // Tracking Methods
    getCategoryProgress(category) {
        if (!category.items || category.items.length === 0) return 0
        const total = category.items.length * 100
        let current = 0
        
        category.items.forEach(item => {
            const status = this.getRHStatus(item.id)
            if (status === 'mastered') current += 100
            else if (status === 'in_progress') current += 50
            else if (status === 'seen') current += 25
        })

        return (current / total) * 100
    },

    getCompetencyColor(progress) {
        if (progress === 100) return 'success'
        if (progress >= 50) return 'warning'
        return 'grey'
    },

    getRHStatus(subId) {
        if (!this.selectedTrackingEmployee || !this.selectedTrackingEmployee.competencyProgress) return 'not_seen'
        return this.selectedTrackingEmployee.competencyProgress[subId] || 'not_seen'
    },

    getRHStatusColor(subId) {
        const status = this.getRHStatus(subId)
        const found = this.rhStatuses.find(s => s.value === status)
        return found ? found.color : 'grey'
    },

    getRHStatusIcon(subId) {
        const status = this.getRHStatus(subId)
        const found = this.rhStatuses.find(s => s.value === status)
        return found ? found.icon : 'mdi-eye-off'
    },

    getRHStatusLabel(subId) {
        const status = this.getRHStatus(subId)
        const found = this.rhStatuses.find(s => s.value === status)
        return found ? found.label : 'Non vue'
    },

    async toggleSubCompetencyValidation(subId) {
        if (!this.selectedTrackingEmployee) return
        
        const currentStatus = this.getRHStatus(subId)
        const currentIndex = this.rhStatuses.findIndex(s => s.value === currentStatus)
        const nextIndex = (currentIndex + 1) % this.rhStatuses.length
        const nextStatus = this.rhStatuses[nextIndex].value

        // Ensure reactivity
        const progress = { ...(this.selectedTrackingEmployee.competencyProgress || {}) }
        progress[subId] = nextStatus

        this.selectedTrackingEmployee.competencyProgress = progress
        await this.selectedTrackingEmployee.save()
    },

    openTrackingSelection() {
        this.selectedEmployeeForTracking = null
        this.selectedTrackingEmployee = null
        this.trackingSelectionDialog = true
    },

    openTrackingDialog(employee) {
        if (!employee) return
        this.selectedTrackingEmployee = employee
        this.trackingSelectionDialog = false
        this.trackingDialog = true
    },

    openFaultDialog(item) {
      this.faultEmployee = item
      this.faultReason = ''
      this.faultDialog = true
    },

    async saveFault() {
      if (!this.faultReason) return

      try {
        const today = new Date()
        const expireDate = new Date(today)
        expireDate.setDate(expireDate.getDate() + 30)

        this.faultEmployee.simpleFault = {
          reason: this.faultReason,
          date: today.toISOString(),
          expireDate: expireDate.toISOString()
        }
        await this.faultEmployee.save()

        logger.log(this.userStore.profile.id, "Ajout faute", `Ajout d'une faute simple à ${this.faultEmployee.name} : ${this.faultReason}`)

        this.faultDialog = false
        Swal.fire({
          icon: 'success',
          title: 'Faute ajoutée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de l'ajout" })
      }
    },

    async deleteFault(item) {
      Swal.fire({
        title: 'Retirer la faute ?',
        text: `Voulez-vous retirer la faute de ${item.name} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, retirer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // ... existing logic ... 
          // Re-implementing deleteFault logic here since it was truncated in view
          try {
            item.simpleFault = null
            await item.save()
            Swal.fire('Supprimé', 'La faute a été retirée', 'success')
          } catch (e) {
            console.error(e)
            Swal.fire('Erreur', 'Erreur lors de la suppression', 'error')
          }
        }
      })
    },


    showFaultDetails(item) {
      if (!item.simpleFault) return
      Swal.fire({
        title: 'Détails de la faute',
        html: `
                <div class="text-left">
                    <p><strong>Employé :</strong> ${item.name}</p>
                    <p><strong>Raison :</strong> ${item.simpleFault.reason}</p>
                    <p><strong>Date d'ajout :</strong> ${this.formatDate(item.simpleFault.date)}</p>
                    <p><strong>Expire le :</strong> ${this.formatDate(item.simpleFault.expireDate)}</p>
                </div>
            `,
        icon: 'warning',
        confirmButtonText: 'Fermer'
      })
    },

    openSuspensionDialog(item) {
      this.suspensionEmployee = item
      this.suspensionStartDate = new Date().toISOString().substr(0, 10)
      this.suspensionDuration = 1
      this.suspensionDialog = true
    },

    async saveSuspension() {
      if (!this.suspensionStartDate || !this.suspensionDuration) return

      try {
        const startDate = new Date(this.suspensionStartDate)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + parseInt(this.suspensionDuration))

        this.suspensionEmployee.suspension = {
          startDate: this.suspensionStartDate,
          duration: parseInt(this.suspensionDuration),
          endDate: endDate.toISOString().substr(0, 10)
        }
        await this.suspensionEmployee.save()

        logger.log(this.userStore.profile.id, "Mise à pied", `Mise à pied de ${this.suspensionEmployee.name} pour ${this.suspensionDuration} jour(s) à partir du ${this.suspensionStartDate}`)

        this.suspensionDialog = false
        Swal.fire({
          icon: 'success',
          title: 'Mise à pied appliquée',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (e) {
        console.error(e)
        Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de l'application" })
      }
    },

    async deleteSuspension(item) {
      Swal.fire({
        title: 'Retirer la mise à pied ?',
        text: `Voulez-vous retirer la mise à pied de ${item.name} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, retirer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            item.suspension = null
            await item.save()

            logger.log(this.userStore.profile.id, "Retrait mise à pied", `Retrait de la mise à pied de ${item.name}`)

            Swal.fire({
              icon: 'success',
              title: 'Mise à pied retirée',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000
            })
          } catch (e) {
            console.error(e)
            Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors du retrait" })
          }
        }
      })
    },

    showSuspensionDetails(item) {
      if (!item.suspension) return
      Swal.fire({
        title: 'Détails de la mise à pied',
        html: `
                <div class="text-left">
                    <p><strong>Employé :</strong> ${item.name}</p>
                    <p><strong>Date de début :</strong> ${this.formatDate(item.suspension.startDate)}</p>
                    <p><strong>Durée :</strong> ${item.suspension.duration} jour(s)</p>
                    <p><strong>Date de fin :</strong> ${this.formatDate(item.suspension.endDate)}</p>
                </div>
            `,
        icon: 'info',
        confirmButtonText: 'Fermer'
      })
    },

    checkFaultExpirations() {
      const today = new Date()
      this.employees.forEach(async emp => {
        if (emp.simpleFault && emp.simpleFault.expireDate) {
          const expireDate = new Date(emp.simpleFault.expireDate)
          if (today > expireDate) {
            console.log(`Fault expired for ${emp.name}, removing...`)
            emp.simpleFault = null
            await emp.save()
          }
        }
      })
    },

    checkFaultExpirations() {
      const today = new Date()
      this.employees.forEach(async emp => {
        if (emp.simpleFault && emp.simpleFault.expireDate) {
          const expireDate = new Date(emp.simpleFault.expireDate)
          if (today > expireDate) {
            console.log(`Fault expired for ${emp.name}, removing...`)
            emp.simpleFault = null
            await emp.save()
          }
        }
      })
    },

    checkSuspensionExpirations() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      this.employees.forEach(async emp => {
        if (emp.suspension && emp.suspension.endDate) {
          const endDate = new Date(emp.suspension.endDate)
          endDate.setHours(0, 0, 0, 0)
          if (today >= endDate) {
            console.log(`Suspension expired for ${emp.name}, removing...`)
            emp.suspension = null
            await emp.save()
          }
        }
      })
    },

    onChartIntersect(isIntersecting, chartId) {
      if (isIntersecting) {
        this.visibleCharts[chartId] = true
      }
    },

    openTrackingSelection() {
      this.selectedEmployeeForTracking = null
      this.trackingSelectionDialog = true
    },

    getRHStatusColor(itemId) {
      if (!this.selectedTrackingEmployee) return 'grey'
      const status = this.selectedTrackingEmployee.competencyProgress?.[itemId]
      const colors = { 'not_seen': 'grey', 'seen': 'blue', 'in_progress': 'orange', 'mastered': 'green' }
      return colors[status] || 'grey'
    },

    getRHStatusLabel(itemId) {
      if (!this.selectedTrackingEmployee) return 'Non vue'
      const status = this.selectedTrackingEmployee.competencyProgress?.[itemId] || 'not_seen'
      return this.rhStatuses[status] || 'Non vue'
    },

    getCategoryProgress(category) {
      if (!this.selectedTrackingEmployee || !category.items) return 0
      const total = category.items.length
      const done = category.items.filter(item => this.selectedTrackingEmployee.competencyProgress?.[item.id] === 'mastered').length
      return total > 0 ? Math.round((done / total) * 100) : 0
    },

    getCompetencyColor(progress) {
      if (progress >= 100) return 'green'
      if (progress >= 50) return 'orange'
      return 'red'
    },

    async toggleSubCompetencyValidation(itemId) {
      if (!this.selectedTrackingEmployee) return
      if (!this.selectedTrackingEmployee.competencyProgress) this.selectedTrackingEmployee.competencyProgress = {}
      const statusOrder = ['not_seen', 'seen', 'in_progress', 'mastered']
      const current = this.selectedTrackingEmployee.competencyProgress[itemId] || 'not_seen'
      const nextIndex = (statusOrder.indexOf(current) + 1) % statusOrder.length
      this.selectedTrackingEmployee.competencyProgress[itemId] = statusOrder[nextIndex]
      await this.selectedTrackingEmployee.save()
    },

    async toggleRHTrainee(employee) {
      const result = await Swal.fire({
        title: 'Retirer de la formation RH ?',
        text: `Voulez-vous retirer ${employee.name} de la formation RH ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, retirer',
        cancelButtonText: 'Annuler'
      })
      if (!result.isConfirmed) return
      employee.isRHTrainee = false
      await employee.save()
      Swal.fire({ icon: 'success', title: `${employee.name} a été retiré de la formation RH.`, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
    },

    getEmployeeOverallProgress(employee) {
      if (!employee.competencyProgress) return 0
      const allItems = this.rhValidation.flatMap(c => c.items)
      const total = allItems.length
      const done = allItems.filter(item => employee.competencyProgress[item.id] === 'mastered').length
      return total > 0 ? Math.round((done / total) * 100) : 0
    },

    getEmployeeCategoryProgress(employee, category) {
      if (!employee.competencyProgress || !category.items) return 0
      const total = category.items.length
      const done = category.items.filter(item => employee.competencyProgress[item.id] === 'mastered').length
      return total > 0 ? Math.round((done / total) * 100) : 0
    },

    getEmployeeItemStatusColor(employee, itemId) {
      const status = employee.competencyProgress?.[itemId] || 'not_seen'
      const found = this.rhStatuses.find(s => s.value === status)
      return found ? found.color : 'grey'
    },

    getEmployeeItemStatusLabel(employee, itemId) {
      const status = employee.competencyProgress?.[itemId] || 'not_seen'
      const found = this.rhStatuses.find(s => s.value === status)
      return found ? found.label : 'Non vue'
    },

    async toggleEmployeeItemStatus(employee, itemId) {
      if (!employee.competencyProgress) employee.competencyProgress = {}
      const statusOrder = ['not_seen', 'seen', 'in_progress', 'mastered']
      const current = employee.competencyProgress[itemId] || 'not_seen'
      const nextIndex = (statusOrder.indexOf(current) + 1) % statusOrder.length
      employee.competencyProgress[itemId] = statusOrder[nextIndex]
      await employee.save()
    },

    async addRHTrainee(employee) {
      if (!employee) return
      if (!employee.isRHTrainee) {
        employee.isRHTrainee = true
        await employee.save()
      }
    }
  },

  watch: {
    employees: {
      handler() {
        this.checkFaultExpirations()
        this.checkSuspensionExpirations()
      },
      deep: true
    },
    selectedEmployeeForTracking(val) {
        if (val) {
            this.openTrackingDialog(val)
        }
    }
  }
}
</script>

<style scoped>
.blurred-email {
  filter: blur(4px);
  transition: filter 0.3s ease;
  user-select: none;
  cursor: default;
}

.blurred-email:hover {
  filter: blur(0);
  user-select: text;
  cursor: text;
}

.candidature-table :deep(.v-table__wrapper::-webkit-scrollbar) {
  height: 14px;
}

.candidature-table :deep(.v-table__wrapper::-webkit-scrollbar-thumb) {
  border-radius: 7px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.candidature-table :deep(.v-table__wrapper::-webkit-scrollbar-track) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>


<style>
/* Aggressive override for SweetAlert2 Focus */
div:where(.swal2-container) button:where(.swal2-styled).swal2-confirm:focus,
div:where(.swal2-container) button:where(.swal2-styled).swal2-cancel:focus {
  box-shadow: none !important;
  outline: none !important;
}

.no-focus-outline:focus {
  box-shadow: none !important;
  outline: none !important;
}
</style>
