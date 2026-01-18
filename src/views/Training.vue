<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <v-card class="mb-4" variant="tonal" color="primary" v-if="trainingRequests.length > 0">
        <v-card-title class="text-subtitle-1 font-weight-bold">
            Demandes de formation en cours
        </v-card-title>
        <v-card-text>
            <div class="d-flex flex-wrap gap-2">
                <v-chip
                    v-for="req in trainingRequests"
                    :key="req.id + req.training"
                    :color="getTrainingColor(req.training)"
                    closable
                    @click:close="removeRequest(req)"
                >
                    {{ req.name }} - {{ req.training }}
                </v-chip>
            </div>
        </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="tonal" color="purple" v-if="promotionRequests.length > 0">
        <v-card-title class="text-subtitle-1 font-weight-bold">
            Demandes de promotion en cours
        </v-card-title>
        <v-card-text>
            <v-row>
                <v-col cols="12" md="6" lg="4" v-for="req in promotionRequests" :key="req.id">
                    <v-card variant="outlined" class="bg-surface">
                        <v-card-title class="d-flex align-center">
                            {{ req.name }}
                            <v-spacer></v-spacer>
                             <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removePromotion(req.employeeObj)"></v-btn>
                        </v-card-title>
                        <v-card-subtitle>
                            Demandé par {{ req.request.requestedBy }} le {{ formatDate(req.request.date) }}
                        </v-card-subtitle>
                        <v-card-text>
                            <div class="text-body-1 mb-2">Demande de passage: <strong>{{ req.request.targetRole }}</strong></div>

                            
                            <v-divider class="mb-2"></v-divider>
                            <div class="d-flex justify-space-between mb-2">
                                <span class="text-success font-weight-bold">POUR: {{ countVotes(req.request, 'pour') }}</span>
                                <span class="text-error font-weight-bold">CONTRE: {{ countVotes(req.request, 'contre') }}</span>
                            </div>

                            <div v-if="req.request.votes && Object.keys(req.request.votes).length > 0" class="mb-3">
                                <div v-for="(vote, uid) in req.request.votes" :key="uid" class="text-caption mb-1">
                                    <v-icon size="x-small" :color="vote.vote === 'pour' ? 'success' : 'error'" class="mr-2">
                                        {{ vote.vote === 'pour' ? 'mdi-thumb-up' : 'mdi-thumb-down' }}
                                    </v-icon>
                                    <strong>{{ vote.voterName }}:</strong> {{ vote.opinion }}
                                </div>
                            </div>

                            <div class="d-flex gap-2">
                                <v-btn color="success" variant="app" size="small" prepend-icon="mdi-thumb-up" @click="vote(req.employeeObj, 'pour')" class="flex-grow-1">Pour</v-btn>
                                <v-btn color="error" variant="app" size="small" prepend-icon="mdi-thumb-down" @click="vote(req.employeeObj, 'contre')" class="flex-grow-1">Contre</v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>

    <div class="mb-4">
        <h2 class="text-h5 mb-2">Procédures</h2>
        <v-row>
            <v-col cols="12" sm="6" md="3" v-for="guide in sortedGuides" :key="guide.id">
                <v-card 
                    @click="openGuide(guide)" 
                    hover 
                    variant="outlined" 
                    class="h-100 d-flex flex-column"
                    :color="getGuideTheme(guide.id)"
                >
                    <v-card-title :class="`bg-${getGuideTheme(guide.id)}-lighten-4 text-${getGuideTheme(guide.id)}-darken-4 d-flex align-center`">
                        <v-icon :color="getGuideTheme(guide.id) + '-darken-2'" class="mr-2">mdi-text-box-check-outline</v-icon>
                        {{ guide.title }}
                    </v-card-title>
                    <v-card-text class="pt-4 flex-grow-1 text-high-emphasis">
                        {{ guide.description }}
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>

    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Suivi Formation</h1>
      <v-spacer></v-spacer>
       <v-btn color="purple" prepend-icon="mdi-account-star" class="mr-2" @click="openPromotionDialog">
        Proposer une promotion
      </v-btn>
       <v-btn color="primary" prepend-icon="mdi-plus" @click="openRequestDialog">
        Demande de formation
      </v-btn>
       <v-btn color="orange-darken-2" prepend-icon="mdi-target" class="ml-2" @click="objectivesDialog = true">
        Objectifs Semaine
      </v-btn>
       <v-btn color="teal" prepend-icon="mdi-format-list-bulleted" class="ml-2" @click="openScenarioDialog">
        Voir les simulations
      </v-btn>
    </div>

     <v-dialog v-model="scenarioDialog" max-width="600px" scrollable>
        <v-card>
            <v-card-title class="bg-teal text-white">Générateur de simulation</v-card-title>
            <v-card-text class="pa-4" style="max-height: 70vh;">
                <v-autocomplete
                    v-model="selectedScenarioTrainee"
                    :items="trainees"
                    item-title="name"
                    return-object
                    label="Choisir un interne ou résident"
                    variant="outlined"
                    class="mb-4"
                    @update:model-value="resetScenarioSelection"
                ></v-autocomplete>

                <div v-if="selectedScenarioTrainee">
                    <v-select
                        v-model="selectedScenarioObjectives"
                        :items="availableObjectives"
                        item-title="title"
                        return-object
                        label="Objectifs à travailler"
                        variant="outlined"
                        class="mb-4"
                        multiple
                        chips
                        @update:model-value="selectedScenarios = []"
                    >
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :subtitle="`Progression: ${Math.ceil(item.raw.current)}% / ${item.raw.target}%`">
                                <template v-slot:append>
                                    <v-icon :color="item.raw.current >= item.raw.target ? 'success' : 'warning'">
                                        {{ item.raw.current >= item.raw.target ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                                    </v-icon>
                                </template>
                            </v-list-item>
                        </template>
                        <template v-slot:chip="{ props, item }">
                            <v-chip v-bind="props" :color="item.raw.current >= item.raw.target ? 'success' : 'warning'" variant="outlined">
                                {{ item.title }} ({{ Math.ceil(item.raw.current) }}%)
                            </v-chip>
                        </template>
                    </v-select>

                    <div class="d-flex justify-space-between align-center mb-4">
                        <v-btn 
                            color="purple-lighten-2" 
                            variant="tonal" 
                            prepend-icon="mdi-shuffle" 
                            @click="pickRandomSimulation"
                            :disabled="availableObjectives.filter(o => o.current < o.target).length === 0"
                        >
                            Aléatoire (Non acquis)
                        </v-btn>
                        <v-btn 
                            color="grey" 
                            variant="text" 
                            prepend-icon="mdi-close" 
                            @click="resetScenarioSelection"
                            v-if="selectedScenarioObjectives.length > 0"
                        >
                            Tout désélectionner
                        </v-btn>
                    </div>

                    <v-select
                        if="selectedScenarioObjectives.length > 0"
                        v-model="selectedScenarios"
                        :items="availableScenarios"
                        label="Simulations possibles"
                        variant="outlined"
                        multiple
                        chips
                        class="mb-4"
                    ></v-select>

                    <div class="d-flex justify-center mb-4" v-if="selectedScenarios.length > 0">
                        <v-btn color="teal" prepend-icon="mdi-dice-multiple" @click="generateInjuries">
                            Générer les blessures
                        </v-btn>
                    </div>

                    <div v-if="generatedInjuries.length > 0">
                        <v-divider class="mb-4"></v-divider>
                        <h3 class="text-subtitle-1 font-weight-bold mb-3 text-teal">
                            <v-icon start>mdi-medical-bag</v-icon> Simulation générée
                        </h3>
                        
                        <v-card variant="tonal" color="teal" class="mb-3">
                            <v-card-text>
                                <div class="font-weight-bold mb-2">Contexte:</div>
                                <div class="d-flex flex-wrap gap-2 mb-4">
                                    <v-chip v-for="sc in selectedScenarios" :key="sc" size="small" :color="getSeverityColor()" variant="elevated" class="text-white">
                                        {{ sc }}
                                    </v-chip>
                                </div>

                                <div class="font-weight-bold mb-2">Blessures:</div>
                                <v-list density="compact" bg-color="transparent">
                                    <v-list-item v-for="(inj, i) in generatedInjuries" :key="i">
                                        <template v-slot:prepend>
                                            <v-icon :color="getSeverityColor(inj.severity)">mdi-alert-circle</v-icon>
                                        </template>
                                        <v-list-item-title class="font-weight-bold">{{ inj.bodyPart }}</v-list-item-title>
                                        <v-list-item-subtitle>
                                            <span :class="`text-${getSeverityColor(inj.severity)} font-weight-bold`">{{ inj.severity }}</span>
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click="scenarioDialog = false">Fermer</v-btn>
            </v-card-actions>
        </v-card>
     </v-dialog>

     <v-dialog v-model="promotionDialog" max-width="500px">
        <v-card>
            <v-card-title class="bg-purple text-white">Proposer une promotion</v-card-title>
            <v-card-text class="pt-4">
                <v-autocomplete
                    v-model="newPromotion.employee"
                    :items="trainees"
                    item-title="name"
                    return-object
                    label="Candidat"
                    variant="outlined"
                ></v-autocomplete>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="promotionDialog = false">Annuler</v-btn>
                <v-btn color="purple" variant="text" @click="savePromotion">Enregistrer</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="followUpDialog" max-width="400px">
        <v-card v-if="selectedFollowUpEmployee">
            <v-card-title class="bg-primary text-white">Mise à jour suivi - {{ selectedFollowUpEmployee.name }}</v-card-title>
            <v-card-text class="pt-4">
                <v-text-field v-model="newFollowUpDate" label="Date de suivi" type="date" variant="outlined"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn color="error" variant="text" @click="deleteFollowUpDate">Supprimer</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="followUpDialog = false">Annuler</v-btn>
                <v-btn color="primary" variant="text" @click="saveFollowUpDate">Enregistrer</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="guideDialog" max-width="800px" scrollable>
        <v-card v-if="currentGuide">
            <v-toolbar color="primary" :title="isEditingGuide ? 'Modifier ' + currentGuide.title : currentGuide.title">
                 <v-spacer></v-spacer>
                 <v-btn icon="mdi-pencil" v-if="!isEditingGuide" @click="isEditingGuide = true"></v-btn>
                 <v-btn icon="mdi-close" @click="guideDialog = false"></v-btn>
            </v-toolbar>
            
            <v-card-text class="pa-4" style="max-height: 70vh;">
                <!-- VIEW MODE -->
                <div v-if="!isEditingGuide">
                    <p class="text-body-1 mb-4">{{ currentGuide.description }}</p>
                    
                    <v-sheet border class="rounded-lg overflow-hidden elevation-1">
                        <v-table density="default">
                            <thead>
                                <tr :class="`bg-${getGuideTheme(currentGuide.id)}-lighten-4 text-uppercase text-caption font-weight-bold text-${getGuideTheme(currentGuide.id)}-darken-4`">
                                    <th class="text-left" style="width: 20%;">Catégorie</th>
                                    <th class="text-left" style="width: 25%;">Titre</th>
                                    <th class="text-left">Description</th>
                                    <th style="width: 60px;" class="text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="(group, i) in groupedSteps" :key="i">
                                    <tr v-for="(step, j) in group.items" :key="step.originalIndex" class="transition-swing hover:bg-grey-lighten-5">
                                        <td 
                                            v-if="j === 0" 
                                            :rowspan="group.items.length"
                                            :class="`align-top pt-4 border-e border-${getGuideTheme(currentGuide.id)}-lighten-4 bg-${getGuideTheme(currentGuide.id)}-lighten-5 text-subtitle-2 font-weight-bold text-${getGuideTheme(currentGuide.id)}-darken-4`"
                                        >
                                            {{ group.header }}
                                        </td>
                                        <td class="align-top pt-3 font-weight-medium text-body-2">
                                            {{ step.title }}
                                        </td>
                                        <td class="pt-3 pb-3 align-top text-body-2 text-high-emphasis">
                                            <div style="white-space: pre-line; line-height: 1.5;">{{ step.description }}</div>
                                        </td>
                                        <td class="align-top pt-2 text-center">
                                            <v-checkbox-btn 
                                                v-model="checkedSteps[step.originalIndex]" 
                                                :color="getGuideTheme(currentGuide.id)"
                                                density="compact"
                                                hide-details
                                            ></v-checkbox-btn>
                                        </td>
                                    </tr>
                                </template>
                                <tr v-if="!groupedSteps.length">
                                    <td colspan="4" class="text-center pa-8 text-medium-emphasis font-italic">
                                        <v-icon icon="mdi-text-box-remove-outline" size="large" class="mb-2"></v-icon>
                                        <div>Aucune étape définie pour ce guide.</div>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-sheet>
                </div>

                <!-- EDIT MODE -->
                <div v-else>
                    <v-text-field v-model="editedGuide.title" label="Titre du Guide" variant="outlined"></v-text-field>
                    <v-textarea v-model="editedGuide.description" label="Description globale" variant="outlined" rows="2"></v-textarea>
                    
                    <div class="d-flex justify-space-between align-center mt-3 mb-2">
                         <span class="text-h6">Étapes</span>
                         <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="addStep">Ajouter une étape</v-btn>
                    </div>

                    <div class="d-flex flex-column gap-3">
                         <v-card v-for="(step, i) in editedGuide.steps" :key="i" variant="outlined" class="mb-3">
                             <v-card-text class="pa-3">
                                 <v-row no-gutters align="start">
                                     <v-col cols="1" class="d-flex flex-column align-center pt-2">
                                         <v-btn icon="mdi-chevron-up" variant="text" size="small" :disabled="i === 0" @click="moveStep(i, -1)"></v-btn>
                                         <v-btn icon="mdi-chevron-down" variant="text" size="small" :disabled="i === editedGuide.steps.length - 1" @click="moveStep(i, 1)"></v-btn>
                                         <v-btn icon="mdi-delete" color="error" variant="text" size="small" class="mt-2" @click="removeStep(i)"></v-btn>
                                     </v-col>
                                     
                                     <v-col cols="11">
                                        <v-row dense>
                                            <v-col cols="12" sm="6">
                                                <v-text-field 
                                                    v-model="step.header" 
                                                    label="Catégorie (Header)" 
                                                    variant="outlined" 
                                                    density="compact" 
                                                    hide-details="auto"
                                                    class="mb-2"
                                                ></v-text-field>
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-text-field 
                                                    v-model="step.title" 
                                                    label="Titre" 
                                                    variant="outlined" 
                                                    density="compact" 
                                                    hide-details="auto"
                                                    class="mb-2"
                                                ></v-text-field>
                                            </v-col>
                                            <v-col cols="12">
                                                <v-textarea 
                                                    v-model="step.description" 
                                                    label="Description" 
                                                    variant="outlined" 
                                                    density="compact" 
                                                    hide-details="auto"
                                                    rows="2"
                                                    auto-grow
                                                ></v-textarea>
                                            </v-col>
                                        </v-row>
                                     </v-col>
                                 </v-row>
                             </v-card-text>
                         </v-card>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions v-if="isEditingGuide">
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="isEditingGuide = false">Annuler</v-btn>
                <v-btn color="success" variant="text" @click="saveGuide">Sauvegarder</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>



    <v-dialog v-model="competenciesDialog" max-width="900px" scrollable>
        <v-card v-if="selectedTrainee">
            <v-card-title class="bg-info text-white d-flex align-center">
                Suivi de formation - {{ selectedTrainee.name }}
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" @click="competenciesDialog = false"></v-btn>
            </v-card-title>
            <v-card-text class="pa-4" style="max-height: 80vh;">
                <div v-for="category in competencyTree" :key="category.id" class="mb-6">
                    <h3 class="text-h6 mb-3 d-flex align-center text-primary">
                        <v-icon start>mdi-shape</v-icon>
                        {{ category.title }}
                    </h3>
                    
                    <v-row>
                        <v-col cols="12" md="6" v-for="comp in category.competencies" :key="comp.id">
                            <v-card variant="outlined" class="h-100">
                                <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center">
                                    {{ comp.title }}
                                    <v-spacer></v-spacer>
                                    <v-btn
                                        icon
                                        density="compact"
                                        variant="text"
                                        size="small"
                                        class="mr-2"
                                        @click.stop="toggleCompetencySeen(comp.id)"
                                    >
                                        <v-icon :color="isCompetencySeen(comp.id) ? 'amber' : 'grey-lighten-2'">
                                            {{ isCompetencySeen(comp.id) ? 'mdi-eye' : 'mdi-eye-off' }}
                                        </v-icon>
                                        <v-tooltip activator="parent" location="top">
                                            {{ isCompetencySeen(comp.id) ? 'Compétence vue' : 'Marquer comme vue' }}
                                        </v-tooltip>
                                    </v-btn>
                                    <v-progress-circular
                                        :model-value="getCompetencyProgress(comp)"
                                        :color="getCompetencyColor(getCompetencyProgress(comp))"
                                        size="24"
                                        width="4"
                                    ></v-progress-circular>
                                </v-card-title>
                                <v-divider></v-divider>
                                <v-card-text class="pa-0">
                                    <v-list density="compact">
                                        <v-list-item v-for="sub in comp.subCompetencies" :key="sub.id" @click="toggleSubCompetency(sub.id)">
                                            <template v-slot:prepend>
                                                <v-checkbox-btn 
                                                    :model-value="isSubCompetencyValidated(sub.id)"
                                                    color="success"
                                                    hide-details
                                                    density="compact"
                                                ></v-checkbox-btn>
                                            </template>
                                            <v-list-item-title class="text-body-2 text-wrap" style="white-space: normal;" :class="{'text-medium-emphasis': !isSubCompetencyValidated(sub.id)}">
                                                {{ sub.title }}
                                            </v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="requestDialog" max-width="500px">
        <v-card>
            <v-card-title class="bg-primary text-white">Noter une demande de formation</v-card-title>
            <v-card-text class="pt-4">
                <v-autocomplete
                    v-model="newRequest.employee"
                    :items="employees"
                    item-title="name"
                    return-object
                    label="Employé demandeur"
                    variant="outlined"
                ></v-autocomplete>
                <v-select
                    v-model="newRequest.training"
                    :items="availableTrainings"
                    label="Formation demandée"
                    variant="outlined"
                    :disabled="!newRequest.employee"
                ></v-select>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="requestDialog = false">Annuler</v-btn>
                <v-btn color="primary" variant="text" @click="saveRequest">Enregistrer</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="objectivesDialog" fullscreen transition="dialog-bottom-transition">
        <v-card>
            <v-toolbar color="orange-darken-2">
                <v-btn icon="mdi-close" @click="objectivesDialog = false"></v-btn>
                <v-toolbar-title>Objectifs de la semaine</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text>
                <v-tabs v-model="objectivesTab" align-tabs="center" color="orange-darken-2">
                    <v-tab value="interne">Internes</v-tab>
                    <v-tab value="resident">Résidents</v-tab>
                </v-tabs>

                <v-window v-model="objectivesTab">
                    <v-window-item value="interne">
                        <v-table density="compact" fixed-header height="calc(100vh - 150px)">
                            <thead>
                                <tr>
                                    <th class="text-left font-weight-bold">Interne</th>
                                    <th v-for="obj in internObjectives" :key="obj.hash" class="text-center font-weight-bold" style="white-space: nowrap;">
                                        {{ obj.title }}
                                        <div class="text-caption text-grey">{{ obj.target }}%</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="emp in interns" :key="emp.id">
                                    <td class="font-weight-medium">{{ emp.name }}</td>
                                    <td v-for="obj in internObjectives" :key="obj.hash" class="text-center">
                                        <v-icon v-if="calculateProgress(emp, obj.id) >= obj.target" color="success">mdi-check-circle</v-icon>
                                        <v-progress-linear
                                            v-else
                                            :model-value="calculateProgress(emp, obj.id)"
                                            :color="getCompetencyColor(calculateProgress(emp, obj.id), obj.target)"
                                            height="15"
                                            rounded
                                        >
                                            <template v-slot:default="{ value }">
                                                <span class="text-caption text-white">{{ Math.ceil(value) }}%</span>
                                            </template>
                                        </v-progress-linear>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-window-item>

                    <v-window-item value="resident">
                        <v-table density="compact" fixed-header height="calc(100vh - 150px)">
                            <thead>
                                <tr>
                                    <th class="text-left font-weight-bold">Résident</th>
                                    <th v-for="obj in residentObjectives" :key="obj.hash" class="text-center font-weight-bold" style="white-space: nowrap;">
                                        {{ obj.title }}
                                        <div class="text-caption text-grey">{{ obj.target }}%</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="emp in residentsList" :key="emp.id">
                                    <td class="font-weight-medium">{{ emp.name }}</td>
                                    <td v-for="obj in residentObjectives" :key="obj.hash" class="text-center">
                                        <v-icon v-if="calculateProgress(emp, obj.id) >= obj.target" color="success">mdi-check-circle</v-icon>
                                        <v-progress-linear
                                            v-else
                                            :model-value="calculateProgress(emp, obj.id)"
                                            :color="getCompetencyColor(calculateProgress(emp, obj.id), obj.target)"
                                            height="15"
                                            rounded
                                        >
                                            <template v-slot:default="{ value }">
                                                <span class="text-caption text-white">{{ Math.ceil(value) }}%</span>
                                            </template>
                                        </v-progress-linear>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-card class="flex-grow-1">
      <v-data-table
        :headers="headers"
        :items="trainees"
        :search="search"
        class="h-100"
        :sort-by="[{ key: 'role', order: 'desc' }]"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="blue" v-if="item.sex === 'Homme'" class="mr-2">mdi-gender-male</v-icon>
            <v-icon color="pink" v-else-if="item.sex === 'Femme'" class="mr-2">mdi-gender-female</v-icon>
            <v-icon v-else class="mr-2">mdi-account</v-icon>
            {{ item.name }}
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
          >
            {{ item.role }}
          </v-chip>
        </template>
        
        <template v-slot:item.arrivalDate="{ item }">
            {{ formatDate(item.arrivalDate) }}
        </template>

        <template v-slot:item.daysAtGrade="{ item }">
            <div class="d-flex align-center">
                {{ calculateDays(item.lastPromotionDate) }} jours
                <v-chip v-if="calculateDays(item.lastPromotionDate) >= 28" color="red" size="x-small" class="ml-2" variant="flat">Critique</v-chip>
                <v-chip v-else-if="calculateDays(item.lastPromotionDate) >= 21" color="orange" size="x-small" class="ml-2" variant="flat">Attention</v-chip>
                <v-chip v-else-if="calculateDays(item.lastPromotionDate) >= 14" color="yellow-darken-3" size="x-small" class="ml-2" variant="flat">A surveiller</v-chip>
            </div>

        </template>

        <template v-slot:item.badges="{ item }">
            <div class="d-flex align-center justify-center gap-1">
                <span 
                    v-for="(badge, i) in getEmployeeBadges(item)" 
                    :key="i" 
                    class="text-h6 cursor-help cursor-pointer"
                >
                    {{ badge.emoji }}
                    <v-tooltip activator="parent" location="top">
                        {{ badge.title }}
                    </v-tooltip>
                </span>
            </div>
        </template>

        <template v-slot:item.lastFollowUpDate="{ item }">
            <div class="d-flex align-center justify-center">
                <span v-if="item.lastFollowUpDate">{{ calculateDays(item.lastFollowUpDate) }} jours</span>
                <span v-else class="text-grey font-italic">Jamais</span>
                
                <v-chip v-if="item.lastFollowUpDate && calculateDays(item.lastFollowUpDate) >= 28" color="red" size="x-small" class="ml-2" variant="flat">Critique</v-chip>
                <v-chip v-else-if="item.lastFollowUpDate && calculateDays(item.lastFollowUpDate) >= 21" color="orange" size="x-small" class="ml-2" variant="flat">Attention</v-chip>

                <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" class="ml-2" @click="openFollowUpDialog(item)"></v-btn>
            </div>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-btn
                v-if="['Interne', 'Résident', 'Titulaire'].includes(item.role)"
                color="info"
                size="small"
                variant="tonal"
                prepend-icon="mdi-school"
                @click="openCompetencyTracking(item)"
            >
                Suivi
            </v-btn>
        </template>

      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import Employee from '@/classes/Employee'
import Guide from '@/classes/Guide'
import { trainingCompetencies } from '@/config/training_competencies'

import { OBJECTIFS } from '@/config/objectives'
import { EVENTS, SCENARIOS } from '@/config/events'
import { TRAININGS_CONFIG } from '@/config/trainings'

import { BODY_PARTS } from '@/config/body_parts'
import { useUserStore } from '@/store/user'
import Swal from 'sweetalert2/dist/sweetalert2.js'

export default {
  name: 'Training',
  data: () => ({
    userStore: useUserStore(),
    search: '',
    employees: [],
    guides: [],
    unsub: [],
    headers: [
      { title: 'Nom', key: 'name' },
      { title: 'Rôle', key: 'role' },
      { title: 'Arrivée', key: 'arrivalDate' },
      { title: 'Jours au grade', key: 'daysAtGrade' },
      { title: 'Compétences', key: 'badges', sortable: false, align: 'center' },
      { title: 'Suivi', key: 'lastFollowUpDate', align: 'center' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],
    competenciesDialog: false,
    selectedTrainee: null,
    competencyTree: trainingCompetencies,
    requestDialog: false,
    objectivesDialog: false,
    objectivesTab: 'interne',
    scenarioDialog: false,
    selectedScenarioTrainee: null,
    selectedScenarioObjectives: [],
    selectedScenarios: [],
    generatedInjuries: [],
    newRequest: {
        employee: null,
        training: 'Formation Grenouille'
    },
    promotionDialog: false,
    newPromotion: {
        employee: null,

    },
    
    followUpDialog: false,
    selectedFollowUpEmployee: null,
    newFollowUpDate: null,

    // Guides logic
    guideDialog: false,
    currentGuide: null,
    editedGuide: {
        id: null,
        title: '',
        description: '',
        steps: []
    },
    isEditingGuide: false,
    checkedSteps: []
  }),

  computed: {
    trainees() {
      return this.employees.filter(e => ['Interne', 'Résident'].includes(e.role)).sort((a, b) => a.name.localeCompare(b.name))
    },
    trainingRequests() {
        let reqs = []
        this.employees.forEach(e => {
            if (e.trainingRequests && e.trainingRequests.length > 0) {
                e.trainingRequests.forEach(r => {
                    reqs.push({
                        id: e.id,
                        name: e.name,
                        training: r,
                        employeeObj: e
                    })
                })
            }
        })
        return reqs
    },
    promotionRequests() {
        return this.employees
            .filter(e => e.promotionRequest)
            .map(e => ({
                id: e.id,
                name: e.name,
                request: e.promotionRequest,
                employeeObj: e
            }))
    },
    sortedGuides() {
        const order = ['introduction', 'qa', 'resident', 'titulaire']
        return this.guides.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    },
    groupedSteps() {
        if (!this.currentGuide || !this.currentGuide.steps) return []
        const groups = []
        if (this.currentGuide.steps.length === 0) return []
        
        let currentGroup = { 
            header: this.currentGuide.steps[0].header, 
            items: [{ ...this.currentGuide.steps[0], originalIndex: 0 }] 
        }
        
        for (let i = 1; i < this.currentGuide.steps.length; i++) {
            const step = this.currentGuide.steps[i]
            if (step.header === currentGroup.header) {
                currentGroup.items.push({ ...step, originalIndex: i })
            } else {
                groups.push(currentGroup)
                currentGroup = { header: step.header, items: [{ ...step, originalIndex: i }] }
            }
        }
        groups.push(currentGroup)
        return groups
    },
    internObjectives() {
        return OBJECTIFS.filter(o => o.rank === 'Interne').map(o => ({...o, hash: o.id + o.rank + o.title}))
    },
    residentObjectives() {
        return OBJECTIFS.filter(o => o.rank === 'Résident').map(o => ({...o, hash: o.id + o.rank + o.title}))
    },
    interns() {
        return this.employees.filter(e => e.role === 'Interne').sort((a,b) => a.name.localeCompare(b.name))
    },
    residentsList() {
        return this.employees.filter(e => e.role === 'Résident').sort((a,b) => a.name.localeCompare(b.name))
    },
    availableObjectives() {
        if (!this.selectedScenarioTrainee) return []
        
        const rawList = this.selectedScenarioTrainee.role === 'Interne' ? this.internObjectives : this.residentObjectives
        
        return rawList.map(obj => ({
            ...obj,
            current: this.calculateProgress(this.selectedScenarioTrainee, obj.id)
        })).filter(obj => {
             let hasScenarios = false
             const event = EVENTS.find(e => e.name === obj.title)
             if (event && event.context) {
                 hasScenarios = event.context.some(ctx => SCENARIOS[ctx] && SCENARIOS[ctx].length > 0)
             }
             if (!hasScenarios && obj.scenarioCategory && SCENARIOS[obj.scenarioCategory]) {
                 hasScenarios = SCENARIOS[obj.scenarioCategory].length > 0
             }
             return hasScenarios
        })
    },
    availableScenarios() {
        if (!this.selectedScenarioObjectives || this.selectedScenarioObjectives.length === 0) return []
        
        let scenarios = []
        
        this.selectedScenarioObjectives.forEach(obj => {
            const event = EVENTS.find(e => e.name === obj.title)
            if (event) {
                event.context.forEach(ctx => {
                    if (SCENARIOS[ctx]) {
                        scenarios = [...scenarios, ...SCENARIOS[ctx]]
                    }
                })
            }
            else if (obj.scenarioCategory && SCENARIOS[obj.scenarioCategory]) {
                scenarios = [...scenarios, ...SCENARIOS[obj.scenarioCategory]]
            }
        })
        
        return [...new Set(scenarios)]
    },
    availableTrainings() {
        if (!this.newRequest.employee) return []
        const emp = this.newRequest.employee
        const allTrainings = TRAININGS_CONFIG.map(t => t.title)
        if (!emp.trainingRequests) return allTrainings
        return allTrainings.filter(t => !emp.trainingRequests.includes(t))
    },
  },

  mounted() {
    this.unsub.push(Employee.listenAll((employees) => {
      this.employees = [...employees].sort((a, b) => a.name.localeCompare(b.name))
    }))
    
    this.unsub.push(Guide.listenAll(async (guides) => {
        this.guides = guides
        
        // Init default guides if missing
        const defaults = [
            { 
                id: 'introduction', 
                title: 'Introduction', 
                description: 'Procédure d\'accueil des nouveaux arrivants.',
                steps: [
                    { 
                        header: 'Tenues', 
                        title: 'Expliquer l\'utilisation des tenues', 
                        description: '' 
                    },
                    { 
                        header: 'Kit de base pour service', 
                        title: 'Inventaire du sac', 
                        description: '- 2 barrières flèches et 2 brancards\n- 20 papiers\n- 2 kits de nettoyage\n- 10 kits pharma et 10 pansements\n- 2 poches sang (date du jour) et 5 poches vides\n- 2 tests salivaire\n- kit hors service (outil de désinca + défib + ciseaux)' 
                    },
                    { 
                        header: 'Visite LSES', 
                        title: 'Visite des locaux', 
                        description: 'Expliquer les différentes salles et l\'utilisation des brancards (tout le long de l\'intégration)' 
                    },
                    { 
                        header: 'Bases de la médecine', 
                        title: 'Formation pratique', 
                        description: 'Expliquer ET démontrer: auscultation, IPT, Radio, Soins généraux, ...' 
                    }
                ]
            },
            { id: 'qa', title: 'Q&A', description: 'Questions / Réponses fréquentes.' },
            { id: 'resident', title: 'Passage Résident', description: 'Checklist pour la promotion au grade de Résident.' },
            { id: 'titulaire', title: 'Passage Titulaire', description: 'Checklist pour la promotion au grade de Titulaire.' }
        ]
        
        for (const def of defaults) {
            if (!this.guides.find(g => g.id === def.id)) {
                const newGuide = new Guide(def.id, def.title, def.description, def.steps || [])
                await newGuide.save()
            }
        }
    }))
  },

  beforeUnmount() {
    this.unsub.forEach(u => {
      if (typeof u === 'function') u()
    })
  },

  methods: {
    getRoleColor(role) {
      if (['Résident'].includes(role)) return 'blue'
      return 'green'
    },
    
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },

    calculateDays(dateString) {
       if (!dateString) return '?'
       const oneDay = 24 * 60 * 60 * 1000
       const firstDate = new Date(dateString + 'T00:00:00')
       const secondDate = new Date()
       secondDate.setHours(0, 0, 0, 0)
       
       return Math.round(Math.abs((firstDate - secondDate) / oneDay))
    },

    openScenarioDialog() {
        this.selectedScenarioTrainee = null
        this.selectedScenarioObjectives = []
        this.selectedScenarios = []
        this.generatedInjuries = []
        this.scenarioDialog = true
    },

    resetScenarioSelection() {
        this.selectedScenarioObjectives = []
        this.selectedScenarios = []
        this.generatedInjuries = []
    },

    generateInjuries() {
        if (this.selectedScenarios.length === 0) return

        const severities = ['Légère', 'Moyenne', 'Lourde']
        const numInjuries = Math.floor(Math.random() * 4) + 1
        
        const injuries = []
        const usedParts = new Set()

        for (let i = 0; i < numInjuries; i++) {
            let part = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)]
            let attempts = 0

            while (usedParts.has(part) && attempts < 5) {
                part = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)]
                attempts++
            }
            usedParts.add(part)

            const severity = severities[Math.floor(Math.random() * severities.length)]
            injuries.push({ bodyPart: part, severity: severity })
        }

        this.generatedInjuries = injuries
    },

    pickRandomSimulation() {
        const missingObjectives = this.availableObjectives.filter(o => o.current < o.target)
        
        if (missingObjectives.length === 0) {
             Swal.fire({
                icon: 'success',
                title: 'Tout est validé !',
                text: 'Cet interne a déjà atteint tous ses objectifs.'
            })
            return
        }

        const shuffled = [...missingObjectives].sort(() => 0.5 - Math.random())
        const count = Math.floor(Math.random() * 3) + 1
        const selectedObjs = shuffled.slice(0, count)
        
        this.selectedScenarioObjectives = selectedObjs
        
        let allSelectedScenarios = []

        selectedObjs.forEach(obj => {
            let possibleScenarios = []
            const event = EVENTS.find(e => e.name === obj.title)
            if (event) {
                event.context.forEach(ctx => {
                    if (SCENARIOS[ctx]) possibleScenarios = [...possibleScenarios, ...SCENARIOS[ctx]]
                })
            } else if (obj.scenarioCategory && SCENARIOS[obj.scenarioCategory]) {
                 possibleScenarios = SCENARIOS[obj.scenarioCategory]
            }

            if (possibleScenarios.length > 0) {
                const randomScenario = possibleScenarios[Math.floor(Math.random() * possibleScenarios.length)]
                allSelectedScenarios.push(randomScenario)
            }
        })
        
        if (allSelectedScenarios.length > 0) {
            this.selectedScenarios = [...new Set(allSelectedScenarios)]
            this.generateInjuries()
        } else {
             Swal.fire({
                icon: 'warning',
                title: 'Oups',
                text: 'Aucun scénario trouvé pour ces objectifs.'
            })
        }
    },

    getSeverityColor(severity) {
        if (!severity) return 'teal'
        switch(severity) {
            case 'Légère': return 'success'
            case 'Moyenne': return 'orange'
            case 'Lourde': return 'red'
            default: return 'grey'
        }
    },

    openRequestDialog() {
        this.newRequest = { employee: null, training: 'Formation Grenouille' }
        this.requestDialog = true
    },

    async saveRequest() {
        if (!this.newRequest.employee || !this.newRequest.training) return

        try {
            const emp = this.newRequest.employee
            if (!emp.trainingRequests) emp.trainingRequests = []
            
            // Avoid duplicates
            if (!emp.trainingRequests.includes(this.newRequest.training)) {
                emp.trainingRequests.push(this.newRequest.training)
                await emp.save()
                
                Swal.fire({
                    icon: 'success',
                    title: 'Demande enregistrée',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                })
            } else {
                 Swal.fire({
                    icon: 'info',
                    title: 'Demande déjà existante',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                })
            }
            this.requestDialog = false
        } catch (e) {
            console.error(e)
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Impossible d'enregistrer la demande"
            })
        }
    },

    async removeRequest(req) {
        try {
            const emp = req.employeeObj
            emp.trainingRequests = emp.trainingRequests.filter(r => r !== req.training)
            await emp.save()
             Swal.fire({
                icon: 'success',
                title: 'Demande supprimée',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            })
        } catch (e) {
            console.error(e)
        }
    },

    getTrainingColor(training) {
        const config = TRAININGS_CONFIG.find(t => t.title === training)
        return config ? config.color : 'primary'
    },

    openPromotionDialog() {
        this.newPromotion = { employee: null }
        this.promotionDialog = true
    },

    async savePromotion() {
        if (!this.newPromotion.employee) return

        try {
            const emp = this.newPromotion.employee
            const request = {
                id: Date.now().toString(),
                requestedBy: this.userStore.profile.name,
                targetRole: this.getNextRole(emp.role),
                date: new Date().toISOString(),
                votes: {}
            }

            emp.promotionRequest = request
            await emp.save()

            this.promotionDialog = false
            Swal.fire({
                icon: 'success',
                title: 'Proposition envoyée',
                timer: 1500,
                showConfirmButton: false
            })
        } catch (e) {
            console.error(e)
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Impossible d'enregistrer la proposition"
            })
        }
    },

    openFollowUpDialog(employee) {
        this.selectedFollowUpEmployee = employee
        this.newFollowUpDate = new Date().toISOString().substr(0, 10)
        this.followUpDialog = true
    },

    async saveFollowUpDate() {
        if (!this.selectedFollowUpEmployee || !this.newFollowUpDate) return

        try {
            this.selectedFollowUpEmployee.lastFollowUpDate = this.newFollowUpDate
            await this.selectedFollowUpEmployee.save()
            this.followUpDialog = false
            
            Swal.fire({
                icon: 'success',
                title: 'Date mise à jour',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            })
        } catch (e) {
            console.error(e)
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Erreur lors de la mise à jour"
            })
        }
    },

    async deleteFollowUpDate() {
        if (!this.selectedFollowUpEmployee) return

        try {
            this.selectedFollowUpEmployee.lastFollowUpDate = null
            await this.selectedFollowUpEmployee.save()
            this.followUpDialog = false
            
            Swal.fire({
                icon: 'success',
                title: 'Date supprimée',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            })
        } catch (e) {
            console.error(e)
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Erreur lors de la suppression"
            })
        }
    },

    async removePromotion(emp) {
         try {
            emp.promotionRequest = null
            await emp.save()
        } catch (e) { console.error(e) }
    },

    async vote(emp, type) {
        const { value: text } = await Swal.fire({
            input: 'textarea',
            inputLabel: 'Avis / Commentaire',
            inputPlaceholder: 'Pourquoi votez-vous ' + type + ' ?',
            inputAttributes: {
                'aria-label': 'Type your message here'
            },
            showCancelButton: true
        })

        if (text) {
             if (!emp.promotionRequest.votes) emp.promotionRequest.votes = {}
             emp.promotionRequest.votes[this.userStore.profile.id] = {
                 vote: type,
                 opinion: text,
                 voterName: this.userStore.profile.name || 'Inconnu'
             }
             await emp.save()
        }
    },

    countVotes(request, type) {
        if (!request.votes) return 0
        return Object.values(request.votes).filter(v => v.vote === type).length
    },

    openGuide(guide) {
        this.currentGuide = guide
        this.editedGuide = { 
            id: guide.id,
            title: guide.title,
            description: guide.description,
            steps: [...guide.steps]
        }
        this.checkedSteps = new Array(guide.steps.length).fill(false)
        this.isEditingGuide = false
        this.guideDialog = true
    },

    async saveGuide() {
        try {
            const guide = new Guide(
                this.editedGuide.id,
                this.editedGuide.title,
                this.editedGuide.description,
                this.editedGuide.steps
            )
            await guide.save()
            this.isEditingGuide = false
            this.currentGuide = guide 
            this.checkedSteps = new Array(this.editedGuide.steps.length).fill(false)
            Swal.fire({
                icon: 'success',
                title: 'Sauvegardé',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            })
        } catch (e) {
            console.error(e)
            Swal.fire({ icon: 'error', title: 'Erreur' })
        }
    },

    addStep() {
        this.editedGuide.steps.push({ header: '', title: '', description: '' })
    },

    removeStep(index) {
        this.editedGuide.steps.splice(index, 1)
    },
    
    moveStep(index, direction) {
        if (direction === -1 && index > 0) {
            const temp = this.editedGuide.steps[index]
            this.editedGuide.steps[index] = this.editedGuide.steps[index - 1]
            this.editedGuide.steps[index - 1] = temp
        }
        if (direction === 1 && index < this.editedGuide.steps.length - 1) {
            const temp = this.editedGuide.steps[index]
            this.editedGuide.steps[index] = this.editedGuide.steps[index + 1]
            this.editedGuide.steps[index + 1] = temp
        }
    },
    
    getGuideTheme(id) {
        if (['introduction', 'qa'].includes(id)) return 'green'
        return 'blue'
    },

    openCompetencyTracking(employee) {
        this.selectedTrainee = employee
        this.competenciesDialog = true
    },

    isSubCompetencyValidated(subId) {
        const status = this.selectedTrainee?.competencyProgress?.[subId]
        return status === 'validated'
    },

    getCompetencyStatus(subId) {
        return this.selectedTrainee?.competencyProgress?.[subId]
    },

    isCompetencySeen(compId) {
        return this.selectedTrainee?.competencyProgress?.[compId] === 'seen'
    },

    async toggleCompetencySeen(compId) {
        if (!this.selectedTrainee) return
        if (!this.selectedTrainee.competencyProgress) this.selectedTrainee.competencyProgress = {}

        if (this.isCompetencySeen(compId)) {
            delete this.selectedTrainee.competencyProgress[compId]
        } else {
            this.selectedTrainee.competencyProgress[compId] = 'seen'
        }
        await this.selectedTrainee.save()
    },

    async toggleSubCompetency(subId) {
        if (!this.selectedTrainee) return
        
        if (!this.selectedTrainee.competencyProgress) {
             this.selectedTrainee.competencyProgress = {}
        }

        const isVal = this.isSubCompetencyValidated(subId)
        if (isVal) {
             delete this.selectedTrainee.competencyProgress[subId]
        } else {
             this.selectedTrainee.competencyProgress[subId] = 'validated'
        }
        
        await this.selectedTrainee.save()
    },

    getCompetencyProgress(competency) {
        if (!this.selectedTrainee) return 0
        const total = competency.subCompetencies.length
        if (total === 0) return 0
        
        const validated = competency.subCompetencies.filter(sub => 
            this.selectedTrainee.competencyProgress?.[sub.id] === 'validated'
        ).length
        
        return (validated / total) * 100
    },

    getCompetencyColor(progress, target = 100) {
        if (progress >= target) return 'success'
        if (progress >= target / 2) return 'warning'
        return 'error'
    },

    getEmployeeBadges(employee) {
        const badges = []
        if (!employee || !employee.competencyProgress) return badges

        this.competencyTree.forEach(category => {
            category.competencies.forEach(comp => {
                if (comp.emoji) {
                    // Check if all sub-competencies are validated
                    const total = comp.subCompetencies.length
                    if (total > 0) {
                        const validated = comp.subCompetencies.filter(sub => 
                            employee.competencyProgress[sub.id] === 'validated'
                        ).length
                        
                        if (validated === total) {
                            badges.push({ emoji: comp.emoji, title: comp.title })
                        }
                    }
                }
            })
        })
        return badges
    },

    findCompetencyById(id) {
        for (const category of this.competencyTree) {
            const comp = category.competencies.find(c => c.id === id)
            if (comp) return comp
        }
        return null
    },

    calculateProgress(employee, compId) {
        if (!employee) return 0
        const comp = this.findCompetencyById(compId)
        if (!comp) return 0

        const total = comp.subCompetencies.length
        if (total === 0) return 0
        
        const validated = comp.subCompetencies.filter(sub => 
            employee.competencyProgress?.[sub.id] === 'validated'
        ).length
        
        return (validated / total) * 100
    }
  }
}
</script>
