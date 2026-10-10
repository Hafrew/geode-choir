import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
const script = fileURLToPath(new URL('./check-main-integration.js', import.meta.url));
test('integration guard catches parent-only merges until the exact merge reaches main', () => {
  const dir = mkdtempSync(join(tmpdir(), 'geode-integration-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: {
      ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' } }).trim();
    git('init', '-q'); git('commit', '--allow-empty', '-qm', 'baseline');
    git('update-ref', 'refs/remotes/origin/main', git('rev-parse', 'HEAD'));
    git('commit', '--allow-empty', '-qm', 'parent merge'); const merge = git('rev-parse', 'HEAD');
    const run = (action, pr) => {
      const path = join(dir, 'event.json'); writeFileSync(path, JSON.stringify({ action, pull_request: pr }));
      return spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_EVENT_PATH: path } });
    };
    assert.equal(run('opened', { base: { ref: 'main' } }).status, 0);
    assert.equal(run('opened', { base: { ref: 'parent' } }).status, 1);
    assert.equal(run('closed', { merged: false }).status, 0);
    assert.equal(run('closed', { merged: true, merge_commit_sha: merge }).status, 1);
    git('update-ref', 'refs/remotes/origin/main', merge);
    assert.equal(run('closed', { merged: true, merge_commit_sha: merge }).status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
