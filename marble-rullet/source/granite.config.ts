import { defineConfig } from '@apps-in-toss/web-framework/config';

const webHost = process.env.AIT_WEB_HOST ?? 'localhost';
const devServerHost = webHost === 'localhost' ? 'localhost' : '192.168.35.2';
const devAdEnv = process.env.AIT_AD_ENV ?? 'test';

export default defineConfig({
  appName: 'pinball-draw',
  brand: {
    displayName: '핀볼 추첨',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: webHost,
    port: 5173,
    commands: {
      dev: `node scripts/run-dev-preview-server.cjs ${devAdEnv} ${devServerHost} 5173`,
      build: 'parcel build index.html --public-url ./',
    },
  },
  permissions: [
    {
      name: 'clipboard',
      access: 'write',
    },
  ],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
    pullToRefreshEnabled: false,
    bounces: false,
    allowsBackForwardNavigationGestures: false,
    overScrollMode: 'never',
    mediaPlaybackRequiresUserAction: true,
  },
});
