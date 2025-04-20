// src/global.d.ts

// Augment the global scope
declare global {
  // Declare AbortSignal to resolve conflicts
  interface AbortSignalConstructor {
    new (): AbortSignal;
    prototype: AbortSignal;
    abort(reason?: any): AbortSignal;
    timeout(milliseconds: number): AbortSignal;
    any(signals: AbortSignal[]): AbortSignal;
  }

  var AbortSignal: AbortSignalConstructor;
}

// This file is a module, so we need an export
export {};
