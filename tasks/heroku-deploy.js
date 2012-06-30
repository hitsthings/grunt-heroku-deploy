/*
 * grunt-heroku-deploy
 * https://github.com/hitsthings/grunt-heroku-deploy
 *
 * Copyright (c) 2012 Adam Ahmed
 * Licensed under the MIT license.
 */

var spawn = require('child_process').spawn;

function pipeAll(proc) {
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

function allOutput(proc, next) {
  var out = '';
  proc.stdout.on('data', function(data) { out += data; });
  proc.stdout.on('end', function() {
    next(null, out);
  });
}

function doDeploy(originRef, deployRef, next) {
  pipeAll(spawn('git', ['checkout', deployRef])).on('exit', function() {
    pipeAll(spawn('git', ['merge', originRef])).on('exit', function() {
      pipeAll(spawn('git', ['push'])).on('exit', function() {
        pipeAll(spawn('git', ['checkout', originRef])).on('exit', function() {
          next();
        });
      });
    });
  });
}

function getCurrentBranch(next) {
  allOutput(spawn('git', ['branch']), function(err, out) {
    if (err) {
      return next(err);
    }

    var newline, current, branch;
    if (out[0] === '*') {
      current = -1;
    } else {
      current = out.indexOf('\n*');
    }
    if (!~current) {
      return next(new Error("Current branch could not be determined."));
    }

    current++;

    newline = out.indexOf('\n', current);
    branch = out.substring(current + 2, ~newline ?  newline : undefined);

    next(null, branch === '(no branch)' ? null : branch);
  });
}

function getCurrentCommitHash(next) {
  allOutput(spawn('git', ['log', '-1', '--format=format:"%H"']), function(err, out) {
    next(err, out && out.replace(/\n|\r/g, ''));
  });  
}

module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('heroku-deploy', 'Switch to the deploy branch, merge your starting location, push, and switch back', function() {
    grunt.log.write(
      grunt.helper(
        'heroku-deploy',
        grunt.config(['heroku-deploy', this.target, 'deployBranch']),
        this.async()
      )
    );
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('heroku-deploy', function(deployBranch, next) {
    deployBranch = deployBranch || 'deploy';

    getCurrentBranch(function(err, branch) {
      if (err) {
        return next(err);
      }

      if (!branch) {
        console.log('No current branch');

        getCurrentCommitHash(function(err, csid) {
          if (err) {
            return next(err);
          }

          console.log('Using ' + csid + ' as ref to merge.');
          doDeploy(csid, deployBranch, next);
        });
      } else {
        console.log('Current branch is ' + branch);
        doDeploy(branch, deployBranch, next);
      }
    });
  });

};
