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

export function getRoleColor(role) {
    if (['Directeur', 'Directeur Adjoint'].includes(role)) return '#e53935'
    if (['Responsable de Service'].includes(role)) return '#8e24aa'
    if (['Assistant RH'].includes(role)) return '#fb8c00'
    if (['Titulaire', 'Spécialiste'].includes(role)) return '#1ebde5'
    if (['Résident'].includes(role)) return '#1e88e5'
    if (['Temporaire'].includes(role)) return '#ffd700'
    return '#43a047'
}
