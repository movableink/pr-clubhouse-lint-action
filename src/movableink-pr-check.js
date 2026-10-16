import * as core from '@actions/core';
import { isApprovedBot } from './bots.js';

// Matches
// [ch49555] or [sc-49555] or [sc49555] ticket reference
// ch49555/branch-name or sc49555/branch-name or sc-49555/branch-name
const shortcutRegex = /(\[ch\d+\])|(ch\d+\/)|(\[sc\d+\])|(sc\d+\/)|(\[sc-\d+\])|(sc-\d+\/)/;

// We need to be able to identify old checks to neutralize them,
// unfortunately the only way is to name them with one of these:
const jobNames = ['Shortcut', 'Check for story ID'];

/**
 * The original movableink/pr-clubhouse-lint-action behavior.
 */
export async function movableinkPrCheck(context, api) {
    const pull_request = context.payload.pull_request;
    const repository = context.payload.repository;

    const prAuthor = pull_request.user && pull_request.user.login;

    if (isApprovedBot(prAuthor, core.getInput('approved-bots'))) {
        core.info(`Bypassing check for approved bot: ${prAuthor}`);
        return;
    }

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
        const linePassed = !!line.match(shortcutRegex);
        core.info(`Searching ${line}...${linePassed}`);
        return linePassed;
    });

    core.info(`Passed shortcut number check: ${passed}`);

    if (!passed) {
        core.setFailed('PR Linting Failed');
    }

    if (process.env.GITHUB_TOKEN) {
        const checkList = await api.rest.checks.listForRef(repoInfo);
        const { check_runs } = checkList.data;

        const shortcutChecks = check_runs.filter(r => jobNames.includes(r.name));
        const completedChecks = shortcutChecks.filter(r => r.status === 'completed');

        for (let check of completedChecks) {
            core.info(`Updating ${check.id} check to neutral status`);

            await api.rest.checks.update({
                ...repoInfo,
                check_run_id: check.id,
                conclusion: 'neutral'
            });
        }
    }
}
