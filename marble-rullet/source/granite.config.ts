import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'pinball-draw',
  brand: {
    displayName: '핀볼 추첨',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 1235,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
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
