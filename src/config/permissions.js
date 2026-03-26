let permissions = [
  {
    icon: '🛡️',
    name: 'LSES',
    value: 'lses'
  },
  {
    icon: '📦',
    name: 'Gestion des stocks',
    value: 'stock',
    linkable: true
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
    value: 'legist',
    linkable: true
  },
  {
    icon: '😊',
    name: 'Gestion des utilisateurs',
    value: 'user',
  },
  {
    icon: '💵',
    name: 'Gestion de la trésorerie',
    value: 'cash',
  },
  {
    icon: '💾',
    name: 'Gestion des logs',
    value: 'logs',
  },
  {
    icon: '🎓',
    name: 'Formation',
    value: 'trainer',
    linkable: true
  },
  {
    icon: '🚁',
    name: 'Formateur Off-Road/Médicoptère',
    value: 'restricted_trainer',
    linkable: true
  },
  {
    icon: '👔',
    name: 'Ressources Humaines',
    value: 'rh',
    linkable: true
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