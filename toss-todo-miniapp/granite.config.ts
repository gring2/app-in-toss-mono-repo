import { hermes } from '@granite-js/plugin-hermes';
import { router } from '@granite-js/plugin-router';
import { defineConfig } from '@granite-js/react-native/config';
import { appsInToss } from '@apps-in-toss/framework/plugins';

export default defineConfig({
  appName: 'toss-todo-miniapp',
  scheme: 'intoss',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: 'Plant Growth Diary',
        primaryColor: '#16A34A',
        icon: '',
      },
      permissions: [
        {
          name: 'camera',
          access: 'access',
        },
        {
          name: 'photos',
          access: 'read',
        },
        {
          name: 'photos',
          access: 'write',
        },
      ],
    }),
  ],
});
