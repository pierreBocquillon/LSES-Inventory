import { achievementList } from '@/config/achievements';

class Achievement {
  constructor(id, title, description, icon, condition) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.icon = icon;
    this.condition = condition;
  }

  static getItems() {
    return achievementList;
  }

  static checkUnlocks(stats, unlockedIds, profile = null, employee = null) {
    const newlyUnlocked = [];

    this.getItems().forEach(achievement => {
      if (!unlockedIds.includes(achievement.id) && achievement.condition(stats, profile, employee)) {
        newlyUnlocked.push(achievement);
      }
    });

    return newlyUnlocked;
  }
}

export default Achievement;
