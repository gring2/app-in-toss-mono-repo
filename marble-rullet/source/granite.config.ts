import { defineConfig } from "@apps-in-toss/web-framework/config";

const webHost = process.env.AIT_WEB_HOST ?? "localhost";
const devServerHost = webHost === "localhost" ? "localhost" : "192.168.35.2";
const devAdEnv = process.env.AIT_AD_ENV ?? "test";

export default defineConfig({
  appName: "pinball-draw",
  brand: {
    displayName: "핀볼뽑기",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/appsintoss/25195/8f172aa6-8473-4826-a6c5-d3fc26701d73.png",
  },
  web: {
    host: webHost,
    port: 5173,
    commands: {
      dev: `node scripts/run-dev-preview-server.cjs ${devAdEnv} ${devServerHost} 5173`,
      build: "parcel build index.html --public-url ./",
    },
  },
  permissions: [
    {
      name: "clipboard",
      access: "write",
    },
  ],
  outdir: "dist",
  webViewProps: {
    type: "partner",
    pullToRefreshEnabled: false,
    bounces: false,
    allowsBackForwardNavigationGestures: false,
    overScrollMode: "never",
    mediaPlaybackRequiresUserAction: true,
  },
});
