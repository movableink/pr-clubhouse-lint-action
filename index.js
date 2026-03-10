// When using a release branch, we have node_modules vendored. But on other
// branches we don't, so when we're testing we want to optionally just run npm
// to install dependencies
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!existsSync(`${__dirname}/node_modules`)) {
  execSync('npm install', { stdio: [0, 1, 2], cwd: __dirname });
}

const { context, getOctokit } = await import('@actions/github');
const { default: action } = await import('./lib/action.js');

action(context, getOctokit(process.env.GITHUB_TOKEN));
