const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr) throw Error('Expected a pull request event.');
if (event.action === 'closed') {
  if (!pr.merged) process.exit(0);
  if (!pr.merge_commit_sha || spawnSync('git', ['merge-base', '--is-ancestor', pr.merge_commit_sha, 'origin/main']).status !== 0) {
    console.error('This PR was merged, but its merge commit has not reached main. Merge its parent branch into main.');
    process.exit(1);
  }
} else if (pr.base.ref !== 'main') {
  console.error('This PR targets a parent branch. Retarget it to main once its dependency lands, so its changes reach main.');
  process.exit(1);
}
console.log('Main integration check passed.');
