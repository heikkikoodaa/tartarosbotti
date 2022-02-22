require('dotenv').config();

const { Client, Intents, MessageEmbed } = require('discord.js');
const { containsTwitchUrl, containsUrl, getGameArt, getGameId } = require('./helpers');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });
const PREFIX = '!';
const DEFAULT_EXPIRATION = 28800;
const Redis = require('redis');
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});
(async () => {
  await redisClient.connect();

  redisClient.on('error', (err) => console.error(`Redis Client Error: ${err}`));
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('!komennot');
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  const {displayName: username} = newPresence.member;

  //Tarkista striimin loputtua löytyykö käyttäjä Redisin muistista
  if (newPresence.member.presence.activities.length == 0 || newPresence.member.presence.activities.length == 1 && newPresence.member.presence.activities[0].type == 'CUSTOM') {
    const userStreaming = await redisClient.get(username);
    //Jos käyttäjä löytyy muistista, striimi on ollut meneillään ja käyttäjä lopettaa striimin
    if (userStreaming != null) {
      redisClient.del(username);
      console.log(`User ${username} stopped streaming!`);
    } else {
      return;
    }
  }

  //Tarkista onko käyttäjän uusi tila 'STREAMING' ja että uusi aktiviteettilista ei ole tyhjä
  if (newPresence.member.presence.activities.length > 0 && newPresence.member.presence.activities[0].type == 'STREAMING') {
    //Tarkista löytyykö käyttäjä jo muistista - jos ei, käyttäjä aloittaa striiminsä ja kanavalle lähetetään ilmoitus
    const userStreaming = await redisClient.get(username);
    if (userStreaming == null) {
      await redisClient.setEx(username, DEFAULT_EXPIRATION, newPresence.member.presence.activities[0].state);
      console.log(`User ${username} started streaming!`);
      const {state: gameName, url: activityUrl, details} = newPresence.member.presence.activities[0];
      getGameId(gameName).then((Id) => {
        if (Id.length > 0) {
          getGameArt(Id[0].id).then((coverData) => {
            let url = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData[0].image_id}.jpg`;
            const streamEmbed = new MessageEmbed()
              .setTitle(details)
              .addFields(
                { name: 'Peli', value: `${gameName}` },
              )
              .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
              .setImage(url)
              .setTimestamp();
            client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
              content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${activityUrl}.`,
              embeds: [streamEmbed]
            });
          });
        } else {
          const streamEmbed = new MessageEmbed()
            .setTitle(details)
            .addFields(
              { name: 'Peli', value: `${gameName}` },
            )
            .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
            .setImage(newPresence.user.avatarURL())
            .setTimestamp();
          client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
            content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${activityUrl}.`,
            embeds: [streamEmbed]
          });
        }
      });
    } else {
      return;
    }
  }

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