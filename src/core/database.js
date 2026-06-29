const fs = require("fs");
const path = require("path");

const SAVE_FILE = path.join(__dirname, "../../data/save.json");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MEMORY CACHE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let DATA = {
  users: {},
  alliances: {}
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENSURE DATA DIR EXISTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DATA_DIR = path.dirname(SAVE_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function load() {
  if (!fs.existsSync(SAVE_FILE)) {
    fs.writeFileSync(SAVE_FILE, JSON.stringify(DATA, null, 2));
    return;
  }

  try {
    DATA = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
  } catch {
    console.log("⚠️  SAVE FILE CORRUPTED → RESETTING");
    DATA = { users: {}, alliances: {} };
  }
}

load();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAVE (DEBOUNCED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let saveQueued = false;
let saveTimeout = null;

function save() {
  if (saveQueued) return;

  saveQueued = true;

  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(SAVE_FILE, JSON.stringify(DATA, null, 2));
      console.log("💾 Database saved");
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
    saveQueued = false;
  }, 800);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER ACCESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getUser(id) {
  if (!DATA.users[id]) {
    DATA.users[id] = {
      id,
      name: "STXR",
      xp: 0,
      gold: 0,
      wins: 0,
      losses: 0,

      stats: {
        level: 1,
        xp: 0,
        streak: 0,
        gold: 0
      },

      skills: {},
      inventory: [],

      activeBattle: null,
      alliance: null,
      gachaPulls: 10,
      lastRegen: Date.now()
    };

    save();
  }

  return DATA.users[id];
}

// alias safety (for older code)
const saveUser = getUser;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALLIANCE ACCESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getAlliance(id) {
  return DATA.alliances[id];
}

function setAlliance(id, data) {
  DATA.alliances[id] = data;
  save();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL SAVE (FORCE FLUSH)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function flush() {
  try {
    fs.writeFileSync(SAVE_FILE, JSON.stringify(DATA, null, 2));
    console.log("💾 Emergency flush complete");
  } catch (err) {
    console.error("❌ Flush failed:", err);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = {
  getUser,
  saveUser,
  save,
  flush,
  getAlliance,
  setAlliance,
  DATA,
  load
};
