require('dotenv').config();

const { Client, Intents, MessageEmbed } = require('discord.js');
const { containsTwitchUrl, containsUrl } = require('./helpers');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });
const PREFIX = '!';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('!komennot');
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
  if (!newPresence.activities) return false;
  newPresence.activities.forEach(activity => {
    if (activity.type == 'STREAMING') {
      client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send(`${newPresence.user.tag} aloitti striimin osoitteessa ${activity.url}.`);
    }
  })
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const [command, ...args] = msg.content.split(' ');

  //Tarkista onko kanava striimi-ilmoitukset ja onko viestissä URL muualta kuin Twitchistä.
  if (msg.channel.id === process.env.STRIIMI_KANAVA_ID) {
    if (containsUrl(msg.content) && !containsTwitchUrl(msg.content)) {
      msg.channel.send(`${msg.author} Anteeksi, mutta tämä tekstikanava sallii vain Twitch-linkit`);
      msg.delete();
    }
  }

  //Komennot alkavat tästä
  if (command.startsWith(PREFIX)) {
    switch(command.toLowerCase()) {
      case '!twitch':
        msg.channel.send(`https://twitch.tv/${args[0]}`);
        break;
      case '!komennot':
        const infoEmbed = new MessageEmbed()
          .setTitle('Botin komennot')
          .addFields(
            { name: '!twitch', value: 'Lähettää kanavalle Twitch-linkin striimiisi. Esim. !twitch tartaroksentatit' },
            { name: '!komennot', value: 'Jos nyt on pakko tämä kertoa, niin luet tätä jo!' },
          )
          .setTimestamp()
          .setFooter({ text: 'Tartarosbotti' });
        msg.channel.send({ embeds: [infoEmbed] });
        break;
      default:
        msg.reply(`Antamaasi komentoa ${command} ei löydy. Tarkista komennot kirjoittamalla !komennot`);
    }
  }
});

client.login(process.env.BOT_TOKEN);