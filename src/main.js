const github = require('@actions/github');

async function run() {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  console.log(`Event Name: ${github.context.eventName}`); // Debugging: Log the event name

  // Check if the event is a pull request event or pull request target event
  // if (github.context.eventName === 'pull_request' || github.context.eventName === 'pull_request_target') {
  //   action(github.context, octokit);
  // } else {
  //   console.log('This action only runs on pull request events.');
  // }
}

module.exports = {
  run
}
