/*
  Minimal ambient declarations to allow TypeScript compilation in environments
  where devDependencies (like @types/node / @types/express / @types/cors)
  are not installed (e.g., some Vercel builds).

  This file is intentionally small and permissive; it exists to unblock builds.
*/

// Environment / Node globals (minimal)
declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

declare const console: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
};

// CommonJS globals used in src/index.ts local dev guard
// (Vercel runtime won't execute this branch)
declare const require: any;
declare const module: any;

// Module declarations for runtime JS packages when their .d.ts is missing
// (Vercel appears to omit devDependencies in install step)
declare module 'express';
declare module 'cors';
