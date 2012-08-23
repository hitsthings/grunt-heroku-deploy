[![build status](https://secure.travis-ci.org/hitsthings/grunt-heroku-deploy.png)](http://travis-ci.org/hitsthings/grunt-heroku-deploy)
# grunt-heroku-deploy

Task to switch to a deploy branch and push to heroku

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-heroku-deploy`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-heroku-deploy');
```

[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation

Here's how I use this:

I do my dev on master which is set up to push to wherever I'm storing code.

    git branch --set-upstream master origin/master

I set up a branch locally that will be my deploy branch - it might have some different configuration's committed. It pushes to heroku by default.

    git branch --set-upstream deploy heroku/master

Now I can run `grunt heroku-deploy` while on the master branch, which will do:

    git checkout deploy  # switch to the deploy branch
    git merge master     # merge in the changes I was making
    git push             # push it to heroku
    git checkout master  # switch back to where I was so I can continue developing

If you want to specify the deploy branch name, use the 'deployBranch' property on each target like so:
```javascript
grunt.initConfig({
	'heroku-deploy' : {
        production : {
            deployBranch : 'prod'
        },
        staging : {
            deployBranch : 'staging'
        }
    }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
0.1.0 - "works for me".  Needs testing and feedback.

## License
Copyright (c) 2012 Adam Ahmed  
Licensed under the MIT license.
