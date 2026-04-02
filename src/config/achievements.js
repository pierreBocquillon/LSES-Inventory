import { roleOrder } from '@/config/roles';

const hasRoleRank = (employee, minRole) => {
  if (!employee || !employee.role) return false;
  const userRank = roleOrder.indexOf(employee.role);
  const targetRank = roleOrder.indexOf(minRole);

  return userRank !== -1 && targetRank !== -1 && userRank <= targetRank;
};

export const achievementList = [
  {
    id: 'welcome',
    category: 'Général',
    rarity: 'common',
    title: 'Bienvenue !',
    description: 'Se connecter pour la première fois.',
    icon: 'mdi-hand-wave',
    condition: (stats) => true
  },
  {
    id: 'rank_interne',
    category: 'Général',
    rarity: 'common',
    title: 'Sur la bonne voie',
    description: 'Atteignez le grade d\'Interne.',
    icon: 'mdi-account-school',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Interne')
  },
  {
    id: 'rank_resident',
    category: 'Général',
    rarity: 'uncommon',
    title: 'Un grand Piou-Piou',
    description: 'Atteignez le grade de Résident.',
    icon: 'mdi-chevron-up',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Résident')
  },
  {
    id: 'rank_titulaire',
    category: 'Général',
    rarity: 'rare',
    title: 'Et après ?',
    description: 'Atteignez le grade de Titulaire.',
    icon: 'mdi-chevron-double-up',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Titulaire')
  },
  {
    id: 'rank_specialiste',
    category: 'Général',
    rarity: 'epic',
    title: 'T\'es pas là pour glander toi !',
    description: 'Atteignez le grade de Spécialiste.',
    icon: 'mdi-chevron-triple-up',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Spécialiste')
  },
  {
    id: 'rank_management',
    category: 'Général',
    rarity: 'legendary',
    title: 'Les clés du service',
    description: 'Atteignez le grade de Responsable de Service ou Assistant RH.',
    icon: 'mdi-briefcase-check',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Responsable de Service')
  },
  {
    id: 'rank_direction',
    category: 'Général',
    rarity: 'mythic',
    title: 'La loi c\'est moi et l\'ordre !',
    description: 'Atteignez le grade de Directeur Adjoint ou Directeur.',
    icon: 'mdi-crown',
    condition: (stats, profile, employee) => hasRoleRank(employee, 'Directeur Adjoint')
  },

  {
    id: 'inventory_first_update',
    category: 'Inventaire',
    rarity: 'uncommon',
    title: 'Magasinier',
    description: 'Effectuez votre première mise à jour des stocks.',
    icon: 'mdi-package-variant-closed',
    condition: (stats) => (stats.inventory_updates || 0) >= 1
  },
  {
    id: 'inventory_veteran',
    category: 'Inventaire',
    rarity: 'epic',
    title: 'Expert du frigo',
    description: 'Effectuez 50 mises à jour des stocks.',
    icon: 'mdi-forklift',
    progress: (stats) => ({ current: Math.min(stats.inventory_updates || 0, 50), max: 50 }),
    condition: (stats) => (stats.inventory_updates || 0) >= 50
  },

  {
    id: 'candidature_first_created',
    category: 'Recrutement',
    rarity: 'rare',
    title: 'Premier pas chez nous',
    description: 'Remplissez une candidature.',
    icon: 'mdi-file-document-edit',
    condition: (stats) => (stats.applications_created || 0) >= 1
  },
  {
    id: 'candidature_created',
    category: 'Recrutement',
    rarity: 'epic',
    title: 'Pilier du recrutement',
    description: 'Remplissez 5 candidatures.',
    icon: 'mdi-file-document-multiple',
    progress: (stats) => ({ current: Math.min(stats.applications_created || 0, 5), max: 5 }),
    condition: (stats) => (stats.applications_created || 0) >= 5
  },
  {
    id: 'candidature_veteran',
    category: 'Recrutement',
    rarity: 'legendary',
    title: 'Recrutez les tous !',
    description: 'Remplissez 15 candidatures.',
    icon: 'mdi-account-tie',
    progress: (stats) => ({ current: Math.min(stats.applications_created || 0, 15), max: 15 }),
    condition: (stats) => (stats.applications_created || 0) >= 15
  },

  {
    id: 'secret_achievement',
    category: 'Secret',
    rarity: 'mythic',
    secret: true,
    title: 'Le Maître des mystères',
    hint: 'Nathan doit surement savoir comment l\'obtenir...',
    description: 'Vous avez résolu l\'énigme secrète.',
    icon: 'mdi-skull-crossbones',
    condition: () => false
  },
  {
    id: 'idea_suggested',
    category: 'Secret',
    rarity: 'epic',
    title: 'Une idée intéressante',
    description: 'Proposez une idée à Nathan et qu\'elle soit implémentée.',
    icon: 'mdi-lightbulb',
    progress: (stats) => ({ current: Math.min(stats.ideas_suggested || 0, 1), max: 1 }),
    condition: (stats) => (stats.ideas_suggested || 0) >= 1
  },
  {
    id: 'idea_suggester',
    category: 'Secret',
    rarity: 'legendary',
    title: 'Un esprit novateur',
    description: 'Proposez 5 idées à Nathan et qu\'elles soient toutes implémentées.',
    icon: 'mdi-lightbulb-on',
    progress: (stats) => ({ current: Math.min(stats.ideas_suggested || 0, 5), max: 5 }),
    condition: (stats) => (stats.ideas_suggested || 0) >= 5
  }
];

export const commonStats = [
  { key: 'inventory_updates', label: 'Mises à jour de l\'inventaire' },
  { key: 'applications_created', label: 'Candidatures rédigées' },
  { key: 'ideas_suggested', label: 'Idées proposées' },
];
