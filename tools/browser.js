// Reuse either a local or global Playwright installation.
function loadPlaywright() {
  try { return require('playwright'); }
  catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  const root = require('child_process').execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  return require(require('path').join(root, 'playwright'));
}

module.exports = { loadPlaywright };
