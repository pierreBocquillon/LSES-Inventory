<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Logs :</h3>

      <v-data-table :headers="[{ title: 'Date', key: 'id' }, { title: 'Type', key: 'type' }, { title: 'Description', key: 'description' }]" :items="logs" items-per-page="-1" no-data-text="Aucun log">
        <template v-slot:bottom />

        <template v-slot:item.id="{ item }">
          <span class="font-weight-regular">{{ new Date(parseInt(item.id)).toLocaleString() }}</span>
        </template>
        
        <template v-slot:item.type="{ item }">
          <span class="font-weight-regular">{{ item.type }}</span>
        </template>

        <template v-slot:item.description="{ item }">
          <span class="font-weight-regular">{{ item.description }}</span>
        </template>

      </v-data-table>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Log from '../classes/Log' 

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
      logs: [],
    }
  },

  async mounted() {
    this.logs = await Log.getAll()
    this.logs.sort((a, b) => parseInt(b.id) - parseInt(a.id))
    
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500)
    }
  },
  
}
</script>
