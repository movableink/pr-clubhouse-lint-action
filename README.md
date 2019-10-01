# pr-clubhouse-lint-action

A GitHub Action that verifies your pull request contains a reference to a Clubhouse card. If your Clubhouse card number is 1234, this will check for `[ch1234]` or `ch1234/` in:

* The pull request title
* The pull request body
* The pull request branch name


## Usage

Add `.github/workflows/lint.yaml` with the following:

```yaml
name: PR Lint
on:
  pull_request:
    types: [opened, edited, reopened, synchronize]

jobs:
  ch_lint_pr:
    name: Clubhouse
    runs-on: ubuntu-latest
    steps:
      - uses: movableink/pr-clubhouse-lint-action@release
```

## Releasing

This action needs `node_modules` vendored, but we don't want to do so normally. To release a new version:

* Remove `node_modules`
* Check out the `release` branch
* Run `git merge master`
* Run `npm install --production` (to ensure dev dependencies don't get installed)
* Commit the result, if any changes
* Push the `release` branch to Github

## Testing

Run `npm test` to test.
