/**
 * Gamification: badges, Boing Points, streaks.
 * Persisted in localStorage keyed by account (or anonymous).
 */

const STORAGE_PREFIX = 'boing_achievements_';
const _POINTS_STORAGE = 'boing_points';
const _STREAK_STORAGE = 'boing_streak';
const LEADERBOARD_STORAGE = 'boing_leaderboard'; // placeholder for future backend

export const ACHIEVEMENTS = {
  FIRST_SWAP: { id: 'first_swap', name: 'First Swap', icon: '🔄', points: 50, description: 'Completed your first token swap' },
  FIRST_LIQUIDITY: { id: 'first_liquidity', name: 'Liquidity Provider', icon: '🏊', points: 100, description: 'Added liquidity to a pool' },
  FIRST_POOL: { id: 'first_pool', name: 'Pool Creator', icon: '🏗️', points: 150, description: 'Created your first liquidity pool' },
  FIRST_DEPLOY: { id: 'first_deploy', name: 'Token Architect', icon: '🚀', points: 200, description: 'Deployed your first token' },
  FIRST_BRIDGE: { id: 'first_bridge', name: 'Bridge Explorer', icon: '🌉', points: 75, description: 'Bridged assets across chains' },
  FIRST_NFT: { id: 'first_nft', name: 'NFT Creator', icon: '🖼️', points: 100, description: 'Minted your first NFT' },
  SWAP_STREAK_3: { id: 'swap_streak_3', name: 'Trader', icon: '📈', points: 30, description: '3 swaps in a row' },
  SWAP_STREAK_7: { id: 'swap_streak_7', name: 'Power Trader', icon: '⚡', points: 75, description: '7-day trading streak' },
  EARLY_ADOPTER: { id: 'early_adopter', name: 'Early Adopter', icon: '🌟', points: 50, description: 'Connected wallet and explored' }
};

const POINTS_MAP = {
  swap: 5,
  liquidity_add: 15,
  pool_create: 50,
  token_deploy: 75,
  bridge: 10,
  nft_mint: 25
};

function getStorageKey(account) {
  return `${STORAGE_PREFIX}${(account || 'anonymous').toLowerCase()}`;
}

export function getUnlockedAchievements(account) {
  try {
    const raw = localStorage.getItem(getStorageKey(account));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlockAchievement(account, achievementId) {
  const unlocked = getUnlockedAchievements(account);
  if (unlocked.includes(achievementId)) return null;
  const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
  if (!achievement) return null;

  unlocked.push(achievementId);
  localStorage.setItem(getStorageKey(account), JSON.stringify(unlocked));
  addPoints(account, achievement.points);
  return achievement;
}

export function addPoints(account, amount) {
  const key = getStorageKey(account) + '_points';
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + amount;
  localStorage.setItem(key, String(next));
  return next;
}

export function getPoints(account) {
  const key = getStorageKey(account) + '_points';
  return parseInt(localStorage.getItem(key) || '0', 10);
}

export function recordActivity(account, action) {
  const pts = POINTS_MAP[action];
  if (pts) addPoints(account, pts);

  // Streak: last activity date
  const key = getStorageKey(account) + '_last_activity';
  const prev = localStorage.getItem(key);
  const today = new Date().toDateString();
  if (prev !== today) {
    localStorage.setItem(key, today);
    return { isNewDay: true, points: pts };
  }
  return { isNewDay: false, points: pts };
}

export function getStreak(account) {
  const key = getStorageKey(account) + '_streak_days';
  return parseInt(localStorage.getItem(key) || '0', 10);
}

export function updateStreak(account) {
  const lastKey = getStorageKey(account) + '_last_activity';
  const streakKey = getStorageKey(account) + '_streak_days';
  const today = new Date().toDateString();
  const last = localStorage.getItem(lastKey);
  let streak = parseInt(localStorage.getItem(streakKey) || '0', 10);

  if (!last) {
    streak = 1;
  } else {
    const lastDate = new Date(last);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return streak;
    if (diffDays === 1) streak += 1;
    else streak = 1;
  }

  localStorage.setItem(lastKey, today);
  localStorage.setItem(streakKey, String(streak));
  return streak;
}

export function getLeaderboard(limit = 10) {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE);
    const data = raw ? JSON.parse(raw) : [];
    return data.slice(0, limit);
  } catch {
    return [];
  }
}
