const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAFE BAR RENDERER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function bar(current = 0, max = 1, size = 12) {
  const c = Math.max(0, Number(current));
  const m = Math.max(1, Number(max));

  const ratio = Math.min(1, c / m);
  const fill = Math.round(ratio * size);

  return `[${"█".repeat(fill)}${" ".repeat(size - fill)}] ${c}/${m}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BATTLE UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function battleUI(state) {
  if (!state) return "NO ACTIVE BATTLE";

  const enemy = state.enemy ?? {};

  const playerBar = bar(state.hpPlayer, state.maxHpPlayer);
  const enemyBar = bar(state.hpEnemy, state.maxHpEnemy);

  const log = (state.lastAction || "VOID SILENCE")
    .split("\n")
    .slice(-5)
    .map((l) => `> ${l}`)
    .join("\n");

  return [
    "STXRFALLZ // VOID BATTLE INSTANCE",
    "━━━━━━━━━━━━━━━━",
    "",
    "PLAYER",
    playerBar,
    "",
    `${enemy.name ?? "UNKNOWN ENTITY"} :: LVL ${enemy.level ?? 1}`,
    enemyBar,
    "",
    `TURN :: ${state.turn ?? 1}`,
    "",
    "LOG",
    log,
    "",
    "━━━━━━━━━━━━━━━━"
  ].join("\n");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BATTLE ACTION BUTTONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buttons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("battle_attack")
        .setLabel("ATTACK")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("battle_defend")
        .setLabel("DEFEND")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("battle_skill")
        .setLabel("SKILL")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("battle_flee")
        .setLabel("FLEE")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  battleUI,
  buttons,
  bar
};
