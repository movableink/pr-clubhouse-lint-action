// Central list of bot accounts allowed to skip the PR compliance check in every repo.
// Repos can approve additional bots with the `approved-bots` input.
export const APPROVED_BOTS = [
    // Dependency updates (coherentpath also allows `dependabot/` branches)
    'dependabot[bot]',
    // GitOps image tag updates (kubernetes-manifests, mi-charts-ci-demo)
    'movable-gitops-updater[bot]',
];

/**
 * Whether `login` is in the central list or the comma-separated `extraInput`.
 * GitHub logins are case-insensitive, so the comparison is too.
 */
export function isApprovedBot(login, extraInput = '') {
    if (!login) {
        return false;
    }

    const extra = extraInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    return [...APPROVED_BOTS, ...extra].some(bot => bot.toLowerCase() === login.toLowerCase());
}
