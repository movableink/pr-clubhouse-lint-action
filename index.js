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

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

console.log(`Event Name: ${github.context.eventName}`); // Debugging: Log the event name

// Check if the event is a pull request event or pull request target event
if (github.context.eventName === 'pull_request' || github.context.eventName === 'pull_request_target') {
  action(github.context, octokit);
} else {
  console.log('This action only runs on pull request events.');
}
