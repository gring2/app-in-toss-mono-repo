export type AppScreen = 'compose' | 'draw' | 'result';

export type BannerAdTrack = (name: string, params?: Record<string, unknown>) => void;

export type BannerAdElements = {
  body: HTMLElement;
  section: HTMLElement;
  slot: HTMLElement;
};

export type BannerAdController = {
  initialize: () => void;
  onScreenChange: (screen: AppScreen) => void;
  destroy: () => void;
};
