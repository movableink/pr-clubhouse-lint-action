const { Toolkit } = require('actions-toolkit');
const getConfig = require('./utils/config');

const CONFIG_FILENAME = 'pr-lint.yml';

const config = {
  check_commits: false
};

// Matches [ch49555] and ch49555/branch-name
const clubhouseRegex = /(\[ch\d+\])|(ch\d+\/)/;

Toolkit.run(
  async tools => {
    const { repository, pull_request } = tools.context.payload;

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

    // if (config.check_commits) {
    //   const listCommitsParams = {
    //     owner: repository.owner.login,
    //     repo: repository.name,
    //     pull_number: pull_request.number
    //   };
    //   const commitsInPR = (await tools.github.pulls.listCommits(listCommitsParams)).data;
    //   const messages = commitsInPR.map(commit => commit.commit.message);
    //   messages.forEach(m => toSearch.push(m));
    // }

    const passed = toSearch.some(line => {
      const linePassed = !!line.match(clubhouseRegex);
      tools.log(`Searching ${line}...${linePassed}`);
      return linePassed;
    });

    tools.log(`Passed clubhouse number check: ${passed}`);

    if (passed) {
      tools.exit.success();
    } else {
      tools.exit.failure('PR Linting Failed');
    }
  },
  {
    event: ['pull_request.opened', 'pull_request.edited', 'pull_request.synchronize']
    //secrets: ['GITHUB_TOKEN']
  }
);
