/**
 * Daily Streak & Retention Milestone Engine
 * Calculates player activity streaks, freeze consumables, milestone tier unlocks,
 * and XP / Gem reward multipliers.
 */

class StreakEngine {
  constructor() {
    this.milestoneTiers = [
      { days: 3, rewardGems: 50, xpMultiplier: 1.1, badge: 'BRONZE_STREAK' },
      { days: 7, rewardGems: 150, xpMultiplier: 1.25, badge: 'SILVER_STREAK' },
      { days: 14, rewardGems: 350, xpMultiplier: 1.5, badge: 'GOLD_STREAK' },
      { days: 30, rewardGems: 1000, xpMultiplier: 2.0, badge: 'DIAMOND_STREAK' },
      { days: 100, rewardGems: 5000, xpMultiplier: 3.0, badge: 'CENTURY_MASTER' }
    ];
  }

  /**
   * Helper to format UTC Date to YYYY-MM-DD
   */
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calculate difference in days between two YYYY-MM-DD strings
   */
  dayDiff(fromDateStr, toDateStr) {
    const d1 = new Date(fromDateStr);
    const d2 = new Date(toDateStr);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((d2 - d1) / msPerDay);
  }

  /**
   * Process a daily practice session for user
   */
  recordPracticeSession(userStreakData, practiceDate = new Date()) {
    const todayStr = this.formatDate(practiceDate);
    const streak = {
      currentStreak: userStreakData.currentStreak || 0,
      longestStreak: userStreakData.longestStreak || 0,
      lastPracticeDate: userStreakData.lastPracticeDate || null,
      streakFreezes: userStreakData.streakFreezes || 0,
      unlockedBadges: new Set(userStreakData.unlockedBadges || []),
      totalGemsEarned: userStreakData.totalGemsEarned || 0,
      freezeUsed: false,
      milestonesReached: []
    };

    if (!streak.lastPracticeDate) {
      streak.currentStreak = 1;
      streak.lastPracticeDate = todayStr;
      streak.longestStreak = 1;
    } else {
      const diff = this.dayDiff(streak.lastPracticeDate, todayStr);

      if (diff === 0) {
        // Same day practice, no streak increment
      } else if (diff === 1) {
        // Consecutive day
        streak.currentStreak += 1;
        streak.lastPracticeDate = todayStr;
      } else if (diff === 2 && streak.streakFreezes > 0) {
        // Missed one day but saved by streak freeze
        streak.streakFreezes -= 1;
        streak.freezeUsed = true;
        streak.currentStreak += 1;
        streak.lastPracticeDate = todayStr;
      } else {
        // Streak broken
        streak.currentStreak = 1;
        streak.lastPracticeDate = todayStr;
      }
    }

    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

    // Check milestones
    for (const tier of this.milestoneTiers) {
      if (streak.currentStreak >= tier.days && !streak.unlockedBadges.has(tier.badge)) {
        streak.unlockedBadges.add(tier.badge);
        streak.totalGemsEarned += tier.rewardGems;
        streak.milestonesReached.push({
          badge: tier.badge,
          days: tier.days,
          gems: tier.rewardGems,
          multiplier: tier.xpMultiplier
        });
      }
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastPracticeDate: streak.lastPracticeDate,
      streakFreezes: streak.streakFreezes,
      unlockedBadges: Array.from(streak.unlockedBadges),
      totalGemsEarned: streak.totalGemsEarned,
      freezeUsed: streak.freezeUsed,
      milestonesReached: streak.milestonesReached,
      multiplier: this.getCurrentMultiplier(streak.currentStreak)
    };
  }

  /**
   * Get current XP multiplier based on active streak
   */
  getCurrentMultiplier(streakDays) {
    let multiplier = 1.0;
    for (const tier of this.milestoneTiers) {
      if (streakDays >= tier.days) {
        multiplier = tier.xpMultiplier;
      }
    }
    return multiplier;
  }
}

module.exports = { StreakEngine };
