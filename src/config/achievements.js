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
    id: 'simulation_first',
    category: 'Formation',
    rarity: 'rare',
    title: 'Mise en situation',
    description: 'Enregistrez votre première simulation.',
    icon: 'mdi-stethoscope',
    condition: (stats) => (stats.simulations_saved || 0) >= 1
  },
  {
    id: 'simulation_regular',
    category: 'Formation',
    rarity: 'epic',
    title: 'En impro totale',
    description: 'Enregistrez 10 simulations.',
    icon: 'mdi-hospital-marker',
    progress: (stats) => ({ current: Math.min(stats.simulations_saved || 0, 10), max: 10 }),
    condition: (stats) => (stats.simulations_saved || 0) >= 10
  },
  {
    id: 'simulation_veteran',
    category: 'Formation',
    rarity: 'legendary',
    title: 'Le retour de Takashi Sakamoto',
    description: 'Enregistrez 25 simulations.',
    icon: 'mdi-medical-bag',
    progress: (stats) => ({ current: Math.min(stats.simulations_saved || 0, 25), max: 25 }),
    condition: (stats) => (stats.simulations_saved || 0) >= 25
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
    id: 'order_started_first',
    category: 'Commandes',
    rarity: 'rare',
    title: 'Bon de commande',
    description: 'Débutez votre première commande.',
    icon: 'mdi-cart-plus',
    condition: (stats) => (stats.orders_started || 0) >= 1
  },
  {
    id: 'order_started_regular',
    category: 'Commandes',
    rarity: 'epic',
    title: 'Le ravitailleur',
    description: 'Débutez 15 commandes.',
    icon: 'mdi-cart-arrow-down',
    progress: (stats) => ({ current: Math.min(stats.orders_started || 0, 15), max: 15 }),
    condition: (stats) => (stats.orders_started || 0) >= 15
  },
  {
    id: 'order_started_veteran',
    category: 'Commandes',
    rarity: 'legendary',
    title: 'Collectionneur de cartons',
    description: 'Débutez 30 commandes.',
    icon: 'mdi-clipboard-list',
    progress: (stats) => ({ current: Math.min(stats.orders_started || 0, 30), max: 30 }),
    condition: (stats) => (stats.orders_started || 0) >= 30
  },

  {
    id: 'order_completed_first',
    category: 'Commandes',
    rarity: 'rare',
    title: 'Livraison acceptée',
    description: 'Terminez votre première commande.',
    icon: 'mdi-package-variant-closed-check',
    condition: (stats) => (stats.orders_completed || 0) >= 1
  },
  {
    id: 'order_completed_regular',
    category: 'Commandes',
    rarity: 'epic',
    title: 'Le collectionneur',
    description: 'Terminez 15 commandes.',
    icon: 'mdi-warehouse',
    progress: (stats) => ({ current: Math.min(stats.orders_completed || 0, 15), max: 15 }),
    condition: (stats) => (stats.orders_completed || 0) >= 15
  },
  {
    id: 'order_completed_veteran',
    category: 'Commandes',
    rarity: 'legendary',
    title: 'Expert du caddie',
    description: 'Terminez 30 commandes.',
    icon: 'mdi-truck-delivery',
    progress: (stats) => ({ current: Math.min(stats.orders_completed || 0, 30), max: 30 }),
    condition: (stats) => (stats.orders_completed || 0) >= 30
  },

  {
    id: 'dispatch_reset',
    category: 'Dispatch',
    rarity: 'epic',
    title: 'Remise à zéro',
    description: 'Réinitialisez le dispatch pour la première fois.',
    icon: 'mdi-restore',
    condition: (stats) => (stats.dispatch_resets || 0) >= 1
  },

  {
    id: 'dispatch_inter_first',
    category: 'Dispatch',
    rarity: 'common',
    title: 'Premier appel',
    description: 'Créez votre premier slot d\'intervention.',
    icon: 'mdi-ambulance',
    condition: (stats) => (stats.dispatch_interventions_created || 0) >= 1
  },
  {
    id: 'dispatch_inter_regular',
    category: 'Dispatch',
    rarity: 'rare',
    title: 'Je suis la centrale !',
    description: 'Créez 50 interventions.',
    icon: 'mdi-headset',
    progress: (stats) => ({ current: Math.min(stats.dispatch_interventions_created || 0, 50), max: 50 }),
    condition: (stats) => (stats.dispatch_interventions_created || 0) >= 50
  },
  {
    id: 'dispatch_inter_veteran',
    category: 'Dispatch',
    rarity: 'epic',
    title: 'Et avec le dispatch de crise ?',
    description: 'Créez 150 interventions.',
    icon: 'mdi-hospital-marker',
    progress: (stats) => ({ current: Math.min(stats.dispatch_interventions_created || 0, 150), max: 150 }),
    condition: (stats) => (stats.dispatch_interventions_created || 0) >= 150
  },

  {
    id: 'dispatch_astreinte_first',
    category: 'Dispatch',
    rarity: 'uncommon',
    title: 'Je me réveille !',
    description: 'Mettez vous en astreinte pour la première fois.',
    icon: 'mdi-clock-alert',
    condition: (stats) => (stats.dispatch_hs_to_astreinte || 0) >= 1
  },
  {
    id: 'dispatch_astreinte_veteran',
    category: 'Dispatch',
    rarity: 'rare',
    title: 'Au rapport !',
    description: 'Mettez vous en astreinte 20 fois.',
    icon: 'mdi-account-clock',
    progress: (stats) => ({ current: Math.min(stats.dispatch_hs_to_astreinte || 0, 20), max: 20 }),
    condition: (stats) => (stats.dispatch_hs_to_astreinte || 0) >= 20
  },

  {
    id: 'dispatch_centrale_first',
    category: 'Dispatch',
    rarity: 'rare',
    title: 'Début d\'un long périple',
    description: 'Devenez centrale pour la première fois.',
    icon: 'mdi-microphone',
    condition: (stats) => (stats.dispatch_centrale_lead || 0) >= 1
  },
  {
    id: 'dispatch_centrale_veteran',
    category: 'Dispatch',
    rarity: 'epic',
    title: 'Allô ? C\'est encore moi',
    description: 'Devenez centrale 15 fois.',
    icon: 'mdi-phone-classic',
    progress: (stats) => ({ current: Math.min(stats.dispatch_centrale_lead || 0, 15), max: 15 }),
    condition: (stats) => (stats.dispatch_centrale_lead || 0) >= 15
  },

  {
    id: 'autopsy_report_first',
    category: 'Autopsie',
    rarity: 'epic',
    title: 'Légiste en herbe',
    description: 'Générez votre premier rapport d\'autopsie en PDF.',
    icon: 'mdi-file-document-outline',
    condition: (stats) => (stats.autopsy_reports_generated || 0) >= 1
  },
  {
    id: 'autopsy_report_veteran',
    category: 'Autopsie',
    rarity: 'legendary',
    title: 'La faucheuse',
    description: 'Générez 10 rapports d\'autopsie en PDF.',
    icon: 'mdi-skull-scan-outline',
    progress: (stats) => ({ current: Math.min(stats.autopsy_reports_generated || 0, 10), max: 10 }),
    condition: (stats) => (stats.autopsy_reports_generated || 0) >= 10
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
  { key: 'simulations_saved', label: 'Simulations enregistrées' },
  { key: 'orders_started', label: 'Commandes débutées' },
  { key: 'orders_completed', label: 'Commandes terminées' },
  { key: 'promotion_votes', label: 'Avis sur passages de grade' },
  { key: 'dispatch_resets', label: 'Dispatch réinitialisés' },
  { key: 'dispatch_interventions_created', label: 'Slots d\'intervention créés' },
  { key: 'dispatch_hs_to_astreinte', label: 'Mises en astreinte (depuis HS)' },
  { key: 'dispatch_centrale_lead', label: 'Fois en tête de centrale' },
  { key: 'autopsy_reports_generated', label: 'Rapports d\'autopsie générés' },
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
