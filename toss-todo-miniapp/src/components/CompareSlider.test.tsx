import { render } from '@testing-library/react-native';
import React from 'react';
import { CompareSlider } from './CompareSlider';

jest.mock('@toss/tds-react-native', () => {
  const React = require('react');
  const { Text: NativeText } = require('react-native');

  return {
    Text: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <NativeText>{children}</NativeText>,
    colors: {
      grey100: '#f2f4f6',
      white: '#ffffff',
      blue500: '#3182f6',
      greyOpacity700: 'rgba(0,0,0,0.7)',
    },
  };
});

describe('CompareSlider', () => {
  it('renders default labels', () => {
    const screen = render(
      <CompareSlider
        beforeDataUri="ZmFrZQ=="
        beforeMimeType="image/jpeg"
        afterDataUri="ZmFrZQ=="
        afterMimeType="image/jpeg"
      />,
    );

    expect(screen.getByText('첫날')).toBeTruthy();
    expect(screen.getByText('오늘')).toBeTruthy();
  });
});
