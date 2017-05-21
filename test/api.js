

/*
 * External modules
 */
const assert = require('assert'),
      term = require( 'terminal-kit' ).terminal,
      settings = requireFromRoot('./bot/settings'),
      Scheduler = requireFromRoot('./bot/scheduler'),
      env = requireFromRoot('./bot/env')();

const slackName = process.env.SLACK_NAME ? process.env.SLACK_NAME : settings.SLACK_SERVICE_NAME;
const slackCreds = env.getService(slackName).credentials;
const slackToken = slackCreds.SLACK_TOKEN;


/*
 * SlackApi class tests
 */
describe('SlackApi', function() {

  describe('getChannels', function() {

    it('Get all channels in parallel', function(done) {

      SlackBot.SlackApi.getChannels(done);
    });
  });

  describe('channelHasBot', function() {
    this.timeout(0);

    let channelId = null;
    function getChannelId(callback){

      SlackBot.SlackApi.getChannels(function(err, result) {

        channelId = result && result.length ? result[0].id : false;
        callback(null, channelId);
      });
    }

    before('Pick a channel to test channelHasBot with', function(done){

      getChannelId(function(err, id){

        channelId = id;

        if(!channelId)
          return done(e('ChannelId is undefined, can\'t run this test'));

        SlackBot.bot.api.channels.invite({
          token: slackToken,
          channel: channelId,
          user: SlackBot.botId
        }, function(err, success){
          if(err && err !== 'already_in_channel')
            return done(e(`Could not add bot to channel ${channelId}, error: ${err}`));
          done(null, true);
        });
      });
    });

    it(`Check if channel has a bot`, function(done) {

      SlackBot.SlackApi.channelHasBot(channelId, function(err, hasBot){
        if(err)
          return done(e(`channelHasBot failed. error: ${err}`));
        if(hasBot === false)
          return done(e(`channelHasBot returned ${hasBot}, expected ${!hasBot}`));
        done(null, true);
      });
    });


    it(`Remove bot from channel, check if it still has a bot`, function(done) {
      this.timeout(0);

      SlackBot.bot.api.channels.kick({
        token: slackToken,
        channel: channelId,
        user: SlackBot.botId
      }, function(err, success){
        if(err && err !== 'already_in_channel')
          return done(e(`Could not add bot to channel ${channelId}, error: ${err}`));

        SlackBot.SlackApi.channelHasBot(channelId, function(err, hasBot){
          if(err)
            return done(e(`channelHasBot failed. error: ${err}`));
          if(hasBot === true)
            return done(e(`channelHasBot returned ${hasBot}, expected ${!hasBot}`));
          done(null, true);
        });
      });
    });
  });
  // test cases
});
