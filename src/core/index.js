require("dotenv").config();

const { Events } = require("discord.js");
const client = require("./client");
const { loadEvents } = require("./loaders/eventLoader");
const { loadCommands } = require("./loaders/commandLoader");
const db = require("./database");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE SYSTEMS (for backwards compatibility)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// These will be migrated to /systems as modules are added
const autosave = require("./autosave");
const corexp = require("./corexp");
const currency = require("./currency");
const help = require("./help");
const story = require("./story");
const combat = require("./combat");
const pve = require("./pve");
const loot = require("./loot");
const ui = require("./ui");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOOTSTRAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(async () => {\n  try {\n    console.log("⚙️  Initializing STXRFALLZ.EXE...");\n\n    // Load events\n    await loadEvents(client);\n    console.log("✅ Events loaded");\n\n    // Load commands\n    await loadCommands(client);\n    console.log("✅ Commands loaded");\n\n    // Login\n    await client.login(process.env.DISCORD_TOKEN);\n  } catch (err) {\n    console.error("❌ FATAL ERROR:", err);\n    process.exit(1);\n  }\n})();\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// COMMAND ROUTER (BACKWARDS COMPAT)\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nclient.on(Events.InteractionCreate, async (i) => {\n  if (!i.isChatInputCommand()) return;\n\n  // Skip if command loader already handled it\n  if (client.commands.has(i.commandName)) return;\n\n  await i.deferReply();\n\n  const user = db.getUser(i.user.id);\n\n  try {\n    // ─────────────────────\n    // HELP\n    // ─────────────────────\n    if (i.commandName === "help") {\n      return i.editReply(help.help());\n    }\n\n    // ─────────────────────\n    // PROFILE\n    // ─────────────────────\n    if (i.commandName === "profile") {\n      return i.editReply({\n        content:\n          `👤 ${user.name}\\n` +\n          `Lvl: ${user.stats?.level || 1}\\n` +\n          `XP: ${user.stats?.xp || 0}\\n` +\n          `Gold: ${user.stats?.gold || 0}`\n      });\n    }\n\n    // ─────────────────────\n    // PVE BATTLE\n    // ─────────────────────\n    if (i.commandName === "pve") {\n      const state = pve.initBattle(i.user.id);\n      return i.editReply({\n        content: state.lastAction || "Battle started.",\n        components: []\n      });\n    }\n\n    // ─────────────────────\n    // QUICK BATTLE\n    // ─────────────────────\n    if (i.commandName === "battle") {\n      const state = combat.startBattle(i.user.id, user);\n      return i.editReply({\n        content: state?.lastAction || "Battle initialized.",\n        components: []\n      });\n    }\n\n    // ─────────────────────\n    // LOOT SYSTEM\n    // ─────────────────────\n    if (i.commandName === "loot") {\n      const drop = loot.rollLoot(user);\n      db.save();\n      return i.editReply(`🎁 ${drop.primary.name} (${drop.primary.rarity})`);\n    }\n\n    // ─────────────────────\n    // DAILY REWARD TEST\n    // ─────────────────────\n    if (i.commandName === "daily_test") {\n      corexp.addXP(user, 25);\n      currency.addCurrency(user, 50);\n      db.save();\n      return i.editReply("💰 +50 gold | ⚡ +25 XP");\n    }\n  } catch (err) {\n    console.error("COMMAND ERROR:", err);\n    return i.editReply("❌ System failure. Try again.");\n  }\n});\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// BUTTON HANDLER\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nclient.on(Events.InteractionCreate, async (i) => {\n  if (!i.isButton()) return;\n  console.log(`Button pressed: ${i.customId}`);\n});\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// GLOBAL ERROR HANDLERS\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nclient.on(\"error\", (err) => console.error(\"❌ CLIENT ERROR:\", err));\nprocess.on(\"unhandledRejection\", (err) => console.error(\"❌ UNHANDLED REJECTION:\", err));\nprocess.on(\"uncaughtException\", (err) => console.error(\"❌ UNCAUGHT EXCEPTION:\", err));\n\nmodule.exports = client;\n