export const allCategories = [
    { value: 'en_service', label: 'En service', emoji: '🟢', icon: 'mdi-check-circle', color: '#2e7d32' },
    { value: 'astreinte', label: 'En astreinte', emoji: '⏰', icon: 'mdi-clock-alert', color: '#e65100' },
    { value: 'conges', label: 'En congés', emoji: '🏖️', icon: 'mdi-umbrella-beach', color: '#1565c0' },
    { value: 'fin_service', label: 'Fin de service', emoji: '🔴', icon: 'mdi-power', color: '#c62828' },
    { value: 'sans_permis', label: 'Tout PT / Sans Permis', emoji: '🚶', icon: 'mdi-walk', color: '#455a64' },
]

export const interventionTypes = [
    { value: 'intervention', label: 'Intervention', emoji: '🚑', color: '#c62828' },
    { value: 'primo_inter', label: 'Primo Inter', emoji: '🔥', color: '#d84315' },
    { value: 'patrouille', label: 'Patrouille', emoji: '🚔', color: '#1565c0' },
    { value: 'event', label: 'Event', emoji: '🎪', color: '#6a1b9a' },
    { value: 'rdv', label: 'Rendez-Vous', emoji: '📅', color: '#00695c' },
    { value: 'psy', label: 'Psy', emoji: '🧠', color: '#ad1457' },
    { value: 'otage', label: 'Banque/Bijouterie', emoji: '💰', color: '#f9a825' },
    { value: 'bureau_admin', label: 'Bureau/Admin', emoji: '🖥️', color: '#37474f' },
    { value: 'formation', label: 'Formation', emoji: '📚', color: '#2e7d32' },
    { value: 'operation', label: 'Opération', emoji: '⚙️', color: '#e65100' },
    { value: 'vm', label: 'VM', emoji: '🩺', color: '#1acb26ff' },
]

export const returnStatuses = [
    { value: 'pat', label: 'PAT', emoji: '🦶', color: '#e65100' },
    { value: 'retour_0', label: 'Retour 0', emoji: '✅', color: '#2e7d32' },
    { value: 'retour_1', label: 'Retour 1', emoji: '🟡', color: '#f9a825' },
    { value: 'retour_2', label: 'Retour 2', emoji: '🟠', color: '#e65100' },
    { value: 'retour_3', label: 'Retour 3', emoji: '🔴', color: '#c62828' },
    { value: 'bennys', label: "Benny's", emoji: '🔧', color: '#1565c0' },
    { value: 'zombie', label: 'Zombie Car', emoji: '🚗', color: '#6a1b9a' },
    { value: 'airbag', label: 'Airbaged', emoji: '🛢️', color: '#e91010' },
]

export const centralRoles = [
    { value: '2e_radio', label: '2e Radio', emoji: '📻', color: '#1565c0' },
    { value: 'formateur_central', label: 'Formateur Central', emoji: '🎓', color: '#6a1b9a' },
    { value: 'avec_central', label: 'Avec Central', emoji: '👥', color: '#2e7d32' },
]

export const hospitalStatuses = [
    { value: 'gestion_normale', label: 'Gestion Normale', icon: 'mdi-hospital', color: '#2e7d32' },
    { value: 'hopital_ferme', label: 'Hôpital Fermé', icon: 'mdi-close', color: '#c62828' },
    { value: 'coups_de_feu', label: 'Coups de feu à proximité', icon: 'mdi-alert', color: '#e65100' },
    { value: 'gestion_bagarre', label: 'Gestion bagarre', icon: 'mdi-sword', color: '#0049e6ff' },
    { value: 'gestion_fusillade', label: 'Gestion fusillade', icon: 'mdi-fire-extinguisher', color: '#e43d7dff' },
    { value: 'mode_nuit', label: 'Mode nuit', icon: 'mdi-moon-waning-crescent', color: '#6a3de4ff' },
]

export const crisisMedicalStatuses = [
    { value: 'reveil', label: 'Réveil après OP', emoji: '🥱', color: '#10b981' },
    { value: 'attente_sortie', label: 'Attente de sortie', emoji: '🚪', color: '#3b82f6' },
    { value: 'sorti', label: 'Sorti', emoji: '✅', color: '#59AD4F' },
    { value: 'en_observation', label: 'En observation', emoji: '👁️', color: '#AD4F87' },
    { value: 'degrisement', label: 'Dégrisement', emoji: '🍺', color: '#658780' },
    { value: 'attente_op', label: 'Attente d\'OP', emoji: '⏳', color: '#E36519' },
    { value: 'coma_artificiel', label: 'Coma artificiel', emoji: '💤', color: '#E62C48' },
    { value: 'equipe_nuit', label: 'Equipe de nuit / Finir soin', emoji: '🌙', color: '#263991' },
    { value: 'nuit_chambre', label: 'Nuit en chambre', emoji: '🏨', color: '#482691' },
    { value: 'inconscient', label: 'Inconscient', emoji: '😵', color: '#26BF96' },
    { value: 'autopsie', label: 'Autopsie', emoji: '🩻', color: '#808080' },
    { value: 'decede', label: 'Décédé', emoji: '⚰️', color: '#D9D9D9' },
]

export const crisisAffiliations = [
    { value: 'fdo', label: 'FDO', color: '#3b82f6' },
    { value: 'ems', label: 'EMS', color: '#ef4444' },
    { value: 'civil', label: 'Civil', color: '#858585ff' },
    { value: 'ballas', label: 'Ballas', color: '#9d10b9ff' },
    { value: 'vagos', label: 'Vagos', color: '#dfdb14ff' },
    { value: 'aztecas', label: 'Aztecas', color: '#4cb3e2ff' },
    { value: 'ghost', label: 'Ghost', color: '#ebf0f3ff' },
    { value: 'locura', label: 'Locura', color: '#22ae5aff' },
    { value: 'madz', label: 'Madz', color: '#d429b2ff' },
    { value: 'lost', label: 'Lost', color: '#b84e4e91' },
    { value: 'forsaken', label: 'Forsaken', color: '#e08312ff' },
    { value: 'autre1', label: 'Autre 1', color: '#6b7280' },
    { value: 'autre2', label: 'Autre 2', color: '#6b7280' },
]

export const crisisBeds = [
    { value: 'bed_1', label: 'Lit 1' },
    { value: 'bed_2', label: 'Lit 2' },
    { value: 'bed_3', label: 'Lit 3' },
    { value: 'bed_4', label: 'Lit 4' },
    { value: 'bed_5', label: 'Lit 5' },
    { value: 'bed_6', label: 'Lit 6' },
    { value: 'bed_7', label: 'Lit 7 (Unité X)' },
    { value: 'bed_8', label: 'Lit 8 (Unité X)' },
    { value: 'bed_9', label: 'Lit 9' },
    { value: 'op_1', label: 'OP 1' },
    { value: 'op_2', label: 'OP 2' },
    { value: 'op_3', label: 'OP 3' },
    { value: 'irm', label: 'IRM' },
    { value: 'radio', label: 'Radio' },
    { value: 'consult_1', label: 'Consulte 1' },
    { value: 'consult_2', label: 'Consulte 2' },
    { value: 'room_369', label: 'Chambre 369' },
    { value: 'room_370', label: 'Chambre 370' },
    { value: 'room_371', label: 'Chambre 371' },
    { value: 'window_bed', label: 'Lit fenetre' },
    { value: 'middle_bed', label: 'Lit milieu' },
    { value: 'door_bed', label: 'Lit porte' },
    { value: 'treatment', label: 'Salle traitement' },
]

export const crisisBedGroups = [
    {
        id: 'intensive_care',
        label: 'SOINS INTENSIFS',
        icon: '🚨',
        color: '#3b82f6',
        type: 'clockwise',
        beds: ['bed_3', 'bed_4', 'bed_5', 'bed_6', 'bed_7', 'bed_8', 'bed_9', '', 'bed_1', 'bed_2']
    },
    {
        id: 'op_room',
        label: "SALLES D'OPÉRATIONS",
        icon: '🥼',
        color: '#3b82f6',
        type: 'horizontal',
        beds: ['op_1', 'op_2', 'op_3']
    },
    {
        id: 'imaging',
        label: "IMAGERIE MÉDICALE",
        icon: '🩻',
        color: '#3b82f6',
        type: 'horizontal',
        beds: ['irm', 'radio']
    },
    {
        id: 'consultations',
        label: "SALLES DE CONSULTATIONS",
        icon: '🩺',
        color: '#3b82f6',
        type: 'horizontal',
        beds: ['consult_1', 'consult_2', 'treatment']
    },
    {
        id: 'private_rooms',
        label: "CHAMBRE INDIVIDUELLES",
        icon: '🛏️',
        color: '#3b82f6',
        type: 'horizontal',
        beds: ['room_369', 'room_370', 'room_371']
    },
    {
        id: 'common_room',
        label: "CHAMBRE COMMUNE",
        icon: '🛏️',
        color: '#3b82f6',
        type: 'horizontal',
        beds: ['window_bed', 'middle_bed', 'door_bed']
    }
]

export const morgueConfig = {
    lockerCount: 12,
    urnShelfCount: 12,
    burialSlotCount: 4,
    maxPerRow: 6,
}

export const complements = [
    { value: 'op_1', label: 'OP 1' },
    { value: 'op_2', label: 'OP 2' },
    { value: 'op_3', label: 'OP 3' },
    { value: 'consult_1', label: 'Consulte 1' },
    { value: 'consult_2', label: 'Consulte 2' },
    { value: 'intensive_care', label: 'Soins Intensifs' },
    { value: 'radio', label: 'Radio' },
    { value: 'irm', label: 'IRM' },
    { value: 'bces', label: 'BCES' },
    { value: 'lspd', label: 'LSPD' },
    { value: 'bcso', label: 'BCSO' },
    { value: 'lsas', label: 'LSAS' },
    { value: 'town_hall_south', label: 'Mairie sud' },
    { value: 'town_hall_north', label: 'Mairie nord' },
    { value: 'helicopter', label: 'FLAP-FLAP' },
]
