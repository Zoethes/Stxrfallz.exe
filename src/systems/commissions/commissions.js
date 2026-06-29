// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMISSION TASKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TASKS = [
  { task: "Read 10 pages", reward: 40 },
  { task: "Walk 20 minutes", reward: 35 },
  { task: "Write 200 words", reward: 50 },
  { task: "Train 30 minutes", reward: 60 },
  { task: "Clean workspace", reward: 30 }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE COMMISSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function create(user) {
  const c = TASKS[Math.floor(Math.random() * TASKS.length)];

  user.activeCommission = {
    task: c.task,
    reward: c.reward,
    done: false,
    created: Date.now()
  };

  return user.activeCommission;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPLETE COMMISSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function complete(user) {
  const c = user.activeCommission;
  if (!c) return null;

  user.stats.xp = (user.stats.xp || 0) + c.reward;
  user.stats.gold = (user.stats.gold || 0) + Math.floor(c.reward / 2);

  user.activeCommission = null;

  return c;
}

module.exports = {
  create,
  complete,
  TASKS
};
