 
class Scheduler {

  constructor(jobFunction) {
    this.scheduledJobs = {};
    this.nodeScheduler = require('node-schedule');
    this.jobFunction = jobFunction;
  }

  /*
   * scheduleJobs: create node-schedules for all standups
   * @in: n/a
   * @out: all standups with schedules get initiated. used by the setup function.
   */
  scheduleJobs(jobs) {

    const self = this;
    jobs.forEach((job, i) => {
      if (job.channelId && job.schedule) self.scheduleJob(job.channelId, job.schedule);
    });
  }

  /*
   * scheduleJob: create scheduled cron job
   * @in: channelId: channelId of the project to schedule
   *      schedule: schedule object {hour, minute}
   * @out: a standup gets scheduled
   */
  scheduleJob(job) {
    const self = this;
    const channelId = job.channelId,
          schedule = job.schedule;

    if (this.scheduledJobs[channelId]) {
      this.scheduledJobs[channelId].cancel();
      delete this.scheduledJobs[channelId];
    }
    if (schedule) {
      const cron = `${schedule.minute} ${schedule.hour} * * ${settings.WEEKDAYS}`;
      this.scheduledJobs[channelId] = this.nodeScheduler.scheduleJob(cron, () => self.jobFunction(channelId));
    }
  }

  /*
   * unscheduleJob
   * @in: channelId: channelId of the project to schedule
   * @out: a standup gets unscheduled
   */
  unscheduleJob(job) {
    scheduleJob({ channelId: job.channelId, schedule: null });
  }

}

module.exports = Scheduler;
