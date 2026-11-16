import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamerbox.app',
  appName: 'GamerBox',
  webDir: 'out',
  // Same color as the native splash and the web boot frame: no flash while the WebView loads.
  backgroundColor: '#050505',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      // Edge-to-edge; real insets are exposed to CSS as --safe-area-inset-*.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
};

export default config;
