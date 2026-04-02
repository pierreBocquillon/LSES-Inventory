<template>
  <div class="pa-4 achievements-page">
    <v-container>
      <div class="d-flex align-center flex-column flex-md-row mb-8 gap-4">
        <div class="d-flex align-center">
          <v-btn icon variant="tonal" @click="$router.back()" color="primary" class="mr-4">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-icon size="48" color="primary" class="mr-md-4">mdi-trophy-variant</v-icon>
        </div>
        
        <div class="text-center text-md-left flex-grow-1">
          <h1 class="text-h4 font-weight-bold text-primary mb-1">Mes Succès</h1>
          <p class="text-subtitle-1 text-grey-lighten-1">Suivez votre engagement et débloquez les tous.</p>
        </div>

        <div class="d-flex align-center gap-2">
          <div class="settings-chip px-3 py-1 rounded-pill d-flex align-center mr-2">
            <v-icon size="18" :color="notificationsEnabled ? 'success' : 'grey'" class="mr-2">
              {{ notificationsEnabled ? 'mdi-bell-outline' : 'mdi-bell-off-outline' }}
            </v-icon>
            <span class="text-caption font-weight-bold mr-2">NOTIFICATIONS</span>
            <v-switch
              v-model="notificationsEnabled"
              color="success"
              hide-details
              density="compact"
              inset
            ></v-switch>
          </div>

          <v-btn 
            v-if="hasAdminPermission"
            prepend-icon="mdi-shield-edit"
            color="white"
            variant="tonal"
            class="rounded-lg font-weight-bold"
            @click="adminDialog = true"
          >
            Administration
          </v-btn>
        </div>
      </div>

      <v-row v-for="(group, category) in achievementGroups" :key="category" class="mb-12">
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <h3 class="text-h5 font-weight-bold text-white mr-4">{{ category }}</h3>
            <div class="flex-grow-1" style="height: 1px; background: rgba(255, 255, 255, 0.1);"></div>
            <div class="ml-4 text-caption font-weight-black text-grey-lighten-1">
              {{ group.unlockedCount }} / {{ group.items.length }}
            </div>
          </div>
          
          <v-row>
            <v-col v-for="item in group.items" :key="item.id" cols="12" sm="6" md="4" lg="3">
              <v-card 
                class="achievement-card pa-4 rounded-xl h-100 d-flex flex-column" 
                :class="{ 
                  'locked': !isUnlocked(item.id), 
                  'unlocked': isUnlocked(item.id),
                  'rarity-legendary': item.rarity === 'legendary' && isUnlocked(item.id),
                  'rarity-mythic': item.rarity === 'mythic' && isUnlocked(item.id)
                }"
                theme="dark"
                elevation="4"
              >
                <div class="d-flex flex-column align-center text-center flex-grow-1">
                  <div class="text-overline font-weight-black opacity-60 mb-2" :style="{ color: getRarityConfig(item.rarity).color }">
                    {{ getRarityConfig(item.rarity).label.toUpperCase() }}
                  </div>

                  <v-avatar 
                    size="80" 
                    :style="{ 
                      background: isUnlocked(item.id) ? getRarityConfig(item.rarity).gradient : '#1e293b',
                      boxShadow: isUnlocked(item.id) ? `0 0 20px ${getRarityConfig(item.rarity).glow}` : 'none',
                      border: `2px solid ${isUnlocked(item.id) ? getRarityConfig(item.rarity).color : '#334155'}`
                    }"
                    class="elevation-8 mb-4 rarity-avatar"
                  >
                    <v-icon size="40" :color="isUnlocked(item.id) ? 'white' : 'grey-darken-1'">
                      {{ (isUnlocked(item.id) || !item.secret) ? item.icon : 'mdi-help-circle-outline' }}
                    </v-icon>
                  </v-avatar>
                  
                  <h2 class="text-h6 font-weight-bold mb-1" :style="{ color: isUnlocked(item.id) ? 'white' : '#64748b' }">
                    {{ (isUnlocked(item.id) || !item.secret) ? item.title : '???' }}
                  </h2>
                  
                  <p class="text-body-2 opacity-70 mb-4 flex-grow-1">
                    {{ (isUnlocked(item.id) || !item.secret) ? item.description : item.hint }}
                  </p>

                  <div class="mt-auto w-100">
                    <v-chip 
                      v-if="isUnlocked(item.id)" 
                      :color="getRarityConfig(item.rarity).color" 
                      variant="tonal" 
                      size="small" 
                      class="font-weight-bold w-100 justify-center"
                      prepend-icon="mdi-check-decagram"
                    >
                      DÉBLOQUÉ
                    </v-chip>
                    
                    <div v-else class="d-flex align-center flex-column">
                       <div class="text-caption text-grey mb-2">
                         Verrouillé
                         <span v-if="item.progress && !item.secret">
                           - {{ item.progress(userStore.profile?.stats || {}).current }}/{{ item.progress(userStore.profile?.stats || {}).max }}
                         </span>
                       </div>
                       <v-progress-linear
                        color="grey-darken-2"
                        rounded
                        height="6"
                        class="w-75 mx-auto opacity-50"
                        :model-value="(item.progress && !item.secret) ? (item.progress(userStore.profile?.stats || {}).current / item.progress(userStore.profile?.stats || {}).max) * 100 : 0"
                       ></v-progress-linear>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="adminDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="bg-background">
        <v-toolbar color="primary" dark>
          <v-btn icon @click="adminDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Gestion des Succès</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="adminSearch"
            prepend-inner-icon="mdi-magnify"
            label="Rechercher un utilisateur"
            hide-details
            density="compact"
            variant="solo-filled"
            flat
            class="mr-4 mw-300"
          ></v-text-field>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="4" style="max-height: calc(100vh - 150px); overflow-y: auto;">
              <v-list class="bg-transparent rounded-xl" theme="dark">
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.id"
                  @click="selectedUser = user"
                  :active="selectedUser && selectedUser.id === user.id"
                  color="primary"
                  class="mb-2 rounded-lg"
                >
                  <template v-slot:prepend>
                    <v-avatar color="grey-darken-3">
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ user.name }}</v-list-item-title>
                  <template v-slot:append>
                    <v-badge
                      color="secondary"
                      :content="user.achievements?.length || 0"
                      inline
                    ></v-badge>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="8">
              <v-fade-transition mode="out-in">
                <v-card v-if="selectedUser" class="pa-6 rounded-xl elevation-4 d-flex flex-column h-100" color="#1e293b">
                  <div class="d-flex align-center mb-4">
                    <div>
                      <h2 class="text-h5 font-weight-bold">Gestion : {{ selectedUser.name }}</h2>
                      <div class="text-caption text-grey">Modifier les succès ou les compteurs de statistiques</div>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="success"
                      prepend-icon="mdi-content-save"
                      @click="saveAdminChanges"
                      :loading="saving"
                      class="px-6"
                    >
                      Enregistrer
                    </v-btn>
                  </div>

                  <v-tabs v-model="adminTab" bg-color="transparent" color="primary" class="mb-4">
                    <v-tab value="achievements" prepend-icon="mdi-trophy-variant">Succès</v-tab>
                    <v-tab value="stats" prepend-icon="mdi-chart-line">Statistiques</v-tab>
                  </v-tabs>

                  <v-tabs-window v-model="adminTab" class="flex-grow-1 overflow-y-auto pr-2" style="max-height: calc(100vh - 300px);">
                    <v-tabs-window-item value="achievements">
                      <div v-for="(group, category) in achievementGroups" :key="category" class="mb-6">
                        <div class="text-overline text-grey-lighten-1 mb-2">{{ category }}</div>
                        <v-row>
                          <v-col v-for="item in group.items" :key="item.id" cols="12" sm="6" lg="4">
                            <v-card
                              variant="tonal"
                              class="pa-3 rounded-lg cursor-pointer h-100"
                              :color="selectedUser.achievements?.includes(item.id) ? 'success' : 'grey-lighten-1'"
                              @click="toggleAdminAchievement(item.id)"
                            >
                              <div class="d-flex align-center">
                                <v-icon :icon="item.icon" size="32" class="mr-3"></v-icon>
                                <div>
                                  <div class="text-subtitle-2 font-weight-bold">{{ item.title }}</div>
                                  <div class="text-caption opacity-70">{{ item.id }}</div>
                                </div>
                                <v-spacer></v-spacer>
                                <v-checkbox-btn
                                  :model-value="selectedUser.achievements?.includes(item.id)"
                                  readonly
                                  color="success"
                                ></v-checkbox-btn>
                              </div>
                            </v-card>
                          </v-col>
                        </v-row>
                      </div>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="stats">
                      <v-row>
                        <v-col cols="12">
                          <v-alert
                            type="info"
                            variant="tonal"
                            density="compact"
                            class="mb-6"
                            icon="mdi-information-outline"
                          >
                            Les modifications des statistiques peuvent déclencher automatiquement de nouveaux succès lors du prochain calcul.
                          </v-alert>
                        </v-col>

                        <v-col cols="12" sm="6" md="4" v-for="stat in commonStats" :key="stat.key">
                          <v-text-field
                            v-model.number="selectedUser.stats[stat.key]"
                            :label="stat.label.toUpperCase()"
                            type="number"
                            variant="outlined"
                            density="comfortable"
                            prepend-inner-icon="mdi-chart-box-outline"
                            bg-color="rgba(255,255,255,0.03)"
                          ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                          <v-divider class="mb-6 border-opacity-25"></v-divider>
                          <div class="text-overline mb-4">Autres statistiques</div>
                        </v-col>
                        
                        <v-col 
                          cols="12" 
                          sm="6" 
                          md="4" 
                          v-for="(val, key) in selectedUser.stats" 
                          :key="'custom-'+key"
                          v-show="!commonStats.some(s => s.key === key)"
                        >
                          <v-text-field
                            v-model.number="selectedUser.stats[key]"
                            :label="key"
                            type="number"
                            variant="outlined"
                            density="comfortable"
                            append-inner-icon="mdi-delete-outline"
                            @click:append-inner="delete selectedUser.stats[key]"
                          ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                          <v-card variant="outlined" class="pa-4 border-dashed rounded-lg bg-transparent">
                            <div class="text-subtitle-2 mb-3">Ajouter un nouveau compteur</div>
                            <div class="d-flex gap-2">
                              <v-text-field
                                v-model="newStatKey"
                                label="Nom de la stat (ex: fires_extinguished)"
                                variant="solo"
                                density="compact"
                                hide-details
                              ></v-text-field>
                              <v-text-field
                                v-model.number="newStatValue"
                                label="Valeur"
                                type="number"
                                variant="solo"
                                density="compact"
                                style="max-width: 120px;"
                                hide-details
                              ></v-text-field>
                              <v-btn
                                color="primary"
                                @click="addNewStat"
                                :disabled="!newStatKey"
                                icon="mdi-plus"
                                rounded="lg"
                              ></v-btn>
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-tabs-window-item>
                  </v-tabs-window>
                </v-card>

                <div v-else class="h-100 d-flex flex-column align-center justify-center opacity-50">
                  <v-icon size="100">mdi-account-search</v-icon>
                  <p class="text-h6">Sélectionnez un utilisateur pour gérer ses succès</p>
                </div>
              </v-fade-transition>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user'
import { useAchievementStore } from '@/store/achievements'
import Achievement from '@/classes/Achievement'
import { commonStats } from '@/config/achievements'
import Profile from '@/classes/Profile'
import logger from '@/functions/logger'
import Swal from 'sweetalert2'

export default {
  data() {
    return {
      userStore: useUserStore(),
      achievementStore: useAchievementStore(),
      allAchievements: Achievement.getItems(),
      commonStats,
      adminDialog: false,
      adminSearch: '',
      adminUsers: [],
      selectedUser: null,
      adminTab: 'achievements',
      newStatKey: '',
      newStatValue: 0,
      saving: false,
      unsub: null
    }
  },
  watch: {
    adminDialog(val) {
      if (val) {
        this.fetchAdminUsers()
      } else {
        if (this.unsub) this.unsub()
      }
    }
  },
  computed: {
    unlockedIds() {
      return this.userStore.profile?.achievements || []
    },
    achievementGroups() {
      const groups = {};
      this.allAchievements.forEach(item => {
        const cat = item.category || 'Général';
        if (!groups[cat]) {
          groups[cat] = {
            items: [],
            unlockedCount: 0
          };
        }
        groups[cat].items.push(item);
        if (this.isUnlocked(item.id)) {
          groups[cat].unlockedCount++;
        }
      });
      return groups;
    },
    hasAdminPermission() {
      const perms = this.userStore.profile?.permissions || []
      return perms.includes('dev') || perms.includes('admin')
    },
    filteredUsers() {
      let users = this.adminUsers.filter(u => u.permissions?.includes('lses'))
      if (!this.adminSearch) return users
      const q = this.adminSearch.toLowerCase()
      return users.filter(u => u.name.toLowerCase().includes(q))
    },
    notificationsEnabled: {
      get() {
        return this.achievementStore.notificationsEnabled
      },
      set(val) {
        this.achievementStore.setNotificationsEnabled(val)
      }
    }
  },
  methods: {
    isUnlocked(id) {
      return this.unlockedIds.includes(id)
    },
    getRarityConfig(rarity) {
      const configs = {
        common: {
          label: 'Commun',
          color: '#64748b',
          gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
          glow: 'rgba(100, 116, 139, 0.3)'
        },
        uncommon: {
          label: 'Peu Commun',
          color: '#22c55e',
          gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
          glow: 'rgba(34, 197, 94, 0.4)'
        },
        rare: {
          label: 'Rare',
          color: '#0ea5e9',
          gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
          glow: 'rgba(14, 165, 233, 0.5)'
        },
        epic: {
          label: 'Épique',
          color: '#a855f7',
          gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
          glow: 'rgba(168, 85, 247, 0.6)'
        },
        legendary: {
          label: 'Légendaire',
          color: '#eab308',
          gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
          glow: 'rgba(234, 179, 8, 0.8)'
        },
        mythic: {
          label: 'Mythique',
          color: '#ef4444', // Red
          gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          glow: 'rgba(239, 68, 68, 0.9)'
        }
      }
      return configs[rarity] || configs.common
    },
    fetchAdminUsers() {
      this.unsub = Profile.listenByActivated(true, users => {
        this.adminUsers = users
        if (this.selectedUser) {
          const updated = users.find(u => u.id === this.selectedUser.id)
          if (updated) this.selectedUser = updated
        }
      })
    },
    toggleAdminAchievement(id) {
      if (!this.selectedUser.achievements) this.selectedUser.achievements = []
      
      const index = this.selectedUser.achievements.indexOf(id)
      if (index > -1) {
        this.selectedUser.achievements.splice(index, 1)
      } else {
        this.selectedUser.achievements.push(id)
      }
    },
    addNewStat() {
      if (!this.newStatKey) return;
      if (!this.selectedUser.stats) this.selectedUser.stats = {};
      
      this.selectedUser.stats[this.newStatKey] = this.newStatValue || 0;
      this.newStatKey = '';
      this.newStatValue = 0;
    },
    async saveAdminChanges() {
      if (!this.selectedUser) return
      
      this.saving = true
      try {
        if (!this.selectedUser.stats) this.selectedUser.stats = {};

        await this.selectedUser.save()
        
        const statsSummaries = Object.entries(this.selectedUser.stats)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');

        logger.log(
          this.userStore.profile.id, 
          'ACHIEVEMENTS_ADMIN', 
          `Modification manuelle par admin pour ${this.selectedUser.name}. Succès: [${this.selectedUser.achievements?.join(', ')}]. Stats: {${statsSummaries}}`
        )

        Swal.fire({
          icon: 'success',
          title: 'Modification enregistrée',
          text: `Le profil de ${this.selectedUser.name} a été mis à jour avec succès.`,
          timer: 2000,
          showConfirmButton: false
        })
      } catch (error) {
        console.error(error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la sauvegarde.'
        })
      } finally {
        this.saving = false
      }
    }
  },
  beforeUnmount() {
    if (this.unsub) this.unsub()
  }
}
</script>

<style scoped>
.achievements-page {
  background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%);
  min-height: 100vh;
}

.achievement-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-card.unlocked:hover {
  transform: translateY(-5px);
  background: rgba(30, 41, 59, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.1);
}

.achievement-card.locked {
  filter: grayscale(1) opacity(0.5);
  background: rgba(15, 23, 42, 0.4) !important;
}

.rarity-avatar {
  transition: all 0.5s ease;
}

.unlocked:hover .rarity-avatar {
  transform: scale(1.1) rotate(5deg);
}

.rarity-legendary.unlocked {
  border: 1px solid rgba(234, 179, 8, 0.3);
  background: radial-gradient(circle at top right, rgba(234, 179, 8, 0.1), transparent), rgba(30, 41, 59, 0.6) !important;
  animation: pulsing-gold 3s infinite alternate;
}

.rarity-mythic.unlocked {
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: radial-gradient(circle at top right, rgba(239, 68, 68, 0.2), transparent), rgba(30, 41, 59, 0.7) !important;
  animation: pulsing-red 2s infinite alternate;
}

@keyframes pulsing-gold {
  0% { box-shadow: 0 0 15px rgba(234, 179, 8, 0.1); }
  100% { box-shadow: 0 0 30px rgba(234, 179, 8, 0.2); }
}

@keyframes pulsing-red {
  0% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
  100% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.4); }
}
</style>
