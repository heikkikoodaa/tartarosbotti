const axios = require('axios');
require('dotenv').config();

function containsUrl(msg) {
  msg = msg.toLowerCase();
  const regex = /https?\:\/\/(www.)?/gi;

  return regex.test(msg);
};

function containsTwitchUrl(msg) {
  msg = msg.toLowerCase();
  const regex = /https?\:\/\/(www.)?twitch.tv/gi;

  return regex.test(msg);
};

async function getGameId(gameName) {
  let data;
  await axios({
    url: 'https://api.igdb.com/v4/games',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Client-ID': process.env.CLIENT_ID,
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
    },
    data: `fields *; where name = "${gameName}";`
  })
  .then((response) => {
    data = response.data;
    return data;
  })
  .catch((err) => {
    console.error(err);
  });
  return data;
}

async function getGameArt(gameID) {
  let data;
  await axios({
    url: 'https://api.igdb.com/v4/covers',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Client-ID': process.env.CLIENT_ID,
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
    },
    data: `fields *; where game = ${gameID};`
  })
  .then((response) => {
    data = response.data;
    return data;
  })
  .catch((err) => {
    console.error(err);
  });
  return data;
};

module.exports = {
  containsUrl,
  containsTwitchUrl,
  getGameId,
  getGameArt
}