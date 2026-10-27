import * as core from '@actions/core';
import * as github from '@actions/github';
import { movableinkPrCheck } from './movableink-pr-check.js';
import { coherentpathPrCheck } from './coherentpath-pr-check.js';

export const PROFILES = ['movableink-PR-check', 'coherentpath-PR-check'];

// With `profile: auto`, repos in these orgs get the coherentpath-PR-check profile and
// everything else gets movableink-PR-check.
const COHERENTPATH_ORGS = ['coherentpath'];

export function resolveProfile(context, input) {
    const requested = (input || 'auto').trim().toLowerCase();

    if (requested !== 'auto') {
        const profile = PROFILES.find(p => p.toLowerCase() === requested);
        if (!profile) {
            throw new Error(`Unknown profile '${input}'. Expected one of: auto, ${PROFILES.join(', ')}`);
        }
        return profile;
    }

    const repository = context.payload.repository;
    const owner = (repository && repository.owner && repository.owner.login) || '';

    return COHERENTPATH_ORGS.includes(owner.toLowerCase()) ? 'coherentpath-PR-check' : 'movableink-PR-check';
}

/**
 * The token to call the API with. The coherentpath profile prefers the `github-token` input, so an
 * unrelated GITHUB_TOKEN in the environment cannot override it. The movableink profile keeps the
 * original behavior, where GITHUB_TOKEN wins.
 */
export function selectToken(profile, envToken, inputToken) {
    return profile === 'coherentpath-PR-check'
        ? inputToken || envToken
        : envToken || inputToken;
}

/**
 * The core action logic, testable with injected context and api.
 */
export async function action(context, api, profile = resolveProfile(context, core.getInput('profile'))) {
    core.info(`Using ${profile} profile`);

    if (profile === 'coherentpath-PR-check') {
        await coherentpathPrCheck(context, api);
    } else {
        await movableinkPrCheck(context, api);
    }
}

/**
 * The entrypoint that wires up real GitHub context and API.
 */
export async function run() {
    const context = github.context;
    const profile = resolveProfile(context, core.getInput('profile'));
    const token = selectToken(profile, process.env.GITHUB_TOKEN, core.getInput('github-token'));
    const api = token ? github.getOctokit(token) : null;
    await action(context, api, profile);
}
