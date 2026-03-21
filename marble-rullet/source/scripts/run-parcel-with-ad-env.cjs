#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const [, , adEnv = 'test', host = 'localhost', port = '5173'] = process.argv;
const projectRoot = path.resolve(__dirname, '..');
const entryFile = path.join(projectRoot, 'index.html');

const parcelArgs = ['parcel', 'serve', entryFile, '--host', host, '--port', port];

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', parcelArgs, {
  stdio: 'inherit',
  cwd: projectRoot,
  env: {
    ...process.env,
    AIT_AD_ENV: adEnv,
  },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
