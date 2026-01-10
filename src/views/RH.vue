<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Ressources Humaines</h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Ajouter un employé
      </v-btn>
    </div>

    <v-card class="flex-grow-1">
      <v-data-table
        :headers="headers"
        :items="employees"
        :search="search"
        class="h-100"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="blue" v-if="item.sex === 'Homme'" class="mr-2">mdi-gender-male</v-icon>
            <v-icon color="pink" v-else-if="item.sex === 'Femme'" class="mr-2">mdi-gender-female</v-icon>
            <v-icon v-else class="mr-2">mdi-account</v-icon>
            {{ item.name }}
          </div>
        </template>
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Liste des employés</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Rechercher"
              single-line
              hide-details
              density="compact"
              class="mr-4"
              style="max-width: 300px"
            ></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
          >
            {{ item.role }}
          </v-chip>
        </template>

        <template v-slot:item.specialties="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="spec in item.specialties"
              :key="spec"
              size="x-small"
              class="mr-1 mb-1"
              :color="item.chiefSpecialty === spec ? 'amber-darken-3' : undefined"
              :variant="item.chiefSpecialty === spec ? 'flat' : 'tonal'"
            >
              <v-icon v-if="item.chiefSpecialty === spec" start size="x-small">mdi-crown</v-icon>
              {{ getSpecialtyIcon(spec) }} {{ getSpecialtyName(spec) }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon variant="text" size="small" color="primary" @click="editEmployee(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" color="error" @click="deleteEmployee(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Nom complet"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.sex"
                  :items="['Homme', 'Femme']"
                  label="Sexe"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  label="Email"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.phone"
                  label="Téléphone"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.role"
                  :items="['Interne', 'Résident', 'Titulaire', 'Spécialiste', 'Responsable de Service', 'Assistant RH', 'Directeur Adjoint', 'Directeur']"
                  label="Rôle"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                 <v-select
                  v-model="editedItem.specialties"
                  :items="specialties"
                  item-title="name"
                  item-value="value"
                  label="Spécialités"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :prepend-icon="null">
                      <template v-slot:prepend>
                        <span class="mr-2">{{ item.raw.icon }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <v-chip size="small">
                      <span class="mr-2">{{ item.raw.icon }}</span>
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" v-if="editedItem.specialties && editedItem.specialties.length > 0">
                <v-select
                  v-model="editedItem.chiefSpecialty"
                  :items="getAvailableChiefSpecialties()"
                  item-title="name"
                  item-value="value"
                  label="Spécialité Admin"
                  variant="outlined"
                  clearable
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">
            Annuler
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save">
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Employee from '@/classes/Employee.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import specialties from '@/config/specialties.js'

export default {
  name: 'RH',
  data: () => ({
    dialog: false,
    search: '',
    specialties: specialties,
    headers: [
      { title: 'Nom', key: 'name' },
      { title: 'Email', key: 'email' },
      { title: 'Téléphone', key: 'phone' },
      { title: 'Rôle', key: 'role' },
      { title: 'Spécialités', key: 'specialties' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ],
    employees: [],
    editedItem: {
      name: '',
      email: '',
      phone: '',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialty: null,
    },
    defaultItem: {
      name: '',
      email: '',
      phone: '',
      role: 'Interne',
      sex: 'Homme',
      specialties: [],
      chiefSpecialty: null,
    },
    unsub: [],
  }),

  computed: {
    formTitle() {
      return this.editedItem.id ? 'Modifier l\'employé' : 'Nouvel employé'
    },
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
      if (['Directeur', 'Directeur Adjoint'].includes(role)) return 'red'
      if (['Responsable de Service', 'Assistant RH'].includes(role)) return 'orange'
      if (['Titulaire', 'Spécialiste'].includes(role)) return 'blue'
      return 'green'
    },

    getSpecialtyIcon(value) {
      const spec = this.specialties.find(s => s.value === value)
      return spec ? spec.icon : ''
    },

    getSpecialtyName(value) {
      const spec = this.specialties.find(s => s.value === value)
      return spec ? spec.name : value
    },

    getAvailableChiefSpecialties() {
      if (!this.editedItem.specialties) return []
      return this.specialties.filter(s => this.editedItem.specialties.includes(s.value))
    },

    openAddDialog() {
      this.editedItem = Object.assign({}, this.defaultItem)
      this.dialog = true
    },

    editEmployee(item) {
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    close() {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
      })
    },

    async save() {
      if (!this.editedItem.name || !this.editedItem.email) {
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Veuillez remplir tous les champs',
            timer: 2000
        })
        return
      }

      try {
        let profile
        if (this.editedItem.id) {
           profile = new Employee(
             this.editedItem.id,
             this.editedItem.name,
             this.editedItem.email,
             this.editedItem.role,
             this.editedItem.sex,
             this.editedItem.phone,
             this.editedItem.specialties,
             this.editedItem.chiefSpecialty
           )
        } else {
          // Creating new
          profile = new Employee(
            null,
            this.editedItem.name,
            this.editedItem.email,
            this.editedItem.role,
            this.editedItem.sex,
            this.editedItem.phone,
            this.editedItem.specialties,
            this.editedItem.chiefSpecialty
          )
        }

        await profile.save()
        
        Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Employé enregistré',
            timer: 2000
        })
        this.close()
      } catch (e) {
        console.error(e)
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Erreur lors de l'enregistrement",
        })
      }
    },

    deleteEmployee(item) {
      Swal.fire({
        title: 'Confirmer la suppression',
        text: `Êtes-vous sûr de vouloir supprimer l'employé "${item.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await item.delete()
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Employé supprimé',
              timer: 2000
            })
          } catch (e) {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: "Erreur lors de la suppression",
            })
          }
        }
      })
    },
  },
}
</script>
