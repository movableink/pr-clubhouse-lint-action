jest.mock('@actions/core');

const core = require('@actions/core');
const action = require('./action');

describe('pr-lint-action', () => {
  let context = {};

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
    console.log = jest.fn();
    core.warning = jest.fn();
    core.setFailed = jest.fn();
  });

  it('fails if missing from title and branch and body', async () => {
    context.payload = pullRequestOpenedFixture(bad_title_and_branch);

    await action(context);
    expect(core.setFailed).toHaveBeenCalledWith('PR Linting Failed');
    expect.assertions(1);
  });

  it('passes if branch matches', async () => {
    context.payload = pullRequestOpenedFixture(bad_title_and_good_branch);

    await action(context);
    expect(console.log).toHaveBeenCalledWith('Passed clubhouse number check: true');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect.assertions(2);
  });

  it('passes if title matches', async () => {
    context.payload = pullRequestOpenedFixture(good_title_and_branch);

    await action(context);
    expect(console.log).toHaveBeenCalledWith('Passed clubhouse number check: true');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect.assertions(2);
  });

  it('passes if body matches', async () => {
    context.payload = pullRequestOpenedFixture(good_body);

    await action(context);
    expect(console.log).toHaveBeenCalledWith('Passed clubhouse number check: true');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect.assertions(2);
  });
});

function pullRequestOpenedFixture({ title, ref_name, body }) {
  return {
    pull_request: {
      number: 1,
      title,
      body,
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
