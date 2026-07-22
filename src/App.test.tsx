import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Dungeons and Diagrams/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders dark mode toggle', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
  expect(toggle).toBeInTheDocument();
});

test('dark mode toggle switches theme', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: /switch to dark mode/i });

  // Initial state: light mode (matchMedia mock returns matches: false).
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');

  // Click to switch to dark.
  fireEvent.click(toggle);
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

  // Click again to switch back.
  fireEvent.click(toggle);
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});

test('renders new game button', () => {
  render(<App />);
  expect(screen.getByText('🎲 New Game')).toBeInTheDocument();
});
