import { defineStore } from 'pinia';
import { useUserStore } from './user';
import Achievement from '@/classes/Achievement';
import Employee from '@/classes/Employee';
import Swal from 'sweetalert2/dist/sweetalert2.js'

export const useAchievementStore = defineStore('achievements', {
  state: () => ({
    allAchievements: Achievement.getItems(),
    notificationsEnabled: localStorage.getItem('achievements_notifications_enabled') !== 'false'
  }),
  actions: {
    setNotificationsEnabled(enabled) {
      this.notificationsEnabled = enabled;
      localStorage.setItem('achievements_notifications_enabled', enabled);
    },
    async checkUnlocks() {
      const userStore = useUserStore();
      const profile = userStore.profile;
      if (!profile) return;

      const perms = profile.permissions || [];
      if (!perms.includes('lses')) return;

      if (!profile.stats) profile.stats = {};
      if (!profile.achievements) profile.achievements = [];
      if (!profile.notified_achievements) profile.notified_achievements = [];

      const employee = await Employee.getByUserId(profile.id);
      const newlyCalculated = Achievement.checkUnlocks(profile.stats, profile.achievements, profile, employee);

      if (newlyCalculated.length > 0) {
        const newlyCalculatedIds = newlyCalculated.map(a => a.id);
        profile.achievements = [...profile.achievements, ...newlyCalculatedIds];
      }

      if (!userStore.achievementsInitialized) {
        if (profile.achievements.length > 0 && profile.notified_achievements.length === 0) {
          profile.notified_achievements = [...profile.achievements];
          await profile.save();
        }
        userStore.achievementsInitialized = true;
      }

      const toNotifyIds = profile.achievements.filter(id => !profile.notified_achievements.includes(id));

      if (toNotifyIds.length > 0) {
        if (this.notificationsEnabled) {
          toNotifyIds.forEach(id => {
            const achievement = this.allAchievements.find(a => a.id === id);
            if (achievement) {
              Swal.fire({
                title: 'Succès Débloqué !',
                text: `${achievement.title} : ${achievement.description}`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 12000,
                timerProgressBar: true,
                background: '#2c3e50',
                color: '#fff',
                iconColor: '#f1c40f'
              });
            }
          });
        }

        profile.notified_achievements = [...profile.achievements];
        await profile.save();
      } else if (newlyCalculated.length > 0) {
        await profile.save();
      }
    },

    async incrementStat(statName, amount = 1, cooldownHours = 0) {
      const userStore = useUserStore();
      const profile = userStore.profile;
      if (!profile) return;

      const perms = profile.permissions || [];
      if (!perms.includes('lses')) return;

      if (cooldownHours > 0) {
        if (!profile.statCooldowns) profile.statCooldowns = {};
        const lastUpdate = profile.statCooldowns[statName] || 0;
        const now = Date.now();
        const cooldownMs = cooldownHours * 60 * 60 * 1000;

        if (now - lastUpdate < cooldownMs) return false;

        profile.statCooldowns[statName] = now;
      }

      if (!profile.stats) profile.stats = {};
      profile.stats[statName] = (profile.stats[statName] || 0) + amount;

      await profile.save();
      await this.checkUnlocks();
    }
  }
});
