<template>
  <div class="achievement-leaderboard">
    <div v-if="ranking.length > 0">
      <v-row justify="center" align="end" class="mb-12 mt-4 px-4 podium-container">
        <v-col cols="4" sm="3" class="order-1">
          <div class="podium-pillar rank-2 d-flex flex-column align-center pa-4 text-center cursor-pointer" @click="$emit('view-user', ranking[1])">
            <v-avatar size="64" class="mb-3 border-silver">
              <v-icon color="grey-lighten-1" size="32">mdi-account</v-icon>
            </v-avatar>
            <div class="text-subtitle-2 font-weight-black text-truncate w-100">{{ ranking[1]?.name || '---' }}</div>
            <div v-if="ranking[1]" class="text-caption font-weight-bold" :style="{ color: getUserTitle(ranking[1]).color }">
              {{ getUserTitle(ranking[1]).label }}
            </div>
            <div class="text-h6 font-weight-black text-silver mt-1">{{ ranking[1]?.achievements?.length || 0 }}</div>
            <v-icon color="grey-lighten-1" class="mt-1">mdi-medal</v-icon>
          </div>
        </v-col>

        <v-col cols="4" sm="4" class="order-2">
          <div class="podium-pillar rank-1 d-flex flex-column align-center pa-6 text-center shadow-gold cursor-pointer" @click="$emit('view-user', ranking[0])">
            <v-avatar size="96" class="mb-4 border-gold">
              <v-icon color="amber-accent-4" size="48">mdi-crown</v-icon>
            </v-avatar>
            <div class="text-h6 font-weight-black text-truncate w-100">{{ ranking[0]?.name || '---' }}</div>
            <div v-if="ranking[0]" class="text-subtitle-2 font-weight-bold" :style="{ color: getUserTitle(ranking[0]).color }">
              {{ getUserTitle(ranking[0]).label }}
            </div>
            <div class="text-h4 font-weight-black text-amber-accent-4 mt-1">{{ ranking[0]?.achievements?.length || 0 }}</div>
            <v-icon color="amber-accent-4" class="mt-1">mdi-medal</v-icon>
          </div>
        </v-col>

        <v-col cols="4" sm="3" class="order-3">
          <div class="podium-pillar rank-3 d-flex flex-column align-center pa-4 text-center cursor-pointer" @click="$emit('view-user', ranking[2])">
            <v-avatar size="64" class="mb-3 border-bronze">
              <v-icon color="orange-darken-3" size="32">mdi-account</v-icon>
            </v-avatar>
            <div class="text-subtitle-2 font-weight-black text-truncate w-100">{{ ranking[2]?.name || '---' }}</div>
            <div v-if="ranking[2]" class="text-caption font-weight-bold" :style="{ color: getUserTitle(ranking[2]).color }">
              {{ getUserTitle(ranking[2]).label }}
            </div>
            <div class="text-h6 font-weight-black text-bronze mt-1">{{ ranking[2]?.achievements?.length || 0 }}</div>
            <v-icon color="orange-darken-3" class="mt-1">mdi-medal</v-icon>
          </div>
        </v-col>
      </v-row>

      <v-card variant="outlined" class="rounded-xl border-opacity-10 ranking-list-card mx-auto" max-width="800">
        <v-list bg-color="transparent" theme="dark">
          <v-list-item 
            v-for="(user, index) in ranking.slice(3)" 
            :key="user.id"
            :class="{'user-highlight': user.id === userStore.profile?.id}"
            class="py-3 px-6 cursor-pointer"
            @click="$emit('view-user', user)"
          >
            <template v-slot:prepend>
              <div class="rank-number font-weight-black text-h6 opacity-40 mr-6">#{{ index + 4 }}</div>
              <v-avatar color="grey-darken-3" class="mr-4">
                <v-icon size="20">mdi-account</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold">{{ user.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption font-weight-bold" :style="{ color: getUserTitle(user).color }">
              {{ getUserTitle(user).label }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center">
                <div class="text-h6 font-weight-black mr-2">{{ user.achievements?.length || 0 }}</div>
                <v-icon color="primary" size="20">mdi-trophy-variant</v-icon>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
    <div v-else class="text-center pa-12 opacity-50">
      <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
      <p>Chargement du classement...</p>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user'
import { achievementTitles } from '@/config/achievements'

export default {
  name: 'AchievementLeaderboard',
  props: {
    ranking: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      userStore: useUserStore()
    }
  },
  methods: {
    getUserTitle(user) {
      if (!user) return achievementTitles[0]
      const count = user.achievements?.length || 0
      return [...achievementTitles].reverse().find(t => count >= t.threshold)
    }
  }
}
</script>

<style scoped>
.podium-container {
  min-height: 350px;
}

.podium-pillar {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px 24px 12px 12px;
  position: relative;
  transition: transform 0.3s ease;
}

.podium-pillar:hover {
  transform: translateY(-5px);
  background: rgba(30, 41, 59, 0.5);
}

.cursor-pointer {
  cursor: pointer;
}

.ranking-list-card .v-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rank-1 {
  height: 320px;
  border-top: 4px solid #fbbf24;
  background: linear-gradient(to bottom, rgba(251, 191, 36, 0.1), rgba(30, 41, 59, 0.4));
  z-index: 2;
}

.rank-2 {
  height: 260px;
  border-top: 4px solid #94a3b8;
}

.rank-3 {
  height: 220px;
  border-top: 4px solid #b45309;
}

.border-gold { border: 3px solid #fbbf24 !important; }
.border-silver { border: 3px solid #94a3b8 !important; }
.border-bronze { border: 3px solid #b45309 !important; }

.text-silver { color: #cbd5e1; }
.text-bronze { color: #d97706; }

.shadow-gold {
  box-shadow: 0 0 40px rgba(251, 191, 36, 0.1);
}

.ranking-list-card {
  background: rgba(30, 41, 59, 0.2) !important;
  backdrop-filter: blur(10px);
}

.user-highlight {
  background: rgba(14, 165, 233, 0.1) !important;
  border-left: 4px solid #0ea5e9;
}
</style>
