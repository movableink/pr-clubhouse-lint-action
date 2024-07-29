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
      - uses: movableink/pr-clubhouse-lint-action@release
```

On self-hosted runners, the following is required:

```yaml
name: Shortcut
on:
  pull_request:
    types: [opened, edited, reopened, synchronize]

jobs:
  sc_lint_pr:
    name: Shortcut
    runs-on: mi-gha-runner-generic
    permissions:
      actions: write
      pull-requests: read
      contents: read
    steps:
      - uses: movableink/pr-clubhouse-lint-action@dschulze/sc-104807/release-process
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Releasing

This action needs `node_modules` vendored, but we don't want to do so normally. To release a new version:

* Remove `node_modules`
* Check out the `v1` branch
* Run `git merge master`
* Run `npm install --production` (to ensure dev dependencies don't get installed)
* Run `npm run build`
* Commit the result, if any changes
* Push the `v1` branch to Github

## Testing

Run `npm test` to test.
