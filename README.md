# SMApp Monorepo

This is a monorepo containing a Next.js web app and an Expo React Native app, sharing code between them using Solito.

## Project Structure

- `apps/next-app`: Next.js web application
- `apps/native-app`: Expo React Native application
- `packages/app`: Shared code (screens, components, API, etc.)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:

For web:
```bash
npm run dev
```

For mobile:
```bash
cd apps/native-app
npm run start
```

## Development

- Shared code lives in `packages/app`
- Platform-specific code can be handled using `Platform.OS === 'web'` checks
- Styling is done using NativeWind (Tailwind CSS for React Native)
- Navigation is handled by React Navigation (mobile) and Next.js (web)

## Building

To build all applications:

```bash
npm run build
```

## TypeScript Path Aliases

The following path aliases are available:

- `@app/*`: Points to `packages/app/src/*`
- `@components/*`: Points to `packages/app/src/components/*`
- `@screens/*`: Points to `packages/app/src/screens/*`
- `@api/*`: Points to `packages/app/src/api/*`
- `@hooks/*`: Points to `packages/app/src/hooks/*`
- `@utils/*`: Points to `packages/app/src/utils/*`
