<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Rapports Autopsie :</h3>

      <div class="mt-4">
        <div class="d-flex align-center mb-4">
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="Rechercher" single-line hide-details
            variant="outlined" density="compact"></v-text-field>
          <v-btn class="ml-4" color="cyan" variant="tonal" prepend-icon="mdi-plus" @click="$router.push('/autopsie')">
            Nouvelle autopsie
          </v-btn>
        </div>

        <v-data-table :headers="headers" :items="reports" :search="search" class="elevation-1"
          :sort-by="[{ key: 'autopsyDate', order: 'desc' }]">
          <template v-slot:item.autopsyDate="{ item }">
            {{ new Date(item.autopsyDate).toLocaleDateString('fr-FR') }} {{ new
              Date(item.autopsyDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex">
              <v-btn color="cyan" variant="text" icon="mdi-pencil" @click="viewReport(item)"
                title="Consulter"></v-btn>
              <v-btn color="orange" variant="text" icon="mdi-download" @click="downloadPdf(item)"
                title="Télécharger"></v-btn>
              <v-btn color="red" variant="text" icon="mdi-delete" @click="deleteReport(item)" title="Supprimer"></v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Autopsie from '../classes/Autopsie.js'
import { generateReport } from '../functions/autopsieManager'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      search: '',
      reports: [],
      headers: [
        { title: 'Date', key: 'autopsyDate', align: 'start' },
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'CID', key: 'cid', align: 'start' },
        { title: 'Médecin intervenant', key: 'doctor', align: 'start' },
        { title: 'Médecin légiste', key: 'legist', align: 'start' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
    }
  },

  mounted() {
    const unsub = Autopsie.listenAll((list) => {
      this.reports = list.sort((a, b) => b.autopsyDate - a.autopsyDate)
    })
    this.unsub.push(unsub)
  },

  methods: {
    viewReport(item) {
      // Assuming route is /autopsie/:id
      this.$router.push({ name: 'Autopsie', params: { id: item.id } })
    },
    async downloadPdf(item) {
      const data = {
        ...item,
        colors: ['orange', 'pink', 'indigo', 'green', 'red', 'cyan']
      }
      await generateReport(data)
    },
    async deleteReport(item) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Vous ne pourrez pas revenir en arrière !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
      })

      if (result.isConfirmed) {
        try {
          await item.delete()
          Swal.fire(
            'Supprimé !',
            'Le rapport a été supprimé.',
            'success'
          )
        } catch (error) {
          console.error(error)
          Swal.fire(
            'Erreur',
            'Une erreur est survenue lors de la suppression.',
            'error'
          )
        }
      }
    }
  },

  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  }
}
</script>
