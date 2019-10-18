// When using a release branch, we have node_modules vendored. But on other
// branches we don't, so when we're testing we want to optionally just run npm
// to install dependencies
const fs = require('fs');
if (!fs.existsSync(`${__dirname}/node_modules`)) {
  const child_process = require('child_process');
  child_process.execSync('npm install', { stdio: [0, 1, 2], cwd: __dirname });
}

const github = require('@actions/github');
const action = require('./lib/action');

action(github.context);
