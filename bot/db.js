/*
 * External modules
 */
const mongoose = require('mongoose'),
      async = require('async'),
      util = require('util'),
      schema = requireFromRoot('./bot/schema'),
      Utils = requireFromRoot('./bot/utils'),
      settings = requireFromRoot('./bot/settings'),
      Designer = mongoose.model('Designer'),
      Standup = mongoose.model('Standup'),
      Project = mongoose.model('Project'),
      Bug = mongoose.model('Bug');

class Database {


  /*
   * clearProjects: delete all projects
   * @out: count of updated and added entries, {update: N, insert: N}
   */
  static clearProjects(callback){

    Project.collection.remove(callback);
  }
  /*
   * clearDesigners: delete all desingers
   * @out: count of updated and added entries, {update: N, insert: N}
   */
  static clearDesigners(callback){

    Designer.collection.remove(callback);
  }

  /*
   * sync: helper method to asynchronously upsert an array of records
   * @in: data, array of objects to insert
   *      initiator, static that will accept each element in data and upsert
   *      callback, (optional)
   * @out: {error, {mongoose upsert object}}
   */
  static sync(data, initiator, callback){

    let calls = [];
    for (let d in data) {
      d = data[d];
      ((d) => {
        calls.push((done) => {

          initiator(d, (err, result) => {

            if (err)
              return done(err);
            done(null, result);
          });
        });
      })(d);
    }

    async.parallel(calls, (err, result) => {

      if (err)
        return callback(err);
      callback(null, result);
    });
  }

  /*
   * syncBugs: add a bug report
   * @in: report, {userId, channelId, report}
   *      callback, (optional)
   * @out: updated bug report
   */
  static syncBugs(report, callback){

    report = new Bug(report);
    report.save(callback);
  }

  /*
   * getReports: return either one user or all of them IF you have the privileges as specified in
   * @in: user, '' (can be username or id)
   *      callback, (optional)
   * @out: reports array, formatted as a slack attachment
   */
  static getReports(user, callback){

    let match = [
      {
        $match: {
          channelId: user.channelId,
        }
      },
      {
        $sort: {'date': -1}
      },
      {
        $lookup:{
          from: 'designers',
          localField: 'slackId',
          foreignField: 'slackId',
          as: 'designer'
        }
      },
      {
        $project: {
          realName: {$arrayElemAt: [ '$designer.realName', 0 ]},
          slackId: {$arrayElemAt: [ '$designer.slackId', 0 ]},
          color: {$arrayElemAt: [ '$designer.color', 0 ]},
          name: {$arrayElemAt: [ '$designer.name', 0 ]},
          standup: {
              date: '$date',
              text: '$text',
              daysAgo : {
                $subtract: [
                  { $dayOfMonth: new Date() },
                  { $dayOfMonth: '$date' },
                ]
              }
          }
        }
      },
    ];


    if(user.timePeriod === 'week' || user.timePeriod === 'month'){ //report for the week or month

      match.push({
        $group: {
          _id: '$realName',
          realName: { $first: '$realName'},
          slackId: { $first: '$slackId'},
          color: { $first: '$color'},
          name: { $first: '$name'},
          standups: { $addToSet: '$standup' }
        }
      });

      let time = user.timePeriod === 'week' ? 7 : 30;
      match.push({
        $project: {
          realName: 1,
          slackId: 1,
          color: 1,
          name: 1,
          standups: { $slice: ['$standups', time] },
        }
      });

    }else{//report for 'today', the default
      match.push({
        $group: {
          _id: '$realName',
          realName: { $first: '$realName'},
          slackId: { $first: '$slackId'},
          color: { $first: '$color'},
          name: { $first: '$name'},
          standup: { $first: '$standup' },
        }
      });
    }

    if(user.reporterName)
      match.push({
        $match: {
          name: Utils.formatSlackId(user.reporterName),
        }
      });

    Standup.aggregate(match, (err, result) => {

      if(err)
        return callback(err);
      callback(null, result);
    });
  }


  [REDACTED] 