const core = require('@actions/core');
const github = require('@actions/github');

// Matches [ch49555] and ch49555/branch-name
const clubhouseRegex = /(\[ch\d+\])|(ch\d+\/)/;

module.exports = async function(context) {
  console.log(context.payload);

  const { repository, pull_request } = context.payload;

  const repoInfo = {
    owner: repository.owner.login,
    repo: repository.name,
    ref: pull_request.head.ref
  };

  const toSearch = [];

  const { title, body } = pull_request;

  toSearch.push(`PR title: ${title}`);
  toSearch.push(`PR body: ${body}`);

  const headBranch = pull_request.head.ref.toLowerCase();

  toSearch.push(`Branch name: ${headBranch}`);

  const passed = toSearch.some(line => {
    const linePassed = !!line.match(clubhouseRegex);
    core.warning(`Searching ${line}...${linePassed}`);
    return linePassed;
  });

  console.log(`Passed clubhouse number check: ${passed}`);

  if (!passed) {
    core.setFailed('PR Linting Failed');
  }

  const octokit = new github.GitHub(process.env.GITHUB_TOKEN);

  const checkList = await octokit.checks.listForRef(repoInfo);
  const { check_runs } = checkList.data;

  console.log(check_runs);

  const clubhouseChecks = check_runs.filter(r => r.name === 'Clubhouse');
  const failedChecks = clubhouseChecks
    .filter(r => r.status === 'completed')
    .filter(r => r.conclusion === 'failure');

  for (let check of failedChecks) {
    await octokit.checks.update({
      ...repoInfo,
      check_run_id: check.id,
      conclusion: 'neutral'
    });
  }

  if (!passed) {
    // we are hoping that we are the only CH check in progress, because
    // there's no way to tell conclusively
    const myCheck = clubhouseChecks.find(r => r.status == 'in_progress');

    await octokit.checks.update({
      ...repoInfo,
      check_run_id: myCheck.id,
      'output.title': 'Missing a Clubhouse story ID',
      'output.text':
        'Please edit your pull requeset description and add a Clubhouse story ID in the format: [chXXXX]. You can find the story ID in the Clubhouse URL.'
    });
  }
};
