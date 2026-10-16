# pr-shortcut-lint-action

A GitHub Action that verifies your pull request contains a reference to a Shortcut card. If your Shortcut card number is 1234, this will check for `[ch1234]` or `ch1234/` in:

* The pull request title
* The pull request body
* The pull request branch name


## Usage

Add `.github/workflows/lint.yaml` with the following:

```yaml
name: Shortcut
on:
  pull_request:
    types: [opened, edited, reopened, synchronize]

jobs:
  ch_lint_pr:
    name: Check for story ID
    runs-on: ubuntu-latest
    steps:
      - uses: movableink/pr-clubhouse-lint-action@v1
```

## Approved bots

PRs opened by the bots in [src/bots.js](src/bots.js) skip the check in every repo. To approve extra bots for one repo, pass them as a comma-separated list:

```yaml
      - uses: movableink/pr-clubhouse-lint-action@v1
        with:
          approved-bots: 'some-repo-bot[bot]'
```

Add a bot to the central list instead if more than one repo needs it.

## Profiles

The `profile` input picks which check runs. The default, `auto`, uses `coherentpath-PR-check` for repos in the `coherentpath` org and `movableink-PR-check` everywhere else.

* `movableink-PR-check`: the check described above.
* `coherentpath-PR-check`: the former `coherentpath/action-doc-check`. It passes if any of these is true:
  * the branch name contains `sc-NNNN` or starts with `dependabot/`
  * the PR title contains `sc-NNNN`
  * the PR body contains `sc-NNNN`, `[doc-skip]`, or an Okta, SolarWinds or Zendesk link

  It is skipped when the PR does not target the default branch, when it only changes Markdown (`*.md`) files or `helm/**/values*` files, and on `merge_group` events. It reads the PR through the API, so it needs `pull-requests: read`, and it supports `pull_request` and `merge_group` events.

To migrate a coherentpath repo, replace the action reference. No checkout step is needed:

```yaml
jobs:
  pr-doc-check:
    name: PR Doc Check
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - uses: movableink/pr-clubhouse-lint-action@v1
```

## Releasing

Releases are automated. Merging to `master` will run tests and, if they pass, build and push the `v1` tag automatically.

## Testing

Run `npm test` to test.

## Build

The build can be completed by running the following command:

```
./run-podman-build.sh
```
