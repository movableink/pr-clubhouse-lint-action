import { context, getOctokit } from '@actions/github';
import action from './lib/action.js';

action(context, getOctokit(process.env.GITHUB_TOKEN));
