import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'


const routes = [
  {
    name: 'Accueil',
    path: '/',
    component:  () => import("@/views/Home.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['User','PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Inventaire',
    path: '/inventory',
    component:  () => import("@/views/Inventory.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['User','PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Commandes',
    path: '/orders',
    component:  () => import("@/views/Orders.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['User','PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Entreprises',
    path: '/companies',
    component:  () => import("@/views/Companies.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Stockage',
    path: '/storage',
    component:  () => import("@/views/Storage.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Items',
    path: '/items',
    component:  () => import("@/views/Items.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['PoleStock','Direction','Admin']
    }
  },
  {
    name: 'Utilisateurs',
    path: '/users',
    component:  () => import("@/views/Users.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['Direction','Admin']
    }
  },
  {
    name: 'Logs',
    path: '/logs',
    component:  () => import("@/views/Logs.vue"),
    meta: {
      needAccount: true,
      showNav: true,
      roles:['Direction','Admin']
    }
  },
  {
    name: 'Connexion',
    path: '/login',
    component: () => import("@/views/Login.vue"),
    meta: {
      needAccount: false,
      showNav: false,
    }
  },
  {
    name: 'Demande d\'accès',
    path: '/askAccess',
    component: () => import("@/views/AskAccess.vue"),
    meta: {
      needAccount: false,
      showNav: false,
    }
  }
]
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  next()
})

router.afterEach((to, from) => {
	nextTick(() => {
		document.title = 'LSES inventory - ' + to.name
	})
})

export default router
