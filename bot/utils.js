const SlackApi = require('./api'),
      util = require('util'),
      dateFormat = require('dateformat');

class Utilities {


  /*
   * log: deep print
   * @in: obj: object
   * @out: printed obj
   */
  static log(obj){

    console.log(util.inspect(obj, false, null));
  }

  /*
   * formatSlackId: convert @username to username
   * @in: slackName: formatted username
   * @out: plain slackName
   */
  static formatSlackId(slackName){

    const isFormatted = slackName[0] == '@';
    return isFormatted ? slackName.substring(1, slackName.length) : slackName;
  }

  /*
   * parseTime: parses an hour:minute time
   * @in: timeString: string in format "<hour>:<minute>"
   * @out: object in format { hour: <hour>, minute: <minute> }
   */
  static parseTime(timeString) {

    timeString = timeString.toLowerCase();
    const regex = /([0-2][0-3]|0?[1-9]):?([0-5][0-9])?([ap]m)?/;
    const time = regex.exec(timeString);
    if (!time)
      return false;

    let hour = time[1] ? parseInt(time[1]) : false;
    let minute = time[2] ? parseInt(time[2]) : 0;
    let period = time[3];

    if (hour === false)
      return false;
    if (hour > 12)
      return { hour, minute };

    hour = period === 'pm' ? hour + 12 :
           period === 'am' && hour === 12 ? 0 :
           hour;

    return { hour, minute };
  }

  [REDACTED] 