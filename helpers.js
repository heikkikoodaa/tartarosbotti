function containsUrl(msg) {
  msg = msg.toLowerCase();
  const regex = /https?\:\/\/(www.)?/gi;

  return regex.test(msg);
};

function containsTwitchUrl(msg) {
  msg = msg.toLowerCase();
  const regex = /https?\:\/\/(www.)?twitch.tv/gi;

  return regex.test(msg);
}

module.exports = {
  containsUrl,
  containsTwitchUrl
}