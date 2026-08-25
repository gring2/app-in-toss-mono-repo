import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  // This file is copied into .granite during `ait build`, so keep it import-free.
  // These values intentionally mirror brand.config.ts.
  appName: 'friend-lens',
  plugins: [
    appsInToss({
      brand: {
        displayName: '친구렌즈',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/25195/f14c302d-21c2-4cb0-8121-a588edd34f4b.png',
      },
      permissions: [
        {
          name: 'photos',
          access: 'read',
        },
      ],
    }),
  ],
});
