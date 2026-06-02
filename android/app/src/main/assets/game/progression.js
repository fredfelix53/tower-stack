/* ===== Tower Stack — Full Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'tower_progress';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Block',
      icon: '🧱',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Wood Block',     bonus: { widthBonus: 0, scoreBonus: 0 },  coinsReq: 0 },
        { level: 1, name: 'Stone Block',    bonus: { widthBonus: 3, scoreBonus: 5 },   coinsReq: 800 },
        { level: 2, name: 'Iron Block',     bonus: { widthBonus: 6, scoreBonus: 12 },  coinsReq: 2000 },
        { level: 3, name: 'Steel Block',    bonus: { widthBonus: 10, scoreBonus: 25 }, coinsReq: 4000 },
        { level: 4, name: 'Titanium Block', bonus: { widthBonus: 15, scoreBonus: 50 }, coinsReq: 8000 },
        { level: 5, name: '💎 Void Block', bonus: { widthBonus: 25, scoreBonus: 100 },coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Base',
      icon: '🏛️',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Sand Base',      bonus: { stability: 0, perfectPct: 0 },    coinsReq: 0 },
        { level: 1, name: 'Clay Base',      bonus: { stability: 5, perfectPct: 5 },    coinsReq: 600 },
        { level: 2, name: 'Brick Base',     bonus: { stability: 10, perfectPct: 10 },  coinsReq: 1500 },
        { level: 3, name: 'Marble Base',    bonus: { stability: 15, perfectPct: 15 },  coinsReq: 3000 },
        { level: 4, name: 'Granite Base',   bonus: { stability: 20, perfectPct: 20 },  coinsReq: 6000 },
        { level: 5, name: '💫 Eternal Base', bonus: { stability: 30, perfectPct: 30 },  coinsReq: 15000 },
      ]
    },
    outfit: {
      name: 'Crown',
      icon: '👑',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Tin Crown',      bonus: { comboMult: 1.0, perfectBonus: 0 }, coinsReq: 0 },
        { level: 1, name: 'Bronze Crown',   bonus: { comboMult: 1.1, perfectBonus: 5 }, coinsReq: 700 },
        { level: 2, name: 'Silver Crown',   bonus: { comboMult: 1.2, perfectBonus: 10 },coinsReq: 1800 },
        { level: 3, name: 'Gold Crown',     bonus: { comboMult: 1.35, perfectBonus: 20 },coinsReq: 3500 },
        { level: 4, name: 'Platinum Crown', bonus: { comboMult: 1.5, perfectBonus: 35 },coinsReq: 7000 },
        { level: 5, name: '🔥 Royal Crown', bonus: { comboMult: 2.0, perfectBonus: 60 },coinsReq: 18000 },
      ]
    }
  };

  const SHOP_CATALOG = {
    blockStyles: [
      { id: 'classic',  name: 'Classic',   price: 0,    colors: ['#4facfe', '#a18cd1', '#ff6b6b', '#ffe259'] },
      { id: 'neon',     name: 'Neon',      price: 500,  colors: ['#00ff88', '#00bfff', '#ff00ff', '#ffff00'] },
      { id: 'pastel',   name: 'Pastel',    price: 700,  colors: ['#ffb3ba', '#bae1ff', '#baffc9', '#ffffba'] },
      { id: 'metal',    name: 'Metallic',  price: 1000, colors: ['#c0c0c0', '#808080', '#d4af37', '#b8860b'] },
      { id: 'candy',    name: 'Candy',     price: 1500, colors: ['#ff69b4', '#ff1493', '#ffd700', '#ff4500'] },
      { id: 'gem',      name: 'Gemstone',  price: 2500, colors: ['#e0115f', '#0f52ba', '#50c878', '#ffbf00'] },
    ],
    themes: [
      { id: 'dark',     name: 'Dark',      price: 0,    bg: '#0a0a1a', accent: '#1a1a3a' },
      { id: 'sunset',   name: 'Sunset',    price: 600,  bg: '#2d1b3d', accent: '#4a1a3a' },
      { id: 'ocean',    name: 'Ocean',     price: 800,  bg: '#023047', accent: '#0a4a6e' },
      { id: 'forest',   name: 'Forest',    price: 1200, bg: '#1a3a2a', accent: '#2a4a3a' },
      { id: 'space',    name: 'Space',     price: 2000, bg: '#0a0020', accent: '#2a0050' },
    ],
    particles: [
      { id: 'sparkle',  name: 'Sparkles',  price: 0 },
      { id: 'stars',    name: 'Stars',     price: 400 },
      { id: 'rainbow',  name: 'Rainbow',   price: 700 },
      { id: 'glow',     name: 'Glow Ring', price: 1200 },
      { id: 'firework', name: 'Fireworks', price: 2000 },
    ]
  };

  const ACHIEVEMENTS = [
    { id: 'first_stack', name: 'First Stack',     desc: 'Play your first game',        reward: { coins: 50 },  check: p => p.totalPlays >= 1, icon: '🏗️' },
    { id: 'height_5',    name: '5 Floors',        desc: 'Stack 5 blocks',              reward: { coins: 100 }, check: p => p.bestHeight >= 5, icon: '5️⃣' },
    { id: 'height_10',   name: '10 Floors',       desc: 'Stack 10 blocks',             reward: { coins: 200 }, check: p => p.bestHeight >= 10, icon: '🔟' },
    { id: 'height_20',   name: 'Skyscraper',      desc: 'Stack 20 blocks',             reward: { coins: 500, gems: 5 }, check: p => p.bestHeight >= 20, icon: '🏢' },
    { id: 'height_50',   name: 'Cloud Tower',     desc: 'Stack 50 blocks',             reward: { coins: 1500, gems: 15 }, check: p => p.bestHeight >= 50, icon: '☁️' },
    { id: 'height_100',  name: 'Sky Tower',       desc: 'Stack 100 blocks',            reward: { coins: 5000, gems: 50 }, check: p => p.bestHeight >= 100, icon: '🗼' },
    { id: 'perfect_3',   name: 'Perfect Trio',    desc: '3 perfect drops',             reward: { coins: 200 }, check: p => p.totalPerfect >= 3, icon: '💯' },
    { id: 'perfect_10',  name: 'Perfect Master',  desc: '10 perfect drops',            reward: { coins: 600, gems: 5 }, check: p => p.totalPerfect >= 10, icon: '🏆' },
    { id: 'perfect_25',  name: 'Precision King',  desc: '25 perfect drops',            reward: { coins: 2000, gems: 20 }, check: p => p.totalPerfect >= 25, icon: '👑' },
    { id: 'combo_5',     name: 'Perfect Streak',  desc: '5 perfects in a row',         reward: { coins: 300 }, check: p => p.bestCombo >= 5, icon: '💪' },
    { id: 'combo_10',    name: 'Unstoppable',     desc: '10 perfects in a row',        reward: { coins: 800, gems: 5 }, check: p => p.bestCombo >= 10, icon: '🔥' },
    { id: 'combo_20',    name: 'Zen Master',      desc: '20 perfects in a row',        reward: { coins: 3000, gems: 30 }, check: p => p.bestCombo >= 20, icon: '🧘' },
    { id: 'weapon_1',    name: 'Block Up',        desc: 'Upgrade block to Lv.1',       reward: { coins: 200 }, check: p => (p.upgrades?.weapon || 0) >= 1, icon: '🔧' },
    { id: 'weapon_3',    name: 'Fortified',       desc: 'Upgrade block to Lv.3',       reward: { coins: 500, gems: 5 }, check: p => (p.upgrades?.weapon || 0) >= 3, icon: '⚡' },
    { id: 'weapon_5',    name: 'Block God',       desc: 'Max out block',               reward: { coins: 2000, gems: 25 }, icon: '🧱', check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',      name: 'Base Builder',    desc: 'Upgrade base to Lv.1',        reward: { coins: 200 }, check: p => (p.upgrades?.case || 0) >= 1, icon: '🏛️' },
    { id: 'case_3',      name: 'Foundation',      desc: 'Upgrade base to Lv.3',        reward: { coins: 500, gems: 5 }, check: p => (p.upgrades?.case || 0) >= 3, icon: '🏗️' },
    { id: 'case_5',      name: 'Bedrock',         desc: 'Max out base',                reward: { coins: 2000, gems: 25 }, icon: '⛰️', check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',    name: 'Crowned',         desc: 'Upgrade crown to Lv.1',       reward: { coins: 200 }, check: p => (p.upgrades?.outfit || 0) >= 1, icon: '👑' },
    { id: 'outfit_3',    name: 'Royalty',         desc: 'Upgrade crown to Lv.3',       reward: { coins: 500, gems: 5 }, check: p => (p.upgrades?.outfit || 0) >= 3, icon: '🏰' },
    { id: 'outfit_5',    name: 'Emperor',         desc: 'Max out crown',               reward: { coins: 2000, gems: 25 }, icon: '✨', check: p => (p.upgrades?.outfit || 0) >= 5 },
  ];

  function defaultState() {
    return {
      coins: 150, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestHeight: 0, bestCombo: 0, totalPlays: 0, totalPerfect: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['dark'], activeTheme: 'dark',
      ownedBlockStyles: ['classic'], activeBlockStyle: 'classic',
      ownedParticleEffects: ['sparkle'], activeParticleEffect: 'sparkle',
      achievements: {}, lastSaveDate: null, inventory: {}, adFree: false,
    };
  }

  let state = null;

  function save() { state.lastSaveDate = new Date().toISOString(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { state = { ...defaultState(), ...JSON.parse(raw) }; if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 }; if (!state.ownedBlockStyles) state.ownedBlockStyles = ['classic']; save(); return true; }
    } catch(e) {}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(70 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) { if (!state) return false; state.xp += amount; let leveled = false; while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; } save(); return leveled; }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }

  function getUpgradeCost(cat, cur) { const t = UPGRADE_TIERS[cat]; if (!t) return null; const n = t.levels.find(l => l.level === cur + 1); return n ? { coins: n.coinsReq } : null; }
  function upgradeItem(cat) {
    if (!state) return { success: false, reason: 'no_state' };
    const t = UPGRADE_TIERS[cat]; if (!t) return { success: false, reason: 'invalid' };
    const cur = state.upgrades[cat] || 0; if (cur >= t.maxLevel) return { success: false, reason: 'max' };
    const cost = getUpgradeCost(cat, cur); if (!cost) return { success: false, reason: 'no_data' };
    if (state.coins < cost.coins) return { success: false, reason: 'coins' };
    state.coins -= cost.coins; state.upgrades[cat]++; save();
    return { success: true, newLevel: state.upgrades[cat] };
  }

  function getActiveBonuses() {
    if (!state) return {};
    const b = { widthBonus: 0, scoreBonus: 0, stability: 0, perfectPct: 0, comboMult: 1.0, perfectBonus: 0 };
    const w = UPGRADE_TIERS.weapon.levels[state.upgrades.weapon || 0]; if (w) { b.widthBonus = w.bonus.widthBonus; b.scoreBonus = w.bonus.scoreBonus; }
    const c = UPGRADE_TIERS.case.levels[state.upgrades.case || 0]; if (c) { b.stability = c.bonus.stability; b.perfectPct = c.bonus.perfectPct; }
    const o = UPGRADE_TIERS.outfit.levels[state.upgrades.outfit || 0]; if (o) { b.comboMult = o.bonus.comboMult; b.perfectBonus = o.bonus.perfectBonus; }
    return b;
  }

  function checkAchievements() {
    if (!state) return []; const u = [];
    for (const a of ACHIEVEMENTS) { if (state.achievements[a.id]) continue; if (a.check(state)) { state.achievements[a.id] = true; addCoins(a.reward.coins); if (a.reward.gems) addGems(a.reward.gems); u.push(a); } }
    if (u.length > 0) save(); return u;
  }

  function endOfGame(result) {
    if (!state) return;
    state.totalPlays++; state.totalPerfect += result.perfects || 0;
    if (result.height > state.bestHeight) state.bestHeight = result.height;
    if (result.combo > state.bestCombo) state.bestCombo = result.combo;
    const xpG = Math.floor(result.height * 3) + 10; addXp(xpG);
    const coinG = Math.floor(result.height * 2) + 3; addCoins(coinG);
    save();
  }

  // ─── Remove Ads Purchase Integration ──────────────
  function purchaseRemoveAds() {
    if (!state) return false;
    state.adFree = true;
    state.coins -= 199;
    save();
    if (window.AdsManager) window.AdsManager.onAdsRemoved();
    return true;
  }

  window.TowerProgression = {
    load, save, reset, addCoins, spendCoins, addGems, spendGems, addXp, xpForLevel,
    upgradeItem, getUpgradeCost, getActiveBonuses, UPGRADE_TIERS,
    SHOP_CATALOG, ACHIEVEMENTS, checkAchievements, endOfGame,
    purchaseRemoveAds, getState: () => state, defaultState,
  };
})();
