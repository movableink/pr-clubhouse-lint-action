const core = require('@actions/core');

// Matches [ch49555] and ch49555/branch-name
const clubhouseRegex = /(\[ch\d+\])|(ch\d+\/)/;

module.exports = async function(context, api) {
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

  // If there are any previously failed CH checks, set them to neutral
  // since we want this check to override those.
  const checkList = await api.checks.listForRef(repoInfo);
  const { check_runs } = checkList.data;

  console.log(check_runs);
  const clubhouseChecks = check_runs.filter(r => r.name === 'Clubhouse');
  const completedChecks = clubhouseChecks.filter(r => r.status === 'completed');

  for (let check of completedChecks) {
    console.log(`Updating ${check.id} check to neutral status`);

    await api.checks.update({
      ...repoInfo,
      check_run_id: check.id,
      conclusion: 'neutral'
    });
  }
};
