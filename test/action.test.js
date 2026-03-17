import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
}));

const { action } = await import('../src/main.js');
const core = await import('@actions/core');

process.env.GITHUB_TOKEN = 'fake_token';

describe('pr-lint-action', () => {
  let api = {};
  let context = {};

  const bad_title_and_branch = {
    title: 'no ticket in me',
    body: 'a great pull request',
    ref_name: 'no-ticket-in-me'
  };

  const clubhouse = {
    good_title_and_branch: {
      title: '[ch39234] a good PR title',
      body: 'a great pull request',
      ref_name: 'ch39234/a_good_branch'
    },
    bad_title_and_good_branch: {
      title: 'no ticket in me',
      ref_name: 'bug/ch1234/a_good_branch'
    },
    good_body: {
      title: 'no ticket in me',
      body: '[ch39234] a great pull request',
      ref_name: 'fix_things'
    }
  };

  const shortcut = {
    good_title_and_branch: {
      title: '[sc9234] a good PR title',
      body: 'a great pull request',
      ref_name: 'ch39234/a_good_branch'
    },
    bad_title_and_good_branch: {
      title: 'no ticket in me',
      ref_name: 'bug/sc1234/a_good_branch'
    },
    good_body: {
      title: 'no ticket in me',
      body: '[sc39234] a great pull request',
      ref_name: 'fix_things'
    },
    dashorized: {
      good_title_and_branch: {
        title: '[sc-9234] a good PR title',
        body: 'a great pull request',
        ref_name: 'ch39234/a_good_branch'
      },
      bad_title_and_good_branch: {
        title: 'no ticket in me',
        ref_name: 'bug/sc-1234/a_good_branch'
      },
      good_body: {
        title: 'no ticket in me',
        body: '[sc-39234] a great pull request',
        ref_name: 'fix_things'
      }
    }
  };



  beforeEach(() => {
    core.info.mockReset();
    core.warning.mockReset();
    core.setFailed.mockReset();
    core.getInput.mockReset().mockReturnValue('');
  });

  describe('checking status', () => {
    beforeEach(() => {
      api.rest = {
        checks: {
          listForRef: () => ({ data: { check_runs: [] } }),
          update: () => {}
        }
      };
    });

    it('fails if missing from title and branch and body', async () => {
      context.payload = pullRequestOpenedFixture(bad_title_and_branch);

      await action(context, api);
      expect(core.setFailed).toHaveBeenCalledWith('PR Linting Failed');
      expect.assertions(1);
    });

    describe('clubhouse', () => {
      it('passes if branch matches', async () => {
        context.payload = pullRequestOpenedFixture(clubhouse.bad_title_and_good_branch);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      it('passes if title matches', async () => {
        context.payload = pullRequestOpenedFixture(clubhouse.good_title_and_branch);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      it('passes if body matches', async () => {
        context.payload = pullRequestOpenedFixture(clubhouse.good_body);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });
    });

    describe('shortcut', () => {
      it('passes if branch matches', async () => {
        context.payload = pullRequestOpenedFixture(shortcut.bad_title_and_good_branch);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      it('passes if title matches', async () => {
        context.payload = pullRequestOpenedFixture(shortcut.good_title_and_branch);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      it('passes if body matches', async () => {
        context.payload = pullRequestOpenedFixture(shortcut.good_body);

        await action(context, api);
        expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
        expect(core.setFailed).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      describe('dashorized', () => {
        it('passes if branch matches', async () => {
          context.payload = pullRequestOpenedFixture(shortcut.dashorized.bad_title_and_good_branch);

          await action(context, api);
          expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
          expect(core.setFailed).not.toHaveBeenCalled();
          expect.assertions(2);
        });

        it('passes if title matches', async () => {
          context.payload = pullRequestOpenedFixture(shortcut.dashorized.good_title_and_branch);

          await action(context, api);
          expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
          expect(core.setFailed).not.toHaveBeenCalled();
          expect.assertions(2);
        });

        it('passes if body matches', async () => {
          context.payload = pullRequestOpenedFixture(shortcut.dashorized.good_body);

          await action(context, api);
          expect(core.info).toHaveBeenCalledWith('Passed shortcut number check: true');
          expect(core.setFailed).not.toHaveBeenCalled();
          expect.assertions(2);
        });
      })
    });
  });

  describe('approved bot bypass', () => {
    beforeEach(() => {
      api.rest = {
        checks: {
          listForRef: () => ({ data: { check_runs: [] } }),
          update: () => {}
        }
      };
    });

    it('bypasses the check when PR author is an approved bot', async () => {
      core.getInput.mockReturnValue('dependabot[bot], renovate[bot]');
      context.payload = pullRequestOpenedFixture({ ...bad_title_and_branch, user_login: 'dependabot[bot]' });

      await action(context, api);
      expect(core.info).toHaveBeenCalledWith('Bypassing check for approved bot: dependabot[bot]');
      expect(core.setFailed).not.toHaveBeenCalled();
      expect.assertions(2);
    });

    it('does not bypass when PR author is not in the approved bots list', async () => {
      core.getInput.mockReturnValue('dependabot[bot]');
      context.payload = pullRequestOpenedFixture({ ...bad_title_and_branch, user_login: 'some-human' });

      await action(context, api);
      expect(core.setFailed).toHaveBeenCalledWith('PR Linting Failed');
      expect.assertions(1);
    });

    it('does not bypass when approved-bots input is empty', async () => {
      core.getInput.mockReturnValue('');
      context.payload = pullRequestOpenedFixture({ ...bad_title_and_branch, user_login: 'dependabot[bot]' });

      await action(context, api);
      expect(core.setFailed).toHaveBeenCalledWith('PR Linting Failed');
      expect.assertions(1);
    });
  });

  describe('api.rest.checks (octokit v9 structure)', () => {
    it('calls listForRef via api.rest.checks, not api.checks', async () => {
      const listForRef = jest.fn().mockResolvedValue({ data: { check_runs: [] } });
      api.rest = { checks: { listForRef, update: jest.fn() } };
      context.payload = pullRequestOpenedFixture(clubhouse.good_body);

      await action(context, api);

      expect(listForRef).toHaveBeenCalledTimes(1);
      expect(listForRef).toHaveBeenCalledWith(expect.objectContaining({
        owner: 'movableink',
        repo: 'pr-shortcut-lint-action-test',
        ref: 'fix_things'
      }));
      expect.assertions(2);
    });
  });

  describe('clearing old checks', () => {
    beforeEach(() => {
      api.rest = {
        checks: {
          listForRef: () => ({
            data: {
              check_runs: [
                {
                  // this is us, ignore
                  id: 1,
                  name: 'Shortcut',
                  status: 'in_progress',
                  conclusion: 'neutral'
                },
                {
                  id: 2,
                  name: 'Shortcut',
                  status: 'completed',
                  conclusion: 'failure'
                },
                {
                  id: 3,
                  name: 'Shortcut',
                  status: 'completed',
                  conclusion: 'failure'
                },
                {
                  // this is travis, ignore
                  id: 4,
                  name: 'Travis',
                  status: 'completed',
                  conclusion: 'failure'
                }
              ]
            }
          }),
          update: jest.fn()
        }
      };
    });

    describe('clubhouse', ()=> {
      it('updates the previous failed check to neutral', async () => {
        context.payload = pullRequestOpenedFixture(clubhouse.good_body);

        await action(context, api);

        expect(api.rest.checks.update).toHaveBeenCalledTimes(2);

        expect(api.rest.checks.update).toHaveBeenNthCalledWith(1, {
          check_run_id: 2,
          owner: 'movableink',
          repo: 'pr-shortcut-lint-action-test',
          ref: 'fix_things',
          conclusion: 'neutral'
        });

        expect(api.rest.checks.update).toHaveBeenNthCalledWith(2, {
          check_run_id: 3,
          owner: 'movableink',
          repo: 'pr-shortcut-lint-action-test',
          ref: 'fix_things',
          conclusion: 'neutral'
        });
      });
    });

    describe('shortcut', ()=> {
      it('updates the previous failed check to neutral', async () => {
        context.payload = pullRequestOpenedFixture(shortcut.good_body);

        await action(context, api);

        expect(api.rest.checks.update).toHaveBeenCalledTimes(2);

        expect(api.rest.checks.update).toHaveBeenNthCalledWith(1, {
          check_run_id: 2,
          owner: 'movableink',
          repo: 'pr-shortcut-lint-action-test',
          ref: 'fix_things',
          conclusion: 'neutral'
        });

        expect(api.rest.checks.update).toHaveBeenNthCalledWith(2, {
          check_run_id: 3,
          owner: 'movableink',
          repo: 'pr-shortcut-lint-action-test',
          ref: 'fix_things',
          conclusion: 'neutral'
        });
      });

      describe('dashorized', () => {
        it('updates the previous failed check to neutral', async () => {
          context.payload = pullRequestOpenedFixture(shortcut.dashorized.good_body);

          await action(context, api);

          expect(api.rest.checks.update).toHaveBeenCalledTimes(2);

          expect(api.rest.checks.update).toHaveBeenNthCalledWith(1, {
            check_run_id: 2,
            owner: 'movableink',
            repo: 'pr-shortcut-lint-action-test',
            ref: 'fix_things',
            conclusion: 'neutral'
          });

          expect(api.rest.checks.update).toHaveBeenNthCalledWith(2, {
            check_run_id: 3,
            owner: 'movableink',
            repo: 'pr-shortcut-lint-action-test',
            ref: 'fix_things',
            conclusion: 'neutral'
          });
        });
      })
    });

  });
});

function pullRequestOpenedFixture({ title, ref_name, body, user_login }) {
  return {
    pull_request: {
      number: 1,
      title,
      body,
      head: {
        ref: ref_name
      },
      user: {
        login: user_login || 'some-human'
      }
    },
    repository: {
      name: 'pr-shortcut-lint-action-test',
      owner: {
        login: 'movableink'
      }
    }
  };
}