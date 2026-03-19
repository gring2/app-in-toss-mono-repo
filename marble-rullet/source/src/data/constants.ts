import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 5000;

export enum Skills {
  None,
  Impact,
}

export const DefaultEntityColor = {
  box: 'cyan',
  circle: 'yellow',
  polyline: 'white',
} as const;

export const DefaultBloomColor = {
  box: 'cyan',
  circle: 'yellow',
  polyline: 'cyan',
};

export const Themes: Record<string, ColorTheme> = {
  light: {
    background: '#f9fafb',
    marbleLightness: 65,
    marbleSaturation: 85,
    marbleLabelFill: '#ffffff',
    marbleLabelStroke: '#111827',
    marbleWinningBorder: '#111827',
    skillColor: '#6b7684',
    coolTimeIndicator: '#8b95a1',
    entity: {
      box: {
        fill: '#ffffff',
        outline: '#7dd3fc', // Soft bright cyan/blue
        bloom: 'transparent',
        bloomRadius: 0,
      },
      circle: {
        fill: '#ffffff',
        outline: '#7dd3fc',
        bloom: 'transparent',
        bloomRadius: 0,
      },
      polyline: {
        fill: 'transparent', // Usually un-filled
        outline: '#7dd3fc', // The plastic rail color
        bloom: 'transparent',
        bloomRadius: 0,
      },
    },
    rankStroke: '#bae6fd',
    minimapBackground: '#ffffff',
    minimapViewport: '#60a5fa',
    winnerBackground: '#ffffff',
    winnerOutline: 'transparent',
    winnerText: '#111827',
  },
  dark: {
    background: '#111827',
    marbleLightness: 60,
    marbleSaturation: 85,
    marbleLabelFill: '#111827',
    marbleLabelStroke: '#ffffff',
    marbleWinningBorder: '#ffffff',
    skillColor: '#9ca3af',
    coolTimeIndicator: '#9ca3af',
    entity: {
      box: {
        fill: '#1f2937',
        outline: '#4b5563',
        bloom: 'transparent',
        bloomRadius: 0,
      },
      circle: {
        fill: '#374151',
        outline: '#6b7280',
        bloom: 'transparent',
        bloomRadius: 0,
      },
      polyline: {
        fill: '#f3f4f6',
        outline: '#9ca3af',
        bloom: 'transparent',
        bloomRadius: 0,
      },
    },
    rankStroke: '#111827',
    minimapBackground: '#1f2937',
    minimapViewport: '#9ca3af',
    winnerBackground: '#1f2937',
    winnerOutline: 'transparent',
    winnerText: '#f9fafb',
  },
};
