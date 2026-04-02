<template>
  <div class="achievement-grid">
    <v-row v-for="(group, category) in achievementGroups" :key="category" class="mb-12">
      <v-col cols="12">
        <div class="d-flex align-center mb-6 category-header">
          <h3 class="text-h5 font-weight-black text-white mr-4 category-title">{{ category }}</h3>
          <div class="flex-grow-1 category-line"></div>
          <v-chip size="x-small" variant="tonal" class="ml-4 font-weight-black text-grey-lighten-1 px-3">
            {{ group.unlockedCount }} / {{ group.items.length }}
          </v-chip>
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
                         - {{ item.progress(effectiveStats).current }}/{{ item.progress(effectiveStats).max }}
                       </span>
                     </div>
                     <v-progress-linear
                      color="grey-darken-2"
                      rounded
                      height="6"
                      class="w-75 mx-auto opacity-50"
                      :model-value="(item.progress && !item.secret) ? (item.progress(effectiveStats).current / item.progress(effectiveStats).max) * 100 : 0"
                     ></v-progress-linear>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user'
import Achievement from '@/classes/Achievement'

export default {
  name: 'AchievementGrid',
  props: {
    targetAchievements: {
      type: Array,
      default: null
    },
    targetStats: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      userStore: useUserStore(),
      allAchievements: Achievement.getItems()
    }
  },
  computed: {
    unlockedIds() {
      return this.targetAchievements || this.userStore.profile?.achievements || []
    },
    effectiveStats() {
      return this.targetStats || this.userStore.profile?.stats || {}
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
          color: '#ef4444',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          glow: 'rgba(239, 68, 68, 0.9)'
        }
      }
      return configs[rarity] || configs.common
    }
  }
}
</script>

<style scoped>
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

.category-header {
  height: 48px;
}

.category-title {
  letter-spacing: 1px;
}

.category-line {
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  border-radius: 2px;
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
