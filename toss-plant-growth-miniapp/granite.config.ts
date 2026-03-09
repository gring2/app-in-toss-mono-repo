import { hermes } from '@granite-js/plugin-hermes';
import { router } from '@granite-js/plugin-router';
import { defineConfig } from '@granite-js/react-native/config';
import { appsInToss } from '@apps-in-toss/framework/plugins';

const APP_NAME = 'plant-growth-miniapp';

export default defineConfig({
  appName: APP_NAME,
  scheme: 'intoss',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '오늘의 식물일기',
        primaryColor: '#16A34A',
        icon: "https://static.toss.im/appsintoss/25195/52e9a301-d6b6-4008-b954-feed1f9c4bd0.png",
      },
      permissions: [
        {
          name: 'camera',
          access: 'access',
        },
      ],
    }),
  ],
});
