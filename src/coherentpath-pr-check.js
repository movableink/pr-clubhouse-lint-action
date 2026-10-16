import * as core from '@actions/core';
import { isApprovedBot } from './bots.js';

// The behavior of coherentpath/action-doc-check (v1.6.0), plus a Shortcut ID check on the PR title.

// Files matching these are not material changes. The old action only exempted Markdown
// files at the repo root.
const exemptFileRegexes = [
    // Markdown files anywhere in the repo, e.g. README.md, docs/guide.md
    /\.md$/,
    // Helm values files under the top-level helm/ directory, e.g. helm/app/values-prod.yaml
    /^helm\/(?:[^/]+\/)*values[^/]*$/,
];

const isMaterialFile = filename => !exemptFileRegexes.some(regex => regex.test(filename));

const shortcutRegex = /(\[sc-\d+\])|(sc-\d+)/;

// The check passes if any regex matches its field.
const checks = {
    branch: [shortcutRegex, /^dependabot\/.*/],
    title: [shortcutRegex],
    body: [
        shortcutRegex,
        // Okta Access Requests
        /movableink.at.okta.com/,
        // SolarWinds
        /movableink.samanage.com/,
        // Zendesk
        /movableink.zendesk.com/,
        // Bypass for valid exceptions, e.g. hotfixes
        /\[doc-skip\]/,
    ],
};

const failureMessage = `
**********************************************
**********************************************
**********************************************

The PR Doc Check has failed.

Please ensure there is a link to an appropriate documentation source in the Pull Request - via a Shortcut code, Solarwinds URL, or Zendesk URL.

For full reference see: https://www.notion.so/movableinkepd/Change-Request-Policy-ae165d2791614347b1f5331146615334#93896a8e42b84690adfb3851b08a2d17

**********************************************
**********************************************
**********************************************
`;

/**
 * Whether any changed file (from the pulls.listFiles API) is a material change.
 * Like the old paths-filter step, a rename counts as both the old and the new path.
 */
export function hasMaterialChanges(files) {
    return files.some(file =>
        isMaterialFile(file.filename) ||
        (file.status === 'renamed' && !!file.previous_filename && isMaterialFile(file.previous_filename))
    );
}

// The old action matched against `jq '.body' | sed "s/['\"\`]//g"` passed through Python's
// html.escape, i.e. the JSON-encoded body with quotes and backticks removed and & < > escaped.
// Reproduce that so edge cases (e.g. `"` leaving a stray backslash) behave the same.
function normalizeBody(body) {
    return JSON.stringify(body ?? null)
        .replace(/['"`]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function passesDocCheck({ branch, title, body }) {
    const pr = {
        branch: branch || '',
        title: title || '',
        body: normalizeBody(body),
    };

    return Object.entries(checks).some(([field, regexes]) => regexes.some(regex => regex.test(pr[field])));
}

export async function coherentpathPrCheck(context, api) {
    const { eventName, payload } = context;

    if (eventName === 'merge_group') {
        // A merge group has no base ref, so the old action never ran the check here.
        // The PR itself was already checked on its pull_request run.
        const match = (context.ref || '').match(/.*\/pr-(\d+)-/);
        if (!match) {
            core.setFailed(`The PR Doc Check could not find a pull request number in ${context.ref}.`);
            return;
        }
        core.info(`The PR Doc Check is not required for merge queue runs. (PR #${match[1]})`);
        return;
    }

    if (eventName !== 'pull_request') {
        core.setFailed('The PR Doc Check action only works with pull_request or merge_group events.');
        return;
    }

    if (!api) {
        core.setFailed('The PR Doc Check requires a GitHub token.');
        return;
    }

    const pull_request = payload.pull_request;
    const repoInfo = {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        pull_number: pull_request.number,
    };

    const prAuthor = pull_request.user && pull_request.user.login;

    if (isApprovedBot(prAuthor, core.getInput('approved-bots'))) {
        core.info(`Bypassing check for approved bot: ${prAuthor}`);
        return;
    }

    const baseRef = pull_request.base.ref;
    const defaultBranch = payload.repository.default_branch;

    if (baseRef !== defaultBranch) {
        core.info(`The PR Doc Check is not required for this Pull Request. (Branch target '${baseRef}' != repo default '${defaultBranch}')`);
        return;
    }

    const files = await api.paginate(api.rest.pulls.listFiles, { ...repoInfo, per_page: 100 });

    if (!hasMaterialChanges(files)) {
        core.info('The PR Doc Check is not required for this Pull Request. (No material changes detected)');
        return;
    }

    // Read the title and body from the API rather than the event payload, as the old action
    // did, so a re-run sees the current values.
    const { data: pr } = await api.rest.pulls.get(repoInfo);

    if (passesDocCheck({ branch: pull_request.head.ref, title: pr.title, body: pr.body })) {
        core.info('The PR Doc Check has passed successfully.');
        return;
    }

    core.info(failureMessage);
    core.setFailed('The PR Doc Check has failed.');
}
