const nock = require('nock');
const fs = require('fs');
const { Toolkit } = require('actions-toolkit');

nock.disableNetConnect();

describe('pr-lint-action', () => {
  let action, tools;

  // Mock Toolkit.run to define `action` so we can call it
  Toolkit.run = jest.fn(actionFn => {
    action = actionFn;
  });
  // Load up our entrypoint file
  require('.');

  const bad_title_and_branch = {
    title: 'no ticket in me',
    body: 'a great pull request',
    ref_name: 'no-ticket-in-me'
  };
  const good_title_and_branch = {
    title: '[ch39234] a good PR title',
    body: 'a great pull request',
    ref_name: 'ch39234/a_good_branch'
  };
  const good_title_and_bad_branch = {
    title: '[ch39494] a good PR title',
    body: 'a great pull request',
    ref_name: 'fix_things'
  };
  const bad_title_and_good_branch = {
    title: 'no ticket in me',
    ref_name: 'bug/ch1234/a_good_branch'
  };
  const good_body = {
    title: 'no ticket in me',
    body: '[ch39234] a great pull request',
    ref_name: 'fix_things'
  };
  const good_commits = [
    { commit: { message: '[ch1234] Commit 1' } },
    { commit: { message: 'Commit 2' } },
    { commit: { message: 'Commit 3' } }
  ];
  const bad_commits = [
    { commit: { message: 'Commit 1' } },
    { commit: { message: 'Commit 2' } },
    { commit: { message: 'Commit 3' } }
  ];

  beforeEach(() => {
    // Create a new Toolkit instance
    tools = new Toolkit();
    // Mock methods on it!
    tools.exit.success = jest.fn();
    tools.exit.failure = jest.fn();
  });

  it('fails if missing from title and branch', async () => {
    nock('https://api.github.com')
      .get('/repos/movableink/pr-clubhouse-lint-action-test/contents/.github/pr-lint.yml')
      .query(true)
      .reply(200, configFixture('title.yml'));

    tools.context.payload = pullRequestOpenedFixture(bad_title_and_branch);

    await action(tools);
    expect(tools.exit.failure).toHaveBeenCalledWith('PR Linting Failed');
    expect.assertions(1);
  });

  it('passes if branch matches', async () => {
    nock('https://api.github.com')
      .get('/repos/movableink/pr-clubhouse-lint-action-test/contents/.github/pr-lint.yml')
      .query(true)
      .reply(200, configFixture('branch.yml'));

    tools.context.payload = pullRequestOpenedFixture(bad_title_and_good_branch);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalled();
    expect.assertions(1);
  });

  it('passes if title matches', async () => {
    nock('https://api.github.com')
      .get('/repos/movableink/pr-clubhouse-lint-action-test/contents/.github/pr-lint.yml')
      .query(true)
      .reply(200, configFixture('title.yml'));

    tools.context.payload = pullRequestOpenedFixture(good_title_and_branch);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalled();
    expect.assertions(1);
  });

  it('fails if no commits match', async () => {
    nock('https://api.github.com')
      .get('/repos/movableink/pr-clubhouse-lint-action-test/contents/.github/pr-lint.yml')
      .query(true)
      .reply(200, configFixture('commits.yml'));

    mockGetPRCommitListRequest(bad_commits);

    tools.context.payload = pullRequestOpenedFixture(bad_title_and_branch);
    await action(tools);
    expect(tools.exit.failure).toHaveBeenCalledWith('PR Linting Failed');
    expect.assertions(1);
  });

  // it('passes if any commits match', async () => {
  //   nock('https://api.github.com')
  //     .get('/repos/movableink/pr-clubhouse-lint-action-test/contents/.github/pr-lint.yml')
  //     .query(true)
  //     .reply(200, configFixture('commits.yml'));

  //   mockGetPRCommitListRequest(good_commits);

  //   tools.context.payload = pullRequestOpenedFixture(bad_title_and_branch);
  //   await action(tools);
  //   expect(tools.exit.success).toHaveBeenCalled();
  //   expect.assertions(1);
  // });
});

function mockGetPRCommitListRequest(commits) {
  nock('https://api.github.com')
    .get('/repos/movableink/pr-clubhouse-lint-action-test/pulls/1/commits')
    .query(true)
    .reply(200, commits);
}

function encodeContent(content) {
  return Buffer.from(content).toString('base64');
}

function configFixture(fileName = 'all.yml') {
  return {
    type: 'file',
    encoding: 'base64',
    size: 5362,
    name: fileName,
    path: `.github/${fileName}`,
    content: encodeContent(fs.readFileSync(`./fixtures/${fileName}`)),
    sha: '3d21ec53a331a6f037a91c368710b99387d012c1',
    url:
      'https://api.github.com/repos/movableink/pr-clubhouse-lint-action/contents/.github/pr-lint.yml',
    git_url:
      'https://api.github.com/repos/movableink/pr-clubhouse-lint-action/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1',
    html_url:
      'https://github.com/movableink/pr-clubhouse-lint-action/blob/master/.github/pr-lint.yml',
    download_url:
      'https://raw.githubusercontent.com/movableink/pr-clubhouse-lint-action/master/.github/pr-lint.yml',
    _links: {
      git:
        'https://api.github.com/repos/movableink/pr-clubhouse-lint-action/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1',
      self:
        'https://api.github.com/repos/movableink/pr-clubhouse-lint-action/contents/.github/pr-lint.yml',
      html: 'https://github.com/movableink/pr-clubhouse-lint-action/blob/master/.github/pr-lint.yml'
    }
  };
}

function pullRequestOpenedFixture({ title, ref_name }) {
  return {
    pull_request: {
      number: 1,
      title: title,
      head: {
        ref: ref_name
      }
    },
    repository: {
      name: 'pr-clubhouse-lint-action-test',
      owner: {
        login: 'movableink'
      }
    }
  };
}
