export const allCategories = [
    { value: 'en_service', label: 'En service', emoji: '🟢', icon: 'mdi-check-circle', color: '#2e7d32' },
    { value: 'astreinte', label: 'En astreinte', emoji: '⏰', icon: 'mdi-clock-alert', color: '#e65100' },
    { value: 'conges', label: 'En congés', emoji: '🏖️', icon: 'mdi-umbrella-beach', color: '#1565c0' },
    { value: 'fin_service', label: 'Fin de service', emoji: '🔴', icon: 'mdi-power', color: '#c62828' },
]

export const interventionTypes = [
    { value: 'intervention', label: 'Intervention', emoji: '🚑', color: '#c62828' },
    { value: 'primo_inter', label: 'Primo Inter', emoji: '🔥', color: '#d84315' },
    { value: 'patrouille', label: 'Patrouille', emoji: '🚔', color: '#1565c0' },
    { value: 'event', label: 'Event', emoji: '🎪', color: '#6a1b9a' },
    { value: 'rdv', label: 'Rendez-Vous', emoji: '📅', color: '#00695c' },
    { value: 'psy', label: 'Psy', emoji: '🧠', color: '#ad1457' },
    { value: 'bureau_admin', label: 'Bureau/Admin', emoji: '🖥️', color: '#37474f' },
    { value: 'formation', label: 'Formation', emoji: '📚', color: '#2e7d32' },
    { value: 'operation', label: 'Opération', emoji: '⚙️', color: '#e65100' },
]

export const returnStatuses = [
    { value: 'pat', label: 'PAT', emoji: '🦶', color: '#e65100' },
    { value: 'retour_0', label: 'Retour avec 0', emoji: '✅', color: '#2e7d32' },
    { value: 'retour_1', label: 'Retour avec 1', emoji: '🟡', color: '#f9a825' },
    { value: 'retour_2', label: 'Retour avec 2', emoji: '🟠', color: '#e65100' },
    { value: 'bennys', label: "Benny's", emoji: '🔧', color: '#1565c0' },
    { value: 'zombie', label: 'Zombie Car', emoji: '🚗', color: '#6a1b9a' },
]

export const centralRoles = [
    { value: '2e_radio', label: '2e Radio', emoji: '📻', color: '#1565c0' },
    { value: 'formateur_central', label: 'Formateur Central', emoji: '🎓', color: '#6a1b9a' },
    { value: 'avec_central', label: 'Avec Central', emoji: '👥', color: '#2e7d32' },
]

export const hospitalStatuses = [
    { value: 'gestion_normale', label: 'Gestion Normale', icon: 'mdi-hospital', color: '#2e7d32' },
    { value: 'hopital_ferme', label: 'Hôpital Fermé', icon: 'mdi-hospital-off', color: '#c62828' },
    { value: 'coups_de_feu', label: 'Coups de feu à proximité', icon: 'mdi-alert', color: '#e65100' },
]
