<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Suivi Formation</h1>
      <v-spacer></v-spacer>
    </div>

    <v-card class="flex-grow-1">
      <v-data-table
        :headers="headers"
        :items="trainees"
        :search="search"
        class="h-100"
        :sort-by="[{ key: 'role', order: 'desc' }]"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="blue" v-if="item.sex === 'Homme'" class="mr-2">mdi-gender-male</v-icon>
            <v-icon color="pink" v-else-if="item.sex === 'Femme'" class="mr-2">mdi-gender-female</v-icon>
            <v-icon v-else class="mr-2">mdi-account</v-icon>
            {{ item.name }}
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
          >
            {{ item.role }}
          </v-chip>
        </template>
        
        <template v-slot:item.arrivalDate="{ item }">
            {{ formatDate(item.arrivalDate) }}
        </template>

        <template v-slot:item.daysAtGrade="{ item }">
            {{ calculateDays(item.lastPromotionDate) }} jours
        </template>

      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import Employee from '@/classes/Employee'

export default {
  name: 'Training',
  data: () => ({
    search: '',
    employees: [],
    unsub: [],
    headers: [
      { title: 'Nom', key: 'name' },
      { title: 'Grade', key: 'role' },
      { title: 'Date d\'arrivée', key: 'arrivalDate' },
      { title: 'Jours au grade', key: 'daysAtGrade', sortable: false },
    ],
  }),

  computed: {
    trainees() {
      return this.employees.filter(e => ['Interne', 'Résident'].includes(e.role))
    }
  },

  mounted() {
    this.unsub.push(Employee.listenAll((employees) => {
      this.employees = employees
    }))
  },

  beforeUnmount() {
    this.unsub.forEach(u => {
      if (typeof u === 'function') u()
    })
  },

  methods: {
    getRoleColor(role) {
      if (['Résident'].includes(role)) return 'blue'
      return 'green'
    },
    
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },

    calculateDays(dateString) {
       if (!dateString) return '?'

       const oneDay = 24 * 60 * 60 * 1000
       const firstDate = new Date(dateString + 'T00:00:00')
       const secondDate = new Date()
       secondDate.setHours(0, 0, 0, 0)
       
       return Math.round(Math.abs((firstDate - secondDate) / oneDay))
    },
  }
}
</script>
