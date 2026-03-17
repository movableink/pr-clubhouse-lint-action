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

## Releasing

Releases are automated. Merging to `master` will run tests and, if they pass, build and push the `v1` tag automatically.

## Testing

Run `npm test` to test.

## Build

The build can be completed by running the following command:

```
./run-podman-build.sh
```
