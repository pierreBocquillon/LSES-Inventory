let navItems = [
  [
    { title: 'Accueil', icon: 'mdi-home', img: require('@/assets/images/nav/Home.png'), link: '/' },
  ],
  [
    { title: 'Dispatch', icon: 'mdi-radio-tower', img: require('@/assets/images/nav/Dispatch.png'), link: '/dispatch' },
  ],
  [
    { title: 'Inventaire', icon: 'mdi-archive', img: require('@/assets/images/nav/Inventory.png'), link: '/inventory' },
    { title: 'Commandes', icon: 'mdi-file-document', img: require('@/assets/images/nav/Orders.png'), link: '/orders' },
    { title: 'Notes de frais', icon: 'mdi-receipt-text-check', img: require('@/assets/images/nav/ExpenseNote.png'), link: '/expenseNotes' },
    { title: 'Garage', icon: 'mdi-ambulance', img: require('@/assets/images/nav/Garage.png'), link: '/garage' },
  ],
  [
    { title: 'Stocks', icon: 'mdi-package-variant', img: require('@/assets/images/nav/Stocks.png'), link: '/stocks' },
    { title: 'Autopsie', icon: 'mdi-coffin', img: require('@/assets/images/nav/Autopsie.png'), link: '/autopsie-reports' },
    { title: 'Ressources Humaines', icon: 'mdi-account-tie', img: require('@/assets/images/nav/Rh.png'), link: '/rh' },
    { title: 'Rendez-vous', icon: 'mdi-calendar-multiselect', img: require('@/assets/images/nav/Appointments.png'), link: '/appointments' },
  ],
  [
    { title: 'Utilisateurs', icon: 'mdi-account-group', img: require('@/assets/images/nav/Users.png'), link: '/users' },
    { title: 'Logs', icon: 'mdi-account-group', img: require('@/assets/images/nav/Logs.png'), link: '/logs' },
    { title: 'Formation', icon: 'mdi-school', img: require('@/assets/images/nav/Trainings.png'), link: '/training' },
    { title: 'Emploi du temps', icon: 'mdi-calendar-clock', img: require('@/assets/images/nav/schedule.png'), link: '/schedule' },
  ],
]

export default navItems