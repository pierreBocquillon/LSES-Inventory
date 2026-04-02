<template>
  <div class="pa-4 achievements-page">
    <div class="achievement-hero mb-8 pa-6 pa-md-10 rounded-xl elevation-10">
      <v-container>
        <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4">
          <div class="d-flex align-center">
            <v-btn icon variant="tonal" @click="$router.back()" color="primary" class="mr-4">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-avatar size="64" color="rgba(14, 165, 233, 0.1)" class="mr-4 hero-icon-avatar">
              <v-icon size="40" color="primary">mdi-trophy-variant</v-icon>
            </v-avatar>
            <div>
              <div class="d-flex align-center mb-1">
                <h1 class="text-h3 font-weight-black text-white mb-0 mr-4">Mes Succès</h1>
                <v-chip
                  v-if="currentTitle"
                  :color="currentTitle.color"
                  variant="flat"
                  size="small"
                  class="font-weight-black title-badge elevation-8"
                  :prepend-icon="currentTitle.icon"
                >
                  {{ currentTitle.label.toUpperCase() }}
                </v-chip>
              </div>
              <p class="text-subtitle-1 text-grey-lighten-1 mb-0 opacity-80">Votre parcours et classement</p>
            </div>
          </div>

          <div class="d-flex align-center">
            <div class="settings-chip px-4 py-1 rounded-pill d-flex align-center border border-opacity-10 mr-4 bg-white-opacity-5">
              <v-icon size="18" :color="notificationsEnabled ? 'success' : 'grey'" class="mr-2">
                {{ notificationsEnabled ? 'mdi-bell' : 'mdi-bell-off' }}
              </v-icon>
              <span class="text-caption font-weight-black mr-2 d-none d-sm-block">NOTIFICATIONS</span>
              <v-switch v-model="notificationsEnabled" color="success" hide-details density="compact" inset></v-switch>
            </div>

            <v-btn v-if="hasAdminPermission" prepend-icon="mdi-shield-crown" color="white" variant="flat" class="rounded-lg font-weight-bold px-6 text-black elevation-4" @click="adminDialog = true">
              Administration
            </v-btn>
          </div>
        </div>

        <div class="d-flex justify-center">
          <v-tabs v-model="activeTab" bg-color="transparent" class="custom-nav-tabs pa-1 rounded-pill" hide-slider>
            <v-tab value="mine" class="rounded-pill px-8 mr-2 transition-all" :class="{ 'active-tab-bg shadow-lg': activeTab === 'mine' }" variant="text" :ripple="false">
              <v-icon start>mdi-trophy-outline</v-icon> Mon Palmarès
            </v-tab>
            <v-tab value="ranking" class="rounded-pill px-8 transition-all" :class="{ 'active-tab-bg shadow-lg': activeTab === 'ranking' }" variant="text" :ripple="false">
              <v-icon start>mdi-podium-gold</v-icon> Classement Global
            </v-tab>
          </v-tabs>
        </div>
      </v-container>
    </div>

    <v-container>
      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item value="mine">
          <AchievementGrid />
        </v-tabs-window-item>

        <v-tabs-window-item value="ranking">
          <AchievementLeaderboard :ranking="sortedRanking" @view-user="openUserView" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>

    <v-dialog v-model="viewUserDialog" max-width="1200" scrollable transition="dialog-bottom-transition">
      <v-card class="view-user-card rounded-xl overflow-hidden" theme="dark">
        <v-toolbar color="transparent" class="px-4 py-4" height="auto">
          <v-avatar size="64" color="rgba(255,255,255,0.1)" class="mr-4">
            <v-icon size="32">mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="text-h4 font-weight-black mb-1">{{ viewedUser?.name }}</div>
            <v-chip v-if="viewedUser" :color="getUserTitle(viewedUser).color" size="small" variant="flat" class="font-weight-black" :prepend-icon="getUserTitle(viewedUser).icon">
              {{ getUserTitle(viewedUser).label.toUpperCase() }}
            </v-chip>
          </div>
          <v-spacer></v-spacer>
          <div class="text-right mr-6">
            <div class="text-h4 font-weight-black text-primary">{{ viewedUser?.achievements?.length || 0 }}</div>
            <div class="text-caption font-weight-bold opacity-60">TROPHÉES</div>
          </div>
          <v-btn icon @click="viewUserDialog = false" variant="tonal" class="rounded-lg">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-divider class="border-opacity-10"></v-divider>

        <v-card-text class="pa-6 bg-view-content">
          <AchievementGrid v-if="viewedUser" :target-achievements="viewedUser.achievements" :target-stats="viewedUser.stats" />
        </v-card-text>
      </v-card>
    </v-dialog>

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
import { commonStats, achievementTitles } from '@/config/achievements'
import Profile from '@/classes/Profile'
import logger from '@/functions/logger'
import Swal from 'sweetalert2'

import AchievementGrid from '@/components/achievements/AchievementGrid.vue'
import AchievementLeaderboard from '@/components/achievements/AchievementLeaderboard.vue'

export default {
  components: {
    AchievementGrid,
    AchievementLeaderboard
  },
  data() {
    return {
      userStore: useUserStore(),
      achievementStore: useAchievementStore(),
      allAchievements: Achievement.getItems(),
      commonStats,
      adminDialog: false,
      activeTab: 'mine',
      adminSearch: '',
      adminUsers: [],
      selectedUser: null,
      adminTab: 'achievements',
      newStatKey: '',
      newStatValue: 0,
      newStatVal: 0,
      saving: false,
      unsub: null,
      viewUserDialog: false,
      viewedUser: null
    }
  },
  mounted() {
    this.fetchAdminUsers()
  },
  watch: {
    adminDialog(val) {
      if (!val && !this.activeTab === 'ranking') {
      }
    }
  },
  computed: {
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
        if ((this.userStore.profile?.achievements || []).includes(item.id)) {
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
    sortedRanking() {
      return [...this.adminUsers]
        .filter(u => u.permissions?.includes('lses') && (u.achievements?.length || 0) > 0)
        .sort((a, b) => (b.achievements?.length || 0) - (a.achievements?.length || 0))
    },
    currentTitle() {
      const count = this.userStore.profile?.achievements?.length || 0
      return [...achievementTitles].reverse().find(t => count >= t.threshold)
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
    getUserTitle(user) {
      if (!user) return achievementTitles[0]
      const count = user.achievements?.length || 0
      return [...achievementTitles].reverse().find(t => count >= t.threshold)
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
    openUserView(user) {
      this.viewedUser = user
      this.viewUserDialog = true
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
          'ACHIEVEMENTS', 
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

.achievement-hero {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 40px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
}

.title-badge {
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  animation: glow 3s infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 10px rgba(0,0,0,0.2); }
  to { box-shadow: 0 0 20px var(--v-theme-primary); }
}

.bg-white-opacity-5 {
  background: rgba(255, 255, 255, 0.05);
}

.achievement-hero::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -10%;
  width: 40%;
  height: 200%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  transform: rotate(-15deg);
  pointer-events: none;
}

.hero-icon-avatar {
  border: 1px solid rgba(14, 165, 233, 0.3);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hero-icon-avatar:hover {
  transform: scale(1.1) rotate(10deg);
}

.custom-nav-tabs {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
  min-height: 56px !important;
}
.active-tab-bg {
  background: white !important;
  color: #0f172a !important;
  font-weight: 800 !important;
  opacity: 1 !important;
}

.transition-all {
  transition: all 0.3s ease !important;
}

.view-user-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

.bg-view-content {
  background: rgba(15, 23, 42, 0.3);
}
</style>
