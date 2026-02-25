<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <v-card class="mb-4" variant="tonal" color="primary" v-if="trainingRequests.length > 0">
        <v-card-title class="text-subtitle-1 font-weight-bold">
            Demandes de formation en cours
        </v-card-title>
        <v-card-text>
            <div v-for="(group, trainingName) in groupedTrainingRequests" :key="trainingName" class="mb-3">
                <div class="text-caption font-weight-bold mb-1 text-grey-darken-1">{{ trainingName }}</div>
                <div class="d-flex flex-wrap gap-2">
                    <v-chip
                        v-for="req in group"
                        :key="req.id + req.training"
                        :color="getTrainingColor(req.training)"
                        closable
                        :model-value="true"
                        size="small"
                        @click:close="removeRequest(req)"
                    >
                        {{ req.name }}
                    </v-chip>
                </div>
            </div>
        </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="tonal" color="purple" v-if="promotionRequests.length > 0 && !isRestrictedTrainer">
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

    <div class="mb-4" v-if="!isRestrictedTrainer">
        <h2 class="text-h5 mb-2">Procédures</h2>
        <v-row>
            <v-col cols="12" sm="6" md="3" v-for="guide in sortedGuides" :key="guide.id">
                <v-card 
                    @click="openGuide(guide)" 
                    hover 
                    variant="outlined" 
                    class="h-100 d-flex flex-column"
                    :color="guide.id === 'grenouille' ? 'green-darken-4' : (guide.id === 'conduite' ? 'orange-darken-2' : getGuideTheme(guide.id))"
                >
                    <v-card-title :class="guide.id === 'grenouille' ? 'bg-green-darken-4 text-white d-flex align-center' : (guide.id === 'conduite' ? 'bg-orange-darken-2 text-white d-flex align-center' : `bg-${getGuideTheme(guide.id)}-lighten-4 text-${getGuideTheme(guide.id)}-darken-4 d-flex align-center`)">
                        <v-icon v-if="getGuideIcon(guide.id).startsWith('mdi-')" :color="guide.id === 'grenouille' || guide.id === 'conduite' ? 'white' : getGuideTheme(guide.id) + '-darken-2'" class="mr-2">{{ getGuideIcon(guide.id) }}</v-icon>
                        <span v-else class="mr-2 text-h6">{{ getGuideIcon(guide.id) }}</span>
                        {{ guide.title }}
                    </v-card-title>
                    <v-card-text class="pt-4 flex-grow-1 text-high-emphasis">
                        {{ guide.description }}
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>

    <div class="d-flex align-center mb-4" v-if="!isRestrictedTrainer || true">
      <!-- Logic handled inside -->
      <h1 class="text-h4" v-if="!isRestrictedTrainer">Suivi Formation</h1>
      <h1 class="text-h4" v-else>Actions</h1>
      <v-spacer></v-spacer>
       <v-btn color="purple" prepend-icon="mdi-account-star" class="mr-2" @click="openPromotionDialog" v-if="!isRestrictedTrainer">
        Proposer une promotion
      </v-btn>
       <v-btn color="primary" prepend-icon="mdi-plus" @click="openRequestDialog">
        Demande de formation
      </v-btn>
       <v-btn color="orange-darken-2" prepend-icon="mdi-target" class="ml-2" @click="objectivesDialog = true" v-if="!isRestrictedTrainer">
        Objectifs
      </v-btn>
       <v-btn color="teal" prepend-icon="mdi-format-list-bulleted" class="ml-2 mr-2" @click="openScenarioDialog" v-if="!isRestrictedTrainer">
        Voir les simulations
      </v-btn>
      <v-btn color="blue" prepend-icon="mdi-account-group" @click="allValidationsDialog = true" v-if="!isRestrictedTrainer">
        Validations
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

                    <v-select
                        v-model="selectedMalus"
                        :items="availableMalus"
                        label="Malus à appliquer"
                        variant="outlined"
                        multiple
                        chips
                        class="mb-4"
                        prepend-inner-icon="mdi-alert-octagon"
                        color="error"
                    ></v-select>

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

                                <div v-if="selectedMalus.length > 0" class="mt-4">
                                    <div class="font-weight-bold mb-2 text-error"><v-icon start color="error">mdi-alert-octagon</v-icon>Malus:</div>
                                    <div class="d-flex flex-wrap gap-2">
                                        <v-chip v-for="malus in selectedMalus" :key="malus" size="small" color="error" variant="elevated" class="text-white">
                                            {{ malus }}
                                        </v-chip>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>

                        <div class="d-flex justify-center flex-wrap gap-4 mt-3">
                            <v-btn
                                color="blue-grey"
                                variant="tonal"
                                prepend-icon="mdi-pin"
                                density="compact"
                                class="mr-2"
                                @click="pinSimulation(false)"
                            >
                                Entraînement
                            </v-btn>
                            <v-btn
                                color="success"
                                variant="tonal"
                                prepend-icon="mdi-pin"
                                density="compact"
                                @click="pinSimulation(true)"
                            >
                                Validante
                            </v-btn>
                        </div>
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
                    :custom-filter="customFilter"
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

    <v-dialog v-model="addTrainingDialog" max-width="400px">
        <v-card v-if="selectedTrainingEmployee">
            <v-card-title class="bg-primary text-white">Validation - {{ selectedTrainingEmployee.name }}</v-card-title>
            <v-card-text class="pt-4">
                <v-select
                    v-model="newValidatedTraining"
                    :items="availableTrainingsToAdd"
                    label="Formation"
                    variant="outlined"
                ></v-select>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="addTrainingDialog = false">Annuler</v-btn>
                <v-btn color="primary" variant="text" @click="saveValidatedTraining" :disabled="!newValidatedTraining">Ajouter</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="guideDialog" max-width="1200px" scrollable>
        <v-card v-if="currentGuide">
            <v-toolbar :color="currentGuide.id === 'grenouille' ? 'green-darken-4' : 'primary'" :title="isEditingGuide ? 'Modifier ' + currentGuide.title : currentGuide.title">
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
                                <tr :class="currentGuide.id === 'grenouille' ? 'bg-green-darken-4 text-white text-uppercase text-caption font-weight-bold' : `bg-${getGuideTheme(currentGuide.id)}-lighten-4 text-uppercase text-caption font-weight-bold text-${getGuideTheme(currentGuide.id)}-darken-4`">
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
                                            style="vertical-align: middle;"
                                            :class="currentGuide.id === 'grenouille' ? 'text-center border-e border-green-darken-4 bg-green-darken-3 text-subtitle-2 font-weight-bold text-white' : `text-center border-e border-${getGuideTheme(currentGuide.id)}-lighten-4 bg-${getGuideTheme(currentGuide.id)}-lighten-5 text-subtitle-2 font-weight-bold text-${getGuideTheme(currentGuide.id)}-darken-4`"
                                        >
                                            {{ group.header }}
                                        </td>
                                        <td class="align-top pt-3 font-weight-medium text-body-2" :style="j === group.items.length - 1 ? 'border-bottom: 2px solid #9e9e9e !important' : ''">
                                            {{ step.title }}
                                        </td>
                                        <td class="pt-3 pb-3 align-top text-body-2 text-high-emphasis" :style="j === group.items.length - 1 ? 'border-bottom: 2px solid #9e9e9e !important' : ''">
                                            <div style="white-space: pre-line; line-height: 1.5;">{{ step.description }}</div>
                                            <div v-if="step.image" class="mt-2">
                                                <v-img 
                                                    :src="step.image" 
                                                    max-height="600" 
                                                    max-width="100%" 
                                                    class="rounded elevation-2 cursor-pointer" 
                                                    cover 
                                                    @click="openImageZoom(step.image)"
                                                >
                                                    <template v-slot:placeholder>
                                                        <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                                                            <v-progress-circular indeterminate color="grey-lighten-2"></v-progress-circular>
                                                        </div>
                                                    </template>
                                                </v-img>
                                            </div>
                                        </td>
                                        <td class="align-top pt-2 text-center" :style="j === group.items.length - 1 ? 'border-bottom: 2px solid #9e9e9e !important' : ''">
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
                                                <v-text-field
                                                    v-model="step.image"
                                                    label="URL Image"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details="auto"
                                                    class="mt-2"
                                                    prepend-inner-icon="mdi-image"
                                                ></v-text-field>
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



    <v-dialog v-model="imageZoomDialog" max-width="90vw" max-height="90vh">
        <v-card class="bg-black">
            <v-card-text class="pa-0 d-flex justify-center align-center" style="height: 90vh; position: relative;">
                <v-btn icon="mdi-close" variant="text" color="white" style="position: absolute; top: 10px; right: 10px; z-index: 10;" @click="imageZoomDialog = false"></v-btn>
                <v-img :src="zoomedImage" contain max-height="100%" max-width="100%"></v-img>
            </v-card-text>
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
                    :custom-filter="customFilter"
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
                <v-toolbar-title>Objectifs</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text style="overflow-y: auto;">
                <h2 class="text-h5 mb-3 mt-2">Internes</h2>
                <v-table density="compact" class="mb-6">
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
                            <td class="font-weight-medium">
                                {{ emp.name }}
                                <v-btn size="small" variant="text" color="orange" class="ml-2" @click.stop="openHistory(emp)" icon>
                                    <v-icon>mdi-history</v-icon>
                                    <v-tooltip activator="parent" location="top">Historique des simulations</v-tooltip>
                                </v-btn>
                            </td>
                            <td 
                                v-for="obj in internObjectives" 
                                :key="obj.hash" 
                                class="text-center cursor-pointer hover-bg"
                                @click="openQuickValidation(emp, obj.id)"
                            >
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

                <v-divider class="mb-4"></v-divider>

                <h2 class="text-h5 mb-3">Résidents</h2>
                <v-table density="compact">
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
                            <td class="font-weight-medium">
                                {{ emp.name }}
                                <v-btn size="small" variant="text" color="orange" class="ml-2" @click.stop="openHistory(emp)" icon>
                                    <v-icon>mdi-history</v-icon>
                                    <v-tooltip activator="parent" location="top">Historique des simulations</v-tooltip>
                                </v-btn>
                            </td>
                            <td 
                                v-for="obj in residentObjectives" 
                                :key="obj.hash" 
                                class="text-center cursor-pointer hover-bg"
                                @click="openQuickValidation(emp, obj.id)"
                            >
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

                <v-divider class="mb-4" v-if="trainerTrainees.length > 0"></v-divider>

                <div v-if="trainerTrainees.length > 0">
                    <h2 class="text-h5 mb-3">Formateurs en Formation</h2>
                    <v-table density="compact">
                        <thead>
                            <tr>
                                <th class="text-left font-weight-bold">Formateur</th>
                                <th v-for="obj in trainerObjectives" :key="obj.id" class="text-center font-weight-bold" style="white-space: nowrap;">
                                    {{ obj.title }}
                                </th>
                                <th class="text-center font-weight-bold" style="width: 80px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="emp in trainerTrainees" :key="emp.id">
                                <td class="font-weight-medium">{{ emp.name }}</td>
                                <td v-for="obj in trainerObjectives" :key="obj.id" class="text-center" style="min-width: 120px;">
                                    <v-menu>
                                        <template v-slot:activator="{ props }">
                                            <v-chip 
                                                v-bind="props" 
                                                :color="getTrainerStatusColor(getTrainerStatus(emp, obj.id))"
                                                size="small"
                                                variant="flat"
                                                class="cursor-pointer"
                                            >
                                                {{ getTrainerStatusLabel(getTrainerStatus(emp, obj.id)) }}
                                            </v-chip>
                                        </template>
                                        <v-list density="compact">
                                            <v-list-item 
                                                v-for="status in trainerStatuses" 
                                                :key="status.value"
                                                @click="setTrainerStatus(emp, obj.id, status.value)"
                                            >
                                                <template v-slot:prepend>
                                                    <v-icon :color="status.color" size="small">{{ status.icon }}</v-icon>
                                                </template>
                                                <v-list-item-title>{{ status.label }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </td>
                                <td class="text-center">
                                    <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeTrainerTrainee(emp)"></v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>

                <h3 class="text-h6 mb-3 mt-4">Ajouter un formateur en formation</h3>
                <v-autocomplete
                    v-model="selectedTrainerTrainee"
                    :items="availableTrainerTrainees"
                    item-title="name"
                    return-object
                    label="Sélectionner un Formateur"
                    variant="outlined"
                    density="compact"
                    clearable
                    :custom-filter="customFilter"
                    class="mb-2"
                    style="max-width: 400px;"
                >
                    <template v-slot:append>
                        <v-btn color="primary" size="small" :disabled="!selectedTrainerTrainee" @click="addTrainerTrainee">
                            Ajouter
                        </v-btn>
                    </template>
                </v-autocomplete>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="subCompetenciesDialog" max-width="500" z-index="2500">
        <v-card v-if="currentTrainee">
            <v-toolbar color="primary" density="compact">
                <v-toolbar-title class="text-subtitle-1">{{ currentCompetencyTitle }} - {{ currentTrainee.name }}</v-toolbar-title>
                <v-btn icon="mdi-close" variant="text" @click="subCompetenciesDialog = false"></v-btn>
            </v-toolbar>
            <v-card-text class="pa-0">
                <v-list density="compact">
                    <v-list-item 
                        v-for="sub in currentSubCompetencies" 
                        :key="sub.id"
                        @click="toggleSubVal(sub.id)"
                        active-color="primary"
                    >
                        <template v-slot:prepend>
                             <v-icon :color="isSubVal(sub.id) ? 'success' : 'grey-lighten-2'" class="mr-3">
                                {{ isSubVal(sub.id) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                             </v-icon>
                        </template>
                        <v-list-item-title>{{ sub.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="simulationHistoryDialog" max-width="1200" z-index="2500">
        <v-card v-if="historyEmployee">
            <v-toolbar color="primary" density="compact">
                <v-toolbar-title class="text-subtitle-1">Historique des Simulations - {{ historyEmployee.name }}</v-toolbar-title>
                <v-btn icon="mdi-close" variant="text" @click="simulationHistoryDialog = false"></v-btn>
            </v-toolbar>
            <v-card-text>
                <div v-if="!historyEmployee.simulations || historyEmployee.simulations.length === 0" class="text-center pa-4 text-grey">
                    Aucune simulation enregistrée.
                </div>
                <v-table v-else density="compact">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Formateur</th>
                            <th>Scénarios</th>
                            <th>Malus</th>
                            <th>Type</th>
                            <th>Objectifs</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="sim in historyEmployee.simulations" :key="sim.id">
                            <td>{{ formatDate(sim.date) }}</td>
                            <td>{{ sim.trainer }}</td>
                            <td>
                                <v-chip v-for="s in sim.scenarios" :key="s" size="x-small" class="mr-1">{{ s }}</v-chip>
                            </td>
                            <td>
                                <v-chip v-for="m in sim.malus" :key="m" size="x-small" color="error" class="mr-1">{{ m }}</v-chip>
                            </td>
                            <td>
                                <v-chip :color="sim.isValidating ? 'success' : 'blue-grey'" size="small" variant="flat">
                                    {{ sim.isValidating ? 'Validante' : 'Entraînement' }}
                                </v-chip>
                            </td>
                            <td>
                                <v-chip v-for="obj in sim.objectives" :key="obj" size="x-small" variant="outlined" class="mr-1">{{ obj }}</v-chip>
                            </td>
                            <td>
                                <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteSimulation(sim)"></v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="allValidationsDialog" max-width="1000px" scrollable>
        <v-card>
            <v-card-title class="bg-blue text-white d-flex align-center">
                <v-icon start>mdi-account-group</v-icon>
                Validations
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" @click="allValidationsDialog = false"></v-btn>
            </v-card-title>
            <v-card-text class="pa-4" style="max-height: 70vh;">
                <v-text-field
                    v-model="allValidationsSearch"
                    prepend-inner-icon="mdi-magnify"
                    label="Rechercher un membre"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                    hide-details
                ></v-text-field>
                <v-data-table
                    :headers="allValidationsHeaders"
                    :items="employees"
                    :search="allValidationsSearch"
                    :sort-by="[{ key: 'role', order: 'asc' }]"
                    :items-per-page="40"
                    density="compact"
                >
                    <template v-slot:item.role="{ item }">
                        <v-chip :color="getRoleColor(item.role)" size="small">{{ item.role }}</v-chip>
                    </template>
                    <template v-slot:item.validatedTrainings="{ item }">
                        <div class="d-flex align-center justify-center gap-1">
                            <v-chip 
                                v-for="training in (item.validatedTrainings || [])" 
                                :key="training" 
                                :color="getTrainingColor(training)" 
                                size="small"
                                variant="flat"
                                class="cursor-pointer"
                                @click="removeValidatedTraining(item, training)"
                            >
                                {{ getTrainingShortName(training) }}
                                <v-tooltip activator="parent" location="top">
                                    {{ training }} (Cliquer pour retirer)
                                </v-tooltip>
                            </v-chip>
                            <v-btn icon="mdi-plus" size="x-small" variant="text" color="primary" @click="openAddTrainingDialog(item)"></v-btn>
                        </div>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </v-dialog>
    
    <v-card class="flex-grow-1" v-if="!isRestrictedTrainer">
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
import Specialty from '@/classes/Specialty'
import { trainingCompetencies } from '@/config/training_competencies'

import { OBJECTIFS } from '@/config/objectives'
import { EVENTS, SCENARIOS } from '@/config/events'
import { TRAININGS_CONFIG } from '@/config/trainings'
import { PENALTIES } from '@/config/penalties'

import { BODY_PARTS } from '@/config/body_parts'
import { useUserStore } from '@/store/user'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import logger from '@/functions/logger.js'

export default {
  name: 'Training',
  data: () => ({
    userStore: useUserStore(),
    search: '',
    employees: [],
    showAllEmployees: false,
    specialties: [],
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
    selectedTrainerTrainee: null,
    scenarioDialog: false,
    selectedScenarioTrainee: null,
    selectedScenarioObjectives: [],
    selectedScenarios: [],
    generatedInjuries: [],
    selectedMalus: [],
    availableMalus: PENALTIES,
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

    addTrainingDialog: false,
    selectedTrainingEmployee: null,
    newValidatedTraining: null,

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
    checkedSteps: [],
    
    imageZoomDialog: false,
    zoomedImage: '',
    
    trainerStatuses: [
        { value: 'not_seen', label: 'Non vue', color: 'grey', icon: 'mdi-eye-off' },
        { value: 'seen', label: 'Vue', color: 'blue', icon: 'mdi-eye' },
        { value: 'in_progress', label: 'En cours', color: 'orange', icon: 'mdi-progress-clock' },
        { value: 'mastered', label: 'Maîtrisée', color: 'success', icon: 'mdi-check-circle' }
    ],
    
    subCompetenciesDialog: false,
    currentSubCompetencies: [],
    currentCompetencyTitle: '',
    currentTrainee: null,

    simulationHistoryDialog: false,
    historyEmployee: null,

    allValidationsDialog: false,
    allValidationsSearch: '',

    allValidationsHeaders: [
      { title: 'Nom', key: 'name' },
      { 
        title: 'Rôle', 
        key: 'role',
        sort: (a, b) => {
          const roleOrder = ['Directeur', 'Directeur Adjoint', 'Assistant RH', 'Responsable de Service', 'Spécialiste', 'Titulaire', 'Résident', 'Interne']
          return roleOrder.indexOf(a) - roleOrder.indexOf(b)
        }
      },
      { title: 'Formations Validées', key: 'validatedTrainings', sortable: false, align: 'center' }
    ]
  }),

  computed: {
    isRestrictedTrainer() {
        const profile = this.userStore.profile
        if (!profile) return true
        if (profile.permissions && (profile.permissions.includes('admin') || profile.permissions.includes('trainer') || profile.permissions.includes('dev')))
            return false
        return true
    },
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
    groupedTrainingRequests() {
        const groups = {}
        this.trainingRequests.forEach(req => {
            if (!groups[req.training]) groups[req.training] = []
            groups[req.training].push(req)
        })
        return groups
    },
    promotionRequests() {
        return this.employees
            .filter(e => e.rankPromotionRequest)
            .map(e => ({
                id: e.id,
                name: e.name,
                request: e.rankPromotionRequest,
                employeeObj: e
            }))
    },
    sortedGuides() {
        const order = ['introduction', 'qa', 'resident', 'titulaire', 'grenouille', 'conduite']
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
    trainerObjectives() {
        return OBJECTIFS.filter(o => o.id.startsWith('trainer_'))
    },
    trainerTrainees() {
        return this.employees.filter(e => e.isTrainerTrainee).sort((a,b) => a.name.localeCompare(b.name))
    },
    availableTrainerTrainees() {
        return this.employees.filter(e => e.specialties && e.specialties.includes('formateur') && !e.isTrainerTrainee).sort((a,b) => a.name.localeCompare(b.name))
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
    availableTrainingsToAdd() {
        if (!this.selectedTrainingEmployee) return []
        const emp = this.selectedTrainingEmployee
        const allowedTrainings = ['Formation Grenouille', 'Formation Conduite']
        if (!emp.validatedTrainings) return allowedTrainings
        return allowedTrainings.filter(t => !emp.validatedTrainings.includes(t))
    },
  },

  mounted() {
    this.unsub.push(Employee.listenAll((employees) => {
      this.employees = [...employees].sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Specialty.listenAll((list) => {
      this.specialties = list
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
            if (!this.guides.find(g => g.id === 'grenouille')) {
                 const grenouille = new Guide(
                    'grenouille', 
                    'Formation Grenouille', 
                    'Procédure pour la formation Grenouille.', 
                    []
                 )
                 await grenouille.save()
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
        this.selectedMalus = []
    },

    getTrainerStatus(employee, objectiveId) {
        if (!employee.competencyProgress) return 'not_seen'
        return employee.competencyProgress[objectiveId] || 'not_seen'
    },

    async setTrainerStatus(employee, objectiveId, status) {
        if (!employee.competencyProgress) employee.competencyProgress = {}
        employee.competencyProgress[objectiveId] = status
        await employee.save()
    },

    getTrainerStatusLabel(status) {
        const found = this.trainerStatuses.find(s => s.value === status)
        return found ? found.label : 'Non vue'
    },

    getTrainerStatusColor(status) {
        const found = this.trainerStatuses.find(s => s.value === status)
        return found ? found.color : 'grey'
    },

    openQuickValidation(employee, objectiveId) {
        const comp = this.findCompetencyById(objectiveId)
        if (!comp || !comp.subCompetencies || comp.subCompetencies.length === 0) return

        this.currentTrainee = employee
        this.currentCompetencyTitle = comp.title
        this.currentSubCompetencies = comp.subCompetencies
        this.subCompetenciesDialog = true
    },

    isSubVal(subId) {
        if (!this.currentTrainee || !this.currentTrainee.competencyProgress) return false
        return this.currentTrainee.competencyProgress[subId] === 'validated'
    },

    async toggleSubVal(subId) {
        if (!this.currentTrainee) return
        if (!this.currentTrainee.competencyProgress) this.currentTrainee.competencyProgress = {}

        if (this.isSubVal(subId)) {
            this.currentTrainee.competencyProgress[subId] = null
        } else {
            this.currentTrainee.competencyProgress[subId] = 'validated'
        }
        await this.currentTrainee.save()
    },

    async addTrainerTrainee() {
        if (!this.selectedTrainerTrainee) return
        this.selectedTrainerTrainee.isTrainerTrainee = true
        await this.selectedTrainerTrainee.save()
        this.selectedTrainerTrainee = null
    },

    async removeTrainerTrainee(employee) {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Retirer le formateur ?',
            text: `Voulez-vous retirer ${employee.name} de la formation de formateur ?`,
            showCancelButton: true,
            confirmButtonText: 'Retirer',
            cancelButtonText: 'Annuler'
        })
        if (result.isConfirmed) {
            employee.isTrainerTrainee = false
            await employee.save()
        }
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

    async pinSimulation(isValidating) {
        if (!this.selectedScenarioTrainee) return
        
        const simulation = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            trainer: this.userStore.profile.name || 'Inconnu',
            scenarios: [...this.selectedScenarios],
            injuries: [...this.generatedInjuries],
            malus: [...this.selectedMalus],
            isValidating: isValidating,
            objectives: this.selectedScenarioObjectives.map(o => o.title)
        }

        if (!this.selectedScenarioTrainee.simulations) this.selectedScenarioTrainee.simulations = []
        this.selectedScenarioTrainee.simulations.push(simulation)
        this.selectedScenarioTrainee.simulations.sort((a,b) => new Date(b.date) - new Date(a.date))

        await this.selectedScenarioTrainee.save()

        Swal.fire({
            icon: 'success',
            title: 'Simulation épinglée',
            text: isValidating ? 'Enregistrée comme Validante' : 'Enregistrée comme Entraînement',
            showConfirmButton: false,
            timer: 1500
        })
    },

    async deleteSimulation(simulation) {
        const result = await Swal.fire({
            title: 'Supprimer ?',
            text: "Cette action est irréversible.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33'
        })

        if (result.isConfirmed) {
            const index = this.historyEmployee.simulations.indexOf(simulation)
            if (index > -1) {
                 this.historyEmployee.simulations.splice(index, 1)
                 await this.historyEmployee.save()
                 
                 Swal.fire({
                    icon: 'success',
                    title: 'Supprimée',
                    showConfirmButton: false,
                    timer: 1000
                 })
            }
        }
    },

    openHistory(employee) {
        this.historyEmployee = employee
        this.simulationHistoryDialog = true
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
                logger.log(this.userStore.profile.id, 'FORMATION', `Ajout de la formation "${this.newRequest.training}" pour ${this.newRequest.employee.name}`)
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
            const validableTrainings = ['Formation Grenouille', 'Formation Conduite']
            const isValidable = validableTrainings.includes(req.training)

            let result
            if (isValidable) {
                result = await Swal.fire({
                    title: 'Traiter la demande',
                    text: `Voulez-vous valider la formation "${req.training}" pour ${req.name} ou simplement la supprimer ?`,
                    icon: 'question',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Valider',
                    denyButtonText: 'Refuser / Supprimer',
                    cancelButtonText: 'Annuler'
                })
            } else {
                result = await Swal.fire({
                    title: 'Supprimer la demande ?',
                    text: `Voulez-vous supprimer la demande de formation "${req.training}" pour ${req.name} ?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Supprimer',
                    cancelButtonText: 'Annuler',
                    confirmButtonColor: '#d33',
                })
                if (result.isConfirmed) result = { ...result, isConfirmed: false, isDenied: true }
            }

            if (result.isDismissed) return;

            const emp = req.employeeObj
            emp.trainingRequests = emp.trainingRequests.filter(r => r !== req.training)

            if (result.isConfirmed) {
                if (!emp.validatedTrainings) emp.validatedTrainings = []
                if (!emp.validatedTrainings.includes(req.training)) {
                    emp.validatedTrainings.push(req.training)
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Formation validée',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                })
                logger.log(this.userStore.profile.id, 'FORMATION', `Validation de la formation "${req.training}" pour ${req.name}`)
            } else if (result.isDenied) {
                 Swal.fire({
                    icon: 'info',
                    title: 'Demande supprimée',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                })
                logger.log(this.userStore.profile.id, 'FORMATION', `Suppression de la formation "${req.training}" pour ${req.name}`)
            }
            await emp.save()
        } catch (e) {
            console.error(e)
        }
    },

    getRoleColor(role) {
      if (['Directeur', 'Directeur Adjoint'].includes(role)) return 'red'
      if (['Responsable de Service'].includes(role)) return 'purple'
      if (['Assistant RH'].includes(role)) return 'orange'
      if (['Résident', 'Titulaire', 'Spécialiste'].includes(role)) return 'blue'
      return 'green'
    },

    getTrainingColor(training) {
        const config = TRAININGS_CONFIG.find(t => t.title === training)
        return config ? config.color : 'primary'
    },
    getTrainingShortName(training) {
        if (training === 'Formation Grenouille') return '🐸'
        if (training === 'Formation Conduite') return '🚗'
        if (training === 'Formation Off Road') return '⛰️'
        if (training === 'Formation Médicoptère') return '🚁'
        return training
    },

    openAddTrainingDialog(employee) {
        this.selectedTrainingEmployee = employee
        this.newValidatedTraining = null
        this.addTrainingDialog = true
    },

    async saveValidatedTraining() {
        if (!this.selectedTrainingEmployee || !this.newValidatedTraining) return

        if (!this.selectedTrainingEmployee.validatedTrainings) {
            this.selectedTrainingEmployee.validatedTrainings = []
        }
        
        let needsSave = false

        if (!this.selectedTrainingEmployee.validatedTrainings.includes(this.newValidatedTraining)) {
            this.selectedTrainingEmployee.validatedTrainings.push(this.newValidatedTraining)
            needsSave = true
        }

        if (this.selectedTrainingEmployee.trainingRequests && this.selectedTrainingEmployee.trainingRequests.includes(this.newValidatedTraining)) {
            this.selectedTrainingEmployee.trainingRequests = this.selectedTrainingEmployee.trainingRequests.filter(r => r !== this.newValidatedTraining)
            needsSave = true
        }

        if (needsSave) {
            await this.selectedTrainingEmployee.save()
        }

        this.addTrainingDialog = false
        Swal.fire({
            icon: 'success',
            title: 'Formation ajoutée',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        })
    },

    async removeValidatedTraining(employee, training) {
        const result = await Swal.fire({
            title: 'Retirer la formation ?',
            text: `Voulez-vous retirer "${training}" à ${employee.name} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, retirer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33'
        })

        if (result.isConfirmed) {
            employee.validatedTrainings = employee.validatedTrainings.filter(t => t !== training)
            await employee.save()
            Swal.fire({
                icon: 'success',
                title: 'Formation retirée',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            })
        }
    },
    getNextRole(currentRole) {
        const roles = ['Interne', 'Résident', 'Titulaire', 'Spécialiste', 'Responsable de Service', 'Assistant RH', 'Directeur Adjoint', 'Directeur']
        const index = roles.indexOf(currentRole)
        if (index !== -1 && index < roles.length - 1) {
            return roles[index + 1]
        }
        return currentRole
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

            emp.rankPromotionRequest = request
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
        Swal.fire({
            title: 'Supprimer ?',
            text: `Voulez-vous supprimer la demande de ${emp.name} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    emp.rankPromotionRequest = null
                    await emp.save()
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
             if (!emp.rankPromotionRequest.votes) emp.rankPromotionRequest.votes = {}
             emp.rankPromotionRequest.votes[this.userStore.profile.id] = {
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
        this.editedGuide.steps.push({ header: '', title: '', description: '', image: '' })
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
        if (['introduction', 'qa', 'grenouille'].includes(id)) return 'green'
        if (id === 'conduite') return 'orange'
        return 'blue'
    },

    getGuideIcon(id) {
        if (id === 'grenouille') return '🐸'
        if (id === 'conduite') return '🚗'
        return 'mdi-text-box-check-outline'
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
            this.selectedTrainee.competencyProgress[compId] = null
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
             this.selectedTrainee.competencyProgress[subId] = null
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
    },

    customFilter (itemTitle, queryText, item) {
        const text = itemTitle.toLowerCase().trim()
        const query = queryText.toLowerCase().trim()
        return text.indexOf(query) > -1
    },

    openImageZoom(url) {
        this.zoomedImage = url
        this.imageZoomDialog = true
    }
  }
}
</script>
