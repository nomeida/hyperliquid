'use strict';

const { spawnSync } = require('child_process');

const NODE_VERSION = process.env.NODE_TEST_VERSION || '22.19.0';
const TEST_SCRIPTS = ['scripts/test-ws-connection.cjs', 'scripts/test-ws-connection.mjs'];

const run = script => {
  console.log(`\nRunning ${script} with node@${NODE_VERSION}...`);
  const child = spawnSync('npx', ['--yes', `node@${NODE_VERSION}`, script], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'test',
    },
  });

  if (child.error) {
    console.error(`Failed to execute ${script} with node@${NODE_VERSION}:`, child.error);
    process.exitCode = 1;
    return;
  }

  if (child.status !== 0) {
    console.error(`${script} exited with code ${child.status}.`);
    process.exitCode = child.status;
  }
};

for (const script of TEST_SCRIPTS) {
  run(script);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('\nAll Node version compatibility tests completed.');
