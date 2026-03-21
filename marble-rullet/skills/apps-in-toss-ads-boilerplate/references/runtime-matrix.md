# Runtime matrix

## Blessed first-class combinations

- `webview/banner`
- `rn/rewarded`
- `rn/interstitial`

## Full matrix folders

The skill still ships the full runtime/type folder matrix so structure stays stable:
- `webview/banner`
- `webview/rewarded`
- `webview/interstitial`
- `rn/banner`
- `rn/rewarded`
- `rn/interstitial`

Use lower-priority combinations only when the product/runtime truly supports them.

## API defaults

- WebView banner: `TossAds.initialize` + `TossAds.attachBanner`
- RN rewarded/interstitial: `loadFullScreenAd` + `showFullScreenAd`
- RN banner: `InlineAd`-style component scaffold
