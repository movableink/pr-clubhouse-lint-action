const child_process = require('child_process');
child_process.execSync('npm install', { stdio: [0, 1, 2] });

const github = require('@actions/github');
const action = require('./lib/action');

action(github.context);
