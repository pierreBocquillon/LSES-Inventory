import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

const maintenanceMode = false

const routes = [
  {
    name: 'Accueil',
    path: '/',
    component: () => import("@/views/Home.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
  {
    name: 'Inventaire',
    path: '/inventory',
    component: () => import("@/views/Inventory.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
  {
    name: 'Commandes',
    path: '/orders',
    component: () => import("@/views/Orders.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
  {
    name: 'Notes de frais',
    path: '/expenseNotes',
    component: () => import("@/views/ExpenseNotes.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
  {
    name: 'Garage',
    path: '/garage',
    component: () => import("@/views/Garage.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
  {
    name: 'Rapport d\'autopsie',
    path: '/autopsie-reports',
    component: () => import("@/views/AutopsieReports.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['legist']
    }
  },
  {
    name: 'Nouvelle Autopsie',
    path: '/autopsie',
    component: () => import("@/views/Autopsie.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['legist']
    }
  },
  {
    name: 'Autopsie',
    path: '/autopsie/:id',
    component: () => import("@/views/Autopsie.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['legist']
    }
  },
  {
    name: 'Stocks',
    path: '/stocks',
    component: () => import("@/views/Stocks.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['stock']
    }
  },
  {
    name: 'Vehicules',
    path: '/vehicles',
    component: () => import("@/views/Vehicles.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['vehicles']
    }
  },
  {
    name: 'Utilisateurs',
    path: '/users',
    component: () => import("@/views/Users.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['user']
    }
  },
  {
    name: 'Ressources Humaines',
    path: '/rh',
    component: () => import("@/views/RH.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['rh']
    }
  },
  {
    name: 'Formation',
    path: '/training',
    component: () => import("@/views/Training.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['trainer', 'restricted_trainer']
    }
  },
  {
    name: 'Logs',
    path: '/logs',
    component: () => import("@/views/Logs.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: ['logs']
    }
  },
  {
    name: 'Connexion',
    path: '/login',
    component: () => import("@/views/Login.vue"),
    meta: {
      needAccount: false,
      showNav: false,
      permissions: []
    }
  },
  {
    name: 'Demande d\'accès',
    path: '/askAccess',
    component: () => import("@/views/AskAccess.vue"),
    meta: {
      needAccount: false,
      showNav: false,
      permissions: []
    }
  },
  {
    name: 'Maintenance',
    path: '/maintenance',
    component: () => import("@/views/Maintenance.vue"),
    meta: {
      needAccount: false,
      showNav: false,
      permissions: []
    }
  },
  {
    name: 'Rendez-vous',
    path: '/appointments',
    component: () => import("@/views/Appointments.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      permissions: []
    }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  if (maintenanceMode && to.path !== '/maintenance') {
    next('/maintenance')
  } else {
    next()
  }
})

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = 'LSES inventory - ' + to.name
  })
})

export default router
