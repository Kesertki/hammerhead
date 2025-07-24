# Testing Setup Documentation

## Overview

The project uses a well-organized testing structure where electron and renderer tests are separated into their respective directories, with full support for co-located tests.

## Test Structure

### Electron Process Tests

- Location: `electron/tests/**/*.test.{ts,tsx}` (centralized) and `electron/**/*.test.{ts,tsx}` (co-located)
- Configuration: `vitest.config.main.ts`
- Environment: Node.js
- Command: `npm run test:main`

### Renderer Process Tests

- Location: `src/**/*.test.{ts,tsx}`
- Configuration: `vitest.config.renderer.ts`
- Environment: happy-dom (browser-like)
- Command: `npm run test:renderer`

## Test Files

### Electron Tests

**Centralized tests:**

- `electron/tests/main.test.ts` - Basic electron process test
- `electron/tests/eventBus.test.ts` - EventBus utility tests

**Co-located tests:**

- `electron/utils/createElectronSideBirpc.test.ts` - Utility function tests
- `electron/settings/logger.test.ts` - Logger functionality tests
- Add more electron tests next to the modules they test

### Component Tests

- `src/App/App.test.tsx` - Main app component tests
- `src/App/components/Layout.test.tsx` - Layout component tests
- Add more component tests following the same pattern

### Setup Files

- `tests/setup.ts` - Global test setup with mocks for Electron APIs
- `tests/globals.d.ts` - TypeScript declarations for test environment

## Available Commands

```bash
# Run all tests
npm test

# Run only main process tests
npm run test:main

# Run only renderer process tests
npm run test:renderer

# Run tests with UI
npm run test:ui
```

## Adding New Tests

1. Create `ComponentName.test.tsx` next to your component file
2. For components that use React Router, wrap them in `<HashRouter>`
3. Use the existing mocks from `tests/setup.ts` for Electron APIs
4. Tests will be automatically discovered by the `src/**/*.test.{ts,tsx}` pattern

## Example Component Test

```tsx
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import YourComponent from './YourComponent';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<HashRouter>{ui}</HashRouter>);
};

describe('YourComponent', () => {
  it('renders correctly', () => {
    renderWithRouter(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```
