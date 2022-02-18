require('dotenv').config();

const { Client, Intents, MessageEmbed } = require('discord.js');
const { containsTwitchUrl, containsUrl, getGameArt, getGameId } = require('./helpers');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });
const PREFIX = '!';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('!komennot');
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
  // if (!newPresence.activities) return false;
  // newPresence.activities.forEach(activity => {
  //   if (activity.type == 'STREAMING') {
  //     getGameId(activity.state).then((Id) => {
  //       if (Id.length > 0) {
  //         getGameArt(Id[0].id).then((coverData) => {
  //           let url = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData[0].image_id}.jpg`;
  //           const streamEmbed = new MessageEmbed()
  //             .setTitle(activity.details)
  //             .addFields(
  //               { name: 'Peli', value: `${activity.state}` },
  //             )
  //             .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
  //             .setImage(url)
  //             .setTimestamp();
  //           client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
  //             content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${activity.url}.`,
  //             embeds: [streamEmbed]
  //           });
  //         });
  //       } else {
  //         const streamEmbed = new MessageEmbed()
  //           .setTitle(activity.details)
  //           .addFields(
  //             { name: 'Peli', value: `${activity.state}` },
  //           )
  //           .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
  //           .setImage(newPresence.user.avatarURL())
  //           .setTimestamp();
  //         client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
  //           content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${activity.url}.`,
  //           embeds: [streamEmbed]
  //         });
  //       }
  //     });
  //   };
  // });
  if (!newPresence.activities) return false;

  if (oldPresence.activities.length == 0 || oldPresence.activities[0].type == 'CUSTOM') {
    if (!newPresence.activities.length == 0) {
      if (newPresence.activities[0].type == 'STREAMING') {
        getGameId(newPresence.activities[0].state).then((Id) => {
          if (Id.length > 0) {
            getGameArt(Id[0].id).then((coverData) => {
              let url = `https://images.igdb.com/igdb/image/upload/t_720p/${coverData[0].image_id}.jpg`;
              const streamEmbed = new MessageEmbed()
                .setTitle(newPresence.activities[0].details)
                .addFields(
                  { name: 'Peli', value: `${newPresence.activities[0].state}` },
                )
                .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
                .setImage(url)
                .setTimestamp();
              client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
                content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${newPresence.activities[0].url}.`,
                embeds: [streamEmbed]
              });
            });
          } else {
            const streamEmbed = new MessageEmbed()
              .setTitle(newPresence.activities[0].details)
              .addFields(
                { name: 'Peli', value: `${newPresence.activities[0].state}` },
              )
              .setAuthor({ name: `${newPresence.user.username}`, iconURL: `${newPresence.user.avatarURL()}` })
              .setImage(newPresence.user.avatarURL())
              .setTimestamp();
            client.channels.cache.get(process.env.STRIIMI_KANAVA_ID).send({
              content: `Hei kaikki! ${newPresence.user.tag} aloitti striimin osoitteessa ${newPresence.activities[0].url}.`,
              embeds: [streamEmbed]
            });
          }
        });
      }
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