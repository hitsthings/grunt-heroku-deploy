/*
 * grunt-heroku-deploy
 * https://github.com/hitsthings/grunt-heroku-deploy
 *
 * Copyright (c) 2012 Adam Ahmed
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  "use strict";

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md
  
  // ==========================================================================
  // INIT
  // ==========================================================================
  
  var herokuDeploy = require('./lib/heroku-deploy').init(grunt);

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('heroku-deploy', 'Switch to the deploy branch, merge your starting location, push, and switch back', function() {
    var next = this.async();
    grunt.log.write(
      herokuDeploy['deploy'](
        grunt.config(['heroku-deploy', this.target]),
        function(err) {
          if (err) {
            grunt.log.error(err.message);
            return next(false);
          }
          next();
        }
      )
    );
  });

};
