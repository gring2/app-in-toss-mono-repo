const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const tempOutDir = path.join(projectRoot, '.omx', 'tmp-tests');

let compiledModules = null;

function compileModules() {
  if (compiledModules) {
    return compiledModules;
  }

  fs.rmSync(tempOutDir, { recursive: true, force: true });
  fs.mkdirSync(tempOutDir, { recursive: true });

  const tscCli = require.resolve('typescript/bin/tsc');
  execFileSync(
    process.execPath,
    [
      tscCli,
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--lib',
      'dom,es2020',
      '--moduleResolution',
      'node',
      '--esModuleInterop',
      '--strict',
      '--skipLibCheck',
      '--rootDir',
      'src',
      '--outDir',
      tempOutDir,
      'src/config/ads.ts',
      'src/ui/confirm-dialog.ts',
    ],
    {
      cwd: projectRoot,
      stdio: 'pipe',
    }
  );

  compiledModules = {
    ads: require(path.join(tempOutDir, 'config', 'ads.js')),
    confirmDialog: require(path.join(tempOutDir, 'ui', 'confirm-dialog.js')),
  };

  return compiledModules;
}

function createClassList() {
  const classes = new Set();

  return {
    add: (...tokens) => {
      tokens.forEach((token) => classes.add(token));
    },
    remove: (...tokens) => {
      tokens.forEach((token) => classes.delete(token));
    },
    toggle: (token, force) => {
      if (force === undefined) {
        if (classes.has(token)) {
          classes.delete(token);
          return false;
        }
        classes.add(token);
        return true;
      }

      if (force) {
        classes.add(token);
        return true;
      }

      classes.delete(token);
      return false;
    },
    contains: (token) => classes.has(token),
  };
}

function createFakeElement(name = 'element') {
  const listeners = new Map();
  const attributes = new Map();
  const element = {
    name,
    dataset: {},
    textContent: '',
    classList: createClassList(),
    addEventListener(type, listener) {
      const bucket = listeners.get(type) ?? [];
      bucket.push(listener);
      listeners.set(type, bucket);
    },
    dispatchEvent(event) {
      const bucket = listeners.get(event.type) ?? [];
      bucket.forEach((listener) => listener(event));
    },
    click() {
      element.dispatchEvent({
        type: 'click',
        currentTarget: element,
        target: element,
        preventDefault() {},
      });
    },
    focus() {},
    setAttribute(key, value) {
      attributes.set(key, String(value));
    },
    getAttribute(key) {
      return attributes.get(key) ?? null;
    },
  };

  return element;
}

test('viewport meta disables pinch zoom', () => {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  assert.match(
    html,
    /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*maximum-scale=1[^"']*user-scalable=no/i
  );
});

test('app source removes system dialogs and includes in-app confirm dialog markup', () => {
  const appSource = fs.readFileSync(path.join(projectRoot, 'src', 'app.ts'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  assert.doesNotMatch(appSource, /window\.(alert|confirm|prompt)\s*\(/);
  assert.match(html, /id="confirmDialog"/);
  assert.match(html, /id="confirmDialogConfirmButton"/);
  assert.match(html, /id="confirmDialogCancelButton"/);
});

test('draw screen no longer renders the blocking draw-state card', () => {
  const appSource = fs.readFileSync(path.join(projectRoot, 'src', 'app.ts'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /id="drawStateCard"/);
  assert.doesNotMatch(html, /id="drawHeadline"/);
  assert.doesNotMatch(html, /id="drawSubline"/);
  assert.doesNotMatch(html, /id="drawErrorActions"/);
  assert.doesNotMatch(html, /id="btnRetryDraw"/);
  assert.doesNotMatch(html, /id="btnReturnCompose"/);

  assert.doesNotMatch(appSource, /drawStateCard|drawHeadline|drawSubline|drawErrorActions/);
  assert.doesNotMatch(appSource, /retryDrawButton|returnComposeButton/);
});

test('banner ad env resolves explicit test/live and defaults unresolved env to live', () => {
  const { ads } = compileModules();
  const originalDocument = global.document;
  const originalEnv = process.env.AIT_AD_ENV;

  try {
    global.document = {
      querySelector: () => ({ content: 'test' }),
    };
    process.env.AIT_AD_ENV = '';
    assert.deepEqual(ads.resolveBannerAdGroupConfig(), {
      adEnv: 'test',
      adGroupId: 'ait-ad-test-banner-id',
      source: 'env',
    });

    global.document = {
      querySelector: () => ({ content: 'live' }),
    };
    assert.deepEqual(ads.resolveBannerAdGroupConfig(), {
      adEnv: 'live',
      adGroupId: 'ait.v2.live.56ff85aea080461d',
      source: 'env',
    });

    global.document = {
      querySelector: () => ({ content: '__AIT_AD_ENV__' }),
    };
    delete process.env.AIT_AD_ENV;
    assert.deepEqual(ads.resolveBannerAdGroupConfig(), {
      adEnv: 'live',
      adGroupId: 'ait.v2.live.56ff85aea080461d',
      source: 'default',
    });
  } finally {
    global.document = originalDocument;

    if (originalEnv === undefined) {
      delete process.env.AIT_AD_ENV;
    } else {
      process.env.AIT_AD_ENV = originalEnv;
    }
  }
});

test('confirm dialog controller opens, cancels, confirms, and restores hidden state', () => {
  const { confirmDialog } = compileModules();
  const { createConfirmDialogController } = confirmDialog;
  const originalDocument = global.document;

  const elements = {
    root: createFakeElement('root'),
    title: createFakeElement('title'),
    description: createFakeElement('description'),
    cancelButton: createFakeElement('cancel'),
    confirmButton: createFakeElement('confirm'),
  };

  elements.root.classList.add('is-hidden');
  elements.root.setAttribute('aria-hidden', 'true');

  try {
    global.document = {
      addEventListener() {},
      body: {
        classList: {
          toggle() {},
        },
      },
    };

    const controller = createConfirmDialogController({ elements });
    let cancelCount = 0;
    let confirmCount = 0;

    controller.open({
      title: '추첨을 멈추고 나갈까요?',
      description: '진행 중인 추첨이 종료되고 참여자 편집 화면으로 돌아가요.',
      cancelText: '계속 추첨',
      confirmText: '나가기',
      onCancel: () => {
        cancelCount += 1;
      },
      onConfirm: () => {
        confirmCount += 1;
      },
    });

    assert.equal(elements.root.getAttribute('aria-hidden'), 'false');
    assert.equal(elements.title.textContent, '추첨을 멈추고 나갈까요?');
    assert.equal(elements.description.textContent, '진행 중인 추첨이 종료되고 참여자 편집 화면으로 돌아가요.');
    assert.equal(elements.cancelButton.textContent, '계속 추첨');
    assert.equal(elements.confirmButton.textContent, '나가기');

    elements.cancelButton.click();
    assert.equal(cancelCount, 1);
    assert.equal(elements.root.getAttribute('aria-hidden'), 'true');

    controller.open({
      title: '정말 나갈까요?',
      description: '현재 추첨이 중단돼요.',
      cancelText: '취소',
      confirmText: '확인',
      onConfirm: () => {
        confirmCount += 1;
      },
    });

    elements.confirmButton.click();
    assert.equal(confirmCount, 1);
    assert.equal(elements.root.getAttribute('aria-hidden'), 'true');
  } finally {
    global.document = originalDocument;
  }
});
