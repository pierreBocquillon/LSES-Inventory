let permissions = [
  {
    icon: '📦',
    name: 'Gestion des stocks',
    value: 'stock'
  },
  {
    icon: '🔐',
    name: 'Stocks sensibles',
    value: 'security'
  },
  {
    icon: '🚑',
    name: 'Gestion des vehicules',
    value: 'vehicles'
  },
  {
    icon: '⚰️',
    name: 'Médecine légale',
    value: 'legist'
  },
  {
    icon: '😊',
    name: 'Gestion des utilisateurs',
    value: 'user'
  },
  {
    icon: '💵',
    name: 'Gestion de la trésorerie',
    value: 'cash'
  },
  {
    icon: '💾',
    name: 'Gestion des logs',
    value: 'logs'
  },
  {
    icon: '🎓',
    name: 'Formation',
    value: 'trainer'
  },
  {
    icon: '🚁',
    name: 'Formateur Off-Road/Médicoptère',
    value: 'restricted_trainer'
  },
  {
    icon: '👔',
    name: 'Ressources Humaines',
    value: 'rh'
  },
  {
    icon: '💻',
    name: 'Développeur',
    value: 'dev'
  },
  {
    icon: '⚕️',
    name: 'Ordre des médecins',
    value: 'admin'
  },
]

for (let perm of permissions) {
  perm.fullname = `${perm.icon} ${perm.name}`
}

export default permissions