const github = require('@actions/github');
const action = require('./lib/action');

action(github.context);
