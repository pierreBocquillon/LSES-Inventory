<template>
  <v-app-bar app color="surface" dark class="header">
    <h1 class="d-flex align-center pointer" @click="$router.push('/')">
      <img :src="require('@/assets/images/logo.png')" height="52" />
      <span class="ml-2 text-h5 text-primary">LSES Inventory</span>
    </h1>
    <v-spacer></v-spacer>
    <div>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon variant="plain" v-bind="props">
            <v-icon size="32">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list style="min-width:250px">
          <template v-for="group in filteredNavItems">
            <template v-for="item in group">
              <v-list-item @click="$router.push(item.link)">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">{{ item.icon }}</v-icon>
                  <h3 class="font-weight-regular">{{ item.title }}</h3>
                  <v-badge color="primary" v-if="item.notif > 0" :content="item.notif" inline offset-x="-5"></v-badge>
                </div>
              </v-list-item>
            </template>
            <v-divider color="white" class="my-2 border-opacity-75" thickness="1"></v-divider>
          </template>

          <v-list-item @click="openResetPasswordDialog">
            <div class="d-flex align-center">
              <v-icon color="warning" class="mr-2">mdi-lock-reset</v-icon>
              <h3 class="font-weight-regular text-warning">Changer de mot de passe</h3>
            </div>
          </v-list-item>

          <v-list-item @click="logout">
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-logout</v-icon>
              <h3 class="font-weight-regular text-error">Se déconnecter</h3>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
  <v-dialog v-model="resetPasswordDialog" max-width="500">
    <v-card>
      <v-card-text>
        <h1 class="text-primary text-center">Changer de mot de passe</h1>
        <v-text-field label="Ancien mot de passe" type="password" v-model="oldPassword"></v-text-field>
        <v-text-field label="Nouveau mot de passe" type="password" v-model="newPasswordA"></v-text-field>
        <v-text-field label="Confirmer le nouveau mot de passe" type="password" v-model="newPasswordB"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="resetPassword">Changer</v-btn>
        <v-btn text @click="closeResetPasswordDialog">Annuler</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { getAuth, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential} from "firebase/auth"
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import navItems from '@/config/navItems.js'

import Profile from '@/classes/Profile.js'
import Company from '@/classes/Company.js'
import Item from '@/classes/Item.js'
import Order from '@/classes/Order.js'
import Storage from '@/classes/Storage.js'
import SaveDate from '@/classes/SaveDate.js'

import logger from '../../functions/logger'

export default {
  data() {
    return {
      auth : getAuth(),
      userStore: useUserStore(),
      navItems,
      unsub: [],
      waitingUsers: [],
      companies: [],
      items: [],
      orders: [],
      storages: [],
      saveDates: [],
      resetPasswordDialog: false,
      oldPassword: '',
      newPasswordA: '',
      newPasswordB: '',
    }
  },
  created() {
    this.unsub.push(Profile.listenByActivated(false, users => {
      this.waitingUsers = users.filter(user => !user.rejected)
    }))
    this.unsub.push(SaveDate.listenAll(dates => {
      this.saveDates = {}
      dates.forEach(date => {
        this.saveDates[date.id] = date
      })
    }))
    this.unsub.push(Storage.listenAll(storages => {
      this.storages = storages
      this.storages.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
      this.companies.sort((a, b) => a.name.localeCompare(b.name))
    }))
    this.unsub.push(Item.listenAll(items => {
      this.items = items
      this.items.sort((a, b) => a.id.localeCompare(b.id))
    }))
    this.unsub.push(Order.listenAll(orders => {
      this.orders = orders
    }))
  },
  computed: {
    storageDeltaTime(){
      let deltaTime = {}
      for(let storage of this.storages){
        if(this.saveDates[storage.id] == undefined){
          deltaTime[storage.id] = 9999
        }
        if(this.saveDates[storage.id]){
          deltaTime[storage.id] = (new Date().getTime() - new Date(this.saveDates[storage.id].date).getTime()) / (1000 * 60 * 60)
        }
      }
      return deltaTime
    },
    StoragesOutdated(){
      let amount = 0
      for(let storage of this.storages){
        if(this.storageDeltaTime[storage.id] >= 12){
          amount += 1
        }
      }
      return amount
    },
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for(let group of this.navItems) {
        for(let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []
          tmp_item.notif = 0

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if(itemRoute && itemRoute.meta && itemRoute.meta.permissions){
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if(tmp_item.permissions.length <= 0) hasAccess = true
          else if(userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if(userPerms && tmp_item.permissions.every(p => userPerms.includes(p))) hasAccess = true

          if(hasAccess && tmp_item.link != this.$route.path) {
            if(tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if(tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if(tmp_item.link == '/inventory') {
              tmp_item.notif = this.StoragesOutdated
            }
            currentGroup.push(tmp_item)
          }
        }
        if(currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    },
    alerts() {
      let alerts = {}
      this.companies.forEach(comp => {
        alerts[comp.id] = {
          company: comp,
          items: [],
          maxAlertLevel: 0,
          totalAlertLevel: 0,
          totalItemCount: 0,
          totalWeight: 0,
        }
      })
      this.items.forEach(item => {
        let tmp_alert = {
          item: item,
          info: this.getItemInfo(item),
          orderNeeded: 0,  
          alertLevel: 0,          
        }

        let threshold = 10
        if(parseInt(item.wanted) <= 10) threshold = 1
        if(parseInt(item.amount) <= 50) threshold = 5

        if(parseInt(item.wanted) > 0 && parseInt(item.amount) < parseInt(item.wanted) && (!item.isSecure || this.userStore.profile.permissions.some(p => ['dev', 'admin', 'security'].includes(p)))) {
          if(parseInt(item.amount) <= parseInt(item.wanted) * 0.25){
            tmp_alert.alertLevel = 2
          }else if(parseInt(item.amount) <= parseInt(item.wanted) * 0.5){
            tmp_alert.alertLevel = 1
          }else{
            tmp_alert.alertLevel = 0
          }

          tmp_alert.orderNeeded = Math.ceil((parseInt(item.wanted) - parseInt(item.amount)) / threshold) * threshold
          if(tmp_alert.orderNeeded > 0){
            alerts[tmp_alert.info.seller].items.push(tmp_alert)
            
            alerts[tmp_alert.info.seller].maxAlertLevel = Math.max(alerts[tmp_alert.info.seller].maxAlertLevel, tmp_alert.alertLevel)
            alerts[tmp_alert.info.seller].totalAlertLevel += tmp_alert.alertLevel
            alerts[tmp_alert.info.seller].totalItemCount += tmp_alert.orderNeeded
            alerts[tmp_alert.info.seller].totalWeight += tmp_alert.orderNeeded * tmp_alert.info.weight
          }
        }
      })
      alerts = Object.values(alerts)//.filter(comp => comp.totalAlertLevel > 0)
      alerts.sort((a, b) => {
        if (b.maxAlertLevel == a.maxAlertLevel) {
          return b.totalWeight - a.totalWeight
        }else{
          return b.maxAlertLevel - a.maxAlertLevel
        }
      })
      alerts = alerts.filter(comp => comp.maxAlertLevel > 0)
      return alerts
    },
  },
  methods: {
    openResetPasswordDialog() {
      this.resetPasswordDialog = true
      this.oldPassword = ''
      this.newPasswordA = ''
      this.newPasswordB = ''
    },
    closeResetPasswordDialog() {
      this.resetPasswordDialog = false
    },
    async resetPassword() {
      const user = this.auth.currentUser

      if(this.newPasswordA !== this.newPasswordB) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Les nouveaux mots de passe ne correspondent pas.",
          timer: 2000,
        })
        return
      }

      try {
        const credential = EmailAuthProvider.credential(user.email, this.oldPassword)
        await reauthenticateWithCredential(user, credential)
      } catch (error) {
        if (error.code == 'auth/wrong-password' || error.code == 'auth/invalid-login-credentials') {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "L'ancien mot de passe est incorrect.",
            timer: 2000,
          })
          return
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: error.code || "Une erreur est survenue. Merci de réessayer dans quelques minutes.",
            timer: 2000,
          })
          return
        }
      }

      try {
        logger.log(this.userStore.profile.id, 'PASSWORD', `Changement de mot de passe`)
        await updatePassword(user, this.newPasswordA)

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: "Le mot de passe a été mis à jour avec succès.",
          timer: 2000,
        }).then(() => {
          this.closeResetPasswordDialog()
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || "Une erreur est survenue lors de la mise à jour du mot de passe.",
          timer: 2000,
        })
      }
    },
    
    getItemInfo(item) {
      if(item.id.includes('#')) {
        let id = item.id.split('#')[0]
        let info = this.items.find(i => i.id === id) || {}
        if(info) {
          info = JSON.parse(JSON.stringify(info))
          info.alert = false

          info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
          info.name = info.name + ' ' + item.id.split('#')[1]

          info.old = false
          if(new Date(item.id.split('#')[1]) < new Date().setDate(new Date().getDate())) {
            info.old = true
          }

          info.sellerName = this.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
          return info
        }
      }else{
        let info = this.items.find(i => i.id === item.id) || {}
        info.alert = false
        info.old = false
        info.trueName = info.name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
        info.sellerName = this.companies.find(c => c.id === info.seller)?.name || 'Inconnu'
        return info
      }
    },
    logout() {
      signOut(getAuth()).then(() => {
        this.$router.push('/login');
      }).catch(error => {
        console.error("Error signing out: ", error);
      });
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub()
    })
  },
}
</script>