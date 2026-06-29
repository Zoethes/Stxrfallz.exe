const db = require("../../core/database");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPTIONAL SYSTEMS (graceful loading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let story = null;
try {
  story = require("../story/story");
} catch {}

let pets = null;
try {
  pets = require("../pets/pets");
} catch {}

let addXP = null;
try {
  addXP = require("../../progression/xp").addXP;
} catch {}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOID ENEMY ARCHETYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ENEMY_POOL = [
  "Void Shade",
  "Star Wraith",
  "Nebula Beast",
  "Fallen Constellation",
  "Cosmic Bandit",
  "Eclipse Marauder",
  "Grave of Light",
  "Astral Parasite"
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENEMY GENERATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateEnemy(user) {
  const chapter = user.stats?.chapter || 1;
  const level = user.stats?.level || 1;

  const scale = chapter * 3 + level;

  const base = ENEMY_POOL[Math.floor(Math.random() * ENEMY_POOL.length)];

  const bossRoll =
    Math.random() < 0.1 || (user.storyProgress >= user.storyProgressNeeded - 1);

  const hp = 70 + scale * 22;
  const atk = 6 + scale * 2.4;
  const def = 3 + scale * 1.6;

  return {
    name: bossRoll ? `VOID LORD: ${base}` : base,
    level: scale,
    isBoss: bossRoll,

    maxHp: bossRoll ? hp * 2.3 : hp,
    hp: bossRoll ? hp * 2.3 : hp,

    attack: bossRoll ? atk * 1.8 : atk,
    defense: bossRoll ? def * 1.6 : def,

    phase: 1,
    status: []
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INIT BATTLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function initBattle(userId) {
  const user = db.getUser(userId);

  if (!user) {
    return { error: true, message: "No vessel found. Enter the void first." };
  }
  if (user.activeBattle) {
    return user.activeBattle;
  }

  const enemy = generateEnemy(user);

  const state = {
    hpPlayer: user.combat?.hp ?? 100,
    maxHpPlayer: user.combat?.maxHp ?? 100,

    hpEnemy: enemy.hp,
    maxHpEnemy: enemy.maxHp,

    turn: 1,
    enemy,

    defendShield: 0,
    lastAction: `A fracture opens in reality. ${enemy.name} emerges.`,
    ended: false
  };

  user.activeBattle = state;
  db.save();

  return state;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DAMAGE ENGINE (VOID LOGIC)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calcDamage(base, defense, luck = 1) {
  const variance = Math.floor(Math.random() * 8);

  let dmg = base + variance - defense;

  const critChance = Math.min(40, luck * 3.2);
  const crit = Math.random() * 100 < critChance;

  if (crit) dmg *= 1.8;

  return {
    damage: Math.max(1, Math.floor(dmg)),
    crit
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENEMY PHASE SHIFT SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkPhase(enemy) {
  const ratio = enemy.hp / enemy.maxHp;

  if (enemy.isBoss && ratio < 0.5 && enemy.phase === 1) {
    enemy.phase = 2;
    enemy.attack *= 1.3;
    enemy.defense *= 1.2;
    return "The void lord shifts reality... Phase II awakens.";
  }

  if (enemy.isBoss && ratio < 0.25 && enemy.phase === 2) {
    enemy.phase = 3;
    enemy.attack *= 1.5;
    enemy.defense *= 1.4;
    return "Reality collapses. Final void form emerges.";
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TURN SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function runBattleTurn(userId, action) {
  const user = db.getUser(userId);
  const state = user?.activeBattle;

  if (!user || !state) {
    return { error: true, message: "No active void thread." };
  }
  if (state.ended) {
    return { error: true, message: "Battle already concluded." };
  }

  const enemy = state.enemy;

  const atk = user.combat?.attack ?? 10;
  const def = user.combat?.defense ?? 5;
  const luck = user.combat?.luck ?? 1;

  let playerLog = "";
  let enemyLog = "";
  let systemLog = "";

  // ━━━━━━━━━━━━━━━
  // PLAYER ACTIONS
  // ━━━━━━━━━━━━━━━
  if (action === "attack") {
    const result = calcDamage(atk, enemy.defense, luck);
    enemy.hp -= result.damage;

    playerLog = result.crit
      ? `CRITICAL VOID STRIKE: ${result.damage}`
      : `VOID STRIKE: ${result.damage}`;
  }

  if (action === "defend") {
    state.defendShield = def * 2.2;
    playerLog = "VOID BARRIER ACTIVATED";
  }

  if (action === "skill") {
    const result = calcDamage(atk * 2.2, enemy.defense, luck * 2);
    enemy.hp -= result.damage;

    playerLog = `ANOMALY SKILL RELEASED: ${result.damage}`;
  }

  // ━━━━━━━━━━━━━━━
  // PHASE CHECK
  // ━━━━━━━━━━━━━━━
  const phaseMsg = checkPhase(enemy);
  if (phaseMsg) systemLog = phaseMsg;

  // ━━━━━━━━━━━━━━━
  // ENEMY DEFEAT
  // ━━━━━━━━━━━━━━━
  if (enemy.hp <= 0) {
    state.ended = true;

    const coins = 70 + enemy.level * 14;
    const xp = 60 + enemy.level * 8;

    user.stats.gold = (user.stats.gold ?? 0) + coins;
    user.stats.xp = (user.stats.xp ?? 0) + xp;
    user.wins = (user.wins ?? 0) + 1;

    let storyText = "";
    if (story?.addStoryProgress) {
      const res = story.addStoryProgress(userId, 1);
      storyText = res.chapterUp
        ? `CHAPTER ASCENDED → ${res.chapter}`
        : `PROGRESS ${res.progress}/${res.needed}`;
    }

    user.activeBattle = null;
    db.save();

    state.lastAction = `${playerLog}\n${systemLog}\nVOID CONSUMED\n${storyText}`;

    return { win: true, rewards: { coins, xp }, state };
  }

  // ━━━━━━━━━━━━━━━
  // ENEMY TURN
  // ━━━━━━━━━━━━━━━
  let dmg = enemy.attack + Math.floor(Math.random() * 6);

  if (state.defendShield > 0) {
    dmg = Math.max(1, dmg - state.defendShield);
    state.defendShield = 0;
  }

  state.hpPlayer -= dmg;

  enemyLog = `VOID ENTITY STRIKES: ${dmg}`;

  // ━━━━━━━━━━━━━━━
  // PLAYER DEFEAT
  // ━━━━━━━━━━━━━━━
  if (state.hpPlayer <= 0) {
    state.ended = true;

    user.losses = (user.losses ?? 0) + 1;
    user.combat.hp = 0;

    user.activeBattle = null;
    db.save();

    state.lastAction = `${playerLog}\n${enemyLog}\nYOU WERE ERASED`;

    return { loss: true, state };
  }

  // ━━━━━━━━━━━━━━━
  // CONTINUE
  // ━━━━━━━━━━━━━━━
  state.turn++;
  state.lastAction = `${playerLog}\n${systemLog}\n${enemyLog}`;

  user.combat.hp = state.hpPlayer;
  user.activeBattle = state;

  db.save();

  return { active: true, state };
}

module.exports = {
  initBattle,
  runBattleTurn,
  generateEnemy,
  calcDamage,
  checkPhase
};
