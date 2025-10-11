let navItems = [
  [
    { title: 'Accueil', icon: 'mdi-home', link: '/', roles:['User','Agent','Direction','Admin'] },
  ],
  [
    { title: 'Inventaire', icon: 'mdi-archive', link: '/inventory', roles:['User','Agent','Direction','Admin'] },
    { title: 'Commandes', icon: 'mdi-file-document', link: '/orders', roles:['User','Agent','Direction','Admin'] },
  ],
  [
    { title: 'Entreprises', icon: 'mdi-truck-delivery-outline', link: '/companies', roles:['Agent','Direction','Admin'] },
    { title: 'Stockages', icon: 'mdi-treasure-chest-outline', link: '/storage', roles:['Agent','Direction','Admin'] },
    { title: 'Items', icon: 'mdi-hamburger', link: '/items', roles:['Agent','Direction','Admin'] },
  ],
  [
    { title: 'Utilisateurs', icon: 'mdi-account-group', link: '/users', roles:['Direction','Admin'] },
    { title: 'Logs', icon: 'mdi-account-group', link: '/logs', roles:['Direction','Admin'] },
  ],
]

export default navItems