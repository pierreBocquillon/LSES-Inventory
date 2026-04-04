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
    id: 'inventory_legend',
    category: 'Inventaire',
    rarity: 'legendary',
    title: 'Employé Amazon',
    description: 'Effectuez 100 mises à jour des stocks.',
    icon: 'mdi-truck-fast',
    progress: (stats) => ({ current: Math.min(stats.inventory_updates || 0, 100), max: 100 }),
    condition: (stats) => (stats.inventory_updates || 0) >= 100
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
    id: 'recruiter_first',
    category: 'Recrutement',
    rarity: 'uncommon',
    title: 'Bienvenue chez les RH',
    description: 'Recrutez votre premier employé.',
    icon: 'mdi-account-plus',
    progress: (stats) => ({ current: Math.min(stats.employees_recruited || 0, 1), max: 1 }),
    condition: (stats) => (stats.employees_recruited || 0) >= 1
  },
  {
    id: 'recruiter_serial',
    category: 'Recrutement',
    rarity: 'epic',
    title: 'Belle perf',
    description: 'Recrutez 10 employés.',
    icon: 'mdi-account-group',
    progress: (stats) => ({ current: Math.min(stats.employees_recruited || 0, 10), max: 10 }),
    condition: (stats) => (stats.employees_recruited || 0) >= 10
  },
  {
    id: 'recruiter_legend',
    category: 'Recrutement',
    rarity: 'legendary',
    title: 'Tu vas finir par recruter le bon',
    description: 'Recrutez 25 employés.',
    icon: 'mdi-medal-outline',
    progress: (stats) => ({ current: Math.min(stats.employees_recruited || 0, 25), max: 25 }),
    condition: (stats) => (stats.employees_recruited || 0) >= 25
  },

  {
    id: 'followup_first',
    category: 'Formation',
    rarity: 'uncommon',
    title: 'Formateur attentionné',
    description: 'Mettez à jour la date de suivi d\'un médecin pour la première fois.',
    icon: 'mdi-calendar-check',
    condition: (stats) => (stats.followup_date_updated || 0) >= 1
  },
  {
    id: 'followup_regular',
    category: 'Formation',
    rarity: 'rare',
    title: 'Formateur du mois',
    description: 'Mettez à jour la date de suivi d\'un médecin 10 fois.',
    icon: 'mdi-calendar-clock',
    progress: (stats) => ({ current: Math.min(stats.followup_date_updated || 0, 10), max: 10 }),
    condition: (stats) => (stats.followup_date_updated || 0) >= 10
  },
  {
    id: 'followup_veteran',
    category: 'Formation',
    rarity: 'epic',
    title: 'Tu veux prendre ma place ou quoi ?',
    description: 'Mettez à jour la date de suivi d\'un médecin 30 fois.',
    icon: 'mdi-calendar-star',
    progress: (stats) => ({ current: Math.min(stats.followup_date_updated || 0, 30), max: 30 }),
    condition: (stats) => (stats.followup_date_updated || 0) >= 30
  },
  {
    id: 'promotion_vote_first',
    category: 'Formation',
    rarity: 'uncommon',
    title: 'J\'ai mon mot à dire',
    description: 'Donnez votre avis sur un passage de grade pour la première fois.',
    icon: 'mdi-vote',
    condition: (stats) => (stats.promotion_votes || 0) >= 1
  },
  {
    id: 'promotion_vote_regular',
    category: 'Formation',
    rarity: 'rare',
    title: 'Membre du jury',
    description: 'Donnez votre avis sur un passage de grade 10 fois.',
    icon: 'mdi-gavel',
    progress: (stats) => ({ current: Math.min(stats.promotion_votes || 0, 10), max: 10 }),
    condition: (stats) => (stats.promotion_votes || 0) >= 10
  },
  {
    id: 'promotion_vote_veteran',
    category: 'Formation',
    rarity: 'epic',
    title: 'La sentence est irrévocable',
    description: 'Donnez votre avis sur un passage de grade 25 fois.',
    icon: 'mdi-scale-balance',
    progress: (stats) => ({ current: Math.min(stats.promotion_votes || 0, 25), max: 25 }),
    condition: (stats) => (stats.promotion_votes || 0) >= 25
  },

  {
    id: 'fleet_repa_1',
    category: 'Garage',
    rarity: 'rare',
    title: 'Mécanicien du quartier',
    description: 'Effectuer une réparation complète de la flotte.',
    icon: 'mdi-wrench-check',
    progress: (stats) => ({ current: Math.min(stats.fleet_full_repairs || 0, 1), max: 1 }),
    condition: (stats) => (stats.fleet_full_repairs || 0) >= 1
  },
  {
    id: 'fleet_repa_2',
    category: 'Garage',
    rarity: 'epic',
    title: 'On a les pilotes qu\'on mérite',
    description: 'Effectuer 15 réparations complètes de la flotte.',
    icon: 'mdi-shield-car',
    progress: (stats) => ({ current: Math.min(stats.fleet_full_repairs || 0, 15), max: 15 }),
    condition: (stats) => (stats.fleet_full_repairs || 0) >= 15
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
  { key: 'employees_recruited', label: 'Employés recrutés' },
  { key: 'ideas_suggested', label: 'Idées proposées' },
  { key: 'fleet_full_repairs', label: 'Réparations Flotte Complètes' },
  { key: 'followup_date_updated', label: 'Dates de suivi mises à jour' },
  { key: 'promotion_votes', label: 'Avis sur passages de grade' },
];

export const achievementTitles = [
  { threshold: 0, label: 'Sans titre', color: 'grey-lighten-1', icon: 'mdi-account-question' },
  { threshold: 1, label: 'Novice', color: 'grey-lighten-1', icon: 'mdi-baby-face-outline' },
  { threshold: 2, label: 'Apprenti', color: 'brown-lighten-2', icon: 'mdi-scroll-outline' },
  { threshold: 4, label: 'Initié', color: 'green-accent-3', icon: 'mdi-book-open-variant' },
  { threshold: 6, label: 'Confirmé', color: 'teal-accent-3', icon: 'mdi-check-all' },
  { threshold: 9, label: 'Vétéran', color: 'blue-accent-3', icon: 'mdi-medal' },
  { threshold: 12, label: 'Expert', color: 'indigo-accent-2', icon: 'mdi-brain' },
  { threshold: 15, label: 'Maître', color: 'deep-purple-accent-2', icon: 'mdi-wizard-hat' },
  { threshold: 18, label: 'Légende', color: 'amber-accent-4', icon: 'mdi-star-circle' },
  { threshold: 22, label: 'Mythe', color: 'orange-accent-4', icon: 'mdi-fire' },
  { threshold: 26, label: 'Demi-Dieu', color: 'pink-accent-3', icon: 'mdi-lightning-bolt' },
  { threshold: 30, label: 'Dieu du LSES', color: 'red-accent-4', icon: 'mdi-crown' }
];
