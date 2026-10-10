const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');
// Discover all smoke suites so future suites automatically join npm test.
for (const file of readdirSync(__dirname).filter(f => f === 'smoke.js' || f.endsWith('-smoke.js')).sort()) {
  console.log(`Running ${file}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
