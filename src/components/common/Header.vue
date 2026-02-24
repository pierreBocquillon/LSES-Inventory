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

import { initNotifManager, stopNotifManager, notifState, storagesOutdated, garageNotif, alerts, rhNotif } from '@/functions/nofifManager.js'

import logger from '../../functions/logger'
import Employee from '@/classes/Employee.js'
import Specialty from '@/classes/Specialty.js'

export default {
  data() {
    return {
      auth : getAuth(),
      userStore: useUserStore(),
      navItems,
      resetPasswordDialog: false,
      oldPassword: '',
      newPasswordA: '',
      newPasswordB: '',
      employees: [],
      specialties: [],
      unsubEmployee: null,
      unsubSpecialties: null,
    }
  },
  mounted() {
    this.unsubEmployee = Employee.listenAll(data => {
      this.employees = data
    })
    this.unsubSpecialties = Specialty.listenAll(data => {
      this.specialties = data
    })
  },
  created() {
    initNotifManager()
  },
  computed: {
    storagesOutdated() {
      return storagesOutdated.value
    },
    garageNotif() {
      return garageNotif.value
    },
    alerts() {
      return alerts.value
    },
    rhNotif() {
        return rhNotif.value
    },
    waitingUsers() {
      return notifState.waitingUsers
    },
    waitingExpenseNotes() {
      return notifState.waitingExpenseNotes
    },
    orders() {
      return notifState.orders
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

          if (tmp_item.link == '/appointments' && hasAccess && (!userPerms || !userPerms.some(p => ['dev', 'admin'].includes(p)))) {
            const currentEmployee = this.employees.find(e => e.name === this.userStore.profile?.name)
            if (currentEmployee && ['Directeur', 'Directeur Adjoint'].includes(currentEmployee.role)) {
              // Access granted
            } else if (currentEmployee && currentEmployee.specialties) {
              const hasAuthSpecialty = currentEmployee.specialties.some(s => {
                 const spec = this.specialties.find(sp => sp.value === s || sp.name === s)
                 return spec && spec.canTakeAppointments
              })
              if (!hasAuthSpecialty) hasAccess = false
            } else {
              hasAccess = false
            }
          }

          if(hasAccess && tmp_item.link != this.$route.path) {
            if(tmp_item.link == '/users') {
              tmp_item.notif = this.waitingUsers.length
            }
            if(tmp_item.link == '/expenseNotes') {
              tmp_item.notif = this.waitingExpenseNotes.length
            }
            if(tmp_item.link == '/orders') {
              tmp_item.notif = this.orders.length + this.alerts.length
            }
            if(tmp_item.link == '/inventory') {
              tmp_item.notif = this.storagesOutdated
            }
            if(tmp_item.link == '/garage') {
              tmp_item.notif = this.garageNotif
            }
            if(tmp_item.link == '/rh') {
              tmp_item.notif = this.rhNotif
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
    logout() {
      signOut(getAuth()).then(() => {
        this.$router.push('/login');
      }).catch(error => {
        console.error("Error signing out: ", error);
      });
    }
  },
  beforeUnmount() {
    stopNotifManager()
    if (this.unsubEmployee) this.unsubEmployee()
    if (this.unsubSpecialties) this.unsubSpecialties()
  },
}
</script>