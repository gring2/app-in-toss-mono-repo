#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [, , adEnv = 'test', host = 'localhost', portValue = '5173'] = process.argv;
const port = Number.parseInt(portValue, 10) || 5173;
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');

function resolveServeRoot() {
  const nestedWebRoot = path.join(distRoot, 'web');
  if (fs.existsSync(path.join(nestedWebRoot, 'index.html'))) {
    return nestedWebRoot;
  }

  return distRoot;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function runBuild() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      AIT_AD_ENV: adEnv,
    },
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function safeResolve(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname.split('?')[0]);
  const normalizedPath =
    decodedPath === '/' || decodedPath === ''
      ? 'index.html'
      : decodedPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(webRoot, normalizedPath);

  if (!absolutePath.startsWith(webRoot)) {
    return null;
  }

  return absolutePath;
}

runBuild();
const webRoot = resolveServeRoot();

const server = http.createServer((request, response) => {
  const method = request.method ?? 'GET';
  if (!['GET', 'HEAD'].includes(method)) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method Not Allowed');
    return;
  }

  const resolvedPath = safeResolve(request.url ?? '/');
  if (!resolvedPath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  const fallbackIndexPath = path.join(webRoot, 'index.html');
  const finalPath = fs.existsSync(resolvedPath) ? resolvedPath : fallbackIndexPath;

  fs.readFile(finalPath, (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
      return;
    }

    const extension = path.extname(finalPath).toLowerCase();
    const responseBody =
      extension === '.html'
        ? content.toString('utf8').replaceAll('__AIT_AD_ENV__', adEnv)
        : content;

    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });

    if (method === 'HEAD') {
      response.end();
      return;
    }

    response.end(responseBody);
  });
});

server.listen(port, host, () => {
  console.info(`[dev-preview] serving ${webRoot} at http://${host}:${port}/ (AIT_AD_ENV=${adEnv})`);
});
