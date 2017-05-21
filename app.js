requireFromRoot = (function(root) {
  return function(resource){
    return require(root + '/' + resource);
  }
})(__dirname);

const SlackBot = require('./bot/bot');

const bot = new SlackBot({
  log: true
});
bot.init();
