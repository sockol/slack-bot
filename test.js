/*
 * Global require helper
 */
requireFromRoot = (function(root) {
  return function(resource){
    return require(root + '/' + resource);
  }
})(__dirname);

/*
 * Error message wrapper
 */
e = (function(str) {
  return new Error(str);
});

/*
 * Emulate the bot object for testing
 */
FakeBot = {
  replyPrivate: function(){},
  replyPrivateDelayed: function(){},
  replyAcknowledge: function(){},
}

const settings = requireFromRoot('./bot/settings'),
      bot = requireFromRoot('./bot/bot'),
      env = requireFromRoot('./bot/env')();

const slackName = process.env.SLACK_NAME ? process.env.SLACK_NAME : settings.SLACK_SERVICE_NAME;
const slackCreds = env.getService(slackName).credentials;
const slackToken = slackCreds.SLACK_TOKEN;


SlackBot = new bot({
  debug: false,
  log: false,
  rtm: true, //need this to get botId set
  json_file_store: __dirname + '/bot/botdb',
});


describe('StandyTheSlackBot', function() {

 /*
  * Prep db before testing
  */
 before('Starting bot init()', function(done) {
   this.timeout(0);
   SlackBot.init(done);
 });
 it('all tests', function(){

  //  TODO: test more bot.js functions with this: https://github.com/gratifyguy/botkit-mock/blob/master/examples/botkit-starter-slack/tests/sample_events_mochaSpec.js
   require('./test/api.js');
   require('./test/bot.js');
   require('./test/utils.js');
 });
});
