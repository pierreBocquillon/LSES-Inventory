<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Logs :</h3>

      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title collapse-icon="mdi-minus" expand-icon="mdi-plus">
            <template v-slot:actions="{ expanded }">
              <v-icon color="primary" :icon="expanded ? 'mdi-minus' : 'mdi-plus'"></v-icon>
            </template>

            <h4 class="text-primary">
              <span>Filtres</span>
            </h4>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select color="primary" base-color="primary" variant="outlined" hide-details="boolean" :items="profiles" v-model="filter.profile" item-value="id" label="Utilisateur" clearable>
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :title="null">
                  <template #default>
                    {{ item.raw.name }}
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item, index }">
                {{ item.raw.name }}
              </template>
            </v-select>
          </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>

      <v-data-table :headers="[{ title: 'Date', key: 'id' }, { title: 'Utilisateur', key: 'user' }, { title: 'Type', key: 'type' }, { title: 'Description', key: 'description' }, { title: '', key: 'action', sortable: false }]" :items="filteredLogs" items-per-page="-1" no-data-text="Aucun log">
        <template v-slot:bottom />

        <template v-slot:item.id="{ item }">
          <span class="font-weight-regular">{{ new Date(parseInt(item.id)).toLocaleString() }}</span>
        </template>
        
        <template v-slot:item.user="{ item }">
          <span class="font-weight-regular">{{ profiles.find(profile => profile.id === item.user)?.name || 'Utilisateur supprimé' }}</span>
        </template>
        
        <template v-slot:item.type="{ item }">
          <span class="font-weight-regular">{{ item.type }}</span>
        </template>

        <template v-slot:item.description="{ item }">
          <span class="font-weight-regular">{{ item.description }}</span>
        </template>

        <template v-slot:item.action="{ item }">
          <v-btn color="error" variant="text" icon @click="deleteLog(item)" v-if="userStore.profile.permissions.includes('dev')">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>

      </v-data-table>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Log from '../classes/Log'
import Profile from '@/classes/Profile.js'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      logs: [],
      profiles: [],
      filter: {
        profile: null,
      },
    }
  },
  computed: {
    filteredLogs() {
      let filtered = this.logs

      if (this.filter.profile) {
        filtered = filtered.filter(log => log.user == this.filter.profile)
      }

      return filtered
    },
  },
  async mounted() {
    this.profiles = await Profile.getAll()
    this.profiles.sort((a, b) => a.name.localeCompare(b.name))
    this.getLogs()
  },
  methods: {
    async getLogs() {
      this.logs = await Log.getAll()
      this.logs.sort((a, b) => parseInt(b.id) - parseInt(a.id))
      
      if (this.logs.length > 500) {
        this.logs = this.logs.slice(0, 500)
      }
    },
    async deleteLog(log) {
      await log.delete()
      this.getLogs()
    },
  },
  
}
</script>
