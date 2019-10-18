const core = require('@actions/core');
const github = require('@actions/github');

module.exports = async function(context) {
  // Matches [ch49555] and ch49555/branch-name
  const clubhouseRegex = /(\[ch\d+\])|(ch\d+\/)/;

  //console.log(context.payload);

  const { repository, pull_request } = context.payload;

  const repoInfo = {
    owner: repository.owner.login,
    repo: repository.name,
    ref: pull_request.head.ref
  };

  const octokit = new github.GitHub(process.env.GITHUB_TOKEN);

  const checks = await octokit.checks.listForRef(repoInfo);
  console.log(checks.data.check_runs);

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
};
