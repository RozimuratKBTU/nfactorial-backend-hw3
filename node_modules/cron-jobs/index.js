var cronLib = require('crontab'),
    Q = require('q'),
    _ = require('underscore');

function Cron(identifier) {
  this.crontab = Q.nfcall(cronLib.load);
  this.identifier = identifier;
  this.variables = {};
  this._heap = {};

  this
    .set('job_template', '<%= environment_variables %>/bin/bash -l -c \'<%= job %>\'')
    .set('output', '>> ./log/cron.log 2>&1')
    .set('path', process.cwd())
    .set('environment_variables', function() {
      return _.reduce(_.map(
          this._val('environmentVariables') || {},
          function(value, key) { return '' + key + '="' + value + '"'; }
        ), function(memo, value) { return memo + value + ' '; }, '');
    })
    .set('environment_variable', 'NODE_ENV')
    .set('environment', 'production')
    .jobType('command', '<%= task %> <%= output %>');
}

Cron.prototype.removeAll = function() {
  return this._enqueue(function(crontab) {
    crontab.remove({comment: this.identifier});
  });
};

Cron.prototype.save = function() {
  return this._enqueue(function(crontab) {
    crontab.save();
  });
};

Cron.prototype.set = function(key, value) {
  this.variables[key] = value;

  return this;
};

Cron.prototype.env = function(name, value) {
  value = value || process.env[name];
  var environmentVariables = this._val('environmentVariables') || {};
  environmentVariables[name] = value;
  this._val('environmentVariables', environmentVariables);

  return this;
};

Cron.prototype.jobType = function(name, command) {
  var _this = this;
  _this[name] = function(task) {
    var variables = _.extend({}, _this.variables);
    _.each(variables, function(value, key) {
      if (_.isFunction(value)) variables[key] = value.call(_this);
    });
    variables.task = task;
    variables.job = _.template(command)(variables);

    return _.template(variables.job_template)(variables);
  };
  return this;
};

Cron.prototype.schedule = function(whenCallback, actions) {
  return this._enqueue(function(crontab) {
    var when, job, action;

    if (!_.isArray(actions)) {
      actions = [actions];
    }

    if (!_.isFunction(whenCallback)) {
      when = whenCallback;
      whenCallback = null;
    }

    for(var i = 0; i < actions.length; i++) {
      job = crontab.create(actions[i], when, this.identifier);

      if (whenCallback) {
        whenCallback(job);
      }
    }
  });
};

Cron.prototype._enqueue = function(fn) {
  var _this = this;
  this.crontab = this.crontab.then(function(crontab) {
    fn.call(_this, crontab);
    return crontab;
  });
  return this;
};

Cron.prototype._val = function(key) {
  if (arguments.length == 2) {
    this._heap[key] = arguments[1];
  }

  return this._heap[key];
};

function CronJobs(tasksFile, identifier) {
  this.tasksFile     = tasksFile;
  this.identifier    = identifier;
  this.tasksFunction = require(this.tasksFile);
  this.cron          = new Cron(this.identifier);
}

CronJobs.prototype.clear = function() {
  this.cron.removeAll();
  this.cron.save();
};

CronJobs.prototype.add = function() {
  this.tasksFunction(this.cron);
  this.cron.save();
};

module.exports = CronJobs;
