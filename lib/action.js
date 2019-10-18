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

  const checks = check_runs
    .filter(r => r.status === 'completed')
    .filter(r => r.conclusion === 'failure')
    .filter(r => r.name === 'Clubhouse');

  for (let check of checks) {
    await octokit.checks.update({
      ...repoInfo,
      check_run_id: check.id,
      conclusion: 'neutral'
    });
  }
};
