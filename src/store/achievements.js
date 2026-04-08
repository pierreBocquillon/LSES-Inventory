import { defineStore } from 'pinia';
import { useUserStore } from './user';
import Achievement from '@/classes/Achievement';
import Employee from '@/classes/Employee';
import Profile from '@/classes/Profile';
import Swal from 'sweetalert2/dist/sweetalert2.js'
import logger from '@/functions/logger.js'

export const useAchievementStore = defineStore('achievements', {
  state: () => ({
    allAchievements: Achievement.getItems(),
    notificationsEnabled: localStorage.getItem('achievements_notifications_enabled') !== 'false',
    isChecking: false,
    isIncrementing: false
  }),
  actions: {
    setNotificationsEnabled(enabled) {
      this.notificationsEnabled = enabled;
      localStorage.setItem('achievements_notifications_enabled', enabled);
    },
    async checkUnlocks() {
      if (this.isChecking) return;
      this.isChecking = true;

      try {
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
                logger.log(profile.id, 'ACHIEVEMENTS', `Déblocage : ${achievement.title}`)
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
      } finally {
        this.isChecking = false;
      }
    },

    async incrementStat(statName, amount = 1, cooldownHours = 0) {
      if (this.isIncrementing) return;
      this.isIncrementing = true;

      try {
        const userStore = useUserStore();
        const profile = userStore.profile;
        if (!profile) return;

        const perms = profile.permissions || [];
        if (!perms.includes('lses')) return;

        if (cooldownHours > 0) {
          const cooldownKey = `stat_cooldown_${statName}`;
          const lastUpdate = parseInt(localStorage.getItem(cooldownKey) || '0');
          const now = Date.now();
          const cooldownMs = cooldownHours * 60 * 60 * 1000;

          if (now - lastUpdate < cooldownMs) return false;

          localStorage.setItem(cooldownKey, now.toString());
        }

        if (!profile.stats) profile.stats = {};
        profile.stats[statName] = (profile.stats[statName] || 0) + amount;

        logger.log(profile.id, 'ACHIEVEMENTS', `${statName} : +${amount} (Total: ${profile.stats[statName]})`);

        await profile.save();
        await this.checkUnlocks();
      } finally {
        this.isIncrementing = false;
      }
    },
    async unlockAchievement(id) {
      try {
        const userStore = useUserStore();
        const profile = userStore.profile;
        if (!profile) return;

        const perms = profile.permissions || [];
        if (!perms.includes('lses')) return;

        if (!profile.achievements) profile.achievements = [];
        if (profile.achievements.includes(id)) return;

        profile.achievements.push(id);
        await profile.save();
        await this.checkUnlocks();
      } catch (err) {
        console.error("Error unlocking achievement", err);
      }
    },
    async unlockAchievementForUser(userId, id) {
      if (!userId || !id) return;
      try {
        const targetProfile = await Profile.getById(userId);
        if (!targetProfile) return;

        if (!targetProfile.achievements) targetProfile.achievements = [];
        if (targetProfile.achievements.includes(id)) return;

        targetProfile.achievements.push(id);
        await targetProfile.save();

        const userStore = useUserStore();
        if (userStore.profile && userStore.profile.id === userId) {
          userStore.profile.achievements = [...targetProfile.achievements];
          await this.checkUnlocks();
        }
      } catch (err) {
        console.error("Error unlocking achievement for user", userId, err);
      }
    }
  }
});
