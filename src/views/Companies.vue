<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Entreprises :</h3>

      <v-data-table :headers="headers" :items="companies" items-per-page="-1" no-data-text="Aucune entreprises">
        <template v-slot:bottom />

        <template v-slot:item.name="{ item }">
          <h3 class="font-weight-regular">{{ item.icon }} {{ item.name }}</h3>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="primary" variant="text" icon @click="openEditCompanyDialog(item)"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn color="error" variant="text" icon @click="deleteCompany(item)"><v-icon>mdi-delete</v-icon></v-btn>
        </template>

      </v-data-table>
      
      <div class="d-flex justify-center align-center mt-5">
        <v-btn color="accent" @click="openNewCompanyDialog">
          <h3 class="font-weight-regular">Ajouter une entreprise</h3>
        </v-btn>
      </div>

    </v-card>

    <v-dialog v-model="companyDialog" persistent  max-width="500px">
      <v-card>
        <v-card-text>
          <h3 class="mb-3">{{ currentCompany ? 'Modifier une entreprise' : 'Ajouter une entreprise' }}</h3>
          <v-text-field v-model="currentCompany.icon" label="Icone" />
          <v-text-field v-model="currentCompany.name" label="Nom" />
          <v-switch color="primary" hide-details label="Peut detruire le sang" v-model="currentCompany.canDestroy"></v-switch>
          <v-switch color="primary" hide-details label="Notes de frais" v-model="currentCompany.canExpenseNote"></v-switch>
          <div class="d-flex justify-center mt-5">
            <v-btn variant="tonal" color="primary" @click="save">Valider</v-btn>
            <v-btn variant="tonal" color="error" class="ml-3" @click="closeCompanyDialog">Annuler</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Company from '../classes/Company'

import logger from '../functions/logger'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      companies: [],
      companyDialog: false,
      currentCompany: null,
    }
  },

  mounted() {
    this.unsub.push(Company.listenAll(companies => {
      this.companies = companies
    }))
  },

  methods: {
    openNewCompanyDialog() {
      this.companyDialog = true
      this.currentCompany = Company.initOne()
    },
    openEditCompanyDialog(company) {
      this.companyDialog = true
      this.currentCompany = company
    },
    closeCompanyDialog() {
      this.companyDialog = false
    },
    async save() {
      if(this.currentCompany.id) {
        logger.log(this.userStore.profile.id, 'ENTREPRISES', `Modification de l'entreprise ${this.currentCompany.icon}${this.currentCompany.name}`)
      }else{
        logger.log(this.userStore.profile.id, 'ENTREPRISES', `Création de l'entreprise ${this.currentCompany.icon}${this.currentCompany.name}`)
      }
      await this.currentCompany.save()
      this.closeCompanyDialog()
    },
    async deleteCompany(company) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer l'entreprise "${company.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      })

      if (result.isConfirmed) {
        logger.log(this.userStore.profile.id, 'ENTREPRISES', `Suppression de l'entreprise ${company.icon}${company.name}`)
        await company.delete()
        Swal.fire(
          'Supprimé !',
          `L'entreprise "${company.name}" a bien été supprimée.`,
          'success'
        )
      }
    },
  },

  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  },
}
</script>
