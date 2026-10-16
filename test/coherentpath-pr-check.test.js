import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
}));

const { action, resolveProfile } = await import('../src/main.js');
const { passesDocCheck, hasMaterialChanges } = await import('../src/coherentpath-pr-check.js');
const core = await import('@actions/core');

const lorem = 'Lorizzle ipsizzle dolizzle sit amizzle, consectetuer adipiscing yo mamma.';
const lorem2 = 'Pellentesque we gonna chung tortizzle. Sed eros. Stuff fizzle dolor dapibus turpizzle tempizzle shizznit. pellentesque nibh et turpizzle.';

// Ported from coherentpath/action-doc-check tests/test_checks.py
describe('passesDocCheck', () => {
  const check = (branch, body, title = 'test') => passesDocCheck({ branch, body, title });

  it.each([
    ['test', 'test'],
    [lorem, lorem2],
    // branch must start with dependabot/
    ['hex/dependabot/gettext-0.22.1', 'test'],
  ])('fails for branch %j and body %j', (branch, body) => {
    expect(check(branch, body)).toBe(false);
  });

  it.each([
    'sc-12345',
    'chore/sc-12345/branch-name-test',
    'dependabot/hex/gettext-0.22.1',
  ])('passes for branch %j', (branch) => {
    expect(check(branch, 'test')).toBe(true);
  });

  const multiline = (text) => `${lorem}\n\n${text}\n\n${lorem2}`;

  it.each([
    '[sc-12345]',
    `${lorem} [sc-12345]`,
    multiline('[sc-12345]'),
    'movableink.at.okta.com',
    'https://movableink.at.okta.com/next/requests/999',
    `${lorem} https://movableink.at.okta.com/next/requests/999`,
    multiline('https://movableink.at.okta.com/next/requests/999'),
    'movableink.samanage.com',
    'https://movableink.samanage.com/incidents/123456789-ticket-name-here',
    `${lorem} https://movableink.samanage.com/incidents/123456789-ticket-name-here`,
    multiline('https://movableink.samanage.com/incidents/123456789-ticket-name-here'),
    'movableink.zendesk.com',
    'https://movableink.zendesk.com/agent/tickets/123456',
    `${lorem} https://movableink.zendesk.com/agent/tickets/123456`,
    multiline('https://movableink.zendesk.com/agent/tickets/123456'),
    '[doc-skip]',
    `${lorem} [doc-skip]`,
    `${lorem}\n\n${lorem2}\n\n[doc-skip]`,
  ])('passes for body %j', (body) => {
    expect(check('test', body)).toBe(true);
  });

  it('does not break on HTML in the body', () => {
    const body = '## Purpose Switch from `auth_url` to `account_token` for the clients using Responsys. <img width="768" alt="Screenshot" src="https://github.com/coherentpath/coherentpath/assets/1/2">';
    expect(check('sc-12345', body)).toBe(true);
    expect(check('test', body)).toBe(false);
  });

  it('strips quotes and backticks from the body the same way the old action did', () => {
    expect(check('test', "[doc-'skip]")).toBe(true);
    expect(check('test', '[doc-`skip]')).toBe(true);
    // JSON encoding left a backslash behind when the double quote was removed
    expect(check('test', '[doc-"skip]')).toBe(false);
  });

  it('matches against the HTML-escaped body', () => {
    expect(check('test', 'movableink<at.okta.com')).toBe(false);
    expect(check('test', 'movableink.at.okta.com')).toBe(true);
  });

  it('handles a null body', () => {
    expect(passesDocCheck({ branch: 'test', title: 'test', body: null })).toBe(false);
  });

  describe('title', () => {
    it.each([
      '[sc-12345] Fix the thing',
      'Fix the thing sc-12345',
      'Fix the thing (sc-12345)',
    ])('passes for title %j', (title) => {
      expect(check('test', 'test', title)).toBe(true);
    });

    it.each([
      'Fix the thing',
      'Fix the thing [doc-skip]',
      'Fix https://movableink.zendesk.com/agent/tickets/123456',
    ])('fails for title %j', (title) => {
      expect(check('test', 'test', title)).toBe(false);
    });
  });
});

describe('hasMaterialChanges', () => {
  const files = (...names) => names.map(filename => ({ filename, status: 'modified' }));

  it.each([
    ['README.md'],
    ['README.md', 'CHANGELOG.md'],
    ['helm/values.yaml'],
    ['helm/app/values.yaml', 'helm/app/values-prod.yaml'],
    ['docs/guide.md'],
    ['docs/deep/nested/guide.md', 'README.md'],
    ['.github/PULL_REQUEST_TEMPLATE.md'],
    ['docs/.hidden.md'],
    ['helm/values'],
    ['helm/app/env/values.prod.yaml'],
  ])('is false for %j', (...names) => {
    expect(hasMaterialChanges(files(...names))).toBe(false);
  });

  it.each([
    ['src/index.js'],
    ['README.md', 'src/index.js'],
    ['docs/guide.md', 'src/index.js'],
    ['a.MD'],
    ['docs/guide.mdx'],
    ['.github/workflows/ci.yml'],
    ['helm/app/templates/deployment.yaml'],
    ['charts/helm/app/values.yaml'],
    ['README.md.bak'],
    ['docs/md'],
    ['helmvalues.yaml'],
    ['helm/values/config.yaml'],
    ['helm/app/Values.yaml'],
  ])('is true for %j', (...names) => {
    expect(hasMaterialChanges(files(...names))).toBe(true);
  });

  it('is false for an empty list', () => {
    expect(hasMaterialChanges([])).toBe(false);
  });

  it('counts the previous path of a rename', () => {
    expect(hasMaterialChanges([{ filename: 'NOTES.md', previous_filename: 'src/notes.js', status: 'renamed' }])).toBe(true);
    expect(hasMaterialChanges([{ filename: 'docs/NOTES.md', previous_filename: 'OLD.md', status: 'renamed' }])).toBe(false);
  });
});

describe('resolveProfile', () => {
  const ctx = (owner) => ({ payload: { repository: { owner: { login: owner } } } });

  it.each([
    ['coherentpath', '', 'coherentpath-PR-check'],
    ['CoherentPath', 'auto', 'coherentpath-PR-check'],
    ['movableink', '', 'movableink-PR-check'],
    ['movableink', 'auto', 'movableink-PR-check'],
    ['movableink', 'coherentpath-PR-check', 'coherentpath-PR-check'],
    ['movableink', 'coherentpath-pr-check', 'coherentpath-PR-check'],
    ['coherentpath', 'movableink-PR-check', 'movableink-PR-check'],
  ])('%s with profile %j resolves to %s', (owner, input, expected) => {
    expect(resolveProfile(ctx(owner), input)).toBe(expected);
  });

  it.each(['nope', 'doc-check', 'shortcut-lint'])('rejects unknown profile %j', (input) => {
    expect(() => resolveProfile(ctx('movableink'), input)).toThrow(`Unknown profile '${input}'`);
  });
});

describe('coherentpath-PR-check profile', () => {
  let context;
  let api;

  const setup = ({
    title = 'no ticket in me',
    body = 'a great pull request',
    ref = 'no-ticket-in-me',
    base = 'main',
    defaultBranch = 'main',
    login = 'some-human',
    changedFiles = ['src/index.js'],
    apiTitle,
    apiBody,
  } = {}) => {
    context = {
      eventName: 'pull_request',
      ref: 'refs/pull/7/merge',
      payload: {
        pull_request: {
          number: 7,
          title,
          body,
          head: { ref },
          base: { ref: base },
          user: { login },
        },
        repository: {
          name: 'signal',
          default_branch: defaultBranch,
          owner: { login: 'coherentpath' },
        },
      },
    };
    api = {
      paginate: jest.fn().mockResolvedValue(changedFiles.map(filename => ({ filename, status: 'modified' }))),
      rest: {
        pulls: {
          listFiles: 'listFiles',
          get: jest.fn().mockResolvedValue({ data: { title: apiTitle ?? title, body: apiBody ?? body } }),
        },
        checks: {
          listForRef: jest.fn(),
          update: jest.fn(),
        },
      },
    };
  };

  beforeEach(() => {
    core.info.mockReset();
    core.setFailed.mockReset();
    core.getInput.mockReset().mockReturnValue('');
  });

  it('fails without a ticket reference', async () => {
    setup();
    await action(context, api);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check has failed.');
    expect(api.paginate).toHaveBeenCalledWith('listFiles', { owner: 'coherentpath', repo: 'signal', pull_number: 7, per_page: 100 });
  });

  it('does not touch other check runs', async () => {
    setup();
    await action(context, api);
    expect(api.rest.checks.listForRef).not.toHaveBeenCalled();
    expect(api.rest.checks.update).not.toHaveBeenCalled();
  });

  it.each([
    ['branch', { ref: 'feature/sc-123/thing' }],
    ['title', { title: '[sc-123] thing' }],
    ['body', { body: 'see [sc-123]' }],
    ['doc-skip', { body: 'hotfix [doc-skip]' }],
    ['dependabot branch', { ref: 'dependabot/npm_and_yarn/foo-1.2.3' }],
  ])('passes with a %s reference', async (_, opts) => {
    setup(opts);
    await action(context, api);
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('The PR Doc Check has passed successfully.');
  });

  it('uses the current title and body from the API, not the event payload', async () => {
    setup({ title: 'stale', body: 'stale', apiBody: 'updated [sc-123]' });
    await action(context, api);
    expect(api.rest.pulls.get).toHaveBeenCalledWith({ owner: 'coherentpath', repo: 'signal', pull_number: 7 });
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('skips PRs without material changes', async () => {
    setup({ changedFiles: ['README.md', 'helm/app/values-prod.yaml'] });
    await action(context, api);
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('The PR Doc Check is not required for this Pull Request. (No material changes detected)');
  });

  it('skips PRs not targeting the default branch', async () => {
    setup({ base: 'release/1.0' });
    await action(context, api);
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(api.paginate).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith("The PR Doc Check is not required for this Pull Request. (Branch target 'release/1.0' != repo default 'main')");
  });

  it('checks PRs targeting a non-main default branch', async () => {
    setup({ base: 'develop', defaultBranch: 'develop' });
    await action(context, api);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check has failed.');
  });

  it('bypasses a bot from the central list', async () => {
    setup({ login: 'dependabot[bot]', ref: 'some-branch' });
    await action(context, api);
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('Bypassing check for approved bot: dependabot[bot]');
  });

  it('bypasses a bot from the approved-bots input', async () => {
    core.getInput.mockImplementation(name => (name === 'approved-bots' ? 'inkml-ci-cd[bot]' : ''));
    setup({ login: 'inkml-ci-cd[bot]' });
    await action(context, api);
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('does not bypass other bots', async () => {
    setup({ login: 'github-actions[bot]' });
    await action(context, api);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check has failed.');
  });

  it('runs for movableink repos with an explicit profile', async () => {
    core.getInput.mockImplementation(name => (name === 'profile' ? 'coherentpath-PR-check' : ''));
    setup();
    context.payload.repository.owner.login = 'movableink';
    await action(context, api);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check has failed.');
  });

  it('fails without a token', async () => {
    setup();
    await action(context, null);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check requires a GitHub token.');
  });

  describe('merge_group', () => {
    it('passes when the ref has a PR number', async () => {
      setup();
      context.eventName = 'merge_group';
      context.ref = 'refs/heads/gh-readonly-queue/main/pr-42-0123456789abcdef0123456789abcdef01234567';
      await action(context, api);
      expect(core.setFailed).not.toHaveBeenCalled();
      expect(core.info).toHaveBeenCalledWith('The PR Doc Check is not required for merge queue runs. (PR #42)');
    });

    it('fails when the ref has no PR number', async () => {
      setup();
      context.eventName = 'merge_group';
      context.ref = 'refs/heads/gh-readonly-queue/main/something';
      await action(context, api);
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('could not find a pull request number'));
    });
  });

  it('fails on other events', async () => {
    setup();
    context.eventName = 'push';
    await action(context, api);
    expect(core.setFailed).toHaveBeenCalledWith('The PR Doc Check action only works with pull_request or merge_group events.');
  });
});
