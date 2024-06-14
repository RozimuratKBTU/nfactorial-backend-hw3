# cron-jobs

Command line tool for managing cron jobs for application.
Inspired by https://github.com/javan/whenever

## Installation

```sh
$ npm install cron-jobs
```

## Example of `cron-jobs.js`

```javascript
module.exports = function (cron) {
  cron
    // set any variable you want
    .set('whenever_command', 'bundle exec whenever')
    // attach any environment variable to jobs
    .env('PATH')
    // or simply define environment variable
    .env('HELLO', 'WORLD')

    //define job types
    .jobType('rake',    'cd <%= path %> && <%= environment_variable %>=<%= environment %> bundle exec rake <%= task %> --silent <%= output %>')
    .jobType('runner',  'cd <%= path %> && script/rails runner -e <%= environment %> "<%= task %>" <%= output %>')

    //schedule defining time in node-crontab syntax
    .schedule(function(j) {
      j.minute().at(30);
      j.hour().at(9);
      j.dom().on(24);
      j.month().in('dec');
    }, [
      cron.command('echo "you can use raw cron syntax too"'),
      cron.rake('db:drop'),
      cron.runner('hello()')
    ])
    // or simply pass date object
    .schedule(new Date(), cron.command('ls -la'))
    // or use crontab syntax
    .schedule('0 3 * * *', cron.command('echo "hello"'))
    .schedule(function(j) {
      j.hour().every(2);
    }, cron.command('echo "Hello" | mail "mail@example.com"'));
};
```
