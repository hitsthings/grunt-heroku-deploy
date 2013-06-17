/*
 * grunt-heroku-deploy
 * https://github.com/hitsthings/grunt-heroku-deploy
 *
 * Copyright (c) 2012 Adam Ahmed
 * Licensed under the MIT license.
 */
"use strict";

var cp = require('child_process');
var spawn = cp.spawn;
var exec = cp.exec;

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

function trim(str){
  return str.replace(/^\s+/,'').replace(/\s+$/,'');
}

function tagExists(tag,next){
   exec('git tag | grep ' + tag,function(err,stdout,stderr){
     if(trim(stdout) === tag){
       next(true);
     } else {
       next(false);
     }
   });
}

function makeReleaseTag(grunt,opts,next){
  tagExists(opts.tag,function(exists){
    if(exists && !opts.force){
      return next(new Error('Error: tag already exists, but force was not specified.'));
    } else if(exists){
      return next();
    }
    pipeAll(spawn('git',['tag',opts.tag])).on('exit',function(){
      if(!opts.pushTagTo || !opts.pushTagTo.length){
        return next();
      }
      grunt.util.async.forEach(opts.pushTagTo,function(remote,done){
        pipeAll(spawn('git',['push',remote,opts.tag])).on('exit',done);
      },next);
    });
  });
}

function doDeploy(grunt, options, tagOpts, next) {
 if(typeof tagOpts !== 'function'){
   return makeReleaseTag(grunt,tagOpts,doDeploy.bind(null,grunt,options,next));
 } else {
   if(next instanceof Error){
     return tagOpts(next);
   }
   next = tagOpts;
 }
 var originRef = options.originRef;
 var deployRef = options.deployRef;
 var push = function(done){
   var pushArgs = ['push'];
   if(options.deployTag){
     if(options.force){
       pushArgs.push('-f');
     }
     pushArgs.push(options.herokuRemote || 'heroku');
     pushArgs.push(options.deployTag+'^{}:master');
   } else if(options.herokuRemote){
     pushArgs.push(options.herokuRemote);
   }
   pipeAll(spawn('git', pushArgs)).on('exit', done);
 };
 if(options.deployTag){
   push(function(){
     next();
   });
 } else {
   pipeAll(spawn('git', ['checkout', deployRef])).on('exit', function() {
     pipeAll(spawn('git', ['merge', originRef])).on('exit', function(){
       push(function(){
         pipeAll(spawn('git', ['checkout', originRef])).on('exit', function() {
           next();
         });
       });
     });
   });
  }
}

function getCurrentBranch(next) {
 allOutput(spawn('git', ['branch']), function(err, out) {
   if (err) {
     return next(err);
   }

   var newline, current, branch;
   if (out[0] === '*') {
     current = 0;
   } else {
     current = out.indexOf('\n*') + 1;
     if (!current) {
       return next(new Error("Current branch could not be determined."));
     }
   }

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

exports.init = function(grunt){
  var exports = {};
  
  exports['deploy'] = function(options, next){
    options = options || {};
    var deployArgs;
    if(options.deployTag){
      options.deployRef = options.deployTag || "deploy";
      options.tag = options.deployRef;
      deployArgs = [grunt,options,{
        tag : options.deployTag,
        pushTagTo : options.pushTagTo,
        force : options.force
      }];
    } else {
      options.deployRef = options.deployBranch || "deploy";
      deployArgs = [grunt,options];
    }
    deployArgs.push(next);

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
          deployArgs[0].originRef = csid;
          doDeploy.apply(null,deployArgs);
        });
      } else {
        console.log('Current branch is ' + branch);
        deployArgs[0].originRef = branch;
        doDeploy.apply(null,deployArgs);
      }
    });
  };
  
  return exports;
};
