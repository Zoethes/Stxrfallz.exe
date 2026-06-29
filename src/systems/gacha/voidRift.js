const MAX_PULLS = 10;
const REGEN_MINUTES = 15;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOID TIER SYSTEM (RARITY WEIGHTS)
// Higher tier = rarer, stronger
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TIERS = {
  B: { weight: 45, mult: 1 },
  A: { weight: 25, mult: 1.6 },
  S: { weight: 15, mult: 2.4 },
  SS: { weight: 8, mult: 3.5 },
  X: { weight: 3, mult: 6 },
  XX: { weight: 1, mult: 12 }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ITEM CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TYPES = {
  EQUIPMENT: "equipment",
  CONSUMABLE: "consumable",
  RELIC: "relic",
  COSMETIC: "cosmetic"
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOID RIFT PULL POOL
// Each item belongs to a tier
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const POOL = [
  { name: "Broken Star Edge", rarity: "B", type: TYPES.EQUIPMENT, atk: 2 },
  { name: "Astral Blade", rarity: "A", type: TYPES.EQUIPMENT, atk: 5 },
  { name: "Voidfang Katana", rarity: "S", type: TYPES.EQUIPMENT, atk: 10 },
  { name: "Reality Thread Blade", rarity: "SS", type: TYPES.RELIC, atk: 15 },
  { name: "Heart of the Rift", rarity: "X", type: TYPES.RELIC, atk: 25 },
  { name: "STXR CORE", rarity: "XX", type: TYPES.RELIC, atk: 40 }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILS (SAFE RNG CORE)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollTier() {
  const entries = Object.entries(TIERS);
  const total = entries.reduce((a, [, v]) => a + v.weight, 0);

  let roll = Math.random() * total;

  for (const [tier, data] of entries) {
    roll -= data.weight;
    if (roll <= 0) return tier;
  }

  return "B";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECHARGE SYSTEM
// Restores pulls over time
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updatePulls(user) {
  user.gachaPulls ??= MAX_PULLS;
  user.lastRegen ??= Date.now();

  const now = Date.now();
  const diff = now - user.lastRegen;

  const gained = Math.floor(diff / (REGEN_MINUTES * 60 * 1000));

  if (gained > 0) {
    user.gachaPulls = Math.min(MAX_PULLS, user.gachaPulls + gained);
    user.lastRegen = now - (diff % (REGEN_MINUTES * 60 * 1000));
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOID FAILURE SYSTEM
// Even failure gives SOMETHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function failReward(user) {
  const roll = Math.random();

  if (roll < 0.35) {
    return { type: "none", text: "The void collapses. Nothing remains." };
  }

  const rewardRoll = Math.random();

  if (rewardRoll < 0.33) {
    const xp = rand(10, 40);
    user.stats.xp = (user.stats.xp || 0) + xp;
    return { type: "xp", text: `Residual XP +${xp}` };
  }

  if (rewardRoll < 0.66) {
    const coins = rand(15, 60);
    user.stats.gold = (user.stats.gold || 0) + coins;
    return { type: "coins", text: `Void shards +${coins}` };
  }

  const scraps = [
    "Void Scrap",
    "Broken Sigil",
    "Dust of Nothing",
    "Fractured Core Chip"
  ];

  const item = pick(scraps);

  user.inventory ??= [];
  user.inventory.push({
    name: item,
    rarity: "F",
    type: "scrap",
    time: Date.now()
  });

  return { type: "item", text: `Recovered scrap: ${item}` };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLE PULL
// Main gacha action
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pull(user) {
  updatePulls(user);

  if (user.gachaPulls <= 0) {
    const fail = failReward(user);

    return {
      success: false,
      message: fail.text,
      reward: fail,
      pullsLeft: 0
    };
  }

  user.gachaPulls--;

  const tier = rollTier();
  const pool = POOL.filter((i) => i.rarity === tier);
  const item = pick(pool.length ? pool : POOL);

  const drop = {
    name: item.name,
    rarity: item.rarity,
    type: item.type,
    atk: item.atk || 0,
    def: item.def || 0,
    time: Date.now()
  };

  user.inventory ??= [];
  user.inventory.push(drop);

  return {
    success: true,
    item: drop,
    tier,
    pullsLeft: user.gachaPulls
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10-PULL SYSTEM
// Costs 3 pulls, gives 10 items
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pull10(user) {
  updatePulls(user);

  if (user.gachaPulls < 3) {
    const fail = failReward(user);

    return {
      success: false,
      message: fail.text,
      reward: fail
    };
  }

  user.gachaPulls -= 3;

  const results = [];
  user.inventory ??= [];

  for (let i = 0; i < 10; i++) {
    const tier = rollTier();
    const pool = POOL.filter((j) => j.rarity === tier);
    const item = pick(pool.length ? pool : POOL);

    const drop = {
      name: item.name,
      rarity: item.rarity,
      type: item.type,
      atk: item.atk || 0,
      def: item.def || 0,
      time: Date.now()
    };

    user.inventory.push(drop);
    results.push(drop);
  }

  return {
    success: true,
    results,
    pullsLeft: user.gachaPulls
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INFO SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pullInfo(user) {
  updatePulls(user);

  return {
    pulls: user.gachaPulls,
    max: MAX_PULLS,
    regen: `${REGEN_MINUTES} min per pull`
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = {
  pull,
  pull10,
  pullInfo,
  updatePulls,
  failReward,
  TIERS,
  POOL,
  MAX_PULLS,
  REGEN_MINUTES
};
