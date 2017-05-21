
const settings = requireFromRoot('./bot/settings'),
      async = require('async'),
      BaseClass = require('./base'),
      env = requireFromRoot('./bot/env')();

const slackName = process.env.SLACK_NAME ? process.env.SLACK_NAME : settings.SLACK_SERVICE_NAME;
const slackCreds = env.getService(slackName).credentials;
const slackToken = slackCreds.SLACK_TOKEN;
const botToken = slackCreds.BOT_TOKEN;

class SlackApi extends BaseClass{

  constructor(options = {}){
    super();

    this.bot = options.bot;
    this.botId = options.botId;
    this.log = options.log || false;

    // bing `this` to SlackBot instead of function that called method which calls this, fixes recursion
    const classMethods = this._getClassMethods(this);
    this._bind(...classMethods);
  }


  /*
   * init: initiate a bot
   * @in: bot: botkit slack bot spawned instance
   */
  init(callback){
    const self = this;

    self.bot.api.team.info({}, (err, res) => {
      if(err)
        self.log && term.red('`ERROR - team.info could not be saved`');
      callback(err, res);
    });
  }


  /*
   * getChannelsHelper: get list of slack channels [private and public] with detailed info
   * @in: type: channels|groups
   *      callback: callback (optional)
   * @out: [list of channel info], format: https://api.slack.com/methods/channels.list, https://api.slack.com/methods/groups.list
   */
  getChannelsHelper(type, callback){

    const self = this;

    self.bot.api[type].list({
      token: slackToken,
      exclude_archived: true,
      // exclude_members: true,
    }, (err, channels) => {
      if(err)
        return callback(err);
      channels = channels[type];

      let arr = [];
      for (let d in channels) {
        d = channels[d];
        if(d.members && d.members.includes(self.botId))
          arr.push(d);
      }

      callback(null, arr);
    });
  }

  /*
   * getChannels: get list of slack channels with detailed info
   * @in: callback: callback (optional)
   * @out: [list of channel info], format: https://api.slack.com/methods/channels.list, https://api.slack.com/methods/groups.list
   */
  getChannels(callback){

    const self = this;
    self.getChannelsHelper('channels', (errPublic, channelsPublic) => {

      self.getChannelsHelper('groups', (errPrivate, channelsPrivate) => {

        const channels = channelsPublic.concat(channelsPrivate);
        if(errPrivate || errPublic)
          return callback ? callback({errPrivate, errPublic}) : false;
        return callback ? callback(null, channels) : true;
      });
    });

  }

  /*
   * channelHasBot: check if channel has the bot installed
   * @in: callback: callback (optional)
   * @out: true|false
   */
  channelHasBot(channelId, callback){
    const self = this;
    this.getChannel(channelId, (err, channel) => { 
      return  !channel ? callback(err) :
              channel.members.includes(self.botId) ? callback(null, true) :
              callback(null, false);
    });
  }

  /*
   * getChannel: get a slack channel with detailed info
   * @in: callback: callback
   *      type: channels|groups
   * @out: channel info, format: https://api.slack.com/methods/channels.info
   */
  getChannelHelper(channelId, type, callback){
    const self = this;
    self.bot.api[type].info({
      token: slackToken,
      channel: channelId
    }, (err, channel) => {

      return err && err !== 'channel_not_found' ? callback(err) :
             err && err === 'channel_not_found' ? callback(false) :
             type === 'groups' ? callback(null, channel.group) :
             callback(null, channel.channel);
    });
  }

  /*
   * getChannel: get a slack channel with detailed info
   * @in: callback: callback
   * @out: channel info, format: https://api.slack.com/methods/channels.info
   */
  getChannel(channelId, callback){
    const self = this;
    self.getChannelHelper(channelId, 'channels', (err, channel) => {

      if(channel)
        return callback(null, channel);
      if(err && err !== false)
        return callback(err);

      if(err === false)
        self.getChannelHelper(channelId, 'groups', (err, group) => {

          if(err || err === false)
            return callback(err);

          return callback(null, group);
        });
    });
  }

  /*
   * removeUser: kick user out of a channel
   * @in: userId: slack user id
   *      channelId: slack channel id
   *      callback: callback (optional)
   * @out: (err, success), info: https://api.slack.com/methods/channels.kick
   */
  removeUser(userId, channelId, callback){
    const self = this;
    self.bot.api.channels.kick({
      token: slackToken,
      user: userId,
      channel: channelId,
    }, (err, res, body) => {

      if(err)
        return callback(err);

      callback(null, true);
    });
  }

  /*
   * getUser: get detailed user info
   * @in: userId: slack user id
   *      callback: callback (optional)
   * @out: (err, success), info: https://api.slack.com/methods/users.info
   */
  getUser(userId, callback){
    var self = this;
    self.bot.api.users.info({
      token: slackToken,
      user: userId
    }, (err, user) => {

      if(err)
        return callback(err);

      callback(null, user);
    });
  }

  /*
   * getUsers: get users info
   * @in: callback: callback (optional)
   * @out: (err, success), info: https://api.slack.com/methods/users.list
   */
  getUsers(callback){

    var self = this;
    self.bot.api.users.list({
      token: slackToken,
    }, (err, user) => {

      if(err)
        return callback(err);
      user = user.members;
      callback(null, user);
    });
  }


  /*
   * updateMessage: update a message
   * @in: timestamp: the message's timestamp
   *      channelId: the id of the channel that the message is in
   *      message: { text, attachments }
   *      callback: callback(optional)
   * @out: (err, success), info: https://api.slack.com/methods/chat.update
   */
  updateMessage(timestamp, channelId, message, callback) {

    this.bot.api.chat.update({
      token: botToken,
      ts: timestamp,
      channel: channelId,
      text: message.text,
      attachments: message.attachments,
    }, callback);
  }
};

module.exports = SlackApi;
