export const roleOrder = [
    'Directeur',
    'Directeur Adjoint',
    'Assistant RH',
    'Responsable de Service',
    'Spécialiste',
    'Titulaire',
    'Résident',
    'Interne',
    'Temporaire'
]

const ROLES_CONFIG = {
    'Directeur': { color: '#e53935', name: 'red' },
    'Directeur Adjoint': { color: '#e53935', name: 'red' },
    'Responsable de Service': { color: '#8e24aa', name: 'purple' },
    'Assistant RH': { color: '#fb8c00', name: 'orange' },
    'Spécialiste': { color: '#1ebde5', name: 'cyan' },
    'Titulaire': { color: '#1ebde5', name: 'cyan' },
    'Résident': { color: '#1e88e5', name: 'blue' },
    'Interne': { color: '#43a047', name: 'green' },
    'Temporaire': { color: '#ffd700', name: 'amber' }
}

export function getRoleColor(role) {
    return ROLES_CONFIG[role]?.color || '#43a047'
}

export function getRoleColorName(role) {
    return ROLES_CONFIG[role]?.name || 'green'
}
