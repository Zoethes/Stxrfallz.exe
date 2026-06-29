const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n🌌 STXRFALLZ ONLINE: ${client.user.tag}\n`);
  }
};
