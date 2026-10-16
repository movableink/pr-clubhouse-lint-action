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
 * The core action logic, testable with injected context and api.
 */
export async function action(context, api) {
    const profile = resolveProfile(context, core.getInput('profile'));

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
    const token = process.env.GITHUB_TOKEN || core.getInput('github-token');
    const api = token ? github.getOctokit(token) : null;
    await action(context, api);
}
